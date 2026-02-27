<script setup lang="ts">
import type { Component } from 'vue';
import type { FieldComponent, FormFieldSchema } from '#/views/workflow/form-designer/types';

import { computed } from 'vue';

import {
  AutoComplete,
  Cascader,
  Checkbox,
  CheckboxGroup,
  ColorPicker,
  DatePicker,
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
} from 'antdv-next';

import { assertFieldComponentPreviewCoverage } from '#/views/workflow/form-designer/types';

interface Props {
  field: FormFieldSchema;
}

const props = defineProps<Props>();

type QuickRendererComponent = Exclude<FieldComponent, 'Upload'>;

type QuickRendererConfig = {
  bindings: Record<string, any>;
  component: Component;
};

const fieldOptions = computed(() => props.field.options ?? []);
const autoCompleteOptions = computed(() => props.field.componentProps?.options ?? fieldOptions.value);
const cascaderOptions = computed(() => props.field.componentProps?.options ?? fieldOptions.value);
const treeData = computed(() => props.field.componentProps?.treeData ?? fieldOptions.value);

function createRenderer(component: Component, bindings: Record<string, any>): QuickRendererConfig {
  return { component, bindings };
}

const quickRenderers: Record<QuickRendererComponent, () => QuickRendererConfig> = {
  AutoComplete: () => createRenderer(AutoComplete, {
    disabled: true,
    options: autoCompleteOptions.value,
    placeholder: props.field.placeholder || '请输入关键词',
    size: 'small',
  }),
  Cascader: () => createRenderer(Cascader, {
    disabled: true,
    options: cascaderOptions.value,
    placeholder: props.field.placeholder || '请选择',
    size: 'small',
  }),
  Checkbox: () => createRenderer(Checkbox, {
    checked: Boolean(props.field.defaultValue),
    disabled: true,
  }),
  CheckboxGroup: () => createRenderer(CheckboxGroup, {
    disabled: true,
    options: fieldOptions.value,
  }),
  ColorPicker: () => createRenderer(ColorPicker, {
    disabled: true,
    value: props.field.defaultValue,
  }),
  DatePicker: () => createRenderer(DatePicker, {
    disabled: true,
    size: 'small',
    style: 'width: 100%;',
  }),
  Input: () => createRenderer(Input, {
    disabled: true,
    placeholder: props.field.placeholder || '请输入',
    size: 'small',
  }),
  InputNumber: () => createRenderer(InputNumber, {
    disabled: true,
    placeholder: props.field.placeholder || '请输入数字',
    size: 'small',
    style: 'width: 100%;',
  }),
  Mentions: () => createRenderer(Mentions, {
    disabled: true,
    options: props.field.componentProps?.options,
    placeholder: props.field.placeholder || '输入 @ 触发提及',
    size: 'small',
  }),
  Radio: () => createRenderer(Radio, {
    checked: Boolean(props.field.defaultValue),
    disabled: true,
  }),
  RadioGroup: () => createRenderer(RadioGroup, {
    disabled: true,
    options: fieldOptions.value,
    size: 'small',
  }),
  Rate: () => createRenderer(Rate, {
    disabled: true,
    value: Number(props.field.defaultValue || 0),
  }),
  Segmented: () => createRenderer(Segmented, {
    disabled: true,
    options: fieldOptions.value,
    size: 'small',
    value: props.field.defaultValue,
  }),
  Select: () => createRenderer(Select, {
    disabled: true,
    options: fieldOptions.value,
    placeholder: props.field.placeholder || '请选择',
    size: 'small',
  }),
  Slider: () => createRenderer(Slider, {
    disabled: true,
    max: Number(props.field.componentProps?.max ?? 100),
    min: Number(props.field.componentProps?.min ?? 0),
    step: Number(props.field.componentProps?.step ?? 1),
    style: 'width: 100%;',
    value: props.field.defaultValue,
  }),
  Switch: () => createRenderer(Switch, {
    checked: Boolean(props.field.defaultValue),
    disabled: true,
    size: 'small',
  }),
  Textarea: () => createRenderer(TextArea, {
    disabled: true,
    placeholder: props.field.placeholder || '请输入',
    rows: 2,
    size: 'small',
  }),
  TimePicker: () => createRenderer(TimePicker, {
    disabled: true,
    size: 'small',
    style: 'width: 100%;',
  }),
  TreeSelect: () => createRenderer(TreeSelect, {
    disabled: true,
    placeholder: props.field.placeholder || '请选择',
    size: 'small',
    treeData: treeData.value,
  }),
};

assertFieldComponentPreviewCoverage([
  ...(Object.keys(quickRenderers) as QuickRendererComponent[]),
  'Upload',
]);

const activeRenderer = computed(() => {
  if (props.field.component === 'Upload') {
    return createRenderer(Upload, {
      disabled: true,
      fileList: [],
      listType: props.field.componentProps?.listType || 'text',
    });
  }

  const key = props.field.component as QuickRendererComponent;
  const renderer = quickRenderers[key] || quickRenderers.Input;
  return renderer();
});
</script>

<template>
  <div class="space-y-2">
    <component v-if="activeRenderer" :is="activeRenderer.component" v-bind="activeRenderer.bindings" />
    <Input v-else disabled size="small" :placeholder="props.field.placeholder || '请输入'" />
  </div>
</template>
