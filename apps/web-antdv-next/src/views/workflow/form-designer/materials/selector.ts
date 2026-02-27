import { $t } from '#/locales';

export const SELECTOR_FIELD_MATERIALS = [
  {
    category: 'selector',
    description: $t('workflow.formDesigner.materialDefinitions.fieldSegmented.description'),
    key: 'field-segmented',
    kind: 'field',
    label: $t('workflow.formDesigner.materialDefinitions.fieldSegmented.label'),
  },
  {
    category: 'selector',
    description: $t('workflow.formDesigner.materialDefinitions.fieldSelect.description'),
    key: 'field-select',
    kind: 'field',
    label: $t('workflow.formDesigner.materialDefinitions.fieldSelect.label'),
  },
  {
    category: 'selector',
    description: $t('workflow.formDesigner.materialDefinitions.fieldAutoComplete.description'),
    key: 'field-auto-complete',
    kind: 'field',
    label: $t('workflow.formDesigner.materialDefinitions.fieldAutoComplete.label'),
  },
  {
    category: 'selector',
    description: $t('workflow.formDesigner.materialDefinitions.fieldCascader.description'),
    key: 'field-cascader',
    kind: 'field',
    label: $t('workflow.formDesigner.materialDefinitions.fieldCascader.label'),
  },
  {
    category: 'selector',
    description: $t('workflow.formDesigner.materialDefinitions.fieldTreeSelect.description'),
    key: 'field-tree-select',
    kind: 'field',
    label: $t('workflow.formDesigner.materialDefinitions.fieldTreeSelect.label'),
  },
  {
    category: 'selector',
    description: $t('workflow.formDesigner.materialDefinitions.fieldRadio.description'),
    key: 'field-radio',
    kind: 'field',
    label: $t('workflow.formDesigner.materialDefinitions.fieldRadio.label'),
  },
  {
    category: 'selector',
    description: $t('workflow.formDesigner.materialDefinitions.fieldRadioGroup.description'),
    key: 'field-radio-group',
    kind: 'field',
    label: $t('workflow.formDesigner.materialDefinitions.fieldRadioGroup.label'),
  },
  {
    category: 'selector',
    description: $t('workflow.formDesigner.materialDefinitions.fieldCheckbox.description'),
    key: 'field-checkbox',
    kind: 'field',
    label: $t('workflow.formDesigner.materialDefinitions.fieldCheckbox.label'),
  },
  {
    category: 'selector',
    description: $t('workflow.formDesigner.materialDefinitions.fieldCheckboxGroup.description'),
    key: 'field-checkbox-group',
    kind: 'field',
    label: $t('workflow.formDesigner.materialDefinitions.fieldCheckboxGroup.label'),
  },
  {
    category: 'selector',
    description: $t('workflow.formDesigner.materialDefinitions.fieldSwitch.description'),
    key: 'field-switch',
    kind: 'field',
    label: $t('workflow.formDesigner.materialDefinitions.fieldSwitch.label'),
  },
] as const;
