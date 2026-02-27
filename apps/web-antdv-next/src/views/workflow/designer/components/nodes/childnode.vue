<script setup lang="ts">
import { computed } from 'vue';

import type { IRouteNode, IWorkFlowNode } from '#/views/workflow/designer/interfaces/workflow';
import { NodeType } from '#/views/workflow/designer/interfaces/workflow';
import NormalNode from '#/views/workflow/designer/components/nodes/normalnode.vue';
import RouteNode from '#/views/workflow/designer/components/nodes/routenode/index.vue';

const props = defineProps<{
  node: IWorkFlowNode;
}>();

const isRouteNode = computed(() => props.node.nodeType === NodeType.route);
const routeNode = computed(() => props.node as IRouteNode);
</script>

<template>
  <RouteNode v-if="isRouteNode" :node="routeNode" />
  <NormalNode v-else :node="node" />
</template>
