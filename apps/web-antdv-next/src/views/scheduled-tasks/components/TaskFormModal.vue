<script setup lang="ts">
import type { FormInstance } from 'antdv-next';

import type { TaskApi } from '#/api/task';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Button,
  DatePicker,
  Divider,
  Form,
  FormItem,
  Input,
  message,
  Select,
  Switch,
  TextArea,
} from 'antdv-next';

import {
  createJobApi,
  JobOperateType,
  JobType,
  updateJobApi,
} from '#/api/task';
import { useTaskFormStore } from '#/store/task-form';

import AutoReportForm from './AutoReportForm.vue';
import CronModalComp from './CronModal.vue';
import DLLForm from './DLLForm.vue';
import EXEForm from './EXEForm.vue';
import HttpRequestForm from './HttpRequestForm.vue';
import SCRIPTForm from './SCRIPTForm.vue';
import {
  buildCreateJobPayload,
  buildJobParam,
  buildUpdateJobPayload,
} from './task-job-payload';

const taskForm = useTaskFormStore();
const groups = ref<TaskApi.AutoTaskGroupItem[]>([]);
const fetchCallback = ref<(() => Promise<void>) | null>(null);
const formRef = ref<FormInstance>();

const [CronModal, cronModalApi] = useVbenModal({
  connectedComponent: CronModalComp,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    try {
      await formRef.value?.validate();
      modalApi.lock();
      await onSubmitJob();
      modalApi.close();
    } catch {
      // validation failed
    } finally {
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = modalApi.getData<{
        fetchData: () => Promise<void>;
        groups: TaskApi.AutoTaskGroupItem[];
      }>();

      if (data) {
        groups.value = data.groups ?? [];
        fetchCallback.value = data.fetchData ?? null;
      }
    }
  },
});

function openCronModal() {
  cronModalApi
    .setData({
      cron: taskForm.values.jobState.cron || '* * * * *',
      onOk: (val: string) => taskForm.setFieldValue('jobState.cron', val),
    })
    .open();
}

const groupOptions = computed(() =>
  (groups.value ?? []).map((g) => ({ label: g.Name, value: g.Sysid })),
);

const jobTypeOptions = [
  { label: 'HttpRequest', value: JobType.HttpRequest },
  { label: 'AutoReport', value: JobType.AutoReport },
  { label: '可执行程序', value: JobType.EXE },
  { label: 'DLL类库', value: JobType.DLL },
  { label: '脚本', value: JobType.SCRIPT },
];

const groupIdModel = computed({
  get: () => {
    const v = taskForm.values.jobState.groupId;
    return v && Number(v) > 0 ? Number(v) : undefined;
  },
  set: (val: unknown) => {
    taskForm.setFieldValue('jobState.groupId', Number(val));
  },
});

async function onSubmitJob() {
  const values = taskForm.values;
  const autoReportTypes = taskForm.getAutoReportTypes();
  const param = buildJobParam(values, autoReportTypes);

  if (values.jobState.type !== JobOperateType.EDIT) {
    const res = await createJobApi(buildCreateJobPayload(values, param));
    if (!res.Success) {
      message.error(res.Message);
      throw new Error(res.Message);
    }
    message.success('新增成功');
  }

  if (values.jobState.type === JobOperateType.EDIT) {
    const res = await updateJobApi(buildUpdateJobPayload(values, param));
    if (!res.Success) {
      message.error(res.Message);
      throw new Error(res.Message);
    }
    message.success('修改成功');
  }

  if (fetchCallback.value) {
    await fetchCallback.value();
  }
}
</script>

<template>
  <Modal :title="taskForm.jobState.title" class="w-[90%]">
    <Form
      ref="formRef"
      :model="taskForm.values"
      layout="vertical"
      class="h-full w-full"
      :validate-trigger="[]"
    >
      <div class="w-full overflow-y-auto p-4">
        <div class="flex w-full flex-col gap-4 sm:flex-row">
          <div class="w-full space-y-3 sm:w-96 sm:shrink-0">
            <Divider>基础信息</Divider>

            <FormItem
              label="任务名称"
              name="jobState.jobName"
              :rules="[{ required: true, message: '请输入任务名称' }]"
              class="mb-4"
            >
              <Input
                v-model:value="taskForm.values.jobState.jobName"
                :disabled="
                  taskForm.values.jobState.type === JobOperateType.EDIT
                "
              />
            </FormItem>

            <FormItem
              label="所属分组"
              name="jobState.groupId"
              :rules="[{ required: true, message: '请选择所属分组' }]"
              class="mb-4"
            >
              <Select
                v-model:value="groupIdModel"
                :options="groupOptions"
                show-search
                option-filter-prop="label"
                placeholder="请选择"
              />
            </FormItem>

            <FormItem
              label="任务类型"
              name="jobState.jobType"
              :rules="[
                {
                  required: taskForm.values.jobState.jobStatus,
                  message: '请选择任务类型',
                },
              ]"
              class="mb-4"
            >
              <Select
                v-model:value="taskForm.values.jobState.jobType"
                :options="jobTypeOptions"
                placeholder="请选择"
              />
            </FormItem>

            <FormItem label="任务状态" name="jobState.jobStatus" class="mb-4">
              <Switch
                v-model:checked="taskForm.values.jobState.jobStatus"
                checked-children="启用"
                un-checked-children="停用"
              />
            </FormItem>

            <FormItem
              label="Cron"
              name="jobState.cron"
              :rules="[
                {
                  required: taskForm.values.jobState.jobStatus,
                  message: '请输入 Cron 表达式',
                },
              ]"
              class="mb-4"
            >
              <div class="flex gap-2">
                <Input v-model:value="taskForm.values.jobState.cron" />
                <Button @click="openCronModal">编辑</Button>
              </div>
            </FormItem>

            <FormItem
              label="开始时间"
              name="jobState.startTime"
              :rules="[
                {
                  required: taskForm.values.jobState.jobStatus,
                  message: '请选择开始时间',
                },
              ]"
              class="mb-4"
            >
              <DatePicker
                v-model:value="taskForm.values.jobState.startTime"
                show-time
                class="w-full"
              />
            </FormItem>

            <FormItem label="结束时间" name="jobState.endTime" class="mb-4">
              <DatePicker
                v-model:value="taskForm.values.jobState.endTime"
                show-time
                class="w-full"
              />
            </FormItem>

            <FormItem
              v-if="taskForm.values.jobState.jobType === JobType.AutoReport"
              label="循环语句"
              name="jobState.loopSQL"
              :rules="[
                {
                  required: taskForm.values.jobState.jobStatus,
                  message: '请输入循环语句',
                },
              ]"
              class="mb-4"
            >
              <TextArea
                v-model:value="taskForm.values.jobState.loopSQL"
                :rows="3"
              />
            </FormItem>
          </div>

          <div class="w-full min-w-0 flex-1">
            <HttpRequestForm />
            <AutoReportForm />
            <EXEForm />
            <SCRIPTForm />
            <DLLForm />
          </div>
        </div>
      </div>
    </Form>

    <CronModal />
  </Modal>
</template>
