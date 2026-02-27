import type { FormFieldSchema } from '#/views/workflow/form-designer/types';
import { preferences } from '@vben/preferences';

function getCurrentLocale(locale?: string) {
  const fromArg = String(locale || '').trim();
  if (fromArg) return fromArg;

  const fromPreference = String(preferences?.app?.locale || '').trim();
  if (fromPreference) return fromPreference;

  const fromNavigator = String(
    typeof navigator !== 'undefined' ? navigator.language : '',
  ).trim();
  if (fromNavigator) return fromNavigator;

  return 'en-US';
}

export function normalizeLocaleCandidates(locale?: string) {
  const current = getCurrentLocale(locale);
  if (!current) return ['en-US', 'en'];

  const list = new Set<string>([current]);
  const short = current.split('-')[0]?.trim();
  if (short) list.add(short);
  list.add('en-US');
  list.add('en');
  return Array.from(list);
}

export function resolveI18nText(
  map: Record<string, string> | undefined,
  fallback: string,
  locale?: string,
) {
  if (!map || typeof map !== 'object') return fallback;
  const locales = normalizeLocaleCandidates(locale);
  for (const key of locales) {
    const value = map[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return fallback;
}

export function resolveFieldLabel(
  field: FormFieldSchema,
  locale?: string,
) {
  return resolveI18nText(field.labelI18n, field.label || field.fieldName, locale);
}

export function resolveFieldDescription(
  field: FormFieldSchema,
  locale?: string,
) {
  return resolveI18nText(field.descriptionI18n, field.description || '', locale);
}
