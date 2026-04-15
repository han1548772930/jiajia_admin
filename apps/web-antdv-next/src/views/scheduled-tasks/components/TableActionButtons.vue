<script setup lang="ts">
import { Button } from 'antdv-next';
import { IconifyIcon } from '@vben/icons';

import type { TaskApi } from '#/api/task';

defineOptions({
  name: 'TableActionButtons',
});

const props = defineProps<{
  params: any;
}>();

function getCurrentRowData(): TaskApi.JobData {
  return props.params.node?.data ?? props.params.data;
}
</script>

<template>
  <div
    class="w-full h-full p-2 flex justify-start items-center flex-wrap gap-1"
  >
    <Button type="link" @click="props.params.onTableEdit(getCurrentRowData())">
      <template #icon><IconifyIcon icon="lucide:edit" /></template>
      编辑
    </Button>
    <Button type="link" @click="props.params.onTableCopy(getCurrentRowData())">
      <template #icon><IconifyIcon icon="lucide:copy" /></template>
      复制
    </Button>
    <Button type="link" @click="props.params.onTableRun(getCurrentRowData())">
      <template #icon><IconifyIcon icon="lucide:play" /></template>
      运行
    </Button>
    <Button type="link" @click="props.params.onTableToLog(getCurrentRowData())">
      <template #icon><IconifyIcon icon="lucide:file-text" /></template>
      日志
    </Button>
    <Button
      type="link"
      danger
      @click="props.params.onTableDelete(getCurrentRowData())"
    >
      <template #icon><IconifyIcon icon="lucide:trash-2" /></template>
      删除
    </Button>
  </div>
</template>
