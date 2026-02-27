import { beforeEach, describe, expect, it, vi } from 'vitest';

const { recordWorkflowDiagnosticMock } = vi.hoisted(() => ({
  recordWorkflowDiagnosticMock: vi.fn(),
}));

vi.mock('#/views/workflow/observability', () => ({
  recordWorkflowDiagnostic: recordWorkflowDiagnosticMock,
}));

import type { FormFieldSchema } from '../types';

import {
  resolveFieldRequired,
  resolveFieldVisible,
} from '../expression';

function createField(patch?: Partial<FormFieldSchema>): FormFieldSchema {
  return {
    component: 'Input',
    fieldName: 'title',
    id: 'field_title',
    kind: 'field',
    label: 'Title',
    ...patch,
  };
}

describe('form-designer/expression', () => {
  beforeEach(() => {
    recordWorkflowDiagnosticMock.mockReset();
  });

  it('resolves visible expression by model value', () => {
    const field = createField({
      visibleExpression: '$field_showTitle === true',
    });

    expect(resolveFieldVisible(field, { showTitle: true })).toBe(true);
    expect(resolveFieldVisible(field, { showTitle: false })).toBe(false);
  });

  it('resolves required expression with required fallback', () => {
    const field = createField({
      required: true,
      requiredExpression: '$field_needTitle === true',
    });

    expect(resolveFieldRequired(field, { needTitle: true })).toBe(true);
    expect(resolveFieldRequired(field, { needTitle: false })).toBe(false);
  });

  it('falls back safely when expression is invalid', () => {
    const visibleField = createField({
      visibleExpression: '(() =>',
    });
    const requiredField = createField({
      required: false,
      requiredExpression: '(() =>',
    });

    expect(resolveFieldVisible(visibleField, {})).toBe(true);
    expect(resolveFieldRequired(requiredField, {})).toBe(false);
    expect(recordWorkflowDiagnosticMock).toHaveBeenCalledTimes(2);
  });
});
