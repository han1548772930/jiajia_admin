<template>
  <div class="w-full flex flex-col gap-3 text-foreground">
    <CronOptionRow label="每天" :checked="state.day.cronEvery === DAY_MODE.EVERY_DAY" @select="setDayMode(DAY_MODE.EVERY_DAY)" />

    <CronOptionRow label="每隔周" :checked="isWeekIntervalMode" @select="setDayMode(DAY_MODE.EVERY_WEEK_INTERVAL)">
        <InputNumber change-on-wheel v-model:value="state.week.incrementIncrement" :min="1" :max="60" :step="1" :disabled="!isWeekIntervalMode" class="w-20" />
        <span class="px-2">周 从第</span>
        <InputNumber change-on-wheel v-model:value="state.week.incrementStart" :min="1" :max="52" :step="1" :disabled="!isWeekIntervalMode" class="w-20" />
        <span class="px-2">周开始</span>
    </CronOptionRow>

    <CronOptionRow label="每隔天" :checked="isDayIntervalMode" @select="setDayMode(DAY_MODE.EVERY_DAY_INTERVAL)">
        <InputNumber change-on-wheel v-model:value="state.day.incrementIncrement" :min="1" :max="30" :step="1" :disabled="!isDayIntervalMode" class="w-20" />
        <span class="px-2">天 从第</span>
        <InputNumber change-on-wheel v-model:value="state.day.incrementStart" :min="1" :max="30" :step="1" :disabled="!isDayIntervalMode" class="w-20" />
        <span class="px-2">天开始</span>
    </CronOptionRow>

    <CronOptionRow label="指定星期" :checked="isSpecificWeekMode" @select="setDayMode(DAY_MODE.SPECIFIC_WEEK)">
        <Select v-model:value="state.week.specificSpecific" mode="multiple" :options="weekOptions" placeholder="请选择" :disabled="!isSpecificWeekMode" class="w-48" />
    </CronOptionRow>

    <CronOptionRow label="指定天" :checked="isSpecificDayMode" @select="setDayMode(DAY_MODE.SPECIFIC_DAY)">
        <Select v-model:value="state.day.specificSpecific" mode="multiple" :options="dayOptions" placeholder="请选择" :disabled="!isSpecificDayMode" class="w-48" />
    </CronOptionRow>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { InputNumber, Select } from 'antdv-next';
import { DAY_MODE, type DayMode, type State, type WeekItem } from './cronTypes';
import CronOptionRow from './CronOptionRow.vue';

const props = defineProps<{ state: State; weekList: WeekItem[] }>();

const isWeekIntervalMode = computed(() => props.state.day.cronEvery === DAY_MODE.EVERY_WEEK_INTERVAL);
const isDayIntervalMode = computed(() => props.state.day.cronEvery === DAY_MODE.EVERY_DAY_INTERVAL);
const isSpecificWeekMode = computed(() => props.state.day.cronEvery === DAY_MODE.SPECIFIC_WEEK);
const isSpecificDayMode = computed(() => props.state.day.cronEvery === DAY_MODE.SPECIFIC_DAY);

const setDayMode = (mode: DayMode) => {
  props.state.day.cronEvery = mode;
};

const weekOptions = props.weekList.map((i) => ({ value: i.val.toString(), label: i.name }));
const dayOptions = [...Array(31)].map((_, i) => ({ value: (i + 1).toString(), label: (i + 1).toString() }));
</script>
