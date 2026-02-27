<template>
  <Button
    class="close absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center justify-center text-sm"
    type="text"
    size="small"
    shape="circle"
    @click="handleClose"
  >
    <IconifyIcon icon="lucide:x" class="text-white" />
  </Button>
</template>

<script setup lang="ts">
import { IconifyIcon } from '@vben/icons';
import { Button } from 'antdv-next';

import useNodeStore from '#/store/workflow/node';

const props = defineProps<{
  nodeId?: string;
}>();

const nodeStore = useNodeStore();

const handleClose = (e: MouseEvent) => {
  e.stopPropagation();
  if (props.nodeId) {
    nodeStore.deleteNode(props.nodeId);
  }
};
</script>
