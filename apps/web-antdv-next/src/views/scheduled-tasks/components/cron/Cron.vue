<script setup lang="ts">
import type { State, WeekItem } from './cronTypes';

import { computed, reactive, ref, watch } from 'vue';

import { Segmented } from 'antdv-next';

import CronDayTab from './CronDayTab.vue';
import CronExpression from './CronExpression.vue';
import CronHourTab from './CronHourTab.vue';
import CronMinuteTab from './CronMinuteTab.vue';
import CronMonthTab from './CronMonthTab.vue';
import { parseCron } from './cronParser';
import { getInitialState } from './cronState';
import {
  computeDaysText,
  computeHoursText,
  computeMinutesText,
  computeMonthsText,
  computeWeeksText,
} from './cronUtils';

const props = defineProps<{
  cron?: string;
}>();

const modelValue = defineModel<string>({ default: '* * * * *' });

const weekList: WeekItem[] = [
  { name: '周日', value: 'SUN', val: 1 },
  { name: '周一', value: 'MON', val: 2 },
  { name: '周二', value: 'TUE', val: 3 },
  { name: '周三', value: 'WED', val: 4 },
  { name: '周四', value: 'THU', val: 5 },
  { name: '周五', value: 'FRI', val: 6 },
  { name: '周六', value: 'SAT', val: 7 },
];

const state = reactive<State>(getInitialState());
const activeTab = ref<'day' | 'hour' | 'minute' | 'month'>('minute');

const tabOptions = [
  { label: '分钟', value: 'minute' },
  { label: '小时', value: 'hour' },
  { label: '天/周', value: 'day' },
  { label: '月', value: 'month' },
];

const minutesText = computed(() => computeMinutesText(state));
const hoursText = computed(() => computeHoursText(state));
const daysText = computed(() => computeDaysText(state));
const weeksText = computed(() => computeWeeksText(state));
const monthsText = computed(() => computeMonthsText(state));

const cronExpression = computed(
  () =>
    `${minutesText.value || '*'} ${hoursText.value || '*'} ${daysText.value || '*'} ${monthsText.value || '*'} ${weeksText.value || '*'}`,
);

const normalizeCron = (value?: null | string) => {
  const text = value?.trim();
  return text || '* * * * *';
};

watch(
  () => [props.cron, modelValue.value] as const,
  ([cron, model]) => {
    const nextCron = normalizeCron(cron ?? model);
    if (nextCron === cronExpression.value) return;
    parseCron(nextCron, state);
  },
  { immediate: true },
);

watch(cronExpression, (nextExpression) => {
  if (modelValue.value === nextExpression) return;
  modelValue.value = nextExpression;
});
</script>

<template>
  <div class="max-w-2xl flex flex-col gap-3">
    <Segmented v-model:value="activeTab" block :options="tabOptions" />
    <div>
      <CronMinuteTab v-if="activeTab === 'minute'" v-model:state="state" />
      <CronHourTab v-else-if="activeTab === 'hour'" v-model:state="state" />
      <CronDayTab
        v-else-if="activeTab === 'day'"
        v-model:state="state"
        :week-list="weekList"
      />
      <CronMonthTab v-else v-model:state="state" />
    </div>

    <CronExpression :expression="cronExpression" />
  </div>
</template>
