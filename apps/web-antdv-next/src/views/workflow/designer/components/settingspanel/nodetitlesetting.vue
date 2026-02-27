<template>
  <div v-if="props.node" class="flex min-h-6 w-full items-center justify-start text-base font-semibold leading-6">
    <span v-if="props.node.nodeType === NodeType.start" class="mr-2 overflow-hidden text-ellipsis whitespace-nowrap">
      promoter
    </span>
    <NodeTitleEditor v-else class="min-w-0 flex-1" :value="props.node.name ?? ''" :on-change="props.onNameChange" />
  </div>
</template>

<script setup lang="ts">
import type { IWorkFlowNode } from '#/views/workflow/designer/interfaces';
import { NodeType } from '#/views/workflow/designer/interfaces';
import NodeTitleEditor from '#/views/workflow/designer/components/settingspanel/nodetitleeditor.vue';

const props = defineProps<{
  node: IWorkFlowNode;
  onNameChange: (name?: string) => void;
}>();
</script>
