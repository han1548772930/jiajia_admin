<script setup lang="ts">
import { computed, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Button, Card, Input, Select, Switch, Table, Tag, message } from 'antdv-next';

import type { WorkflowApi } from '#/api/workflow';
import { useRequestLoading } from '#/composables/useRequestLoading';
import WorkflowDetailModal from '#/views/workflow/components/workflowdetailmodal.vue';

const props = withDefaults(
  defineProps<{
    approvalMode?: boolean;
    fetcher: () => Promise<WorkflowApi.ApiResponse<WorkflowApi.InstanceItem[]>>;
    pageTitle?: string;
  }>(),
  {
    approvalMode: false,
    pageTitle: '流程列表',
  },
);

const { loading, run: runWithLoading } = useRequestLoading();
const allItems = ref<WorkflowApi.InstanceItem[]>([]);

const selectedCategory = ref<null | string>(null);
const selectedBillCode = ref<null | string>(null);
const showDeleted = ref(false);
const processNameTemp = ref('');
const processName = ref('');

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: WorkflowDetailModal,
});

const columns = [
  { dataIndex: 'TemplateName', key: 'TemplateName', title: '模板名称', width: 240 },
  { dataIndex: 'CategoryName', key: 'CategoryName', title: '流程分类', width: 150 },
  { dataIndex: 'CreateDate', key: 'CreateDate', title: '提报日期', width: 180 },
  { dataIndex: 'Status', key: 'Status', title: '状态', width: 140 },
  { dataIndex: 'BillCode', key: 'BillCode', title: '业务单据号', width: 150 },
  { dataIndex: 'ActiveNodeName', key: 'ActiveNodeName', title: '当前节点', width: 140 },
  { dataIndex: 'Creator', key: 'Creator', title: '提单人', width: 120 },
  { key: 'action', title: '操作', width: 100 },
];

const categoryOptions = computed(() =>
  [...new Set(allItems.value.map((item) => item.CategoryName).filter(Boolean))].map((value) => ({
    label: value,
    value,
  })),
);

const billCodeOptions = computed(() =>
  [...new Set(allItems.value.map((item) => item.BillCode).filter(Boolean))].map((value) => ({
    label: value,
    value,
  })),
);

const filteredItems = computed(() =>
  allItems.value.filter((item) => {
    if (!showDeleted.value && item.IsDel === 1) return false;
    if (selectedCategory.value && item.CategoryName !== selectedCategory.value) return false;
    if (selectedBillCode.value && item.BillCode !== selectedBillCode.value) return false;
    if (processName.value && !item.TemplateName.includes(processName.value)) return false;
    return true;
  }),
);

function statusColor(status: string) {
  if (status.includes('通过')) return 'success';
  if (status.includes('失败') || status.includes('驳回')) return 'error';
  if (status.includes('审批')) return 'processing';
  return 'default';
}

async function loadData() {
  await runWithLoading(async () => {
    const res = await props.fetcher();
    if (!res.Success) {
      message.error(res.Message || '加载列表失败');
      return;
    }
    allItems.value = res.Data ?? [];
  });
}

function handleSearch() {
  processName.value = processNameTemp.value.trim();
}

function handleReset() {
  processNameTemp.value = '';
  processName.value = '';
  selectedCategory.value = null;
  selectedBillCode.value = null;
  showDeleted.value = false;
}

function openDetail(item: WorkflowApi.InstanceItem) {
  detailModalApi
    .setData({
      approvalMode: props.approvalMode,
      item,
      onActionDone: loadData,
    })
    .open();
}

loadData();
</script>

<template>
  <Page auto-content-height content-class="p-3">
    <div class="flex h-full flex-col gap-3">
      <Card>
        <div class="flex flex-wrap items-center gap-3">
          <Input v-model:value="processNameTemp" allow-clear :style="{ width: '320px' }" placeholder="流程名称"
            @press-enter="handleSearch" />
          <Select v-model:value="selectedCategory" allow-clear show-search class="w-[220px]" placeholder="流程分类"
            :options="categoryOptions" />
          <Select v-model:value="selectedBillCode" allow-clear show-search class="w-[220px]" placeholder="业务单据号"
            :options="billCodeOptions" />
          <div class="flex items-center">
            <Switch v-model:checked="showDeleted" checked-children="显示已反审" un-checked-children="不显示已反审" />
          </div>
          <div class="flex items-center">
            <Button @click="handleReset">重置</Button>
          </div>
          <div class="flex items-center gap-2">
            <Button :loading="loading" @click="loadData">刷新</Button>
            <Button type="primary" @click="handleSearch">搜索</Button>
          </div>
        </div>
      </Card>

      <Card :title="pageTitle" class="flex-1">
        <Table size="small" row-key="Sysid" :columns="columns as any" :data-source="filteredItems" :loading="loading"
          :scroll="{ x: 1300 }">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'Status'">
              <div class="flex items-center gap-2">
                <Tag :color="statusColor((record as any).Status)">{{ (record as any).Status || '-' }}</Tag>
                <Tag v-if="(record as any).IsDel === 1" color="error">已反审</Tag>
              </div>
            </template>
            <template v-else-if="column.key === 'action'">
              <Button type="link" @click="openDetail(record as WorkflowApi.InstanceItem)">详情</Button>
            </template>
          </template>
        </Table>
      </Card>
    </div>

    <DetailModal />
  </Page>
</template>
