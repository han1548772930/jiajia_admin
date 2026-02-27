<template>
  <Space>
    <Input
      :value="fieldName"
      class="min-w-[140px]"
      placeholder="字段名"
      @update:value="(val) => updateFieldName(val as string)"
    />
    <OperatorSelect
      :value="props.value?.operator"
      :on-change="(operator) => emitChange({ operator })"
    />
    <Input
      :value="fieldValue"
      class="min-w-[140px]"
      placeholder="比较值"
      @update:value="(val) => updateFieldValue(val as string)"
    />
  </Space>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { Input, Space } from 'antdv-next';

import {
  ExpressionNodeType,
  type ExpressionInputProps,
  type IExpression,
} from '#/views/workflow/designer/interfaces/setting';
import { createUuid } from '#/views/workflow/designer/utils/create-uuid';

import OperatorSelect from './operatorselect.vue';

const props = defineProps<ExpressionInputProps>();

const fieldName = computed(() => String(props.value?.name ?? ''));
const fieldValue = computed(() => String(props.value?.value ?? ''));

function emitChange(patch: Partial<IExpression>) {
  const next: IExpression = {
    id: props.value?.id ?? createUuid(),
    nodeType: props.value?.nodeType ?? ExpressionNodeType.Expression,
    ...props.value,
    ...patch,
  };

  props.onChange?.(next);
}

function updateFieldName(name: string) {
  emitChange({ name });
}

function updateFieldValue(value: string) {
  emitChange({ value });
}
</script>
