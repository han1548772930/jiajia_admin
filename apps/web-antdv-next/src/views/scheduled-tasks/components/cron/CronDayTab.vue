<script setup lang="ts">
import type { DayMode, State, WeekItem } from './cronTypes';

import { computed } from 'vue';

import { InputNumber, Select } from 'antdv-next';

import CronOptionRow from './CronOptionRow.vue';
import { DAY_MODE } from './cronTypes';

const props = defineProps<{ weekList: WeekItem[] }>();
const state = defineModel<State>('state', { required: true });

const isWeekIntervalMode = computed(
  () => state.value.day.cronEvery === DAY_MODE.EVERY_WEEK_INTERVAL,
);
const isDayIntervalMode = computed(
  () => state.value.day.cronEvery === DAY_MODE.EVERY_DAY_INTERVAL,
);
const isSpecificWeekMode = computed(
  () => state.value.day.cronEvery === DAY_MODE.SPECIFIC_WEEK,
);
const isSpecificDayMode = computed(
  () => state.value.day.cronEvery === DAY_MODE.SPECIFIC_DAY,
);

const setDayMode = (mode: DayMode) => {
  state.value.day.cronEvery = mode;
};

const weekOptions = props.weekList.map((i) => ({
  value: i.val.toString(),
  label: i.name,
}));
const dayOptions = Array.from({ length: 31 }).map((_, i) => ({
  value: (i + 1).toString(),
  label: (i + 1).toString(),
}));
</script>

<template>
  <div class="w-full flex flex-col gap-3 text-foreground">
    <CronOptionRow
      label="每天"
      :checked="state.day.cronEvery === DAY_MODE.EVERY_DAY"
      @select="setDayMode(DAY_MODE.EVERY_DAY)"
    />

    <CronOptionRow
      label="每隔周"
      :checked="isWeekIntervalMode"
      @select="setDayMode(DAY_MODE.EVERY_WEEK_INTERVAL)"
    >
      <InputNumber
        v-model:value="state.week.incrementIncrement"
        change-on-wheel
        :min="1"
        :max="60"
        :step="1"
        :disabled="!isWeekIntervalMode"
        class="w-24"
      />
      <span class="text-sm">周 从第</span>
      <InputNumber
        v-model:value="state.week.incrementStart"
        change-on-wheel
        :min="1"
        :max="52"
        :step="1"
        :disabled="!isWeekIntervalMode"
        class="w-24"
      />
      <span class="text-sm">周开始</span>
    </CronOptionRow>

    <CronOptionRow
      label="每隔天"
      :checked="isDayIntervalMode"
      @select="setDayMode(DAY_MODE.EVERY_DAY_INTERVAL)"
    >
      <InputNumber
        v-model:value="state.day.incrementIncrement"
        change-on-wheel
        :min="1"
        :max="30"
        :step="1"
        :disabled="!isDayIntervalMode"
        class="w-24"
      />
      <span class="text-sm">天 从第</span>
      <InputNumber
        v-model:value="state.day.incrementStart"
        change-on-wheel
        :min="1"
        :max="30"
        :step="1"
        :disabled="!isDayIntervalMode"
        class="w-24"
      />
      <span class="text-sm">天开始</span>
    </CronOptionRow>

    <CronOptionRow
      label="指定星期"
      :checked="isSpecificWeekMode"
      @select="setDayMode(DAY_MODE.SPECIFIC_WEEK)"
    >
      <Select
        v-model:value="state.week.specificSpecific"
        mode="multiple"
        :options="weekOptions"
        placeholder="请选择"
        :disabled="!isSpecificWeekMode"
        class="w-64"
      />
    </CronOptionRow>

    <CronOptionRow
      label="指定天"
      :checked="isSpecificDayMode"
      @select="setDayMode(DAY_MODE.SPECIFIC_DAY)"
    >
      <Select
        v-model:value="state.day.specificSpecific"
        mode="multiple"
        :options="dayOptions"
        placeholder="请选择"
        :disabled="!isSpecificDayMode"
        class="w-64"
      />
    </CronOptionRow>
  </div>
</template>
