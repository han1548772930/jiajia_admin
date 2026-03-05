<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
import { Card, Empty, Form, FormItem, Input, message } from 'antdv-next';

import { getOcapInstanceDetailApi, type WorkflowApi } from '#/api/workflow';
import { useRequestLoading } from '#/composables/useRequestLoading';

const route = useRoute();
const { loading, run: runWithLoading } = useRequestLoading();

const detail = ref<null | WorkflowApi.OcapInstanceDetail>(null);
const formModel = ref<Record<string, any>>({});

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

const statusText = computed(() => '已完结');
const reportName = computed(() => detail.value?.OcapInstanceV?.Name || '-');
const reportCode = computed(() => detail.value?.OcapInstanceV?.Code || '-');
const initiator = computed(() => {
  const v = detail.value?.OcapInstanceV;
  return v?.CreatorId != null ? String(v.CreatorId) : '-';
});
const happenTime = computed(() => detail.value?.OcapInstanceV?.CreateDate || '-');
const badRateText = computed(() => {
  const v = detail.value?.OcapInstanceV;
  const badQty = Number(v?.BadQty ?? 0);
  const qty = Number(v?.Qty ?? 0);
  if (!qty) return '0.00%';
  return `${((badQty / qty) * 100).toFixed(2)}%`;
});
const summaryItems = computed(() => {
  const v = detail.value?.OcapInstanceV;
  return [
    { label: '异常分类', value: v?.StepName || v?.Name || '-' },
    { label: '工序名称', value: v?.ProcessName || '-' },
    { label: '工单号', value: v?.WoCode || '-' },
    { label: '产品名称', value: v?.CustName || '-' },
    { label: '产品代码', value: v?.CustCode || '-' },
    { label: '批次号', value: v?.Lot || '-' },
    { label: '订单号', value: v?.PoId != null ? String(v.PoId) : '-' },
    { label: '生产数量', value: v?.Qty != null ? String(v.Qty) : '-' },
    { label: '不良数量', value: v?.BadQty != null ? String(v.BadQty) : '-' },
    { label: '不良率', value: badRateText.value },
    { label: '发生时间', value: v?.CreateDate || '-' },
    { label: '异常描述', value: v?.Remark || '-' },
  ];
});

function fieldKey(field: WorkflowApi.OcapInstanceNodeValue) {
  return `field_${field.Sysid}`;
}

function toFieldDisplayValue(raw: unknown) {
  if (raw === null || raw === undefined) return '';
  return String(raw);
}

function resolveOcapId() {
  const raw = Array.isArray(route.params.ocapId) ? route.params.ocapId[0] : route.params.ocapId;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

async function loadData() {
  const id = resolveOcapId();
  if (!id) return void message.error('路由参数 ocapId 无效');

  await runWithLoading(async () => {
    const res = await getOcapInstanceDetailApi(id);
    if (!res.Success) return void message.error(res.Message || '加载异常处理报告失败');

    detail.value = res.Data ?? null;

    const values: Record<string, any> = {};
    (detail.value?.OcapInstanceNodeValueVs ?? []).forEach((field) => {
      values[fieldKey(field)] = toFieldDisplayValue(field.FieldValue ?? field.Default);
    });
    formModel.value = values;
  }, { rethrow: false });
}

onMounted(loadData);
watch(() => route.params.ocapId, loadData);
</script>

<template>
  <Page auto-content-height content-class="h-full p-1 flex flex-col">
    <Card :loading="loading" class="w-full h-full overflow-y-auto">
      <Empty v-if="!groupedNodes.length" description="暂无报告数据" />

      <div v-else class="flex flex-col gap-4">
        <div class="rounded border p-4">
          <div class="text-center text-sm leading-7">流程状态：{{ statusText }}</div>
          <div class="text-center text-xl font-semibold leading-9">异常处理报告</div>
          <div class="text-center text-base leading-7">编号：{{ reportCode }}</div>
          <div class="mt-2 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
            <div>{{ reportName }}(发起异常)</div>
            <div>发起人：{{ initiator }}</div>
            <div>时间：{{ happenTime }}</div>
          </div>

          <Form class="mt-3" layout="horizontal" :wrapper-col="{ style: { flex: 1 } }">
            <div class="grid grid-cols-1 gap-x-4 md:grid-cols-2 xl:grid-cols-3">
              <FormItem v-for="item in summaryItems" :key="item.label" :label="item.label">
                <Input :value="item.value" readonly variant="underlined" />
              </FormItem>
            </div>
          </Form>
        </div>

        <div>
          <div v-for="group in groupedNodes" :key="group.node.Sysid" class="mb-4 rounded border p-4">
            <div class="mb-3 flex items-center justify-between gap-3">
              <div class="text-base font-medium text-[#59b478]">
                {{ group.node.NodeName || '-' }}
              </div>
              <div class="text-sm text-gray-500">
                节点编码：{{ group.node.NodeCode || '-' }} ｜ 状态：{{ group.node.Finish ? '已完成' : '待完成' }}
              </div>
            </div>

            <Form class="mt-2" layout="horizontal" :model="formModel" :wrapper-col="{ style: { flex: 1 } }">
              <div class="grid grid-cols-1 gap-x-4 md:grid-cols-2 xl:grid-cols-3">
                <FormItem v-for="field in group.fields" :key="field.Sysid"
                  :label="`${field.Seq + 1}. ${field.Caption}`">
                  <Input v-model:value="formModel[fieldKey(field)]" readonly variant="underlined" />
                </FormItem>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </Card>
  </Page>
</template>
