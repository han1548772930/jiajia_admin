<script setup lang="ts">
import type { CronMode, State } from './cronTypes';

import { computed } from 'vue';

import { InputNumber, Select } from 'antdv-next';

import CronOptionRow from './CronOptionRow.vue';
import { CRON_MODE } from './cronTypes';

const state = defineModel<State>('state', { required: true });

const isIntervalMode = computed(
  () => state.value.hour.cronEvery === CRON_MODE.INTERVAL,
);
const isSpecificMode = computed(
  () => state.value.hour.cronEvery === CRON_MODE.SPECIFIC,
);
const isRangeMode = computed(
  () => state.value.hour.cronEvery === CRON_MODE.RANGE,
);

const setHourMode = (mode: CronMode) => {
  state.value.hour.cronEvery = mode;
};

const hourOptions = Array.from({ length: 24 }).map((_, i) => ({
  value: i.toString(),
  label: i.toString(),
}));
</script>

<template>
  <div class="w-full flex flex-col gap-3 text-foreground">
    <CronOptionRow
      label="每小时"
      :checked="state.hour.cronEvery === CRON_MODE.EVERY"
      @select="setHourMode(CRON_MODE.EVERY)"
    />

    <CronOptionRow
      label="每隔"
      :checked="isIntervalMode"
      @select="setHourMode(CRON_MODE.INTERVAL)"
    >
      <InputNumber
        v-model:value="state.hour.incrementIncrement"
        change-on-wheel
        :min="1"
        :max="24"
        :step="1"
        :disabled="!isIntervalMode"
        class="w-24"
      />
      <span class="text-sm">小时 从</span>
      <InputNumber
        v-model:value="state.hour.incrementStart"
        change-on-wheel
        :min="0"
        :max="23"
        :step="1"
        :disabled="!isIntervalMode"
        class="w-24"
      />
      <span class="text-sm">时开始</span>
    </CronOptionRow>

    <CronOptionRow
      label="指定小时"
      :checked="isSpecificMode"
      @select="setHourMode(CRON_MODE.SPECIFIC)"
    >
      <Select
        v-model:value="state.hour.specificSpecific"
        mode="multiple"
        :options="hourOptions"
        placeholder="请选择"
        :disabled="!isSpecificMode"
        class="w-64"
      />
    </CronOptionRow>

    <CronOptionRow
      label="从"
      :checked="isRangeMode"
      @select="setHourMode(CRON_MODE.RANGE)"
    >
      <InputNumber
        v-model:value="state.hour.rangeStart"
        change-on-wheel
        :min="0"
        :max="23"
        :step="1"
        :disabled="!isRangeMode"
        class="w-24"
      />
      <span class="text-sm">到</span>
      <InputNumber
        v-model:value="state.hour.rangeEnd"
        change-on-wheel
        :min="0"
        :max="23"
        :step="1"
        :disabled="!isRangeMode"
        class="w-24"
      />
      <span class="text-sm">时</span>
    </CronOptionRow>
  </div>
</template>
