<script setup lang="ts">
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import Cron from './cron/Cron.vue';

const cronDraft = ref('* * * * *');
let onConfirmCallback: ((val: string) => void) | null = null;

const [Modal, modalApi] = useVbenModal({
  draggable: true,
  onConfirm() {
    if (onConfirmCallback) {
      onConfirmCallback(cronDraft.value);
    }
    modalApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = modalApi.getData<{ cron: string; onOk: (val: string) => void }>();
      if (data) {
        cronDraft.value = data.cron || '* * * * *';
        onConfirmCallback = data.onOk ?? null;
      }
    }
  },
});
</script>

<template>
  <Modal title="编辑 Cron 表达式" class="w-[650px]">
    <Cron v-model="cronDraft" :cron="cronDraft" />
  </Modal>
</template>
