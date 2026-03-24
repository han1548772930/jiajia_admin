<script setup lang="ts">
import type { CronMode, State } from './cronTypes';

import { computed } from 'vue';

import { InputNumber, Select } from 'antdv-next';

import CronOptionRow from './CronOptionRow.vue';
import { CRON_MODE } from './cronTypes';

const state = defineModel<State>('state', { required: true });

const isIntervalMode = computed(
  () => state.value.minute.cronEvery === CRON_MODE.INTERVAL,
);
const isSpecificMode = computed(
  () => state.value.minute.cronEvery === CRON_MODE.SPECIFIC,
);
const isRangeMode = computed(
  () => state.value.minute.cronEvery === CRON_MODE.RANGE,
);

const setMinuteMode = (mode: CronMode) => {
  state.value.minute.cronEvery = mode;
};

const minuteOptions = Array.from({ length: 60 }).map((_, i) => ({
  value: i.toString(),
  label: i.toString(),
}));
</script>

<template>
  <div class="w-full flex flex-col gap-3 text-foreground">
    <CronOptionRow
      label="每分钟"
      :checked="state.minute.cronEvery === CRON_MODE.EVERY"
      @select="setMinuteMode(CRON_MODE.EVERY)"
    />

    <CronOptionRow
      label="每隔"
      :checked="isIntervalMode"
      @select="setMinuteMode(CRON_MODE.INTERVAL)"
    >
      <InputNumber
        v-model:value="state.minute.incrementIncrement"
        change-on-wheel
        :min="0"
        :max="60"
        :step="1"
        :disabled="!isIntervalMode"
        class="w-24"
      />
      <span class="text-sm">分钟 从</span>
      <InputNumber
        v-model:value="state.minute.incrementStart"
        change-on-wheel
        :min="0"
        :max="59"
        :step="1"
        :disabled="!isIntervalMode"
        class="w-24"
      />
      <span class="text-sm">分开始</span>
    </CronOptionRow>

    <CronOptionRow
      label="指定分钟"
      :checked="isSpecificMode"
      @select="setMinuteMode(CRON_MODE.SPECIFIC)"
    >
      <Select
        v-model:value="state.minute.specificSpecific"
        mode="multiple"
        :options="minuteOptions"
        placeholder="请选择"
        :disabled="!isSpecificMode"
        class="w-64"
      />
    </CronOptionRow>

    <CronOptionRow
      label="从"
      :checked="isRangeMode"
      @select="setMinuteMode(CRON_MODE.RANGE)"
    >
      <InputNumber
        v-model:value="state.minute.rangeStart"
        change-on-wheel
        :min="0"
        :max="59"
        :step="1"
        :disabled="!isRangeMode"
        class="w-24"
      />
      <span class="text-sm">到</span>
      <InputNumber
        v-model:value="state.minute.rangeEnd"
        change-on-wheel
        :min="0"
        :max="59"
        :step="1"
        :disabled="!isRangeMode"
        class="w-24"
      />
      <span class="text-sm">分钟</span>
    </CronOptionRow>
  </div>
</template>
