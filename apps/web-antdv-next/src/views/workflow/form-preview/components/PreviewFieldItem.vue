<script setup lang="ts">
import type { UploadChangeParam, UploadFile } from 'antdv-next';
import type { Component } from 'vue';
import type {
  FieldComponent,
  FieldDataSourcePreset,
  FormFieldSchema,
} from '#/views/workflow/form-designer/types';

import { computed, h, onBeforeUnmount, ref, watch } from 'vue';

import {
  AutoComplete,
  Button,
  Cascader,
  Checkbox,
  CheckboxGroup,
  ColorPicker,
  DatePicker,
  FormItem,
  Image,
  ImagePreviewGroup,
  Input,
  InputNumber,
  Mentions,
  Radio,
  RadioGroup,
  Rate,
  Segmented,
  Select,
  Slider,
  Switch,
  TextArea,
  TimePicker,
  TreeSelect,
  Upload,
  message,
} from 'antdv-next';

import { $t } from '#/locales';
import {
  buildFieldDataSourceParams,
  getFieldDataSourceConfig,
  getFieldLinkageConfig,
  hasMissingFieldDependencies,
  loadFieldDataSourceOptions,
  resolveFieldDataSourceConfig,
} from '#/views/workflow/form-designer/field-data-source';
import {
  resolveFieldRequired,
  resolveFieldVisible,
} from '#/views/workflow/form-designer/expression';
import {
  resolveFieldDescription,
  resolveFieldLabel,
} from '#/views/workflow/form-designer/i18n';
import {
  runAsyncValidator,
  runSyncValidator,
} from '#/views/workflow/form-designer/validation-registry';
import {
  getPreviewComponent,
  getPreviewComponentKeys,
} from '#/views/workflow/form-designer/plugin-registry';
import {
  assertFieldComponentPreviewCoverage,
  supportsDataSourceFieldComponent,
} from '#/views/workflow/form-designer/types';

interface Props {
  dataSourcePresets?: FieldDataSourcePreset[];
  errorMessage?: string;
  field: FormFieldSchema;
  model: Record<string, any>;
  readonly?: boolean;
  serialNumber?: number;
  showSerialNumber?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  change: [fieldName: string];
}>();

type LoadTrigger = 'focus' | 'init' | 'manual' | 'parent-change' | 'search';
type PreviewRendererComponent = Exclude<FieldComponent, 'Upload'>;

type RendererConfig = {
  bindings: Record<string, any>;
  component: Component;
  events: Record<string, (...args: any[]) => void>;
};

type RendererFactory = () => RendererConfig;

const isFieldVisible = computed(() => {
  return resolveFieldVisible(props.field, props.model);
});

const isFieldRequired = computed(() => {
  return resolveFieldRequired(props.field, props.model);
});
const fieldBaseLabel = computed(() => resolveFieldLabel(props.field));
const fieldDescriptionText = computed(() => resolveFieldDescription(props.field));

function toRuleTriggerValue(trigger: string | undefined) {
  if (!trigger || trigger === 'none') return undefined;
  if (trigger === 'change,blur') return ['change', 'blur'];
  return trigger;
}

const customValidationRules = computed(() => {
  const rules: Record<string, any>[] = [];
  const source = props.field.validationRules ?? [];

  source.forEach((item) => {
    if (!item || typeof item !== 'object') return;

    const trigger = toRuleTriggerValue(String(item.trigger || props.field.validateTrigger || '').trim());

    if (item.type === 'minLength') {
      const min = Number(item.value);
      if (!Number.isFinite(min)) return;
      rules.push({
        message: item.message || $t('workflow.formPreview.messages.lengthAtLeast', [fieldBaseLabel.value, min]),
        min,
        trigger,
        type: 'string',
      });
      return;
    }

    if (item.type === 'maxLength') {
      const max = Number(item.value);
      if (!Number.isFinite(max)) return;
      rules.push({
        max,
        message: item.message || $t('workflow.formPreview.messages.lengthAtMost', [fieldBaseLabel.value, max]),
        trigger,
        type: 'string',
      });
      return;
    }

    if (item.type === 'pattern') {
      const text = String(item.value ?? '').trim();
      if (!text) return;
      try {
        rules.push({
          message: item.message || $t('workflow.formPreview.messages.formatInvalid', [fieldBaseLabel.value]),
          pattern: new RegExp(text),
          trigger,
        });
      } catch {
        // Ignore invalid regular expression from configuration.
      }
      return;
    }

    if (item.type === 'custom') {
      const validatorKey = String(item.value ?? '').trim();
      if (!validatorKey) return;
      rules.push({
        trigger,
        validator: (_rule: any, value: any) => {
          const message = runSyncValidator(
            validatorKey,
            {
              field: props.field,
              model: props.model,
              value,
            },
            item.message || $t('workflow.formPreview.messages.invalid', [fieldBaseLabel.value]),
          );

          if (message) {
            return Promise.reject(new Error(message));
          }
          return Promise.resolve();
        },
      });
      return;
    }

    if (item.type === 'async') {
      const validatorKey = String(item.value ?? '').trim();
      if (!validatorKey) return;
      rules.push({
        trigger,
        validator: async (_rule: any, value: any) => {
          const message = await runAsyncValidator(
            validatorKey,
            {
              field: props.field,
              model: props.model,
              value,
            },
            item.message || $t('workflow.formPreview.messages.invalid', [fieldBaseLabel.value]),
          );

          if (message) {
            return Promise.reject(new Error(message));
          }
          return Promise.resolve();
        },
      });
    }
  });

  return rules;
});

const fieldRules = computed(() => {
  const rules: Record<string, any>[] = [...customValidationRules.value];
  const requiredTrigger = toRuleTriggerValue(
    String(props.field.validateTrigger || '').trim(),
  );
  if (isFieldRequired.value) {
    rules.unshift({
      message: $t('workflow.formPreview.messages.pleaseInput', [fieldBaseLabel.value]),
      required: true,
      trigger: requiredTrigger,
    });
  }
  return rules.length > 0 ? rules : undefined;
});

const fieldValidateTrigger = computed(() => {
  return toRuleTriggerValue(String(props.field.validateTrigger || '').trim());
});

const fieldLabelText = computed(() => {
  const base = fieldBaseLabel.value;
  if (!props.showSerialNumber) return base;

  const serial = Number(props.serialNumber ?? 0);
  if (!Number.isFinite(serial) || serial <= 0) return base;
  return `${serial}. ${base}`;
});

const fieldLabelContent = computed(() => {
  if (!fieldDescriptionText.value) {
    return fieldLabelText.value;
  }
  return h('div', { class: 'leading-tight' }, [
    h('div', fieldLabelText.value),
    h('div', { class: 'text-xs text-muted-foreground' }, fieldDescriptionText.value),
  ]);
});

watch(
  () => props.model[props.field.fieldName],
  (value, oldValue) => {
    if (value === oldValue) return;
    emit('change', props.field.fieldName);
  },
);

const isReadonly = computed(() => Boolean(props.readonly));

const usesDataSource = computed(() => {
  return supportsDataSourceFieldComponent(props.field.component);
});

const normalizedComponentProps = computed(() => {
  const source = { ...(props.field.componentProps ?? {}) } as Record<string, any>;

  for (const key of ['onBlur', 'onFocus', 'onSearch']) {
    const handler = source[key];
    if (!Array.isArray(handler)) continue;

    source[key] = (...args: any[]) => {
      handler.forEach((fn: any) => {
        if (typeof fn === 'function') fn(...args);
      });
    };
  }

  return source;
});

const dataSourceConfig = computed(() => {
  if (!usesDataSource.value) return undefined;
  return getFieldDataSourceConfig(props.field);
});

const resolvedDataSourceConfig = computed(() => {
  if (!usesDataSource.value) return undefined;
  return resolveFieldDataSourceConfig(props.field, props.dataSourcePresets);
});

const linkageConfig = computed(() => {
  if (!usesDataSource.value) return undefined;
  return getFieldLinkageConfig(props.field);
});

const usesApiDataSource = computed(() => {
  const config = resolvedDataSourceConfig.value;
  if (!config || config.sourceType !== 'api') return false;
  if (config.apiMode === 'custom') {
    return Boolean(String(config.apiUrl || '').trim());
  }
  return Boolean(String(config.apiKey || '').trim());
});

const missingDependencies = computed(() => {
  if (!usesApiDataSource.value) return false;
  return hasMissingFieldDependencies(props.field, props.model);
});

const dynamicOptions = ref<any[]>([]);
const dataSourceLoading = ref(false);
const dataSourceCache = new Map<string, any[]>();
const searchKeyword = ref('');

let loadTimer: ReturnType<typeof setTimeout> | null = null;

const fieldOptions = computed(() => {
  if (usesApiDataSource.value) return dynamicOptions.value;
  return props.field.options ?? [];
});

const autoCompleteOptions = computed(() => {
  if (usesApiDataSource.value) return fieldOptions.value;
  return normalizedComponentProps.value.options ?? fieldOptions.value;
});

const cascaderOptions = computed(() => {
  if (usesApiDataSource.value) return fieldOptions.value;
  return normalizedComponentProps.value.options ?? fieldOptions.value;
});

const treeData = computed(() => {
  if (usesApiDataSource.value) return dynamicOptions.value;
  return normalizedComponentProps.value.treeData ?? fieldOptions.value;
});

const shouldDisableByLinkage = computed(() => {
  return Boolean(
    usesApiDataSource.value &&
    linkageConfig.value?.disableWhenMissingDeps &&
    missingDependencies.value,
  );
});

const isComponentDisabled = computed(() => {
  return isReadonly.value || shouldDisableByLinkage.value;
});

const useSearchRequest = computed(() => {
  return usesApiDataSource.value && dataSourceConfig.value?.requestMode === 'onSearch';
});

const isManualRequestMode = computed(() => {
  return usesApiDataSource.value && dataSourceConfig.value?.requestMode === 'manual';
});

function composeEventHandler<T extends any[]>(
  original: any,
  appended: (...args: T) => void,
) {
  if (typeof original === 'function') {
    return (...args: T) => {
      original(...args);
      appended(...args);
    };
  }
  return appended;
}

const selectProps = computed(() => {
  const componentProps = normalizedComponentProps.value;
  const next: Record<string, any> = {
    ...componentProps,
    filterOption: useSearchRequest.value ? false : componentProps.filterOption,
    loading: dataSourceLoading.value,
    options: fieldOptions.value,
    placeholder: props.field.placeholder,
    showSearch: useSearchRequest.value || componentProps.showSearch,
  };

  if (canTriggerDataSourceLoad('focus')) {
    next.onFocus = composeEventHandler(componentProps.onFocus, () => handleDynamicFocus());
  }
  if (canTriggerDataSourceLoad('search')) {
    next.onSearch = composeEventHandler(componentProps.onSearch, (value: string) => {
      handleDynamicSearch(String(value ?? ''));
    });
  }
  return next;
});

const autoCompleteProps = computed(() => {
  const componentProps = normalizedComponentProps.value;
  const next: Record<string, any> = {
    ...componentProps,
    options: autoCompleteOptions.value,
    placeholder: props.field.placeholder,
  };

  if (canTriggerDataSourceLoad('focus')) {
    next.onFocus = composeEventHandler(componentProps.onFocus, () => handleDynamicFocus());
  }
  if (canTriggerDataSourceLoad('search')) {
    next.onSearch = composeEventHandler(componentProps.onSearch, (value: string) => {
      handleDynamicSearch(String(value ?? ''));
    });
  }
  return next;
});

const cascaderProps = computed(() => {
  const componentProps = normalizedComponentProps.value;
  const next: Record<string, any> = {
    ...componentProps,
    options: cascaderOptions.value,
    placeholder: props.field.placeholder,
  };

  if (canTriggerDataSourceLoad('focus')) {
    next.onFocus = composeEventHandler(componentProps.onFocus, () => handleDynamicFocus());
  }
  return next;
});

const treeSelectProps = computed(() => {
  const componentProps = normalizedComponentProps.value;
  const next: Record<string, any> = {
    ...componentProps,
    filterTreeNode: useSearchRequest.value ? false : componentProps.filterTreeNode,
    placeholder: props.field.placeholder,
    showSearch: useSearchRequest.value || componentProps.showSearch,
    treeData: treeData.value,
  };

  if (canTriggerDataSourceLoad('focus')) {
    next.onFocus = composeEventHandler(componentProps.onFocus, () => handleDynamicFocus());
  }
  if (canTriggerDataSourceLoad('search')) {
    next.onSearch = composeEventHandler(componentProps.onSearch, (value: string) => {
      handleDynamicSearch(String(value ?? ''));
    });
  }
  return next;
});

const uploadFileList = computed(() => {
  const value = props.model[props.field.fieldName];
  return Array.isArray(value) ? value : [];
});

const uploadProps = computed(() => ({
  ...(normalizedComponentProps.value ?? {}),
  beforeUpload: normalizedComponentProps.value?.beforeUpload ?? (() => false),
}));

const imagePreviewOpen = ref(false);
const imagePreviewCurrent = ref(0);
const imagePreviewUrls = ref<string[]>([]);

const isImageUpload = computed(() => {
  if (props.field.component !== 'Upload') return false;
  const listType = String(props.field.componentProps?.listType ?? '');
  const accept = String(props.field.componentProps?.accept ?? '');
  return listType === 'picture-card' || accept.includes('image');
});

const uploadImageUrls = computed(() => {
  return uploadFileList.value
    .map((file) => {
      if (typeof file?.url === 'string' && file.url) return file.url;
      if (typeof file?.thumbUrl === 'string' && file.thumbUrl) return file.thumbUrl;
      if (typeof file?.preview === 'string' && file.preview) return file.preview;
      return '';
    })
    .filter((item) => Boolean(item));
});

const previewGroupUrls = computed(() => {
  return imagePreviewUrls.value.length > 0
    ? imagePreviewUrls.value
    : uploadImageUrls.value;
});

const imagePreviewConfig = computed(() => ({
  current: imagePreviewCurrent.value,
  onChange: (current: number) => {
    imagePreviewCurrent.value = current;
  },
  onOpenChange: (open: boolean) => {
    imagePreviewOpen.value = open;
    if (!open) {
      imagePreviewUrls.value = [];
      imagePreviewCurrent.value = 0;
    }
  },
  open: imagePreviewOpen.value,
}));

function setFieldValue(value: any) {
  props.model[props.field.fieldName] = value;
}

function getClearedFieldValue() {
  if (props.field.component === 'CheckboxGroup') return [];
  if (props.field.component === 'Checkbox') return false;
  if (props.field.component === 'Radio') return false;
  if (props.field.component === 'Cascader') return [];
  if (props.field.component === 'AutoComplete') return '';
  return undefined;
}

function canTriggerDataSourceLoad(trigger: LoadTrigger) {
  if (!usesApiDataSource.value) return false;

  const requestMode = dataSourceConfig.value?.requestMode ?? 'onInit';

  if (trigger === 'manual') return true;
  if (trigger === 'parent-change') {
    return Boolean(linkageConfig.value?.refetchWhenParentChange);
  }

  if (trigger === 'init') return requestMode === 'onInit';
  if (trigger === 'focus') return requestMode === 'onFocus';
  if (trigger === 'search') return requestMode === 'onSearch';

  return false;
}

function buildCacheKey(keyword?: string) {
  const config = resolvedDataSourceConfig.value;
  if (!config) return '';

  const params = buildFieldDataSourceParams(props.field, props.model, keyword);
  return JSON.stringify({
    apiKey: config.apiKey ?? '',
    apiMode: config.apiMode ?? 'registry',
    apiUrl: config.apiUrl ?? '',
    presetKey: config.presetKey ?? '',
    keyword: keyword ?? '',
    params,
  });
}

async function loadDataSourceOptions(trigger: LoadTrigger, keyword?: string) {
  if (!canTriggerDataSourceLoad(trigger)) return;
  if (shouldDisableByLinkage.value) {
    dynamicOptions.value = [];
    return;
  }

  const config = resolvedDataSourceConfig.value;
  if (!config) return;

  const cacheKey = buildCacheKey(keyword);
  if (config.cache && cacheKey && dataSourceCache.has(cacheKey)) {
    dynamicOptions.value = dataSourceCache.get(cacheKey) ?? [];
    return;
  }

  dataSourceLoading.value = true;
  try {
    const result = await loadFieldDataSourceOptions({
      dataSourcePresets: props.dataSourcePresets,
      field: props.field,
      formModel: props.model,
      keyword,
    });

    dynamicOptions.value = result.options;
    if (config.cache && cacheKey) {
      dataSourceCache.set(cacheKey, result.options);
    }
  } catch (error: any) {
    dynamicOptions.value = [];
    message.error(error?.message || $t('workflow.formPreview.messages.dataSourceLoadFailed', [fieldBaseLabel.value]));
  } finally {
    dataSourceLoading.value = false;
  }
}

function scheduleDataSourceLoad(trigger: LoadTrigger, keyword?: string) {
  if (!canTriggerDataSourceLoad(trigger)) return;

  const waitMs = Math.max(0, Number(dataSourceConfig.value?.debounceMs ?? 0));
  if (waitMs === 0) {
    void loadDataSourceOptions(trigger, keyword);
    return;
  }

  if (loadTimer) {
    clearTimeout(loadTimer);
    loadTimer = null;
  }

  loadTimer = setTimeout(() => {
    void loadDataSourceOptions(trigger, keyword);
  }, waitMs);
}

function handleDynamicFocus() {
  scheduleDataSourceLoad('focus', searchKeyword.value || undefined);
}

function handleDynamicSearch(value: string) {
  searchKeyword.value = value;
  scheduleDataSourceLoad('search', value);
}

function handleManualLoad() {
  scheduleDataSourceLoad('manual', searchKeyword.value || undefined);
}

watch(
  () => [props.field.id, props.field.component, props.field.dataSource, props.field.linkage, props.dataSourcePresets],
  () => {
    dataSourceCache.clear();
    dynamicOptions.value = [];
    searchKeyword.value = '';

    if (canTriggerDataSourceLoad('init')) {
      scheduleDataSourceLoad('init');
    }
  },
  { deep: true, immediate: true },
);

watch(
  () => (linkageConfig.value?.dependsOn ?? []).map((fieldName) => props.model[fieldName]),
  (current, previous) => {
    if (!usesApiDataSource.value) return;
    if (!previous) return;

    const changed = current.some((value, index) => value !== previous[index]);
    if (!changed) return;

    if (linkageConfig.value?.clearWhenParentChange) {
      setFieldValue(getClearedFieldValue());
    }

    if (linkageConfig.value?.refetchWhenParentChange) {
      scheduleDataSourceLoad('parent-change', searchKeyword.value || undefined);
    }
  },
  { deep: true },
);

onBeforeUnmount(() => {
  if (loadTimer) {
    clearTimeout(loadTimer);
    loadTimer = null;
  }
});

function isImageFile(file: UploadFile) {
  if (file.type) return file.type.startsWith('image/');
  const name = String(file.name || '');
  return /\.(bmp|gif|jpe?g|png|svg|webp)$/i.test(name);
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function normalizeUploadFile(file: UploadFile): Promise<UploadFile> {
  const nextFile: UploadFile = { ...file };

  if (
    isImageFile(nextFile) &&
    !nextFile.url &&
    !nextFile.thumbUrl &&
    nextFile.originFileObj
  ) {
    try {
      nextFile.thumbUrl = await fileToDataUrl(nextFile.originFileObj as File);
    } catch {
      // Ignore preview conversion errors; upload list still works.
    }
  }

  return nextFile;
}

async function handleUploadChange(event: UploadChangeParam) {
  const normalized = await Promise.all(
    (event.fileList ?? []).map(normalizeUploadFile),
  );
  setFieldValue(normalized);
}

async function resolvePreviewUrl(file: UploadFile) {
  if (file.url) return file.url;
  if (file.thumbUrl) return file.thumbUrl;
  if (typeof file.preview === 'string') return file.preview;
  if (!file.originFileObj) return undefined;

  try {
    const preview = await fileToDataUrl(file.originFileObj as File);
    file.preview = preview;
    return preview;
  } catch {
    return undefined;
  }
}

async function handleUploadPreview(file: UploadFile) {
  if (!isImageUpload.value) {
    const fileUrl = await resolvePreviewUrl(file);
    if (!fileUrl) {
      message.warning($t('workflow.formPreview.messages.filePreviewUnavailable'));
      return;
    }
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  const urls = (
    await Promise.all(uploadFileList.value.map((item) => resolvePreviewUrl(item)))
  ).filter((item): item is string => Boolean(item));

  if (urls.length === 0) {
    message.warning($t('workflow.formPreview.messages.noImagePreview'));
    return;
  }

  const currentUrl = await resolvePreviewUrl(file);
  const currentIndex = currentUrl ? urls.indexOf(currentUrl) : 0;

  imagePreviewUrls.value = urls;
  imagePreviewCurrent.value = currentIndex >= 0 ? currentIndex : 0;
  imagePreviewOpen.value = true;
}

function createValueRenderer(
  component: Component,
  rendererProps: Record<string, any>,
): RendererConfig {
  return {
    bindings: {
      ...rendererProps,
      disabled: isComponentDisabled.value,
      value: props.model[props.field.fieldName],
    },
    component,
    events: {
      'update:value': setFieldValue,
    },
  };
}

const rendererFactories: Record<PreviewRendererComponent, RendererFactory> = {
  AutoComplete: () => createValueRenderer(AutoComplete, autoCompleteProps.value),
  Cascader: () => createValueRenderer(Cascader, cascaderProps.value),
  ColorPicker: () => createValueRenderer(ColorPicker, normalizedComponentProps.value),
  CheckboxGroup: () =>
    createValueRenderer(CheckboxGroup, {
      ...normalizedComponentProps.value,
      options: fieldOptions.value,
    }),
  Checkbox: () => ({
    bindings: {
      ...normalizedComponentProps.value,
      checked: Boolean(props.model[props.field.fieldName]),
      disabled: isComponentDisabled.value,
    },
    component: Checkbox,
    events: {
      'update:checked': setFieldValue,
    },
  }),
  DatePicker: () =>
    createValueRenderer(DatePicker, {
      ...normalizedComponentProps.value,
      style: 'width: 100%;',
    }),
  Input: () =>
    createValueRenderer(Input, {
      ...normalizedComponentProps.value,
      placeholder: props.field.placeholder,
    }),
  InputNumber: () =>
    createValueRenderer(InputNumber, {
      ...normalizedComponentProps.value,
      placeholder: props.field.placeholder,
      style: 'width: 100%;',
    }),
  Mentions: () =>
    createValueRenderer(Mentions, {
      ...normalizedComponentProps.value,
      options: normalizedComponentProps.value.options,
      placeholder: props.field.placeholder,
    }),
  Radio: () => ({
    bindings: {
      ...normalizedComponentProps.value,
      checked: Boolean(props.model[props.field.fieldName]),
      disabled: isComponentDisabled.value,
    },
    component: Radio,
    events: {
      'update:checked': setFieldValue,
    },
  }),
  RadioGroup: () =>
    createValueRenderer(RadioGroup, {
      ...normalizedComponentProps.value,
      options: fieldOptions.value,
    }),
  Rate: () => createValueRenderer(Rate, normalizedComponentProps.value),
  Segmented: () =>
    createValueRenderer(Segmented, {
      ...normalizedComponentProps.value,
      options: fieldOptions.value,
      value: props.model[props.field.fieldName],
    }),
  Select: () => createValueRenderer(Select, selectProps.value),
  Slider: () =>
    createValueRenderer(Slider, {
      ...normalizedComponentProps.value,
      max: Number(normalizedComponentProps.value.max ?? 100),
      min: Number(normalizedComponentProps.value.min ?? 0),
      step: Number(normalizedComponentProps.value.step ?? 1),
      style: 'width: 100%;',
    }),
  Switch: () => ({
    bindings: {
      ...normalizedComponentProps.value,
      checked: props.model[props.field.fieldName],
      disabled: isComponentDisabled.value,
    },
    component: Switch,
    events: {
      'update:checked': setFieldValue,
    },
  }),
  Textarea: () =>
    createValueRenderer(TextArea, {
      ...normalizedComponentProps.value,
      placeholder: props.field.placeholder,
      rows: normalizedComponentProps.value.rows ?? 4,
    }),
  TimePicker: () =>
    createValueRenderer(TimePicker, {
      ...normalizedComponentProps.value,
      style: 'width: 100%;',
    }),
  TreeSelect: () => createValueRenderer(TreeSelect, treeSelectProps.value),
};

assertFieldComponentPreviewCoverage([
  ...(Object.keys(rendererFactories) as PreviewRendererComponent[]),
  ...(getPreviewComponentKeys() as PreviewRendererComponent[]),
  'Upload',
]);

const activeRenderer = computed(() => {
  if (props.field.component === 'Upload') return undefined;

  const key = props.field.component as PreviewRendererComponent;
  const customPreviewComponent = getPreviewComponent(key);
  if (customPreviewComponent) {
    return createValueRenderer(customPreviewComponent, normalizedComponentProps.value);
  }
  const factory = rendererFactories[key] || rendererFactories.Input;
  return factory();
});
</script>

<template>
  <FormItem
    v-if="isFieldVisible"
    :help="props.errorMessage || undefined"
    :label="fieldLabelContent"
    :name="props.field.fieldName"
    :validate-trigger="fieldValidateTrigger as any"
    :validate-status="props.errorMessage ? 'error' : undefined"
    :rules="fieldRules"
  >
    <component
      v-if="activeRenderer"
      :is="activeRenderer.component"
      v-bind="activeRenderer.bindings"
      v-on="activeRenderer.events"
    />

    <template v-else-if="props.field.component === 'Upload'">
      <Upload
        :file-list="uploadFileList"
        :disabled="isReadonly"
        v-bind="uploadProps"
        @change="handleUploadChange"
        @preview="handleUploadPreview"
      >
        <Button v-if="!isReadonly" type="default">{{ $t('workflow.formPreview.actions.upload') }}</Button>
      </Upload>

      <ImagePreviewGroup
        v-if="isImageUpload && previewGroupUrls.length > 0"
        :preview="imagePreviewConfig"
      >
        <div v-if="isReadonly" class="mt-2 flex flex-wrap gap-2">
          <Image
            v-for="(src, index) in previewGroupUrls"
            :key="`${props.field.id}_img_${index}`"
            :src="src"
            :width="84"
          />
        </div>
        <template v-else>
          <Image
            v-for="(src, index) in previewGroupUrls"
            :key="`${props.field.id}_img_hidden_${index}`"
            :src="src"
            style="display: none;"
          />
        </template>
      </ImagePreviewGroup>
    </template>

    <Input
      v-else
      v-model:value="props.model[props.field.fieldName]"
      :disabled="isComponentDisabled"
      :placeholder="props.field.placeholder"
      v-bind="normalizedComponentProps"
    />

    <div v-if="isManualRequestMode && !isReadonly" class="mt-2">
      <Button
        :disabled="isComponentDisabled"
        :loading="dataSourceLoading"
        size="small"
        type="dashed"
        @click="handleManualLoad"
      >
        {{ $t('workflow.formPreview.actions.manualLoad') }}
      </Button>
    </div>
  </FormItem>
</template>
