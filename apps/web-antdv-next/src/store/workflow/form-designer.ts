import { computed, ref } from 'vue';

import { defineStore } from 'pinia';

import type {
  FieldDataSourcePreset,
  FieldOption,
  FieldValidationRule,
  FormDesignerData,
  FormDesignerGlobalPatch,
  FormDesignerNode,
  FormDesignerSchema,
  FormFieldSchema,
  FormLayoutSchema,
  GridLayoutColumn,
  GridLayoutSchema,
  LayoutUpdatePatch,
  MaterialDefinition,
  SavedFormRecord,
  SectionLayoutSchema,
  TableColumnComponent,
  TableLayoutColumn,
  TableLayoutSchema,
  UploadValueItem,
} from '#/views/workflow/form-designer/types';
import {
  createDefaultFieldDataSourceConfig,
  createDefaultFieldLinkageConfig,
  createEmptyDesignerSchema,
  FORM_DESIGNER_SCHEMA_VERSION,
  getFieldPatchByMaterialKey,
  getMaterialByKey,
  isFieldMaterial,
  isFieldNode,
  isLayoutMaterial,
  isLayoutNode,
  supportsDataSourceFieldComponent,
  supportsStaticOptionsFieldComponent,
  toVbenFormSchema,
} from '#/views/workflow/form-designer/types';

const STORAGE_KEY = 'workflow_form_designer_data_v1';
const RECORDS_STORAGE_KEY = 'workflow_form_designer_records_v1';
const MAX_SNAPSHOT_COUNT = 50;

interface DesignerSnapshot {
  schema: FormDesignerSchema;
  selectedId?: string;
  values: Record<string, any>;
}

interface ImportJsonResult {
  message?: string;
  ok: boolean;
}

interface SelectableLocation {
  index: number;
  item: FormDesignerNode;
  list: FormDesignerNode[];
}

function cloneDeep<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createId() {
  return `fd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function readSavedRecordsFromStorage() {
  if (typeof localStorage === 'undefined') return [] as SavedFormRecord[];
  const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
  if (!raw) return [] as SavedFormRecord[];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedFormRecord[]) : [];
  } catch {
    return [] as SavedFormRecord[];
  }
}

function writeSavedRecordsToStorage(records: SavedFormRecord[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
}

function sanitizeUploadValueItem(item: any): UploadValueItem | null {
  if (!item || typeof item !== 'object') return null;
  const uid = String(item.uid ?? createId());
  const name = String(item.name ?? 'file');
  const status = item.status ? String(item.status) : 'done';
  const url = item.url ? String(item.url) : undefined;
  const thumbUrl = item.thumbUrl
    ? String(item.thumbUrl)
    : item.preview
      ? String(item.preview)
      : undefined;
  return {
    name,
    status: status as UploadValueItem['status'],
    thumbUrl,
    uid,
    url,
  };
}

function sanitizeFormValues(values: Record<string, any>) {
  const data: Record<string, any> = {};
  for (const [key, value] of Object.entries(values || {})) {
    if (Array.isArray(value)) {
      if (value.every((item) => item && typeof item === 'object' && 'uid' in item)) {
        data[key] = value.map((item) => sanitizeUploadValueItem(item)).filter(Boolean);
      } else {
        data[key] = value;
      }
      continue;
    }
    data[key] = value;
  }
  return data;
}

function normalizeDataSourcePresets(raw: any): FieldDataSourcePreset[] {
  if (!Array.isArray(raw)) return [];

  const usedKeys = new Set<string>();
  const list: FieldDataSourcePreset[] = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const key = String(item.key ?? '').trim();
    if (!key || usedKeys.has(key)) continue;

    const url = String(item.url ?? '').trim();
    if (!url) continue;

    const label = String(item.label ?? key).trim() || key;
    const method = String(item.method ?? 'GET').toUpperCase() === 'POST' ? 'POST' : 'GET';
    const headers = item.headers && typeof item.headers === 'object' && !Array.isArray(item.headers)
      ? item.headers
      : {};
    const description = item.description ? String(item.description) : '';

    list.push({
      description,
      headers,
      key,
      label,
      method,
      url,
    });
    usedKeys.add(key);
  }

  return list;
}

function normalizeSchemaVersion(rawVersion: any) {
  const version = Number(rawVersion);
  if (!Number.isFinite(version) || version <= 0) return 1;
  return Math.floor(version);
}

function walkDesignerNodes(
  nodes: FormDesignerNode[],
  callback: (node: FormDesignerNode) => void,
) {
  for (const node of nodes) {
    callback(node);

    if (!isLayoutNode(node)) continue;

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

function collectFieldNames(nodes: FormDesignerNode[]) {
  const names = collectFields(nodes).map((item) => item.fieldName);
  return names;
}

function collectFields(nodes: FormDesignerNode[]) {
  const fields: FormFieldSchema[] = [];
  walkDesignerNodes(nodes, (node) => {
    if (isFieldNode(node)) {
      fields.push(node);
    }
  });

  return fields;
}

function normalizeTableColumnComponent(raw: any): TableColumnComponent {
  const value = String(raw ?? '').trim();
  if (value === 'InputNumber' || value === 'Select' || value === 'Switch') {
    return value;
  }
  return 'Input';
}

function normalizeTableColumnOptions(raw: any): FieldOption[] | undefined {
  if (!Array.isArray(raw)) return undefined;

  const options = raw
    .map((item) => {
      if (!item || typeof item !== 'object') return undefined;
      const label = String(item.label ?? '').trim();
      const value = item.value;
      if (!label) return undefined;
      if (typeof value !== 'string' && typeof value !== 'number') return undefined;
      return {
        label,
        value,
      } as FieldOption;
    })
    .filter((item): item is FieldOption => Boolean(item));

  return options.length > 0 ? options : undefined;
}

function normalizeTableColumnValidationRules(raw: any): FieldValidationRule[] | undefined {
  if (!Array.isArray(raw)) return undefined;

  const rules: FieldValidationRule[] = [];
  raw.forEach((item) => {
    if (!item || typeof item !== 'object') return;
    const type = String(item.type || '').trim() as FieldValidationRule['type'];
    if (!['maxLength', 'minLength', 'pattern', 'custom', 'async'].includes(type)) return;

    if (type === 'pattern' || type === 'custom' || type === 'async') {
      const value = String(item.value || '').trim();
      if (!value) return;
      rules.push({
        message: item.message ? String(item.message) : undefined,
        trigger: item.trigger ? String(item.trigger) as any : undefined,
        type,
        value,
      });
      return;
    }

    const value = Number(item.value);
    if (!Number.isFinite(value)) return;
    rules.push({
      message: item.message ? String(item.message) : undefined,
      trigger: item.trigger ? String(item.trigger) as any : undefined,
      type,
      value,
    });
  });

  return rules.length > 0 ? rules : undefined;
}

function getDefaultTableCellValue(column: TableLayoutColumn) {
  const component = normalizeTableColumnComponent(column.component);
  if (component === 'Switch') return false;
  if (component === 'InputNumber') return undefined;
  return '';
}

function normalizeTableColumns(raw: any): TableLayoutColumn[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return createDefaultTableColumns();
  }

  return raw.map((column, index) => {
    const component = normalizeTableColumnComponent(column?.component);
    const required = Boolean(column?.required);
    const width = Number(column?.width);

    const normalized: TableLayoutColumn = {
      component,
      dataIndex: String(column?.dataIndex || `col_${index + 1}`),
      defaultValue: Object.hasOwn(column ?? {}, 'defaultValue')
        ? column?.defaultValue
        : getDefaultTableCellValue({ component } as TableLayoutColumn),
      id: String(column?.id || createId()),
      placeholder: String(column?.placeholder ?? ''),
      required,
      title: String(column?.title || `列${index + 1}`),
      width: Number.isFinite(width) && width > 0 ? width : undefined,
    };

    if (component === 'Select') {
      normalized.options = normalizeTableColumnOptions(column?.options);
    }
    const rules = normalizeTableColumnValidationRules(column?.validationRules);
    if (rules) {
      normalized.validationRules = rules;
    }
    return normalized;
  });
}

function normalizeTableRows(
  raw: any,
  columns: TableLayoutColumn[],
): Array<Record<string, any>> {
  if (!Array.isArray(raw)) {
    return createDefaultTableRows(columns);
  }

  return raw.map((item) => {
    const row = typeof item === 'object' && item ? item : {};
    const normalized: Record<string, any> = {};
    columns.forEach((column) => {
      if (Object.hasOwn(row, column.dataIndex)) {
        normalized[column.dataIndex] = row[column.dataIndex];
      } else {
        normalized[column.dataIndex] = getDefaultTableCellValue(column);
      }
    });
    return normalized;
  });
}

function createDefaultTableColumns(): TableLayoutColumn[] {
  return [
    { component: 'Input', dataIndex: 'col_1', id: createId(), placeholder: '', required: false, title: '列1' },
    { component: 'Input', dataIndex: 'col_2', id: createId(), placeholder: '', required: false, title: '列2' },
    { component: 'Input', dataIndex: 'col_3', id: createId(), placeholder: '', required: false, title: '列3' },
  ];
}

function createDefaultTableRows(columns: TableLayoutColumn[]): Array<Record<string, any>> {
  return [
    Object.fromEntries(columns.map((item) => [item.dataIndex, getDefaultTableCellValue(item)])),
    Object.fromEntries(columns.map((item) => [item.dataIndex, getDefaultTableCellValue(item)])),
  ];
}

const useWorkflowFormDesignerStore = defineStore('workflow-form-designer-store', () => {
  const schema = ref<FormDesignerSchema>(createEmptyDesignerSchema());
  const formValues = ref<Record<string, any>>({});
  const selectedId = ref<undefined | string>(undefined);
  const clipboardNode = ref<FormDesignerNode>();

  const undoList = ref<DesignerSnapshot[]>([]);
  const redoList = ref<DesignerSnapshot[]>([]);

  const canUndo = computed(() => undoList.value.length > 0);
  const canRedo = computed(() => redoList.value.length > 0);

  const allFields = computed(() => collectFields(schema.value.nodes));
  const hasFields = computed(() => allFields.value.length > 0);
  const vbenSchema = computed(() => toVbenFormSchema(allFields.value));

  function getUniqueFieldName(preferred: string, excludeId?: string) {
    const names = new Set(
      collectFields(schema.value.nodes)
        .filter((item) => item.id !== excludeId)
        .map((item) => item.fieldName),
    );
    if (!names.has(preferred)) return preferred;

    let index = 1;
    let candidate = `${preferred}_${index}`;
    while (names.has(candidate)) {
      index++;
      candidate = `${preferred}_${index}`;
    }
    return candidate;
  }

  function captureSnapshot(): DesignerSnapshot {
    return cloneDeep({
      schema: schema.value,
      selectedId: selectedId.value,
      values: formValues.value,
    });
  }

  function applySnapshot(snapshot: DesignerSnapshot) {
    schema.value = cloneDeep(snapshot.schema);
    formValues.value = cloneDeep(snapshot.values);
    selectedId.value = snapshot.selectedId;
  }

  function backup() {
    undoList.value.push(captureSnapshot());
    if (undoList.value.length > MAX_SNAPSHOT_COUNT) {
      undoList.value.shift();
    }
    redoList.value = [];
  }

  function persist() {
    if (typeof localStorage === 'undefined') return;
    const payload: FormDesignerData = {
      schema: schema.value,
      values: sanitizeFormValues(formValues.value),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function normalizeNode(rawNode: any): FormDesignerNode | null {
    if (!rawNode || typeof rawNode !== 'object') return null;

    if (rawNode.kind === 'field') {
      return rawNode as FormFieldSchema;
    }

    if (rawNode.kind === 'layout') {
      if (rawNode.layoutType === 'Section') {
        const children = Array.isArray(rawNode.children)
          ? rawNode.children
            .map((item: any) => normalizeNode(item))
            .filter(Boolean) as FormDesignerNode[]
          : [];
        return {
          ...rawNode,
          backgroundColor: rawNode.backgroundColor ?? '',
          children,
          description: rawNode.description ?? '',
        } as SectionLayoutSchema;
      }

      if (rawNode.layoutType === 'Grid') {
        const columns = Array.isArray(rawNode.columns)
          ? rawNode.columns.map((column: any, index: number) => ({
            children: Array.isArray(column?.children)
              ? column.children
                .map((item: any) => normalizeNode(item))
                .filter(Boolean) as FormDesignerNode[]
              : [],
            id: String(column?.id || createId()),
            span: Number.isFinite(Number(column?.span))
              ? Number(column.span)
              : Math.floor(24 / Math.max(1, Number(rawNode.columns?.length || 2))),
            title: String(column?.title || `列${index + 1}`),
          }))
          : [];
        return {
          ...rawNode,
          backgroundColor: rawNode.backgroundColor ?? '',
          columns,
          gap: Number(rawNode.gap ?? 16),
        } as GridLayoutSchema;
      }

      if (rawNode.layoutType === 'Table') {
        const columns = normalizeTableColumns(rawNode.columns);
        const rows = normalizeTableRows(rawNode.rows, columns);
        return {
          ...rawNode,
          backgroundColor: rawNode.backgroundColor ?? '',
          bordered: Boolean(rawNode.bordered),
          columns,
          rows,
          size: rawNode.size || 'middle',
        } as TableLayoutSchema;
      }

      if (rawNode.layoutType === 'Divider') {
        return {
          ...rawNode,
          dashed: Boolean(rawNode.dashed),
        } as FormLayoutSchema;
      }
    }

    if (rawNode.fieldName && rawNode.component) {
      return {
        ...rawNode,
        kind: 'field',
      } as FormFieldSchema;
    }

    return null;
  }

  function normalizeLegacyPayload(raw: FormDesignerData): FormDesignerData {
    const schemaData = raw?.schema as any;
    if (!schemaData) {
      return {
        schema: createEmptyDesignerSchema(),
        values: {},
      };
    }

    if (Array.isArray(schemaData.nodes)) {
      const nodes = schemaData.nodes
        .map((item: any) => normalizeNode(item))
        .filter(Boolean) as FormDesignerNode[];
      return {
        schema: {
          dataSourcePresets: normalizeDataSourcePresets(schemaData.dataSourcePresets),
          description: schemaData.description ?? '',
          formColon: schemaData.formColon ?? true,
          formDisabled: schemaData.formDisabled ?? false,
          formLabelAlign: schemaData.formLabelAlign ?? 'right',
          formLabelWrap: schemaData.formLabelWrap ?? false,
          formLabelWidth: Number.isFinite(Number(schemaData.formLabelWidth))
            ? Number(schemaData.formLabelWidth)
            : 120,
          formLayout: schemaData.formLayout ?? 'vertical',
          formRequiredMark: schemaData.formRequiredMark ?? true,
          formShowSerialNumber: schemaData.formShowSerialNumber ?? false,
          formSize: schemaData.formSize ?? 'middle',
          formValidateTrigger: schemaData.formValidateTrigger ?? 'change',
          formVariant: schemaData.formVariant ?? 'outlined',
          nodes,
          schemaVersion:
            normalizeSchemaVersion(schemaData.schemaVersion) >= FORM_DESIGNER_SCHEMA_VERSION
              ? normalizeSchemaVersion(schemaData.schemaVersion)
              : FORM_DESIGNER_SCHEMA_VERSION,
          title: schemaData.title ?? '未命名表单',
        },
        values: sanitizeFormValues(raw.values ?? {}),
      };
    }

    if (Array.isArray(schemaData.fields)) {
      const nodes = schemaData.fields.map((field: any) => ({
        ...field,
        kind: 'field',
      })) as FormDesignerNode[];

      return {
        schema: {
          dataSourcePresets: normalizeDataSourcePresets(schemaData.dataSourcePresets),
          description: schemaData.description ?? '',
          formColon: schemaData.formColon ?? true,
          formDisabled: schemaData.formDisabled ?? false,
          formLabelAlign: schemaData.formLabelAlign ?? 'right',
          formLabelWrap: schemaData.formLabelWrap ?? false,
          formLabelWidth: Number.isFinite(Number(schemaData.formLabelWidth))
            ? Number(schemaData.formLabelWidth)
            : 120,
          formLayout: schemaData.formLayout ?? 'vertical',
          formRequiredMark: schemaData.formRequiredMark ?? true,
          formShowSerialNumber: schemaData.formShowSerialNumber ?? false,
          formSize: schemaData.formSize ?? 'middle',
          formValidateTrigger: schemaData.formValidateTrigger ?? 'change',
          formVariant: schemaData.formVariant ?? 'outlined',
          nodes,
          schemaVersion: FORM_DESIGNER_SCHEMA_VERSION,
          title: schemaData.title ?? '未命名表单',
        },
        values: sanitizeFormValues(raw.values ?? {}),
      };
    }

    return {
      schema: createEmptyDesignerSchema(),
      values: {},
    };
  }

  function validateImportedPayload(payload: FormDesignerData): null | string {
    const fields = collectFields(payload.schema.nodes);
    const names = new Set<string>();

    for (const field of fields) {
      if (!field || typeof field !== 'object') {
        return '字段结构不正确';
      }
      if (!String(field.id ?? '').trim()) {
        return '存在缺少 id 的字段';
      }
      if (!String(field.fieldName ?? '').trim()) {
        return '存在缺少 fieldName 的字段';
      }
      if (!String(field.component ?? '').trim()) {
        return '存在缺少 component 的字段';
      }

      const fieldName = String(field.fieldName).trim();
      if (names.has(fieldName)) {
        return `字段标识重复: ${fieldName}`;
      }
      names.add(fieldName);
    }

    return null;
  }

  function importFromJson(rawJson: string): ImportJsonResult {
    const text = String(rawJson ?? '').trim();
    if (!text) {
      return {
        message: 'JSON 内容为空',
        ok: false,
      };
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      return {
        message: 'JSON 格式不正确',
        ok: false,
      };
    }

    let rawPayload: FormDesignerData | null = null;
    if (parsed && typeof parsed === 'object') {
      if (parsed.schema && typeof parsed.schema === 'object') {
        rawPayload = {
          schema: parsed.schema as FormDesignerSchema,
          values: parsed.values ?? {},
        };
      } else if (Array.isArray(parsed.nodes) || Array.isArray(parsed.fields)) {
        rawPayload = {
          schema: parsed as FormDesignerSchema,
          values: parsed.values ?? {},
        };
      }
    }

    if (!rawPayload) {
      return {
        message: '仅支持导入 { schema, values } 或 schema 对象',
        ok: false,
      };
    }

    const normalized = normalizeLegacyPayload(rawPayload);
    const error = validateImportedPayload(normalized);
    if (error) {
      return {
        message: error,
        ok: false,
      };
    }

    backup();
    schema.value = cloneDeep(normalized.schema);
    formValues.value = sanitizeFormValues(cloneDeep(normalized.values));
    selectedId.value = undefined;
    persist();

    return { ok: true };
  }

  function loadFromStorage() {
    if (typeof localStorage === 'undefined') return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as FormDesignerData;
      const normalized = normalizeLegacyPayload(parsed);
      schema.value = normalized.schema;
      formValues.value = normalized.values;
    } catch (error) {
      console.error('Failed to parse form designer cache', error);
    }
  }

  function normalizeSavedRecord(raw: any): null | SavedFormRecord {
    if (!raw || typeof raw !== 'object') return null;

    const normalized = normalizeLegacyPayload({
      schema: raw.schema as FormDesignerSchema,
      values: raw.values ?? {},
    });
    const now = new Date().toISOString();
    const title = String(raw.title ?? normalized.schema.title ?? '未命名表单').trim();
    const description = String(raw.description ?? normalized.schema.description ?? '');
    const savedAt = String(raw.savedAt ?? raw.updatedAt ?? now);
    const updatedAt = String(raw.updatedAt ?? raw.savedAt ?? now);

    return {
      description,
      id: String(raw.id ?? createId()),
      savedAt,
      schema: normalized.schema,
      title: title || '未命名表单',
      updatedAt,
      values: normalized.values,
    };
  }

  function getSavedRecords() {
    const records = readSavedRecordsFromStorage()
      .map((item) => normalizeSavedRecord(item))
      .filter(Boolean) as SavedFormRecord[];

    records.sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return records;
  }

  function getSavedRecordById(recordId: string) {
    const record = getSavedRecords().find((item) => item.id === recordId);
    return record ? cloneDeep(record) : undefined;
  }

  function saveCurrentAsRecord(recordId?: string) {
    const records = getSavedRecords();
    const existing = recordId
      ? records.find((item) => item.id === recordId)
      : undefined;
    const now = new Date().toISOString();
    const nextRecord: SavedFormRecord = {
      description: schema.value.description || '',
      id: existing?.id ?? createId(),
      savedAt: existing?.savedAt ?? now,
      schema: cloneDeep(schema.value),
      title: (schema.value.title || '').trim() || '未命名表单',
      updatedAt: now,
      values: sanitizeFormValues(cloneDeep(formValues.value)),
    };

    const nextRecords = records.filter((item) => item.id !== nextRecord.id);
    nextRecords.unshift(nextRecord);
    writeSavedRecordsToStorage(nextRecords);

    return cloneDeep(nextRecord);
  }

  function removeSavedRecord(recordId: string) {
    const records = getSavedRecords();
    const nextRecords = records.filter((item) => item.id !== recordId);
    if (nextRecords.length === records.length) return false;
    writeSavedRecordsToStorage(nextRecords);
    return true;
  }

  function loadSavedRecord(recordId: string) {
    const record = getSavedRecordById(recordId);
    if (!record) return false;

    schema.value = cloneDeep(record.schema);
    formValues.value = sanitizeFormValues(cloneDeep(record.values));
    selectedId.value = undefined;
    persist();
    return true;
  }

  function findSelectableLocationById(id: string): null | SelectableLocation {
    const findInList = (list: FormDesignerNode[]): null | SelectableLocation => {
      for (let index = 0; index < list.length; index++) {
        const node = list[index]!;
        if (node.id === id) {
          return { index, item: node, list };
        }

        if (!isLayoutNode(node)) continue;

        if (node.layoutType === 'Section') {
          const foundInSection = findInList(node.children);
          if (foundInSection) return foundInSection;
          continue;
        }

        if (node.layoutType === 'Grid') {
          for (const column of node.columns) {
            const foundInColumn = findInList(column.children);
            if (foundInColumn) return foundInColumn;
          }
        }
      }

      return null;
    };

    return findInList(schema.value.nodes);
  }

  function getSelectedLocation() {
    if (!selectedId.value) return null;
    return findSelectableLocationById(selectedId.value);
  }

  const selectedEntity = computed(() => {
    const location = getSelectedLocation();
    return location?.item;
  });

  const selectedField = computed(() => {
    const selected = selectedEntity.value;
    return selected && isFieldNode(selected) ? selected : undefined;
  });

  const selectedLayout = computed(() => {
    const selected = selectedEntity.value;
    return selected && isLayoutNode(selected) ? selected : undefined;
  });
  const canCopy = computed(() => Boolean(selectedEntity.value));
  const canPaste = computed(() => Boolean(clipboardNode.value));

  function createFieldNode(material: MaterialDefinition): FormFieldSchema {
    const nextIndex = collectFieldNames(schema.value.nodes).length + 1;
    const rawName = `field_${nextIndex}`;
    const fieldName = getUniqueFieldName(rawName);
    const patch = getFieldPatchByMaterialKey(material.key, fieldName);

    return {
      ...patch,
      description: patch.description ?? '',
      fieldName,
      id: createId(),
      kind: 'field',
    } as FormFieldSchema;
  }

  function createGridColumns(count: number, oldColumns?: GridLayoutColumn[]) {
    const columns: GridLayoutColumn[] = [];
    for (let i = 0; i < count; i++) {
      columns.push({
        children: [],
        id: createId(),
        span: Math.floor(24 / count),
        title: `列${i + 1}`,
      });
    }

    if (oldColumns && oldColumns.length > 0) {
      const oldChildren = oldColumns.flatMap((item) => item.children);
      oldChildren.forEach((child, index) => {
        const target = columns[index % count];
        if (target) {
          target.children.push(child);
        }
      });
    }

    return columns;
  }

  function createLayoutNode(material: MaterialDefinition): FormLayoutSchema {
    if (material.key === 'layout-divider') {
      return {
        dashed: false,
        id: createId(),
        kind: 'layout',
        label: '分割线',
        layoutType: 'Divider',
      };
    }

    if (material.key === 'layout-section') {
      return {
        backgroundColor: '',
        children: [],
        description: '',
        id: createId(),
        kind: 'layout',
        label: '分组容器',
        layoutType: 'Section',
      };
    }

    if (material.key === 'layout-table') {
      const columns = createDefaultTableColumns();
      return {
        backgroundColor: '',
        bordered: true,
        columns,
        id: createId(),
        kind: 'layout',
        label: '表格',
        layoutType: 'Table',
        rows: createDefaultTableRows(columns),
        size: 'middle',
      };
    }

    const count = material.key === 'layout-grid-3' ? 3 : 2;
    return {
      backgroundColor: '',
      columns: createGridColumns(count),
      gap: 16,
      id: createId(),
      kind: 'layout',
      label: count === 3 ? '三列布局' : '两列布局',
      layoutType: 'Grid',
    };
  }

  function insertRootNode(node: FormDesignerNode, beforeNodeId?: string) {
    const list = schema.value.nodes;
    const index = beforeNodeId ? list.findIndex((item) => item.id === beforeNodeId) : -1;
    if (index >= 0) {
      list.splice(index, 0, node);
    } else {
      list.push(node);
    }
  }

  function setDefaultFormValue(field: FormFieldSchema) {
    if (field.defaultValue === undefined) return;
    formValues.value[field.fieldName] = cloneDeep(field.defaultValue);
  }

  function createFieldNameAllocator() {
    const usedNames = new Set(collectFieldNames(schema.value.nodes));
    return (preferredName: string) => {
      const raw = String(preferredName || '').trim();
      const base = raw || `field_${usedNames.size + 1}`;
      if (!usedNames.has(base)) {
        usedNames.add(base);
        return base;
      }

      let index = 1;
      let candidate = `${base}_${index}`;
      while (usedNames.has(candidate)) {
        index++;
        candidate = `${base}_${index}`;
      }
      usedNames.add(candidate);
      return candidate;
    };
  }

  function replaceFieldReferencesInText(
    text: string,
    sourceToTargetFieldNameMap: Record<string, string>,
  ) {
    let output = text;
    for (const [sourceFieldName, targetFieldName] of Object.entries(sourceToTargetFieldNameMap)) {
      const escapedFieldName = sourceFieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      output = output.replace(
        new RegExp(`\\$field_${escapedFieldName}(?![A-Za-z0-9_])`, 'g'),
        `$field_${targetFieldName}`,
      );
      output = output.replace(
        new RegExp(`\\$field\\.${escapedFieldName}(?![A-Za-z0-9_])`, 'g'),
        `$field.${targetFieldName}`,
      );
    }
    return output;
  }

  function rewriteNodeFieldReferences(
    node: FormDesignerNode,
    sourceToTargetFieldNameMap: Record<string, string>,
  ) {
    if (isFieldNode(node)) {
      if (node.requiredExpression) {
        node.requiredExpression = replaceFieldReferencesInText(
          node.requiredExpression,
          sourceToTargetFieldNameMap,
        );
      }
      if (node.visibleExpression) {
        node.visibleExpression = replaceFieldReferencesInText(
          node.visibleExpression,
          sourceToTargetFieldNameMap,
        );
      }
      if (node.linkage?.dependsOn?.length) {
        node.linkage.dependsOn = node.linkage.dependsOn.map(
          (name) => sourceToTargetFieldNameMap[name] ?? name,
        );
      }
      if (node.linkage?.paramMap && typeof node.linkage.paramMap === 'object') {
        const mappedEntries = Object.entries(node.linkage.paramMap).map(([key, value]) => {
          if (typeof value !== 'string') {
            return [key, value] as const;
          }
          return [
            key,
            replaceFieldReferencesInText(value, sourceToTargetFieldNameMap),
          ] as const;
        });
        node.linkage.paramMap = Object.fromEntries(mappedEntries);
      }
      return;
    }

    if (node.layoutType === 'Section') {
      node.children.forEach((child) => rewriteNodeFieldReferences(child, sourceToTargetFieldNameMap));
      return;
    }

    if (node.layoutType === 'Grid') {
      node.columns.forEach((column) => {
        column.children.forEach((child) => rewriteNodeFieldReferences(child, sourceToTargetFieldNameMap));
      });
    }
  }

  function cloneNodeWithFreshIdentity(
    sourceNode: FormDesignerNode,
    allocateFieldName: (preferredName: string) => string,
    sourceToTargetFieldNameMap: Record<string, string>,
  ): FormDesignerNode {
    if (isFieldNode(sourceNode)) {
      const sourceFieldName = sourceNode.fieldName;
      const targetFieldName = allocateFieldName(sourceFieldName);
      sourceToTargetFieldNameMap[sourceFieldName] = targetFieldName;
      return {
        ...cloneDeep(sourceNode),
        fieldName: targetFieldName,
        id: createId(),
      };
    }

    if (sourceNode.layoutType === 'Section') {
      return {
        ...cloneDeep(sourceNode),
        children: sourceNode.children.map((child) =>
          cloneNodeWithFreshIdentity(child, allocateFieldName, sourceToTargetFieldNameMap),
        ),
        id: createId(),
      };
    }

    if (sourceNode.layoutType === 'Grid') {
      return {
        ...cloneDeep(sourceNode),
        columns: sourceNode.columns.map((column) => ({
          ...cloneDeep(column),
          children: column.children.map((child) =>
            cloneNodeWithFreshIdentity(child, allocateFieldName, sourceToTargetFieldNameMap),
          ),
          id: createId(),
        })),
        id: createId(),
      };
    }

    if (sourceNode.layoutType === 'Table') {
      return {
        ...cloneDeep(sourceNode),
        columns: sourceNode.columns.map((column) => ({
          ...cloneDeep(column),
          id: createId(),
        })),
        id: createId(),
      };
    }

    return {
      ...cloneDeep(sourceNode),
      id: createId(),
    };
  }

  function buildClonedNode(sourceNode: FormDesignerNode) {
    const sourceToTargetFieldNameMap: Record<string, string> = {};
    const allocateFieldName = createFieldNameAllocator();
    const clonedNode = cloneNodeWithFreshIdentity(
      cloneDeep(sourceNode),
      allocateFieldName,
      sourceToTargetFieldNameMap,
    );
    rewriteNodeFieldReferences(clonedNode, sourceToTargetFieldNameMap);
    return {
      clonedNode,
      sourceToTargetFieldNameMap,
    };
  }

  function applyClonedNodeValues(
    clonedNode: FormDesignerNode,
    sourceToTargetFieldNameMap: Record<string, string>,
  ) {
    const targetToSourceFieldNameMap = new Map<string, string>();
    Object.entries(sourceToTargetFieldNameMap).forEach(([sourceFieldName, targetFieldName]) => {
      targetToSourceFieldNameMap.set(targetFieldName, sourceFieldName);
    });

    const clonedFields = collectFields([clonedNode]);
    clonedFields.forEach((field) => {
      const sourceFieldName = targetToSourceFieldNameMap.get(field.fieldName);
      if (sourceFieldName && Object.hasOwn(formValues.value, sourceFieldName)) {
        formValues.value[field.fieldName] = cloneDeep(formValues.value[sourceFieldName]);
        return;
      }
      setDefaultFormValue(field);
    });
  }

  function appendNodeToLayout(
    layout: FormLayoutSchema,
    node: FormDesignerNode,
    targetColumnId?: string,
  ) {
    if (layout.layoutType === 'Section') {
      layout.children.push(node);
      return true;
    }

    if (layout.layoutType === 'Grid') {
      const targetColumn = targetColumnId
        ? layout.columns.find((column) => column.id === targetColumnId)
        : layout.columns[0];
      (targetColumn ?? layout.columns[0])?.children.push(node);
      return true;
    }

    return false;
  }

  function addMaterial(
    materialKey: string,
    options?: {
      beforeNodeId?: string;
      targetColumnId?: string;
      targetLayoutId?: string;
    },
  ) {
    const material = getMaterialByKey(materialKey);
    if (!material) return;

    backup();

    if (isLayoutMaterial(material)) {
      const layoutNode = createLayoutNode(material);
      if (options?.targetLayoutId) {
        const target = findSelectableLocationById(options.targetLayoutId);
        if (target && isLayoutNode(target.item) && appendNodeToLayout(target.item, layoutNode, options.targetColumnId)) {
          selectedId.value = layoutNode.id;
          persist();
          return;
        }
      }

      insertRootNode(layoutNode, options?.beforeNodeId);
      selectedId.value = layoutNode.id;
      persist();
      return;
    }

    if (!isFieldMaterial(material)) return;

    const fieldNode = createFieldNode(material);
    const targetLayoutId = options?.targetLayoutId;
    if (!targetLayoutId) {
      insertRootNode(fieldNode, options?.beforeNodeId);
      selectedId.value = fieldNode.id;
      setDefaultFormValue(fieldNode);
      persist();
      return;
    }

    const targetLocation = findSelectableLocationById(targetLayoutId);
    const layout = targetLocation && isLayoutNode(targetLocation.item)
      ? targetLocation.item
      : undefined;

    if (!layout) {
      insertRootNode(fieldNode);
      selectedId.value = fieldNode.id;
      setDefaultFormValue(fieldNode);
      persist();
      return;
    }

    if (!appendNodeToLayout(layout, fieldNode, options?.targetColumnId)) {
      insertRootNode(fieldNode);
    }

    selectedId.value = fieldNode.id;
    setDefaultFormValue(fieldNode);
    persist();
  }

  function updateField(fieldId: string, patch: Partial<Omit<FormFieldSchema, 'id' | 'kind'>>) {
    const location = findSelectableLocationById(fieldId);
    if (!location || !isFieldNode(location.item)) return;

    backup();
    const current = location.item;
    const next: FormFieldSchema = {
      ...current,
      ...cloneDeep(patch),
      id: current.id,
      kind: 'field',
    };

    if (Object.hasOwn(patch, 'fieldName')) {
      const rawFieldName = String(patch.fieldName ?? '').trim();
      if (!rawFieldName) {
        next.fieldName = current.fieldName;
      } else if (rawFieldName !== current.fieldName) {
        const nextFieldName = getUniqueFieldName(rawFieldName, fieldId);
        if (Object.hasOwn(formValues.value, current.fieldName)) {
          formValues.value[nextFieldName] = formValues.value[current.fieldName];
          delete formValues.value[current.fieldName];
        }
        next.fieldName = nextFieldName;
      }
    }

    if (!supportsStaticOptionsFieldComponent(next.component)) {
      next.options = undefined;
    } else if (
      next.dataSource?.sourceType !== 'api' &&
      (!next.options || next.options.length === 0)
    ) {
      next.options = [
        { label: '选项1', value: `${next.fieldName}_1` },
        { label: '选项2', value: `${next.fieldName}_2` },
      ];
    }

    if (supportsDataSourceFieldComponent(next.component)) {
      next.dataSource = {
        ...createDefaultFieldDataSourceConfig(next.component),
        ...(next.dataSource ?? {}),
      };
      next.linkage = {
        ...createDefaultFieldLinkageConfig(),
        ...(next.linkage ?? {}),
      };
    } else {
      next.dataSource = undefined;
      next.linkage = undefined;
    }

    if (next.component === 'Switch' && next.defaultValue === undefined) {
      next.defaultValue = false;
    }

    if (next.component === 'Upload' && !Array.isArray(next.defaultValue)) {
      next.defaultValue = [];
    }

    location.list[location.index] = next;
    persist();
  }

  function updateLayout(layoutId: string, patch: LayoutUpdatePatch) {
    const location = findSelectableLocationById(layoutId);
    if (!location || !isLayoutNode(location.item)) return;

    backup();
    const current = location.item;

    if (current.layoutType === 'Divider') {
      location.list[location.index] = {
        ...current,
        dashed: patch.dashed ?? current.dashed,
        label: patch.label ?? current.label,
      };
      persist();
      return;
    }

    if (current.layoutType === 'Section') {
      location.list[location.index] = {
        ...current,
        backgroundColor: patch.backgroundColor ?? current.backgroundColor,
        description: patch.description ?? current.description,
        label: patch.label ?? current.label,
      };
      persist();
      return;
    }

    if (current.layoutType === 'Table') {
      const hasColumnsPatch = Object.hasOwn(patch, 'columns');
      const hasValidColumnsPatch = Array.isArray(patch.columns) && patch.columns.length > 0;
      const nextColumns: TableLayoutColumn[] =
        hasValidColumnsPatch && patch.columns
          ? normalizeTableColumns(patch.columns)
          : current.columns;
      const rawRows = hasColumnsPatch
        ? (hasValidColumnsPatch ? (patch.rows ?? current.rows) : current.rows)
        : (patch.rows ?? current.rows);
      const nextRows = normalizeTableRows(rawRows, nextColumns);
      location.list[location.index] = {
        ...current,
        backgroundColor: patch.backgroundColor ?? current.backgroundColor,
        bordered: patch.bordered ?? current.bordered,
        columns: nextColumns,
        label: patch.label ?? current.label,
        rows: nextRows,
        size: patch.size ?? current.size,
      };
      persist();
      return;
    }

    const grid = current as GridLayoutSchema;
    const nextCount = patch.columnCount;
    let columns = grid.columns;
    if (nextCount && (nextCount === 2 || nextCount === 3) && nextCount !== grid.columns.length) {
      columns = createGridColumns(nextCount, grid.columns);
    }

    location.list[location.index] = {
      ...grid,
      backgroundColor: patch.backgroundColor ?? grid.backgroundColor,
      columns,
      gap: patch.gap ?? grid.gap,
      label: patch.label ?? grid.label,
    };
    persist();
  }

  function removeById(id: string) {
    const location = findSelectableLocationById(id);
    if (!location) return;

    backup();
    const removing = location.item;
    if (isFieldNode(removing)) {
      delete formValues.value[removing.fieldName];
    } else if (isLayoutNode(removing)) {
      const names = collectFieldNames([removing]);
      names.forEach((name) => {
        delete formValues.value[name];
      });
    }

    location.list.splice(location.index, 1);
    if (selectedId.value === id) {
      selectedId.value = undefined;
    }
    persist();
  }

  function moveRootNode(fromNodeId: string, toNodeId?: string) {
    const root = schema.value.nodes;
    const fromIndex = root.findIndex((item) => item.id === fromNodeId);
    if (fromIndex < 0) return;

    backup();
    const [target] = root.splice(fromIndex, 1);
    if (!target) return;

    if (!toNodeId) {
      root.push(target);
      persist();
      return;
    }

    const toIndex = root.findIndex((item) => item.id === toNodeId);
    if (toIndex < 0) {
      root.push(target);
    } else {
      root.splice(toIndex, 0, target);
    }
    persist();
  }

  function moveByOffset(id: string, offset: number) {
    const location = findSelectableLocationById(id);
    if (!location) return;

    const toIndex = location.index + offset;
    if (toIndex < 0 || toIndex >= location.list.length) return;

    backup();
    const current = location.list[location.index]!;
    location.list.splice(location.index, 1);
    location.list.splice(toIndex, 0, current);
    persist();
  }

  function copySelected() {
    const selected = selectedEntity.value;
    if (!selected) return false;
    clipboardNode.value = cloneDeep(selected);
    return true;
  }

  function pasteClipboard() {
    if (!clipboardNode.value) return false;

    backup();
    const { clonedNode, sourceToTargetFieldNameMap } = buildClonedNode(clipboardNode.value);
    const location = getSelectedLocation();

    if (
      location &&
      isLayoutNode(location.item) &&
      (location.item.layoutType === 'Section' || location.item.layoutType === 'Grid')
    ) {
      appendNodeToLayout(location.item, clonedNode);
    } else if (location) {
      location.list.splice(location.index + 1, 0, clonedNode);
    } else {
      schema.value.nodes.push(clonedNode);
    }

    applyClonedNodeValues(clonedNode, sourceToTargetFieldNameMap);
    selectedId.value = clonedNode.id;
    persist();
    return true;
  }

  function cloneSelected() {
    const location = getSelectedLocation();
    if (!location) return false;

    backup();
    const { clonedNode, sourceToTargetFieldNameMap } = buildClonedNode(location.item);
    location.list.splice(location.index + 1, 0, clonedNode);
    applyClonedNodeValues(clonedNode, sourceToTargetFieldNameMap);
    selectedId.value = clonedNode.id;
    persist();
    return true;
  }

  function removeSelected() {
    if (!selectedId.value) return false;
    removeById(selectedId.value);
    return true;
  }

  function setTitle(title: string) {
    if (schema.value.title === title) return;
    backup();
    schema.value.title = title;
    persist();
  }

  function setDescription(description: string) {
    if (schema.value.description === description) return;
    backup();
    schema.value.description = description;
    persist();
  }

  function setFormLayout(formLayout: FormDesignerSchema['formLayout']) {
    if (schema.value.formLayout === formLayout) return;
    backup();
    schema.value.formLayout = formLayout;
    persist();
  }

  function updateFormGlobalConfig(patch: FormDesignerGlobalPatch) {
    if (!patch || Object.keys(patch).length === 0) return;

    const nextSchema = {
      ...schema.value,
      ...patch,
    };

    const changed = (
      [
        'formColon',
        'formDisabled',
        'formLabelAlign',
        'formLabelWrap',
        'formLabelWidth',
        'formLayout',
        'formRequiredMark',
        'formShowSerialNumber',
        'formSize',
        'formValidateTrigger',
        'formVariant',
      ] as const
    ).some((key) => schema.value[key] !== nextSchema[key]);

    if (!changed) return;

    backup();
    schema.value = nextSchema;
    persist();
  }

  function setDataSourcePresets(presets: FieldDataSourcePreset[]) {
    const nextPresets = normalizeDataSourcePresets(presets);
    const prevRaw = JSON.stringify(schema.value.dataSourcePresets ?? []);
    const nextRaw = JSON.stringify(nextPresets);
    if (prevRaw === nextRaw) return;

    backup();
    schema.value.dataSourcePresets = nextPresets;
    persist();
  }

  function selectById(id?: string) {
    selectedId.value = id;
  }

  function clearSelection() {
    selectedId.value = undefined;
  }

  function setFormValues(values: Record<string, any>) {
    formValues.value = sanitizeFormValues(cloneDeep(values));
    persist();
  }

  function reset() {
    backup();
    schema.value = createEmptyDesignerSchema();
    formValues.value = {};
    selectedId.value = undefined;
    persist();
  }

  function undo() {
    if (!canUndo.value) return;
    const snapshot = undoList.value.pop();
    if (!snapshot) return;
    redoList.value.push(captureSnapshot());
    applySnapshot(snapshot);
    persist();
  }

  function redo() {
    if (!canRedo.value) return;
    const snapshot = redoList.value.pop();
    if (!snapshot) return;
    undoList.value.push(captureSnapshot());
    applySnapshot(snapshot);
    persist();
  }

  return {
    addMaterial,
    allFields,
    canCopy,
    canPaste,
    canRedo,
    canUndo,
    clearSelection,
    cloneSelected,
    copySelected,
    formValues,
    getSavedRecordById,
    getSavedRecords,
    hasFields,
    loadSavedRecord,
    loadFromStorage,
    importFromJson,
    moveByOffset,
    moveRootNode,
    pasteClipboard,
    persist,
    redo,
    redoList,
    removeById,
    removeSelected,
    reset,
    removeSavedRecord,
    saveCurrentAsRecord,
    schema,
    selectById,
    selectedEntity,
    selectedField,
    selectedId,
    selectedLayout,
    setDescription,
    setDataSourcePresets,
    setFormLayout,
    updateFormGlobalConfig,
    setFormValues,
    setTitle,
    undo,
    undoList,
    updateField,
    updateLayout,
    vbenSchema,
  };
});

export default useWorkflowFormDesignerStore;
