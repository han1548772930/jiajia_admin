<script setup lang="ts">
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { Button, message, Tabs, TextArea } from 'antdv-next';

import {
  getApprovalNodesApi,
  getOpHistoryApi,
  getReportFormApi,
  verifyInstanceApi,
  WorkflowVerifyResult,
  type WorkflowApi,
} from '#/api/workflow';
import { useRequestLoading } from '#/composables/useRequestLoading';
import NodeFlowSteps from '#/views/workflow/components/nodeflowsteps.vue';
import OperationHistorySteps from '#/views/workflow/components/operationhistorysteps.vue';
import ReportFormPanel from '#/views/workflow/components/reportformpanel.vue';

interface WorkflowDetailModalData {
  approvalMode?: boolean;
  item: WorkflowApi.InstanceItem;
  onActionDone?: () => Promise<void> | void;
}

const activeKey = ref('detail');
const { loading: actionLoading, run: runActionRequest } = useRequestLoading();
const { loading: detailLoading, run: runDetailRequest } = useRequestLoading();
const modalData = ref<null | WorkflowDetailModalData>(null);
const opHistory = ref<WorkflowApi.ApprovalOpHistory[]>([]);
const approvalNodes = ref<WorkflowApi.ApprovalNode[]>([]);
const reportForm = ref<undefined | WorkflowApi.ReportForm>(undefined);
const verifyRemark = ref('');

const tabItems = [
  { key: 'detail', label: '流程详情' },
  { key: 'history', label: '审批记录' },
  { key: 'flow', label: '审批流程' },
];

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<WorkflowDetailModalData>();
      if (!data?.item) return;

      modalData.value = data;
      activeKey.value = 'detail';
      verifyRemark.value = '';
      void loadDetail(data.item);
      return;
    }

    modalData.value = null;
    opHistory.value = [];
    approvalNodes.value = [];
    reportForm.value = undefined;
    verifyRemark.value = '';
    activeKey.value = 'detail';
  },
});

const [VerifyModal, verifyModalApi] = useVbenModal({
  showCancelButton: false,
  showConfirmButton: false,
  onOpenChange(isOpen) {
    if (isOpen) {
      verifyRemark.value = '';
    }
  },
});

async function loadDetail(item: WorkflowApi.InstanceItem) {
  await runDetailRequest(
    async () => {
      const [formResult, opResult, nodeResult] = await Promise.allSettled([
        getReportFormApi(item),
        getOpHistoryApi(item.Sysid),
        getApprovalNodesApi(item.Sysid),
      ]);

      if (formResult.status === 'fulfilled') {
        reportForm.value = formResult.value.Success && formResult.value.Data
          ? formResult.value.Data
          : undefined;
      } else {
        reportForm.value = undefined;
      }

      if (opResult.status === 'fulfilled') {
        if (opResult.value.Success) {
          opHistory.value = opResult.value.Data ?? [];
        } else {
          opHistory.value = [];
          message.error(opResult.value.Message || '加载审批记录失败');
        }
      } else {
        opHistory.value = [];
        message.error('加载审批记录失败');
      }

      if (nodeResult.status === 'fulfilled') {
        if (nodeResult.value.Success) {
          approvalNodes.value = nodeResult.value.Data ?? [];
        } else {
          approvalNodes.value = [];
          message.error(nodeResult.value.Message || '加载审批流程失败');
        }
      } else {
        approvalNodes.value = [];
        message.error('加载审批流程失败');
      }
    },
    {
      onError: () => message.error('加载流程详情失败'),
      rethrow: false,
    },
  );
}

function openVerifyModal() {
  if (!modalData.value?.approvalMode) return;
  verifyModalApi.open();
}

async function submitAction(result: WorkflowVerifyResult) {
  const current = modalData.value;
  if (!current) return;

  await runActionRequest(async () => {
    modalApi.lock();
    verifyModalApi.lock();
    try {
      const res = await verifyInstanceApi(current.item.Sysid, verifyRemark.value, result);
      if (!res.Success) {
        message.error(res.Message || '审批提交失败');
        return;
      }

      message.success(result === WorkflowVerifyResult.Approve ? '审批通过' : '审批驳回');
      if (current.onActionDone) {
        await current.onActionDone();
      }
      verifyModalApi.close();
      modalApi.close();
    } finally {
      modalApi.unlock();
      verifyModalApi.unlock();
    }
  });
}
</script>

<template>
  <Modal :title="modalData?.item?.TemplateName || '流程详情'" class="w-[92%]" :loading="detailLoading"
    :footer="!modalData?.approvalMode" :show-cancel-button="false"
    :show-confirm-button="false">
    <template #title>
      <div class="flex w-full items-center justify-between pr-14">
        <span>{{ modalData?.item?.TemplateName || '流程详情' }}</span>
        <Button v-if="modalData?.approvalMode" type="primary" :loading="actionLoading || detailLoading"
          @click="openVerifyModal">
          审批
        </Button>
      </div>
    </template>

    <div class="flex h-full min-h-0 flex-col gap-4">
      <Tabs v-model:activeKey="activeKey" :items="tabItems" type="card" />
      <div v-if="activeKey === 'detail'" class="min-h-0 flex-1 overflow-y-auto pr-1">
        <ReportFormPanel :data="reportForm" />
      </div>
      <div v-else-if="activeKey === 'history'" class="min-h-0 flex-1 overflow-y-auto pr-1">
        <OperationHistorySteps :data="opHistory" />
      </div>
      <div v-else-if="activeKey === 'flow'" class="min-h-0 flex-1 overflow-y-auto pr-1">
        <NodeFlowSteps :data="approvalNodes" />
      </div>
    </div>

    <template v-if="!modalData?.approvalMode" #footer>
      <div class="flex w-full justify-end gap-2">
        <Button @click="modalApi.close()">关闭</Button>
      </div>
    </template>
  </Modal>

  <VerifyModal title="审批意见" class="w-[520px]">
    <TextArea v-model:value="verifyRemark" :rows="4" :maxlength="300" show-count placeholder="请输入审批意见（可选）" />
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <Button :disabled="actionLoading" @click="verifyModalApi.close()">取消</Button>
        <Button danger :loading="actionLoading" @click="submitAction(WorkflowVerifyResult.Reject)">
          驳回
        </Button>
        <Button type="primary" :loading="actionLoading" @click="submitAction(WorkflowVerifyResult.Approve)">
          通过
        </Button>
      </div>
    </template>
  </VerifyModal>
</template>
