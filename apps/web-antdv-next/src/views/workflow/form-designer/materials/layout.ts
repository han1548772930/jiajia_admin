import { $t } from '#/locales';

export const LAYOUT_MATERIALS = [
  {
    category: 'layout',
    description: $t('workflow.formDesigner.materialDefinitions.layoutSection.description'),
    key: 'layout-section',
    kind: 'layout',
    label: $t('workflow.formDesigner.materialDefinitions.layoutSection.label'),
    layoutType: 'Section',
  },
  {
    category: 'layout',
    description: $t('workflow.formDesigner.materialDefinitions.layoutGrid2.description'),
    key: 'layout-grid-2',
    kind: 'layout',
    label: $t('workflow.formDesigner.materialDefinitions.layoutGrid2.label'),
    layoutType: 'Grid',
  },
  {
    category: 'layout',
    description: $t('workflow.formDesigner.materialDefinitions.layoutGrid3.description'),
    key: 'layout-grid-3',
    kind: 'layout',
    label: $t('workflow.formDesigner.materialDefinitions.layoutGrid3.label'),
    layoutType: 'Grid',
  },
  {
    category: 'layout',
    description: $t('workflow.formDesigner.materialDefinitions.layoutDivider.description'),
    key: 'layout-divider',
    kind: 'layout',
    label: $t('workflow.formDesigner.materialDefinitions.layoutDivider.label'),
    layoutType: 'Divider',
  },
  {
    category: 'layout',
    description: $t('workflow.formDesigner.materialDefinitions.layoutTable.description'),
    key: 'layout-table',
    kind: 'layout',
    label: $t('workflow.formDesigner.materialDefinitions.layoutTable.label'),
    layoutType: 'Table',
  },
] as const;
