<script setup lang="ts">
import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { Form, FormItem, Input, message } from 'antdv-next';
import type { FormInstance } from 'antdv-next';

import { createTaskGroupApi, updateTaskGroupApi } from '#/api/task';

interface GroupModalData {
  mode: 'add' | 'rename';
  editId?: number;
  parentId?: number;
  name?: string;
  fetchData: () => Promise<void>;
}

const formRef = ref<FormInstance>();
const formState = reactive({ name: '' });
const modalData = ref<GroupModalData | null>(null);

const [Modal, modalApi] = useVbenModal({
  draggable: true,
  async onConfirm() {
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }

    modalApi.lock();

    try {
      if (modalData.value?.mode === 'rename' && modalData.value.editId) {
        const res = await updateTaskGroupApi(
          modalData.value.editId,
          formState.name,
          modalData.value.parentId ?? 0,
        );
        if (!res.Success) {
          message.error(res.Message);
          throw new Error(res.Message);
        }
        message.success('修改成功');
      } else {
        const res = await createTaskGroupApi(formState.name, modalData.value?.parentId ?? 0);
        if (!res.Success) {
          message.error(res.Message);
          throw new Error(res.Message);
        }
        message.success('创建成功');
      }

      if (modalData.value?.fetchData) {
        await modalData.value.fetchData();
      }
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = modalApi.getData<GroupModalData>();
      if (data) {
        modalData.value = data;
        formState.name = data.name ?? '';
      }
    } else {
      formState.name = '';
      modalData.value = null;
    }
  },
  onOpened() {
    requestAnimationFrame(() => {
      const input = document.querySelector('.group-form-modal .ant-input') as HTMLInputElement | null;
      if (input) {
        input.focus();
        input.select();
      }
    });
  },
});
</script>

<template>
  <Modal :title="modalData?.mode === 'rename' ? '重命名分组' : '新增分组'" class="group-form-modal w-[400px]"
    contentClass="min-h-20">
    <Form ref="formRef" :model="formState" layout="vertical" :validate-trigger="[]">
      <FormItem label="分组名称" name="name" :rules="[{ required: true, message: '请输入分组名称' }]">
        <Input v-model:value="formState.name" placeholder="请输入分组名称" />
      </FormItem>
    </Form>
  </Modal>
</template>
