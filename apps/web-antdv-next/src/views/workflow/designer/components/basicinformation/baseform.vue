<template>
  <div class="p-2">
    <Form ref="formRef" :model="props.formState" name="basic" :label-col="{ span: 8 }" :wrapper-col="{ span: 8 }"
      class="mt-5" autocomplete="off" :validate-trigger="[]">
      <FormItem label="流程分类" name="type" :rules="[{ required: true, message: '请选择流程分类' }]">
        <Select v-model:value="props.formState.type" show-search
          :options="props.category.map((i) => ({ label: i.Name, value: i.Sysid }))" :filter-option="filterOption"
          placeholder="请选择流程分类" />
      </FormItem>

      <FormItem label="流程名称" name="name" :rules="[{ required: true, message: '请输入流程名称' }]">
        <Input v-model:value="props.formState.name" />
      </FormItem>

      <FormItem label="是否启用" name="enable" :rules="[{ required: true }]">
        <Switch v-model:checked="props.formState.enable" />
      </FormItem>

      <FormItem label="是否默认" name="isDefault" :rules="[{ required: true }]">
        <Switch v-model:checked="props.formState.isDefault" />
      </FormItem>

      <FormItem label="审计服务名称" name="auditServiceName">
        <TextArea v-model:value="props.formState.auditServiceName" :rows="4" />
      </FormItem>

      <FormItem label="业务窗体命名空间" name="billFormNamespace"
        :rules="[{ required: props.formState.enable, message: '请选择业务窗体命名空间' }]">
        <Button class="mb-1.5" @click="openNamespacePanel">选择业务窗体命名空间</Button>
        <TextArea v-model:value="props.formState.billFormNamespace" :rows="4" />
      </FormItem>

      <FormItem label="数据展示文件名" name="dataBrowseFilename">
        <TextArea v-model:value="props.formState.dataBrowseFilename" :rows="4" />
      </FormItem>

      <FormItem label="备注" name="remark">
        <TextArea v-model:value="props.formState.remark" :rows="4" />
      </FormItem>
    </Form>

    <NamespaceModal title="选择业务窗体命名空间" class="w-[500px]">
      <Spin :spinning="loading">
        <div class="max-h-[520px] overflow-auto rounded border border-border p-2">
          <Tree v-model:expanded-keys="expandedKeys" v-model:selected-keys="selectedKeys" :tree-data="treeData"
            block-node show-line @select="onTreeSelect" />
        </div>
      </Spin>
    </NamespaceModal>
  </div>
</template>

<script lang="ts" setup>
import { onBeforeMount, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { Button, Form, FormItem, Input, Select, Spin, Switch, TextArea, Tree } from 'antdv-next';
import type { FormInstance } from 'antdv-next';

import { useRequestLoading } from '#/composables/useRequestLoading';
import useServiceStore from '#/store/workflow/service';
import type { Category, FormState, MenuItem, Response } from '#/views/workflow/designer/types';
import { notifyError } from '#/views/workflow/designer/utils';

interface TreeNode {
  children?: TreeNode[];
  isLeaf: boolean;
  key: string;
  selectable: boolean;
  title: string;
}

type MenuItemCompat = MenuItem & {
  ParentId?: number;
};

const expandedKeys = ref<string[]>([]);
const selectedKeys = ref<string[]>([]);
const pendingNamespace = ref<string>('');
const { loading, run: runWithLoading } = useRequestLoading();
let menuItems: MenuItemCompat[] = [];
const treeData = ref<TreeNode[]>([]);
const service = useServiceStore();

const formRef = ref<FormInstance>();
const props = defineProps<{
  category: Category[];
  formState: FormState;
}>();

function onTreeSelect(keys: Array<string | number>) {
  if (keys.length === 0) return;
  const targetId = String(keys[0]);
  selectedKeys.value = [targetId];
  const match = menuItems.find((item) => String(item.Sysid) === targetId);
  if (match) {
    pendingNamespace.value = match.Code;
  }
}

function setSelectedKeys() {
  selectedKeys.value = menuItems
    .filter((item) => item.Code === props.formState.billFormNamespace)
    .map((item) => String(item.Sysid));
  expandedKeys.value = [...selectedKeys.value];
}

async function openNamespacePanel() {
  const loaded = await ensureMenuData();
  if (!loaded) return;
  setSelectedKeys();
  pendingNamespace.value = props.formState.billFormNamespace ?? '';
  namespaceModalApi.open();
}

function confirmNamespaceSelection() {
  if (!pendingNamespace.value) {
    notifyError('请选择业务窗体命名空间');
    return;
  }
  props.formState.billFormNamespace = pendingNamespace.value;
  namespaceModalApi.close();
}

function normalizeMenuItems(data: MenuItem[]): MenuItemCompat[] {
  return data.map((item) => {
    const parentId = item.Parentid ?? (item as MenuItemCompat).ParentId ?? 0;
    return {
      ...item,
      Parentid: parentId,
    };
  });
}

function buildTree(items: MenuItemCompat[], parentId: number): TreeNode[] {
  return items
    .filter((item) => item.Parentid === parentId)
    .map((item) => {
      const children = buildTree(items, item.Sysid);
      return {
        children,
        isLeaf: children.length === 0,
        key: String(item.Sysid),
        selectable: children.length === 0,
        title: item.Name,
      };
    });
}

async function ensureMenuData() {
  if (menuItems.length > 0) return true;

  return await runWithLoading(async () => {
    const res: Response<MenuItem[]> = await service.getAllmenus();
    if (!res.Success) {
      notifyError(res.Message);
      return false;
    }

    menuItems = normalizeMenuItems(res.Data ?? []);
    treeData.value = buildTree(menuItems, 0);
    return true;
  });
}

onBeforeMount(async () => {
  await ensureMenuData();
  setSelectedKeys();
});

const filterOption = (input: string, option: any) => {
  return String(option?.label ?? '')
    .toLowerCase()
    .includes(input.toLowerCase());
};

const onCheck = async () => {
  try {
    await formRef.value?.validate();
  } catch (errorInfo) {
    return errorInfo;
  }
};

const [NamespaceModal, namespaceModalApi] = useVbenModal({
  onConfirm() {
    confirmNamespaceSelection();
  },
});

defineExpose({
  onCheck,
});
</script>
