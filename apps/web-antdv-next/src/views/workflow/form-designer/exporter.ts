import type {
  FormDesignerNode,
  FormDesignerSchema,
  FormFieldSchema,
} from '#/views/workflow/form-designer/types';
import {
  resolveFieldDescription,
  resolveFieldLabel,
} from '#/views/workflow/form-designer/i18n';

function walkNodes(nodes: FormDesignerNode[], callback: (field: FormFieldSchema) => void) {
  nodes.forEach((node) => {
    if (node.kind === 'field') {
      callback(node);
      return;
    }
    if (node.layoutType === 'Section') {
      walkNodes(node.children, callback);
      return;
    }
    if (node.layoutType === 'Grid') {
      node.columns.forEach((column) => walkNodes(column.children, callback));
    }
  });
}

function mapFieldJsonSchemaType(field: FormFieldSchema): {
  format?: string;
  type: 'array' | 'boolean' | 'number' | 'object' | 'string';
} {
  if (['Checkbox', 'Radio', 'Switch'].includes(field.component)) {
    return { type: 'boolean' };
  }
  if (['InputNumber', 'Rate', 'Slider'].includes(field.component)) {
    return { type: 'number' };
  }
  if (['CheckboxGroup', 'Upload'].includes(field.component)) {
    return { type: 'array' };
  }
  if (field.component === 'DatePicker') {
    return { format: 'date', type: 'string' };
  }
  if (field.component === 'TimePicker') {
    return { format: 'time', type: 'string' };
  }
  return { type: 'string' };
}

export function exportInternalSchema(schema: FormDesignerSchema) {
  return {
    exportedAt: new Date().toISOString(),
    schema: JSON.parse(JSON.stringify(schema)),
    schemaVersion: schema.schemaVersion,
  };
}

export function exportRuntimeConfig(schema: FormDesignerSchema) {
  return {
    fields: schema.nodes,
    form: {
      description: schema.description,
      formColon: schema.formColon,
      formDisabled: schema.formDisabled,
      formLabelAlign: schema.formLabelAlign,
      formLabelWidth: schema.formLabelWidth,
      formLayout: schema.formLayout,
      formSize: schema.formSize,
      formValidateTrigger: schema.formValidateTrigger,
      formVariant: schema.formVariant,
      title: schema.title,
    },
    schemaVersion: schema.schemaVersion,
  };
}

export function exportValueJsonSchema(schema: FormDesignerSchema) {
  const properties: Record<string, any> = {};
  const required: string[] = [];

  walkNodes(schema.nodes, (field) => {
    const jsonType = mapFieldJsonSchemaType(field);
    properties[field.fieldName] = {
      default: field.defaultValue,
      description: resolveFieldDescription(field),
      title: resolveFieldLabel(field),
      ...jsonType,
    };
    if (field.required) {
      required.push(field.fieldName);
    }
  });

  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    properties,
    required,
    title: schema.title || 'Form Values',
    type: 'object',
  };
}
