<script setup lang="ts">
import { IconifyIcon } from '@vben/icons';

import { Button } from 'antdv-next';

defineOptions({
  name: 'TableActionButtons',
});
defineProps<{
  params: any;
}>();
</script>

<template>
  <div
    class="w-full h-full p-2 flex justify-start items-center flex-wrap gap-1"
  >
    <Button type="link" @click="params.onTableEdit(params.data)">
      <template #icon><IconifyIcon icon="lucide:edit" /></template>
      编辑
    </Button>
    <Button type="link" @click="params.onTableCopy(params.data)">
      <template #icon><IconifyIcon icon="lucide:copy" /></template>
      复制
    </Button>
    <Button type="link" @click="params.onTableRun(params.data)">
      <template #icon><IconifyIcon icon="lucide:play" /></template>
      运行
    </Button>
    <Button type="link" @click="params.onTableToLog(params.data)">
      <template #icon><IconifyIcon icon="lucide:file-text" /></template>
      日志
    </Button>
    <Button type="link" danger @click="params.onTableDelete(params.data)">
      <template #icon><IconifyIcon icon="lucide:trash-2" /></template>
      删除
    </Button>
  </div>
</template>
