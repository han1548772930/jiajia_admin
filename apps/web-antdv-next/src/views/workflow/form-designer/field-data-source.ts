import type {
  FieldDataSourceConfig,
  FieldDataSourcePreset,
  FieldLinkageConfig,
  FieldOption,
  FormFieldSchema,
} from '#/views/workflow/form-designer/types';

import {
  createDefaultFieldDataSourceConfig,
  createDefaultFieldLinkageConfig,
  supportsDataSourceFieldComponent,
} from '#/views/workflow/form-designer/types';
import { recordWorkflowDiagnostic } from '#/views/workflow/observability';
import { getDataSourceAdapter } from '#/views/workflow/form-designer/plugin-registry';
import { requestFieldDataSourceByConfig } from '#/views/workflow/form-designer/data-source-registry';
import { $t } from '#/locales';

export interface LoadFieldDataSourceOptionsInput {
  dataSourcePresets?: FieldDataSourcePreset[];
  field: FormFieldSchema;
  formModel: Record<string, any>;
  keyword?: string;
}

export interface LoadFieldDataSourceOptionsResult {
  options: any[];
  rawData: any;
  requestParams: Record<string, any>;
}

function isEmptyValue(value: any) {
  if (Array.isArray(value)) return value.length === 0;
  return value === undefined || value === null || value === '';
}

function getValueByPath(source: any, path?: string) {
  if (!path) return source;

  return path
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .reduce((acc, key) => (acc == null ? undefined : acc[key]), source);
}

function ensureArray(data: any) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') return [data];
  return [] as any[];
}

function hasDataSourceRequestTarget(dataSource: FieldDataSourceConfig) {
  if (dataSource.apiMode === 'custom') {
    return Boolean(String(dataSource.apiUrl || '').trim());
  }
  return Boolean(String(dataSource.apiKey || '').trim());
}

function getDataSourcePresetByKey(
  key: string,
  dataSourcePresets?: FieldDataSourcePreset[],
) {
  const targetKey = String(key || '').trim();
  if (!targetKey) return undefined;
  return (dataSourcePresets ?? []).find((item) => item.key === targetKey);
}

function resolveParamValue(
  expression: any,
  formModel: Record<string, any>,
  keyword?: string,
) {
  if (typeof expression !== 'string') return expression;

  if (expression === '$keyword') {
    return keyword ?? '';
  }

  if (expression.startsWith('$field_')) {
    const fieldName = expression.slice('$field_'.length);
    return formModel[fieldName];
  }

  if (expression.startsWith('$field.')) {
    const fieldName = expression.slice('$field.'.length);
    return formModel[fieldName];
  }

  return expression;
}

export function getFieldDataSourceConfig(field: FormFieldSchema): FieldDataSourceConfig {
  return {
    ...createDefaultFieldDataSourceConfig(field.component),
    ...(field.dataSource ?? {}),
  };
}

export function resolveFieldDataSourceConfig(
  field: FormFieldSchema,
  dataSourcePresets?: FieldDataSourcePreset[],
): FieldDataSourceConfig {
  const dataSource = getFieldDataSourceConfig(field);
  const presetKey = String(dataSource.presetKey || '').trim();
  if (!presetKey) return dataSource;

  const preset = getDataSourcePresetByKey(presetKey, dataSourcePresets);
  if (!preset) return dataSource;

  return {
    ...dataSource,
    apiKey: '',
    apiMode: 'custom',
    apiUrl: preset.url,
    headers: preset.headers ?? {},
    method: preset.method ?? dataSource.method,
  };
}

export function getFieldLinkageConfig(field: FormFieldSchema): FieldLinkageConfig {
  return {
    ...createDefaultFieldLinkageConfig(),
    ...(field.linkage ?? {}),
  };
}

export function hasMissingFieldDependencies(
  field: FormFieldSchema,
  formModel: Record<string, any>,
) {
  if (!supportsDataSourceFieldComponent(field.component)) return false;

  const linkage = getFieldLinkageConfig(field);
  const dependsOn = linkage.dependsOn ?? [];
  if (dependsOn.length === 0) return false;

  return dependsOn.some((fieldName) => isEmptyValue(formModel[fieldName]));
}

export function buildFieldDataSourceParams(
  field: FormFieldSchema,
  formModel: Record<string, any>,
  keyword?: string,
) {
  const dataSource = getFieldDataSourceConfig(field);
  const linkage = getFieldLinkageConfig(field);

  const params: Record<string, any> = {
    ...(dataSource.baseParams ?? {}),
  };

  const paramMap = linkage.paramMap ?? {};
  Object.entries(paramMap).forEach(([paramKey, expression]) => {
    params[paramKey] = resolveParamValue(expression, formModel, keyword);
  });

  (linkage.dependsOn ?? []).forEach((depFieldName) => {
    if (Object.hasOwn(params, depFieldName)) return;
    params[depFieldName] = formModel[depFieldName];
  });

  if (!Object.hasOwn(params, 'keyword') && !isEmptyValue(keyword)) {
    params.keyword = keyword;
  }

  return params;
}

function mapPlainOption(
  row: any,
  dataSource: FieldDataSourceConfig,
): FieldOption {
  const labelKey = dataSource.labelKey || 'label';
  const valueKey = dataSource.valueKey || 'value';

  const rawLabel = row?.[labelKey] ?? row?.label ?? row?.name ?? row?.title ?? '';
  const rawValue = row?.[valueKey] ?? row?.value ?? row?.id ?? row?.code ?? rawLabel;

  return {
    label: String(rawLabel ?? ''),
    value: rawValue,
  };
}

function mapTreeOption(
  row: any,
  dataSource: FieldDataSourceConfig,
  component: FormFieldSchema['component'],
): any {
  const labelKey = dataSource.labelKey || 'label';
  const valueKey = dataSource.valueKey || 'value';
  const childrenKey = dataSource.childrenKey || 'children';
  const leafKey = dataSource.leafKey || 'isLeaf';

  const children = ensureArray(row?.[childrenKey]).map((child) => {
    return mapTreeOption(child, dataSource, component);
  });

  const label = String(
    row?.[labelKey] ?? row?.label ?? row?.title ?? row?.name ?? '',
  );
  const value = row?.[valueKey] ?? row?.value ?? row?.id ?? row?.code ?? label;
  const leafValue = row?.[leafKey];
  const isLeaf = leafValue == null ? children.length === 0 : Boolean(leafValue);

  if (component === 'TreeSelect') {
    return {
      children,
      isLeaf,
      label,
      title: label,
      value,
    };
  }

  return {
    children,
    isLeaf,
    label,
    value,
  };
}

function mapDataSourceRows(
  field: FormFieldSchema,
  rows: any[],
  dataSource: FieldDataSourceConfig,
) {
  if (field.component === 'TreeSelect' || field.component === 'Cascader') {
    return rows.map((row) => mapTreeOption(row, dataSource, field.component));
  }

  return rows.map((row) => mapPlainOption(row, dataSource));
}

function recordDataSourceFailure(params: {
  adapterKey: string;
  dataSource: FieldDataSourceConfig;
  error: any;
  field: FormFieldSchema;
  keyword?: string;
  requestParams: Record<string, any>;
}) {
  const {
    adapterKey,
    dataSource,
    error,
    field,
    keyword,
    requestParams,
  } = params;

  recordWorkflowDiagnostic({
    category: 'data-source',
    context: {
      adapterKey,
      apiKey: dataSource.apiKey,
      apiMode: dataSource.apiMode,
      apiUrl: dataSource.apiUrl,
      component: field.component,
      error,
      fieldId: field.id,
      fieldName: field.fieldName,
      keyword: keyword ?? '',
      method: dataSource.method,
      requestMode: dataSource.requestMode,
      requestParams,
      sourceType: dataSource.sourceType,
    },
    level: 'error',
    message: 'Failed to load field data source options',
  });
}

export async function loadFieldDataSourceOptions(
  input: LoadFieldDataSourceOptionsInput,
): Promise<LoadFieldDataSourceOptionsResult> {
  const { dataSourcePresets, field, formModel, keyword } = input;

  if (!supportsDataSourceFieldComponent(field.component)) {
    return {
      options: [],
      rawData: [],
      requestParams: {},
    };
  }

  const dataSource = resolveFieldDataSourceConfig(field, dataSourcePresets);
  const requestParams = buildFieldDataSourceParams(field, formModel, keyword);
  const adapterKey = String(dataSource.adapterKey || '').trim();
  try {
    if (adapterKey) {
      const adapter = getDataSourceAdapter(adapterKey);
      if (!adapter) {
        throw new Error($t('workflow.formDesigner.messages.dataSourceAdapterNotFound', [adapterKey]));
      }

      const result = await adapter.load({
        dataSource,
        dataSourcePresets,
        field,
        formModel,
        keyword,
        requestParams,
      });
      return {
        options: result.options ?? [],
        rawData: result.rawData ?? result.options ?? [],
        requestParams,
      };
    }

    if (dataSource.sourceType !== 'api' || !hasDataSourceRequestTarget(dataSource)) {
      return {
        options: [],
        rawData: [],
        requestParams: {},
      };
    }

    const rawData = await requestFieldDataSourceByConfig(dataSource, {
      field,
      keyword,
      method: dataSource.method,
      params: requestParams,
    });

    const dataRows = ensureArray(getValueByPath(rawData, dataSource.dataPath));
    const options = mapDataSourceRows(field, dataRows, dataSource);

    if (!dataSource.allowEmpty && options.length === 0) {
      throw new Error($t('workflow.formDesigner.messages.dataSourceEmpty'));
    }

    return {
      options,
      rawData,
      requestParams,
    };
  } catch (error) {
    recordDataSourceFailure({
      adapterKey,
      dataSource,
      error,
      field,
      keyword,
      requestParams,
    });
    throw error;
  }
}
