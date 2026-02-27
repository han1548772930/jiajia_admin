<template>
  <div class="w-full select-text px-1">
    <Divider>参数</Divider>

    <template v-if="argsList.length > 0">
      <div
        v-for="(item, index) in argsList"
        :key="index"
        class="whitespace-pre-wrap break-all"
      >
        {{ item }}
      </div>
    </template>
    <div v-else class="whitespace-pre-wrap break-all">-</div>

    <div v-if="hasText(params.data?.ExceptionMessage)">
      <Divider>异常消息</Divider>
      <div class="whitespace-pre-wrap break-all">
        {{ params.data?.ExceptionMessage }}
      </div>
    </div>

    <div v-if="hasText(params.data?.ExceptionDetails)">
      <Divider>异常细节</Divider>
      <div class="whitespace-pre-wrap break-all">
        {{ params.data?.ExceptionDetails }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue';

import { Divider } from 'antdv-next';
import type { ICellRendererParams } from 'ag-grid-community';

const props = defineProps<{
  params: ICellRendererParams;
}>();

const argsList = shallowRef<string[]>([]);

function safeParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeArg(value: unknown): string {
  if (value == null) return '';

  if (typeof value === 'string') {
    const nested = safeParse(value);
    if (typeof nested === 'string') {
      return nested;
    }

    return JSON.stringify(nested);
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

function hasText(value: unknown) {
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
}

const rawArgs = props.params.data?.Arguments;

if (typeof rawArgs === 'string' && rawArgs.trim()) {
  const parsed = safeParse(rawArgs);

  if (Array.isArray(parsed)) {
    argsList.value = parsed
      .map((item) => normalizeArg(item))
      .filter((item) => item.trim().length > 0);
  } else {
    const one = normalizeArg(parsed);
    argsList.value = one.trim() ? [one] : [];
  }
}
</script>