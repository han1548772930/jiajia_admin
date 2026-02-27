<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { Card, Collapse, Empty, Table } from 'antdv-next';

import type { WorkflowApi } from '#/api/workflow';

const props = defineProps<{
  data?: WorkflowApi.ReportForm;
}>();

type RowRecord = Record<string, any>;

function normalizeFields(data: WorkflowApi.Field[] = []): WorkflowApi.Field[] {
  return data
    .filter((item) => Number(item.Seq ?? 0) !== -1)
    .sort((a, b) => Number(a.Seq ?? 0) - Number(b.Seq ?? 0));
}

function buildRows(subTable: WorkflowApi.SubTable): RowRecord[] {
  const rows = subTable.Rows ?? [];
  return rows.map((row) => {
    const mapped: RowRecord = {};
    const fields = normalizeFields(row.Fields ?? []);
    for (const field of fields) {
      if (!field.FieldName) continue;
      mapped[field.FieldName] = field.FieldValue;
    }
    return mapped;
  });
}

function buildColumns(subTable: WorkflowApi.SubTable) {
  const fieldMap = new Map<string, WorkflowApi.Field>();
  const rows = subTable.Rows ?? [];

  for (const row of rows) {
    const fields = normalizeFields(row.Fields ?? []);
    for (const field of fields) {
      if (!field.FieldName) continue;
      if (!fieldMap.has(field.FieldName)) {
        fieldMap.set(field.FieldName, field);
      }
    }
  }

  return [...fieldMap.values()].map((field) => ({
    dataIndex: field.FieldName,
    key: field.FieldName,
    title: field.FieldLabel || field.FieldName,
  }));
}

const mainFields = computed(() => normalizeFields(props.data?.MainTable?.Fields ?? []));
const subTables = computed(() => props.data?.SubTables ?? []);
const collapseItems = computed(() =>
  subTables.value.map((subTable, index) => ({
    key: String(index + 1),
    label: subTable.TableLabel || subTable.TabledName || `子表${index + 1}`,
    subTable,
  })),
);
const activeSubTableKeys = ref<Array<number | string>>([]);

watch(
  collapseItems,
  (items) => {
    activeSubTableKeys.value = items.map((item) => item.key);
  },
  { immediate: true },
);

function onCollapseChange(key: Array<number | string> | number | string) {
  if (Array.isArray(key)) {
    activeSubTableKeys.value = key;
    return;
  }
  activeSubTableKeys.value = [key];
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <Empty
      v-if="!data || (!mainFields.length && !subTables.length)"
      description="暂无流程详情数据"
    />

    <Card v-if="mainFields.length" title="主表数据">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div
          v-for="field in mainFields"
          :key="field.FieldName"
          class="rounded border border-border p-3"
        >
          <div class="mb-1 text-xs text-muted-foreground">
            {{ field.FieldLabel || field.FieldName }}
          </div>
          <div>{{ field.FieldValue || '-' }}</div>
        </div>
      </div>
    </Card>

    <Collapse
      v-if="subTables.length"
      :items="collapseItems as any"
      :active-key="activeSubTableKeys"
      @change="onCollapseChange"
    >
      <template #contentRender="{ item }">
        <Table
          size="small"
          :columns="buildColumns((item as any).subTable) as any"
          :data-source="buildRows((item as any).subTable)"
          :pagination="false"
          :scroll="{ x: true }"
        />
      </template>
    </Collapse>
  </div>
</template>
