import { performance } from 'node:perf_hooks';

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

function createBaseSchema(nodes: any[]) {
  return {
    schema: {
      dataSourcePresets: [],
      description: 'performance-baseline',
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
      nodes,
      title: 'performance-form',
    },
    values: {},
  };
}

function createLargeFieldNodes(count: number) {
  return Array.from({ length: count }).map((_, index) => ({
    component: 'Input',
    fieldName: `f_${index + 1}`,
    id: `field_${index + 1}`,
    kind: 'field',
    label: `Field ${index + 1}`,
    required: index % 2 === 0,
  }));
}

function createDeepNestedSection(depth: number) {
  let current: any = {
    component: 'Input',
    fieldName: `deep_leaf_${depth}`,
    id: `deep_field_${depth}`,
    kind: 'field',
    label: `Deep Field ${depth}`,
  };

  for (let level = depth; level >= 1; level -= 1) {
    current = {
      children: [
        {
          component: 'Input',
          fieldName: `deep_field_${level}`,
          id: `deep_field_${level}`,
          kind: 'field',
          label: `Deep Field ${level}`,
        },
        current,
      ],
      id: `deep_section_${level}`,
      kind: 'layout',
      label: `Section ${level}`,
      layoutType: 'Section',
    };
  }

  return current;
}

function createLargeOptionsNode(optionCount: number) {
  return {
    component: 'Select',
    componentProps: {},
    dataSource: {
      sourceType: 'static',
    },
    fieldName: 'large_select',
    id: 'field_large_select',
    kind: 'field',
    label: 'Large Select',
    options: Array.from({ length: optionCount }).map((_, index) => ({
      label: `Option ${index + 1}`,
      value: `v_${index + 1}`,
    })),
  };
}

describe('workflow form designer performance baseline', () => {
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

  it('baseline: large field count import and field indexing', () => {
    const store = useWorkflowFormDesignerStore();
    const payload = createBaseSchema(createLargeFieldNodes(300));

    const startMs = performance.now();
    expect(store.importFromJson(JSON.stringify(payload)).ok).toBe(true);
    const fields = store.allFields;
    const endMs = performance.now();

    expect(fields.length).toBe(300);
    expect(endMs - startMs).toBeLessThan(4000);
  });

  it('baseline: deep nested layouts recursive operations', () => {
    const store = useWorkflowFormDesignerStore();
    const root = createDeepNestedSection(12);
    const payload = createBaseSchema([root]);

    expect(store.importFromJson(JSON.stringify(payload)).ok).toBe(true);
    store.setFormValues({
      deep_field_1: 'v1',
      deep_field_6: 'v6',
      deep_leaf_12: 'leaf',
    });

    const startMs = performance.now();
    store.removeById('deep_section_1');
    const endMs = performance.now();

    expect(store.schema.nodes.length).toBe(0);
    expect(store.allFields.length).toBe(0);
    expect(endMs - startMs).toBeLessThan(3000);
  });

  it('baseline: large option set schema mapping', () => {
    const store = useWorkflowFormDesignerStore();
    const payload = createBaseSchema([createLargeOptionsNode(3000)]);

    const startMs = performance.now();
    expect(store.importFromJson(JSON.stringify(payload)).ok).toBe(true);
    const vben = store.vbenSchema;
    const endMs = performance.now();

    expect(vben.length).toBe(1);
    expect(vben[0]?.component).toBe('Select');
    expect((vben[0]?.componentProps as any)?.options?.length).toBe(3000);
    expect(endMs - startMs).toBeLessThan(4000);
  });
});
