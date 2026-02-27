<script setup lang="ts">
import type {
  FormDesignerNode,
  FormFieldSchema,
  TableLayoutColumn,
  TableLayoutSchema,
} from '#/views/workflow/form-designer/types';
import type { VbenFormSchema } from '#/adapter/form';

import { computed, onMounted, reactive, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { storeToRefs } from 'pinia';

import { Button, Card, Empty, Form, message } from 'antdv-next';

import { $t } from '#/locales';
import { useVbenForm } from '#/adapter/form';
import useWorkflowFormDesignerStore from '#/store/workflow/form-designer';
import {
  resolveFieldRequired,
  resolveFieldVisible,
} from '#/views/workflow/form-designer/expression';
import { resolveFieldLabel } from '#/views/workflow/form-designer/i18n';
import {
  runAsyncValidator,
  runSyncValidator,
} from '#/views/workflow/form-designer/validation-registry';
import PreviewNodeItem from '#/views/workflow/form-preview/components/PreviewNodeItem.vue';

const route = useRoute();
const router = useRouter();
const designerStore = useWorkflowFormDesignerStore();
const TABLE_INTERNAL_ROW_KEY = '__rowKey';

const formModel = reactive<Record<string, any>>({});
const fieldErrors = reactive<Record<string, string>>({});
const tableCellErrors = reactive<Record<string, string>>({});
const tableRowsMap = reactive<Record<string, Array<Record<string, any>>>>({});

const { formValues, schema, vbenSchema } = storeToRefs(designerStore);
const previewFormSchema = computed<VbenFormSchema[]>(() => vbenSchema.value ?? []);
const previewFormLayout = computed(() => schema.value.formLayout ?? 'vertical');
const previewLabelAlign = computed(() => schema.value.formLabelAlign ?? 'right');
const previewLabelCol = computed(() => {
  if (previewFormLayout.value !== 'horizontal') return undefined;
  return { style: { width: `${Math.max(80, Number(schema.value.formLabelWidth || 120))}px` } };
});
const previewWrapperCol = computed(() => {
  if (previewFormLayout.value !== 'horizontal') return undefined;
  return { style: { flex: '1 1 0%' } };
});
const previewFormColon = computed(() => schema.value.formColon ?? true);
const previewFormDisabled = computed(() => schema.value.formDisabled ?? false);
const previewFormLabelWrap = computed(() => schema.value.formLabelWrap ?? false);
const previewFormRequiredMark = computed(() => schema.value.formRequiredMark ?? true);
const previewShowSerialNumber = computed(() => Boolean(schema.value.formShowSerialNumber));
const previewFormSize = computed(() => schema.value.formSize ?? 'middle');
const previewFormVariant = computed(() => schema.value.formVariant ?? 'outlined');
const previewFormValidateTrigger = computed(() => {
  const mode = schema.value.formValidateTrigger ?? 'change';
  if (mode === 'none') return false;
  if (mode === 'change,blur') return ['change', 'blur'];
  return mode;
});

const [PreviewVbenForm, previewFormApi] = useVbenForm(
  reactive({
    commonConfig: {
      componentProps: {
        class: 'w-full',
      },
    },
    layout: computed(() => previewFormLayout.value),
    schema: computed(() => previewFormSchema.value),
    showDefaultActions: false,
    wrapperClass: 'grid-cols-1',
  }),
);

function walkDesignerNodes(
  nodes: FormDesignerNode[],
  callback: (node: FormDesignerNode) => void,
) {
  for (const node of nodes) {
    callback(node);
    if (node.kind !== 'layout') continue;

    if (node.layoutType === 'Section') {
      walkDesignerNodes(node.children, callback);
      continue;
    }

    if (node.layoutType === 'Grid') {
      for (const column of node.columns) {
        walkDesignerNodes(column.children, callback);
      }
    }
  }
}

function collectTableLayouts(nodes: FormDesignerNode[]) {
  const layouts: TableLayoutSchema[] = [];
  walkDesignerNodes(nodes, (node) => {
    if (node.kind === 'layout' && node.layoutType === 'Table') {
      layouts.push(node);
    }
  });
  return layouts;
}

function collectFields(nodes: FormDesignerNode[]) {
  const fields: FormFieldSchema[] = [];
  walkDesignerNodes(nodes, (node) => {
    if (node.kind === 'field') {
      fields.push(node);
    }
  });
  return fields;
}

const hasPreviewContent = computed(() => schema.value.nodes.length > 0);
const fieldErrorEntries = computed(() =>
  Object.entries(fieldErrors).filter(([, error]) => Boolean(error)),
);
const tableLayouts = computed(() => collectTableLayouts(schema.value.nodes));
const fieldSerialNumberMap = computed(() => {
  const map: Record<string, number> = {};
  let serial = 1;
  collectFields(schema.value.nodes).forEach((field) => {
    map[field.id] = serial++;
  });
  return map;
});

function loadRecordFromRoute(showMessage = false) {
  const recordId = String(route.query.recordId ?? '').trim();
  if (!recordId) return false;

  const loaded = designerStore.loadSavedRecord(recordId);
  if (!loaded && showMessage) {
    message.error($t('workflow.formPreview.messages.savedRecordNotFound'));
  }
  return loaded;
}

function cloneDeep<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createTableRowKey() {
  return `row_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeTableColumnComponent(raw: any) {
  const value = String(raw ?? '').trim();
  if (value === 'InputNumber' || value === 'Select' || value === 'Switch') {
    return value;
  }
  return 'Input';
}

function getDefaultTableCellValue(column: TableLayoutColumn) {
  const component = normalizeTableColumnComponent(column.component);
  if (Object.hasOwn(column, 'defaultValue')) {
    return column.defaultValue;
  }
  if (component === 'Switch') return false;
  if (component === 'InputNumber') return undefined;
  return '';
}

function normalizeTableRows(rows: Array<Record<string, any>>, columns: TableLayoutColumn[]) {
  return (rows ?? []).map((row) => {
    const normalized: Record<string, any> = {};
    columns.forEach((column) => {
      normalized[column.dataIndex] = Object.hasOwn(row ?? {}, column.dataIndex)
        ? row?.[column.dataIndex]
        : getDefaultTableCellValue(column);
    });
    normalized[TABLE_INTERNAL_ROW_KEY] = row?.[TABLE_INTERNAL_ROW_KEY] || createTableRowKey();
    return normalized;
  });
}

function createEmptyRow(columns: TableLayoutColumn[]) {
  return {
    ...Object.fromEntries(columns.map((column) => [column.dataIndex, getDefaultTableCellValue(column)])),
    [TABLE_INTERNAL_ROW_KEY]: createTableRowKey(),
  };
}

function stripInternalRowMeta(rows: Array<Record<string, any>>) {
  return rows.map((row) => {
    const next = { ...row };
    delete next[TABLE_INTERNAL_ROW_KEY];
    return next;
  });
}

function clearAllFieldErrors() {
  Object.keys(fieldErrors).forEach((fieldName) => {
    delete fieldErrors[fieldName];
  });
}

function createTableCellErrorKey(layoutId: string, rowIndex: number, dataIndex: string) {
  return `${layoutId}::${rowIndex}::${dataIndex}`;
}

function clearTableCellErrors() {
  Object.keys(tableCellErrors).forEach((key) => {
    delete tableCellErrors[key];
  });
}

function setTableCellError(layoutId: string, rowIndex: number, dataIndex: string, messageText: string) {
  tableCellErrors[createTableCellErrorKey(layoutId, rowIndex, dataIndex)] = messageText;
}

function getTableCellError(layoutId: string, rowIndex: number, dataIndex: string) {
  return tableCellErrors[createTableCellErrorKey(layoutId, rowIndex, dataIndex)] ?? '';
}

function normalizeValidationError(value: any): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0) {
    return normalizeValidationError(value[0]);
  }
  if (value && typeof value === 'object') {
    if (typeof value.message === 'string') return value.message;
    if (typeof value.name === 'string') return value.name;
  }
  return $t('workflow.formPreview.messages.validationFailed');
}

function setValidationErrors(errors: Record<string, any>) {
  clearAllFieldErrors();
  Object.entries(errors || {}).forEach(([fieldName, error]) => {
    fieldErrors[fieldName] = normalizeValidationError(error);
  });
}

function isEmptyFieldValue(field: FormFieldSchema, value: any) {
  if (Array.isArray(value)) return value.length === 0;
  if (field.component === 'Upload') return !Array.isArray(value) || value.length === 0;
  return value === undefined || value === null || value === '';
}

function getFieldLabel(field: FormFieldSchema) {
  return resolveFieldLabel(field);
}

async function collectExpressionValidationErrors() {
  const errors: Record<string, string> = {};

  for (const field of designerStore.allFields) {
    const visible = resolveFieldVisible(field, formModel);
    if (!visible) continue;

    const required = resolveFieldRequired(field, formModel);
    if (required && isEmptyFieldValue(field, formModel[field.fieldName])) {
      errors[field.fieldName] = $t('workflow.formPreview.messages.pleaseInput', [
        getFieldLabel(field),
      ]);
      continue;
    }

    const value = formModel[field.fieldName];
    for (const rule of field.validationRules ?? []) {
      if (!rule || typeof rule !== 'object') continue;

      if (rule.type === 'minLength') {
        const min = Number(rule.value);
        if (!Number.isFinite(min)) continue;
        if (String(value ?? '').length < min) {
          errors[field.fieldName] = rule.message || $t('workflow.formPreview.messages.lengthAtLeast', [
            getFieldLabel(field),
            min,
          ]);
          break;
        }
        continue;
      }

      if (rule.type === 'maxLength') {
        const max = Number(rule.value);
        if (!Number.isFinite(max)) continue;
        if (String(value ?? '').length > max) {
          errors[field.fieldName] = rule.message || $t('workflow.formPreview.messages.lengthAtMost', [
            getFieldLabel(field),
            max,
          ]);
          break;
        }
        continue;
      }

      if (rule.type === 'pattern') {
        const patternText = String(rule.value ?? '').trim();
        if (!patternText) continue;
        try {
          if (!new RegExp(patternText).test(String(value ?? ''))) {
            errors[field.fieldName] = rule.message || $t('workflow.formPreview.messages.formatInvalid', [
              getFieldLabel(field),
            ]);
            break;
          }
        } catch {
          // Ignore invalid regular expression in rule config.
        }
        continue;
      }

      if (rule.type === 'custom') {
        const message = runSyncValidator(
          String(rule.value || ''),
          { field, model: formModel, value },
          rule.message || $t('workflow.formPreview.messages.invalid', [getFieldLabel(field)]),
        );
        if (message) {
          errors[field.fieldName] = message;
          break;
        }
        continue;
      }

      if (rule.type === 'async') {
        const message = await runAsyncValidator(
          String(rule.value || ''),
          { field, model: formModel, value },
          rule.message || $t('workflow.formPreview.messages.invalid', [getFieldLabel(field)]),
        );
        if (message) {
          errors[field.fieldName] = message;
          break;
        }
      }
    }
  }

  return errors;
}

function syncModelFromStore() {
  Object.keys(formModel).forEach((key) => {
    delete formModel[key];
  });

  Object.assign(formModel, formValues.value ?? {});

  for (const field of designerStore.allFields) {
    if (formModel[field.fieldName] === undefined && field.defaultValue !== undefined) {
      formModel[field.fieldName] = cloneDeep(field.defaultValue);
    }
  }

  previewFormApi.setValues(cloneDeep(formModel));
}

function handleFieldChange(fieldName: string) {
  if (!fieldName) return;
  if (!fieldErrors[fieldName]) return;
  delete fieldErrors[fieldName];
}

function syncTableRowsFromSchema() {
  const activeLayoutIds = new Set<string>();

  tableLayouts.value.forEach((layout) => {
    activeLayoutIds.add(layout.id);
    const existingRows = tableRowsMap[layout.id];
    const sourceRows = Array.isArray(existingRows) ? existingRows : layout.rows;
    tableRowsMap[layout.id] = normalizeTableRows(sourceRows, layout.columns);
  });

  Object.keys(tableRowsMap).forEach((layoutId) => {
    if (!activeLayoutIds.has(layoutId)) {
      delete tableRowsMap[layoutId];
    }
  });

  Object.keys(tableCellErrors).forEach((key) => {
    const layoutId = key.split('::')[0] || '';
    if (!activeLayoutIds.has(layoutId)) {
      delete tableCellErrors[key];
    }
  });
}

watch(
  () => formValues.value,
  () => {
    syncModelFromStore();
  },
  { deep: true },
);

watch(
  () => schema.value.nodes,
  () => {
    syncModelFromStore();
    syncTableRowsFromSchema();
  },
  { deep: true },
);

watch(
  formModel,
  () => {
    previewFormApi.setValues(cloneDeep(formModel));
  },
  { deep: true },
);

onMounted(() => {
  designerStore.loadFromStorage();
  loadRecordFromRoute(true);
  syncModelFromStore();
  syncTableRowsFromSchema();
});

watch(
  () => route.query.recordId,
  () => {
    if (!loadRecordFromRoute()) return;
    syncModelFromStore();
    syncTableRowsFromSchema();
  },
);

function getTableLayoutById(layoutId: string) {
  return tableLayouts.value.find((item) => item.id === layoutId);
}

function getTableColumnByDataIndex(layoutId: string, dataIndex: string) {
  const layout = getTableLayoutById(layoutId);
  if (!layout) return undefined;
  return layout.columns.find((column) => column.dataIndex === dataIndex);
}

function getTableRows(layoutId: string) {
  return tableRowsMap[layoutId] ?? [];
}

function appendTableRow(layoutId: string) {
  const layout = getTableLayoutById(layoutId);
  if (!layout) return;
  const rows = getTableRows(layoutId);
  tableRowsMap[layoutId] = [...rows, createEmptyRow(layout.columns)];
}

function removeTableRow(layoutId: string, rowIndex: number) {
  const rows = [...getTableRows(layoutId)];
  rows.splice(rowIndex, 1);
  tableRowsMap[layoutId] = rows;
  clearTableCellErrors();
}

function updateTableCell(layoutId: string, rowIndex: number, dataIndex: string, value: any) {
  const rows = [...getTableRows(layoutId)];
  const row = { ...(rows[rowIndex] ?? {}) };
  const column = getTableColumnByDataIndex(layoutId, dataIndex);
  const component = normalizeTableColumnComponent(column?.component);

  if (component === 'InputNumber') {
    if (value === undefined || value === null || value === '') {
      row[dataIndex] = undefined;
    } else {
      const nextNumber = Number(value);
      row[dataIndex] = Number.isFinite(nextNumber) ? nextNumber : value;
    }
  } else if (component === 'Switch') {
    row[dataIndex] = Boolean(value);
  } else {
    row[dataIndex] = value;
  }

  const cellErrorKey = createTableCellErrorKey(layoutId, rowIndex, dataIndex);
  if (tableCellErrors[cellErrorKey]) {
    delete tableCellErrors[cellErrorKey];
  }

  rows[rowIndex] = row;
  tableRowsMap[layoutId] = rows;
}

function getTableColumns(layout: TableLayoutSchema) {
  const columns: any[] = layout.columns.map((column) => ({
    component: normalizeTableColumnComponent(column.component),
    dataIndex: column.dataIndex,
    key: column.id || column.dataIndex,
    options: column.options ?? [],
    placeholder: column.placeholder ?? '',
    required: Boolean(column.required),
    title: column.title,
    validationRules: column.validationRules ?? [],
    width: Number.isFinite(Number(column.width)) ? Number(column.width) : undefined,
  }));

  columns.push({
    key: '__actions',
    title: $t('workflow.formPreview.table.actionsColumn'),
    width: 88,
  });

  return columns;
}

function getTableCellValue(layoutId: string, rowIndex: number, dataIndex: string) {
  const row = getTableRows(layoutId)[rowIndex];
  return row?.[dataIndex] ?? '';
}

function isEmptyTableCellValue(column: TableLayoutColumn, value: any) {
  const component = normalizeTableColumnComponent(column.component);
  if (component === 'Switch') {
    return value === undefined || value === null;
  }
  if (component === 'InputNumber') {
    return value === undefined || value === null || value === '';
  }
  if (Array.isArray(value)) return value.length === 0;
  return value === undefined || value === null || String(value).trim() === '';
}

function getTableColumnLabel(layout: TableLayoutSchema, column: TableLayoutColumn, rowIndex: number) {
  return `${layout.label} / ${column.title || column.dataIndex} / ${rowIndex + 1}`;
}

async function validateTableCells() {
  clearTableCellErrors();

  for (const layout of tableLayouts.value) {
    const rows = getTableRows(layout.id);

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex] ?? {};

      for (const column of layout.columns) {
        const value = row[column.dataIndex];
        const fieldLabel = getTableColumnLabel(layout, column, rowIndex);

        if (column.required && isEmptyTableCellValue(column, value)) {
          setTableCellError(
            layout.id,
            rowIndex,
            column.dataIndex,
            $t('workflow.formPreview.messages.pleaseInput', [fieldLabel]),
          );
          continue;
        }

        for (const rule of column.validationRules ?? []) {
          if (!rule || typeof rule !== 'object') continue;

          if (rule.type === 'minLength') {
            const min = Number(rule.value);
            if (!Number.isFinite(min)) continue;
            if (String(value ?? '').length < min) {
              setTableCellError(
                layout.id,
                rowIndex,
                column.dataIndex,
                rule.message || $t('workflow.formPreview.messages.lengthAtLeast', [fieldLabel, min]),
              );
              break;
            }
            continue;
          }

          if (rule.type === 'maxLength') {
            const max = Number(rule.value);
            if (!Number.isFinite(max)) continue;
            if (String(value ?? '').length > max) {
              setTableCellError(
                layout.id,
                rowIndex,
                column.dataIndex,
                rule.message || $t('workflow.formPreview.messages.lengthAtMost', [fieldLabel, max]),
              );
              break;
            }
            continue;
          }

          if (rule.type === 'pattern') {
            const patternText = String(rule.value ?? '').trim();
            if (!patternText) continue;
            try {
              if (!new RegExp(patternText).test(String(value ?? ''))) {
                setTableCellError(
                  layout.id,
                  rowIndex,
                  column.dataIndex,
                  rule.message || $t('workflow.formPreview.messages.formatInvalid', [fieldLabel]),
                );
                break;
              }
            } catch {
              // Ignore invalid regex config.
            }
            continue;
          }

          const fakeField: FormFieldSchema = {
            component: 'Input',
            fieldName: column.dataIndex,
            id: `${layout.id}_${column.id}_${rowIndex}`,
            kind: 'field',
            label: fieldLabel,
            required: Boolean(column.required),
          };

          if (rule.type === 'custom') {
            const msg = runSyncValidator(
              String(rule.value || ''),
              { field: fakeField, model: formModel, value },
              rule.message || $t('workflow.formPreview.messages.invalid', [fieldLabel]),
            );
            if (msg) {
              setTableCellError(layout.id, rowIndex, column.dataIndex, msg);
              break;
            }
            continue;
          }

          if (rule.type === 'async') {
            const msg = await runAsyncValidator(
              String(rule.value || ''),
              { field: fakeField, model: formModel, value },
              rule.message || $t('workflow.formPreview.messages.invalid', [fieldLabel]),
            );
            if (msg) {
              setTableCellError(layout.id, rowIndex, column.dataIndex, msg);
              break;
            }
          }
        }
      }
    }
  }

  return Object.keys(tableCellErrors).length === 0;
}

async function handleSaveValues() {
  const { errors, valid } = await previewFormApi.validate();
  const expressionErrors = await collectExpressionValidationErrors();
  const tableValid = await validateTableCells();
  const mergedErrors = {
    ...(errors ?? {}),
    ...expressionErrors,
  };

  if (!valid || Object.keys(expressionErrors).length > 0 || !tableValid) {
    setValidationErrors(mergedErrors);
    message.warning(
      fieldErrorEntries.value[0]?.[1] ||
      Object.values(tableCellErrors)[0] ||
      $t('workflow.formPreview.messages.fixValidationErrorsFirst'),
    );
    return;
  }

  clearAllFieldErrors();
  clearTableCellErrors();
  const values = await previewFormApi.getValues();
  designerStore.setFormValues({ ...values, ...formModel });

  tableLayouts.value.forEach((layout) => {
    designerStore.updateLayout(layout.id, {
      rows: cloneDeep(stripInternalRowMeta(getTableRows(layout.id))),
    });
  });

  designerStore.persist();
  message.success($t('workflow.formPreview.messages.formDataSaved'));
}

function backToDesigner() {
  router.push('/workflow/designer/form');
}

function getGridSpan(node: FormDesignerNode) {
  if (node.kind !== 'layout' || node.layoutType !== 'Grid') return 12;
  return node.columns.length === 3 ? 8 : 12;
}
</script>

<template>
  <Page auto-content-height content-class="h-full p-2">
    <div class="flex h-full min-h-0 flex-col gap-2">
      <div class="flex flex-wrap items-center gap-2 rounded-md border border-border bg-background p-2">
        <Button ghost type="primary" @click="backToDesigner">{{ $t('workflow.formPreview.actions.backToDesigner') }}</Button>
        <span class="text-base font-medium">{{ schema.title || $t('workflow.formPreview.title') }}</span>
        <span v-if="schema.description" class="text-sm text-muted-foreground">{{ schema.description }}</span>
        <span class="ml-auto text-sm text-muted-foreground">{{ $t('workflow.formPreview.currentPage') }}</span>
        <Button type="primary" @click="handleSaveValues">{{ $t('workflow.formPreview.actions.saveValues') }}</Button>
      </div>

      <Card class="flex-1 min-h-0 overflow-auto">
        <Empty v-if="!hasPreviewContent" :description="$t('workflow.formPreview.emptyPreviewContent')" />

        <div v-else class="mx-auto max-w-[1080px] p-2">
          <div class="hidden">
            <PreviewVbenForm />
          </div>

          <Form
            :layout="previewFormLayout as any"
            :label-align="previewLabelAlign"
            :label-col="previewLabelCol as any"
            :wrapper-col="previewWrapperCol as any"
            :colon="previewFormColon"
            :disabled="previewFormDisabled"
            :label-wrap="previewFormLabelWrap"
            :required-mark="previewFormRequiredMark"
            :size="previewFormSize as any"
            :validate-trigger="previewFormValidateTrigger as any"
            :variant="previewFormVariant as any"
          >
            <PreviewNodeItem
              v-for="node in schema.nodes"
              :key="node.id"
              :data-source-presets="schema.dataSourcePresets"
              :field-errors="fieldErrors"
              :field-serial-number-map="fieldSerialNumberMap"
              :get-grid-span="getGridSpan"
              :get-table-cell-error="getTableCellError"
              :get-table-cell-value="getTableCellValue"
              :get-table-columns="getTableColumns"
              :get-table-rows="getTableRows"
              :model="formModel"
              :node="node"
              :show-serial-number="previewShowSerialNumber"
              @append-table-row="appendTableRow"
              @change="handleFieldChange"
              @remove-table-row="(payload) => removeTableRow(payload.layoutId, payload.rowIndex)"
              @update-table-cell="
                (payload) =>
                  updateTableCell(payload.layoutId, payload.rowIndex, payload.dataIndex, payload.value)
              "
            />
          </Form>
        </div>
      </Card>
    </div>
  </Page>
</template>
