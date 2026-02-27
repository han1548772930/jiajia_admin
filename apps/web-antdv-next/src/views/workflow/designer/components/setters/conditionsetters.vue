<script setup lang="ts">
import { computed, ref } from 'vue';

import {
  ExpressionGroupType,
  ExpressionNodeType,
  type IExpressionGroup,
} from '#/views/workflow/designer/interfaces/setting';
import { createUuid } from '#/views/workflow/designer/utils/create-uuid';
import useNodeStore from '#/store/workflow/node';
import ExpressionGroup from '#/views/workflow/designer/components/expressioninput/expressiongroup.vue';

const nodeStore = useNodeStore();
const selectNodeId = computed(() => nodeStore.selectedNode);
const selectNode = computed(() => nodeStore.getNode(selectNodeId.value!)!);
const materialUi = computed(() => nodeStore.materialUis[selectNode.value.nodeType]!);

function createDefaultExpressionGroup(): IExpressionGroup {
  return {
    children: [
      {
        id: createUuid(),
        nodeType: ExpressionNodeType.Expression,
      },
    ],
    groupType: ExpressionGroupType.And,
    id: 'root',
    nodeType: ExpressionNodeType.Group,
  };
}

function normalizeConfig(config: unknown): IExpressionGroup {
  if (
    config &&
    typeof config === 'object' &&
    'nodeType' in config &&
    (config as { nodeType?: string }).nodeType === ExpressionNodeType.Group &&
    'children' in config
  ) {
    return config as IExpressionGroup;
  }

  return createDefaultExpressionGroup();
}

const rootExpression = ref<IExpressionGroup>(
  normalizeConfig(selectNode.value.config),
);

function handleExpressionChange(exp: IExpressionGroup) {
  rootExpression.value = exp;
}

materialUi.value.handleConfirm = () => {
  selectNode.value.config = rootExpression.value;
  nodeStore.selectedNode = undefined;
};
</script>

<template>
  <ExpressionGroup
    root
    :value="rootExpression"
    :on-change="handleExpressionChange"
  />
</template>
