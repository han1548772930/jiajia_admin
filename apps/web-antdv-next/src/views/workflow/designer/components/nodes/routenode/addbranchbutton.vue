<script setup lang="ts">
import type { IRouteNode } from '#/views/workflow/designer/interfaces/workflow';
import { NodeType } from '#/views/workflow/designer/interfaces/workflow';
import useNodeStore from '#/store/workflow/node';
import { createUuid } from '#/views/workflow/designer/utils/create-uuid';

const props = defineProps<{
  node: IRouteNode;
}>();

const nodeStore = useNodeStore();

const handleClick = () => {
  const newId = createUuid();
  nodeStore.addCondition(props.node, {
    id: newId,
    nodeType: NodeType.condition,
    name: `条件${props.node.conditionNodeList.length + 1}`,
  });
};
</script>

<template>
  <button
    class="absolute -top-4 left-1/2 z-[1] inline-flex h-[30px] -translate-x-1/2 items-center justify-center whitespace-nowrap rounded-[15px] border-0 bg-white px-[10px] text-xs leading-[30px] text-[#1677ff] shadow-[0_2px_4px_0_rgba(0,0,0,0.1)] outline-none transition-all duration-300 [transition-timing-function:cubic-bezier(0.645,0.045,0.355,1)] origin-center select-none hover:scale-110 hover:shadow-[0_8px_16px_0_rgba(0,0,0,0.1)] active:scale-100 active:shadow-none"
    @click="handleClick"
  >
    {{ '添加条件' }}
  </button>
</template>
