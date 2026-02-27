import { $t } from '#/locales';

export const DATETIME_FIELD_MATERIALS = [
  {
    category: 'datetime',
    description: $t('workflow.formDesigner.materialDefinitions.fieldDate.description'),
    key: 'field-date',
    kind: 'field',
    label: $t('workflow.formDesigner.materialDefinitions.fieldDate.label'),
  },
  {
    category: 'datetime',
    description: $t('workflow.formDesigner.materialDefinitions.fieldTime.description'),
    key: 'field-time',
    kind: 'field',
    label: $t('workflow.formDesigner.materialDefinitions.fieldTime.label'),
  },
] as const;
