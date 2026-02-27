<template>
  <Dropdown :menu="{ items, onClick: handleMenuClick }" :trigger="['click']" @open-change="handleOpenChange">
    <slot />
  </Dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { Dropdown } from 'antdv-next';

import { ExpressionGroupType, ExpressionNodeType } from '#/views/workflow/designer/interfaces/setting';

interface Props {
  onAddExpression: () => void;
  onAddGroup: (groupType: ExpressionGroupType) => void;
  onOpenChange?: (open: boolean) => void;
}

const props = defineProps<Props>();

const items = computed(() => [
  {
    key: ExpressionNodeType.Expression,
    label: '添加条件',
  },
  {
    key: ExpressionGroupType.And,
    label: '添加且组',
  },
  {
    key: ExpressionGroupType.Or,
    label: '添加或组',
  },
]);

function handleMenuClick({ key }: { key: string }) {
  if (key === ExpressionNodeType.Expression) {
    props.onAddExpression();
    return;
  }

  if (key === ExpressionGroupType.And || key === ExpressionGroupType.Or) {
    props.onAddGroup(key as ExpressionGroupType);
  }
}

function handleOpenChange(open: boolean) {
  props.onOpenChange?.(open);
}
</script>
