<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import {
  Button,
  Card,
  CheckboxGroup,
  DatePicker,
  Empty,
  Form,
  FormItem,
  Input,
  InputNumber,
  RadioGroup,
  Select,
  Steps,
  TextArea,
  message,
} from 'antdv-next';

import {
  editOcapInstanceApi,
  getOcapInstanceDetailApi,
  getOcapNodeDetailApi,
  jumpLastOcapInstanceNodeApi,
  jumpOcapInstanceNodeByIdApi,
  type OcapApi,
} from '#/api/ocap';
import { useRequestLoading } from '#/composables/useRequestLoading';

const route = useRoute();
const router = useRouter();
const { loading, run: runWithLoading } = useRequestLoading();
const { loading: actionLoading, run: runWithActionLoading } = useRequestLoading();

const detail = ref<null | OcapApi.OcapInstanceDetail>(null);
const formRef = ref<any>();
const formModel = ref<Record<string, any>>({});
const defaultModel = ref<Record<string, any>>({});
const currentStep = ref(0);
const currentProcessingStep = ref(0);
const currentNodeDetail = ref<null | OcapApi.OcapNodeDetail>(null);
const selectedNodeUserIds = ref<number[]>([]);

const sortedNodes = computed(() =>
  [...(detail.value?.OcapInstanceNodeVs ?? [])].sort((a, b) => a.Seq - b.Seq),
);

const groupedNodes = computed(() => {
  const values = [...(detail.value?.OcapInstanceNodeValueVs ?? [])].sort((a, b) => a.Seq - b.Seq);
  return sortedNodes.value.map((node) => ({
    node,
    fields: values.filter((field) => field.NodeId === node.NodeId),
  }));
});

function isNodeFinished(node: OcapApi.OcapInstanceNode) {
  return node.Finish === true;
}

const stepItems = computed(() =>
  groupedNodes.value.map((group, index) => ({
    title: `${group.node.Seq}. ${group.node.NodeName || '未命名节点'}`,
    content: `${group.node.NodeCode || '-'} | ${index > currentProcessingStep.value ? '待完成' : isNodeFinished(group.node) ? '已完成' : '进行中'}`,
    disabled: index > currentProcessingStep.value,
  })),
);

const currentGroup = computed(() => groupedNodes.value[currentStep.value]);
const currentProcessingGroup = computed(() => groupedNodes.value[currentProcessingStep.value]);
const hasProcessingNode = computed(() => detail.value?.OcapInstanceV?.Finish !== true);
const rejectNodeId = ref<null | number>(null);
const rejectReason = ref('');
const jumpLastReason = ref('');

const previousNodeOptions = computed(() =>
  groupedNodes.value
    .slice(0, Math.max(0, currentProcessingStep.value))
    .map((group) => ({
      label: `${group.node.Seq}. ${group.node.NodeName || '未命名节点'}`,
      value: group.node.NodeId,
    })),
);

const currentNodeUserOptions = computed(() =>
  (currentNodeDetail.value?.NodeUserList ?? []).map((item) => ({
    label: `${item.UserName}（${item.UserCode}）`,
    value: item.UserId,
  })),
);

const processedNodeUsers = computed(() => {
  const group = currentGroup.value;
  if (!group || isEditingCurrentNode.value) return [];

  return (detail.value?.OcapInstanceNodeUserVs ?? [])
    .filter((item) => item.NodeId === group.node.NodeId)
    .map((item) => ({
      label: `${item.UserName}（${item.UserCode}）`,
      value: item.UserId,
    }));
});

const isEditingCurrentNode = computed(
  () => hasProcessingNode.value && currentStep.value === currentProcessingStep.value,
);

const [JumpLastModal, jumpLastModalApi] = useVbenModal({
  onCancel() {
    jumpLastModalApi.close();
  },
  async onConfirm() {
    if (!jumpLastReason.value.trim()) {
      return void message.warning('请填写驳回理由');
    }

    await jumpToLastStep();
    jumpLastModalApi.close();
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      jumpLastReason.value = '';
    }
  },
});

const [RejectNodeModal, rejectNodeModalApi] = useVbenModal({
  onCancel() {
    rejectNodeModalApi.close();
  },
  async onConfirm() {
    const nodeId = rejectNodeId.value;
    if (!nodeId) return void message.warning('请选择驳回节点');
    if (!rejectReason.value.trim()) return void message.warning('请填写驳回理由');

    await jumpToNode(nodeId);
    rejectNodeModalApi.close();
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      rejectNodeId.value = previousNodeOptions.value[0]?.value ?? null;
      rejectReason.value = '';
      return;
    }
    rejectNodeId.value = null;
    rejectReason.value = '';
  },
});

function fieldKey(field: OcapApi.OcapInstanceNodeValue) {
  return `field_${field.Sysid}`;
}

function getRadioOptions(field: OcapApi.OcapInstanceNodeValue) {
  return (field.ControlItem ?? '')
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => ({ label: item, value: item }));
}

function parseFieldValue(field: OcapApi.OcapInstanceNodeValue, raw: any) {
  if (field.ControlType === 'RadioGroup') {
    return raw == null || raw === '' ? undefined : String(raw);
  }
  if (field.ControlType === 'NumberEdit') {
    return raw == null || raw === '' ? undefined : Number(raw);
  }
  return raw == null ? undefined : raw;
}

function getInitialFieldValue(field: OcapApi.OcapInstanceNodeValue) {
  return parseFieldValue(field, field.FieldValue ?? field.Default);
}

function getDefaultFieldValue(field: OcapApi.OcapInstanceNodeValue) {
  return parseFieldValue(field, field.Default);
}

function getValidateRules(field: OcapApi.OcapInstanceNodeValue) {
  const requiredRule = {
    required: true,
    trigger: ['blur', 'change'],
    validator: (_rule: any, value: any) => {
      if (value === null || value === undefined) return Promise.reject('必填项不能为空');
      if (typeof value === 'string' && value.trim() === '') return Promise.reject('必填项不能为空');
      return Promise.resolve();
    },
  };

  if (!field.ValidateRules) return [requiredRule];

  try {
    const regex = new RegExp(field.ValidateRules);
    const regexRule = {
      trigger: ['blur', 'change'],
      validator: (_rule: any, value: any) => {
        if (value === null || value === undefined) return Promise.resolve();
        if (typeof value === 'string' && value.trim() === '') return Promise.resolve();
        return regex.test(String(value)) ? Promise.resolve() : Promise.reject('格式不正确');
      },
    };

    return [requiredRule, regexRule];
  } catch {
    return [requiredRule];
  }
}

function resolveOcapId() {
  const raw = Array.isArray(route.params.ocapId) ? route.params.ocapId[0] : route.params.ocapId;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function resetToDefault() {
  formModel.value = { ...defaultModel.value };
  selectedNodeUserIds.value = [];
}

function handleStepChange(idx: number) {
  if (idx > currentProcessingStep.value) return;
  currentStep.value = idx;
}

function isEditingCurrentProcessingNode() {
  if (!hasProcessingNode.value) return false;
  return currentStep.value === currentProcessingStep.value;
}

function isFieldDisabled(field: OcapApi.OcapInstanceNodeValue) {
  return field.ReadOnly === 1 || !isEditingCurrentProcessingNode();
}

function normalizeFieldValue(value: unknown) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function isLastNode(node: OcapApi.OcapInstanceNode | undefined) {
  if (!node) return false;
  return groupedNodes.value[groupedNodes.value.length - 1]?.node.NodeId === node.NodeId;
}

function buildJumpPayload(nodeId: number): null | OcapApi.OcapInstanceJumpPayload {
  const instance = detail.value?.OcapInstanceV;
  const processingGroup = currentProcessingGroup.value;
  if (!instance || !processingGroup) return null;

  return {
    InstanceId: instance.Sysid,
    ProcessId: processingGroup.node.ProcessId,
    NodeId: nodeId,
  };
}

async function loadCurrentNodeDetail() {
  const group = currentGroup.value;
  if (!group) {
    currentNodeDetail.value = null;
    selectedNodeUserIds.value = [];
    return;
  }

  const res = await getOcapNodeDetailApi(group.node.NodeId);
  if (!res.Success) {
    currentNodeDetail.value = null;
    selectedNodeUserIds.value = [];
    return void message.error(res.Message || '加载当前节点信息失败');
  }

  currentNodeDetail.value = res.Data ?? null;
  selectedNodeUserIds.value = [];
}

async function jumpToNode(nodeId: number) {
  const payload = buildJumpPayload(nodeId);
  if (!payload) return;

  await runWithActionLoading(async () => {
    const res = await jumpOcapInstanceNodeByIdApi(payload);
    if (!res.Success) return void message.error(res.Message || '驳回失败');
    message.success('驳回成功');
    await loadData();
  }, { rethrow: false });
}

async function jumpToLastStep() {
  const processingGroup = currentProcessingGroup.value;
  if (!processingGroup) return;

  const payload = buildJumpPayload(processingGroup.node.NodeId);
  if (!payload) return;

  await runWithActionLoading(async () => {
    const res = await jumpLastOcapInstanceNodeApi(payload);
    if (!res.Success) return void message.error(res.Message || '退回失败');
    message.success('退回成功');
    await loadData();
  }, { rethrow: false });
}

function openJumpLastModal() {
  if (currentProcessingStep.value <= 0) {
    return void message.warning('当前已是首节点，无法退回');
  }
  jumpLastModalApi.open();
}

function openRejectNodeModal() {
  if (!previousNodeOptions.value.length) {
    return void message.warning('当前无可驳回的历史节点');
  }
  rejectNodeModalApi.open();
}

async function submitForm() {
  const group = currentGroup.value;
  const instance = detail.value?.OcapInstanceV;
  if (!group || !instance) return;

  const isCurrentProcessingNode = currentStep.value === currentProcessingStep.value;
  if (!isCurrentProcessingNode) {
    return void message.warning('仅可提交当前进行中的节点');
  }

  if (!selectedNodeUserIds.value.length) {
    return void message.warning('请选择当前节点处理人');
  }

  const shouldGoReport = isLastNode(group.node);

  await runWithActionLoading(async () => {
    await formRef.value?.validate?.();

    const payload: OcapApi.OcapInstanceEditPayload = {
      InstanceId: instance.Sysid,
      ProcessId: group.node.ProcessId,
      NodeId: group.node.NodeId,
      NodeUsers: selectedNodeUserIds.value.map((userId) => ({
        NodeId: group.node.NodeId,
        UserId: userId,
      })),
      NodeValues: group.fields.map((field) => ({
        FieldId: field.FieldId,
        FieldValue: normalizeFieldValue(formModel.value[fieldKey(field)]),
      })),
    };

    const res = await editOcapInstanceApi(payload);
    if (!res.Success) return void message.error(res.Message || '提交失败');

    message.success('提交成功');

    if (shouldGoReport) {
      await router.push(`/ocap/report/${instance.Sysid}`);
      return;
    }

    await loadData();
  }, { rethrow: false });
}

async function loadData() {
  const id = resolveOcapId();
  if (!id) return void message.error('路由参数 ocapId 无效');

  await runWithLoading(async () => {
    const res = await getOcapInstanceDetailApi(id);
    if (!res.Success) return void message.error(res.Message || '加载异常详情失败');
    detail.value = res.Data ?? null;

    if (detail.value?.OcapInstanceV?.Finish === true) {
      await router.replace(`/ocap/report/${id}`);
      return;
    }

    const values: Record<string, any> = {};
    const defaults: Record<string, any> = {};
    (detail.value?.OcapInstanceNodeValueVs ?? []).forEach((field) => {
      values[fieldKey(field)] = getInitialFieldValue(field);
      defaults[fieldKey(field)] = getDefaultFieldValue(field);
    });
    formModel.value = values;
    defaultModel.value = defaults;

    const currNodeId = detail.value?.OcapInstanceV?.CurrNodeId;
    const idxByNodeId = currNodeId
      ? groupedNodes.value.findIndex((g) => g.node.NodeId === currNodeId)
      : -1;
    const idxBySeq = currNodeId
      ? groupedNodes.value.findIndex((g) => g.node.Seq === currNodeId)
      : -1;
    const idxByFinish = groupedNodes.value.findIndex((g) => !isNodeFinished(g.node));
    const allFinished = groupedNodes.value.length > 0 && groupedNodes.value.every((g) => isNodeFinished(g.node));

    const idx = idxByFinish >= 0
      ? idxByFinish
      : allFinished
        ? groupedNodes.value.length - 1
        : idxByNodeId >= 0
          ? idxByNodeId
          : idxBySeq >= 0
            ? idxBySeq
            : 0;

    currentProcessingStep.value = idx;
    currentStep.value = currentProcessingStep.value;
    await loadCurrentNodeDetail();
  }, { rethrow: false });
}

onMounted(loadData);
watch(() => route.params.ocapId, loadData);
watch(currentStep, async () => {
  await loadCurrentNodeDetail();
});
</script>

<template>
  <Page auto-content-height content-class="flex h-full p-1">
    <Card :loading="loading" :title="detail?.OcapInstanceV.Name || '节点处理'" class="h-full w-full flex flex-col"
      :styles="{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }">
      <Empty v-if="!groupedNodes.length" description="暂无节点数据" />

      <Steps v-model:current="currentStep" :items="stepItems" type="panel" size="small" @change="handleStepChange" />

      <div class="border-border mt-4 flex-1 min-h-0 overflow-y-auto rounded border p-3">
        <div class="mb-3 text-base font-medium">
          {{ currentGroup?.node.Seq }}. {{ currentGroup?.node.NodeName || '未命名节点' }}
        </div>

        <Form ref="formRef" layout="horizontal" :model="formModel" :wrapper-col="{ style: { flex: 1 } }" class="w-full">
          <div class="grid grid-cols-1 gap-x-4 md:grid-cols-2 xl:grid-cols-3">
            <FormItem v-for="field in currentGroup?.fields ?? []" :key="field.Sysid"
              :label="`${field.Seq + 1}. ${field.Caption}`" :name="fieldKey(field)" :rules="getValidateRules(field)">
              <template v-if="field.ControlType === 'RadioGroup'">
                <Input v-if="isFieldDisabled(field)" :value="formModel[fieldKey(field)]" readonly
                  variant="underlined" />
                <RadioGroup v-else v-model:value="formModel[fieldKey(field)]" :options="getRadioOptions(field)" />
              </template>

              <template v-else-if="field.ControlType === 'DateEdit'">
                <Input v-if="isFieldDisabled(field)" :value="formModel[fieldKey(field)]" readonly
                  variant="underlined" />
                <DatePicker v-else v-model:value="formModel[fieldKey(field)]" show-time format="YYYY-MM-DD HH:mm:ss"
                  value-format="YYYY-MM-DD HH:mm:ss" class="w-full" />
              </template>

              <template v-else-if="field.ControlType === 'NumberEdit'">
                <Input v-if="isFieldDisabled(field)" :value="formModel[fieldKey(field)]" readonly
                  variant="underlined" />
                <InputNumber v-else v-model:value="formModel[fieldKey(field)]" class="w-full" />
              </template>

              <Input v-else v-model:value="formModel[fieldKey(field)]" :readonly="isFieldDisabled(field)"
                variant="underlined" :maxlength="field.Length || undefined" />
            </FormItem>
          </div>
        </Form>
      </div>

      <div v-if="!isEditingCurrentNode && processedNodeUsers.length" class="mt-4 shrink-0 rounded border p-3">
        <Form layout="horizontal" :wrapper-col="{ style: { flex: 1 } }" class="w-full">
          <FormItem label="已处理节点处理人">
            <CheckboxGroup :value="processedNodeUsers.map((item) => item.value)" :options="processedNodeUsers"
              disabled />
          </FormItem>
        </Form>
      </div>

      <div v-if="hasProcessingNode && currentStep === currentProcessingStep" class="mt-4 shrink-0 rounded border p-3">
        <Form layout="horizontal" :wrapper-col="{ style: { flex: 1 } }" class="w-full">
          <FormItem label="下一节点处理人" name="nodeUsers" required>
            <CheckboxGroup v-model:value="selectedNodeUserIds" :options="currentNodeUserOptions"
              :disabled="!isEditingCurrentNode" />
          </FormItem>
        </Form>
      </div>

      <div v-if="hasProcessingNode && currentStep === currentProcessingStep"
        class="mt-4 flex shrink-0 items-end justify-start gap-2">
        <Button :loading="actionLoading" :disabled="currentProcessingStep <= 0"
          @click="openJumpLastModal">退回至上一步</Button>
        <Button :loading="actionLoading" :disabled="currentProcessingStep <= 0" danger
          @click="openRejectNodeModal">驳回指定节点</Button>
        <Button :loading="actionLoading" type="primary" @click="submitForm">提交</Button>
        <Button :loading="actionLoading" @click="resetToDefault">重置</Button>
      </div>

      <JumpLastModal title="退回至上一步" confirm-text="提交" cancel-text="取消" :confirm-loading="actionLoading"
        class="w-[520px]">
        <Form layout="vertical">
          <FormItem label="驳回理由" required>
            <TextArea v-model:value="jumpLastReason" :rows="4" :maxlength="500" show-count placeholder="请输入驳回理由" />
          </FormItem>
        </Form>
      </JumpLastModal>

      <RejectNodeModal title="驳回指定节点" confirm-text="提交" cancel-text="取消" :confirm-loading="actionLoading"
        class="w-[520px]">
        <Form layout="vertical">
          <FormItem label="目标节点" required>
            <Select v-model:value="rejectNodeId" :options="previousNodeOptions"
              :field-names="{ label: 'label', value: 'value' }" placeholder="请选择当前节点前面的节点" />
          </FormItem>
          <FormItem label="驳回理由" required>
            <TextArea v-model:value="rejectReason" :rows="4" :maxlength="500" show-count placeholder="请输入驳回理由" />
          </FormItem>
        </Form>
      </RejectNodeModal>
    </Card>
  </Page>
</template>
