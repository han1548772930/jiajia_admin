<template>
  <div class="w-full flex flex-col gap-3 text-foreground">
    <CronOptionRow label="每月" :checked="state.month.cronEvery === CRON_MODE.EVERY" @select="setMonthMode(CRON_MODE.EVERY)" />

    <CronOptionRow label="每隔" :checked="isIntervalMode" @select="setMonthMode(CRON_MODE.INTERVAL)">
        <InputNumber change-on-wheel v-model:value="state.month.incrementIncrement" :min="1" :max="12" :step="1" :disabled="!isIntervalMode" class="w-20" />
        <span class="px-2">月 从</span>
        <InputNumber change-on-wheel v-model:value="state.month.incrementStart" :min="1" :max="12" :step="1" :disabled="!isIntervalMode" class="w-20" />
        <span class="px-2">月开始</span>
    </CronOptionRow>

    <CronOptionRow label="指定月份" :checked="isSpecificMode" @select="setMonthMode(CRON_MODE.SPECIFIC)">
        <Select v-model:value="state.month.specificSpecific" mode="multiple" :options="monthOptions" placeholder="请选择" :disabled="!isSpecificMode" class="w-48" />
    </CronOptionRow>

    <CronOptionRow label="从" :checked="isRangeMode" @select="setMonthMode(CRON_MODE.RANGE)">
        <InputNumber change-on-wheel v-model:value="state.month.rangeStart" :min="1" :max="12" :step="1" :disabled="!isRangeMode" class="w-20" />
        <span class="px-2">到</span>
        <InputNumber change-on-wheel v-model:value="state.month.rangeEnd" :min="1" :max="12" :step="1" :disabled="!isRangeMode" class="w-20" />
        <span class="px-2">月</span>
    </CronOptionRow>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { InputNumber, Select } from 'antdv-next';
import { CRON_MODE, type CronMode, type State } from './cronTypes';
import CronOptionRow from './CronOptionRow.vue';

const props = defineProps<{ state: State }>();

const isIntervalMode = computed(() => props.state.month.cronEvery === CRON_MODE.INTERVAL);
const isSpecificMode = computed(() => props.state.month.cronEvery === CRON_MODE.SPECIFIC);
const isRangeMode = computed(() => props.state.month.cronEvery === CRON_MODE.RANGE);

const setMonthMode = (mode: CronMode) => {
  props.state.month.cronEvery = mode;
};

const monthOptions = [...Array(12)].map((_, i) => ({ value: (i + 1).toString(), label: `${i + 1}月` }));
</script>
