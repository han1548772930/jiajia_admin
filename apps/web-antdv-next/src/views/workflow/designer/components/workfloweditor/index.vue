<template>
  <div class="flex h-full w-full flex-col box-border">
    <div
      ref="canvasRef"
      :class="[
        'flex flex-1 justify-center overflow-auto px-4 pt-[30px] pb-0',
        state.mousePressedPoint ? 'cursor-grabbing' : 'cursor-grab',
      ]"
      @mousedown="handleMouseDown"
      @mouseup="handleMouseUp"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseUp"
      @scroll="handleScroll"
    >
      <div class="flex-1 origin-top-left" :style="{ transform: `scale(${state.zoom})` }">
        <StartNode />
      </div>
    </div>
    <OperationBar :float="state.scrolled" />
    <ZoomBar :float="state.scrolled" :zoom="state.zoom" @zoom-in="handleZoomIn" @zoom-out="handleZoomOut" />
    <SettingsPanel />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';

import type { IPosition } from '#/views/workflow/designer/interfaces';
import OperationBar from '#/views/workflow/designer/components/operationbar/index.vue';
import SettingsPanel from '#/views/workflow/designer/components/settingspanel/index.vue';
import StartNode from '#/views/workflow/designer/components/nodes/startnode.vue';
import ZoomBar from '#/views/workflow/designer/components/zoombar/index.vue';

const state = reactive({
  zoom: 1,
  scrolled: false,
  mousePressedPoint: null as IPosition | null,
});

const canvasRef = ref<HTMLDivElement | null>(null);

const toDecimal = (x: number) => {
  return Math.round(x * 10) / 10;
};

const handleZoomIn = () => {
  state.zoom = toDecimal(state.zoom < 3 ? state.zoom + 0.1 : state.zoom);
};

const handleZoomOut = () => {
  state.zoom = toDecimal(state.zoom > 0.1 ? state.zoom - 0.1 : state.zoom);
};

const handleMouseDown = (e: MouseEvent) => {
  if (!canvasRef.value) return;

  state.mousePressedPoint = {
    x: e.clientX,
    y: e.clientY,
    scrollLeft: canvasRef.value.scrollLeft,
    scrollTop: canvasRef.value.scrollTop,
  };
};

const handleMouseUp = () => {
  state.mousePressedPoint = null;
};

const handleMouseMove = (e: MouseEvent) => {
  if (!state.mousePressedPoint || !canvasRef.value) {
    return;
  }

  const dragMoveDiff = {
    x: state.mousePressedPoint.x - e.clientX,
    y: state.mousePressedPoint.y - e.clientY,
  };

  canvasRef.value.scrollLeft = state.mousePressedPoint.scrollLeft + dragMoveDiff.x;
  canvasRef.value.scrollTop = state.mousePressedPoint.scrollTop + dragMoveDiff.y;
};

const handleScroll = (e: Event) => {
  const target = e.currentTarget as HTMLDivElement;
  state.scrolled = target.scrollTop > 60 || target.scrollLeft > 60;
};
</script>
