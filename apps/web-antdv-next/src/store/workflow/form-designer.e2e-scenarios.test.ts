import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildFieldDataSourceParams,
  hasMissingFieldDependencies,
} from '#/views/workflow/form-designer/field-data-source';

import useWorkflowFormDesignerStore from './form-designer';

vi.mock('#/views/workflow/form-designer/plugin-registry', () => ({
  getDataSourceAdapter: () => undefined,
}));

vi.mock('#/views/workflow/form-designer/data-source-registry', () => ({
  requestFieldDataSourceByConfig: async () => ({}),
}));

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    get length() {
      return map.size;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(String(key), String(value));
    },
  };
}

describe('workflow form designer e2e-like scenarios', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    if (typeof globalThis.localStorage === 'undefined') {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: createMemoryStorage(),
      });
    }
    globalThis.localStorage.clear();
  });

  it('scenario: import -> linkage params -> save -> replay', () => {
    const store = useWorkflowFormDesignerStore();

    const payload = {
      schema: {
        dataSourcePresets: [],
        description: 'scenario-flow',
        formColon: true,
        formDisabled: false,
        formLabelAlign: 'right',
        formLabelWidth: 120,
        formLabelWrap: false,
        formLayout: 'vertical',
        formRequiredMark: true,
        formShowSerialNumber: false,
        formSize: 'middle',
        formValidateTrigger: 'change',
        formVariant: 'outlined',
        nodes: [
          {
            component: 'Select',
            defaultValue: undefined,
            fieldName: 'departmentId',
            id: 'field_department',
            kind: 'field',
            label: 'Department',
            required: true,
          },
          {
            component: 'Select',
            dataSource: {
              apiKey: 'workflowUsersByDept',
              method: 'GET',
              requestMode: 'onSearch',
              sourceType: 'api',
            },
            defaultValue: undefined,
            fieldName: 'userId',
            id: 'field_user',
            kind: 'field',
            label: 'User',
            linkage: {
              dependsOn: ['departmentId'],
              disableWhenMissingDeps: true,
              paramMap: {
                deptId: '$field_departmentId',
                keyword: '$keyword',
              },
            },
          },
          {
            bordered: true,
            columns: [
              {
                component: 'Input',
                dataIndex: 'itemName',
                id: 'col_item_name',
                required: true,
                title: 'Item Name',
              },
              {
                component: 'Switch',
                dataIndex: 'enabled',
                id: 'col_enabled',
                title: 'Enabled',
              },
            ],
            id: 'layout_table_1',
            kind: 'layout',
            label: 'Items',
            layoutType: 'Table',
            rows: [
              {
                itemName: 'Demo Item',
              },
            ],
            size: 'middle',
          },
        ],
        title: 'Scenario Form',
      },
      values: {},
    };

    expect(store.importFromJson(JSON.stringify(payload)).ok).toBe(true);
    expect(store.schema.title).toBe('Scenario Form');
    expect(store.schema.nodes.length).toBe(3);

    const userField = store.allFields.find((field) => field.fieldName === 'userId');
    expect(userField).toBeTruthy();
    expect(hasMissingFieldDependencies(userField!, { departmentId: undefined })).toBe(true);
    expect(hasMissingFieldDependencies(userField!, { departmentId: 'd_1' })).toBe(false);

    const params = buildFieldDataSourceParams(
      userField!,
      { departmentId: 'd_1' },
      'alice',
    );
    expect(params).toMatchObject({
      departmentId: 'd_1',
      deptId: 'd_1',
      keyword: 'alice',
    });

    store.setFormValues({
      departmentId: 'd_1',
      userId: 'u_100',
    });
    store.updateLayout('layout_table_1', {
      rows: [
        {
          enabled: true,
          itemName: 'Demo Item',
        },
        {
          enabled: false,
          itemName: 'Another Item',
        },
      ],
    });

    const record = store.saveCurrentAsRecord();
    expect(record.id).toBeTruthy();

    store.reset();
    expect(store.schema.nodes.length).toBe(0);
    expect(store.loadSavedRecord(record.id)).toBe(true);

    expect(store.formValues.departmentId).toBe('d_1');
    expect(store.formValues.userId).toBe('u_100');

    const replayedTable = store.schema.nodes.find((node: any) => node.id === 'layout_table_1') as any;
    expect(replayedTable).toBeTruthy();
    expect(replayedTable.rows).toHaveLength(2);
    expect(replayedTable.rows[0]).toMatchObject({
      enabled: true,
      itemName: 'Demo Item',
    });
    expect(replayedTable.rows[1]).toMatchObject({
      enabled: false,
      itemName: 'Another Item',
    });
  });
});
