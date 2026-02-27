import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import useWorkflowFormDesignerStore from './form-designer';

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

describe('workflow form designer store', () => {
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

  it('supports minimal flow: add component -> save record -> load record', () => {
    const store = useWorkflowFormDesignerStore();

    store.addMaterial('field-input');
    expect(store.schema.nodes.length).toBe(1);

    const createdField = store.schema.nodes[0] as any;
    store.updateField(createdField.id, {
      required: true,
    });
    store.setFormValues({
      [createdField.fieldName]: 'test value',
    });

    const savedRecord = store.saveCurrentAsRecord();
    expect(savedRecord.id).toBeTruthy();
    expect(savedRecord.schema.nodes.length).toBe(1);

    store.reset();
    expect(store.schema.nodes.length).toBe(0);

    const loaded = store.loadSavedRecord(savedRecord.id);
    expect(loaded).toBe(true);
    expect(store.schema.nodes.length).toBe(1);
    expect(store.formValues[createdField.fieldName]).toBe('test value');
  });

  it('imports schema from json payload', () => {
    const store = useWorkflowFormDesignerStore();
    const payload = {
      schema: {
        dataSourcePresets: [],
        description: 'import-test',
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
            component: 'Input',
            fieldName: 'title',
            id: 'import_field_1',
            kind: 'field',
            label: '标题',
            requiredExpression: '$field_needTitle === true',
            visibleExpression: '$field_showTitle === true',
          },
        ],
        title: 'imported',
      },
      values: {
        needTitle: true,
        showTitle: true,
        title: 'hello',
      },
    };

    const result = store.importFromJson(JSON.stringify(payload));
    expect(result.ok).toBe(true);
    expect(store.schema.title).toBe('imported');
    expect(store.schema.nodes.length).toBe(1);
    expect((store.schema.nodes[0] as any).visibleExpression).toBe('$field_showTitle === true');
    expect(store.formValues.title).toBe('hello');
  });

  it('supports nested layout material insertion and recursive value cleanup', () => {
    const store = useWorkflowFormDesignerStore();

    store.addMaterial('layout-section');
    const rootSection = store.schema.nodes[0] as any;
    expect(rootSection.layoutType).toBe('Section');

    store.addMaterial('layout-grid-2', {
      targetLayoutId: rootSection.id,
    });
    const nestedGrid = rootSection.children[0];
    expect(nestedGrid.layoutType).toBe('Grid');
    expect(nestedGrid.columns.length).toBe(2);

    const secondColumnId = nestedGrid.columns[1].id;
    store.addMaterial('field-input', {
      targetColumnId: secondColumnId,
      targetLayoutId: nestedGrid.id,
    });

    const nestedField = nestedGrid.columns[1].children[0];
    expect(nestedField.kind).toBe('field');
    expect(store.allFields.length).toBe(1);

    store.setFormValues({
      [nestedField.fieldName]: 'nested-value',
    });
    expect(store.formValues[nestedField.fieldName]).toBe('nested-value');

    store.removeById(rootSection.id);
    expect(store.schema.nodes.length).toBe(0);
    expect(store.formValues[nestedField.fieldName]).toBeUndefined();
    expect(store.allFields.length).toBe(0);
  });

  it('keeps backward compatibility for legacy schema.fields payload', () => {
    const store = useWorkflowFormDesignerStore();
    const legacyPayload = {
      schema: {
        description: 'legacy',
        fields: [
          {
            component: 'Input',
            fieldName: 'legacyTitle',
            id: 'legacy_1',
            label: 'Legacy Title',
            required: true,
          },
        ],
        title: 'legacy-form',
      },
      values: {
        legacyTitle: 'legacy value',
      },
    };

    const result = store.importFromJson(JSON.stringify(legacyPayload));
    expect(result.ok).toBe(true);
    expect(store.schema.title).toBe('legacy-form');
    expect(store.schema.nodes.length).toBe(1);
    expect((store.schema.nodes[0] as any).kind).toBe('field');
    expect(store.formValues.legacyTitle).toBe('legacy value');
  });

  it('supports copy, paste, and clone with unique field names and copied values', () => {
    const store = useWorkflowFormDesignerStore();

    store.addMaterial('field-input');
    const firstField = store.schema.nodes[0] as any;
    store.setFormValues({
      [firstField.fieldName]: 'hello',
    });

    expect(store.copySelected()).toBe(true);
    expect(store.pasteClipboard()).toBe(true);
    expect(store.schema.nodes.length).toBe(2);

    const secondField = store.schema.nodes[1] as any;
    expect(secondField.fieldName).not.toBe(firstField.fieldName);
    expect(store.formValues[secondField.fieldName]).toBe('hello');

    expect(store.cloneSelected()).toBe(true);
    expect(store.schema.nodes.length).toBe(3);

    const thirdField = store.schema.nodes[2] as any;
    expect(new Set([firstField.fieldName, secondField.fieldName, thirdField.fieldName]).size).toBe(3);
    expect(store.formValues[thirdField.fieldName]).toBe('hello');
  });

  it('rewrites field references when cloning nested nodes', () => {
    const store = useWorkflowFormDesignerStore();
    const payload = {
      schema: {
        dataSourcePresets: [],
        description: '',
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
            children: [
              {
                component: 'Input',
                fieldName: 'sourceA',
                id: 'field_a',
                kind: 'field',
                label: 'A',
              },
              {
                component: 'Input',
                fieldName: 'sourceB',
                id: 'field_b',
                kind: 'field',
                label: 'B',
                linkage: {
                  dependsOn: ['sourceA'],
                  paramMap: {
                    keyword: '$field_sourceA',
                  },
                },
                visibleExpression: '$field_sourceA === "ok"',
              },
            ],
            id: 'section_1',
            kind: 'layout',
            label: 'Section',
            layoutType: 'Section',
          },
        ],
        title: 'clone-map',
      },
      values: {
        sourceA: 'v1',
        sourceB: 'v2',
      },
    };

    expect(store.importFromJson(JSON.stringify(payload)).ok).toBe(true);
    store.selectById('section_1');
    expect(store.cloneSelected()).toBe(true);
    expect(store.schema.nodes.length).toBe(2);

    const clonedSection = store.schema.nodes[1] as any;
    const clonedA = clonedSection.children[0];
    const clonedB = clonedSection.children[1];

    expect(clonedA.fieldName).not.toBe('sourceA');
    expect(clonedB.fieldName).not.toBe('sourceB');
    expect(clonedB.visibleExpression).toContain(`$field_${clonedA.fieldName}`);
    expect(clonedB.linkage.dependsOn).toEqual([clonedA.fieldName]);
    expect(clonedB.linkage.paramMap.keyword).toContain(`$field_${clonedA.fieldName}`);
    expect(store.formValues[clonedA.fieldName]).toBe('v1');
    expect(store.formValues[clonedB.fieldName]).toBe('v2');
  });

  it('normalizes table columns and rows when importing legacy table payload', () => {
    const store = useWorkflowFormDesignerStore();
    const payload = {
      schema: {
        dataSourcePresets: [],
        description: '',
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
            bordered: false,
            columns: [
              {
                dataIndex: 'name',
                id: 'col_name',
                title: 'Name',
              },
              {
                component: 'Switch',
                dataIndex: 'enabled',
                id: 'col_enabled',
                required: true,
                title: 'Enabled',
              },
            ],
            id: 'table_1',
            kind: 'layout',
            label: 'Table 1',
            layoutType: 'Table',
            rows: [
              {
                name: 'row_1',
              },
              {},
            ],
            size: 'middle',
          },
        ],
        title: 'table-import',
      },
      values: {},
    };

    expect(store.importFromJson(JSON.stringify(payload)).ok).toBe(true);
    const tableLayout = store.schema.nodes[0] as any;

    expect(tableLayout.layoutType).toBe('Table');
    expect(tableLayout.columns).toHaveLength(2);
    expect(tableLayout.columns[0].component).toBe('Input');
    expect(tableLayout.columns[0].required).toBe(false);
    expect(tableLayout.columns[0].placeholder).toBe('');
    expect(tableLayout.columns[1].component).toBe('Switch');
    expect(tableLayout.columns[1].required).toBe(true);
    expect(tableLayout.rows[0].name).toBe('row_1');
    expect(tableLayout.rows[0].enabled).toBe(false);
    expect(tableLayout.rows[1].name).toBe('');
    expect(tableLayout.rows[1].enabled).toBe(false);
  });

  it('keeps table advanced column config after save and reload', () => {
    const store = useWorkflowFormDesignerStore();
    store.addMaterial('layout-table');

    const tableLayout = store.schema.nodes[0] as any;
    expect(tableLayout.layoutType).toBe('Table');

    store.updateLayout(tableLayout.id, {
      columns: [
        {
          component: 'InputNumber',
          dataIndex: 'qty',
          id: 'col_qty',
          placeholder: 'Quantity',
          required: true,
          title: 'Qty',
          validationRules: [{ type: 'minLength', value: 1 }],
          width: 140,
        },
        {
          component: 'Select',
          dataIndex: 'status',
          id: 'col_status',
          options: [
            { label: 'Open', value: 'open' },
            { label: 'Closed', value: 'closed' },
          ],
          title: 'Status',
          validationRules: [{ type: 'pattern', value: '^(open|closed)$' }],
          width: 180,
        },
        {
          component: 'Switch',
          dataIndex: 'approved',
          id: 'col_approved',
          title: 'Approved',
        },
      ],
      rows: [
        {
          qty: 3,
          status: 'open',
        },
        {
          status: 'closed',
        },
      ],
    });

    const savedRecord = store.saveCurrentAsRecord();
    expect(savedRecord.id).toBeTruthy();

    store.reset();
    expect(store.loadSavedRecord(savedRecord.id)).toBe(true);

    const restored = store.schema.nodes[0] as any;
    expect(restored.layoutType).toBe('Table');
    expect(restored.columns).toHaveLength(3);
    expect(restored.columns[0].component).toBe('InputNumber');
    expect(restored.columns[0].required).toBe(true);
    expect(restored.columns[0].width).toBe(140);
    expect(restored.columns[1].component).toBe('Select');
    expect(restored.columns[1].options).toEqual([
      { label: 'Open', value: 'open' },
      { label: 'Closed', value: 'closed' },
    ]);
    expect(restored.columns[2].component).toBe('Switch');
    expect(restored.rows[0]).toMatchObject({ approved: false, qty: 3, status: 'open' });
    expect(restored.rows[1]).toMatchObject({ approved: false, status: 'closed' });
    expect(restored.rows[1].qty).toBeUndefined();
  });
});
