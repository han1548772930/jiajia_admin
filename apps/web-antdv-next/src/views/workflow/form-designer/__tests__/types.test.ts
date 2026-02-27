import { describe, expect, it } from 'vitest';

import type { FormFieldSchema } from '../types';

import {
  COMPONENT_MANIFEST,
  FORM_MATERIALS,
  createEmptyDesignerSchema,
  getFieldPatchByMaterialKey,
  getMaterialByKey,
  toVbenFormSchema,
} from '../types';

describe('form-designer/types', () => {
  it('keeps component manifest and materials consistent', () => {
    expect(FORM_MATERIALS.length).toBeGreaterThan(0);

    for (const component of Object.keys(COMPONENT_MANIFEST)) {
      const manifest = COMPONENT_MANIFEST[component as keyof typeof COMPONENT_MANIFEST];
      expect(manifest).toBeDefined();
      if (!manifest) continue;
      expect(getMaterialByKey(manifest.defaultMaterialKey)).toBeDefined();
    }
  });

  it('maps schema fields to vben schema snapshot', () => {
    const materialKeys = ['field-input', 'field-select', 'field-upload-image'];
    const fields = materialKeys.map((materialKey, index) => {
      const fieldName = `field_${index + 1}`;
      const patch = getFieldPatchByMaterialKey(materialKey, fieldName);
      return {
        ...patch,
        fieldName,
        id: `id_${index + 1}`,
        kind: 'field',
      } as FormFieldSchema;
    });

    const schema = createEmptyDesignerSchema();
    schema.nodes = fields;

    expect(toVbenFormSchema(fields)).toMatchSnapshot();
  });
});
