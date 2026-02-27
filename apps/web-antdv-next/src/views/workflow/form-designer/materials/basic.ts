import { $t } from '#/locales';

export const BASIC_FIELD_MATERIALS = [
  {
    category: 'basic',
    description: $t('workflow.formDesigner.materialDefinitions.fieldInput.description'),
    key: 'field-input',
    kind: 'field',
    label: $t('workflow.formDesigner.materialDefinitions.fieldInput.label'),
  },
  {
    category: 'basic',
    description: $t('workflow.formDesigner.materialDefinitions.fieldTextarea.description'),
    key: 'field-textarea',
    kind: 'field',
    label: $t('workflow.formDesigner.materialDefinitions.fieldTextarea.label'),
  },
  {
    category: 'basic',
    description: $t('workflow.formDesigner.materialDefinitions.fieldNumber.description'),
    key: 'field-number',
    kind: 'field',
    label: $t('workflow.formDesigner.materialDefinitions.fieldNumber.label'),
  },
  {
    category: 'basic',
    description: $t('workflow.formDesigner.materialDefinitions.fieldSlider.description'),
    key: 'field-slider',
    kind: 'field',
    label: $t('workflow.formDesigner.materialDefinitions.fieldSlider.label'),
  },
] as const;
