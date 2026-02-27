<template>
  <div
    class="relative flex h-6 w-full select-none items-center rounded-t rounded-b-none pl-4 pr-[30px] text-left text-xs leading-6 text-white"
    :style="{ backgroundColor: material?.color }"
  >
    <div class="mr-2 text-sm">
      <component :is="iconComponent" v-if="iconComponent" />
    </div>
    <div v-if="!editing" class="flex flex-1 items-center py-[2px]" @click="handleNameClick">
      <TypographyParagraph
        class="!mb-0 w-[150px] overflow-hidden border border-transparent text-ellipsis whitespace-nowrap leading-5 [color:inherit] [font-size:inherit] [font-weight:inherit] hover:border-b hover:border-dashed hover:border-b-white hover:leading-4"
        :ellipsis="{ rows: 1, tooltip: inputValue }"
      >
        {{ inputValue }}
      </TypographyParagraph>
    </div>
    <CloseButton v-if="!editing" :node-id="node.id" />
    <Input
      v-if="editing"
      ref="inputRef"
      v-model:value="inputValue"
      class="z-[1] h-[18px] flex-1 rounded border-0 bg-white pl-1 text-xs indent-0 leading-[18px] outline outline-2 outline-[rgba(80,80,80,0.3)]"
      @blur="handleBlur"
      @keydown.enter="handleBlur"
      @click.stop="handleInputClick"
    />
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';

import { Input, TypographyParagraph } from 'antdv-next';

import type { IWorkFlowNode } from '#/views/workflow/designer/interfaces';
import type { INodeMaterial } from '#/views/workflow/designer/interfaces/material';
import CloseButton from '#/views/workflow/designer/components/nodes/closebutton.vue';

const props = defineProps<{
  node: IWorkFlowNode;
  material?: INodeMaterial;
}>();

const iconComponent = props.material?.icon;
const editing = ref(false);
const inputValue = ref(props.node.name ?? '');
const inputRef = ref<{ focus?: () => void } | null>(null);

watch(
  () => props.node.name,
  (value) => {
    if (!editing.value) {
      inputValue.value = value ?? '';
    }
  },
  { immediate: true },
);

watch(editing, (value) => {
  if (value) {
    nextTick(() => {
      inputRef.value?.focus?.();
    });
  }
});

const handleNameClick = (e: MouseEvent) => {
  e.stopPropagation();
  editing.value = true;
};

const handleInputClick = (e: MouseEvent) => {
  e.stopPropagation();
};

const handleBlur = () => {
  props.node.name = inputValue.value;
  editing.value = false;
};
</script>
