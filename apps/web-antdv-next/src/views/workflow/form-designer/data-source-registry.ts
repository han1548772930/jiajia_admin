import type {
  FieldDataSourceConfig,
  FormFieldSchema,
} from '#/views/workflow/form-designer/types';

import {
  getAllCategoryApi,
  getAllDepartmentsApi,
  getAllTemplateApi,
  getUsersByDeptApi,
} from '#/api/workflow';
import { requestClient } from '#/api/request';
import { $t } from '#/locales';

export interface FieldDataSourceRequestContext {
  field: FormFieldSchema;
  keyword?: string;
  method?: 'GET' | 'POST';
  params: Record<string, any>;
}

export type FieldDataSourceRequestHandler = (
  context: FieldDataSourceRequestContext,
) => Promise<any>;

export interface FieldDataSourceRegistryItem {
  description: string;
  key: string;
  label: string;
  request: FieldDataSourceRequestHandler;
}

const MOCK_CITY_OPTIONS = [
  { code: 'beijing', name: '北京' },
  { code: 'shanghai', name: '上海' },
  { code: 'guangzhou', name: '广州' },
  { code: 'shenzhen', name: '深圳' },
  { code: 'hangzhou', name: '杭州' },
  { code: 'chengdu', name: '成都' },
];

const registry: Record<string, FieldDataSourceRegistryItem> = {
  'mock.cities': {
    description: $t('workflow.formDesigner.dataSourceRegistry.mockCities.description'),
    key: 'mock.cities',
    label: $t('workflow.formDesigner.dataSourceRegistry.mockCities.label'),
    request: async ({ keyword }) => {
      const text = String(keyword ?? '').trim().toLowerCase();
      if (!text) return MOCK_CITY_OPTIONS;
      return MOCK_CITY_OPTIONS.filter((item) => {
        return item.name.includes(text) || item.code.includes(text);
      });
    },
  },
  'workflow.departments': {
    description: $t('workflow.formDesigner.dataSourceRegistry.workflowDepartments.description'),
    key: 'workflow.departments',
    label: $t('workflow.formDesigner.dataSourceRegistry.workflowDepartments.label'),
    request: async () => {
      const response = await getAllDepartmentsApi();
      if (!response.Success) {
        throw new Error(response.Message || $t('workflow.formDesigner.messages.loadDepartmentsFailed'));
      }
      return response.Data ?? [];
    },
  },
  'workflow.templates': {
    description: $t('workflow.formDesigner.dataSourceRegistry.workflowTemplates.description'),
    key: 'workflow.templates',
    label: $t('workflow.formDesigner.dataSourceRegistry.workflowTemplates.label'),
    request: async ({ keyword, params }) => {
      const response = await getAllTemplateApi();
      if (!response.Success) {
        throw new Error(response.Message || $t('workflow.formDesigner.messages.loadTemplatesFailed'));
      }

      let rows = response.Data ?? [];
      const categoryId = Number(params.categoryId ?? 0);
      if (Number.isFinite(categoryId) && categoryId > 0) {
        rows = rows.filter((item) => Number(item.CategoryId) === categoryId);
      }

      const keywordText = String(keyword ?? params.keyword ?? '').trim();
      if (keywordText) {
        rows = rows.filter((item) => String(item.Name ?? '').includes(keywordText));
      }

      return rows;
    },
  },
  'workflow.templateCategories': {
    description: $t('workflow.formDesigner.dataSourceRegistry.workflowTemplateCategories.description'),
    key: 'workflow.templateCategories',
    label: $t('workflow.formDesigner.dataSourceRegistry.workflowTemplateCategories.label'),
    request: async () => {
      const response = await getAllCategoryApi();
      if (!response.Success) {
        throw new Error(response.Message || $t('workflow.formDesigner.messages.loadTemplateCategoriesFailed'));
      }
      return response.Data ?? [];
    },
  },
  'workflow.usersByDept': {
    description: $t('workflow.formDesigner.dataSourceRegistry.workflowUsersByDept.description'),
    key: 'workflow.usersByDept',
    label: $t('workflow.formDesigner.dataSourceRegistry.workflowUsersByDept.label'),
    request: async ({ params }) => {
      const deptId = Number(params.deptId ?? params.departmentId ?? params.parentId ?? 0);
      if (!Number.isFinite(deptId) || deptId <= 0) {
        return [];
      }

      const response = await getUsersByDeptApi(deptId);
      if (!response.Success) {
        throw new Error(response.Message || $t('workflow.formDesigner.messages.loadUsersByDeptFailed'));
      }
      return response.Data ?? [];
    },
  },
};

export const FIELD_DATA_SOURCE_OPTIONS = Object.values(registry)
  .map((item) => ({
    label: item.label,
    value: item.key,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

export function getFieldDataSourceRegistryItem(apiKey: string) {
  return registry[apiKey];
}

export function getAllFieldDataSourceRegistryItems() {
  return Object.values(registry);
}

function normalizeHeaders(raw: Record<string, any> | undefined) {
  if (!raw || typeof raw !== 'object') return {};
  return Object.fromEntries(
    Object.entries(raw)
      .filter(([key]) => String(key || '').trim().length > 0)
      .map(([key, value]) => [String(key), value == null ? '' : String(value)]),
  );
}

function isCustomApiMode(dataSource: FieldDataSourceConfig) {
  return dataSource.apiMode === 'custom';
}

export async function requestFieldDataSource(
  apiKey: string,
  context: FieldDataSourceRequestContext,
) {
  const item = getFieldDataSourceRegistryItem(apiKey);
  if (!item) {
    throw new Error($t('workflow.formDesigner.messages.dataSourceApiKeyNotFound', [apiKey]));
  }
  return item.request(context);
}

export async function requestFieldDataSourceByConfig(
  dataSource: FieldDataSourceConfig,
  context: FieldDataSourceRequestContext,
) {
  if (isCustomApiMode(dataSource)) {
    const url = String(dataSource.apiUrl || '').trim();
    if (!url) {
      throw new Error($t('workflow.formDesigner.messages.customApiUrlMissing'));
    }

    const method = String(dataSource.method || context.method || 'GET')
      .toUpperCase() as 'GET' | 'POST';
    const headers = normalizeHeaders(dataSource.headers);

    if (method === 'POST') {
      return requestClient.post<any>(url, context.params, {
        headers,
        responseReturn: 'body',
      });
    }

    return requestClient.get<any>(url, {
      headers,
      params: context.params,
      responseReturn: 'body',
    });
  }

  const apiKey = String(dataSource.apiKey || '').trim();
  if (!apiKey) {
    throw new Error($t('workflow.formDesigner.messages.apiKeyMissing'));
  }

  return requestFieldDataSource(apiKey, context);
}

