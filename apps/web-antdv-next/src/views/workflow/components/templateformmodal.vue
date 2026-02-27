<script setup lang="ts">
import { computed, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import {
  Button,
  Form,
  FormItem,
  Input,
  message,
  Select,
  Switch,
  TextArea,
  Tree,
} from 'antdv-next';
import type { FormInstance } from 'antdv-next';

import {
  createTemplateApi,
  getAllMenusApi,
  updateTemplateApi,
  type WorkflowApi,
} from '#/api/workflow';
import { useRequestLoading } from '#/composables/useRequestLoading';

interface TemplateFormModalData {
  categories: WorkflowApi.Category[];
  mode: 'add' | 'copy' | 'edit';
  onOk: () => Promise<void>;
  template?: WorkflowApi.TemplateDetail;
}

interface NamespaceTreeNode {
  children?: NamespaceTreeNode[];
  isLeaf: boolean;
  key: number;
  selectable: boolean;
  title: string;
}

const formRef = ref<FormInstance>();
const modalData = ref<null | TemplateFormModalData>(null);
const nodeParseError = ref('');

const { loading: namespaceLoading, run: runNamespaceLoading } = useRequestLoading();
const showNamespaceTree = ref(false);
const menuItems = ref<WorkflowApi.MenuItem[]>([]);
const expandedNamespaceKeys = ref<Array<number | string>>([]);
const selectedNamespaceKeys = ref<Array<number | string>>([]);

const formState = reactive({
  auditServiceName: '',
  billFormNamespace: '',
  categoryId: undefined as number | undefined,
  dataBrowseFilename: '',
  isDefault: false,
  isEnable: true,
  name: '',
  nodeJson: '',
  remark: '',
});

const menuItemMap = computed(() => {
  return new Map(menuItems.value.map((item) => [item.Sysid, item]));
});

const namespaceTreeData = computed<NamespaceTreeNode[]>(() => {
  const items = menuItems.value.slice().sort((a, b) => (a.Seq ?? 0) - (b.Seq ?? 0));

  const buildTree = (parentId: number): NamespaceTreeNode[] => {
    return items
      .filter((item) => item.Parentid === parentId)
      .map((item) => {
        const children = buildTree(item.Sysid);
        return {
          children,
          isLeaf: children.length === 0,
          key: item.Sysid,
          selectable: true,
          title: item.Name,
        };
      });
  };

  return buildTree(0);
});

function getDefaultNode() {
  return {
    ChildNode: null,
    ExamineMode: 3,
    Name: '审批节点',
    NodeUsers: [{ TargetId: null, Type: 3 }],
    Remark: '',
    SelectRange: 4,
    Type: 1,
  };
}

function fillFromTemplate(mode: 'add' | 'copy' | 'edit', template?: WorkflowApi.TemplateDetail) {
  if (!template || mode === 'add') {
    formState.name = '';
    formState.remark = '';
    formState.categoryId = undefined;
    formState.isEnable = true;
    formState.isDefault = false;
    formState.auditServiceName = '';
    formState.billFormNamespace = '';
    formState.dataBrowseFilename = '';
    formState.nodeJson = JSON.stringify(getDefaultNode(), null, 2);
    return;
  }

  formState.name = mode === 'copy' ? `${template.Name}-copy` : template.Name;
  formState.remark = template.Remark ?? '';
  formState.categoryId = template.CategoryId;
  formState.isEnable = template.IsEnable === 1;
  formState.isDefault = template.IsDefault === 1;
  formState.auditServiceName = template.AuditServiceName ?? '';
  formState.billFormNamespace = template.BillFormNamespace ?? '';
  formState.dataBrowseFilename = template.DataBrowseFilename ?? '';
  formState.nodeJson = JSON.stringify(template.Node ?? getDefaultNode(), null, 2);
}

function parseNodeJson() {
  nodeParseError.value = '';
  try {
    const parsed = JSON.parse(formState.nodeJson);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    nodeParseError.value = 'Node JSON 格式不正确';
    return null;
  }
}

function isLeafMenu(sysid: number) {
  return !menuItems.value.some((item) => item.Parentid === sysid);
}

function syncSelectedNamespaceFromForm() {
  const match = menuItems.value.find((item) => item.Code === formState.billFormNamespace);
  if (!match) {
    selectedNamespaceKeys.value = [];
    return;
  }

  selectedNamespaceKeys.value = [match.Sysid];
  expandedNamespaceKeys.value = [match.Sysid];
}

async function ensureMenuData() {
  if (menuItems.value.length > 0) return true;

  return await runNamespaceLoading(async () => {
    const res = await getAllMenusApi();
    if (!res.Success) {
      message.error(res.Message || '加载业务窗体列表失败');
      return false;
    }

    menuItems.value = res.Data ?? [];
    return true;
  });
}

async function openNamespaceTree() {
  const ok = await ensureMenuData();
  if (!ok) return;

  syncSelectedNamespaceFromForm();
  showNamespaceTree.value = true;
}

function closeNamespaceTree() {
  showNamespaceTree.value = false;
}

function confirmNamespaceSelection() {
  if (selectedNamespaceKeys.value.length === 0) {
    message.warning('请先选择一个业务窗体节点');
    return;
  }

  const selectedId = Number(selectedNamespaceKeys.value[0]);
  if (!isLeafMenu(selectedId)) {
    message.warning('请选择末级节点');
    return;
  }

  const selected = menuItemMap.value.get(selectedId);
  if (!selected) {
    message.warning('未找到选中的业务窗体节点');
    return;
  }

  formState.billFormNamespace = selected.Code;
  showNamespaceTree.value = false;
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }

    const node = parseNodeJson();
    if (!node) return;
    if (!modalData.value) return;

    const payload: WorkflowApi.SaveTemplatePayload = {
      AuditServiceName: formState.auditServiceName.trim(),
      BillFormNamespace: formState.billFormNamespace.trim(),
      CategoryId: Number(formState.categoryId),
      DataBrowseFilename: formState.dataBrowseFilename.trim(),
      IsDefault: formState.isDefault ? 1 : 0,
      IsEnable: formState.isEnable ? 1 : 0,
      Name: formState.name.trim(),
      Node: node,
      Remark: formState.remark.trim(),
    };

    modalApi.lock();
    try {
      if (modalData.value.mode === 'edit') {
        const sysid = modalData.value.template?.Sysid;
        if (!sysid) return;

        const res = await updateTemplateApi({ ...payload, Sysid: sysid });
        if (!res.Success) {
          message.error(res.Message || '更新模板失败');
          return;
        }
        message.success('模板更新成功');
      } else {
        const res = await createTemplateApi(payload);
        if (!res.Success) {
          message.error(res.Message || '创建模板失败');
          return;
        }
        message.success('模板创建成功');
      }

      await modalData.value.onOk();
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<TemplateFormModalData>();
      if (!data) return;

      modalData.value = data;
      nodeParseError.value = '';
      fillFromTemplate(data.mode, data.template);
      return;
    }

    modalData.value = null;
    nodeParseError.value = '';
    showNamespaceTree.value = false;
    selectedNamespaceKeys.value = [];
    expandedNamespaceKeys.value = [];
  },
});
</script>

<template>
  <Modal :title="modalData?.mode === 'edit' ? '编辑模板' : '新建模板'" class="w-[960px]">
    <Form ref="formRef" :model="formState" layout="vertical" :validate-trigger="[]">
      <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <FormItem
          label="模板名称"
          name="name"
          :rules="[{ required: true, message: '请输入模板名称' }]"
        >
          <Input v-model:value="formState.name" :maxlength="120" />
        </FormItem>

        <FormItem
          label="流程分类"
          name="categoryId"
          :rules="[{ required: true, message: '请选择流程分类' }]"
        >
          <Select
            v-model:value="formState.categoryId"
            :options="
              (modalData?.categories ?? []).map((item) => ({
                label: item.Name,
                value: item.Sysid,
              }))
            "
            show-search
          />
        </FormItem>

        <FormItem label="业务窗体命名空间" name="billFormNamespace" class="lg:col-span-2">
          <div class="flex flex-col gap-2">
            <div class="flex gap-2">
              <Input
                v-model:value="formState.billFormNamespace"
                placeholder="请输入或选择业务窗体命名空间"
              />
              <Button :loading="namespaceLoading" @click="openNamespaceTree">选择</Button>
              <Button v-if="formState.billFormNamespace" @click="formState.billFormNamespace = ''">
                清空
              </Button>
            </div>

            <div
              v-if="showNamespaceTree"
              class="max-h-[260px] overflow-y-auto rounded border border-border p-2"
            >
              <Tree
                v-model:expanded-keys="expandedNamespaceKeys"
                v-model:selected-keys="selectedNamespaceKeys"
                :tree-data="namespaceTreeData as any"
                block-node
                show-line
              />
              <div class="mt-2 flex justify-end gap-2">
                <Button size="small" @click="closeNamespaceTree">取消</Button>
                <Button size="small" type="primary" @click="confirmNamespaceSelection">确定</Button>
              </div>
            </div>
          </div>
        </FormItem>

        <FormItem label="审计服务名称" name="auditServiceName">
          <Input v-model:value="formState.auditServiceName" />
        </FormItem>

        <FormItem label="数据展示文件名" name="dataBrowseFilename">
          <Input v-model:value="formState.dataBrowseFilename" />
        </FormItem>

        <FormItem label="备注" name="remark" class="lg:col-span-2">
          <Input v-model:value="formState.remark" />
        </FormItem>
      </div>

      <div class="mb-3 flex gap-5">
        <FormItem label="启用状态" name="isEnable" class="mb-0">
          <Switch
            v-model:checked="formState.isEnable"
            checked-children="启用"
            un-checked-children="禁用"
          />
        </FormItem>

        <FormItem label="默认模板" name="isDefault" class="mb-0">
          <Switch
            v-model:checked="formState.isDefault"
            checked-children="是"
            un-checked-children="否"
          />
        </FormItem>
      </div>

      <FormItem
        label="流程节点定义 (Node JSON)"
        name="nodeJson"
        :rules="[{ required: true, message: '请输入节点 JSON' }]"
      >
        <TextArea
          v-model:value="formState.nodeJson"
          :rows="14"
          placeholder="请输入流程节点 JSON"
          @blur="parseNodeJson"
        />
        <div v-if="nodeParseError" class="mt-1 text-xs text-destructive">{{ nodeParseError }}</div>
      </FormItem>
    </Form>
  </Modal>
</template>
