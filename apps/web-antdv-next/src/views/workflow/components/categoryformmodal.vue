<script setup lang="ts">
import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { Form, FormItem, Input, TextArea, message } from 'antdv-next';
import type { FormInstance } from 'antdv-next';

import {
  addCategoryApi,
  updateCategoryApi,
  type WorkflowApi,
} from '#/api/workflow';

interface CategoryModalData {
  category?: WorkflowApi.Category;
  mode: 'add' | 'edit';
  onOk: () => Promise<void>;
}

const formRef = ref<FormInstance>();
const modalData = ref<null | CategoryModalData>(null);
const formState = reactive({
  name: '',
  remark: '',
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }

    if (!modalData.value) return;

    modalApi.lock();
    try {
      if (modalData.value.mode === 'add') {
        const res = await addCategoryApi(formState.name, formState.remark);
        if (!res.Success) {
          message.error(res.Message || '新增分组失败');
          return;
        }
        message.success('新增分组成功');
      } else {
        const sysid = modalData.value.category?.Sysid;
        if (!sysid) return;
        const res = await updateCategoryApi(sysid, formState.name, formState.remark);
        if (!res.Success) {
          message.error(res.Message || '编辑分组失败');
          return;
        }
        message.success('编辑分组成功');
      }

      await modalData.value.onOk();
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<CategoryModalData>();
      if (!data) return;
      modalData.value = data;
      formState.name = data.category?.Name ?? '';
      formState.remark = data.category?.Remark ?? '';
      return;
    }

    modalData.value = null;
    formState.name = '';
    formState.remark = '';
  },
});
</script>

<template>
  <Modal :title="modalData?.mode === 'edit' ? '编辑分组' : '新增分组'" class="w-[420px]">
    <Form ref="formRef" :model="formState" layout="vertical" :validate-trigger="[]">
      <FormItem label="分组名称" name="name" :rules="[{ required: true, message: '请输入分组名称' }]">
        <Input v-model:value="formState.name" :maxlength="60" />
      </FormItem>
      <FormItem label="备注" name="remark">
        <TextArea v-model:value="formState.remark" :rows="3" :maxlength="200" show-count />
      </FormItem>
    </Form>
  </Modal>
</template>
