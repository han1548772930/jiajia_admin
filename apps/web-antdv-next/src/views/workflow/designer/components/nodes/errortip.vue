<template>
  <div v-if="errorMsg" class="absolute top-0 -right-10 z-[2]">
    <Tooltip :title="errorMsg">
      <IconifyIcon icon="lucide:info" class="text-[24px] text-[red]" />
    </Tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { Tooltip } from 'antdv-next';

import type { IWorkFlowNode } from '#/views/workflow/designer/interfaces';
import useNodeStore from '#/store/workflow/node';

const props = defineProps<{ node: IWorkFlowNode }>();

const nodeStore = useNodeStore();
const materialUi = computed(() => nodeStore.materialUis[props.node.nodeType]);
const errorMsg = computed(() => materialUi.value?.validate?.(props.node));
</script>
