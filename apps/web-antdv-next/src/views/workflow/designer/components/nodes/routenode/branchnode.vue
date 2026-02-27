<template>
  <div
    class="relative inline-flex flex-col items-center select-none bg-[rgb(250,250,250)] before:absolute before:inset-0 before:z-0 before:m-auto before:h-full before:w-[2px] before:bg-[#cacaca] before:content-['']"
    draggable="false"
  >
    <div class="condition-node inline-flex min-h-[220px] grow select-none flex-col" draggable="false">
      <div class="condition-node-box relative inline-flex grow select-none flex-col items-center justify-center pt-[30px] pr-[50px] pl-[50px]" draggable="false">
        <div
          class="relative w-[220px] min-h-[72px] cursor-pointer select-none rounded border-0 bg-white px-4 py-2 after:pointer-events-none after:absolute after:inset-0 after:z-[2] after:rounded after:border after:border-transparent after:shadow-[0_2px_5px_0_rgba(0,0,0,0.1)] after:transition-all after:duration-100 after:[transition-timing-function:cubic-bezier(0.645,0.045,0.355,1)] after:content-[''] [&.active:after]:border-[#3296fa] [&.active:after]:shadow-[0_0_6px_0_rgba(50,150,250,0.3)] [&_.mini-bar]:hidden [&_.priority]:flex hover:[&_.sort-handler]:flex hover:[&_.sort-handler]:items-center hover:[&_.mini-bar]:flex hover:[&_.priority]:hidden hover:after:border-[#3296fa] hover:after:shadow-[0_0_6px_0_rgba(50,150,250,0.3)]"
          draggable="false"
          @click="handleClick"
        >
          <div
            v-if="index !== 0"
            class="sort-handler absolute top-0 bottom-0 left-0 z-[1] hidden h-full border-r border-solid hover:bg-white"
            @click.stop="handleMoveLeft"
          >
            &lt;
          </div>
          <ConditionNodeTitle :node="node" :parent="parent" :index="index" />

          <div class="relative select-none pt-4 pr-[30px] pb-4 pl-0 text-sm">
            <span :class="['text', defaultConfig?.secondary ? 'secondary' : '']">
              {{ props.node.nodeContent ?? defaultConfig?.content }}
            </span>
          </div>
          <div
            v-if="index !== length - 1"
            class="sort-handler absolute top-0 bottom-0 right-0 z-[1] hidden h-full border-l border-solid hover:bg-white"
            @click.stop="handleMoveRight"
          >
            &gt;
          </div>
          <ErrorTip :node="node" />
        </div>
        <AddButton v-if="node?.id" :node-id="node.id" />
        <ChildNode v-if="node?.childNode" :node="node.childNode" />
      </div>
    </div>
    <div v-if="index === 0" class="absolute -top-1 -left-px h-2 w-1/2 bg-[rgb(250,250,250)]" />
    <div v-if="index === 0" class="absolute -bottom-1 -left-px h-2 w-1/2 bg-[rgb(250,250,250)]" />
    <div v-if="index === length - 1" class="absolute -top-1 -right-px h-2 w-1/2 bg-[rgb(250,250,250)]" />
    <div v-if="index === length - 1" class="absolute -bottom-1 -right-px h-2 w-1/2 bg-[rgb(250,250,250)]" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { IBranchNode, IRouteNode } from '#/views/workflow/designer/interfaces';
import AddButton from '#/views/workflow/designer/components/nodes/addbutton/index.vue';
import ChildNode from '#/views/workflow/designer/components/nodes/childnode.vue';
import ErrorTip from '#/views/workflow/designer/components/nodes/errortip.vue';
import ConditionNodeTitle from '#/views/workflow/designer/components/nodes/routenode/conditionnodetitle.vue';
import useNodeStore from '#/store/workflow/node';

const props = defineProps<{
  parent: IRouteNode;
  node: IBranchNode;
  index: number;
  length: number;
}>();

const nodeStore = useNodeStore();
const defaultConfig = computed(() => nodeStore.materialUis[props.node.nodeType]?.defaultConfig);

const handleClick = () => {
  if (props.node.id) {
    nodeStore.selectedNode = props.node.id;
  }
};

const handleMoveLeft = (e: MouseEvent) => {
  e.stopPropagation();
  nodeStore.transConditionOneStepToLeft(props.parent, props.index);
};

const handleMoveRight = (e: MouseEvent) => {
  e.stopPropagation();
  nodeStore.transConditionOneStepToRight(props.parent, props.index);
};
</script>
