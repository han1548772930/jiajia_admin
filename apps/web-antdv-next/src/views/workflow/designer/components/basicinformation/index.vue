<template>
  <div class="flex max-h-screen flex-col items-center justify-start bg-[rgb(240,242,245)] p-2.5 box-border">
    <div class="flex max-h-10 w-full items-center gap-3 box-border">
      <Button type="primary" ghost :disabled="submitting" @click="back">
        <template #icon>
          <IconifyIcon icon="lucide:arrow-left" />
        </template>
        返回
      </Button>
      <Steps :current="current" :items="items" class="flex-1" />
    </div>

    <div
      class="mt-2.5 h-[calc(100vh-100px)] w-full rounded-md border border-dashed border-[#bebaba] bg-[#fafafa] box-border [[data-theme='dark']_&]:border-[#404040] [[data-theme='dark']_&]:bg-[#2f2f2f]"
    >
      <BaseForm v-if="current === 0" ref="form" :category="formStore.category" :form-state="formStore.form" />
      <WorkflowEditor v-if="current === 1" />
    </div>

    <div class="h-10 pt-2.5 box-border">
      <Button v-if="current < steps.length - 1" type="primary" :disabled="submitting" @click="next">下一步</Button>
      <Button
        v-if="current === steps.length - 1"
        type="primary"
        :loading="submitting"
        @click="onComplete"
      >
        完成
      </Button>
      <Button v-if="current > 0" class="ml-2" :disabled="submitting" @click="prev">上一步</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { IconifyIcon } from '@vben/icons';
import { Button, Steps } from 'antdv-next';

import { useRequestLoading } from '#/composables/useRequestLoading';
import BaseForm from '#/views/workflow/designer/components/basicinformation/baseform.vue';
import WorkflowEditor from '#/views/workflow/designer/components/workfloweditor/index.vue';
import useFormStore from '#/store/workflow/form';
import useNodeStore from '#/store/workflow/node';
import useServiceStore from '#/store/workflow/service';
import type { Response, TemplateData } from '#/views/workflow/designer/types';
import {
  capitalizeObjectKeys,
  findEmptyNodeUsers,
  getSelectRangeName,
  notifyError,
  notifySuccess,
} from '#/views/workflow/designer/utils';

const router = useRouter();
const formStore = useFormStore();
const nodeStore = useNodeStore();
const service = useServiceStore();

type FormCheckResult =
  | {
    errorFields?: Array<{
      errors?: string[];
    }>;
  }
  | undefined;

const form = ref<{ onCheck?: () => Promise<FormCheckResult> }>();
const current = ref<number>(0);
const { loading: submitting, run: runWithSubmitting } = useRequestLoading();
const steps = [
  { title: '基础信息设置' },
  { title: '审批流程设置' },
];
const items = steps.map((item) => ({ key: item.title, title: item.title }));

function resetDesignerState() {
  formStore.form = {
    auditServiceName: '',
    billFormNamespace: '',
    dataBrowseFilename: '',
    enable: false,
    isDefault: false,
    name: '',
    remark: '',
    sysid: 0,
    type: undefined,
  };

  nodeStore.node.childNode = undefined;
  nodeStore.redoList = [];
  nodeStore.undoList = [];
}

function back() {
  resetDesignerState();
  router.replace('/workflow/process-management/template');
}

const next = async () => {
  const res = await form.value?.onCheck?.();
  if (res) {
    notifyError(
      (res.errorFields ?? [])
        .map((item) => item?.errors?.[0])
        .filter(Boolean)
        .join(';') || '请检查表单必填项',
    );
    return;
  }
  current.value++;
};

const prev = () => {
  current.value--;
};

async function onComplete() {
  if (submitting.value) return;

  const err = findEmptyNodeUsers(nodeStore.node);
  if (err.length > 0) {
    notifyError(err.map((item) => `${item.name}未选择${getSelectRangeName(item.selectRange)}`).join('；'));
    return;
  }

  const startNode = capitalizeObjectKeys(nodeStore.node, 1);
  const payload = {
    AuditServiceName: formStore.form.auditServiceName,
    BillFormNamespace: formStore.form.billFormNamespace,
    CategoryId: Number(formStore.form.type),
    DataBrowseFilename: formStore.form.dataBrowseFilename,
    IsDefault: formStore.form.isDefault ? 1 : 0,
    IsEnable: formStore.form.enable ? 1 : 0,
    Name: formStore.form.name,
    Node: startNode.ChildNode,
    Remark: formStore.form.remark,
    Sysid: formStore.form.sysid,
  };

  await runWithSubmitting(async () => {
    if (formStore.form.sysid && formStore.form.sysid !== 0) {
      const res: Response<TemplateData> = await service.updateTemplate(payload);
      if (!res.Success) {
        notifyError(res.Message);
        return;
      }
      notifySuccess('模板更新成功');
    } else {
      const res: Response<TemplateData> = await service.createTemplate(payload);
      if (!res.Success) {
        notifyError(res.Message);
        return;
      }
      notifySuccess('模板创建成功');
    }

    resetDesignerState();
    router.replace('/workflow/process-management/template');
  });
}
</script>
