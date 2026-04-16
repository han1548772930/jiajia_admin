<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { useDebounceFn, useResizeObserver } from '@vueuse/core';
import { BarChart, LineChart } from 'echarts/charts';
import {
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  TransformComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import {
  LabelLayout,
  LegacyGridContainLabel,
  UniversalTransition,
} from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

defineOptions({ name: 'DashboardChart' });

const props = defineProps<{
  option: Record<string, any>;
}>();

echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent,
  ToolboxComponent,
  LineChart,
  BarChart,
  LabelLayout,
  LegacyGridContainLabel,
  UniversalTransition,
  CanvasRenderer,
]);

const chartRef = ref<HTMLElement>();
let chart: echarts.ECharts | null = null;

const resize = useDebounceFn(() => {
  chart?.resize({
    animation: { duration: 200, easing: 'quadraticInOut' },
  });
}, 120);

function render(notMerge = true) {
  if (!chartRef.value) return;
  if (!chart) chart = echarts.init(chartRef.value);
  chart.setOption(props.option, { notMerge, lazyUpdate: true });
}

onMounted(() => {
  render(true);
  useResizeObserver(chartRef, resize);
});

watch(
  () => props.option,
  () => render(true),
  { deep: true },
);

onBeforeUnmount(() => {
  chart?.dispose();
  chart = null;
});
</script>

<template>
  <div ref="chartRef" class="chart-root"></div>
</template>

<style scoped>
.chart-root {
  width: 100%;
  height: 100%;
}
</style>
