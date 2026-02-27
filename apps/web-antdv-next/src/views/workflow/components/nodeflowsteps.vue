<script setup lang="ts">
import { computed } from 'vue';

import { Empty, Steps } from 'antdv-next';

import type { WorkflowApi } from '#/api/workflow';

const props = defineProps<{
  data: WorkflowApi.ApprovalNode[] | null;
}>();

function activityLabel(activity: number) {
  if (activity === 2) return '已通过';
  if (activity === 3) return '已驳回';
  if (activity === 1) return '审批中';
  return '未处理';
}

const items = computed(() =>
  (props.data ?? [])
    .slice()
    .sort((a, b) => a.Seq - b.Seq)
    .map((item) => ({
      content: `${item.VerifyUsersName || '-'} | ${activityLabel(item.Activity)}`,
      title: `${item.Seq}. ${item.NodeName || '未命名节点'}`,
    })),
);
</script>

<template>
  <Empty v-if="!items.length" description="暂无流程节点数据" />
  <Steps v-else orientation="vertical" :items="items" />
</template>
