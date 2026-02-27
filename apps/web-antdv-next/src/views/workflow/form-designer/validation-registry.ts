import type { FormFieldSchema } from '#/views/workflow/form-designer/types';

export interface FieldValidationContext {
  field: FormFieldSchema;
  model: Record<string, any>;
  value: any;
}

export type AsyncFieldValidator = (
  context: FieldValidationContext,
) => Promise<boolean | string>;

export type SyncFieldValidator = (
  context: FieldValidationContext,
) => boolean | string;

function toText(value: any) {
  return String(value ?? '').trim();
}

const syncValidators: Record<string, SyncFieldValidator> = {
  'custom.noWhitespace': ({ value }) => {
    if (toText(value).includes(' ')) {
      return '不能包含空格';
    }
    return true;
  },
  'custom.nonEmptyTrimmed': ({ value }) => {
    return toText(value).length > 0 || '去除空格后不能为空';
  },
  'custom.positiveNumber': ({ value }) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return '请输入有效数字';
    return num > 0 || '必须大于 0';
  },
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const asyncValidators: Record<string, AsyncFieldValidator> = {
  // Mock: pretend checking uniqueness from server.
  'mock.uniqueCode': async ({ value }) => {
    await sleep(120);
    const usedValues = new Set(['A001', 'A002', 'SYS_ADMIN']);
    const text = toText(value).toUpperCase();
    if (!text) return true;
    return !usedValues.has(text) || '编码已存在';
  },
  // Mock: username uniqueness check.
  'mock.uniqueUsername': async ({ value }) => {
    await sleep(120);
    const usedValues = new Set(['admin', 'test', 'operator']);
    const text = toText(value).toLowerCase();
    if (!text) return true;
    return !usedValues.has(text) || '用户名已存在';
  },
};

function normalizeResult(result: boolean | string, fallbackMessage: string) {
  if (result === true) return undefined;
  if (typeof result === 'string' && result.trim()) return result;
  return fallbackMessage;
}

export function runSyncValidator(
  key: string,
  context: FieldValidationContext,
  fallbackMessage: string,
) {
  const validator = syncValidators[String(key || '').trim()];
  if (!validator) {
    return `未找到同步校验器: ${key}`;
  }
  return normalizeResult(validator(context), fallbackMessage);
}

export async function runAsyncValidator(
  key: string,
  context: FieldValidationContext,
  fallbackMessage: string,
) {
  const validator = asyncValidators[String(key || '').trim()];
  if (!validator) {
    return `未找到异步校验器: ${key}`;
  }
  const result = await validator(context);
  return normalizeResult(result, fallbackMessage);
}

export function getSyncValidatorOptions() {
  return Object.keys(syncValidators).map((key) => ({
    label: key,
    value: key,
  }));
}

export function getAsyncValidatorOptions() {
  return Object.keys(asyncValidators).map((key) => ({
    label: key,
    value: key,
  }));
}

