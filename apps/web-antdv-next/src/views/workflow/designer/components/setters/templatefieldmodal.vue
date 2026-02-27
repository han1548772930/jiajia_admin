<script setup lang="ts">
import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { Table } from 'antdv-next';

import type { TemplateField } from '#/views/workflow/designer/types';

interface TemplateFieldModalData {
  fields: TemplateField[];
  onOk: (fields: TemplateField[]) => void;
  title?: string;
}

const modalTitle = ref('选择字段生成模板');
const tableData = ref<TemplateField[]>([]);
const selectedRowKeys = ref<Array<number | string>>([]);
const selectedRows = ref<TemplateField[]>([]);

let confirmCallback: ((fields: TemplateField[]) => void) | null = null;

const columns = [
  {
    dataIndex: 'DbFieldName',
    key: 'DbFieldName',
    title: '字段名',
    width: 180,
  },
  {
    dataIndex: 'FieldLabel',
    key: 'FieldLabel',
    title: '字段标签',
    width: 220,
  },
  {
    dataIndex: 'TableName',
    key: 'TableName',
    title: '表名',
    width: 180,
  },
];

const rowSelection = computed(() => {
  return {
    onChange: (
      keys: Array<number | string>,
      rows: Array<Record<string, any>>,
    ) => {
      selectedRowKeys.value = keys;
      selectedRows.value = rows as TemplateField[];
    },
    selectedRowKeys: selectedRowKeys.value,
  };
});

const [Modal, modalApi] = useVbenModal({
  onConfirm() {
    confirmCallback?.([...selectedRows.value]);
    modalApi.close();
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<TemplateFieldModalData>();
      if (!data) return;

      modalTitle.value = data.title || '选择字段生成模板';
      tableData.value = data.fields ?? [];
      selectedRowKeys.value = [];
      selectedRows.value = [];
      confirmCallback = data.onOk;
      return;
    }

    resetState();
  },
});

function resetState() {
  modalTitle.value = '选择字段生成模板';
  tableData.value = [];
  selectedRowKeys.value = [];
  selectedRows.value = [];
  confirmCallback = null;
}
</script>

<template>
  <Modal :title="modalTitle" class="w-[860px]">
    <Table
      size="small"
      row-key="FieldName"
      :columns="columns as any"
      :data-source="tableData"
      :pagination="false"
      :row-selection="rowSelection as any"
      :scroll="{ y: 420 }"
    />
  </Modal>
</template>
