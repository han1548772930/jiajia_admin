<template>
  <div
    class="relative flex grow flex-col flex-wrap items-center justify-start px-[50px] select-none before:absolute before:-top-3 before:left-1/2 before:h-1 before:w-0 before:-translate-x-1/2 before:border-solid before:bg-[#f5f5f7] before:content-[''] before:[border-width:8px_6px_4px] before:[border-color:#cacaca_transparent_transparent]">
    <div
      class="node-wrap-box relative inline-flex w-[220px] min-h-[72px] shrink-0 cursor-pointer select-none flex-col rounded bg-white hover:outline hover:outline-1 hover:outline-[#1677ff] after:pointer-events-none after:absolute after:inset-0 after:z-[2] after:rounded after:border after:border-transparent after:shadow-[0_2px_5px_0_rgba(0,0,0,0.1)] after:transition-all after:duration-100 after:[transition-timing-function:cubic-bezier(0.645,0.045,0.355,1)] after:content-['']"
      @click="handleClick">
      <NodeTitle :node="node" :material="material" />
      <div class="relative select-none pt-4 pr-[30px] pb-4 pl-4 text-sm">
        <span :class="[
          'overflow-hidden text-ellipsis whitespace-nowrap select-none [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical]',
          defaultConfig?.secondary ? 'text-[rgba(0,0,0,0.65)] opacity-80' : '',
        ]">
          {{ props.node.nodeContent || defaultConfig?.content }}
        </span>
        <IconifyIcon icon="lucide:chevron-right"
          class="absolute right-2.5 top-1/2 h-[14px] w-5 -translate-y-1/2 text-sm" />
      </div>
      <ErrorTip :node="node" />
    </div>
    <AddButton v-if="node?.id" :node-id="node?.id" />
    <ChildNode v-if="node?.childNode" :node="node?.childNode" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';

import type { IWorkFlowNode } from '#/views/workflow/designer/interfaces';
import AddButton from '#/views/workflow/designer/components/nodes/addbutton/index.vue';
import ChildNode from '#/views/workflow/designer/components/nodes/childnode.vue';
import ErrorTip from '#/views/workflow/designer/components/nodes/errortip.vue';
import NodeTitle from '#/views/workflow/designer/components/nodes/nodetitle.vue';
import useNodeStore from '#/store/workflow/node';

const props = defineProps<{
  node: IWorkFlowNode;
}>();

const nodeStore = useNodeStore();
const materialUi = computed(() => nodeStore.materialUis[props.node.nodeType]);
const defaultConfig = computed(() => materialUi.value?.defaultConfig);
const material = computed(() => nodeStore.getMaterialByNodeType(props.node.nodeType));

const handleClick = () => {
  if (props.node?.id) {
    nodeStore.setSelectNode(props.node.id);
  }
};
</script>

<style scoped>
.node-wrap-box :deep(.close) {
  display: none !important;
}

.node-wrap-box:hover :deep(.close) {
  display: inline-flex !important;
}
</style>
