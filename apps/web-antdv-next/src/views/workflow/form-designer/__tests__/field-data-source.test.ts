import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { FormFieldSchema } from '../types';

const { recordWorkflowDiagnosticMock } = vi.hoisted(() => ({
  recordWorkflowDiagnosticMock: vi.fn(),
}));

const { getDataSourceAdapterMock } = vi.hoisted(() => ({
  getDataSourceAdapterMock: vi.fn(),
}));

const { requestFieldDataSourceByConfigMock } = vi.hoisted(() => ({
  requestFieldDataSourceByConfigMock: vi.fn(),
}));

vi.mock('#/views/workflow/observability', () => ({
  recordWorkflowDiagnostic: recordWorkflowDiagnosticMock,
}));

vi.mock('#/views/workflow/form-designer/plugin-registry', () => ({
  getDataSourceAdapter: getDataSourceAdapterMock,
}));

vi.mock('#/views/workflow/form-designer/data-source-registry', () => ({
  requestFieldDataSourceByConfig: requestFieldDataSourceByConfigMock,
}));

vi.mock('#/locales', () => ({
  $t: (key: string, args?: any[]) =>
    `${key}${Array.isArray(args) && args.length > 0 ? `:${args.join(',')}` : ''}`,
}));

import { loadFieldDataSourceOptions } from '../field-data-source';

function createField(patch?: Partial<FormFieldSchema>): FormFieldSchema {
  return {
    component: 'Select',
    fieldName: 'departmentId',
    id: 'field_department',
    kind: 'field',
    label: 'Department',
    ...patch,
  };
}

describe('form-designer/field-data-source diagnostics', () => {
  beforeEach(() => {
    recordWorkflowDiagnosticMock.mockReset();
    getDataSourceAdapterMock.mockReset();
    requestFieldDataSourceByConfigMock.mockReset();
  });

  it('records diagnostics when adapter is missing', async () => {
    const field = createField({
      dataSource: {
        adapterKey: 'mock.adapter',
        apiKey: 'workflowUsersByDept',
        method: 'GET',
        sourceType: 'api',
      },
    });

    await expect(loadFieldDataSourceOptions({
      field,
      formModel: {},
    })).rejects.toThrow();

    expect(recordWorkflowDiagnosticMock).toHaveBeenCalledTimes(1);
    expect(recordWorkflowDiagnosticMock).toHaveBeenCalledWith(expect.objectContaining({
      category: 'data-source',
      level: 'error',
      message: 'Failed to load field data source options',
    }));
  });

  it('records diagnostics when request fails', async () => {
    requestFieldDataSourceByConfigMock.mockRejectedValueOnce(new Error('network fail'));
    const field = createField({
      dataSource: {
        apiKey: 'workflowUsersByDept',
        method: 'GET',
        requestMode: 'onSearch',
        sourceType: 'api',
      },
      linkage: {
        dependsOn: ['departmentId'],
        paramMap: {
          deptId: '$field_departmentId',
          keyword: '$keyword',
        },
      },
    });

    await expect(loadFieldDataSourceOptions({
      field,
      formModel: { departmentId: 'd_1' },
      keyword: 'alice',
    })).rejects.toThrow('network fail');

    expect(recordWorkflowDiagnosticMock).toHaveBeenCalledTimes(1);
    expect(recordWorkflowDiagnosticMock).toHaveBeenCalledWith(expect.objectContaining({
      category: 'data-source',
      level: 'error',
    }));
  });
});
