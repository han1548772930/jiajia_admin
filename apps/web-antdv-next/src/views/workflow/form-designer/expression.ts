import type { FormFieldSchema } from '#/views/workflow/form-designer/types';

import { recordWorkflowDiagnostic } from '#/views/workflow/observability';

const FIELD_REF_TOKEN = /\$field(?:_|\.)([A-Za-z0-9_]+)/g;

function normalizeExpression(raw: string) {
  return raw.replace(FIELD_REF_TOKEN, (_, fieldName: string) => `__get("${fieldName}")`);
}

function evaluateBooleanExpression(
  expression: string | undefined,
  field: FormFieldSchema,
  formModel: Record<string, any>,
  fallback: boolean,
) {
  const text = String(expression ?? '').trim();
  if (!text) return fallback;

  try {
    const parsed = normalizeExpression(text);
    // eslint-disable-next-line no-new-func
    const evaluator = new Function(
      '__get',
      'field',
      'model',
      `return Boolean(${parsed});`,
    ) as (
      getValue: (name: string) => any,
      currentField: FormFieldSchema,
      currentModel: Record<string, any>,
    ) => boolean;

    return Boolean(evaluator((name) => formModel?.[name], field, formModel));
  } catch (error) {
    recordWorkflowDiagnostic({
      category: 'expression',
      context: {
        error,
        expression: text,
        fallback,
        fieldId: field.id,
        fieldName: field.fieldName,
      },
      level: 'error',
      message: 'Failed to evaluate field expression',
    });
    return fallback;
  }
}

export function resolveFieldVisible(
  field: FormFieldSchema,
  formModel: Record<string, any>,
) {
  return evaluateBooleanExpression(
    field.visibleExpression,
    field,
    formModel,
    true,
  );
}

export function resolveFieldRequired(
  field: FormFieldSchema,
  formModel: Record<string, any>,
) {
  const defaultRequired = Boolean(field.required);
  return evaluateBooleanExpression(
    field.requiredExpression,
    field,
    formModel,
    defaultRequired,
  );
}
