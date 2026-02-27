import type { Component } from 'vue';
import type {
  CustomFieldComponentRegistration,
  FieldDataSourceConfig,
  FieldDataSourcePreset,
  FieldOption,
  FormFieldSchema,
} from '#/views/workflow/form-designer/types';

import { registerCustomFieldComponent } from '#/views/workflow/form-designer/types';

export interface DataSourceAdapterContext {
  dataSource: FieldDataSourceConfig;
  dataSourcePresets?: FieldDataSourcePreset[];
  field: FormFieldSchema;
  formModel: Record<string, any>;
  keyword?: string;
  requestParams: Record<string, any>;
}

export interface DataSourceAdapterResult {
  options: FieldOption[];
  rawData?: any;
}

export interface DataSourceAdapterDefinition {
  description?: string;
  key: string;
  label: string;
  load: (context: DataSourceAdapterContext) => Promise<DataSourceAdapterResult>;
}

export interface PropsPanelExtensionDefinition {
  defaultConfig?: Record<string, any>;
  description?: string;
  key: string;
  label: string;
  matchComponents?: string[];
}

const dataSourceAdapterMap = new Map<string, DataSourceAdapterDefinition>();
const propsPanelExtensionMap = new Map<string, PropsPanelExtensionDefinition>();
const previewComponentMap = new Map<string, Component>();

export function registerDataSourceAdapter(adapter: DataSourceAdapterDefinition) {
  const key = String(adapter?.key ?? '').trim();
  if (!key) return false;
  dataSourceAdapterMap.set(key, adapter);
  return true;
}

export function getDataSourceAdapter(key: string) {
  return dataSourceAdapterMap.get(String(key || '').trim());
}

export function getDataSourceAdapterOptions() {
  return Array.from(dataSourceAdapterMap.values()).map((item) => ({
    description: item.description || '',
    key: item.key,
    label: item.label,
  }));
}

export function registerPropsPanelExtension(extension: PropsPanelExtensionDefinition) {
  const key = String(extension?.key ?? '').trim();
  if (!key) return false;
  propsPanelExtensionMap.set(key, extension);
  return true;
}

export function getPropsPanelExtensions(component?: string) {
  const targetComponent = String(component || '').trim();
  const all = Array.from(propsPanelExtensionMap.values());
  if (!targetComponent) return all;
  return all.filter((item) => {
    const matchComponents = item.matchComponents ?? [];
    if (matchComponents.length === 0) return true;
    return matchComponents.includes(targetComponent);
  });
}

export function registerPreviewComponent(componentKey: string, component: Component) {
  const key = String(componentKey || '').trim();
  if (!key || !component) return false;
  previewComponentMap.set(key, component);
  return true;
}

export function getPreviewComponent(componentKey: string) {
  return previewComponentMap.get(String(componentKey || '').trim());
}

export function getPreviewComponentKeys() {
  return Array.from(previewComponentMap.keys());
}

export interface FormDesignerPlugin {
  customFieldComponents?: CustomFieldComponentRegistration[];
  dataSourceAdapters?: DataSourceAdapterDefinition[];
  previewComponents?: Array<{ component: Component; key: string }>;
  propsPanelExtensions?: PropsPanelExtensionDefinition[];
}

export function registerFormDesignerPlugin(plugin: FormDesignerPlugin) {
  (plugin.customFieldComponents ?? []).forEach((item) => registerCustomFieldComponent(item));
  (plugin.dataSourceAdapters ?? []).forEach((item) => registerDataSourceAdapter(item));
  (plugin.propsPanelExtensions ?? []).forEach((item) => registerPropsPanelExtension(item));
  (plugin.previewComponents ?? []).forEach((item) =>
    registerPreviewComponent(item.key, item.component),
  );
}
