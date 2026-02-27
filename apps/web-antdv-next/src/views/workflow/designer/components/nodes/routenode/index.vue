<template>
  <div class="inline-flex" draggable="false">
    <div class="flex min-h-[270px] w-full shrink-0 flex-col flex-wrap items-center" draggable="false">
      <div class="relative mt-[15px] flex h-auto min-h-[180px] overflow-visible border-y-2 border-[#cacaca]" draggable="false">
        <AddBranchButton :node="node" />
        <BranchNode
          v-for="(child, index) in node.conditionNodeList"
          :key="child.id"
          :parent="node"
          :node="child"
          :index="index"
          :length="node.conditionNodeList.length || 0"
        />
      </div>
      <AddButton v-if="node?.id" :node-id="node.id" />
      <ChildNode v-if="node?.childNode" :node="node.childNode" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IRouteNode } from '#/views/workflow/designer/interfaces';
import AddButton from '#/views/workflow/designer/components/nodes/addbutton/index.vue';
import ChildNode from '#/views/workflow/designer/components/nodes/childnode.vue';
import AddBranchButton from '#/views/workflow/designer/components/nodes/routenode/addbranchbutton.vue';
import BranchNode from '#/views/workflow/designer/components/nodes/routenode/branchnode.vue';

defineProps<{
  node: IRouteNode;
}>();
</script>
