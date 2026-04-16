<script setup lang="ts">
import type { CSSProperties, PropType, Ref, VNode } from 'vue';

import {
  cloneVNode,
  computed,
  isVNode,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue';

import { useElementSize, useVirtualList } from '@vueuse/core';

import { responsiveFontSize } from '../utils/responsive';

const props = defineProps({
  header: { type: Array as PropType<string[]>, default: () => [] },
  data: { type: Array as PropType<TableRow[]>, default: () => [] },
  rowNum: { type: Number, default: 5 },
  headerBgc: { type: String, default: '#00BAFF' },
  oddRowBgc: { type: String, default: '#003B51' },
  evenRowBgc: { type: String, default: '#0A2732' },
  waitTime: { type: Number, default: 2000 },
  headerHeight: { type: Number, default: 35 },
  rowHeight: { type: Number, default: 35 },
  columnWidth: {
    type: Array as PropType<Array<number | string>>,
    default: () => [],
  },
  align: { type: Array as PropType<string[]>, default: () => [] },
  index: { type: Boolean, default: false },
  indexHeader: { type: String, default: '#' },
  carousel: {
    type: String,
    default: 'single',
    validator: (v: string) => ['page', 'single'].includes(v),
  },
  hoverPause: { type: Boolean, default: true },
  fontSize: { type: Number, default: 12 },
  animateScroll: { type: Boolean, default: true },
  animationDuration: { type: Number, default: 380 },
});

const RESET_DELAY = 16;

type TableCell = unknown;
type TableRow = TableCell[];
type VirtualRow = { loopIndex: number; row: TableRow; sourceIndex: number };
type ColumnTrackSize = number | string;

const isHovering = ref(false);
const rootRef = ref<HTMLElement | null>(null);
const timer = ref<null | ReturnType<typeof setInterval>>(null);
const resetTimer = ref<null | ReturnType<typeof setTimeout>>(null);
const isAnimating = ref(false);
const transitionEnabled = ref(false);
const translateOffset = ref(0);
const totalRows = computed(() => props.data.length);
const { height: rootHeight } = useElementSize(rootRef);
const minRowHeight = computed(() =>
  Math.max(22, Math.ceil(fontSize.value * 1.35)),
);
const resolvedBodyHeight = computed(() => {
  const availableHeight = rootHeight.value - props.headerHeight;
  if (availableHeight > 0) return availableHeight;
  return Math.max(props.rowNum, 1) * minRowHeight.value;
});
const actualRowHeight = computed(() => {
  const dynamicHeight = resolvedBodyHeight.value / Math.max(props.rowNum, 1);
  return Math.max(18, Math.floor(dynamicHeight));
});
const bodyHeight = computed(
  () => actualRowHeight.value * Math.max(props.rowNum, 1),
);
const stepRows = computed(() =>
  props.carousel === 'page' ? Math.max(props.rowNum, 1) : 1,
);
const visibleRowCount = computed(() => Math.max(1, props.rowNum));
const needsScroll = computed(() => totalRows.value > visibleRowCount.value);
const getCellContentStyle = (columnIndex: number): CSSProperties => ({
  maxWidth: '100%',
  minWidth: '0',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: getAlignStyle(columnIndex),
  textAlign:
    props.align[columnIndex] === 'center'
      ? 'center'
      : (props.align[columnIndex] === 'right'
        ? 'right'
        : 'left'),
  overflow: 'hidden',
  gap: `${Math.max(3, Math.floor(actualRowHeight.value * 0.1))}px`,
});
const cellInnerStyle = computed<CSSProperties>(() => ({
  maxWidth: '100%',
  minWidth: '0',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  whiteSpace: 'normal',
  overflow: 'hidden',
  wordBreak: 'break-word',
  overflowWrap: 'anywhere',
}));
const cellTextStyle = computed<CSSProperties>(() => ({
  width: '100%',
  minWidth: '0',
  display: 'block',
  whiteSpace: 'normal',
  wordBreak: 'break-word',
  overflowWrap: 'anywhere',
}));

const normalizeColumnTrackSize = (size?: ColumnTrackSize) => {
  if (typeof size === 'number') {
    return size > 0 ? `minmax(0, ${size}fr)` : 'minmax(0, 1fr)';
  }

  if (typeof size === 'string') {
    const value = size.trim();
    return value || 'minmax(0, 1fr)';
  }

  return 'minmax(0, 1fr)';
};

const gridTemplateColumns = computed(() => {
  const columns: string[] = [];
  if (props.index) columns.push('minmax(0, 0.6fr)');
  props.header.forEach((_, i) => {
    columns.push(normalizeColumnTrackSize(props.columnWidth[i]));
  });
  return columns.join(' ');
});

const fontSize = computed(() => responsiveFontSize(props.fontSize));

const loopedData = computed<VirtualRow[]>(() => {
  if (!totalRows.value) return [];
  const copies = needsScroll.value ? 3 : 1;
  return Array.from({ length: totalRows.value * copies }, (_, loopIndex) => ({
    row: props.data[loopIndex % totalRows.value] ?? [],
    sourceIndex: loopIndex % totalRows.value,
    loopIndex,
  }));
});

const virtualWrapperStyle = computed<CSSProperties>(() => ({
  transform: `translateY(${translateOffset.value}px)`,
  transition: transitionEnabled.value
    ? `transform ${props.animationDuration}ms ease-in-out`
    : 'none',
  willChange: props.animateScroll ? 'transform' : 'auto',
}));

const {
  list: virtualRows,
  containerProps,
  wrapperProps,
  scrollTo,
} = useVirtualList(loopedData, {
  itemHeight: () => actualRowHeight.value,
  overscan: Math.max(visibleRowCount.value * 2, 8),
});

const bodyRef = containerProps.ref as Ref<HTMLElement | null>;
const handleVirtualRange = containerProps.onScroll as (() => void) | undefined;
const containerStyle = containerProps.style as
  | Record<string, string>
  | undefined;

const mergedContainerProps = computed(() => ({
  ...(containerProps as Record<string, unknown>),
  ref: bodyRef,
  onScroll: handleBodyScroll,
  style: {
    ...containerStyle,
    height: `${bodyHeight.value}px`,
    overflowX: 'hidden',
    overflowY: needsScroll.value ? 'auto' : 'hidden',
    scrollBehavior: 'auto',
  } as CSSProperties,
}));

const getAlignStyle = (columnIndex: number) => {
  const alignValue = props.align[columnIndex];
  if (alignValue === 'center') return 'center';
  if (alignValue === 'right') return 'flex-end';
  return 'flex-start';
};

const getCellStyle = (columnIndex: number): CSSProperties => ({
  padding: `${Math.max(2, Math.floor(fontSize.value * 0.15))}px ${Math.max(3, Math.floor(fontSize.value * 0.4))}px`,
  fontSize: `${fontSize.value}px`,
  justifyContent: getAlignStyle(columnIndex),
  textAlign:
    props.align[columnIndex] === 'center'
      ? 'center'
      : (props.align[columnIndex] === 'right'
        ? 'right'
        : 'left'),
});

const getRowBgColor = (sourceIndex: number) => {
  return (sourceIndex + 1) % 2 === 0 ? props.evenRowBgc : props.oddRowBgc;
};

const cloneCellVNode = (
  cell: TableCell,
  rowKey: number | string,
  columnIndex: number,
) => {
  if (!isVNode(cell)) return null;
  return cloneVNode(cell as VNode, {
    key: `${rowKey}-${columnIndex}`,
  });
};

const syncVirtualRange = () => {
  handleVirtualRange?.();
};

const jumpToIndex = (index: number) => {
  if (!bodyRef.value) return;
  transitionEnabled.value = false;
  translateOffset.value = 0;
  scrollTo(index);
  bodyRef.value.scrollTop = index * actualRowHeight.value;
  syncVirtualRange();
};

const clearResetTimer = () => {
  if (resetTimer.value) {
    clearTimeout(resetTimer.value);
    resetTimer.value = null;
  }
};

const resetToMiddle = () => {
  jumpToIndex(0);
};

const normalizeLoopPosition = () => {
  if (!needsScroll.value || !bodyRef.value || isAnimating.value) return;
  const currentIndex = Math.round(
    bodyRef.value.scrollTop / actualRowHeight.value,
  );
  if (currentIndex >= totalRows.value * 2) {
    jumpToIndex(currentIndex - totalRows.value);
  } else if (currentIndex < totalRows.value) {
    jumpToIndex(currentIndex + totalRows.value);
  }
};

const scrollByStep = () => {
  if (!needsScroll.value || !bodyRef.value) return;

  isAnimating.value = true;
  const nextIndex =
    Math.round(bodyRef.value.scrollTop / actualRowHeight.value) +
    stepRows.value;

  if (!props.animateScroll) {
    jumpToIndex(nextIndex);
    clearResetTimer();
    resetTimer.value = setTimeout(() => {
      isAnimating.value = false;
      normalizeLoopPosition();
    }, RESET_DELAY);
    return;
  }

  transitionEnabled.value = true;
  translateOffset.value = -actualRowHeight.value * stepRows.value;

  clearResetTimer();
  resetTimer.value = setTimeout(() => {
    transitionEnabled.value = false;
    translateOffset.value = 0;
    jumpToIndex(nextIndex);
    isAnimating.value = false;
    normalizeLoopPosition();
  }, props.animationDuration + RESET_DELAY);
};

const startTimer = () => {
  stopTimer();
  if (!needsScroll.value) return;

  timer.value = setInterval(() => {
    if (isHovering.value && props.hoverPause) return;
    scrollByStep();
  }, props.waitTime);
};

const stopTimer = () => {
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }
  clearResetTimer();
  isAnimating.value = false;
};

const handleMouseEnter = () => {
  isHovering.value = true;
};

const handleMouseLeave = () => {
  isHovering.value = false;
};

const handleBodyScroll = () => {
  syncVirtualRange();
  if (!isAnimating.value) normalizeLoopPosition();
};

const resetState = () => {
  stopTimer();
  if (!totalRows.value) return;
  resetToMiddle();
  startTimer();
};

watch(
  () => [
    props.data,
    props.rowNum,
    props.rowHeight,
    props.carousel,
    bodyHeight.value,
    props.animateScroll,
    props.animationDuration,
  ],
  () => {
    resetState();
  },
  { deep: true },
);

onMounted(() => {
  resetState();
});

onUnmounted(() => {
  stopTimer();
});
</script>

<template>
  <div
    ref="rootRef"
    class="w-full h-full relative select-none font-sans overflow-hidden"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div
      class="w-full grid items-center"
      :style="{
        height: `${headerHeight}px`,
        backgroundColor: headerBgc,
        gridTemplateColumns,
      }"
    >
      <div
        v-if="index"
        class="flex items-center justify-center font-bold truncate header-text"
        :style="{
          fontSize: `${fontSize}px`,
        }"
      >
        {{ indexHeader }}
      </div>

      <div
        v-for="(title, i) in header"
        :key="i"
        class="flex items-center font-bold overflow-hidden whitespace-nowrap px-2 truncate header-text"
        :style="{
          justifyContent: getAlignStyle(i),
          fontSize: `${fontSize}px`,
        }"
      >
        {{ title }}
      </div>
    </div>

    <div v-bind="mergedContainerProps" class="w-full relative carousel-body">
      <div
        v-bind="wrapperProps"
        :style="[wrapperProps.style, virtualWrapperStyle]"
      >
        <div
          v-for="item in virtualRows"
          :key="`${item.index}-${item.data.loopIndex}`"
          class="w-full grid items-center"
          :style="{
            height: `${actualRowHeight}px`,
            backgroundColor: getRowBgColor(item.data.sourceIndex),
            gridTemplateColumns,
          }"
        >
          <div
            v-if="index"
            class="flex items-center justify-center text-slate-600 truncate row-text row-index"
            :style="{
              fontSize: `${fontSize}px`,
            }"
          >
            {{ item.data.sourceIndex + 1 }}
          </div>

          <div
            v-for="(cell, cIndex) in item.data.row"
            :key="cIndex"
            class="row-text h-full min-w-0 overflow-hidden flex items-center"
            :style="getCellStyle(cIndex)"
          >
            <div class="cell-content" :style="getCellContentStyle(cIndex)">
              <component
                v-if="isVNode(cell)"
                :is="cloneCellVNode(cell, item.data.loopIndex, cIndex)"
                class="cell-content-inner"
                :style="cellInnerStyle"
              />
              <span v-else class="cell-text-ellipsis" :style="cellTextStyle">{{
                cell
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header-text,
.row-text,
.row-index {
  box-sizing: border-box;
  margin: 0;
}

.grid > * {
  min-width: 0;
}

.carousel-body {
  scrollbar-width: none;
  background: transparent;
}

.carousel-body::-webkit-scrollbar {
  display: none;
}

.header-text {
  font-size: 12px;
  line-height: 1.05;
  color: #1e3a8a;
}

.row-text {
  font-size: 12px;
  line-height: 1.2;
  color: #475569;
}

.row-index {
  font-weight: 600;
  color: #475569;
}

.cell-content,
.cell-content-inner {
  display: flex;
  align-items: center;
  min-width: 0;
  height: 100%;
}

.cell-content {
  width: 100%;
  overflow: hidden;
}

.cell-text-ellipsis {
  display: block;
  width: 100%;
  min-width: 0;
  word-break: normal;
  overflow-wrap: anywhere;
  white-space: normal;
}

:deep(.cell-content-inner),
:deep(.cell-content-inner > *) {
  min-width: 0;
  max-width: 100%;
}

:deep(.cell-content-inner > *) {
  display: flex;
  align-items: center;
  overflow: hidden;
}

:deep(.cell-content-inner span),
:deep(.cell-content-inner div),
:deep(.cell-content-inner p) {
  min-width: 0;
  word-break: normal;
  overflow-wrap: anywhere;
  white-space: normal;
}

:deep(.cell-content-inner img) {
  flex-shrink: 0;
  width: auto;
  height: 82%;
  min-height: 12px;
  max-height: calc(100% - 4px);
  aspect-ratio: 1 / 1;
  object-fit: cover;
}
</style>
