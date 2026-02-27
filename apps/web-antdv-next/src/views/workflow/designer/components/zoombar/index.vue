<template>
  <div
    :class="[
      'absolute right-8 top-[60px] flex items-center select-none rounded-[5px] bg-white px-2 py-1 shadow-[0_2px_8px_0_rgba(0,0,0,0.15)] transition-all duration-300',
      float ? 'scale-105 shadow-[0_2px_8px_0_rgba(0,0,0,0.5)]' : '',
    ]"
  >
    <Space>
      <Button type="text" size="small" :disabled="zoom <= 0.1" @click="onZoomOut">
        <IconifyIcon icon="lucide:minus" />
      </Button>
      {{ Math.round(zoom * 100) }}%
      <Button type="text" size="small" :disabled="zoom >= 3" @click="onZoomIn">
        <IconifyIcon icon="lucide:plus" />
      </Button>
    </Space>
  </div>
</template>

<script setup lang="ts">
import { toRefs } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { Button, Space } from 'antdv-next';

const props = defineProps<{
  float: boolean;
  onZoomIn: (e: MouseEvent) => void;
  onZoomOut: (e: MouseEvent) => void;
  zoom: number;
}>();

const { float, onZoomIn, onZoomOut, zoom } = toRefs(props);
</script>
