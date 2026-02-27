import type { VbenFormSchema } from '#/adapter/form';
import { ALL_FORM_MATERIALS } from '#/views/workflow/form-designer/materials';
import { $t } from '#/locales';

export type BuiltInFieldComponent =
  | 'AutoComplete'
  | 'Cascader'
  | 'Checkbox'
  | 'CheckboxGroup'
  | 'ColorPicker'
  | 'DatePicker'
  | 'Input'
  | 'InputNumber'
  | 'Mentions'
  | 'Radio'
  | 'RadioGroup'
  | 'Rate'
  | 'Segmented'
  | 'Select'
  | 'Slider'
  | 'Switch'
  | 'Textarea'
  | 'TimePicker'
  | 'TreeSelect'
  | 'Upload';
export type FieldComponent = BuiltInFieldComponent | (string & {});

export type DataSourceMethod = 'GET' | 'POST';
export type DataSourceRequestMode = 'manual' | 'onFocus' | 'onInit' | 'onSearch';
export type DataSourceType = 'api' | 'static';
export type DataSourceApiMode = 'custom' | 'registry';

export type LayoutType = 'Divider' | 'Grid' | 'Section' | 'Table';
export type FormLayoutMode = 'horizontal' | 'inline' | 'vertical';
export type FormValidateTriggerMode = 'blur' | 'change' | 'change,blur' | 'none' | 'submit';
export type FormVariantMode = 'borderless' | 'filled' | 'outlined' | 'underlined';

export type MaterialCategory = 'advanced' | 'basic' | 'datetime' | 'layout' | 'selector';
export type MaterialKind = 'field' | 'layout';

export interface FieldOption {
  children?: FieldOption[];
  disabled?: boolean;
  isLeaf?: boolean;
  label: string;
  title?: string;
  value: number | string;
}

export interface FieldDataSourceConfig {
  adapterKey?: string;
  allowEmpty?: boolean;
  apiMode?: DataSourceApiMode;
  apiKey?: string;
  presetKey?: string;
  apiUrl?: string;
  baseParams?: Record<string, any>;
  cache?: boolean;
  childrenKey?: string;
  dataPath?: string;
  debounceMs?: number;
  headers?: Record<string, any>;
  labelKey?: string;
  leafKey?: string;
  method?: DataSourceMethod;
  requestMode?: DataSourceRequestMode;
  sourceType?: DataSourceType;
  valueKey?: string;
}

export interface FieldDataSourcePreset {
  description?: string;
  headers?: Record<string, any>;
  key: string;
  label: string;
  method?: DataSourceMethod;
  url: string;
}

export interface FieldLinkageConfig {
  clearWhenParentChange?: boolean;
  dependsOn?: string[];
  disableWhenMissingDeps?: boolean;
  paramMap?: Record<string, any>;
  refetchWhenParentChange?: boolean;
}

export interface UploadValueItem {
  name: string;
  status?: 'done' | 'error' | 'uploading' | 'removed';
  thumbUrl?: string;
  uid: string;
  url?: string;
}

export type FieldValidationRuleType = 'async' | 'custom' | 'maxLength' | 'minLength' | 'pattern';

export interface FieldValidationRule {
  message?: string;
  trigger?: FormValidateTriggerMode;
  type: FieldValidationRuleType;
  value: number | string;
}

export interface FieldComponentPropsMap {
  AutoComplete: Record<string, any>;
  Cascader: Record<string, any>;
  Checkbox: Record<string, any>;
  CheckboxGroup: Record<string, any>;
  ColorPicker: Record<string, any>;
  DatePicker: Record<string, any>;
  Input: Record<string, any>;
  InputNumber: Record<string, any>;
  Mentions: Record<string, any>;
  Radio: Record<string, any>;
  RadioGroup: Record<string, any>;
  Rate: Record<string, any>;
  Segmented: Record<string, any>;
  Select: Record<string, any>;
  Slider: Record<string, any>;
  Switch: Record<string, any>;
  Textarea: Record<string, any>;
  TimePicker: Record<string, any>;
  TreeSelect: Record<string, any>;
  Upload: Record<string, any>;
}

export type FormFieldComponentProps =
  | FieldComponentPropsMap[BuiltInFieldComponent]
  | Record<string, any>;

interface BaseNode {
  id: string;
  label: string;
}

export interface FormFieldSchema extends BaseNode {
  component: FieldComponent;
  componentProps?: FormFieldComponentProps;
  dataSource?: FieldDataSourceConfig;
  defaultValue?: any;
  descriptionI18n?: Record<string, string>;
  description?: string;
  fieldName: string;
  kind: 'field';
  labelI18n?: Record<string, string>;
  linkage?: FieldLinkageConfig;
  options?: FieldOption[];
  placeholder?: string;
  required?: boolean;
  requiredExpression?: string;
  validateTrigger?: FormValidateTriggerMode;
  validationRules?: FieldValidationRule[];
  visibleExpression?: string;
}

export interface SectionLayoutSchema extends BaseNode {
  backgroundColor?: string;
  children: FormDesignerNode[];
  description?: string;
  kind: 'layout';
  layoutType: 'Section';
}

export interface GridLayoutColumn {
  children: FormDesignerNode[];
  id: string;
  span: number;
  title: string;
}

export interface GridLayoutSchema extends BaseNode {
  backgroundColor?: string;
  columns: GridLayoutColumn[];
  gap: number;
  kind: 'layout';
  layoutType: 'Grid';
}

export interface DividerLayoutSchema extends BaseNode {
  dashed?: boolean;
  kind: 'layout';
  layoutType: 'Divider';
}

export type TableColumnComponent = 'Input' | 'InputNumber' | 'Select' | 'Switch';

export interface TableLayoutColumn {
  component?: TableColumnComponent;
  dataIndex: string;
  defaultValue?: any;
  id: string;
  options?: FieldOption[];
  placeholder?: string;
  required?: boolean;
  title: string;
  validationRules?: FieldValidationRule[];
  width?: number;
}

export interface TableLayoutSchema extends BaseNode {
  backgroundColor?: string;
  bordered: boolean;
  columns: TableLayoutColumn[];
  kind: 'layout';
  layoutType: 'Table';
  rows: Array<Record<string, any>>;
  size: 'large' | 'middle' | 'small';
}

export type FormLayoutSchema = DividerLayoutSchema | GridLayoutSchema | SectionLayoutSchema | TableLayoutSchema;
export type FormDesignerNode = FormFieldSchema | FormLayoutSchema;
export type FormDesignerSelectable = FormDesignerNode | FormFieldSchema;

export interface LayoutUpdatePatch {
  backgroundColor?: string;
  bordered?: boolean;
  columnCount?: number;
  columns?: TableLayoutColumn[];
  dashed?: boolean;
  description?: string;
  gap?: number;
  label?: string;
  rows?: Array<Record<string, any>>;
  size?: 'large' | 'middle' | 'small';
}

export interface FormDesignerSchema {
  dataSourcePresets: FieldDataSourcePreset[];
  description: string;
  formColon: boolean;
  formDisabled: boolean;
  formLabelAlign: 'left' | 'right';
  formLabelWrap: boolean;
  formLabelWidth: number;
  formLayout: FormLayoutMode;
  formRequiredMark: boolean;
  formShowSerialNumber: boolean;
  formSize: 'large' | 'middle' | 'small';
  formValidateTrigger: FormValidateTriggerMode;
  formVariant: FormVariantMode;
  nodes: FormDesignerNode[];
  schemaVersion: number;
  title: string;
}

export type FormDesignerGlobalPatch = Partial<
  Pick<
    FormDesignerSchema,
    | 'formColon'
    | 'formDisabled'
    | 'formLabelAlign'
    | 'formLabelWrap'
    | 'formLabelWidth'
    | 'formLayout'
    | 'formRequiredMark'
    | 'formShowSerialNumber'
    | 'formSize'
    | 'formValidateTrigger'
    | 'formVariant'
  >
>;

export interface FormDesignerData {
  schema: FormDesignerSchema;
  values: Record<string, any>;
}

export interface SavedFormRecord {
  description: string;
  id: string;
  savedAt: string;
  schema: FormDesignerSchema;
  title: string;
  updatedAt: string;
  values: Record<string, any>;
}

export interface MaterialDefinition {
  category: MaterialCategory;
  description: string;
  key: string;
  kind: MaterialKind;
  label: string;
  layoutType?: LayoutType;
}

export interface ComponentManifestItem {
  component: FieldComponent;
  defaultMaterialKey: string;
  label: string;
  supportsDataSource: boolean;
  supportsPlaceholder: boolean;
  supportsStaticOptions: boolean;
}

export interface CustomFieldComponentRegistration {
  category?: MaterialCategory;
  component: FieldComponent;
  defaultConfigFactory?: (
    fieldName: string,
  ) => Omit<FormFieldSchema, 'fieldName' | 'id' | 'kind'>;
  defaultMaterialKey: string;
  description?: string;
  label: string;
  supportsDataSource?: boolean;
  supportsPlaceholder?: boolean;
  supportsStaticOptions?: boolean;
}

export const FORM_DESIGNER_SCHEMA_VERSION = 2;

export const MATERIAL_CATEGORIES = [
  { key: 'basic', label: $t('workflow.formDesigner.materialCategories.basic') },
  { key: 'selector', label: $t('workflow.formDesigner.materialCategories.selector') },
  { key: 'datetime', label: $t('workflow.formDesigner.materialCategories.datetime') },
  { key: 'layout', label: $t('workflow.formDesigner.materialCategories.layout') },
  { key: 'advanced', label: $t('workflow.formDesigner.materialCategories.advanced') },
] as const;

export const FORM_MATERIALS: MaterialDefinition[] = [...(ALL_FORM_MATERIALS as readonly MaterialDefinition[])];

export const COMPONENT_MANIFEST: Record<string, ComponentManifestItem> = {
  AutoComplete: { component: 'AutoComplete', defaultMaterialKey: 'field-auto-complete', label: $t('workflow.formDesigner.componentLabels.autoComplete'), supportsDataSource: true, supportsPlaceholder: true, supportsStaticOptions: true },
  Cascader: { component: 'Cascader', defaultMaterialKey: 'field-cascader', label: $t('workflow.formDesigner.componentLabels.cascader'), supportsDataSource: true, supportsPlaceholder: true, supportsStaticOptions: false },
  Checkbox: { component: 'Checkbox', defaultMaterialKey: 'field-checkbox', label: $t('workflow.formDesigner.componentLabels.checkbox'), supportsDataSource: false, supportsPlaceholder: false, supportsStaticOptions: false },
  CheckboxGroup: { component: 'CheckboxGroup', defaultMaterialKey: 'field-checkbox-group', label: $t('workflow.formDesigner.componentLabels.checkboxGroup'), supportsDataSource: true, supportsPlaceholder: false, supportsStaticOptions: true },
  ColorPicker: { component: 'ColorPicker', defaultMaterialKey: 'field-color-picker', label: $t('workflow.formDesigner.componentLabels.colorPicker'), supportsDataSource: false, supportsPlaceholder: false, supportsStaticOptions: false },
  DatePicker: { component: 'DatePicker', defaultMaterialKey: 'field-date', label: $t('workflow.formDesigner.componentLabels.datePicker'), supportsDataSource: false, supportsPlaceholder: true, supportsStaticOptions: false },
  Input: { component: 'Input', defaultMaterialKey: 'field-input', label: $t('workflow.formDesigner.componentLabels.input'), supportsDataSource: false, supportsPlaceholder: true, supportsStaticOptions: false },
  InputNumber: { component: 'InputNumber', defaultMaterialKey: 'field-number', label: $t('workflow.formDesigner.componentLabels.inputNumber'), supportsDataSource: false, supportsPlaceholder: true, supportsStaticOptions: false },
  Mentions: { component: 'Mentions', defaultMaterialKey: 'field-mentions', label: $t('workflow.formDesigner.componentLabels.mentions'), supportsDataSource: false, supportsPlaceholder: true, supportsStaticOptions: false },
  Radio: { component: 'Radio', defaultMaterialKey: 'field-radio', label: $t('workflow.formDesigner.componentLabels.radio'), supportsDataSource: false, supportsPlaceholder: false, supportsStaticOptions: false },
  RadioGroup: { component: 'RadioGroup', defaultMaterialKey: 'field-radio-group', label: $t('workflow.formDesigner.componentLabels.radioGroup'), supportsDataSource: true, supportsPlaceholder: false, supportsStaticOptions: true },
  Rate: { component: 'Rate', defaultMaterialKey: 'field-rate', label: $t('workflow.formDesigner.componentLabels.rate'), supportsDataSource: false, supportsPlaceholder: false, supportsStaticOptions: false },
  Segmented: { component: 'Segmented', defaultMaterialKey: 'field-segmented', label: $t('workflow.formDesigner.componentLabels.segmented'), supportsDataSource: true, supportsPlaceholder: false, supportsStaticOptions: true },
  Select: { component: 'Select', defaultMaterialKey: 'field-select', label: $t('workflow.formDesigner.componentLabels.select'), supportsDataSource: true, supportsPlaceholder: true, supportsStaticOptions: true },
  Slider: { component: 'Slider', defaultMaterialKey: 'field-slider', label: $t('workflow.formDesigner.componentLabels.slider'), supportsDataSource: false, supportsPlaceholder: false, supportsStaticOptions: false },
  Switch: { component: 'Switch', defaultMaterialKey: 'field-switch', label: $t('workflow.formDesigner.componentLabels.switch'), supportsDataSource: false, supportsPlaceholder: false, supportsStaticOptions: false },
  Textarea: { component: 'Textarea', defaultMaterialKey: 'field-textarea', label: $t('workflow.formDesigner.componentLabels.textarea'), supportsDataSource: false, supportsPlaceholder: true, supportsStaticOptions: false },
  TimePicker: { component: 'TimePicker', defaultMaterialKey: 'field-time', label: $t('workflow.formDesigner.componentLabels.timePicker'), supportsDataSource: false, supportsPlaceholder: true, supportsStaticOptions: false },
  TreeSelect: { component: 'TreeSelect', defaultMaterialKey: 'field-tree-select', label: $t('workflow.formDesigner.componentLabels.treeSelect'), supportsDataSource: true, supportsPlaceholder: true, supportsStaticOptions: false },
  Upload: { component: 'Upload', defaultMaterialKey: 'field-upload-file', label: $t('workflow.formDesigner.componentLabels.upload'), supportsDataSource: false, supportsPlaceholder: false, supportsStaticOptions: false },
};

export const DATA_SOURCE_FIELD_COMPONENTS = (Object.keys(COMPONENT_MANIFEST) as FieldComponent[]).filter((key) => COMPONENT_MANIFEST[key]?.supportsDataSource);
export const STATIC_OPTIONS_FIELD_COMPONENTS = (Object.keys(COMPONENT_MANIFEST) as FieldComponent[]).filter((key) => COMPONENT_MANIFEST[key]?.supportsStaticOptions);

const MATERIAL_KEY_TO_FIELD_COMPONENT: Record<string, FieldComponent> = {
  'field-auto-complete': 'AutoComplete',
  'field-cascader': 'Cascader',
  'field-checkbox': 'Checkbox',
  'field-checkbox-group': 'CheckboxGroup',
  'field-color-picker': 'ColorPicker',
  'field-date': 'DatePicker',
  'field-input': 'Input',
  'field-mentions': 'Mentions',
  'field-number': 'InputNumber',
  'field-radio': 'Radio',
  'field-radio-group': 'RadioGroup',
  'field-rate': 'Rate',
  'field-segmented': 'Segmented',
  'field-select': 'Select',
  'field-slider': 'Slider',
  'field-switch': 'Switch',
  'field-textarea': 'Textarea',
  'field-time': 'TimePicker',
  'field-tree-select': 'TreeSelect',
  'field-upload-file': 'Upload',
  'field-upload-image': 'Upload',
};

const FIELD_COMPONENT_TO_DEFAULT_MATERIAL_KEY: Record<string, string> = {
  AutoComplete: 'field-auto-complete',
  Cascader: 'field-cascader',
  Checkbox: 'field-checkbox',
  CheckboxGroup: 'field-checkbox-group',
  ColorPicker: 'field-color-picker',
  DatePicker: 'field-date',
  Input: 'field-input',
  InputNumber: 'field-number',
  Mentions: 'field-mentions',
  Radio: 'field-radio',
  RadioGroup: 'field-radio-group',
  Rate: 'field-rate',
  Segmented: 'field-segmented',
  Select: 'field-select',
  Slider: 'field-slider',
  Switch: 'field-switch',
  Textarea: 'field-textarea',
  TimePicker: 'field-time',
  TreeSelect: 'field-tree-select',
  Upload: 'field-upload-file',
};

function createDefaultSimpleOptions(fieldName: string): FieldOption[] {
  return [
    { label: $t('workflow.formDesigner.defaults.option1'), value: `${fieldName}_1` },
    { label: $t('workflow.formDesigner.defaults.option2'), value: `${fieldName}_2` },
  ];
}

function createDefaultTreeOptions(fieldName: string): FieldOption[] {
  return [
    {
      label: $t('workflow.formDesigner.defaults.treeLevelA'),
      value: `${fieldName}_a`,
      children: [
        { label: $t('workflow.formDesigner.defaults.treeChild1'), value: `${fieldName}_a1` },
        { label: $t('workflow.formDesigner.defaults.treeChild2'), value: `${fieldName}_a2` },
      ],
    },
    {
      label: $t('workflow.formDesigner.defaults.treeLevelB'),
      value: `${fieldName}_b`,
      children: [
        { label: $t('workflow.formDesigner.defaults.treeChild1'), value: `${fieldName}_b1` },
        { label: $t('workflow.formDesigner.defaults.treeChild2'), value: `${fieldName}_b2` },
      ],
    },
  ];
}

function createDefaultTreeSelectData(fieldName: string): FieldOption[] {
  return [
    {
      title: $t('workflow.formDesigner.defaults.treeParentA'),
      label: $t('workflow.formDesigner.defaults.treeParentA'),
      value: `${fieldName}_a`,
      children: [
        { title: $t('workflow.formDesigner.defaults.treeNode1'), label: $t('workflow.formDesigner.defaults.treeNode1'), value: `${fieldName}_a1` },
        { title: $t('workflow.formDesigner.defaults.treeNode2'), label: $t('workflow.formDesigner.defaults.treeNode2'), value: `${fieldName}_a2` },
      ],
    },
    {
      title: $t('workflow.formDesigner.defaults.treeParentB'),
      label: $t('workflow.formDesigner.defaults.treeParentB'),
      value: `${fieldName}_b`,
      children: [
        { title: $t('workflow.formDesigner.defaults.treeNode1'), label: $t('workflow.formDesigner.defaults.treeNode1'), value: `${fieldName}_b1` },
        { title: $t('workflow.formDesigner.defaults.treeNode2'), label: $t('workflow.formDesigner.defaults.treeNode2'), value: `${fieldName}_b2` },
      ],
    },
  ];
}

export function createEmptyDesignerSchema(): FormDesignerSchema {
  return {
    dataSourcePresets: [],
    description: '',
    formColon: true,
    formDisabled: false,
    formLabelAlign: 'right',
    formLabelWrap: false,
    formLabelWidth: 120,
    formLayout: 'vertical',
    formRequiredMark: true,
    formShowSerialNumber: false,
    formSize: 'middle',
    formValidateTrigger: 'change',
    formVariant: 'outlined',
    nodes: [],
    schemaVersion: FORM_DESIGNER_SCHEMA_VERSION,
    title: $t('workflow.formDesigner.defaults.unnamedForm'),
  };
}

export function isFieldNode(node: FormDesignerSelectable): node is FormFieldSchema {
  return node.kind === 'field';
}

export function isLayoutNode(node: FormDesignerSelectable): node is FormLayoutSchema {
  return node.kind === 'layout';
}

export function isFieldMaterial(material: MaterialDefinition) {
  return material.kind === 'field';
}

export function isLayoutMaterial(material: MaterialDefinition) {
  return material.kind === 'layout';
}

export function getMaterialByKey(key: string) {
  return FORM_MATERIALS.find((item) => item.key === key);
}

export function getFieldComponentLabel(component: FieldComponent) {
  return COMPONENT_MANIFEST[component]?.label || $t('workflow.formDesigner.componentLabels.input');
}

export function getFieldMaterialKeyByField(field: FormFieldSchema) {
  if (field.component === 'Upload') {
    return field.componentProps?.listType === 'picture-card' ? 'field-upload-image' : 'field-upload-file';
  }
  return FIELD_COMPONENT_TO_DEFAULT_MATERIAL_KEY[field.component] || 'field-input';
}

export function supportsDataSourceFieldComponent(component: FieldComponent) {
  return COMPONENT_MANIFEST[component]?.supportsDataSource ?? false;
}

export function supportsStaticOptionsFieldComponent(component: FieldComponent) {
  return COMPONENT_MANIFEST[component]?.supportsStaticOptions ?? false;
}

export function supportsPlaceholderFieldComponent(component: FieldComponent) {
  return COMPONENT_MANIFEST[component]?.supportsPlaceholder ?? false;
}

export function createDefaultFieldDataSourceConfig(component: FieldComponent): FieldDataSourceConfig {
  const isTreeLike = component === 'Cascader' || component === 'TreeSelect';
  return {
    allowEmpty: true,
    apiMode: 'registry',
    apiKey: '',
    presetKey: '',
    apiUrl: '',
    baseParams: {},
    cache: true,
    childrenKey: isTreeLike ? 'children' : undefined,
    dataPath: '',
    debounceMs: 300,
    headers: {},
    labelKey: 'label',
    leafKey: isTreeLike ? 'isLeaf' : undefined,
    method: 'GET',
    requestMode: 'onInit',
    sourceType: 'static',
    valueKey: 'value',
  };
}

export function createDefaultFieldLinkageConfig(): FieldLinkageConfig {
  return {
    clearWhenParentChange: false,
    dependsOn: [],
    disableWhenMissingDeps: false,
    paramMap: {},
    refetchWhenParentChange: true,
  };
}

const DEFAULT_FIELD_CONFIG_FACTORIES: Record<string, (fieldName: string) => Omit<FormFieldSchema, 'id' | 'kind' | 'fieldName'>> = {
  AutoComplete: (fieldName) => ({ component: 'AutoComplete', componentProps: { options: createDefaultSimpleOptions(fieldName) }, dataSource: createDefaultFieldDataSourceConfig('AutoComplete'), defaultValue: '', label: $t('workflow.formDesigner.componentLabels.autoComplete'), linkage: createDefaultFieldLinkageConfig(), placeholder: $t('workflow.formDesigner.defaults.placeholderKeyword'), required: false }),
  Cascader: (fieldName) => ({ component: 'Cascader', componentProps: { options: createDefaultTreeOptions(fieldName) }, dataSource: createDefaultFieldDataSourceConfig('Cascader'), defaultValue: undefined, label: $t('workflow.formDesigner.componentLabels.cascader'), linkage: createDefaultFieldLinkageConfig(), placeholder: $t('workflow.formDesigner.defaults.placeholderSelect'), required: false }),
  Checkbox: () => ({ component: 'Checkbox', defaultValue: false, label: $t('workflow.formDesigner.componentLabels.checkbox'), required: false }),
  CheckboxGroup: (fieldName) => ({ component: 'CheckboxGroup', componentProps: {}, dataSource: createDefaultFieldDataSourceConfig('CheckboxGroup'), defaultValue: [], label: $t('workflow.formDesigner.componentLabels.checkboxGroup'), linkage: createDefaultFieldLinkageConfig(), options: createDefaultSimpleOptions(fieldName), required: false }),
  ColorPicker: () => ({ component: 'ColorPicker', componentProps: { valueFormat: 'hex' }, defaultValue: '#1677ff', label: $t('workflow.formDesigner.componentLabels.colorPicker'), required: false }),
  DatePicker: () => ({ component: 'DatePicker', defaultValue: undefined, label: $t('workflow.formDesigner.componentLabels.datePicker'), placeholder: $t('workflow.formDesigner.defaults.placeholderDate'), required: false }),
  Input: () => ({ component: 'Input', defaultValue: '', label: $t('workflow.formDesigner.componentLabels.input'), placeholder: $t('workflow.formDesigner.defaults.placeholderInput'), required: false }),
  InputNumber: () => ({ component: 'InputNumber', componentProps: { min: 0 }, defaultValue: undefined, label: $t('workflow.formDesigner.componentLabels.inputNumber'), placeholder: $t('workflow.formDesigner.defaults.placeholderNumber'), required: false }),
  Mentions: () => ({ component: 'Mentions', componentProps: { options: [{ label: '@alice', value: 'alice' }, { label: '@bob', value: 'bob' }] }, defaultValue: '', label: $t('workflow.formDesigner.componentLabels.mentions'), placeholder: $t('workflow.formDesigner.defaults.placeholderMentions'), required: false }),
  Radio: () => ({ component: 'Radio', defaultValue: false, label: $t('workflow.formDesigner.componentLabels.radio'), required: false }),
  RadioGroup: (fieldName) => ({ component: 'RadioGroup', componentProps: { optionType: 'default' }, dataSource: createDefaultFieldDataSourceConfig('RadioGroup'), defaultValue: undefined, label: $t('workflow.formDesigner.componentLabels.radioGroup'), linkage: createDefaultFieldLinkageConfig(), options: createDefaultSimpleOptions(fieldName), required: false }),
  Rate: () => ({ component: 'Rate', defaultValue: 0, label: $t('workflow.formDesigner.componentLabels.rate'), required: false }),
  Segmented: (fieldName) => ({ component: 'Segmented', componentProps: { options: createDefaultSimpleOptions(fieldName) }, dataSource: createDefaultFieldDataSourceConfig('Segmented'), defaultValue: undefined, label: $t('workflow.formDesigner.componentLabels.segmented'), linkage: createDefaultFieldLinkageConfig(), options: createDefaultSimpleOptions(fieldName), required: false }),
  Select: (fieldName) => ({ component: 'Select', componentProps: {}, dataSource: createDefaultFieldDataSourceConfig('Select'), defaultValue: undefined, label: $t('workflow.formDesigner.componentLabels.select'), linkage: createDefaultFieldLinkageConfig(), options: createDefaultSimpleOptions(fieldName), placeholder: $t('workflow.formDesigner.defaults.placeholderSelect'), required: false }),
  Slider: () => ({ component: 'Slider', componentProps: { min: 0, max: 100, step: 1 }, defaultValue: 0, label: $t('workflow.formDesigner.componentLabels.slider'), required: false }),
  Switch: () => ({ component: 'Switch', defaultValue: false, label: $t('workflow.formDesigner.componentLabels.switch'), required: false }),
  Textarea: () => ({ component: 'Textarea', defaultValue: '', label: $t('workflow.formDesigner.componentLabels.textarea'), placeholder: $t('workflow.formDesigner.defaults.placeholderTextarea'), required: false }),
  TimePicker: () => ({ component: 'TimePicker', defaultValue: undefined, label: $t('workflow.formDesigner.componentLabels.timePicker'), placeholder: $t('workflow.formDesigner.defaults.placeholderTime'), required: false }),
  TreeSelect: (fieldName) => ({ component: 'TreeSelect', componentProps: { options: createDefaultTreeOptions(fieldName), treeData: createDefaultTreeSelectData(fieldName) }, dataSource: createDefaultFieldDataSourceConfig('TreeSelect'), defaultValue: undefined, label: $t('workflow.formDesigner.componentLabels.treeSelect'), linkage: createDefaultFieldLinkageConfig(), placeholder: $t('workflow.formDesigner.defaults.placeholderSelect'), required: false }),
  Upload: () => ({ component: 'Upload', componentProps: { beforeUpload: () => false, listType: 'text' }, defaultValue: [] as UploadValueItem[], label: $t('workflow.formDesigner.componentLabels.upload'), required: false }),
};

export function registerCustomFieldComponent(
  registration: CustomFieldComponentRegistration,
) {
  const component = String(registration.component ?? '').trim();
  const label = String(registration.label ?? '').trim();
  const defaultMaterialKey = String(registration.defaultMaterialKey ?? '').trim();
  if (!component || !label || !defaultMaterialKey) return false;

  COMPONENT_MANIFEST[component] = {
    component,
    defaultMaterialKey,
    label,
    supportsDataSource: Boolean(registration.supportsDataSource),
    supportsPlaceholder: registration.supportsPlaceholder !== false,
    supportsStaticOptions: Boolean(registration.supportsStaticOptions),
  };

  MATERIAL_KEY_TO_FIELD_COMPONENT[defaultMaterialKey] = component;
  FIELD_COMPONENT_TO_DEFAULT_MATERIAL_KEY[component] = defaultMaterialKey;

  if (!FORM_MATERIALS.some((item) => item.key === defaultMaterialKey)) {
    FORM_MATERIALS.push({
      category: registration.category ?? 'advanced',
      description: registration.description || `Custom field: ${label}`,
      key: defaultMaterialKey,
      kind: 'field',
      label,
    });
  }

  const customFactory = registration.defaultConfigFactory;
  DEFAULT_FIELD_CONFIG_FACTORIES[component] = customFactory
    ? customFactory
    : () => ({
      component,
      defaultValue: '',
      label,
      placeholder: $t('workflow.formDesigner.defaults.placeholderInput'),
      required: false,
    });

  return true;
}

export function assertFieldComponentPreviewCoverage(components: FieldComponent[]) {
  if (!import.meta.env?.DEV) return;
  const expected = new Set(Object.keys(COMPONENT_MANIFEST) as FieldComponent[]);
  const missing = Array.from(expected).filter((item) => !components.includes(item));
  if (missing.length > 0) {
    throw new Error(`Preview renderer missing components: ${missing.join(', ')}`);
  }
}

export function getDefaultFieldConfig(component: FieldComponent, fieldName: string) {
  const fallbackFactory: (
    fieldName: string,
  ) => Omit<FormFieldSchema, 'id' | 'kind' | 'fieldName'> = DEFAULT_FIELD_CONFIG_FACTORIES.Input
    ?? (() => ({
      component: 'Input' as FieldComponent,
      defaultValue: '',
      label: $t('workflow.formDesigner.componentLabels.input'),
      placeholder: $t('workflow.formDesigner.defaults.placeholderInput'),
      required: false,
    }));
  const factory = DEFAULT_FIELD_CONFIG_FACTORIES[component] || fallbackFactory;
  return factory(fieldName);
}

export function createFieldComponentByMaterialKey(materialKey: string): FieldComponent {
  return MATERIAL_KEY_TO_FIELD_COMPONENT[materialKey] || 'Input';
}

export function getFieldPatchByMaterialKey(materialKey: string, fieldName: string): Partial<Omit<FormFieldSchema, 'id' | 'kind'>> {
  const defaults = getDefaultFieldConfig(createFieldComponentByMaterialKey(materialKey), fieldName);
  if (materialKey === 'field-upload-image') {
    return {
      ...defaults,
      component: 'Upload',
      componentProps: { ...(defaults.componentProps ?? {}), accept: 'image/*', listType: 'picture-card' },
      label: $t('workflow.formDesigner.materialDefinitions.fieldUploadImage.label'),
    };
  }
  if (materialKey === 'field-upload-file') {
    return {
      ...defaults,
      component: 'Upload',
      componentProps: { ...(defaults.componentProps ?? {}), listType: 'text' },
      label: $t('workflow.formDesigner.materialDefinitions.fieldUploadFile.label'),
    };
  }
  return defaults;
}

export function toVbenFormSchema(fields: FormFieldSchema[]): VbenFormSchema[] {
  return fields.map((field) => {
    const componentProps: Record<string, any> = { ...(field.componentProps ?? {}) };
    const useStaticOptions = field.dataSource?.sourceType !== 'api';
    const hasDynamicRuleExpression = Boolean(
      String(field.requiredExpression ?? '').trim()
      || String(field.visibleExpression ?? '').trim(),
    );

    if (field.placeholder && supportsPlaceholderFieldComponent(field.component)) {
      componentProps.placeholder = field.placeholder;
    }
    if (useStaticOptions && supportsStaticOptionsFieldComponent(field.component)) {
      componentProps.options = field.options ?? [];
    }
    if (useStaticOptions && field.component === 'TreeSelect') {
      componentProps.treeData = componentProps.treeData ?? field.options ?? [];
    }
    if (useStaticOptions && field.component === 'Cascader') {
      componentProps.options = componentProps.options ?? field.options ?? [];
    }

    return {
      component: field.component,
      componentProps,
      defaultValue: field.defaultValue,
      fieldName: field.fieldName,
      label: field.label,
      rules: field.required && !hasDynamicRuleExpression
        ? field.component === 'Select'
          ? 'selectRequired'
          : 'required'
        : undefined,
    };
  });
}
