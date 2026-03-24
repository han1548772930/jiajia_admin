<script setup lang="ts">
import { Radio } from 'antdv-next';

defineProps<{
  checked: boolean;
  label: string;
}>();

const emit = defineEmits<{
  select: [];
}>();

const onSelect = () => {
  emit('select');
};
</script>

<template>
  <div class="flex items-center gap-3">
    <div class="flex h-8 w-28 shrink-0 items-center">
      <Radio
        class="inline-flex items-center text-sm leading-none text-foreground"
        :checked="checked"
        @change="onSelect"
      >
        {{ label }}
      </Radio>
    </div>
    <div
      class="flex min-h-8 flex-1 flex-wrap items-center gap-2 text-sm text-foreground"
    >
      <slot></slot>
    </div>
  </div>
</template>
