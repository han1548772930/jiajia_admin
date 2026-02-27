<script setup lang="ts">
import type {
  FieldDataSourceConfig,
  FieldDataSourcePreset,
  FieldLinkageConfig,
  FieldOption,
  FieldValidationRule,
  FormDesignerGlobalPatch,
  FormLayoutMode,
  FormDesignerSelectable,
  FormFieldSchema,
  FormValidateTriggerMode,
  FormVariantMode,
  LayoutUpdatePatch,
  TableLayoutColumn,
  TableColumnComponent,
} from '#/views/workflow/form-designer/types';

import { computed, ref, watch } from 'vue';

import {
  Button,
  Divider,
  Form,
  FormItem,
  Input,
  InputNumber,
  Select,
  Switch,
  TextArea,
  message,
} from 'antdv-next';

import { $t } from '#/locales';
import {
  FIELD_DATA_SOURCE_OPTIONS,
} from '#/views/workflow/form-designer/data-source-registry';
import {
  getDataSourceAdapterOptions,
  getPropsPanelExtensions,
} from '#/views/workflow/form-designer/plugin-registry';
import {
  getAsyncValidatorOptions,
  getSyncValidatorOptions,
} from '#/views/workflow/form-designer/validation-registry';
import {
  loadFieldDataSourceOptions,
  resolveFieldDataSourceConfig,
} from '#/views/workflow/form-designer/field-data-source';
import {
  FORM_MATERIALS,
  createDefaultFieldDataSourceConfig,
  createDefaultFieldLinkageConfig,
  getFieldMaterialKeyByField,
  getFieldPatchByMaterialKey,
  isFieldMaterial,
  isFieldNode,
  isLayoutNode,
  supportsDataSourceFieldComponent,
  supportsPlaceholderFieldComponent,
  supportsStaticOptionsFieldComponent,
} from '#/views/workflow/form-designer/types';

interface Props {
  allFields?: FormFieldSchema[];
  dataSourcePresets?: FieldDataSourcePreset[];
  formColon?: boolean;
  formDisabled?: boolean;
  formLabelAlign?: 'left' | 'right';
  formLabelWrap?: boolean;
  formLabelWidth?: number;
  formLayout?: FormLayoutMode;
  formRequiredMark?: boolean;
  formShowSerialNumber?: boolean;
  formSize?: 'large' | 'middle' | 'small';
  formValidateTrigger?: FormValidateTriggerMode;
  formVariant?: FormVariantMode;
  selected?: FormDesignerSelectable;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  clone: [];
  remove: [id: string];
  'update-data-source-presets': [presets: FieldDataSourcePreset[]];
  'update-field': [{ fieldId: string; patch: Partial<Omit<FormFieldSchema, 'id' | 'kind'>> }];
  'update-form-config': [patch: FormDesignerGlobalPatch];
  'update-form-layout': [layout: FormLayoutMode];
  'update-layout': [{ layoutId: string; patch: LayoutUpdatePatch }];
}>();

const fieldComponentOptions = FORM_MATERIALS.filter((item) => isFieldMaterial(item)).map((item) => ({
  label: item.label,
  value: item.key,
}));

const selectedField = computed(() => {
  const selected = props.selected;
  return selected && isFieldNode(selected) ? selected : undefined;
});

const selectedLayout = computed(() => {
  const selected = props.selected;
  return selected && isLayoutNode(selected) ? selected : undefined;
});

const selectedTableLayout = computed(() => {
  const layout = selectedLayout.value;
  return layout && layout.layoutType === 'Table' ? layout : undefined;
});

const selectedTableColumns = computed(() => selectedTableLayout.value?.columns ?? []);
const selectedTableRows = computed(() => selectedTableLayout.value?.rows ?? []);
const selectedFieldValueOptions = computed(() => {
  return (selectedField.value?.options ?? []).map((item) => ({
    label: item.label,
    value: item.value,
  }));
});

const availableDependsOnOptions = computed(() => {
  const currentFieldName = selectedField.value?.fieldName;
  return (props.allFields ?? [])
    .filter((field) => field.fieldName !== currentFieldName)
    .map((field) => ({
      label: `${field.label} (${field.fieldName})`,
      value: field.fieldName,
    }));
});

const availableExpressionFieldOptions = computed(() => {
  const currentFieldName = selectedField.value?.fieldName;
  return (props.allFields ?? [])
    .filter((field) => field.fieldName !== currentFieldName)
    .map((field) => ({
      label: `${field.label} (${field.fieldName})`,
      value: field.fieldName,
    }));
});

const componentPropsJson = ref('');
const tableColumnsJson = ref('');
const tableRowsJson = ref('');
const baseParamsJson = ref('');
const extensionsJson = ref('');
const headersJson = ref('');
const linkageParamMapJson = ref('');
const dataSourcePresetsJson = ref('');
const requiredExpressionInput = ref('');
const tableColumnValidationJsonMap = ref<Record<string, string>>({});
const validationRulesJson = ref('');
const visibleExpressionInput = ref('');
const testingDataSource = ref(false);

type ValidationRuleEditorItem = {
  message: string;
  trigger?: FieldValidationRule['trigger'];
  type: FieldValidationRule['type'];
  value: number | string;
};

type LinkageParamMapEditorRow = {
  expression: string;
  key: string;
};

type ExpressionVisualMode = 'all' | 'any';
type ExpressionVisualOperator = 'contains' | 'eq' | 'gt' | 'gte' | 'isFalse' | 'isTrue' | 'lt' | 'lte' | 'neq';
type ExpressionVisualRow = {
  fieldName: string;
  operator: ExpressionVisualOperator;
  value: string;
};

const validationRuleEditorRows = ref<ValidationRuleEditorItem[]>([]);
const linkageParamMapRows = ref<LinkageParamMapEditorRow[]>([]);
const requiredExpressionVisualMode = ref<ExpressionVisualMode>('all');
const visibleExpressionVisualMode = ref<ExpressionVisualMode>('all');
const requiredExpressionVisualRows = ref<ExpressionVisualRow[]>([]);
const visibleExpressionVisualRows = ref<ExpressionVisualRow[]>([]);
const requiredExpressionVisualAvailable = ref(true);
const visibleExpressionVisualAvailable = ref(true);

const formLayoutOptions = computed(() => [
  { label: $t('workflow.formDesigner.propsPanel.layoutVertical'), value: 'vertical' },
  { label: $t('workflow.formDesigner.propsPanel.layoutHorizontal'), value: 'horizontal' },
  { label: $t('workflow.formDesigner.propsPanel.layoutInline'), value: 'inline' },
]);

const formSizeOptions = computed(() => [
  { label: $t('workflow.formDesigner.propsPanel.sizeSmall'), value: 'small' },
  { label: $t('workflow.formDesigner.propsPanel.sizeMiddle'), value: 'middle' },
  { label: $t('workflow.formDesigner.propsPanel.sizeLarge'), value: 'large' },
]);

const formVariantOptions = computed(() => [
  { label: $t('workflow.formDesigner.propsPanel.formVariantOutlined'), value: 'outlined' },
  { label: $t('workflow.formDesigner.propsPanel.formVariantFilled'), value: 'filled' },
  { label: $t('workflow.formDesigner.propsPanel.formVariantBorderless'), value: 'borderless' },
  { label: $t('workflow.formDesigner.propsPanel.formVariantUnderlined'), value: 'underlined' },
]);

const formValidateTriggerOptions = computed(() => [
  { label: $t('workflow.formDesigner.propsPanel.validateTriggerChange'), value: 'change' },
  { label: $t('workflow.formDesigner.propsPanel.validateTriggerBlur'), value: 'blur' },
  { label: $t('workflow.formDesigner.propsPanel.validateTriggerChangeBlur'), value: 'change,blur' },
  { label: $t('workflow.formDesigner.propsPanel.validateTriggerSubmit'), value: 'submit' },
  { label: $t('workflow.formDesigner.propsPanel.validateTriggerNone'), value: 'none' },
]);

const fieldValidateTriggerOptions = computed(() => [...formValidateTriggerOptions.value]);
const validationRuleTriggerOptions = computed(() => [...fieldValidateTriggerOptions.value]);

const formLabelAlignOptions = computed(() => [
  { label: $t('workflow.formDesigner.propsPanel.alignLeft'), value: 'left' },
  { label: $t('workflow.formDesigner.propsPanel.alignRight'), value: 'right' },
]);

const dataSourceModeOptions = computed(() => [
  { label: $t('workflow.formDesigner.propsPanel.apiModeRegistry'), value: 'registry' },
  { label: $t('workflow.formDesigner.propsPanel.apiModeCustom'), value: 'custom' },
]);

const selectOptionTypeOptions = computed(() => [
  { label: $t('workflow.formDesigner.propsPanel.optionTypeDefault'), value: 'default' },
  { label: $t('workflow.formDesigner.propsPanel.optionTypeButton'), value: 'button' },
]);

const uploadListTypeOptions = computed(() => [
  { label: $t('workflow.formDesigner.propsPanel.uploadListTypeText'), value: 'text' },
  { label: $t('workflow.formDesigner.propsPanel.uploadListTypePicture'), value: 'picture' },
  { label: $t('workflow.formDesigner.propsPanel.uploadListTypePictureCard'), value: 'picture-card' },
]);

const colorValueFormatOptions = computed(() => [
  { label: $t('workflow.formDesigner.propsPanel.colorFormatHex'), value: 'hex' },
  { label: $t('workflow.formDesigner.propsPanel.colorFormatRgb'), value: 'rgb' },
  { label: $t('workflow.formDesigner.propsPanel.colorFormatHsb'), value: 'hsb' },
]);

const selectModeOptions = computed(() => [
  { label: $t('workflow.formDesigner.propsPanel.selectModeDefault'), value: '' },
  { label: $t('workflow.formDesigner.propsPanel.selectModeMultiple'), value: 'multiple' },
  { label: $t('workflow.formDesigner.propsPanel.selectModeTags'), value: 'tags' },
]);

const orientationOptions = computed(() => [
  { label: $t('workflow.formDesigner.propsPanel.orientationHorizontal'), value: 'horizontal' },
  { label: $t('workflow.formDesigner.propsPanel.orientationVertical'), value: 'vertical' },
]);

const segmentedShapeOptions = computed(() => [
  { label: $t('workflow.formDesigner.propsPanel.shapeDefault'), value: 'default' },
  { label: $t('workflow.formDesigner.propsPanel.shapeRound'), value: 'round' },
]);

const cascaderExpandTriggerOptions = computed(() => [
  { label: $t('workflow.formDesigner.propsPanel.expandTriggerClick'), value: 'click' },
  { label: $t('workflow.formDesigner.propsPanel.expandTriggerHover'), value: 'hover' },
]);

const popupPlacementOptions = computed(() => [
  { label: $t('workflow.formDesigner.propsPanel.placementBottomLeft'), value: 'bottomLeft' },
  { label: $t('workflow.formDesigner.propsPanel.placementBottomRight'), value: 'bottomRight' },
  { label: $t('workflow.formDesigner.propsPanel.placementTopLeft'), value: 'topLeft' },
  { label: $t('workflow.formDesigner.propsPanel.placementTopRight'), value: 'topRight' },
]);

const uploadMethodOptions = computed(() => [
  { label: $t('workflow.formDesigner.propsPanel.httpMethodPost'), value: 'POST' },
  { label: $t('workflow.formDesigner.propsPanel.httpMethodPut'), value: 'PUT' },
]);
const requestMethodOptions = computed(() => [
  { label: $t('workflow.formDesigner.propsPanel.httpMethodGet'), value: 'GET' },
  { label: $t('workflow.formDesigner.propsPanel.httpMethodPost'), value: 'POST' },
]);
const tableSizeOptions = computed(() => [
  { label: $t('workflow.formDesigner.propsPanel.sizeSmall'), value: 'small' },
  { label: $t('workflow.formDesigner.propsPanel.sizeMiddle'), value: 'middle' },
  { label: $t('workflow.formDesigner.propsPanel.sizeLarge'), value: 'large' },
]);
const tableColumnComponentOptions = computed(() => [
  { label: $t('workflow.formDesigner.propsPanel.tableColumnComponentInput'), value: 'Input' },
  { label: $t('workflow.formDesigner.propsPanel.tableColumnComponentInputNumber'), value: 'InputNumber' },
  { label: $t('workflow.formDesigner.propsPanel.tableColumnComponentSelect'), value: 'Select' },
  { label: $t('workflow.formDesigner.propsPanel.tableColumnComponentSwitch'), value: 'Switch' },
]);

const i18nBraceParams = {
  lb: '{',
  rb: '}',
} as const;

function tBrace(key: string) {
  return $t(key, i18nBraceParams as any);
}

const syncValidatorOptions = getSyncValidatorOptions();
const asyncValidatorOptions = getAsyncValidatorOptions();
const syncValidatorKeysText = syncValidatorOptions
  .map((item) => item.value)
  .join(', ');
const asyncValidatorKeysText = asyncValidatorOptions
  .map((item) => item.value)
  .join(', ');
const validationRuleTypeOptions = computed(() => [
  { label: $t('workflow.formDesigner.propsPanel.validationRuleTypeMinLength'), value: 'minLength' },
  { label: $t('workflow.formDesigner.propsPanel.validationRuleTypeMaxLength'), value: 'maxLength' },
  { label: $t('workflow.formDesigner.propsPanel.validationRuleTypePattern'), value: 'pattern' },
  { label: $t('workflow.formDesigner.propsPanel.validationRuleTypeCustom'), value: 'custom' },
  { label: $t('workflow.formDesigner.propsPanel.validationRuleTypeAsync'), value: 'async' },
]);
const syncValidatorSelectOptions = computed(() => [...syncValidatorOptions]);
const asyncValidatorSelectOptions = computed(() => [...asyncValidatorOptions]);
const validationRulesPlaceholder = computed(() => [
  tBrace('workflow.formDesigner.propsPanel.validationRulesExample'),
  `${$t('workflow.formDesigner.propsPanel.validationRulesSyncKeys')}${syncValidatorKeysText}`,
  `${$t('workflow.formDesigner.propsPanel.validationRulesAsyncKeys')}${asyncValidatorKeysText}`,
].join('\n'));
const expressionVisualModeOptions = computed(() => [
  { label: $t('workflow.formDesigner.propsPanel.expressionVisualModeAll'), value: 'all' },
  { label: $t('workflow.formDesigner.propsPanel.expressionVisualModeAny'), value: 'any' },
]);
const expressionVisualOperatorOptions = computed(() => [
  { label: $t('workflow.formDesigner.propsPanel.expressionOperatorEq'), value: 'eq' },
  { label: $t('workflow.formDesigner.propsPanel.expressionOperatorNeq'), value: 'neq' },
  { label: $t('workflow.formDesigner.propsPanel.expressionOperatorGt'), value: 'gt' },
  { label: $t('workflow.formDesigner.propsPanel.expressionOperatorGte'), value: 'gte' },
  { label: $t('workflow.formDesigner.propsPanel.expressionOperatorLt'), value: 'lt' },
  { label: $t('workflow.formDesigner.propsPanel.expressionOperatorLte'), value: 'lte' },
  { label: $t('workflow.formDesigner.propsPanel.expressionOperatorContains'), value: 'contains' },
  { label: $t('workflow.formDesigner.propsPanel.expressionOperatorIsTrue'), value: 'isTrue' },
  { label: $t('workflow.formDesigner.propsPanel.expressionOperatorIsFalse'), value: 'isFalse' },
]);

const dataSourcePresetOptions = computed(() => {
  return (props.dataSourcePresets ?? []).map((item) => ({
    label: `${item.label} (${item.key})`,
    value: item.key,
  }));
});
const dataSourceAdapterOptions = computed(() => {
  return getDataSourceAdapterOptions().map((item) => ({
    label: `${item.label} (${item.key})`,
    value: item.key,
  }));
});
const availableFieldExtensions = computed(() => {
  const component = selectedField.value?.component;
  return getPropsPanelExtensions(component);
});

function isLengthValidationRuleType(type: FieldValidationRule['type']) {
  return type === 'minLength' || type === 'maxLength';
}

function getDefaultValidationRuleValue(type: FieldValidationRule['type']) {
  if (isLengthValidationRuleType(type)) return 1;
  if (type === 'custom') return syncValidatorOptions[0]?.value || '';
  if (type === 'async') return asyncValidatorOptions[0]?.value || '';
  return '';
}

function toValidationRuleEditorItem(rule?: FieldValidationRule): ValidationRuleEditorItem {
  const type = (rule?.type || 'minLength') as FieldValidationRule['type'];

  if (isLengthValidationRuleType(type)) {
    const value = Number(rule?.value);
    return {
      message: String(rule?.message ?? ''),
      trigger: normalizeRuleTrigger(rule?.trigger),
      type,
      value: Number.isFinite(value) ? value : Number(getDefaultValidationRuleValue(type)),
    };
  }

  return {
    message: String(rule?.message ?? ''),
    trigger: normalizeRuleTrigger(rule?.trigger),
    type,
    value: String(rule?.value ?? getDefaultValidationRuleValue(type)),
  };
}

function toFieldValidationRulesFromEditor(rows: ValidationRuleEditorItem[]) {
  return rows.map((row) => {
    const type = row.type;
    const trigger = normalizeRuleTrigger(row.trigger);
    const messageText = String(row.message ?? '').trim();

    const next: FieldValidationRule = {
      type,
      value: row.value as any,
    };

    if (trigger) {
      next.trigger = trigger;
    }
    if (messageText) {
      next.message = messageText;
    }

    if (isLengthValidationRuleType(type)) {
      const value = Number(row.value);
      next.value = Number.isFinite(value) ? value : 0;
      return next;
    }

    next.value = String(row.value ?? '');
    return next;
  });
}

function applyValidationRulesVisualRows(rows: ValidationRuleEditorItem[]) {
  validationRuleEditorRows.value = rows;
  const rules = toFieldValidationRulesFromEditor(rows);
  updateField({ validationRules: rules });
  validationRulesJson.value = JSON.stringify(rules, null, 2);
}

function updateValidationRuleRow(index: number, patch: Partial<ValidationRuleEditorItem>) {
  const rows = [...validationRuleEditorRows.value];
  const current = rows[index];
  if (!current) return;
  rows[index] = {
    ...current,
    ...patch,
  };
  applyValidationRulesVisualRows(rows);
}

function handleValidationRuleTypeChange(index: number, value: any) {
  const type = String(value || 'minLength') as FieldValidationRule['type'];
  const nextValue = getDefaultValidationRuleValue(type);
  updateValidationRuleRow(index, {
    type,
    value: nextValue as any,
  });
}

function addValidationRuleRow() {
  const nextType: FieldValidationRule['type'] = 'minLength';
  applyValidationRulesVisualRows([
    ...validationRuleEditorRows.value,
    {
      message: '',
      trigger: undefined,
      type: nextType,
      value: getDefaultValidationRuleValue(nextType) as any,
    },
  ]);
}

function removeValidationRuleRow(index: number) {
  const rows = [...validationRuleEditorRows.value];
  rows.splice(index, 1);
  applyValidationRulesVisualRows(rows);
}

function createDefaultExpressionVisualRow(): ExpressionVisualRow {
  return {
    fieldName: String(availableExpressionFieldOptions.value[0]?.value ?? ''),
    operator: 'eq',
    value: '',
  };
}

function expressionOperatorNeedsValue(operator: ExpressionVisualOperator) {
  return !['isTrue', 'isFalse'].includes(operator);
}

function stripExpressionOuterParentheses(text: string) {
  let value = String(text ?? '').trim();
  while (
    value.startsWith('(')
    && value.endsWith(')')
    && value.length > 1
  ) {
    value = value.slice(1, -1).trim();
  }
  return value;
}

function splitExpressionParts(expression: string) {
  const raw = String(expression ?? '').trim();
  if (!raw) {
    return {
      mode: 'all' as ExpressionVisualMode,
      parts: [] as string[],
    };
  }

  const hasAnd = raw.includes(' && ');
  const hasOr = raw.includes(' || ');
  if (hasAnd && hasOr) return undefined;

  const mode: ExpressionVisualMode = hasOr ? 'any' : 'all';
  const separator = hasOr ? ' || ' : ' && ';
  const source = separator.trim() ? raw.split(separator) : [raw];
  return {
    mode,
    parts: source
      .map((item) => stripExpressionOuterParentheses(item))
      .filter((item) => Boolean(item)),
  };
}

function parseExpressionLiteralToken(raw: string) {
  const text = String(raw ?? '').trim();
  if (!text) return '';

  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    try {
      if (text.startsWith('"')) {
        return JSON.parse(text);
      }
      return text.slice(1, -1);
    } catch {
      return text;
    }
  }

  return text;
}

function parseExpressionVisualRow(rawPart: string): ExpressionVisualRow | undefined {
  const part = stripExpressionOuterParentheses(rawPart);

  const containsMatch = part.match(
    /^String\(\$field_([A-Za-z0-9_]+)\s*\?\?\s*''\)\.includes\((.+)\)$/,
  );
  if (containsMatch) {
    return {
      fieldName: containsMatch[1] ?? '',
      operator: 'contains',
      value: parseExpressionLiteralToken(containsMatch[2] ?? ''),
    };
  }

  const boolMatch = part.match(/^\$field_([A-Za-z0-9_]+)\s*===\s*(true|false)$/);
  if (boolMatch) {
    return {
      fieldName: boolMatch[1] ?? '',
      operator: boolMatch[2] === 'true' ? 'isTrue' : 'isFalse',
      value: '',
    };
  }

  const compareMatch = part.match(/^\$field_([A-Za-z0-9_]+)\s*(===|!==|>=|<=|>|<)\s*(.+)$/);
  if (!compareMatch) return undefined;

  const operatorMap: Record<string, ExpressionVisualOperator> = {
    '!==': 'neq',
    '<': 'lt',
    '<=': 'lte',
    '===': 'eq',
    '>': 'gt',
    '>=': 'gte',
  };
  const operator = operatorMap[compareMatch[2] ?? ''];
  if (!operator) return undefined;

  return {
    fieldName: compareMatch[1] ?? '',
    operator,
    value: parseExpressionLiteralToken(compareMatch[3] ?? ''),
  };
}

function parseExpressionVisualState(expression: string | undefined) {
  const split = splitExpressionParts(String(expression ?? '').trim());
  if (!split) return undefined;

  const rows = split.parts.map((part) => parseExpressionVisualRow(part));
  if (rows.some((row) => !row)) return undefined;

  return {
    mode: split.mode,
    rows: rows.filter((row): row is ExpressionVisualRow => Boolean(row)),
  };
}

function normalizeExpressionValueToken(raw: string, operator: ExpressionVisualOperator) {
  const text = String(raw ?? '').trim();
  if (!expressionOperatorNeedsValue(operator)) return '';
  if (operator === 'contains') return JSON.stringify(text);
  if (!text) return JSON.stringify('');
  if (text.startsWith('$field_')) return text;
  if (/^-?\d+(?:\.\d+)?$/.test(text)) return text;
  if (['true', 'false', 'null', 'undefined'].includes(text)) return text;
  if (
    (text.startsWith('"') && text.endsWith('"'))
    || (text.startsWith("'") && text.endsWith("'"))
  ) {
    return text;
  }
  return JSON.stringify(text);
}

function buildExpressionVisualCondition(row: ExpressionVisualRow) {
  const fieldName = String(row.fieldName ?? '').trim();
  if (!fieldName) return '';

  if (row.operator === 'isTrue') return `$field_${fieldName} === true`;
  if (row.operator === 'isFalse') return `$field_${fieldName} === false`;

  if (row.operator === 'contains') {
    const value = normalizeExpressionValueToken(row.value, row.operator);
    return `String($field_${fieldName} ?? '').includes(${value})`;
  }

  const value = normalizeExpressionValueToken(row.value, row.operator);
  const compareMap: Record<Exclude<ExpressionVisualOperator, 'contains' | 'isFalse' | 'isTrue'>, string> = {
    eq: '===',
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<=',
    neq: '!==',
  };
  const compareOp = compareMap[row.operator];
  return `$field_${fieldName} ${compareOp} ${value}`;
}

function buildExpressionFromVisualRows(mode: ExpressionVisualMode, rows: ExpressionVisualRow[]) {
  const source = rows
    .map((row) => buildExpressionVisualCondition(row))
    .filter((item) => Boolean(item));
  if (source.length === 0) return '';
  return source.join(mode === 'all' ? ' && ' : ' || ');
}

function toLinkageParamMapRows(source: Record<string, any> | undefined) {
  return Object.entries(source ?? {}).map(([key, expression]) => ({
    expression: String(expression ?? ''),
    key: String(key ?? ''),
  }));
}

function toLinkageParamMapObject(rows: LinkageParamMapEditorRow[]) {
  const result: Record<string, string> = {};

  rows.forEach((row) => {
    const key = String(row.key ?? '').trim();
    const expression = String(row.expression ?? '').trim();
    if (!key || !expression) return;
    result[key] = expression;
  });

  return result;
}

function applyLinkageParamMapRows(rows: LinkageParamMapEditorRow[]) {
  linkageParamMapRows.value = rows;
  const paramMap = toLinkageParamMapObject(rows);
  updateFieldLinkage({ paramMap });
  linkageParamMapJson.value = JSON.stringify(paramMap, null, 2);
}

function addLinkageParamMapRow() {
  applyLinkageParamMapRows([
    ...linkageParamMapRows.value,
    {
      expression: '',
      key: '',
    },
  ]);
}

function removeLinkageParamMapRow(index: number) {
  const rows = [...linkageParamMapRows.value];
  rows.splice(index, 1);
  applyLinkageParamMapRows(rows);
}

function updateLinkageParamMapRow(index: number, patch: Partial<LinkageParamMapEditorRow>) {
  const rows = [...linkageParamMapRows.value];
  const current = rows[index];
  if (!current) return;

  rows[index] = {
    ...current,
    ...patch,
  };
  applyLinkageParamMapRows(rows);
}

const selectedFieldDataSource = computed(() => {
  const field = selectedField.value;
  if (!field || !supportsDataSourceFieldComponent(field.component)) {
    return undefined;
  }

  return {
    ...createDefaultFieldDataSourceConfig(field.component),
    ...(field.dataSource ?? {}),
  } as FieldDataSourceConfig;
});

const selectedFieldLinkage = computed(() => {
  const field = selectedField.value;
  if (!field || !supportsDataSourceFieldComponent(field.component)) {
    return undefined;
  }

  return {
    ...createDefaultFieldLinkageConfig(),
    ...(field.linkage ?? {}),
  } as FieldLinkageConfig;
});

const selectedFieldDependsOnText = computed(() => {
  const dependsOn = selectedFieldLinkage.value?.dependsOn ?? [];
  if (dependsOn.length === 0) {
    return $t('workflow.formDesigner.propsPanel.linkageGraphNone');
  }
  return dependsOn.join(', ');
});

const selectedFieldDownstreamText = computed(() => {
  const fieldName = String(selectedField.value?.fieldName ?? '').trim();
  if (!fieldName) {
    return $t('workflow.formDesigner.propsPanel.linkageGraphNone');
  }

  const affectedFields = (props.allFields ?? [])
    .filter((field) => field.fieldName !== fieldName)
    .filter((field) => (field.linkage?.dependsOn ?? []).includes(fieldName))
    .map((field) => field.fieldName);

  if (affectedFields.length === 0) {
    return $t('workflow.formDesigner.propsPanel.linkageGraphNone');
  }
  return affectedFields.join(', ');
});

const hasSelectedFieldLinkageCycle = computed(() => {
  const field = selectedField.value;
  if (!field || !supportsDataSource(field)) return false;

  const dependsOn = selectedFieldLinkage.value?.dependsOn ?? [];
  return hasLinkageCycle(field.fieldName, dependsOn);
});

watch(
  selectedField,
  (field) => {
    componentPropsJson.value = JSON.stringify(field?.componentProps ?? {}, null, 2);
    extensionsJson.value = JSON.stringify(
      (field?.componentProps as Record<string, any> | undefined)?.__extensions ?? {},
      null,
      2,
    );
    requiredExpressionInput.value = String(field?.requiredExpression ?? '');
    syncRequiredExpressionVisualState(requiredExpressionInput.value);
    validationRulesJson.value = JSON.stringify(field?.validationRules ?? [], null, 2);
    validationRuleEditorRows.value = (field?.validationRules ?? []).map((rule) => toValidationRuleEditorItem(rule));
    visibleExpressionInput.value = String(field?.visibleExpression ?? '');
    syncVisibleExpressionVisualState(visibleExpressionInput.value);

    if (!field || !supportsDataSourceFieldComponent(field.component)) {
      baseParamsJson.value = '{}';
      headersJson.value = '{}';
      linkageParamMapJson.value = '{}';
      linkageParamMapRows.value = [];
      return;
    }

    const dataSource = {
      ...createDefaultFieldDataSourceConfig(field.component),
      ...(field.dataSource ?? {}),
    };
    const linkage = {
      ...createDefaultFieldLinkageConfig(),
      ...(field.linkage ?? {}),
    };

    baseParamsJson.value = JSON.stringify(dataSource.baseParams ?? {}, null, 2);
    headersJson.value = JSON.stringify(dataSource.headers ?? {}, null, 2);
    linkageParamMapJson.value = JSON.stringify(linkage.paramMap ?? {}, null, 2);
    linkageParamMapRows.value = toLinkageParamMapRows(linkage.paramMap);
  },
  { immediate: true },
);

watch(
  () => props.dataSourcePresets,
  (value) => {
    dataSourcePresetsJson.value = JSON.stringify(value ?? [], null, 2);
  },
  { deep: true, immediate: true },
);

watch(
  selectedLayout,
  (layout) => {
    if (!layout || layout.layoutType !== 'Table') {
      tableColumnsJson.value = '';
      tableRowsJson.value = '';
      tableColumnValidationJsonMap.value = {};
      return;
    }

    tableColumnsJson.value = JSON.stringify(layout.columns, null, 2);
    tableRowsJson.value = JSON.stringify(layout.rows, null, 2);
    syncTableColumnValidationJsonMap(layout.columns);
  },
  { immediate: true },
);

function updateField(patch: Partial<Omit<FormFieldSchema, 'id' | 'kind'>>) {
  if (!selectedField.value) return;

  emit('update-field', {
    fieldId: selectedField.value.id,
    patch,
  });
}

function updateLayout(patch: LayoutUpdatePatch) {
  if (!selectedLayout.value) return;

  emit('update-layout', {
    layoutId: selectedLayout.value.id,
    patch,
  });
}

function updateFormConfig(patch: FormDesignerGlobalPatch) {
  emit('update-form-config', patch);
}

function handleGlobalFormLayoutChange(value: any) {
  const layout = String(value || 'vertical') as FormLayoutMode;
  emit('update-form-layout', layout);
  updateFormConfig({ formLayout: layout });
}

function resolveFieldMaterialKey(field: FormFieldSchema) {
  return getFieldMaterialKeyByField(field);
}

function handleFieldMaterialChange(materialKey: string) {
  const field = selectedField.value;
  if (!field) return;

  const patch = getFieldPatchByMaterialKey(materialKey, field.fieldName);
  updateField({
    component: patch.component,
    componentProps: patch.componentProps,
    dataSource: patch.dataSource,
    defaultValue: patch.defaultValue,
    linkage: patch.linkage,
    options: patch.options,
    placeholder: patch.placeholder,
  });
}

function supportsOptions(field: FormFieldSchema) {
  return supportsStaticOptionsFieldComponent(field.component);
}

function shouldShowStaticOptions(field: FormFieldSchema) {
  if (!supportsOptions(field)) return false;
  if (!supportsDataSourceFieldComponent(field.component)) return true;
  return selectedFieldDataSource.value?.sourceType !== 'api';
}

function supportsDataSource(field: FormFieldSchema) {
  return supportsDataSourceFieldComponent(field.component);
}

function supportsPlaceholder(field: FormFieldSchema) {
  return supportsPlaceholderFieldComponent(field.component);
}

const selectedFieldComponentProps = computed<Record<string, any>>(() => {
  return (selectedField.value?.componentProps ?? {}) as Record<string, any>;
});

function isSelectedFieldComponent(components: FormFieldSchema['component'][]) {
  const component = selectedField.value?.component;
  return Boolean(component && components.includes(component));
}

function toOptionalNumber(value: any) {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function updateFieldComponentProps(patch: Record<string, any>) {
  const field = selectedField.value;
  if (!field) return;

  const next = {
    ...selectedFieldComponentProps.value,
    ...patch,
  };
  Object.keys(next).forEach((key) => {
    if (next[key] === undefined) {
      delete next[key];
    }
  });
  updateField({ componentProps: next });
}

function updateFieldComponentProp(key: string, value: any) {
  updateFieldComponentProps({ [key]: value });
}

function addOption() {
  const field = selectedField.value;
  if (!field) return;

  const options = [...(field.options ?? [])];
  options.push({
    label: `${$t('workflow.formDesigner.propsPanel.optionPrefix')}${options.length + 1}`,
    value: `option_${Date.now()}`,
  });

  updateField({ options });
}

function removeOption(index: number) {
  const field = selectedField.value;
  if (!field) return;

  const options = [...(field.options ?? [])];
  options.splice(index, 1);
  updateField({ options });
}

function updateOption(index: number, patch: Partial<FieldOption>) {
  const field = selectedField.value;
  if (!field) return;

  const options = [...(field.options ?? [])];
  const current = options[index];
  if (!current) return;

  options[index] = {
    ...current,
    ...patch,
  };
  updateField({ options });
}

function applyComponentPropsJson() {
  const field = selectedField.value;
  if (!field) return;

  try {
    const parsed = componentPropsJson.value.trim()
      ? JSON.parse(componentPropsJson.value)
      : {};
    updateField({ componentProps: parsed });
  } catch {
    message.error($t('workflow.formDesigner.messages.componentPropsJsonInvalid'));
  }
}

function syncRequiredExpressionVisualState(expression: string | undefined) {
  const text = String(expression ?? '').trim();
  if (!text) {
    requiredExpressionVisualMode.value = 'all';
    requiredExpressionVisualRows.value = [];
    requiredExpressionVisualAvailable.value = true;
    return;
  }

  const parsed = parseExpressionVisualState(text);
  if (!parsed) {
    requiredExpressionVisualAvailable.value = false;
    return;
  }

  requiredExpressionVisualMode.value = parsed.mode;
  requiredExpressionVisualRows.value = parsed.rows;
  requiredExpressionVisualAvailable.value = true;
}

function syncVisibleExpressionVisualState(expression: string | undefined) {
  const text = String(expression ?? '').trim();
  if (!text) {
    visibleExpressionVisualMode.value = 'all';
    visibleExpressionVisualRows.value = [];
    visibleExpressionVisualAvailable.value = true;
    return;
  }

  const parsed = parseExpressionVisualState(text);
  if (!parsed) {
    visibleExpressionVisualAvailable.value = false;
    return;
  }

  visibleExpressionVisualMode.value = parsed.mode;
  visibleExpressionVisualRows.value = parsed.rows;
  visibleExpressionVisualAvailable.value = true;
}

function applyRequiredExpressionVisualRows(rows: ExpressionVisualRow[], mode = requiredExpressionVisualMode.value) {
  requiredExpressionVisualRows.value = rows;
  requiredExpressionVisualMode.value = mode;
  requiredExpressionVisualAvailable.value = true;

  const expression = buildExpressionFromVisualRows(mode, rows);
  requiredExpressionInput.value = expression;
  updateField({
    requiredExpression: expression,
  });
}

function applyVisibleExpressionVisualRows(rows: ExpressionVisualRow[], mode = visibleExpressionVisualMode.value) {
  visibleExpressionVisualRows.value = rows;
  visibleExpressionVisualMode.value = mode;
  visibleExpressionVisualAvailable.value = true;

  const expression = buildExpressionFromVisualRows(mode, rows);
  visibleExpressionInput.value = expression;
  updateField({
    visibleExpression: expression,
  });
}

function addRequiredExpressionVisualRow() {
  applyRequiredExpressionVisualRows([
    ...requiredExpressionVisualRows.value,
    createDefaultExpressionVisualRow(),
  ]);
}

function removeRequiredExpressionVisualRow(index: number) {
  const rows = [...requiredExpressionVisualRows.value];
  rows.splice(index, 1);
  applyRequiredExpressionVisualRows(rows);
}

function updateRequiredExpressionVisualRow(index: number, patch: Partial<ExpressionVisualRow>) {
  const rows = [...requiredExpressionVisualRows.value];
  const current = rows[index];
  if (!current) return;

  const next = {
    ...current,
    ...patch,
  };
  if (!expressionOperatorNeedsValue(next.operator)) {
    next.value = '';
  }
  rows[index] = next;
  applyRequiredExpressionVisualRows(rows);
}

function handleRequiredExpressionVisualModeChange(value: any) {
  const mode = String(value || 'all') === 'any' ? 'any' : 'all';
  applyRequiredExpressionVisualRows(requiredExpressionVisualRows.value, mode);
}

function addVisibleExpressionVisualRow() {
  applyVisibleExpressionVisualRows([
    ...visibleExpressionVisualRows.value,
    createDefaultExpressionVisualRow(),
  ]);
}

function removeVisibleExpressionVisualRow(index: number) {
  const rows = [...visibleExpressionVisualRows.value];
  rows.splice(index, 1);
  applyVisibleExpressionVisualRows(rows);
}

function updateVisibleExpressionVisualRow(index: number, patch: Partial<ExpressionVisualRow>) {
  const rows = [...visibleExpressionVisualRows.value];
  const current = rows[index];
  if (!current) return;

  const next = {
    ...current,
    ...patch,
  };
  if (!expressionOperatorNeedsValue(next.operator)) {
    next.value = '';
  }
  rows[index] = next;
  applyVisibleExpressionVisualRows(rows);
}

function handleVisibleExpressionVisualModeChange(value: any) {
  const mode = String(value || 'all') === 'any' ? 'any' : 'all';
  applyVisibleExpressionVisualRows(visibleExpressionVisualRows.value, mode);
}

function applyRequiredExpression() {
  const expression = String(requiredExpressionInput.value ?? '').trim();
  requiredExpressionInput.value = expression;
  updateField({
    requiredExpression: expression,
  });
  syncRequiredExpressionVisualState(expression);
}

function applyVisibleExpression() {
  const expression = String(visibleExpressionInput.value ?? '').trim();
  visibleExpressionInput.value = expression;
  updateField({
    visibleExpression: expression,
  });
  syncVisibleExpressionVisualState(expression);
}

function applyExtensionsJson() {
  const field = selectedField.value;
  if (!field) return;

  try {
    const parsed = extensionsJson.value.trim()
      ? JSON.parse(extensionsJson.value)
      : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('invalid');
    }

    const nextProps = {
      ...selectedFieldComponentProps.value,
      __extensions: parsed,
    };
    if (Object.keys(parsed).length === 0) {
      delete nextProps.__extensions;
    }
    updateField({ componentProps: nextProps });
  } catch {
    message.error($t('workflow.formDesigner.messages.extensionsJsonInvalid'));
  }
}

function normalizeRuleTrigger(raw: any): FieldValidationRule['trigger'] {
  const trigger = String(raw || '').trim();
  if (!trigger) return undefined;
  if (!['change', 'blur', 'change,blur', 'submit', 'none'].includes(trigger)) {
    return undefined;
  }
  return trigger as FieldValidationRule['trigger'];
}

function normalizeFieldValidationRules(raw: any): FieldValidationRule[] {
  if (!Array.isArray(raw)) {
    throw new Error('validationRules must be array');
  }

  const rules: FieldValidationRule[] = [];
  raw.forEach((item) => {
    if (!item || typeof item !== 'object') return;
    const type = String(item.type || '').trim() as FieldValidationRule['type'];
    if (!['maxLength', 'minLength', 'pattern', 'custom', 'async'].includes(type)) return;
    const trigger = normalizeRuleTrigger(item.trigger);

    if (type === 'pattern') {
      const value = String(item.value || '').trim();
      if (!value) return;
      rules.push({
        message: item.message ? String(item.message) : undefined,
        trigger,
        type,
        value,
      });
      return;
    }

    if (type === 'custom' || type === 'async') {
      const value = String(item.value || '').trim();
      if (!value) return;
      rules.push({
        message: item.message ? String(item.message) : undefined,
        trigger,
        type,
        value,
      });
      return;
    }

    const value = Number(item.value);
    if (!Number.isFinite(value)) return;
    rules.push({
      message: item.message ? String(item.message) : undefined,
      trigger,
      type,
      value,
    });
  });

  return rules;
}

function applyValidationRulesJson() {
  try {
    const parsed = validationRulesJson.value.trim()
      ? JSON.parse(validationRulesJson.value)
      : [];
    const rules = normalizeFieldValidationRules(parsed);
    updateField({ validationRules: rules });
    validationRuleEditorRows.value = rules.map((rule) => toValidationRuleEditorItem(rule));
    validationRulesJson.value = JSON.stringify(rules, null, 2);
  } catch {
    message.error($t('workflow.formDesigner.messages.validationRulesJsonInvalid'));
  }
}

function getDefaultOptionsByField(field: FormFieldSchema) {
  return [
    { label: `${$t('workflow.formDesigner.propsPanel.optionPrefix')}1`, value: `${field.fieldName}_1` },
    { label: `${$t('workflow.formDesigner.propsPanel.optionPrefix')}2`, value: `${field.fieldName}_2` },
  ];
}

function updateFieldDataSource(patch: Partial<FieldDataSourceConfig>) {
  const field = selectedField.value;
  if (!field || !supportsDataSource(field)) return;

  const current = selectedFieldDataSource.value || createDefaultFieldDataSourceConfig(field.component);
  updateField({
    dataSource: {
      ...current,
      ...patch,
    },
  });
}

function updateFieldLinkage(patch: Partial<FieldLinkageConfig>) {
  const field = selectedField.value;
  if (!field || !supportsDataSource(field)) return;

  const current = selectedFieldLinkage.value || createDefaultFieldLinkageConfig();
  updateField({
    linkage: {
      ...current,
      ...patch,
    },
  });
}

function hasLinkageCycle(
  fieldName: string,
  dependsOn: string[],
) {
  const graph = new Map<string, string[]>();

  (props.allFields ?? []).forEach((field) => {
    const nextDependsOn =
      field.fieldName === fieldName
        ? dependsOn
        : field.linkage?.dependsOn ?? [];
    graph.set(field.fieldName, [...nextDependsOn]);
  });

  const visiting = new Set<string>();
  const visited = new Set<string>();

  const dfs = (node: string): boolean => {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;

    visiting.add(node);
    const deps = graph.get(node) ?? [];
    for (const dep of deps) {
      if (!graph.has(dep)) continue;
      if (dfs(dep)) return true;
    }

    visiting.delete(node);
    visited.add(node);
    return false;
  };

  return Array.from(graph.keys()).some((key) => dfs(key));
}

function handleDependsOnChange(values: Array<string | number>) {
  const field = selectedField.value;
  if (!field || !supportsDataSource(field)) return;

  const dependsOn = values.map((item) => String(item));
  if (hasLinkageCycle(field.fieldName, dependsOn)) {
    message.error($t('workflow.formDesigner.messages.linkageCycleDetected'));
    return;
  }

  updateFieldLinkage({ dependsOn });
}

function parseJsonObject(raw: string, errorMessage: string) {
  try {
    const parsed = raw.trim() ? JSON.parse(raw) : {};
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      throw new Error('not object');
    }
    return parsed as Record<string, any>;
  } catch {
    message.error(errorMessage);
    return undefined;
  }
}

function parseJsonArray(raw: string, errorMessage: string) {
  try {
    const parsed = raw.trim() ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      throw new Error('not array');
    }
    return parsed;
  } catch {
    message.error(errorMessage);
    return undefined;
  }
}

function applyDataSourceBaseParamsJson() {
  const parsed = parseJsonObject(
    baseParamsJson.value,
    $t('workflow.formDesigner.messages.baseParamsJsonInvalid'),
  );
  if (!parsed) return;
  updateFieldDataSource({ baseParams: parsed });
}

function applyDataSourceHeadersJson() {
  const parsed = parseJsonObject(
    headersJson.value,
    $t('workflow.formDesigner.messages.headersJsonInvalid'),
  );
  if (!parsed) return;
  updateFieldDataSource({ headers: parsed });
}

function applyLinkageParamMapJson() {
  const parsed = parseJsonObject(
    linkageParamMapJson.value,
    $t('workflow.formDesigner.messages.paramMapJsonInvalid'),
  );
  if (!parsed) return;
  const rows = toLinkageParamMapRows(parsed);
  linkageParamMapRows.value = rows;
  const normalized = toLinkageParamMapObject(rows);
  updateFieldLinkage({ paramMap: normalized });
  linkageParamMapJson.value = JSON.stringify(normalized, null, 2);
}

function applyDataSourcePresetsJson() {
  const parsed = parseJsonArray(
    dataSourcePresetsJson.value,
    $t('workflow.formDesigner.messages.dataSourcePresetsJsonInvalid'),
  );
  if (!parsed) return;
  emit('update-data-source-presets', parsed as FieldDataSourcePreset[]);
}

function handleDataSourceTypeChange(value: string | number) {
  const field = selectedField.value;
  if (!field || !supportsDataSource(field)) return;

  const sourceType = String(value) as FieldDataSourceConfig['sourceType'];
  const patch: Partial<Omit<FormFieldSchema, 'id' | 'kind'>> = {
    dataSource: {
      ...(selectedFieldDataSource.value || createDefaultFieldDataSourceConfig(field.component)),
      sourceType,
    },
  };

  if (supportsOptions(field)) {
    patch.options = sourceType === 'api' ? [] : field.options?.length ? field.options : getDefaultOptionsByField(field);
  }

  updateField(patch);
}

function handleDataSourceApiModeChange(value: any) {
  const field = selectedField.value;
  if (!field || !supportsDataSource(field)) return;

  const apiMode = String(value || 'registry') as FieldDataSourceConfig['apiMode'];
  const next: Partial<FieldDataSourceConfig> = {
    apiMode,
    presetKey: '',
  };

  if (apiMode === 'registry') {
    next.apiUrl = '';
    next.headers = {};
  } else {
    next.apiKey = '';
  }

  updateFieldDataSource(next);
}

function handleDataSourcePresetChange(value: any) {
  const presetKey = String(value || '').trim();
  const preset = (props.dataSourcePresets ?? []).find((item) => item.key === presetKey);
  updateFieldDataSource({
    apiMode: 'custom',
    apiUrl: preset?.url ?? '',
    headers: preset?.headers ?? {},
    method: preset?.method ?? selectedFieldDataSource.value?.method ?? 'GET',
    presetKey,
  });
}

async function testLoadDataSource() {
  const field = selectedField.value;
  if (!field || !supportsDataSource(field)) return;

  const dataSource = selectedFieldDataSource.value;
  if (!dataSource || dataSource.sourceType !== 'api') {
    message.info($t('workflow.formDesigner.messages.staticSourceNoNeedTest'));
    return;
  }

  const resolvedDataSource = resolveFieldDataSourceConfig(
    field,
    props.dataSourcePresets,
  );
  const hasTarget = resolvedDataSource.apiMode === 'custom'
    ? Boolean(String(resolvedDataSource.apiUrl || '').trim())
    : Boolean(String(resolvedDataSource.apiKey || '').trim());
  if (!hasTarget) {
    message.warning(
      resolvedDataSource.apiMode === 'custom'
        ? $t('workflow.formDesigner.messages.missingCustomApiTarget')
        : $t('workflow.formDesigner.messages.missingApiKey'),
    );
    return;
  }

  const debugModel = Object.fromEntries(
    (props.allFields ?? []).map((item) => [
      item.fieldName,
      item.defaultValue,
    ]),
  );

  testingDataSource.value = true;
  try {
    const result = await loadFieldDataSourceOptions({
      dataSourcePresets: props.dataSourcePresets,
      field,
      formModel: debugModel,
      keyword: String(debugModel.keyword ?? ''),
    });

    message.success(`${$t('workflow.formDesigner.messages.testLoadSuccessPrefix')}${result.options.length}${$t('workflow.formDesigner.messages.testLoadSuccessSuffix')}`);
  } catch (error: any) {
    message.error(error?.message || $t('workflow.formDesigner.messages.testLoadFailed'));
  } finally {
    testingDataSource.value = false;
  }
}

function normalizeTableColumnComponent(raw: any): TableColumnComponent {
  const text = String(raw ?? '').trim();
  if (text === 'InputNumber' || text === 'Select' || text === 'Switch') {
    return text;
  }
  return 'Input';
}

function getDefaultTableCellValueByColumn(column: TableLayoutColumn) {
  const component = normalizeTableColumnComponent(column.component);
  if (Object.hasOwn(column, 'defaultValue')) {
    return column.defaultValue;
  }
  if (component === 'Switch') return false;
  if (component === 'InputNumber') return undefined;
  return '';
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
  try {
    const rules = normalizeFieldValidationRules(raw);
    return rules.length > 0 ? rules : undefined;
  } catch {
    return undefined;
  }
}

function normalizeTableColumn(item: any, index: number): TableLayoutColumn {
  const component = normalizeTableColumnComponent(item?.component);
  const width = Number(item?.width);

  const column: TableLayoutColumn = {
    component,
    dataIndex: String(item?.dataIndex || `col_${index + 1}`),
    defaultValue: Object.hasOwn(item ?? {}, 'defaultValue')
      ? item?.defaultValue
      : getDefaultTableCellValueByColumn({ component } as TableLayoutColumn),
    id: String(item?.id || `col_${Date.now()}_${index + 1}`),
    placeholder: String(item?.placeholder ?? ''),
    required: Boolean(item?.required),
    title: String(item?.title || `${$t('workflow.formDesigner.propsPanel.columnPrefix')}${index + 1}`),
    width: Number.isFinite(width) && width > 0 ? width : undefined,
  };

  if (component === 'Select') {
    column.options = normalizeTableColumnOptions(item?.options);
  }
  const rules = normalizeTableColumnValidationRules(item?.validationRules);
  if (rules) {
    column.validationRules = rules;
  }
  return column;
}

function normalizeTableColumns(raw: any): TableLayoutColumn[] {
  if (!Array.isArray(raw)) {
    throw new Error('columns must be an array');
  }
  if (raw.length === 0) {
    throw new Error('columns must keep at least one');
  }

  return raw.map((item, index) => normalizeTableColumn(item, index));
}

function normalizeTableRows(raw: any, columns: TableLayoutColumn[]) {
  if (!Array.isArray(raw)) {
    throw new Error('rows must be an array');
  }

  return raw.map((item) => {
    const row = typeof item === 'object' && item ? item : {};
    const normalized: Record<string, any> = {};

    columns.forEach((column) => {
      normalized[column.dataIndex] = Object.hasOwn(row, column.dataIndex)
        ? row[column.dataIndex]
        : getDefaultTableCellValueByColumn(column);
    });

    return normalized;
  });
}

function syncTableColumnValidationJsonMap(columns: TableLayoutColumn[]) {
  tableColumnValidationJsonMap.value = Object.fromEntries(
    columns.map((column) => [
      column.id,
      JSON.stringify(column.validationRules ?? [], null, 2),
    ]),
  );
}

function refreshTableJson(columns: TableLayoutColumn[], rows: Array<Record<string, any>>) {
  tableColumnsJson.value = JSON.stringify(columns, null, 2);
  tableRowsJson.value = JSON.stringify(rows, null, 2);
  syncTableColumnValidationJsonMap(columns);
}

function applyTableColumnsJson() {
  const layout = selectedLayout.value;
  if (!layout || layout.layoutType !== 'Table') return;

  try {
    const parsed = tableColumnsJson.value.trim()
      ? JSON.parse(tableColumnsJson.value)
      : [];
    const columns = normalizeTableColumns(parsed);
    const rows = normalizeTableRows(layout.rows ?? [], columns);

    updateLayout({ columns, rows });
    refreshTableJson(columns, rows);
  } catch {
    message.error($t('workflow.formDesigner.messages.tableColumnsJsonInvalid'));
  }
}

function applyTableRowsJson() {
  const layout = selectedLayout.value;
  if (!layout || layout.layoutType !== 'Table') return;

  try {
    const parsed = tableRowsJson.value.trim()
      ? JSON.parse(tableRowsJson.value)
      : [];
    const rows = normalizeTableRows(parsed, layout.columns);

    updateLayout({ rows });
    refreshTableJson(layout.columns, rows);
  } catch {
    message.error($t('workflow.formDesigner.messages.tableRowsJsonInvalid'));
  }
}

function addTableColumn() {
  const layout = selectedLayout.value;
  if (!layout || layout.layoutType !== 'Table') return;

  const nextIndex = layout.columns.length + 1;
  const dataIndex = createUniqueTableDataIndex(layout.columns, `col_${nextIndex}`);
  const nextColumn = normalizeTableColumn(
    {
      component: 'Input',
      dataIndex,
      id: `col_${Date.now()}_${nextIndex}`,
      required: false,
      title: `${$t('workflow.formDesigner.propsPanel.columnPrefix')}${nextIndex}`,
    },
    nextIndex - 1,
  );
  const columns = [
    ...layout.columns,
    nextColumn,
  ];

  const rows = (layout.rows ?? []).map((row) => ({
    ...row,
    [dataIndex]: getDefaultTableCellValueByColumn(nextColumn),
  }));

  updateLayout({ columns, rows });
  refreshTableJson(columns, rows);
}

function removeTableColumn(index: number) {
  const layout = selectedLayout.value;
  if (!layout || layout.layoutType !== 'Table') return;

  if (layout.columns.length <= 1) {
    message.warning($t('workflow.formDesigner.messages.keepAtLeastOneColumn'));
    return;
  }

  const removing = layout.columns[index];
  if (!removing) return;

  const columns = [...layout.columns];
  columns.splice(index, 1);

  const rows = (layout.rows ?? []).map((row) => {
    const next = { ...row };
    delete next[removing.dataIndex];
    return next;
  });

  updateLayout({ columns, rows });
  refreshTableJson(columns, rows);
}

function addTableRow() {
  const layout = selectedLayout.value;
  if (!layout || layout.layoutType !== 'Table') return;

  const newRow = Object.fromEntries(
    layout.columns.map((column) => [column.dataIndex, getDefaultTableCellValueByColumn(column)]),
  );
  const rows = [...(layout.rows ?? []), newRow];

  updateLayout({ rows });
  refreshTableJson(layout.columns, rows);
}

function removeTableRow(index: number) {
  const layout = selectedLayout.value;
  if (!layout || layout.layoutType !== 'Table') return;

  const rows = [...(layout.rows ?? [])];
  rows.splice(index, 1);

  updateLayout({ rows });
  refreshTableJson(layout.columns, rows);
}

function updateTableColumn(index: number, patch: Partial<TableLayoutColumn>) {
  const layout = selectedTableLayout.value;
  if (!layout) return;

  const columns = layout.columns.map((column, columnIndex) => {
    if (columnIndex !== index) return column;
    const nextColumn = {
      ...column,
      ...patch,
    } as TableLayoutColumn;
    if (normalizeTableColumnComponent(nextColumn.component) !== 'Select') {
      nextColumn.options = undefined;
    } else if (!nextColumn.options || nextColumn.options.length === 0) {
      nextColumn.options = [
        { label: `${$t('workflow.formDesigner.propsPanel.optionPrefix')}1`, value: '1' },
        { label: `${$t('workflow.formDesigner.propsPanel.optionPrefix')}2`, value: '2' },
      ];
    }
    return nextColumn;
  });

  updateLayout({ columns });
  refreshTableJson(columns, layout.rows || []);
}

function updateTableColumnTitle(index: number, title: string) {
  updateTableColumn(index, {
    title: title || '',
  });
}

function createUniqueTableDataIndex(columns: TableLayoutColumn[], target: string, excludeIndex?: number) {
  const base = String(target || 'col').trim() || 'col';
  const used = new Set(
    columns
      .map((column, index) => (index === excludeIndex ? '' : String(column.dataIndex || '').trim()))
      .filter((item) => Boolean(item)),
  );
  if (!used.has(base)) return base;

  let count = 2;
  let next = `${base}_${count}`;
  while (used.has(next)) {
    count += 1;
    next = `${base}_${count}`;
  }
  return next;
}

function updateTableColumnDataIndex(index: number, dataIndex: string) {
  const layout = selectedTableLayout.value;
  if (!layout) return;

  const current = layout.columns[index];
  if (!current) return;

  const raw = String(dataIndex ?? '').trim();
  const nextDataIndex = createUniqueTableDataIndex(layout.columns, raw || current.dataIndex, index);
  if (nextDataIndex === current.dataIndex) return;

  const columns = layout.columns.map((column, columnIndex) => {
    if (columnIndex !== index) return column;
    return {
      ...column,
      dataIndex: nextDataIndex,
    };
  });

  const rows = (layout.rows ?? []).map((row) => {
    const nextRow = { ...row };
    nextRow[nextDataIndex] = row[current.dataIndex];
    delete nextRow[current.dataIndex];
    return nextRow;
  });

  updateLayout({ columns, rows });
  refreshTableJson(columns, rows);
}

function handleTableColumnComponentChange(index: number, value: any) {
  const component = normalizeTableColumnComponent(value);
  const defaultValue = getDefaultTableCellValueByColumn({ component } as TableLayoutColumn);
  updateTableColumn(index, {
    component,
    defaultValue,
  });
}

function applyTableColumnValidationRulesJson(index: number) {
  const layout = selectedTableLayout.value;
  if (!layout) return;
  const column = layout.columns[index];
  if (!column) return;

  const text = String(tableColumnValidationJsonMap.value[column.id] ?? '').trim();
  try {
    const parsed = text ? JSON.parse(text) : [];
    const rules = normalizeFieldValidationRules(parsed);
    updateTableColumn(index, {
      validationRules: rules.length > 0 ? rules : undefined,
    });
    tableColumnValidationJsonMap.value[column.id] = JSON.stringify(rules, null, 2);
  } catch {
    message.error($t('workflow.formDesigner.messages.tableColumnValidationRulesJsonInvalid'));
  }
}

function addTableColumnOption(columnIndex: number) {
  const layout = selectedTableLayout.value;
  if (!layout) return;
  const column = layout.columns[columnIndex];
  if (!column) return;

  const options = [...(column.options ?? [])];
  options.push({
    label: `${$t('workflow.formDesigner.propsPanel.optionPrefix')}${options.length + 1}`,
    value: `option_${Date.now()}`,
  });
  updateTableColumn(columnIndex, { options });
}

function removeTableColumnOption(columnIndex: number, optionIndex: number) {
  const layout = selectedTableLayout.value;
  if (!layout) return;
  const column = layout.columns[columnIndex];
  if (!column) return;

  const options = [...(column.options ?? [])];
  options.splice(optionIndex, 1);
  updateTableColumn(columnIndex, { options: options.length > 0 ? options : undefined });
}

function updateTableColumnOption(columnIndex: number, optionIndex: number, patch: Partial<FieldOption>) {
  const layout = selectedTableLayout.value;
  if (!layout) return;
  const column = layout.columns[columnIndex];
  if (!column) return;

  const options = [...(column.options ?? [])];
  const current = options[optionIndex];
  if (!current) return;

  options[optionIndex] = {
    ...current,
    ...patch,
  };
  updateTableColumn(columnIndex, { options });
}

function toOptionalPositiveNumber(value: any) {
  if (value === '' || value === null || value === undefined) return undefined;
  const next = Number(value);
  if (!Number.isFinite(next) || next <= 0) return undefined;
  return next;
}
</script>

<template>
  <div class="flex h-full flex-col p-3">
    <div class="mb-3 text-sm text-muted-foreground">
      {{ props.selected ? $t('workflow.formDesigner.propsPanel.componentProps') : $t('workflow.formDesigner.propsPanel.globalProps') }}
    </div>

    <div v-if="!props.selected" class="flex-1 overflow-auto">
      <Form layout="vertical">
        <FormItem :label="$t('workflow.formDesigner.propsPanel.formLayout')">
          <Select
            :value="props.formLayout ?? 'vertical'"
            :options="formLayoutOptions"
            @update:value="(value) => handleGlobalFormLayoutChange(value)"
          />
        </FormItem>

        <FormItem :label="$t('workflow.formDesigner.propsPanel.formSize')">
          <Select
            :value="props.formSize ?? 'middle'"
            :options="formSizeOptions"
            @update:value="(value) => updateFormConfig({ formSize: String(value || 'middle') as any })"
          />
        </FormItem>

        <FormItem :label="$t('workflow.formDesigner.propsPanel.formVariant')">
          <Select
            :value="props.formVariant ?? 'outlined'"
            :options="formVariantOptions"
            @update:value="(value) => updateFormConfig({ formVariant: String(value || 'outlined') as FormVariantMode })"
          />
        </FormItem>

        <FormItem :label="$t('workflow.formDesigner.propsPanel.formValidateTrigger')">
          <Select
            :value="props.formValidateTrigger ?? 'change'"
            :options="formValidateTriggerOptions"
            @update:value="(value) => updateFormConfig({ formValidateTrigger: String(value || 'change') as FormValidateTriggerMode })"
          />
        </FormItem>

        <FormItem :label="$t('workflow.formDesigner.propsPanel.formLabelAlign')">
          <Select
            :value="props.formLabelAlign ?? 'right'"
            :options="formLabelAlignOptions"
            @update:value="(value) => updateFormConfig({ formLabelAlign: String(value || 'right') as any })"
          />
        </FormItem>

        <FormItem :label="$t('workflow.formDesigner.propsPanel.formLabelWidth')">
          <InputNumber
            :min="60"
            :max="360"
            :value="Number(props.formLabelWidth ?? 120)"
            style="width: 100%;"
            @update:value="(value) => updateFormConfig({ formLabelWidth: Number(value || 120) })"
          />
        </FormItem>

        <FormItem :label="$t('workflow.formDesigner.propsPanel.formLabelWrap')">
          <Switch
            :checked="Boolean(props.formLabelWrap)"
            @update:checked="(value) => updateFormConfig({ formLabelWrap: Boolean(value) })"
          />
        </FormItem>

        <FormItem :label="$t('workflow.formDesigner.propsPanel.formColon')">
          <Switch
            :checked="Boolean(props.formColon)"
            @update:checked="(value) => updateFormConfig({ formColon: Boolean(value) })"
          />
        </FormItem>

        <FormItem :label="$t('workflow.formDesigner.propsPanel.formRequiredMark')">
          <Switch
            :checked="Boolean(props.formRequiredMark)"
            @update:checked="(value) => updateFormConfig({ formRequiredMark: Boolean(value) })"
          />
        </FormItem>

        <FormItem :label="$t('workflow.formDesigner.propsPanel.formShowSerialNumber')">
          <Switch
            :checked="Boolean(props.formShowSerialNumber)"
            @update:checked="(value) => updateFormConfig({ formShowSerialNumber: Boolean(value) })"
          />
        </FormItem>

        <FormItem :label="$t('workflow.formDesigner.propsPanel.formDisabled')">
          <Switch
            :checked="Boolean(props.formDisabled)"
            @update:checked="(value) => updateFormConfig({ formDisabled: Boolean(value) })"
          />
        </FormItem>
      </Form>

      <Divider class="my-3">{{ $t('workflow.formDesigner.propsPanel.dataSourcePresetCenter') }}</Divider>
      <TextArea
        v-model:value="dataSourcePresetsJson"
        :rows="10"
        :placeholder="tBrace('workflow.formDesigner.propsPanel.dataSourcePresetCenterPlaceholder')"
        @blur="applyDataSourcePresetsJson"
      />
    </div>

    <div v-else class="flex-1 overflow-auto">
      <template v-if="selectedField">
        <Form layout="vertical">
          <FormItem :label="$t('workflow.formDesigner.propsPanel.fieldLabel')">
            <Input :value="selectedField.label" @update:value="(value) => updateField({ label: value })" />
          </FormItem>

          <FormItem :label="$t('workflow.formDesigner.propsPanel.fieldName')">
            <Input
              :value="selectedField.fieldName"
              @update:value="(value) => updateField({ fieldName: value?.trim?.() || '' })"
            />
          </FormItem>

          <FormItem :label="$t('workflow.formDesigner.propsPanel.fieldComponent')">
            <Select
              :value="resolveFieldMaterialKey(selectedField)"
              :options="fieldComponentOptions"
              @update:value="(value) => handleFieldMaterialChange(String(value))"
            />
          </FormItem>

          <FormItem v-if="supportsPlaceholder(selectedField)" :label="$t('workflow.formDesigner.propsPanel.fieldPlaceholder')">
            <Input
              :value="selectedField.placeholder"
              @update:value="(value) => updateField({ placeholder: value || '' })"
            />
          </FormItem>

          <FormItem :label="$t('workflow.formDesigner.propsPanel.fieldDescription')">
            <TextArea
              :value="selectedField.description || ''"
              :rows="2"
              :placeholder="$t('workflow.formDesigner.propsPanel.fieldDescriptionPlaceholder')"
              @update:value="(value) => updateField({ description: String(value || '') })"
            />
          </FormItem>

          <FormItem :label="$t('workflow.formDesigner.propsPanel.defaultValue')">
            <Switch
              v-if="['Switch', 'Checkbox', 'Radio'].includes(selectedField.component)"
              :checked="Boolean(selectedField.defaultValue)"
              @update:checked="(value) => updateField({ defaultValue: Boolean(value) })"
            />
            <InputNumber
              v-else-if="['InputNumber', 'Slider', 'Rate'].includes(selectedField.component)"
              :value="toOptionalNumber(selectedField.defaultValue)"
              style="width: 100%;"
              @update:value="(value) => updateField({ defaultValue: toOptionalNumber(value) })"
            />
            <Select
              v-else-if="selectedField.component === 'CheckboxGroup'"
              :value="Array.isArray(selectedField.defaultValue) ? selectedField.defaultValue : []"
              :options="selectedFieldValueOptions"
              mode="multiple"
              :placeholder="$t('workflow.formDesigner.propsPanel.defaultValueSelectPlaceholder')"
              @update:value="(value) => updateField({ defaultValue: Array.isArray(value) ? value : [] })"
            />
            <Select
              v-else-if="['Select', 'RadioGroup', 'Segmented', 'AutoComplete'].includes(selectedField.component)"
              :value="selectedField.defaultValue"
              :options="selectedFieldValueOptions"
              allow-clear
              :placeholder="$t('workflow.formDesigner.propsPanel.defaultValueSelectPlaceholder')"
              @update:value="(value) => updateField({ defaultValue: value })"
            />
            <Input
              v-else
              :value="String(selectedField.defaultValue ?? '')"
              @update:value="(value) => updateField({ defaultValue: value })"
            />
          </FormItem>

          <FormItem :label="$t('workflow.formDesigner.propsPanel.required')">
            <Switch
              :checked="Boolean(selectedField.required)"
              @update:checked="(value) => updateField({ required: Boolean(value) })"
            />
          </FormItem>

          <FormItem :label="$t('workflow.formDesigner.propsPanel.validateTrigger')">
            <Select
              :value="selectedField.validateTrigger || 'change'"
              :options="fieldValidateTriggerOptions"
              @update:value="(value) => updateField({ validateTrigger: String(value || 'change') as any })"
            />
          </FormItem>

          <FormItem :label="$t('workflow.formDesigner.propsPanel.requiredExpression')">
            <div class="space-y-2">
              <div class="text-xs text-muted-foreground">
                {{ $t('workflow.formDesigner.propsPanel.expressionVisualHint') }}
              </div>
              <div v-if="!requiredExpressionVisualAvailable" class="text-xs text-warning">
                {{ $t('workflow.formDesigner.propsPanel.expressionVisualUnavailableHint') }}
              </div>
              <div class="grid grid-cols-2 gap-2">
                <Select
                  :disabled="!requiredExpressionVisualAvailable"
                  :value="requiredExpressionVisualMode"
                  :options="expressionVisualModeOptions"
                  @update:value="(value) => handleRequiredExpressionVisualModeChange(value)"
                />
                <Button
                  :disabled="!requiredExpressionVisualAvailable"
                  size="small"
                  @click="addRequiredExpressionVisualRow"
                >
                  {{ $t('workflow.formDesigner.propsPanel.expressionAddCondition') }}
                </Button>
              </div>

              <div class="space-y-2">
                <div
                  v-for="(row, index) in requiredExpressionVisualRows"
                  :key="`required_expression_row_${index}`"
                  class="rounded-md border border-border p-2"
                >
                  <div class="grid grid-cols-3 gap-2">
                    <Select
                      :options="availableExpressionFieldOptions"
                      :placeholder="$t('workflow.formDesigner.propsPanel.expressionFieldPlaceholder')"
                      :value="row.fieldName"
                      show-search
                      @update:value="(value) => updateRequiredExpressionVisualRow(index, { fieldName: String(value || '') })"
                    />
                    <Select
                      :options="expressionVisualOperatorOptions"
                      :value="row.operator"
                      @update:value="(value) => updateRequiredExpressionVisualRow(index, { operator: String(value || 'eq') as any })"
                    />
                    <Input
                      v-if="expressionOperatorNeedsValue(row.operator)"
                      :placeholder="$t('workflow.formDesigner.propsPanel.expressionValuePlaceholder')"
                      :value="row.value"
                      @update:value="(value) => updateRequiredExpressionVisualRow(index, { value: String(value || '') })"
                    />
                    <div v-else class="flex items-center text-xs text-muted-foreground">
                      {{ $t('workflow.formDesigner.propsPanel.expressionValueNotRequired') }}
                    </div>
                  </div>
                  <div class="mt-2 flex justify-end">
                    <Button danger size="small" @click="removeRequiredExpressionVisualRow(index)">
                      {{ $t('workflow.formDesigner.propsPanel.expressionRemoveCondition') }}
                    </Button>
                  </div>
                </div>
              </div>

              <TextArea
                v-model:value="requiredExpressionInput"
                :rows="2"
                :placeholder="$t('workflow.formDesigner.propsPanel.requiredExpressionPlaceholder')"
                @blur="applyRequiredExpression"
              />
            </div>
          </FormItem>

          <FormItem :label="$t('workflow.formDesigner.propsPanel.visibleExpression')">
            <div class="space-y-2">
              <div class="text-xs text-muted-foreground">
                {{ $t('workflow.formDesigner.propsPanel.expressionVisualHint') }}
              </div>
              <div v-if="!visibleExpressionVisualAvailable" class="text-xs text-warning">
                {{ $t('workflow.formDesigner.propsPanel.expressionVisualUnavailableHint') }}
              </div>
              <div class="grid grid-cols-2 gap-2">
                <Select
                  :disabled="!visibleExpressionVisualAvailable"
                  :value="visibleExpressionVisualMode"
                  :options="expressionVisualModeOptions"
                  @update:value="(value) => handleVisibleExpressionVisualModeChange(value)"
                />
                <Button
                  :disabled="!visibleExpressionVisualAvailable"
                  size="small"
                  @click="addVisibleExpressionVisualRow"
                >
                  {{ $t('workflow.formDesigner.propsPanel.expressionAddCondition') }}
                </Button>
              </div>

              <div class="space-y-2">
                <div
                  v-for="(row, index) in visibleExpressionVisualRows"
                  :key="`visible_expression_row_${index}`"
                  class="rounded-md border border-border p-2"
                >
                  <div class="grid grid-cols-3 gap-2">
                    <Select
                      :options="availableExpressionFieldOptions"
                      :placeholder="$t('workflow.formDesigner.propsPanel.expressionFieldPlaceholder')"
                      :value="row.fieldName"
                      show-search
                      @update:value="(value) => updateVisibleExpressionVisualRow(index, { fieldName: String(value || '') })"
                    />
                    <Select
                      :options="expressionVisualOperatorOptions"
                      :value="row.operator"
                      @update:value="(value) => updateVisibleExpressionVisualRow(index, { operator: String(value || 'eq') as any })"
                    />
                    <Input
                      v-if="expressionOperatorNeedsValue(row.operator)"
                      :placeholder="$t('workflow.formDesigner.propsPanel.expressionValuePlaceholder')"
                      :value="row.value"
                      @update:value="(value) => updateVisibleExpressionVisualRow(index, { value: String(value || '') })"
                    />
                    <div v-else class="flex items-center text-xs text-muted-foreground">
                      {{ $t('workflow.formDesigner.propsPanel.expressionValueNotRequired') }}
                    </div>
                  </div>
                  <div class="mt-2 flex justify-end">
                    <Button danger size="small" @click="removeVisibleExpressionVisualRow(index)">
                      {{ $t('workflow.formDesigner.propsPanel.expressionRemoveCondition') }}
                    </Button>
                  </div>
                </div>
              </div>

              <TextArea
                v-model:value="visibleExpressionInput"
                :rows="2"
                :placeholder="$t('workflow.formDesigner.propsPanel.visibleExpressionPlaceholder')"
                @blur="applyVisibleExpression"
              />
            </div>
          </FormItem>

          <FormItem :label="$t('workflow.formDesigner.propsPanel.validationRulesVisual')">
            <div class="space-y-2">
              <div
                v-for="(rule, index) in validationRuleEditorRows"
                :key="`rule_${index}`"
                class="rounded-md border border-border p-2"
              >
                <div class="grid grid-cols-2 gap-2">
                  <Select
                    :value="rule.type"
                    :options="validationRuleTypeOptions"
                    @update:value="(value) => handleValidationRuleTypeChange(index, value)"
                  />

                  <InputNumber
                    v-if="['minLength', 'maxLength'].includes(rule.type)"
                    :min="0"
                    :value="Number(rule.value || 0)"
                    style="width: 100%;"
                    @update:value="(value) => updateValidationRuleRow(index, { value: Number(value || 0) })"
                  />
                  <Input
                    v-else-if="rule.type === 'pattern'"
                    :placeholder="$t('workflow.formDesigner.propsPanel.validationRulePatternPlaceholder')"
                    :value="String(rule.value || '')"
                    @update:value="(value) => updateValidationRuleRow(index, { value: String(value || '') })"
                  />
                  <Select
                    v-else-if="rule.type === 'custom'"
                    :allow-clear="syncValidatorSelectOptions.length > 0"
                    :options="syncValidatorSelectOptions"
                    :placeholder="$t('workflow.formDesigner.propsPanel.validationRuleCustomPlaceholder')"
                    :value="String(rule.value || '')"
                    show-search
                    @update:value="(value) => updateValidationRuleRow(index, { value: String(value || '') })"
                  />
                  <Select
                    v-else
                    :allow-clear="asyncValidatorSelectOptions.length > 0"
                    :options="asyncValidatorSelectOptions"
                    :placeholder="$t('workflow.formDesigner.propsPanel.validationRuleAsyncPlaceholder')"
                    :value="String(rule.value || '')"
                    show-search
                    @update:value="(value) => updateValidationRuleRow(index, { value: String(value || '') })"
                  />
                </div>

                <div class="mt-2 grid grid-cols-2 gap-2">
                  <Input
                    :placeholder="$t('workflow.formDesigner.propsPanel.validationRuleMessagePlaceholder')"
                    :value="rule.message"
                    @update:value="(value) => updateValidationRuleRow(index, { message: String(value || '') })"
                  />
                  <Select
                    allow-clear
                    :options="validationRuleTriggerOptions"
                    :placeholder="$t('workflow.formDesigner.propsPanel.validationRuleTriggerPlaceholder')"
                    :value="rule.trigger"
                    @update:value="(value) => updateValidationRuleRow(index, { trigger: normalizeRuleTrigger(value) })"
                  />
                </div>

                <div class="mt-2 flex justify-end">
                  <Button danger size="small" @click="removeValidationRuleRow(index)">
                    {{ $t('workflow.formDesigner.propsPanel.removeValidationRule') }}
                  </Button>
                </div>
              </div>

              <Button block size="small" @click="addValidationRuleRow">
                {{ $t('workflow.formDesigner.propsPanel.addValidationRule') }}
              </Button>
            </div>
          </FormItem>

          <FormItem :label="$t('workflow.formDesigner.propsPanel.validationRules')">
            <TextArea
              v-model:value="validationRulesJson"
              :rows="5"
              :placeholder="validationRulesPlaceholder"
              @blur="applyValidationRulesJson"
            />
          </FormItem>
        </Form>

        <Divider class="my-3">{{ $t('workflow.formDesigner.propsPanel.visualProps') }}</Divider>
        <Form layout="vertical">
          <FormItem
            v-if="isSelectedFieldComponent(['Input', 'Textarea', 'Mentions', 'AutoComplete'])"
            :label="$t('workflow.formDesigner.propsPanel.propMaxLength')"
          >
            <InputNumber
              :min="1"
              :value="toOptionalNumber(selectedFieldComponentProps.maxLength)"
              style="width: 100%;"
              @update:value="(value) => updateFieldComponentProp('maxLength', toOptionalNumber(value))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Textarea'])" :label="$t('workflow.formDesigner.propsPanel.propRows')">
            <InputNumber
              :min="1"
              :value="Number(selectedFieldComponentProps.rows ?? 4)"
              style="width: 100%;"
              @update:value="(value) => updateFieldComponentProp('rows', Math.max(1, Number(value || 4)))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Input', 'InputNumber'])" :label="$t('workflow.formDesigner.propsPanel.propAddonBefore')">
            <Input
              :value="String(selectedFieldComponentProps.addonBefore || '')"
              @update:value="(value) => updateFieldComponentProp('addonBefore', String(value || ''))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Input', 'InputNumber'])" :label="$t('workflow.formDesigner.propsPanel.propAddonAfter')">
            <Input
              :value="String(selectedFieldComponentProps.addonAfter || '')"
              @update:value="(value) => updateFieldComponentProp('addonAfter', String(value || ''))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Input', 'InputNumber'])" :label="$t('workflow.formDesigner.propsPanel.propPrefix')">
            <Input
              :value="String(selectedFieldComponentProps.prefix || '')"
              @update:value="(value) => updateFieldComponentProp('prefix', String(value || ''))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Input', 'InputNumber'])" :label="$t('workflow.formDesigner.propsPanel.propSuffix')">
            <Input
              :value="String(selectedFieldComponentProps.suffix || '')"
              @update:value="(value) => updateFieldComponentProp('suffix', String(value || ''))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Input', 'Select', 'TreeSelect', 'AutoComplete'])" :label="$t('workflow.formDesigner.propsPanel.propAllowClear')">
            <Switch
              :checked="Boolean(selectedFieldComponentProps.allowClear)"
              @update:checked="(value) => updateFieldComponentProp('allowClear', Boolean(value))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Select', 'TreeSelect', 'AutoComplete'])" :label="$t('workflow.formDesigner.propsPanel.propShowSearch')">
            <Switch
              :checked="Boolean(selectedFieldComponentProps.showSearch)"
              @update:checked="(value) => updateFieldComponentProp('showSearch', Boolean(value))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['AutoComplete'])" :label="$t('workflow.formDesigner.propsPanel.propBackfill')">
            <Switch
              :checked="Boolean(selectedFieldComponentProps.backfill)"
              @update:checked="(value) => updateFieldComponentProp('backfill', Boolean(value))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Select'])" :label="$t('workflow.formDesigner.propsPanel.propMode')">
            <Select
              :value="String(selectedFieldComponentProps.mode || '')"
              :options="selectModeOptions"
              @update:value="(value) => updateFieldComponentProp('mode', value ? String(value) : undefined)"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Select', 'TreeSelect', 'Cascader'])" :label="$t('workflow.formDesigner.propsPanel.propMaxTagCount')">
            <InputNumber
              :min="1"
              :value="toOptionalNumber(selectedFieldComponentProps.maxTagCount)"
              style="width: 100%;"
              @update:value="(value) => updateFieldComponentProp('maxTagCount', toOptionalNumber(value))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Cascader'])" :label="$t('workflow.formDesigner.propsPanel.propMultiple')">
            <Switch
              :checked="Boolean(selectedFieldComponentProps.multiple)"
              @update:checked="(value) => updateFieldComponentProp('multiple', Boolean(value))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Cascader'])" :label="$t('workflow.formDesigner.propsPanel.propChangeOnSelect')">
            <Switch
              :checked="Boolean(selectedFieldComponentProps.changeOnSelect)"
              @update:checked="(value) => updateFieldComponentProp('changeOnSelect', Boolean(value))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Cascader'])" :label="$t('workflow.formDesigner.propsPanel.propExpandTrigger')">
            <Select
              :value="String(selectedFieldComponentProps.expandTrigger || 'click')"
              :options="cascaderExpandTriggerOptions"
              @update:value="(value) => updateFieldComponentProp('expandTrigger', String(value || 'click'))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Select', 'Cascader', 'TreeSelect'])" :label="$t('workflow.formDesigner.propsPanel.propPlacement')">
            <Select
              :value="String(selectedFieldComponentProps.placement || 'bottomLeft')"
              :options="popupPlacementOptions"
              @update:value="(value) => updateFieldComponentProp('placement', String(value || 'bottomLeft'))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['InputNumber', 'Slider'])" :label="$t('workflow.formDesigner.propsPanel.propMin')">
            <InputNumber
              :value="toOptionalNumber(selectedFieldComponentProps.min)"
              style="width: 100%;"
              @update:value="(value) => updateFieldComponentProp('min', toOptionalNumber(value))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['InputNumber', 'Slider'])" :label="$t('workflow.formDesigner.propsPanel.propMax')">
            <InputNumber
              :value="toOptionalNumber(selectedFieldComponentProps.max)"
              style="width: 100%;"
              @update:value="(value) => updateFieldComponentProp('max', toOptionalNumber(value))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['InputNumber', 'Slider'])" :label="$t('workflow.formDesigner.propsPanel.propStep')">
            <InputNumber
              :min="0.0001"
              :step="0.1"
              :value="toOptionalNumber(selectedFieldComponentProps.step)"
              style="width: 100%;"
              @update:value="(value) => updateFieldComponentProp('step', toOptionalNumber(value))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['InputNumber'])" :label="$t('workflow.formDesigner.propsPanel.propPrecision')">
            <InputNumber
              :min="0"
              :value="toOptionalNumber(selectedFieldComponentProps.precision)"
              style="width: 100%;"
              @update:value="(value) => updateFieldComponentProp('precision', toOptionalNumber(value))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['InputNumber'])" :label="$t('workflow.formDesigner.propsPanel.propControls')">
            <Switch
              :checked="selectedFieldComponentProps.controls !== false"
              @update:checked="(value) => updateFieldComponentProp('controls', Boolean(value))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Slider'])" :label="$t('workflow.formDesigner.propsPanel.propRange')">
            <Switch
              :checked="Boolean(selectedFieldComponentProps.range)"
              @update:checked="(value) => updateFieldComponentProp('range', Boolean(value))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Slider'])" :label="$t('workflow.formDesigner.propsPanel.propIncluded')">
            <Switch
              :checked="selectedFieldComponentProps.included !== false"
              @update:checked="(value) => updateFieldComponentProp('included', Boolean(value))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Slider'])" :label="$t('workflow.formDesigner.propsPanel.propDots')">
            <Switch
              :checked="Boolean(selectedFieldComponentProps.dots)"
              @update:checked="(value) => updateFieldComponentProp('dots', Boolean(value))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Slider'])" :label="$t('workflow.formDesigner.propsPanel.propReverse')">
            <Switch
              :checked="Boolean(selectedFieldComponentProps.reverse)"
              @update:checked="(value) => updateFieldComponentProp('reverse', Boolean(value))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Slider'])" :label="$t('workflow.formDesigner.propsPanel.propKeyboard')">
            <Switch
              :checked="selectedFieldComponentProps.keyboard !== false"
              @update:checked="(value) => updateFieldComponentProp('keyboard', Boolean(value))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Slider'])" :label="$t('workflow.formDesigner.propsPanel.propOrientation')">
            <Select
              :value="String(selectedFieldComponentProps.orientation || 'horizontal')"
              :options="orientationOptions"
              @update:value="(value) => updateFieldComponentProp('orientation', String(value || 'horizontal'))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Rate'])" :label="$t('workflow.formDesigner.propsPanel.propCount')">
            <InputNumber
              :min="1"
              :max="10"
              :value="Number(selectedFieldComponentProps.count ?? 5)"
              style="width: 100%;"
              @update:value="(value) => updateFieldComponentProp('count', Math.max(1, Number(value || 5)))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Rate'])" :label="$t('workflow.formDesigner.propsPanel.propAllowHalf')">
            <Switch
              :checked="Boolean(selectedFieldComponentProps.allowHalf)"
              @update:checked="(value) => updateFieldComponentProp('allowHalf', Boolean(value))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Rate'])" :label="$t('workflow.formDesigner.propsPanel.propRateAllowClear')">
            <Switch
              :checked="selectedFieldComponentProps.allowClear !== false"
              @update:checked="(value) => updateFieldComponentProp('allowClear', Boolean(value))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Rate'])" :label="$t('workflow.formDesigner.propsPanel.propRateKeyboard')">
            <Switch
              :checked="selectedFieldComponentProps.keyboard !== false"
              @update:checked="(value) => updateFieldComponentProp('keyboard', Boolean(value))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['RadioGroup'])" :label="$t('workflow.formDesigner.propsPanel.propOptionType')">
            <Select
              :value="String(selectedFieldComponentProps.optionType || 'default')"
              :options="selectOptionTypeOptions"
              @update:value="(value) => updateFieldComponentProp('optionType', String(value || 'default'))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['RadioGroup'])" :label="$t('workflow.formDesigner.propsPanel.propRadioOrientation')">
            <Select
              :value="String(selectedFieldComponentProps.orientation || 'horizontal')"
              :options="orientationOptions"
              @update:value="(value) => updateFieldComponentProp('orientation', String(value || 'horizontal'))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Segmented'])" :label="$t('workflow.formDesigner.propsPanel.propBlock')">
            <Switch
              :checked="Boolean(selectedFieldComponentProps.block)"
              @update:checked="(value) => updateFieldComponentProp('block', Boolean(value))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Segmented'])" :label="$t('workflow.formDesigner.propsPanel.propSegmentedOrientation')">
            <Select
              :value="String(selectedFieldComponentProps.orientation || 'horizontal')"
              :options="orientationOptions"
              @update:value="(value) => updateFieldComponentProp('orientation', String(value || 'horizontal'))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Segmented'])" :label="$t('workflow.formDesigner.propsPanel.propShape')">
            <Select
              :value="String(selectedFieldComponentProps.shape || 'default')"
              :options="segmentedShapeOptions"
              @update:value="(value) => updateFieldComponentProp('shape', String(value || 'default'))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['DatePicker', 'TimePicker'])" :label="$t('workflow.formDesigner.propsPanel.propFormat')">
            <Input
              :value="String(selectedFieldComponentProps.format || '')"
              :placeholder="$t('workflow.formDesigner.propsPanel.propFormatPlaceholder')"
              @update:value="(value) => updateFieldComponentProp('format', String(value || ''))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['ColorPicker'])" :label="$t('workflow.formDesigner.propsPanel.propValueFormat')">
            <Select
              :value="String(selectedFieldComponentProps.valueFormat || 'hex')"
              :options="colorValueFormatOptions"
              @update:value="(value) => updateFieldComponentProp('valueFormat', String(value || 'hex'))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['ColorPicker'])" :label="$t('workflow.formDesigner.propsPanel.propColorFormat')">
            <Select
              :value="String(selectedFieldComponentProps.format || 'hex')"
              :options="colorValueFormatOptions"
              @update:value="(value) => updateFieldComponentProp('format', String(value || 'hex'))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['ColorPicker'])" :label="$t('workflow.formDesigner.propsPanel.propColorAllowClear')">
            <Switch
              :checked="Boolean(selectedFieldComponentProps.allowClear)"
              @update:checked="(value) => updateFieldComponentProp('allowClear', Boolean(value))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['ColorPicker'])" :label="$t('workflow.formDesigner.propsPanel.propShowText')">
            <Switch
              :checked="Boolean(selectedFieldComponentProps.showText)"
              @update:checked="(value) => updateFieldComponentProp('showText', Boolean(value))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['ColorPicker'])" :label="$t('workflow.formDesigner.propsPanel.propDisabledAlpha')">
            <Switch
              :checked="Boolean(selectedFieldComponentProps.disabledAlpha)"
              @update:checked="(value) => updateFieldComponentProp('disabledAlpha', Boolean(value))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['ColorPicker'])" :label="$t('workflow.formDesigner.propsPanel.propDisabledFormat')">
            <Switch
              :checked="Boolean(selectedFieldComponentProps.disabledFormat)"
              @update:checked="(value) => updateFieldComponentProp('disabledFormat', Boolean(value))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Switch'])" :label="$t('workflow.formDesigner.propsPanel.propCheckedChildren')">
            <Input
              :value="String(selectedFieldComponentProps.checkedChildren || '')"
              @update:value="(value) => updateFieldComponentProp('checkedChildren', String(value || ''))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Switch'])" :label="$t('workflow.formDesigner.propsPanel.propUnCheckedChildren')">
            <Input
              :value="String(selectedFieldComponentProps.unCheckedChildren || '')"
              @update:value="(value) => updateFieldComponentProp('unCheckedChildren', String(value || ''))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Switch'])" :label="$t('workflow.formDesigner.propsPanel.propSwitchLoading')">
            <Switch
              :checked="Boolean(selectedFieldComponentProps.loading)"
              @update:checked="(value) => updateFieldComponentProp('loading', Boolean(value))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Switch'])" :label="$t('workflow.formDesigner.propsPanel.propCheckedValue')">
            <Input
              :value="String(selectedFieldComponentProps.checkedValue ?? 'true')"
              @update:value="(value) => updateFieldComponentProp('checkedValue', String(value || 'true'))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Switch'])" :label="$t('workflow.formDesigner.propsPanel.propUnCheckedValue')">
            <Input
              :value="String(selectedFieldComponentProps.unCheckedValue ?? 'false')"
              @update:value="(value) => updateFieldComponentProp('unCheckedValue', String(value || 'false'))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Checkbox'])" :label="$t('workflow.formDesigner.propsPanel.propIndeterminate')">
            <Switch
              :checked="Boolean(selectedFieldComponentProps.indeterminate)"
              @update:checked="(value) => updateFieldComponentProp('indeterminate', Boolean(value))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Mentions'])" :label="$t('workflow.formDesigner.propsPanel.propMentionsLoading')">
            <Switch
              :checked="Boolean(selectedFieldComponentProps.loading)"
              @update:checked="(value) => updateFieldComponentProp('loading', Boolean(value))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Upload'])" :label="$t('workflow.formDesigner.propsPanel.propListType')">
            <Select
              :value="String(selectedFieldComponentProps.listType || 'text')"
              :options="uploadListTypeOptions"
              @update:value="(value) => updateFieldComponentProp('listType', String(value || 'text'))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Upload'])" :label="$t('workflow.formDesigner.propsPanel.propAccept')">
            <Input
              :value="String(selectedFieldComponentProps.accept || '')"
              :placeholder="$t('workflow.formDesigner.propsPanel.propAcceptPlaceholder')"
              @update:value="(value) => updateFieldComponentProp('accept', String(value || ''))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Upload'])" :label="$t('workflow.formDesigner.propsPanel.propMaxCount')">
            <InputNumber
              :min="1"
              :value="toOptionalNumber(selectedFieldComponentProps.maxCount)"
              style="width: 100%;"
              @update:value="(value) => updateFieldComponentProp('maxCount', toOptionalNumber(value))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Upload'])" :label="$t('workflow.formDesigner.propsPanel.propUploadMultiple')">
            <Switch
              :checked="Boolean(selectedFieldComponentProps.multiple)"
              @update:checked="(value) => updateFieldComponentProp('multiple', Boolean(value))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Upload'])" :label="$t('workflow.formDesigner.propsPanel.propUploadMethod')">
            <Select
              :value="String(selectedFieldComponentProps.method || 'POST')"
              :options="uploadMethodOptions"
              @update:value="(value) => updateFieldComponentProp('method', String(value || 'POST'))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Upload'])" :label="$t('workflow.formDesigner.propsPanel.propUploadName')">
            <Input
              :value="String(selectedFieldComponentProps.name || 'file')"
              @update:value="(value) => updateFieldComponentProp('name', String(value || 'file'))"
            />
          </FormItem>

          <FormItem v-if="isSelectedFieldComponent(['Upload'])" :label="$t('workflow.formDesigner.propsPanel.propOpenFileDialogOnClick')">
            <Switch
              :checked="selectedFieldComponentProps.openFileDialogOnClick !== false"
              @update:checked="(value) => updateFieldComponentProp('openFileDialogOnClick', Boolean(value))"
            />
          </FormItem>
        </Form>

        <template v-if="supportsDataSource(selectedField)">
          <Divider class="my-3">{{ $t('workflow.formDesigner.propsPanel.dataSourceConfig') }}</Divider>

          <Form layout="vertical">
            <FormItem :label="$t('workflow.formDesigner.propsPanel.dataSourceType')">
              <Select
                :value="selectedFieldDataSource?.sourceType"
                :options="[
                  { label: $t('workflow.formDesigner.propsPanel.dataSourceTypeStatic'), value: 'static' },
                  { label: $t('workflow.formDesigner.propsPanel.dataSourceTypeApi'), value: 'api' },
                ]"
                @update:value="(value) => handleDataSourceTypeChange(String(value))"
              />
            </FormItem>

            <template v-if="selectedFieldDataSource?.sourceType === 'api'">
              <FormItem :label="$t('workflow.formDesigner.props.dataAdapter')">
                <Select
                  :value="selectedFieldDataSource.adapterKey"
                  :options="[
                    { label: $t('workflow.formDesigner.props.defaultAdapter'), value: '' },
                    ...dataSourceAdapterOptions,
                  ]"
                  show-search
                  @update:value="(value) => updateFieldDataSource({ adapterKey: String(value || '') })"
                />
              </FormItem>

              <FormItem :label="$t('workflow.formDesigner.propsPanel.apiMode')">
                <Select
                  :value="selectedFieldDataSource.apiMode ?? 'registry'"
                  :options="dataSourceModeOptions"
                  @update:value="(value) => handleDataSourceApiModeChange(value)"
                />
              </FormItem>

              <FormItem :label="$t('workflow.formDesigner.propsPanel.presetKey')">
                <Select
                  :value="selectedFieldDataSource.presetKey"
                  :options="dataSourcePresetOptions"
                  allow-clear
                  show-search
                  :placeholder="$t('workflow.formDesigner.propsPanel.presetKeyPlaceholder')"
                  @update:value="(value) => handleDataSourcePresetChange(value)"
                />
              </FormItem>

              <template v-if="(selectedFieldDataSource.apiMode ?? 'registry') === 'registry'">
                <FormItem :label="$t('workflow.formDesigner.propsPanel.apiKey')">
                  <Select
                    :value="selectedFieldDataSource.apiKey"
                    :options="FIELD_DATA_SOURCE_OPTIONS"
                    show-search
                    @update:value="(value) => updateFieldDataSource({ apiKey: String(value || ''), presetKey: '' })"
                  />
                </FormItem>
              </template>
              <template v-else>
                <FormItem :label="$t('workflow.formDesigner.propsPanel.apiUrl')">
                  <Input
                    :value="selectedFieldDataSource.apiUrl"
                    :placeholder="$t('workflow.formDesigner.propsPanel.apiUrlPlaceholder')"
                    @update:value="(value) => updateFieldDataSource({ apiUrl: String(value || ''), presetKey: '' })"
                  />
                </FormItem>
                <FormItem :label="$t('workflow.formDesigner.propsPanel.headersJson')">
                  <TextArea
                    v-model:value="headersJson"
                    :rows="4"
                    :placeholder="tBrace('workflow.formDesigner.propsPanel.headersJsonPlaceholder')"
                    @blur="applyDataSourceHeadersJson"
                  />
                </FormItem>
              </template>

              <div class="mb-2 flex gap-2">
                <Button :loading="testingDataSource" size="small" type="primary" @click="testLoadDataSource">
                  {{ $t('workflow.formDesigner.propsPanel.testLoad') }}
                </Button>
              </div>

              <FormItem :label="$t('workflow.formDesigner.propsPanel.requestMethod')">
                <Select
                  :value="selectedFieldDataSource.method"
                  :options="requestMethodOptions"
                  @update:value="(value) => updateFieldDataSource({ method: String(value || 'GET') as any })"
                />
              </FormItem>

              <FormItem :label="$t('workflow.formDesigner.propsPanel.requestMode')">
                <Select
                  :value="selectedFieldDataSource.requestMode"
                  :options="[
                    { label: $t('workflow.formDesigner.propsPanel.requestModeOnInit'), value: 'onInit' },
                    { label: $t('workflow.formDesigner.propsPanel.requestModeOnFocus'), value: 'onFocus' },
                    { label: $t('workflow.formDesigner.propsPanel.requestModeOnSearch'), value: 'onSearch' },
                    { label: $t('workflow.formDesigner.propsPanel.requestModeManual'), value: 'manual' },
                  ]"
                  @update:value="(value) => updateFieldDataSource({ requestMode: String(value || 'onInit') as any })"
                />
              </FormItem>

              <FormItem :label="$t('workflow.formDesigner.propsPanel.labelKey')">
                <Input
                  :value="selectedFieldDataSource.labelKey"
                  @update:value="(value) => updateFieldDataSource({ labelKey: String(value || '') })"
                />
              </FormItem>

              <FormItem :label="$t('workflow.formDesigner.propsPanel.valueKey')">
                <Input
                  :value="selectedFieldDataSource.valueKey"
                  @update:value="(value) => updateFieldDataSource({ valueKey: String(value || '') })"
                />
              </FormItem>

              <FormItem :label="$t('workflow.formDesigner.propsPanel.dataPath')">
                <Input
                  :value="selectedFieldDataSource.dataPath"
                  :placeholder="$t('workflow.formDesigner.propsPanel.dataPathPlaceholder')"
                  @update:value="(value) => updateFieldDataSource({ dataPath: String(value || '') })"
                />
              </FormItem>

              <FormItem
                v-if="['Cascader', 'TreeSelect'].includes(selectedField.component)"
                :label="$t('workflow.formDesigner.propsPanel.childrenKey')"
              >
                <Input
                  :value="selectedFieldDataSource.childrenKey"
                  @update:value="(value) => updateFieldDataSource({ childrenKey: String(value || '') })"
                />
              </FormItem>

              <FormItem
                v-if="['Cascader', 'TreeSelect'].includes(selectedField.component)"
                :label="$t('workflow.formDesigner.propsPanel.leafKey')"
              >
                <Input
                  :value="selectedFieldDataSource.leafKey"
                  @update:value="(value) => updateFieldDataSource({ leafKey: String(value || '') })"
                />
              </FormItem>

              <FormItem :label="$t('workflow.formDesigner.propsPanel.debounceMs')">
                <InputNumber
                  :min="0"
                  :value="Number(selectedFieldDataSource.debounceMs || 0)"
                  style="width: 100%;"
                  @update:value="(value) => updateFieldDataSource({ debounceMs: Number(value || 0) })"
                />
              </FormItem>

              <FormItem :label="$t('workflow.formDesigner.propsPanel.allowEmpty')">
                <Switch
                  :checked="Boolean(selectedFieldDataSource.allowEmpty)"
                  @update:checked="(value) => updateFieldDataSource({ allowEmpty: Boolean(value) })"
                />
              </FormItem>

              <FormItem :label="$t('workflow.formDesigner.propsPanel.enableCache')">
                <Switch
                  :checked="Boolean(selectedFieldDataSource.cache)"
                  @update:checked="(value) => updateFieldDataSource({ cache: Boolean(value) })"
                />
              </FormItem>

              <FormItem :label="$t('workflow.formDesigner.propsPanel.baseParamsJson')">
                <TextArea
                  v-model:value="baseParamsJson"
                  :rows="4"
                  :placeholder="tBrace('workflow.formDesigner.propsPanel.baseParamsJsonPlaceholder')"
                  @blur="applyDataSourceBaseParamsJson"
                />
              </FormItem>
            </template>
          </Form>
        </template>

        <template v-if="supportsDataSource(selectedField)">
          <Divider class="my-3">{{ $t('workflow.formDesigner.propsPanel.linkageConfig') }}</Divider>

          <Form layout="vertical">
            <FormItem :label="$t('workflow.formDesigner.propsPanel.dependsOn')">
              <Select
                :value="selectedFieldLinkage?.dependsOn || []"
                :options="availableDependsOnOptions"
                mode="multiple"
                :placeholder="$t('workflow.formDesigner.propsPanel.dependsOnPlaceholder')"
                @update:value="(value) => handleDependsOnChange((value as any[]) || [])"
              />
            </FormItem>

            <div class="mb-3 rounded-md border border-border p-2 text-xs">
              <div class="font-medium">{{ $t('workflow.formDesigner.propsPanel.linkageDependencyGraph') }}</div>
              <div class="mt-2 text-muted-foreground">
                <div>
                  {{ $t('workflow.formDesigner.propsPanel.linkageCurrentDependsOn') }}:
                  {{ selectedFieldDependsOnText }}
                </div>
                <div class="mt-1">
                  {{ $t('workflow.formDesigner.propsPanel.linkageDownstreamFields') }}:
                  {{ selectedFieldDownstreamText }}
                </div>
                <div v-if="hasSelectedFieldLinkageCycle" class="mt-1 text-destructive">
                  {{ $t('workflow.formDesigner.messages.linkageCycleDetected') }}
                </div>
              </div>
            </div>

            <FormItem :label="$t('workflow.formDesigner.propsPanel.clearWhenParentChange')">
              <Switch
                :checked="Boolean(selectedFieldLinkage?.clearWhenParentChange)"
                @update:checked="(value) => updateFieldLinkage({ clearWhenParentChange: Boolean(value) })"
              />
            </FormItem>

            <FormItem :label="$t('workflow.formDesigner.propsPanel.refetchWhenParentChange')">
              <Switch
                :checked="Boolean(selectedFieldLinkage?.refetchWhenParentChange)"
                @update:checked="(value) => updateFieldLinkage({ refetchWhenParentChange: Boolean(value) })"
              />
            </FormItem>

            <FormItem :label="$t('workflow.formDesigner.propsPanel.disableWhenMissingDeps')">
              <Switch
                :checked="Boolean(selectedFieldLinkage?.disableWhenMissingDeps)"
                @update:checked="(value) => updateFieldLinkage({ disableWhenMissingDeps: Boolean(value) })"
              />
            </FormItem>

            <FormItem :label="$t('workflow.formDesigner.propsPanel.paramMapJson')">
              <div class="mb-2 text-xs text-muted-foreground">
                {{ $t('workflow.formDesigner.propsPanel.paramMapVisualHint') }}
              </div>

              <div class="mb-2 space-y-2">
                <div
                  v-for="(row, index) in linkageParamMapRows"
                  :key="`param_map_${index}`"
                  class="rounded-md border border-border p-2"
                >
                  <div class="grid grid-cols-2 gap-2">
                    <Input
                      :placeholder="$t('workflow.formDesigner.propsPanel.paramMapKeyPlaceholder')"
                      :value="row.key"
                      @update:value="(value) => updateLinkageParamMapRow(index, { key: String(value || '') })"
                    />
                    <Input
                      :placeholder="$t('workflow.formDesigner.propsPanel.paramMapExpressionPlaceholder')"
                      :value="row.expression"
                      @update:value="(value) => updateLinkageParamMapRow(index, { expression: String(value || '') })"
                    />
                  </div>
                  <div class="mt-2 flex justify-end">
                    <Button danger size="small" @click="removeLinkageParamMapRow(index)">
                      {{ $t('workflow.formDesigner.propsPanel.removeParamMapItem') }}
                    </Button>
                  </div>
                </div>
                <Button block size="small" @click="addLinkageParamMapRow">
                  {{ $t('workflow.formDesigner.propsPanel.addParamMapItem') }}
                </Button>
              </div>

              <TextArea
                v-model:value="linkageParamMapJson"
                :rows="4"
                :placeholder="tBrace('workflow.formDesigner.propsPanel.paramMapJsonPlaceholder')"
                @blur="applyLinkageParamMapJson"
              />
            </FormItem>
          </Form>
        </template>

        <template v-if="shouldShowStaticOptions(selectedField)">
          <Divider class="my-3">{{ $t('workflow.formDesigner.propsPanel.optionsConfig') }}</Divider>
          <div class="space-y-2">
            <div
              v-for="(option, index) in selectedField.options || []"
              :key="`${selectedField.id}-option-${index}`"
              class="rounded-md border border-border p-2"
            >
              <div class="grid grid-cols-2 gap-2">
                <Input
                  :value="option.label"
                  :placeholder="$t('workflow.formDesigner.propsPanel.optionLabelPlaceholder')"
                  @update:value="(value) => updateOption(index, { label: value || '' })"
                />
                <Input
                  :value="String(option.value)"
                  :placeholder="$t('workflow.formDesigner.propsPanel.optionValuePlaceholder')"
                  @update:value="(value) => updateOption(index, { value: value || '' })"
                />
              </div>
              <div class="mt-2 flex justify-end">
                <Button size="small" danger @click="removeOption(index)">{{ $t('workflow.formDesigner.propsPanel.deleteOption') }}</Button>
              </div>
            </div>
            <Button block @click="addOption">{{ $t('workflow.formDesigner.propsPanel.addOption') }}</Button>
          </div>
        </template>

        <template v-if="availableFieldExtensions.length > 0">
          <Divider class="my-3">{{ $t('workflow.formDesigner.props.extensions') }}</Divider>
          <div class="mb-2 text-xs text-muted-foreground">
            {{ $t('workflow.formDesigner.props.extensionKeys') }}{{ availableFieldExtensions.map((item) => item.key).join(', ') }}
          </div>
          <TextArea
            v-model:value="extensionsJson"
            :rows="5"
            :placeholder="tBrace('workflow.formDesigner.props.extensionsPlaceholder')"
            @blur="applyExtensionsJson"
          />
        </template>

        <Divider class="my-3">{{ $t('workflow.formDesigner.propsPanel.componentPropsJson') }}</Divider>
        <TextArea
          v-model:value="componentPropsJson"
          :rows="8"
          :placeholder="tBrace('workflow.formDesigner.propsPanel.componentPropsJsonPlaceholder')"
          @blur="applyComponentPropsJson"
        />
      </template>

      <template v-else-if="selectedLayout">
        <Form layout="vertical">
          <FormItem :label="$t('workflow.formDesigner.propsPanel.layoutTitle')">
            <Input :value="selectedLayout.label" @update:value="(value) => updateLayout({ label: value })" />
          </FormItem>

          <FormItem v-if="selectedLayout.layoutType === 'Section'" :label="$t('workflow.formDesigner.propsPanel.sectionDescription')">
            <Input
              :value="selectedLayout.description"
              @update:value="(value) => updateLayout({ description: value || '' })"
            />
          </FormItem>

          <FormItem v-if="selectedLayout.layoutType !== 'Divider'" :label="$t('workflow.formDesigner.propsPanel.backgroundColor')">
            <Input
              :value="selectedLayout.backgroundColor"
              :placeholder="$t('workflow.formDesigner.propsPanel.backgroundColorPlaceholder')"
              @update:value="(value) => updateLayout({ backgroundColor: value || '' })"
            />
          </FormItem>

          <template v-if="selectedLayout.layoutType === 'Grid'">
            <FormItem :label="$t('workflow.formDesigner.propsPanel.columnCount')">
              <Select
                :value="selectedLayout.columns.length"
                :options="[
                  { label: $t('workflow.formDesigner.propsPanel.columnCount2'), value: 2 },
                  { label: $t('workflow.formDesigner.propsPanel.columnCount3'), value: 3 },
                ]"
                @update:value="(value) => updateLayout({ columnCount: Number(value) })"
              />
            </FormItem>
            <FormItem :label="$t('workflow.formDesigner.propsPanel.columnGap')">
              <InputNumber
                :value="selectedLayout.gap"
                :min="0"
                :max="48"
                style="width: 100%;"
                @update:value="(value) => updateLayout({ gap: Number(value || 0) })"
              />
            </FormItem>
          </template>

          <template v-if="selectedTableLayout">
            <FormItem :label="$t('workflow.formDesigner.propsPanel.tableSize')">
              <Select
                :value="selectedTableLayout.size"
                :options="tableSizeOptions"
                @update:value="(value) => updateLayout({ size: value as any })"
              />
            </FormItem>
            <FormItem :label="$t('workflow.formDesigner.propsPanel.tableBordered')">
              <Switch
                :checked="Boolean(selectedTableLayout.bordered)"
                @update:checked="(value) => updateLayout({ bordered: Boolean(value) })"
              />
            </FormItem>
          </template>

          <FormItem v-if="selectedLayout.layoutType === 'Divider'" :label="$t('workflow.formDesigner.propsPanel.dividerDashed')">
            <Switch
              :checked="Boolean(selectedLayout.dashed)"
              @update:checked="(value) => updateLayout({ dashed: Boolean(value) })"
            />
          </FormItem>
        </Form>

        <template v-if="selectedTableLayout">
          <Divider class="my-3">{{ $t('workflow.formDesigner.propsPanel.quickEdit') }}</Divider>
          <div class="mb-2 flex flex-wrap gap-2">
            <Button size="small" @click="addTableColumn">{{ $t('workflow.formDesigner.propsPanel.addColumn') }}</Button>
            <Button size="small" @click="addTableRow">{{ $t('workflow.formDesigner.propsPanel.addRow') }}</Button>
          </div>

          <div class="mb-2 space-y-2">
            <div
              v-for="(column, index) in selectedTableColumns"
              :key="column.id"
              class="rounded border border-border p-2"
            >
              <div class="mb-2 flex items-center gap-2">
                <span class="min-w-[70px] text-xs text-muted-foreground">{{ $t('workflow.formDesigner.propsPanel.columnPrefix') }}{{ index + 1 }}</span>
                <Input
                  :value="column.title"
                  size="small"
                  @update:value="(value) => updateTableColumnTitle(index, value || '')"
                />
                <Button size="small" danger @click="removeTableColumn(index)">{{ $t('workflow.formDesigner.propsPanel.removeColumn') }}</Button>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <Select
                  :value="column.component || 'Input'"
                  :options="tableColumnComponentOptions"
                  @update:value="(value) => handleTableColumnComponentChange(index, value)"
                />
                <Input
                  :placeholder="$t('workflow.formDesigner.propsPanel.tableColumnDataIndexPlaceholder')"
                  :value="column.dataIndex"
                  @update:value="(value) => updateTableColumnDataIndex(index, String(value || ''))"
                />
                <Input
                  :placeholder="$t('workflow.formDesigner.propsPanel.tableColumnPlaceholderPlaceholder')"
                  :value="column.placeholder || ''"
                  @update:value="(value) => updateTableColumn(index, { placeholder: String(value || '') })"
                />
                <InputNumber
                  :min="1"
                  :value="toOptionalPositiveNumber(column.width)"
                  style="width: 100%;"
                  :placeholder="$t('workflow.formDesigner.propsPanel.tableColumnWidthPlaceholder')"
                  @update:value="(value) => updateTableColumn(index, { width: toOptionalPositiveNumber(value) })"
                />
              </div>

              <div class="mt-2 flex items-center justify-between rounded border border-border px-2 py-1">
                <span class="text-xs text-muted-foreground">{{ $t('workflow.formDesigner.propsPanel.tableColumnRequired') }}</span>
                <Switch
                  :checked="Boolean(column.required)"
                  @update:checked="(value) => updateTableColumn(index, { required: Boolean(value) })"
                />
              </div>

              <div v-if="(column.component || 'Input') === 'Select'" class="mt-2 space-y-2">
                <div class="text-xs text-muted-foreground">{{ $t('workflow.formDesigner.propsPanel.tableColumnOptions') }}</div>
                <div
                  v-for="(option, optionIndex) in column.options || []"
                  :key="`${column.id}_option_${optionIndex}`"
                  class="grid grid-cols-[1fr_1fr_auto] gap-2"
                >
                  <Input
                    :placeholder="$t('workflow.formDesigner.propsPanel.optionLabelPlaceholder')"
                    :value="option.label"
                    @update:value="(value) => updateTableColumnOption(index, optionIndex, { label: String(value || '') })"
                  />
                  <Input
                    :placeholder="$t('workflow.formDesigner.propsPanel.optionValuePlaceholder')"
                    :value="String(option.value)"
                    @update:value="(value) => updateTableColumnOption(index, optionIndex, { value: String(value || '') })"
                  />
                  <Button danger size="small" @click="removeTableColumnOption(index, optionIndex)">
                    {{ $t('workflow.formDesigner.propsPanel.deleteOption') }}
                  </Button>
                </div>
                <Button block size="small" @click="addTableColumnOption(index)">
                  {{ $t('workflow.formDesigner.propsPanel.addOption') }}
                </Button>
              </div>

              <div class="mt-2">
                <div class="mb-1 text-xs text-muted-foreground">{{ $t('workflow.formDesigner.propsPanel.tableColumnValidationRules') }}</div>
                <TextArea
                  v-model:value="tableColumnValidationJsonMap[column.id]"
                  :rows="3"
                  :placeholder="tBrace('workflow.formDesigner.propsPanel.tableColumnValidationRulesPlaceholder')"
                  @blur="applyTableColumnValidationRulesJson(index)"
                />
              </div>
            </div>
          </div>

          <div class="mb-2 flex items-center justify-between rounded border border-border px-2 py-1 text-sm">
            <span>{{ $t('workflow.formDesigner.propsPanel.currentRowCount') }}{{ selectedTableRows.length }}</span>
            <Button size="small" :disabled="selectedTableRows.length === 0" danger @click="removeTableRow(selectedTableRows.length - 1)">
              {{ $t('workflow.formDesigner.propsPanel.removeLastRow') }}
            </Button>
          </div>

          <Divider class="my-3">{{ $t('workflow.formDesigner.propsPanel.tableColumnsJson') }}</Divider>
          <TextArea
            v-model:value="tableColumnsJson"
            :rows="8"
            :placeholder="tBrace('workflow.formDesigner.propsPanel.tableColumnsJsonPlaceholder')"
            @blur="applyTableColumnsJson"
          />

          <Divider class="my-3">{{ $t('workflow.formDesigner.propsPanel.tableRowsJson') }}</Divider>
          <TextArea
            v-model:value="tableRowsJson"
            :rows="8"
            :placeholder="tBrace('workflow.formDesigner.propsPanel.tableRowsJsonPlaceholder')"
            @blur="applyTableRowsJson"
          />
        </template>
      </template>

      <Divider class="my-3" />
      <div class="grid grid-cols-2 gap-2">
        <Button :disabled="!props.selected" @click="emit('clone')">{{ $t('workflow.formDesigner.propsPanel.clone') }}</Button>
        <Button
          danger
          :disabled="!props.selected"
          @click="props.selected && emit('remove', props.selected.id)"
        >
          {{ $t('workflow.formDesigner.propsPanel.delete') }}
        </Button>
      </div>
    </div>
  </div>
</template>
