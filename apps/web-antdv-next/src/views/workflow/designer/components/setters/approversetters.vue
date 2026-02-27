<template>
  <div>
    <Form layout="vertical" :model="approverData" name="approver-form" autocomplete="off">
      <FormItem label="指定方式" name="selectRange">
        <RadioGroup v-model:value="approverData.selectRange" @change="onSelectRangeChange">
          <Radio :value="2">{{ getSelectRangeName(2) }}</Radio>
          <Radio :value="3">{{ getSelectRangeName(3) }}</Radio>
          <Radio :value="4">{{ getSelectRangeName(4) }}</Radio>
          <Radio :value="5">{{ getSelectRangeName(5) }}</Radio>
          <Radio :value="6">{{ getSelectRangeName(6) }}</Radio>
        </RadioGroup>
      </FormItem>

      <FormItem v-if="shouldSelectMembers" label="成员选择">
        <Card hoverable>
          <template #cover>
            <div class="flex items-center gap-1">
              <Button type="text" :disabled="memberButtonDisabled" @click="openMemberSelector">
                <template #icon>
                  <IconifyIcon icon="lucide:users-round" />
                </template>
                选择成员
              </Button>
              <Button type="text" danger @click="clearSelection">清空</Button>
            </div>
          </template>

          <div class="min-h-[44px] rounded border border-border p-2">
            <div v-if="nodeContent.length === 0" class="text-xs text-muted-foreground">未选择成员</div>
            <Tag v-for="item in nodeContent" v-else :key="item.sysid" color="processing" closable
              @close="onTagClose(item.sysid)">
              {{ item.name }}
            </Tag>
          </div>
        </Card>
      </FormItem>

      <FormItem label="多人审批方式" name="methodValue">
        <RadioGroup v-model:value="approverData.methodValue">
          <Radio :value="2">{{ getExamineModeEnum(2) }}</Radio>
          <Radio :value="3">{{ getExamineModeEnum(3) }}</Radio>
        </RadioGroup>
      </FormItem>

      <FormItem label="其他设置" name="autoPass">
        <Checkbox v-model:checked="approverData.autoPass">
          若审批人已在前置节点审批，或与发起人为同一人，则自动通过
        </Checkbox>
      </FormItem>

      <FormItem label="" name="emailNotify">
        <Checkbox v-model:checked="approverData.emailNotify">是否邮件通知</Checkbox>
      </FormItem>

      <FormItem v-if="approverData.emailNotify">
        <div class="flex gap-2">
          <Button type="default" :loading="loadingTemplateFields" @click="openTemplateFieldSelector">
            选择字段
          </Button>
          <Button type="default" @click="addLineBreak">换行</Button>
        </div>
      </FormItem>

      <FormItem v-if="approverData.emailNotify" label="邮件标题" name="emailTitle">
        <TextArea
          v-model:value="approverData.emailTitle"
          allow-clear
          auto-size
          @focus="onEmailTitleFocus"
        />
      </FormItem>

      <FormItem v-if="approverData.emailNotify" label="邮件内容" name="emailContent">
        <TextArea
          v-model:value="approverData.emailContent"
          allow-clear
          @focus="onEmailContentFocus"
        />
      </FormItem>

      <FormItem label="备注" name="remark">
        <TextArea v-model:value="approverData.remark" :rows="4" />
      </FormItem>
    </Form>

    <MemberSelectModal />
    <TemplateFieldModal />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import {
  Button,
  Card,
  Checkbox,
  Form,
  FormItem,
  Radio,
  RadioGroup,
  Tag,
  TextArea,
} from 'antdv-next';

import useFormStore from '#/store/workflow/form';
import useNodeStore from '#/store/workflow/node';
import useServiceStore from '#/store/workflow/service';
import { useRequestLoading } from '#/composables/useRequestLoading';
import {
  ExamineModeEnum,
  NodeTypeEnum,
  SelectRangeEnum,
} from '#/views/workflow/designer/interfaces';
import type { NodeUsersDetail, TemplateField } from '#/views/workflow/designer/types';
import {
  getExamineModeEnum,
  getSelectRangeName,
  notifyError,
} from '#/views/workflow/designer/utils';

import MemberSelectModalComp from './memberselectmodal.vue';
import TemplateFieldModalComp from './templatefieldmodal.vue';

interface TreeNode {
  children?: TreeNode[];
  isLeaf?: boolean;
  key: string;
  selectable?: boolean;
  title: string;
}

const nodeStore = useNodeStore();
const formStore = useFormStore();
const serviceStore = useServiceStore();

const selectNodeId = computed(() => nodeStore.selectedNode);
const selectNode = computed(() =>
  selectNodeId.value ? nodeStore.getNode(selectNodeId.value) : undefined,
);
const materialUi = computed(() =>
  selectNode.value ? nodeStore.materialUis[selectNode.value.nodeType] : undefined,
);

const approverData = ref({
  autoPass: false,
  emailContent: '',
  emailNotify: false,
  emailTitle: '',
  methodValue: ExamineModeEnum.sign,
  remark: '',
  selectRange: SelectRangeEnum.user,
});

const checkedKeys = ref<string[]>([]);
const nodeContent = ref<Array<{ name: string; sysid: string }>>([]);
const treeData = ref<TreeNode[]>([]);
const currentFocusField = ref<null | 'emailContent' | 'emailTitle'>(null);
const { loading: loadingTemplateFields, run: runTemplateFieldsLoading } = useRequestLoading();
const shouldSelectMembers = computed(() =>
  [SelectRangeEnum.user, SelectRangeEnum.role].includes(approverData.value.selectRange),
);
const memberButtonDisabled = computed(() => {
  if (approverData.value.selectRange === SelectRangeEnum.user) {
    return formStore.users.length === 0;
  }
  if (approverData.value.selectRange === SelectRangeEnum.role) {
    return treeData.value.length === 0;
  }
  return true;
});

const roleRootIds = computed(() =>
  formStore.roles.filter((item) => item.ParentId === 0),
);

const [MemberSelectModal, memberSelectModalApi] = useVbenModal({
  connectedComponent: MemberSelectModalComp,
});
const [TemplateFieldModal, templateFieldModalApi] = useVbenModal({
  connectedComponent: TemplateFieldModalComp,
});

onBeforeMount(() => {
  const node = selectNode.value;
  const ui = materialUi.value;
  if (!node || !ui) return;

  approverData.value.selectRange = node.selectRange ?? SelectRangeEnum.user;
  approverData.value.methodValue = node.examineMode ?? ExamineModeEnum.sign;
  approverData.value.autoPass = node.autoPass === 1;
  approverData.value.emailNotify = node.isEmail === 1;
  approverData.value.emailTitle = node.emailSubject ?? '';
  approverData.value.emailContent = node.emailBody ?? '';
  approverData.value.remark = node.remark ?? '';

  onSelectRangeChange(true);

  if (
    node.nodeUsers &&
    [SelectRangeEnum.user, SelectRangeEnum.role].includes(
      approverData.value.selectRange,
    )
  ) {
    checkedKeys.value = node.nodeUsers.map((item) => String(item.targetId));
    checkedKeys.value = normalizeCheckedKeys(checkedKeys.value);
    nodeContent.value = getNodeContent();
  }

  ui.handleConfirm = () => {
    if (
      [
        SelectRangeEnum.starter,
        SelectRangeEnum.supervisor,
        SelectRangeEnum.originator,
      ].includes(approverData.value.selectRange)
    ) {
      node.nodeContent = getSelectRangeName(approverData.value.selectRange);
      node.nodeUsers = [
        {
          targetId: null as unknown as number,
          type: approverData.value.selectRange,
        },
      ];
    } else {
      node.nodeContent = nodeContent.value.map((item) => item.name).join(',');
      node.nodeUsers = checkedKeys.value.map((item) => ({
        targetId: Number(item),
        type: approverData.value.selectRange,
      }));
    }

    node.selectRange = approverData.value.selectRange;
    node.examineMode = approverData.value.methodValue;
    node.type = NodeTypeEnum.approver;
    node.autoPass = approverData.value.autoPass ? 1 : 0;
    node.isEmail = approverData.value.emailNotify ? 1 : 0;
    node.emailSubject = approverData.value.emailTitle;
    node.emailBody = approverData.value.emailContent;
    node.remark = approverData.value.remark;
    nodeStore.selectedNode = undefined;
  };
});

function normalizeCheckedKeys(keys: string[]) {
  return keys.filter(
    (item) => !roleRootIds.value.some((role) => String(role.Sysid) === item),
  );
}

function openMemberSelector() {
  const isRoleMode = approverData.value.selectRange === SelectRangeEnum.role;
  const title =
    isRoleMode
      ? '选择审批角色'
      : '选择审批成员';

  memberSelectModalApi
    .setData({
      checkedKeys: checkedKeys.value,
      mode: isRoleMode ? 'role' : 'user',
      onOk: (keys: string[]) => {
        checkedKeys.value = isRoleMode ? normalizeCheckedKeys(keys) : keys;
        nodeContent.value = getNodeContent();
      },
      title,
      treeData: treeData.value,
      users: formStore.users as any,
    })
    .open();
}

async function openTemplateFieldSelector() {
  const namespace = formStore.form.billFormNamespace?.trim();
  if (!namespace) {
    notifyError('业务窗体命名空间为空，无法获取字段信息');
    return;
  }

  await runTemplateFieldsLoading(
    async () => {
      const res = await serviceStore.getTemplateField(namespace);
      if (!res.Success) {
        notifyError(res.Message || '获取模板字段失败');
        return;
      }

      templateFieldModalApi
        .setData({
          fields: res.Data ?? [],
          onOk: (fields: TemplateField[]) => {
            insertTemplateFields(fields);
          },
          title: '选择字段生成模板',
        })
        .open();
    },
    {
      onError: () => notifyError('获取模板字段失败'),
      rethrow: false,
    },
  );
}

function insertTemplateFields(fields: TemplateField[]) {
  if (fields.length === 0) {
    notifyError('请至少选择一个字段');
    return;
  }

  const placeholders = fields
    .map((field) => `${field.FieldLabel}:{${field.DbFieldName}}\t`)
    .join('');

  const targetField = currentFocusField.value ?? 'emailTitle';
  if (targetField === 'emailTitle') {
    approverData.value.emailTitle += placeholders;
  } else {
    approverData.value.emailContent += placeholders;
  }
}

function onEmailTitleFocus() {
  currentFocusField.value = 'emailTitle';
}

function onEmailContentFocus() {
  currentFocusField.value = 'emailContent';
}

function addLineBreak() {
  approverData.value.emailContent += '<br>';
}

function getRoleData(data: NodeUsersDetail[]) {
  const buildTree = (items: NodeUsersDetail[], parentId: number): TreeNode[] => {
    return items
      .filter((item) => item.ParentId === parentId)
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
  };

  return roleRootIds.value
    .map((id) => {
      const children = buildTree(data, id.Sysid);
      return {
        children,
        isLeaf: children.length === 0,
        key: String(id.Sysid),
        selectable: false,
        title: id.Name,
      };
    })
    .filter((item) => item.children.length > 0);
}

function getNodeContent() {
  const result: Array<{ name: string; sysid: string }> = [];
  const source =
    approverData.value.selectRange === SelectRangeEnum.role
      ? formStore.roles
      : formStore.users;

  const byId = new Map(
    source.map((item) => [String(item.Sysid), { name: item.Name, sysid: String(item.Sysid) }]),
  );

  for (const key of checkedKeys.value) {
    const matched = byId.get(key);
    if (matched) {
      result.push(matched);
    }
  }

  return result;
}

function onTagClose(sysid: string) {
  nodeContent.value = nodeContent.value.filter((item) => item.sysid !== sysid);
  checkedKeys.value = checkedKeys.value.filter((item) => item !== sysid);
}

function clearSelection() {
  nodeContent.value = [];
  checkedKeys.value = [];
}

function onSelectRangeChange(eventOrFlag?: unknown) {
  const isInitialization = eventOrFlag === true;
  if (!isInitialization) {
    clearSelection();
  }

  if (approverData.value.selectRange === SelectRangeEnum.role) {
    treeData.value = getRoleData(formStore.roles);
    return;
  }

  if (approverData.value.selectRange === SelectRangeEnum.user) {
    treeData.value = formStore.users.map((item) => ({
      isLeaf: true,
      key: String(item.Sysid),
      selectable: true,
      title: item.Name,
    }));
    return;
  }

  treeData.value = [];
}
</script>
