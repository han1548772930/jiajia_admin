<template>
  <Select
    :value="props.value"
    :options="options"
    class="min-w-[120px]"
    placeholder="运算符"
    @change="(val) => props.onChange?.(val as OperatorType)"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { Select } from 'antdv-next';

import { OperatorType } from '#/views/workflow/designer/interfaces/setting';

const props = defineProps<{
  onChange?: (operator?: OperatorType) => void;
  value?: OperatorType;
}>();

const options = computed(() => [
  { label: '等于', value: OperatorType.Eq },
  { label: '不等于', value: OperatorType.Ne },
  { label: '大于', value: OperatorType.Gt },
  { label: '小于', value: OperatorType.Lt },
  { label: '小于等于', value: OperatorType.Le },
  { label: '大于等于', value: OperatorType.Ge },
  { label: '包含', value: OperatorType.Like },
  { label: '开头包含', value: OperatorType.LikeStart },
  { label: '结尾包含', value: OperatorType.LikeEnd },
  { label: '不为空', value: OperatorType.NotEmpty },
  { label: '为空', value: OperatorType.Empty },
]);
</script>
