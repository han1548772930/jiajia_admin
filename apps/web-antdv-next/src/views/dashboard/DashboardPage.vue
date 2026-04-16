<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  h,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue';

import { useAccessStore } from '@vben/stores';

import {
  Button,
  BorderBox10 as DvBorderBox10,
  BorderBox11 as DvBorderBox11,
} from '@kjgl77/datav-vue3';
import {
  useDebounceFn,
  useFullscreen,
  useIntervalFn,
  useResizeObserver,
  useWindowSize,
} from '@vueuse/core';
import { Image } from 'antdv-next';

import {
  getRedemptionListDataApi,
  getRegionRankDataApi,
  getStaffRankDataApi,
  loginByDashboardApi,
} from '#/api/dashboard';

import VerticalCarouselTable from './components/VerticalCarouselTable.vue';

import crownFirst from '/static/排名皇冠.svg';
import crownSecond from '/static/排名皇冠 (1).svg';
import crownThird from '/static/排名皇冠 (2).svg';

const ImagePreviewGroup = defineAsyncComponent(() =>
  import('antdv-next/dist/image/index').then((res) => res.ImagePreviewGroup),
);

type NoticeItem = {
  text: string;
  type: 'item' | 'section' | 'title';
};

const currentDate = ref(new Date());
const currentMonth = computed(() => currentDate.value.getMonth() + 1);

const pointsRules = computed<NoticeItem[]>(() => [
  { text: '公告栏', type: 'title' },
  { text: '佳佳乐潮玩积分获取规则', type: 'section' },
  { text: '1.新用户注册得50分', type: 'item' },
  { text: '2.线上线下任意消费1:1积分', type: 'item' },
  { text: '3.线下前台签到打卡积10分(日一次)', type: 'item' },
  { text: '4.线下老带新得50分', type: 'item' },
  { text: '5.参加店内活动/赛事积分', type: 'item' },
  { text: '6.其他获取途径逐步增加', type: 'item' },
  { text: `${currentMonth.value}月积分榜奖励`, type: 'section' },
  { text: '第一 16.0瘦2盒', type: 'item' },
  { text: '第二 151惊硬币套装1盒', type: 'item' },
  { text: '第三 宝石包徽章套装1包', type: 'item' },
  { text: `${currentMonth.value}月签到榜`, type: 'section' },
  { text: '第一 30周年庆典礼盒1盒', type: 'item' },
  { text: '第二 训练家收藏礼盒周边任选', type: 'item' },
  { text: '第三 伊布进阶卡套任选', type: 'item' },
]);

const redemptionImageClass =
  'h-full w-auto aspect-square rounded-md object-cover border border-slate-200 bg-slate-100 flex-shrink-0';
const redemptionImageWrapperClass =
  'flex h-full w-full items-center justify-center';
const redemptionRankWrapperClass =
  'flex items-center justify-center gap-1 min-w-0 pl-1';
const leaderboardRankWrapperClass =
  'flex items-center justify-start gap-1 min-w-0 pl-1';
const redemptionRankTextClass = 'leading-none font-semibold';
type DashboardTableCell = ReturnType<typeof h> | string;

const hiddenRankCrownClass =
  'rank-crown rank-crown-hidden w-auto flex-shrink-0';
const leaderboardRankCrownClass = 'rank-crown w-auto flex-shrink-0';
const crownAssetUrls = [crownFirst, crownSecond, crownThird];

const staffRankData = ref<DashboardTableCell[][]>([]);

const regionRankData = ref<DashboardTableCell[][]>([]);

const redemptionSourceRows = ref<string[][]>([]);
const redemptionListData = ref<DashboardTableCell[][]>([]);
const redemptionPreviewVisible = ref(false);
const redemptionPreviewCurrent = ref(0);
const accessStore = useAccessStore();
const target = import.meta.env.VITE_APP_TARGET || 'admin';
const isAdminTarget = target === 'admin';
const previousAccessToken = ref<null | string>(null);
const dashboardAccessReady = ref(false);
const { width: viewportWidth, height: viewportHeight } = useWindowSize();

const rootRef = ref<HTMLElement | null>(null);
const datavReady = ref(false);
const layoutRerenderKey = ref(0);
const isRefreshingData = ref(false);
const { isFullscreen, enter, exit, toggle } = useFullscreen(rootRef);

// 已修复 Unicode 乱码
const dashboardTitle = '佳佳乐潮玩智慧看板';
const fullscreenEnterLabel = '全屏';
const fullscreenExitLabel = '退出全屏';
const themeDarkLabel = '深色';
const themeLightLabel = '浅色';

function syncCurrentDate() {
  currentDate.value = new Date();
  time.value = formatNow(currentDate.value);
}

const formatNow = (value = new Date()) =>
  value.toLocaleString('zh-CN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

const time = ref(formatNow(currentDate.value));
const isCompactLandscape = computed(
  () =>
    viewportWidth.value > viewportHeight.value &&
    viewportHeight.value <= 540 &&
    viewportWidth.value <= 960,
);
const pageScale = computed(() => {
  const scale = Math.min(
    viewportWidth.value / 1920,
    viewportHeight.value / 1080,
  );
  return Math.max(isCompactLandscape.value ? 0.44 : 0.65, scale);
});
const scaleSize = (base: number, min = 12, max = Number.POSITIVE_INFINITY) => {
  return Math.min(max, Math.max(min, Math.round(base * pageScale.value)));
};
const titleFontSize = computed(() =>
  scaleSize(isCompactLandscape.value ? 18 : 30, 16, 36),
);
const titleWidth = computed(() =>
  scaleSize(isCompactLandscape.value ? 460 : 750, 360, 820),
);
const pointsRuleFontSize = computed(() =>
  scaleSize(isCompactLandscape.value ? 13 : 22, 11, 24),
);
const pointsRuleTitleFontSize = computed(() =>
  scaleSize(isCompactLandscape.value ? 16 : 30, 14, 30),
);
const pointsRuleLineHeight = computed(
  () =>
    `${isCompactLandscape.value ? 1.18 : Math.max(1.3, Number((pointsRuleFontSize.value / Math.max(12, pointsRuleFontSize.value - 4)).toFixed(2)))}`,
);
const toggleButtonFontSize = computed(() =>
  scaleSize(isCompactLandscape.value ? 11 : 16, 10, 16),
);
const actionBarTop = computed(() =>
  isCompactLandscape.value ? '10px' : '16px',
);
const actionBarLeft = computed(() =>
  isCompactLandscape.value ? '10px' : '16px',
);
const actionBarGap = computed(() =>
  isCompactLandscape.value ? '8px' : '10px',
);
const tableFontSize = computed(() =>
  scaleSize(isCompactLandscape.value ? 12 : 24, 11, 24),
);
const panelGap = computed(() => (isCompactLandscape.value ? '0.35%' : '1%'));
const leftPanelWidth = computed(() =>
  isCompactLandscape.value ? '20%' : '24%',
);
const productPanelWidth = computed(() =>
  isCompactLandscape.value ? '39%' : '40%',
);
const staffPanelWidth = computed(() =>
  isCompactLandscape.value ? '21%' : '28%',
);
const regionPanelWidth = computed(() =>
  isCompactLandscape.value ? '18%' : '24%',
);
const sectionSpacerHeight = computed(() =>
  isCompactLandscape.value ? '0.25%' : '4%',
);
const sectionTitleHeight = computed(() =>
  isCompactLandscape.value ? '5%' : '6%',
);
const sectionTitleOffset = computed(() =>
  isCompactLandscape.value ? 'translateY(-15px)' : 'none',
);
const sectionContentHeight = computed(() =>
  isCompactLandscape.value ? '95.25%' : '86%',
);
const productRowNum = computed(() => (isCompactLandscape.value ? 6 : 5));
const rankRowNum = computed(() => (isCompactLandscape.value ? 10 : 10));
const pointsPanelPaddingClass = computed(() =>
  isCompactLandscape.value ? 'px-2 py-1' : 'px-4 py-2',
);
const tableHeaderHeight = computed(() => (isCompactLandscape.value ? 24 : 35));

// 主题配置
const currentTheme = ref<'dark' | 'light'>('light');

const themeConfig = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderColor: ['#2f56d3', '#7f9cff'],
    textColor: '#334155',
    buttonBg: '#f1f5f9',
    buttonText: '#475569',
    buttonBorder: '#cbd5e1',
    tableHeader: '#dbeafe',
    tableRowOdd: '#f8fbff',
    tableRowEven: '#eef4ff',
    bg: '#eef3fb',
    titleColor: '#1e3a8a',
  },
  dark: {
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    borderColor: ['#1e40af', '#3b82f6'],
    textColor: '#e2e8f0',
    buttonBg: '#1e293b',
    buttonText: '#f1f5f9',
    buttonBorder: '#475569',
    tableHeader: '#1e3a5f',
    tableRowOdd: '#0f172a',
    tableRowEven: '#1e293b',
    bg: '#0f172a',
    titleColor: '#e2e8f0',
  },
};

function toggleTheme() {
  currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light';
}

async function handleToggleFullscreen() {
  try {
    await (isFullscreen.value ? exit() : enter());
  } catch {
    await toggle();
  }
}

function fontSize(base: number) {
  return scaleSize(base, 12, base);
}

const redemptionPreviewItems = computed(() =>
  redemptionSourceRows.value
    .map((row, sourceIndex) => ({
      sourceIndex,
      src: row[1] ?? '',
    }))
    .filter((item) => item.src),
);

function openRedemptionPreview(sourceIndex: number) {
  const previewIndex = redemptionPreviewItems.value.findIndex(
    (item) => item.sourceIndex === sourceIndex,
  );
  if (previewIndex === -1) return;

  redemptionPreviewCurrent.value = previewIndex;
  redemptionPreviewVisible.value = true;
}

function handleRedemptionPreviewOpenChange(open: boolean) {
  redemptionPreviewVisible.value = open;
}

function getPreviewContainer() {
  return rootRef.value ?? document.body;
}

function buildRankCell(rank: string, wrapperClass: string, crownClass: string) {
  const rankNumber = Number(rank);
  const crownSrc =
    Number.isInteger(rankNumber) && rankNumber >= 1 && rankNumber <= 3
      ? crownAssetUrls[rankNumber - 1]
      : '';

  return h('div', { class: wrapperClass }, [
    h('span', { class: redemptionRankTextClass }, rank || '--'),
    ...(crownSrc
      ? [
          h('img', {
            src: crownSrc,
            alt: `排名${rank}`,
            class: crownClass,
            style: {
              height: isCompactLandscape.value ? '0.8em' : '1.5em',
              width: 'auto',
              maxHeight: isCompactLandscape.value ? '0.8em' : '1.5em',
              flexShrink: 0,
            },
          }),
        ]
      : []),
  ]);
}

const mapRankRows = (rows: string[][]) =>
  rows.map((row) => {
    const [rank = '', ...rest] = row;
    return [
      buildRankCell(
        rank,
        leaderboardRankWrapperClass,
        leaderboardRankCrownClass,
      ),
      ...rest,
    ];
  });

const mapRedemptionRows = (rows: string[][]) =>
  rows.map((row, index) => {
    const rank = row[0] ?? '';
    const imageUrl = row[1] ?? '';
    const name = row[2] ?? '';
    const price = row[3] ?? '';
    const point = row[4] ?? '';
    const rankNumber = Number(rank);
    const crownSrc =
      Number.isInteger(rankNumber) && rankNumber >= 1 && rankNumber <= 3
        ? crownAssetUrls[rankNumber - 1]
        : '';

    return [
      h('div', { class: redemptionRankWrapperClass }, [
        h('span', { class: redemptionRankTextClass }, rank || '--'),
        ...(crownSrc
          ? [
              h('img', {
                src: crownSrc,
                alt: `排名${rank}`,
                class: hiddenRankCrownClass,
                style: {
                  height: isCompactLandscape.value ? '0.8em' : '1.5em',
                  width: 'auto',
                  maxHeight: isCompactLandscape.value ? '0.8em' : '1.5em',
                  flexShrink: 0,
                },
              }),
            ]
          : []),
      ]),
      imageUrl
        ? h('div', { class: redemptionImageWrapperClass }, [
            h('img', {
              src: imageUrl,
              alt: name || '商品图片',
              class: redemptionImageClass,
              style: { cursor: 'zoom-in' },
              onClick: () => openRedemptionPreview(index),
            }),
          ])
        : '--',
      name,
      price,
      point,
    ];
  });

async function getData() {
  if (isAdminTarget && !dashboardAccessReady.value) {
    previousAccessToken.value ??= accessStore.accessToken;
    await loginByDashboardApi();
    dashboardAccessReady.value = true;
  }

  const [staffRankRes, regionRankRes, redemptionListRes] = await Promise.all([
    getStaffRankDataApi(),
    getRegionRankDataApi(),
    getRedemptionListDataApi(),
  ]);

  staffRankData.value = mapRankRows((staffRankRes.Data as string[][]) || []);
  regionRankData.value = mapRankRows((regionRankRes.Data as string[][]) || []);
  redemptionSourceRows.value = (redemptionListRes.Data as string[][]) || [];
  redemptionListData.value = mapRedemptionRows(redemptionSourceRows.value);
}

async function refreshDashboardData() {
  if (isRefreshingData.value) return;

  syncCurrentDate();
  isRefreshingData.value = true;
  try {
    await getData();
    refreshLayout();
  } finally {
    isRefreshingData.value = false;
  }
}

const refreshLayout = useDebounceFn(() => {
  nextTick(() => {
    layoutRerenderKey.value += 1;
  });
}, 120);

useResizeObserver(rootRef, refreshLayout);

watch(
  [viewportWidth, viewportHeight, isCompactLandscape, isFullscreen],
  () => {
    refreshLayout();
  },
  { flush: 'post' },
);

useIntervalFn(
  () => {
    syncCurrentDate();
  },
  1000,
  { immediate: true },
);
useIntervalFn(refreshDashboardData, 600_000);

onMounted(() => {
  nextTick(() => {
    datavReady.value = true;
    refreshDashboardData();
    refreshLayout();
  });
});

onUnmounted(() => {
  if (isAdminTarget && previousAccessToken.value !== null) {
    accessStore.setAccessToken(previousAccessToken.value);
    previousAccessToken.value = null;
    dashboardAccessReady.value = false;
  }
});
</script>

<template>
  <div
    ref="rootRef"
    class="bg h-screen min-h-screen w-full overflow-hidden"
    :class="[currentTheme, { 'compact-landscape': isCompactLandscape }]"
  >
    <div
      v-if="false"
      class="hidden"
      :style="{
        top: actionBarTop,
        left: actionBarLeft,
        gap: actionBarGap,
      }"
    >
      <button
        @click="handleToggleFullscreen"
        class="rounded-lg shadow-lg transition-all duration-300 hover:scale-105"
        :style="{
          padding: isCompactLandscape ? '6px 10px' : '8px 16px',
          fontSize: `${toggleButtonFontSize}px`,
          backgroundColor: themeConfig[currentTheme].buttonBg,
          color: themeConfig[currentTheme].buttonText,
          border: `2px solid ${themeConfig[currentTheme].buttonBorder}`,
        }"
      >
        {{ isFullscreen ? fullscreenExitLabel : fullscreenEnterLabel }}
      </button>
      <button
        @click="toggleTheme"
        class="rounded-lg shadow-lg transition-all duration-300 hover:scale-105"
        :style="{
          padding: isCompactLandscape ? '6px 10px' : '8px 16px',
          fontSize: `${toggleButtonFontSize}px`,
          backgroundColor: themeConfig[currentTheme].buttonBg,
          color: themeConfig[currentTheme].buttonText,
          border: `2px solid ${themeConfig[currentTheme].buttonBorder}`,
        }"
      >
        {{
          currentTheme === 'light'
            ? `🌙 ${themeDarkLabel}`
            : `☀️ ${themeLightLabel}`
        }}
      </button>
    </div>
    <div
      v-if="isCompactLandscape"
      class="compact-board-title"
      :style="{ color: themeConfig[currentTheme].titleColor }"
    >
      {{ dashboardTitle }} {{ time }}
    </div>
    <DvBorderBox11
      v-if="datavReady"
      :animate="false"
      :color="themeConfig[currentTheme].borderColor"
      :background-color="themeConfig[currentTheme].backgroundColor"
      :title="isCompactLandscape ? '' : `${dashboardTitle} ${time}`"
      :title-width="titleWidth"
      class="h-full w-full light-board custom-title"
      :style="{
        '--title-font-size': `${titleFontSize}px`,
        '--title-color': themeConfig[currentTheme].titleColor,
      }"
    >
      <div
        class="dashboard-panels flex h-full w-full items-stretch justify-around"
        :style="{ gap: panelGap }"
      >
        <div
          class="dashboard-panel dashboard-panel-rules ml-[1%] mr-1 flex h-full flex-col items-center justify-start"
          :style="{ width: leftPanelWidth }"
        >
          <div class="w-full" :style="{ height: sectionSpacerHeight }"></div>
          <div
            class="flex w-full items-center"
            :style="{
              height: sectionTitleHeight,
              transform: sectionTitleOffset,
              gap: actionBarGap,
            }"
          >
            <button
              @click="handleToggleFullscreen"
              class="rounded-lg shadow-lg transition-all duration-300 hover:scale-105"
              :style="{
                padding: isCompactLandscape ? '6px 10px' : '8px 16px',
                fontSize: `${toggleButtonFontSize}px`,
                backgroundColor: themeConfig[currentTheme].buttonBg,
                color: themeConfig[currentTheme].buttonText,
                border: `2px solid ${themeConfig[currentTheme].buttonBorder}`,
              }"
            >
              {{ isFullscreen ? fullscreenExitLabel : fullscreenEnterLabel }}
            </button>
            <button
              @click="toggleTheme"
              class="rounded-lg shadow-lg transition-all duration-300 hover:scale-105"
              :style="{
                padding: isCompactLandscape ? '6px 10px' : '8px 16px',
                fontSize: `${toggleButtonFontSize}px`,
                backgroundColor: themeConfig[currentTheme].buttonBg,
                color: themeConfig[currentTheme].buttonText,
                border: `2px solid ${themeConfig[currentTheme].buttonBorder}`,
              }"
            >
              {{
                currentTheme === 'light'
                  ? `🌙 ${themeDarkLabel}`
                  : `☀️ ${themeLightLabel}`
              }}
            </button>
          </div>
          <div
            class="w-full overflow-hidden rounded-md"
            :style="{ height: sectionContentHeight }"
          >
            <DvBorderBox10 class="h-full w-full points-box">
              <div
                class="points-rules h-full w-full"
                :class="pointsPanelPaddingClass"
                :style="{
                  color: themeConfig[currentTheme].textColor,
                  fontSize: `${pointsRuleFontSize}px`,
                  lineHeight: pointsRuleLineHeight,
                }"
              >
                <div
                  v-for="(rule, idx) in pointsRules"
                  :key="`${rule.type}-${idx}`"
                  :class="
                    rule.type === 'title'
                      ? 'points-rule-title'
                      : rule.type === 'section'
                        ? 'points-rule-section'
                        : 'points-rule-item'
                  "
                  :style="
                    rule.type === 'title'
                      ? { fontSize: `${pointsRuleTitleFontSize}px` }
                      : undefined
                  "
                >
                  {{ rule.text }}
                </div>
              </div>
            </DvBorderBox10>
          </div>
        </div>

        <div
          class="dashboard-panel dashboard-panel-products mr-1 flex h-full flex-col items-center justify-start"
          :style="{ width: productPanelWidth }"
        >
          <div class="w-full" :style="{ height: sectionSpacerHeight }"></div>
          <div
            class="w-full"
            :style="{
              height: sectionTitleHeight,
              transform: sectionTitleOffset,
            }"
          >
            <Button :bg="false">
              <div
                :style="{
                  fontSize: `${fontSize(32)}px`,
                  color: themeConfig[currentTheme].textColor,
                }"
              >
                商品清单
              </div>
            </Button>
          </div>
          <div
            class="w-full overflow-hidden rounded-md"
            :style="{ height: sectionContentHeight }"
          >
            <VerticalCarouselTable
              :header="['排名', '图片', '品名', '售价', '兑换积分']"
              :data="redemptionListData"
              :key="`products-${layoutRerenderKey}`"
              class="h-full rounded-sm"
              :row-num="productRowNum"
              :column-width="[1.05, 1.05, 2.15, 1.05, 1.15]"
              :align="['center', 'center', 'left', 'center', 'center']"
              :font-size="tableFontSize"
              :header-height="tableHeaderHeight"
              carousel="single"
              :wait-time="1800"
              :hover-pause="true"
              :animate-scroll="true"
              :animation-duration="420"
              :header-bgc="themeConfig[currentTheme].tableHeader"
              :odd-row-bgc="themeConfig[currentTheme].tableRowOdd"
              :even-row-bgc="themeConfig[currentTheme].tableRowEven"
            />
          </div>
        </div>

        <div
          class="dashboard-panel dashboard-panel-staff mr-1 flex h-full flex-col items-center justify-start"
          :style="{ width: staffPanelWidth }"
        >
          <div class="w-full" :style="{ height: sectionSpacerHeight }"></div>
          <div
            class="w-full"
            :style="{
              height: sectionTitleHeight,
              transform: sectionTitleOffset,
            }"
          >
            <Button :bg="false">
              <div
                :style="{
                  fontSize: `${fontSize(32)}px`,
                  color: themeConfig[currentTheme].textColor,
                }"
              >
                本月积分榜
              </div>
            </Button>
          </div>
          <div
            class="w-full overflow-hidden rounded-md"
            :style="{ height: sectionContentHeight }"
          >
            <VerticalCarouselTable
              :header="['排名', '昵称', '当月积分', '总积分']"
              :data="staffRankData"
              class="h-full"
              :key="`staff-${layoutRerenderKey}`"
              :row-num="rankRowNum"
              :column-width="[0.9, 1.9, 1.2, 1.4]"
              :align="['left', 'center', 'center', 'center']"
              :font-size="tableFontSize"
              carousel="single"
              :header-height="tableHeaderHeight"
              :wait-time="1800"
              :hover-pause="true"
              :animate-scroll="true"
              :animation-duration="420"
              :header-bgc="themeConfig[currentTheme].tableHeader"
              :odd-row-bgc="themeConfig[currentTheme].tableRowOdd"
              :even-row-bgc="themeConfig[currentTheme].tableRowEven"
            />
          </div>
        </div>

        <div
          class="dashboard-panel dashboard-panel-region mr-[1%] flex h-full flex-col items-center justify-start"
          :style="{ width: regionPanelWidth }"
        >
          <div class="w-full" :style="{ height: sectionSpacerHeight }"></div>
          <div
            class="w-full"
            :style="{
              height: sectionTitleHeight,
              transform: sectionTitleOffset,
            }"
          >
            <Button :bg="false">
              <div
                :style="{
                  fontSize: `${fontSize(32)}px`,
                  color: themeConfig[currentTheme].textColor,
                }"
              >
                本月签到榜
              </div>
            </Button>
          </div>
          <div
            class="w-full overflow-hidden rounded-md"
            :style="{ height: sectionContentHeight }"
          >
            <VerticalCarouselTable
              :header="['排名', '昵称', '签到天数']"
              :data="regionRankData"
              class="h-full"
              :key="`region-${layoutRerenderKey}`"
              :row-num="rankRowNum"
              :column-width="[1, 2.3, 1.7]"
              :align="['left', 'center', 'center']"
              :font-size="tableFontSize"
              carousel="single"
              :header-height="tableHeaderHeight"
              :wait-time="1800"
              :hover-pause="true"
              :animate-scroll="true"
              :animation-duration="420"
              :header-bgc="themeConfig[currentTheme].tableHeader"
              :odd-row-bgc="themeConfig[currentTheme].tableRowOdd"
              :even-row-bgc="themeConfig[currentTheme].tableRowEven"
            />
          </div>
        </div>
      </div>
    </DvBorderBox11>
    <component
      :is="ImagePreviewGroup"
      class="hidden"
      :preview="{
        open: redemptionPreviewVisible,
        current: redemptionPreviewCurrent,
        getContainer: getPreviewContainer,
        onOpenChange: handleRedemptionPreviewOpenChange,
      }"
    >
      <Image
        v-for="item in redemptionPreviewItems"
        :key="`${item.sourceIndex}-${item.src}`"
        :src="item.src"
      />
    </component>
  </div>
</template>

<style scoped>
.bg {
  background: #eef3fb;
  background-position: center;
  background-size: cover;
  transition: background 0.3s ease;
}

.bg.dark {
  background: #0f172a;
}

:deep(.dv-border-box-12) {
  --dv-border-box-12-border-color-1: #6f8fdf;
  --dv-border-box-12-border-color-2: #9cb7ff;

  background: rgb(255 255 255 / 78%);
}

:deep(.dv-button-box) {
  color: #475569;
}

:deep(.dv-button-box .border) {
  stroke: #3b82f6;
}

.custom-title :deep(.dv-border-box-11-title),
:deep(.custom-title .dv-border-box-11-title),
:deep(.dv-border-box-11-title),
.custom-title :deep(.title),
:deep(.custom-title .title),
:deep(.dv-border-box-11 .title) {
  font-size: var(--title-font-size, 32px) !important;
  font-weight: 900 !important;
  color: var(--title-color, #fff) !important;
  fill: var(--title-color, #fff) !important;
}

.dashboard-panel {
  min-height: 0;
}

.points-box {
  --border-color: #5a8dee;

  background: rgb(255 255 255 / 22%);
}

.points-rules {
  display: flex;
  flex-direction: column;
  gap: 6px;
  justify-content: flex-start;
  overflow: hidden;
}

.points-rule-title {
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 700;
  color: #1e3a8a;
  text-align: center;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.points-rule-item {
  position: relative;
  padding-left: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.points-rule-section {
  margin-top: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 700;
  color: #1d4ed8;
  white-space: nowrap;
}

.points-rule-item::before {
  position: absolute;
  top: 50%;
  left: 0;
  width: 6px;
  height: 6px;
  content: '';
  background: #3b82f6;
  border-radius: 9999px;
  box-shadow: 0 0 8px rgb(59 130 246 / 35%);
  transform: translateY(-50%);
}

.bg.dark .points-rule-title {
  color: #bfdbfe;
}

.bg.dark .points-rule-section {
  color: #93c5fd;
}

.bg.dark .points-box {
  background: rgb(15 23 42 / 32%);
}

.bg.dark .points-rule-item::before {
  background: #93c5fd;
  box-shadow: 0 0 10px rgb(147 197 253 / 35%);
}

.bg.dark :deep(.dv-border-box-10 path) {
  stroke: #3b82f6;
}

:deep(.light-board text),
:deep(.light-board svg text) {
  color: var(--title-color, #fff) !important;
  fill: var(--title-color, #fff) !important;
}

/* 深色主题下的表格文字颜色 */
.bg.dark :deep(.header-text) {
  color: #e2e8f0 !important;
}

.bg.dark :deep(.row-text) {
  color: #cbd5e1 !important;
}

.bg.dark :deep(.row-index) {
  color: #cbd5e1 !important;
}

:deep(.rank-crown) {
  width: auto !important;
  height: 1.15em !important;
  max-height: 1.15em !important;
  aspect-ratio: auto !important;
  object-fit: contain !important;
}

:deep(.rank-crown-hidden) {
  display: none !important;
}

.compact-landscape .dashboard-panels {
  padding-top: 28px;
}

.compact-landscape .points-rules {
  gap: 2px;
}

.compact-landscape .points-rule-title,
.compact-landscape .points-rule-section,
.compact-landscape .points-rule-item {
  line-height: 1.12;
  white-space: normal;
}

.compact-landscape .points-rule-item {
  padding-left: 10px;
}

.compact-landscape .dashboard-panel {
  justify-content: flex-start;
}

.compact-board-title {
  position: fixed;
  top: 6px;
  left: 50%;
  z-index: 40;
  max-width: calc(100vw - 180px);
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.1;
  white-space: nowrap;
  transform: translateX(-50%);
}

.compact-landscape :deep(.dv-border-svg-container) {
  display: none !important;
}

.compact-landscape :deep(.border-box-content) {
  inset: 0 !important;
}

.compact-landscape :deep(.dv-button-box) {
  min-height: unset;
}

.compact-landscape :deep(.header-text) {
  font-weight: 700;
}

.compact-landscape :deep(.row-text) {
  line-height: 1.05;
}

.compact-landscape :deep(.rank-crown) {
  height: 0.95em !important;
  max-height: 0.95em !important;
}
</style>
