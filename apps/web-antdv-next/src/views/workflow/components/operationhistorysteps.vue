<script setup lang="ts">
import { computed } from 'vue';

import { Empty, Steps } from 'antdv-next';

import type { WorkflowApi } from '#/api/workflow';

const props = defineProps<{
  data: WorkflowApi.ApprovalOpHistory[] | null;
}>();

function activityLabel(activity: number) {
  if (activity === 2) return '通过';
  if (activity === 3) return '驳回';
  return '处理中';
}

const items = computed(() =>
  (props.data ?? []).map((item) => ({
    content: `${item.CreateDate || '-'} | ${activityLabel(item.Activity)}${
      item.Remark ? ` | ${item.Remark}` : ''
    }`,
    title: item.NodeName || '未命名节点',
  })),
);
</script>

<template>
  <Empty v-if="!items.length" description="暂无审批记录" />
  <Steps v-else orientation="vertical" :items="items" />
</template>
