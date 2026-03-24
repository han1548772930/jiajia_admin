<script setup lang="ts">
import type { CronMode, State } from './cronTypes';

import { computed } from 'vue';

import { InputNumber, Select } from 'antdv-next';

import CronOptionRow from './CronOptionRow.vue';
import { CRON_MODE } from './cronTypes';

const state = defineModel<State>('state', { required: true });

const isIntervalMode = computed(
  () => state.value.month.cronEvery === CRON_MODE.INTERVAL,
);
const isSpecificMode = computed(
  () => state.value.month.cronEvery === CRON_MODE.SPECIFIC,
);
const isRangeMode = computed(
  () => state.value.month.cronEvery === CRON_MODE.RANGE,
);

const setMonthMode = (mode: CronMode) => {
  state.value.month.cronEvery = mode;
};

const monthOptions = Array.from({ length: 12 }).map((_, i) => ({
  value: (i + 1).toString(),
  label: `${i + 1}月`,
}));
</script>

<template>
  <div class="w-full flex flex-col gap-3 text-foreground">
    <CronOptionRow
      label="每月"
      :checked="state.month.cronEvery === CRON_MODE.EVERY"
      @select="setMonthMode(CRON_MODE.EVERY)"
    />

    <CronOptionRow
      label="每隔"
      :checked="isIntervalMode"
      @select="setMonthMode(CRON_MODE.INTERVAL)"
    >
      <InputNumber
        v-model:value="state.month.incrementIncrement"
        change-on-wheel
        :min="1"
        :max="12"
        :step="1"
        :disabled="!isIntervalMode"
        class="w-24"
      />
      <span class="text-sm">月 从</span>
      <InputNumber
        v-model:value="state.month.incrementStart"
        change-on-wheel
        :min="1"
        :max="12"
        :step="1"
        :disabled="!isIntervalMode"
        class="w-24"
      />
      <span class="text-sm">月开始</span>
    </CronOptionRow>

    <CronOptionRow
      label="指定月份"
      :checked="isSpecificMode"
      @select="setMonthMode(CRON_MODE.SPECIFIC)"
    >
      <Select
        v-model:value="state.month.specificSpecific"
        mode="multiple"
        :options="monthOptions"
        placeholder="请选择"
        :disabled="!isSpecificMode"
        class="w-64"
      />
    </CronOptionRow>

    <CronOptionRow
      label="从"
      :checked="isRangeMode"
      @select="setMonthMode(CRON_MODE.RANGE)"
    >
      <InputNumber
        v-model:value="state.month.rangeStart"
        change-on-wheel
        :min="1"
        :max="12"
        :step="1"
        :disabled="!isRangeMode"
        class="w-24"
      />
      <span class="text-sm">到</span>
      <InputNumber
        v-model:value="state.month.rangeEnd"
        change-on-wheel
        :min="1"
        :max="12"
        :step="1"
        :disabled="!isRangeMode"
        class="w-24"
      />
      <span class="text-sm">月</span>
    </CronOptionRow>
  </div>
</template>
