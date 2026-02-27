<script setup lang="ts">
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { Button, Empty, TextArea, message } from 'antdv-next';
import { $t } from '#/locales';

type SubmitJsonHandler = (
  json: string,
) => boolean | Promise<boolean | void> | void;

interface DesignerJsonModalData {
  actionText?: string;
  editable?: boolean;
  json?: string;
  onSubmit?: SubmitJsonHandler;
  title?: string;
}

const jsonText = ref('');
const modalTitle = ref($t('workflow.formDesigner.modal.currentJsonTitle'));
const editable = ref(false);
const actionText = ref($t('workflow.formDesigner.modal.submit'));
const submitLoading = ref(false);
const submitHandler = ref<SubmitJsonHandler>();

const [Modal, modalApi] = useVbenModal({
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<DesignerJsonModalData>();
      jsonText.value = data?.json ?? '';
      modalTitle.value = data?.title ?? $t('workflow.formDesigner.modal.currentJsonTitle');
      editable.value = Boolean(data?.editable);
      actionText.value = data?.actionText || $t('workflow.formDesigner.modal.submit');
      submitHandler.value = data?.onSubmit;
      return;
    }

    jsonText.value = '';
    modalTitle.value = $t('workflow.formDesigner.modal.currentJsonTitle');
    editable.value = false;
    actionText.value = $t('workflow.formDesigner.modal.submit');
    submitHandler.value = undefined;
    submitLoading.value = false;
  },
});

async function handleCopyJson() {
  const text = jsonText.value;
  if (!text) {
    message.warning($t('workflow.formDesigner.modal.noJsonToCopy'));
    return;
  }

  try {
    if (!navigator?.clipboard?.writeText) {
      throw new Error('clipboard unavailable');
    }
    await navigator.clipboard.writeText(text);
    message.success($t('workflow.formDesigner.modal.copySuccess'));
  } catch {
    message.error($t('workflow.formDesigner.modal.copyFailed'));
  }
}

async function handleSubmit() {
  if (!editable.value) return;
  if (!submitHandler.value) {
    message.warning($t('workflow.formDesigner.modal.noSubmitHandler'));
    return;
  }

  submitLoading.value = true;
  try {
    const result = await submitHandler.value(jsonText.value);
    if (result === false) return;
    modalApi.close();
  } catch (error: any) {
    message.error(error?.message || $t('workflow.formDesigner.modal.submitFailed'));
  } finally {
    submitLoading.value = false;
  }
}
</script>

<template>
  <Modal
    :title="modalTitle"
    class="w-[72%]"
    :footer="false"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <template #title>
      <div class="flex w-full items-center justify-between gap-2 pr-14">
        <span>{{ modalTitle }}</span>
        <div class="flex items-center gap-2">
          <Button size="small" type="primary" ghost @click="handleCopyJson">
            {{ $t('workflow.formDesigner.modal.copyJson') }}
          </Button>
          <Button
            v-if="editable"
            size="small"
            type="primary"
            :loading="submitLoading"
            @click="handleSubmit"
          >
            {{ actionText }}
          </Button>
        </div>
      </div>
    </template>

    <TextArea
      v-if="editable"
      v-model:value="jsonText"
      :rows="24"
      :placeholder="$t('workflow.formDesigner.modal.editablePlaceholder')"
    />
    <Empty v-else-if="!jsonText" :description="$t('workflow.formDesigner.modal.empty')" />
    <pre
      v-else
      class="overflow-auto rounded bg-muted p-3 text-xs leading-5"
    >{{ jsonText }}</pre>
  </Modal>
</template>
