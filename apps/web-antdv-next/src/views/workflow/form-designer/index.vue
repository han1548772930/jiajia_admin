<script setup lang="ts">
import type {
  FieldDataSourcePreset,
  FormDesignerGlobalPatch,
  FormFieldSchema,
  FormLayoutMode,
  LayoutUpdatePatch,
} from '#/views/workflow/form-designer/types';

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { storeToRefs } from 'pinia';

import { Button, Input, Splitter, SplitterPanel, message } from 'antdv-next';

import { $t } from '#/locales';
import useWorkflowFormDesignerStore from '#/store/workflow/form-designer';
import CanvasPanel from '#/views/workflow/form-designer/components/CanvasPanel.vue';
import DesignerJsonModalComp from '#/views/workflow/form-designer/components/DesignerJsonModal.vue';
import MaterialPanel from '#/views/workflow/form-designer/components/MaterialPanel.vue';
import PropsPanel from '#/views/workflow/form-designer/components/PropsPanel.vue';
import {
  exportInternalSchema,
  exportRuntimeConfig,
  exportValueJsonSchema,
} from '#/views/workflow/form-designer/exporter';

const router = useRouter();
const designerStore = useWorkflowFormDesignerStore();
const [DesignerJsonModal, designerJsonModalApi] = useVbenModal({
  connectedComponent: DesignerJsonModalComp,
});

const { canCopy, canRedo, canUndo, schema, selectedEntity } = storeToRefs(designerStore);
const titleInputValue = ref('');
const descriptionInputValue = ref('');
let titleUpdateTimer: ReturnType<typeof setTimeout> | null = null;
let descriptionUpdateTimer: ReturnType<typeof setTimeout> | null = null;

const hasPreviewNodes = computed(() => schema.value.nodes.length > 0);

watch(
  () => schema.value.title,
  (value) => {
    if (titleInputValue.value !== value) {
      titleInputValue.value = value || '';
    }
  },
  { immediate: true },
);

watch(
  () => schema.value.description,
  (value) => {
    if (descriptionInputValue.value !== value) {
      descriptionInputValue.value = value || '';
    }
  },
  { immediate: true },
);

onMounted(() => {
  designerStore.loadFromStorage();
  window.addEventListener('keydown', handleGlobalShortcut);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalShortcut);
  if (titleUpdateTimer) {
    clearTimeout(titleUpdateTimer);
    titleUpdateTimer = null;
  }
  if (descriptionUpdateTimer) {
    clearTimeout(descriptionUpdateTimer);
    descriptionUpdateTimer = null;
  }
});

function scheduleTitleUpdate(value: string) {
  titleInputValue.value = value;
  if (titleUpdateTimer) {
    clearTimeout(titleUpdateTimer);
  }
  titleUpdateTimer = setTimeout(() => {
    designerStore.setTitle(titleInputValue.value || '');
  }, 300);
}

function scheduleDescriptionUpdate(value: string) {
  descriptionInputValue.value = value;
  if (descriptionUpdateTimer) {
    clearTimeout(descriptionUpdateTimer);
  }
  descriptionUpdateTimer = setTimeout(() => {
    designerStore.setDescription(descriptionInputValue.value || '');
  }, 300);
}

function handleSave() {
  designerStore.persist();
  designerStore.saveCurrentAsRecord();
  message.success($t('workflow.formDesigner.messages.formSavedToRecords'));
}

function handleCloneSelected() {
  if (!designerStore.cloneSelected()) {
    message.warning($t('workflow.formDesigner.messages.selectComponentFirst'));
    return;
  }
  message.success($t('workflow.formDesigner.messages.cloned'));
}

function isEditableTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const tagName = String(element.tagName || '').toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') return true;
  if (element.isContentEditable) return true;
  return Boolean(element.closest('[contenteditable="true"]'));
}

function handleGlobalShortcut(event: KeyboardEvent) {
  const key = event.key.toLowerCase();
  const hasModifier = event.ctrlKey || event.metaKey;
  const editingText = isEditableTarget(event.target);

  if (editingText) return;

  if (hasModifier && key === 'd') {
    event.preventDefault();
    handleCloneSelected();
    return;
  }

  if (hasModifier && key === 'z' && !event.shiftKey) {
    event.preventDefault();
    designerStore.undo();
    return;
  }

  if ((hasModifier && key === 'y') || (hasModifier && key === 'z' && event.shiftKey)) {
    event.preventDefault();
    designerStore.redo();
    return;
  }

  if (key === 'delete' || key === 'backspace') {
    if (!designerStore.selectedId) return;
    event.preventDefault();
    designerStore.removeSelected();
  }
}

function handlePreview() {
  designerStore.persist();
  router.push('/workflow/designer/form-preview');
}

function handleShowJson() {
  const payload = exportInternalSchema(schema.value);
  openJsonModal(payload, $t('workflow.formDesigner.export.internalSchemaTitle'));
}

function handleExportRuntimeJson() {
  const payload = exportRuntimeConfig(schema.value);
  openJsonModal(payload, $t('workflow.formDesigner.export.runtimeConfigTitle'));
}

function handleExportValueSchemaJson() {
  const payload = exportValueJsonSchema(schema.value);
  openJsonModal(payload, $t('workflow.formDesigner.export.jsonSchemaTitle'));
}

function openJsonModal(payload: any, title: string) {
  designerJsonModalApi
    .setData({
      json: JSON.stringify(payload, null, 2),
      title,
    })
    .open();
}

function handleImportJson() {
  designerJsonModalApi
    .setData({
      actionText: $t('workflow.formDesigner.actions.import'),
      editable: true,
      json: '',
      onSubmit: async (json: string) => {
        const result = designerStore.importFromJson(json);
        if (!result.ok) {
          throw new Error(result.message || $t('workflow.formDesigner.messages.importJsonFailed'));
        }
        message.success($t('workflow.formDesigner.messages.importJsonSuccess'));
      },
      title: $t('workflow.formDesigner.actions.importJsonTitle'),
    })
    .open();
}

function openSavedForms() {
  router.push('/workflow/designer/form-saved');
}

function backToTemplate() {
  router.push('/workflow/process-management/template');
}

function handleAddRootMaterial(payload: { beforeNodeId?: string; materialKey: string }) {
  designerStore.addMaterial(payload.materialKey, {
    beforeNodeId: payload.beforeNodeId,
  });
}

function handleAddLayoutField(payload: {
  layoutId: string;
  materialKey: string;
  targetColumnId?: string;
}) {
  designerStore.addMaterial(payload.materialKey, {
    targetColumnId: payload.targetColumnId,
    targetLayoutId: payload.layoutId,
  });
}

function handleUpdateField(payload: {
  fieldId: string;
  patch: Partial<Omit<FormFieldSchema, 'id' | 'kind'>>;
}) {
  designerStore.updateField(payload.fieldId, payload.patch);
}

function handleUpdateLayout(payload: {
  layoutId: string;
  patch: LayoutUpdatePatch;
}) {
  designerStore.updateLayout(payload.layoutId, payload.patch);
}

function handleUpdateFormLayout(layout: FormLayoutMode) {
  designerStore.setFormLayout(layout);
}

function handleUpdateFormConfig(patch: FormDesignerGlobalPatch) {
  designerStore.updateFormGlobalConfig(patch);
}

function handleUpdateDataSourcePresets(presets: FieldDataSourcePreset[]) {
  designerStore.setDataSourcePresets(presets);
}
</script>

<template>
  <Page auto-content-height content-class="h-full p-2">
    <div class="flex h-full min-h-0 flex-col gap-2">
      <div class="flex flex-wrap items-center gap-2 rounded-md border border-border bg-background p-2">
        <Button ghost type="primary" @click="backToTemplate">{{ $t('workflow.formDesigner.actions.backToTemplate') }}</Button>
        <Input
          :value="titleInputValue"
          class="w-[260px]"
          :placeholder="$t('workflow.formDesigner.actions.titlePlaceholder')"
          @update:value="(value) => scheduleTitleUpdate(value || '')"
        />
        <Input
          :value="descriptionInputValue"
          class="w-[340px]"
          :placeholder="$t('workflow.formDesigner.actions.descriptionPlaceholder')"
          @update:value="(value) => scheduleDescriptionUpdate(value || '')"
        />
        <Button class="ml-auto" @click="handleImportJson">{{ $t('workflow.formDesigner.actions.importJson') }}</Button>
        <Button @click="handleShowJson">{{ $t('workflow.formDesigner.export.internalSchema') }}</Button>
        <Button @click="handleExportRuntimeJson">{{ $t('workflow.formDesigner.export.runtimeConfig') }}</Button>
        <Button @click="handleExportValueSchemaJson">{{ $t('workflow.formDesigner.export.jsonSchema') }}</Button>
        <Button :disabled="!canCopy" @click="handleCloneSelected">{{ $t('workflow.formDesigner.actions.clone') }}</Button>
        <Button :disabled="!canUndo" @click="designerStore.undo()">{{ $t('workflow.formDesigner.actions.undo') }}</Button>
        <Button :disabled="!canRedo" @click="designerStore.redo()">{{ $t('workflow.formDesigner.actions.redo') }}</Button>
        <Button @click="designerStore.reset()">{{ $t('workflow.formDesigner.actions.reset') }}</Button>
        <Button @click="openSavedForms">{{ $t('workflow.formDesigner.actions.savedForms') }}</Button>
        <Button type="primary" :disabled="!hasPreviewNodes" @click="handlePreview">{{ $t('workflow.formDesigner.actions.enterPreview') }}</Button>
        <Button type="primary" ghost @click="handleSave">{{ $t('workflow.formDesigner.actions.save') }}</Button>
      </div>

      <Splitter class="min-h-0 flex-1 rounded-md border border-border bg-background">
        <SplitterPanel :default-size="'24%'" :max="'32%'" :min="'260px'" class="min-h-0 border-r border-border">
          <MaterialPanel
            :nodes="schema.nodes"
            :selected-id="designerStore.selectedId"
            @add="(materialKey) => designerStore.addMaterial(materialKey)"
            @select="designerStore.selectById"
          />
        </SplitterPanel>

        <SplitterPanel :default-size="'46%'" :min="'420px'" class="min-h-0 border-r border-border">
          <CanvasPanel
            :nodes="schema.nodes"
            :selected-id="designerStore.selectedId"
            @add-layout-field="handleAddLayoutField"
            @add-root-material="handleAddRootMaterial"
            @move-offset="(payload) => designerStore.moveByOffset(payload.id, payload.offset)"
            @move-root-node="(payload) => designerStore.moveRootNode(payload.fromNodeId, payload.toNodeId)"
            @remove="designerStore.removeById"
            @select="designerStore.selectById"
          />
        </SplitterPanel>

        <SplitterPanel :default-size="'30%'" :min="'320px'" class="min-h-0">
          <PropsPanel
            :all-fields="designerStore.allFields"
            :data-source-presets="schema.dataSourcePresets"
            :form-colon="schema.formColon"
            :form-disabled="schema.formDisabled"
            :form-label-align="schema.formLabelAlign"
            :form-label-wrap="schema.formLabelWrap"
            :form-label-width="schema.formLabelWidth"
            :form-layout="schema.formLayout"
            :form-required-mark="schema.formRequiredMark"
            :form-show-serial-number="schema.formShowSerialNumber"
            :form-size="schema.formSize"
            :form-validate-trigger="schema.formValidateTrigger"
            :form-variant="schema.formVariant"
            :selected="selectedEntity"
            @clone="handleCloneSelected"
            @remove="designerStore.removeById"
            @update-data-source-presets="handleUpdateDataSourcePresets"
            @update-form-config="handleUpdateFormConfig"
            @update-field="handleUpdateField"
            @update-form-layout="handleUpdateFormLayout"
            @update-layout="handleUpdateLayout"
          />
        </SplitterPanel>
      </Splitter>
    </div>
    <DesignerJsonModal />
  </Page>
</template>
