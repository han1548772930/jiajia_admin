<template>
  <div class="relative flex select-none text-left text-xs leading-4 text-[rgba(0,0,0,0.65)]">
    <template v-if="!editing">
      <div class="flex flex-1 items-center py-[2px]" @click.stop="handleNameClick">
        <div
          class="w-[150px] select-none overflow-hidden border border-transparent text-ellipsis whitespace-nowrap hover:border-b hover:border-dashed hover:leading-4"
        >
          {{ node.name || 'condition' }}
        </div>
      </div>
      <ConditionButtons :parent="parent" :node="node" />
    </template>
    <template v-else>
      <Input
        ref="inputRef"
        v-model:value="inputValue"
        class="z-[1] h-[18px] flex-1 rounded border-0 bg-white pl-1 text-xs indent-0 leading-[18px] outline outline-2 outline-[rgba(80,80,80,0.3)]"
        @blur="handleBlur"
        @keydown.enter="handleBlur"
        @click.stop="handleInputClick"
      />
    </template>
    <ConditionPriority v-if="!editing" :index="index" />
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';

import { Input } from 'antdv-next';

import type { IBranchNode, IRouteNode } from '#/views/workflow/designer/interfaces';
import ConditionButtons from '#/views/workflow/designer/components/nodes/routenode/conditionbuttons.vue';
import ConditionPriority from '#/views/workflow/designer/components/nodes/routenode/conditionpriority.vue';

const props = defineProps<{
  node: IBranchNode;
  parent: IRouteNode;
  index: number;
}>();

const inputRef = ref<{ focus?: () => void } | null>(null);
const editing = ref(false);
const inputValue = ref(props.node.name ?? '');

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
