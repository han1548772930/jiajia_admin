import { describe, expect, it } from 'vitest';

import type { FormFieldSchema } from '../types';

import {
  runAsyncValidator,
  runSyncValidator,
} from '../validation-registry';

function createField(): FormFieldSchema {
  return {
    component: 'Input',
    fieldName: 'code',
    id: 'field_1',
    kind: 'field',
    label: 'Code',
  };
}

describe('form-designer/validation-registry', () => {
  it('runs sync validators', () => {
    const field = createField();
    const err = runSyncValidator(
      'custom.noWhitespace',
      {
        field,
        model: {},
        value: 'a b',
      },
      'invalid',
    );
    expect(err).toBeTruthy();

    const pass = runSyncValidator(
      'custom.noWhitespace',
      {
        field,
        model: {},
        value: 'abc',
      },
      'invalid',
    );
    expect(pass).toBeUndefined();
  });

  it('runs async validators', async () => {
    const field = createField();
    const err = await runAsyncValidator(
      'mock.uniqueCode',
      {
        field,
        model: {},
        value: 'A001',
      },
      'invalid',
    );
    expect(err).toBeTruthy();

    const pass = await runAsyncValidator(
      'mock.uniqueCode',
      {
        field,
        model: {},
        value: 'NEW_CODE',
      },
      'invalid',
    );
    expect(pass).toBeUndefined();
  });
});

