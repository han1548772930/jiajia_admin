<template>
  <div class="w-full flex flex-col gap-3 text-foreground">
    <CronOptionRow label="每分钟" :checked="state.minute.cronEvery === CRON_MODE.EVERY" @select="setMinuteMode(CRON_MODE.EVERY)" />

    <CronOptionRow label="每隔" :checked="isIntervalMode" @select="setMinuteMode(CRON_MODE.INTERVAL)">
        <InputNumber change-on-wheel v-model:value="state.minute.incrementIncrement" :min="0" :max="60" :step="1" :disabled="!isIntervalMode" class="w-20" />
        <span class="px-2">分钟 从</span>
        <InputNumber change-on-wheel v-model:value="state.minute.incrementStart" :min="0" :max="59" :step="1" :disabled="!isIntervalMode" class="w-20" />
        <span class="px-2">分开始</span>
    </CronOptionRow>

    <CronOptionRow label="指定分钟" :checked="isSpecificMode" @select="setMinuteMode(CRON_MODE.SPECIFIC)">
        <Select v-model:value="state.minute.specificSpecific" mode="multiple" :options="minuteOptions" placeholder="请选择" :disabled="!isSpecificMode" class="w-48" />
    </CronOptionRow>

    <CronOptionRow label="从" :checked="isRangeMode" @select="setMinuteMode(CRON_MODE.RANGE)">
        <InputNumber change-on-wheel v-model:value="state.minute.rangeStart" :min="0" :max="59" :step="1" :disabled="!isRangeMode" class="w-20" />
        <span class="px-2">到</span>
        <InputNumber change-on-wheel v-model:value="state.minute.rangeEnd" :min="0" :max="59" :step="1" :disabled="!isRangeMode" class="w-20" />
        <span class="px-2">分钟</span>
    </CronOptionRow>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { InputNumber, Select } from 'antdv-next';
import { CRON_MODE, type CronMode, type State } from './cronTypes';
import CronOptionRow from './CronOptionRow.vue';

const props = defineProps<{ state: State }>();

const isIntervalMode = computed(() => props.state.minute.cronEvery === CRON_MODE.INTERVAL);
const isSpecificMode = computed(() => props.state.minute.cronEvery === CRON_MODE.SPECIFIC);
const isRangeMode = computed(() => props.state.minute.cronEvery === CRON_MODE.RANGE);

const setMinuteMode = (mode: CronMode) => {
  props.state.minute.cronEvery = mode;
};

const minuteOptions = [...Array(60)].map((_, i) => ({ value: i.toString(), label: i.toString() }));
</script>
