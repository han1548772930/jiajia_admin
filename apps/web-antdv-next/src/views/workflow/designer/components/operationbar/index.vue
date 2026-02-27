<template>
  <div
    :class="[
      'absolute left-8 top-[60px] flex items-center select-none rounded-[5px] bg-white px-2 py-1 shadow-[0_2px_8px_0_rgba(0,0,0,0.15)] transition-all duration-300',
      float ? 'scale-105 shadow-[0_2px_8px_0_rgba(0,0,0,0.5)]' : '',
    ]"
  >
    <Button type="text" size="small" :disabled="undoList === 0" @click="handleUndo">
      <template #icon>
        <IconifyIcon icon="lucide:undo-2" />
      </template>
    </Button>
    <Button type="text" size="small" :disabled="redoList === 0" @click="handleRedo">
      <template #icon>
        <IconifyIcon icon="lucide:redo-2" />
      </template>
    </Button>
  </div>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { Button } from 'antdv-next';

import useNodeStore from '#/store/workflow/node';

const props = defineProps<{ float?: boolean }>();
const { float } = toRefs(props);

const nodeStore = useNodeStore();

const undoList = computed(() => nodeStore.undoList.length);
const redoList = computed(() => nodeStore.redoList.length);

const handleUndo = () => {
  nodeStore.undo();
};

const handleRedo = () => {
  nodeStore.redo();
};
</script>
