<template>
  <div class="grid grid-cols-[auto,1fr] items-center gap-x-3">
    <Radio class="min-h-8 flex items-center text-sm text-foreground" :checked="checked" @change="onSelect">
      {{ label }}
    </Radio>
    <div class="min-h-8 flex items-center gap-2 text-sm text-foreground">
      <slot />
    </div>
  </div>
</template>

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
