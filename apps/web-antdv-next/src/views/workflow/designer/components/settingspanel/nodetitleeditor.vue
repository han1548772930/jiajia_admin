<template>
  <TypographyParagraph
    class="!mb-0 w-full max-w-full text-[inherit] leading-[inherit]"
    :ellipsis="{ rows: 1, tooltip: inputValue }"
    :editable="editableConfig"
  >
    {{ inputValue }}
  </TypographyParagraph>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { TypographyParagraph } from 'antdv-next';

const props = defineProps<{
  onChange: (value: string) => void;
  value: string;
}>();

const editing = ref(false);
const inputValue = ref(props.value);

watch(
  () => props.value,
  (value) => {
    if (!editing.value) {
      inputValue.value = value;
    }
  },
);

const editableConfig = computed(() => {
  return {
    onCancel: () => {
      editing.value = false;
      inputValue.value = props.value;
    },
    onChange: (value: string) => {
      inputValue.value = value;
    },
    onEnd: () => {
      editing.value = false;
      props.onChange(inputValue.value);
    },
    onStart: () => {
      editing.value = true;
    },
    text: inputValue.value,
    triggerType: ['icon', 'text'] as Array<'icon' | 'text'>,
  };
});
</script>
