<template>
  <div class="relative flex grow flex-col flex-wrap items-center justify-start px-[50px] select-none">
    <div
      class="relative inline-flex w-[220px] min-h-[72px] shrink-0 cursor-pointer select-none flex-col rounded bg-white after:pointer-events-none after:absolute after:inset-0 after:z-[2] after:rounded after:border after:border-transparent after:shadow-[0_2px_5px_0_rgba(0,0,0,0.1)] after:transition-all after:duration-100 after:[transition-timing-function:cubic-bezier(0.645,0.045,0.355,1)] after:content-['']"
      v-once="true"
      @click="handleClick"
    >
      <div
        class="relative flex h-6 w-full select-none items-center rounded-t rounded-b-none bg-[rgb(87,106,149)] pl-4 pr-[30px] text-left text-xs leading-6 text-white"
      >
        {{ material?.label }}
      </div>
      <div class="relative select-none pt-4 pr-[30px] pb-4 pl-4 text-sm">
        {{ defaultConfig?.content }}
        <IconifyIcon icon="lucide:chevron-right" class="absolute right-2.5 top-1/2 h-[14px] w-5 -translate-y-1/2 text-sm" />
      </div>
    </div>
    <AddButton v-if="startNode?.id" :node-id="startNode.id" />
    <ChildNode v-if="startNode?.childNode" :node="startNode.childNode" />
    <EndNode />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { NodeType } from '#/views/workflow/designer/interfaces';
import type { INodeMaterial } from '#/views/workflow/designer/interfaces/material';
import AddButton from '#/views/workflow/designer/components/nodes/addbutton/index.vue';
import ChildNode from '#/views/workflow/designer/components/nodes/childnode.vue';
import EndNode from '#/views/workflow/designer/components/nodes/endnode.vue';
import useNodeStore from '#/store/workflow/node';

const nodeStore = useNodeStore();

const startNode = computed(() => nodeStore.node);
const material = computed<INodeMaterial | undefined>(() => nodeStore.getMaterialByNodeType(NodeType.start));
const materialUi = computed(() => nodeStore.materialUis[NodeType.start]);
const defaultConfig = computed(() => materialUi.value?.defaultConfig);

const handleClick = () => {};
</script>
