<template>
  <div class="w-full flex flex-col gap-3 text-foreground">
    <CronOptionRow label="每小时" :checked="state.hour.cronEvery === CRON_MODE.EVERY" @select="setHourMode(CRON_MODE.EVERY)" />

    <CronOptionRow label="每隔" :checked="isIntervalMode" @select="setHourMode(CRON_MODE.INTERVAL)">
        <InputNumber change-on-wheel v-model:value="state.hour.incrementIncrement" :min="1" :max="24" :step="1" :disabled="!isIntervalMode" class="w-20" />
        <span class="px-2">小时 从</span>
        <InputNumber change-on-wheel v-model:value="state.hour.incrementStart" :min="0" :max="23" :step="1" :disabled="!isIntervalMode" class="w-20" />
        <span class="px-2">时开始</span>
    </CronOptionRow>

    <CronOptionRow label="指定小时" :checked="isSpecificMode" @select="setHourMode(CRON_MODE.SPECIFIC)">
        <Select v-model:value="state.hour.specificSpecific" mode="multiple" :options="hourOptions" placeholder="请选择" :disabled="!isSpecificMode" class="w-48" />
    </CronOptionRow>

    <CronOptionRow label="从" :checked="isRangeMode" @select="setHourMode(CRON_MODE.RANGE)">
        <InputNumber change-on-wheel v-model:value="state.hour.rangeStart" :min="0" :max="23" :step="1" :disabled="!isRangeMode" class="w-20" />
        <span class="px-2">到</span>
        <InputNumber change-on-wheel v-model:value="state.hour.rangeEnd" :min="0" :max="23" :step="1" :disabled="!isRangeMode" class="w-20" />
        <span class="px-2">时</span>
    </CronOptionRow>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { InputNumber, Select } from 'antdv-next';
import { CRON_MODE, type CronMode, type State } from './cronTypes';
import CronOptionRow from './CronOptionRow.vue';

const props = defineProps<{ state: State }>();

const isIntervalMode = computed(() => props.state.hour.cronEvery === CRON_MODE.INTERVAL);
const isSpecificMode = computed(() => props.state.hour.cronEvery === CRON_MODE.SPECIFIC);
const isRangeMode = computed(() => props.state.hour.cronEvery === CRON_MODE.RANGE);

const setHourMode = (mode: CronMode) => {
  props.state.hour.cronEvery = mode;
};

const hourOptions = [...Array(24)].map((_, i) => ({ value: i.toString(), label: i.toString() }));
</script>
