<script setup lang="ts">
import type {
  FieldDataSourcePreset,
  FormDesignerNode,
  TableLayoutSchema,
} from '#/views/workflow/form-designer/types';

import {
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Input,
  InputNumber,
  Row,
  Select,
  Switch,
  Table,
} from 'antdv-next';

import { $t } from '#/locales';
import PreviewFieldItem from '#/views/workflow/form-preview/components/PreviewFieldItem.vue';

defineOptions({
  name: 'PreviewNodeItem',
});

interface Props {
  dataSourcePresets: FieldDataSourcePreset[];
  fieldErrors: Record<string, string>;
  fieldSerialNumberMap: Record<string, number>;
  getGridSpan: (node: FormDesignerNode) => number;
  getTableCellError: (layoutId: string, rowIndex: number, dataIndex: string) => string;
  getTableCellValue: (layoutId: string, rowIndex: number, dataIndex: string) => any;
  getTableColumns: (layout: TableLayoutSchema) => any[];
  getTableRows: (layoutId: string) => Array<Record<string, any>>;
  model: Record<string, any>;
  node: FormDesignerNode;
  showSerialNumber: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'append-table-row': [layoutId: string];
  change: [fieldName: string];
  'remove-table-row': [{ layoutId: string; rowIndex: number }];
  'update-table-cell': [
    { dataIndex: string; layoutId: string; rowIndex: number; value: any },
  ];
}>();

function getColumnComponent(column: any) {
  const value = String(column?.component ?? '').trim();
  if (value === 'InputNumber' || value === 'Select' || value === 'Switch') {
    return value;
  }
  return 'Input';
}

function getColumnPlaceholder(column: any) {
  return String(column?.placeholder || column?.title || '');
}

function getColumnOptions(column: any) {
  return Array.isArray(column?.options) ? column.options : [];
}
</script>

<template>
  <PreviewFieldItem
    v-if="props.node.kind === 'field'"
    :data-source-presets="props.dataSourcePresets"
    :error-message="props.fieldErrors[props.node.fieldName]"
    :field="props.node"
    :model="props.model"
    :serial-number="props.fieldSerialNumberMap[props.node.id]"
    :show-serial-number="props.showSerialNumber"
    @change="(fieldName) => emit('change', fieldName)"
  />

  <Card
    v-else-if="props.node.layoutType === 'Section'"
    size="small"
    class="mb-3"
    :style="props.node.backgroundColor ? { backgroundColor: props.node.backgroundColor } : undefined"
  >
    <template #title>
      <div class="font-medium">{{ props.node.label }}</div>
    </template>

    <div v-if="props.node.description" class="mb-2 text-xs text-muted-foreground">
      {{ props.node.description }}
    </div>

    <Empty v-if="props.node.children.length === 0" :description="$t('workflow.formPreview.emptyContent')" />

    <PreviewNodeItem
      v-for="child in props.node.children"
      v-else
      :key="child.id"
      :data-source-presets="props.dataSourcePresets"
      :field-errors="props.fieldErrors"
      :field-serial-number-map="props.fieldSerialNumberMap"
      :get-grid-span="props.getGridSpan"
      :get-table-cell-error="props.getTableCellError"
      :get-table-cell-value="props.getTableCellValue"
      :get-table-columns="props.getTableColumns"
      :get-table-rows="props.getTableRows"
      :model="props.model"
      :node="child"
      :show-serial-number="props.showSerialNumber"
      @append-table-row="(layoutId) => emit('append-table-row', layoutId)"
      @change="(fieldName) => emit('change', fieldName)"
      @remove-table-row="(payload) => emit('remove-table-row', payload)"
      @update-table-cell="(payload) => emit('update-table-cell', payload)"
    />
  </Card>

  <Card
    v-else-if="props.node.layoutType === 'Grid'"
    size="small"
    class="mb-3"
    :style="props.node.backgroundColor ? { backgroundColor: props.node.backgroundColor } : undefined"
  >
    <template #title>
      <div class="font-medium">{{ props.node.label }}</div>
    </template>

    <Row :gutter="props.node.gap">
      <Col v-for="column in props.node.columns" :key="column.id" :span="props.getGridSpan(props.node)">
        <Card size="small" class="mb-2" :title="column.title">
          <Empty v-if="column.children.length === 0" :description="$t('workflow.formPreview.emptyContent')" />

          <PreviewNodeItem
            v-for="child in column.children"
            v-else
            :key="child.id"
            :data-source-presets="props.dataSourcePresets"
            :field-errors="props.fieldErrors"
            :field-serial-number-map="props.fieldSerialNumberMap"
            :get-grid-span="props.getGridSpan"
            :get-table-cell-error="props.getTableCellError"
            :get-table-cell-value="props.getTableCellValue"
            :get-table-columns="props.getTableColumns"
            :get-table-rows="props.getTableRows"
            :model="props.model"
            :node="child"
            :show-serial-number="props.showSerialNumber"
            @append-table-row="(layoutId) => emit('append-table-row', layoutId)"
            @change="(fieldName) => emit('change', fieldName)"
            @remove-table-row="(payload) => emit('remove-table-row', payload)"
            @update-table-cell="(payload) => emit('update-table-cell', payload)"
          />
        </Card>
      </Col>
    </Row>
  </Card>

  <Card
    v-else-if="props.node.layoutType === 'Table'"
    size="small"
    class="mb-3"
    :style="props.node.backgroundColor ? { backgroundColor: props.node.backgroundColor } : undefined"
  >
    <template #title>
      <div class="flex items-center justify-between gap-2">
        <span class="font-medium">{{ props.node.label }}</span>
        <Button size="small" type="primary" @click="emit('append-table-row', props.node.id)">
          {{ $t('workflow.formPreview.table.addRow') }}
        </Button>
      </div>
    </template>

    <Table
      :bordered="props.node.bordered"
      :columns="props.getTableColumns(props.node) as any"
      :data-source="props.getTableRows(props.node.id)"
      :pagination="false"
      row-key="__rowKey"
      :size="props.node.size"
    >
      <template #bodyCell="{ column, index }">
        <template v-if="column.key === '__actions'">
          <Button
            danger
            size="small"
            type="link"
            @click="
              emit('remove-table-row', {
                layoutId: props.node.id,
                rowIndex: Number(index ?? 0),
              })
            "
          >
            {{ $t('workflow.formPreview.table.deleteRow') }}
          </Button>
        </template>
        <template v-else-if="column.dataIndex">
          <div class="space-y-1">
            <Input
              v-if="getColumnComponent(column) === 'Input'"
              :placeholder="getColumnPlaceholder(column)"
              size="small"
              :status="props.getTableCellError(props.node.id, Number(index ?? 0), String(column.dataIndex)) ? 'error' : ''"
              :value="
                props.getTableCellValue(
                  props.node.id,
                  Number(index ?? 0),
                  String(column.dataIndex),
                )
              "
              @update:value="
                (value) =>
                  emit('update-table-cell', {
                    dataIndex: String(column.dataIndex),
                    layoutId: props.node.id,
                    rowIndex: Number(index ?? 0),
                    value,
                  })
              "
            />

            <InputNumber
              v-else-if="getColumnComponent(column) === 'InputNumber'"
              :placeholder="getColumnPlaceholder(column)"
              size="small"
              style="width: 100%;"
              :value="
                props.getTableCellValue(
                  props.node.id,
                  Number(index ?? 0),
                  String(column.dataIndex),
                )
              "
              @update:value="
                (value) =>
                  emit('update-table-cell', {
                    dataIndex: String(column.dataIndex),
                    layoutId: props.node.id,
                    rowIndex: Number(index ?? 0),
                    value,
                  })
              "
            />

            <Select
              v-else-if="getColumnComponent(column) === 'Select'"
              :placeholder="getColumnPlaceholder(column)"
              size="small"
              :options="getColumnOptions(column)"
              :value="
                props.getTableCellValue(
                  props.node.id,
                  Number(index ?? 0),
                  String(column.dataIndex),
                )
              "
              @update:value="
                (value) =>
                  emit('update-table-cell', {
                    dataIndex: String(column.dataIndex),
                    layoutId: props.node.id,
                    rowIndex: Number(index ?? 0),
                    value,
                  })
              "
            />

            <Switch
              v-else
              size="small"
              :checked="
                Boolean(
                  props.getTableCellValue(
                    props.node.id,
                    Number(index ?? 0),
                    String(column.dataIndex),
                  ),
                )
              "
              @update:checked="
                (value) =>
                  emit('update-table-cell', {
                    dataIndex: String(column.dataIndex),
                    layoutId: props.node.id,
                    rowIndex: Number(index ?? 0),
                    value,
                  })
              "
            />

            <div
              v-if="props.getTableCellError(props.node.id, Number(index ?? 0), String(column.dataIndex))"
              class="text-xs text-destructive"
            >
              {{ props.getTableCellError(props.node.id, Number(index ?? 0), String(column.dataIndex)) }}
            </div>
          </div>
        </template>
      </template>
    </Table>
  </Card>

  <Divider v-else-if="props.node.layoutType === 'Divider'" :dashed="Boolean(props.node.dashed)">
    {{ props.node.label }}
  </Divider>
</template>
