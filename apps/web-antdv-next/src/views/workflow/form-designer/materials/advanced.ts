import { $t } from '#/locales';

export const ADVANCED_FIELD_MATERIALS = [
  {
    category: 'advanced',
    description: $t('workflow.formDesigner.materialDefinitions.fieldRate.description'),
    key: 'field-rate',
    kind: 'field',
    label: $t('workflow.formDesigner.materialDefinitions.fieldRate.label'),
  },
  {
    category: 'advanced',
    description: $t('workflow.formDesigner.materialDefinitions.fieldColorPicker.description'),
    key: 'field-color-picker',
    kind: 'field',
    label: $t('workflow.formDesigner.materialDefinitions.fieldColorPicker.label'),
  },
  {
    category: 'advanced',
    description: $t('workflow.formDesigner.materialDefinitions.fieldMentions.description'),
    key: 'field-mentions',
    kind: 'field',
    label: $t('workflow.formDesigner.materialDefinitions.fieldMentions.label'),
  },
  {
    category: 'advanced',
    description: $t('workflow.formDesigner.materialDefinitions.fieldUploadImage.description'),
    key: 'field-upload-image',
    kind: 'field',
    label: $t('workflow.formDesigner.materialDefinitions.fieldUploadImage.label'),
  },
  {
    category: 'advanced',
    description: $t('workflow.formDesigner.materialDefinitions.fieldUploadFile.description'),
    key: 'field-upload-file',
    kind: 'field',
    label: $t('workflow.formDesigner.materialDefinitions.fieldUploadFile.label'),
  },
] as const;
