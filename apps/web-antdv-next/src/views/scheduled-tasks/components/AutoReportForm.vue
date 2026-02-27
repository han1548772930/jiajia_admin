<template>
  <div v-if="taskForm.values.jobState.jobType === JobType.AutoReport" class="w-full">
    <Divider>AutoReport</Divider>

    <!-- 类型选择 -->
    <FormItem label="类型" class="mb-4">
      <CheckboxGroup v-model:value="autoReportModel">
        <Checkbox :value="String(AutoReportType.EMAIL)">Email</Checkbox>
        <Checkbox :value="String(AutoReportType.FTP)">FTP</Checkbox>
      </CheckboxGroup>
    </FormItem>

    <div class="w-full grid gap-4 mt-2" :class="autoReportGridClass">
      <!-- Email 部分 -->
      <div v-if="autoReportTypes.includes(AutoReportType.EMAIL)" class="min-w-0 w-full">
        <Divider>邮件信息</Divider>

        <FormItem label="主题" name="jobState.autoReportState.subject"
          :rules="[{ required: taskForm.values.jobState.jobStatus, message: '请输入主题' }]" class="mb-4">
          <Input v-model:value="taskForm.values.jobState.autoReportState.subject" />
        </FormItem>

        <FormItem label="正文" name="jobState.autoReportState.body" class="mb-4">
          <TextArea v-model:value="taskForm.values.jobState.autoReportState.body" :rows="3" />
        </FormItem>

        <FormItem label="收件人" name="jobState.autoReportState.to"
          :rules="[{ required: taskForm.values.jobState.jobStatus, message: '请输入收件人' }]" class="mb-4">
          <TextArea v-model:value="taskForm.values.jobState.autoReportState.to" :rows="2" />
        </FormItem>

        <FormItem label="抄送" name="jobState.autoReportState.cc" class="mb-4">
          <TextArea v-model:value="taskForm.values.jobState.autoReportState.cc" :rows="2" />
        </FormItem>

        <FormItem label="附件" class="mb-4">
          <Switch v-model:checked="appendixEnabled" checked-children="开启" un-checked-children="关闭" />
        </FormItem>

        <!-- 附件信息 -->
        <div v-if="taskForm.values.jobState.autoReportState.isAppendix" class="w-full">
          <Divider>附件信息</Divider>

          <div v-for="(f, idx) in taskForm.values.jobState.autoReportState.appendix" :key="idx"
            class="border-b border-dashed border-border mb-2 pb-2">
            <FormItem label="附件名称" :name="`jobState.autoReportState.appendix.${idx}.fileName`"
              :rules="[{ required: taskForm.values.jobState.jobStatus, message: '请输入附件名称' }]" class="mb-4">
              <TextArea v-model:value="f.fileName" :rows="1" />
            </FormItem>

            <FormItem label="导出SQL" :name="`jobState.autoReportState.appendix.${idx}.sql`"
              :rules="[{ required: taskForm.values.jobState.jobStatus, message: '请输入导出SQL' }]" class="mb-4">
              <TextArea v-model:value="f.sql" :rows="2" />
            </FormItem>

            <FormItem label="文件类型" :name="`jobState.autoReportState.appendix.${idx}.fileType`"
              :rules="[{ required: taskForm.values.jobState.jobStatus, message: '请选择文件类型' }]" class="mb-4">
              <div class="flex items-center gap-2">
                <Select :value="f.fileType"
                  :options="[{ label: 'xlsx', value: 'xlsx' }, { label: 'csv', value: 'csv' }]" placeholder="Select"
                  class="flex-1" @update:value="(val: any) => (f.fileType = val as 'csv' | 'xlsx')" />
                <Button type="text" danger @click="taskForm.removeAppendix(idx)">
                  <template #icon>
                    <IconifyIcon icon="ant-design:close-circle-outlined" />
                  </template>
                </Button>
              </div>
            </FormItem>

            <FormItem label="空结果发送附件" class="mb-4">
              <Switch v-model:checked="f.emptySend" checked-children="是" un-checked-children="否" />
            </FormItem>
            <FormItem label="空结果发送邮件" class="mb-4">
              <Switch v-model:checked="f.emptySendMail" checked-children="是" un-checked-children="否" />
            </FormItem>

            <template v-if="f.fileType === 'xlsx'">
              <FormItem label="附件加密" class="mb-4">
                <Switch v-model:checked="f.showPasswordSQL" checked-children="是" un-checked-children="否" />
              </FormItem>
              <FormItem v-if="f.showPasswordSQL" label="密码SQL" class="mb-4">
                <TextArea v-model:value="f.passwordSQL" :rows="2" />
              </FormItem>
            </template>
          </div>

          <FormItem label="附件" class="mb-4">
            <Button @click.prevent="
              () =>
                taskForm.pushAppendix({
                  fileName: '',
                  sql: '',
                  fileType: 'xlsx' as const,
                  emptySend: false,
                  emptySendMail: false,
                  showPasswordSQL: false,
                  passwordSQL: '',
                })
            ">
              添加附件
            </Button>
          </FormItem>
        </div>
      </div>

      <!-- FTP 部分 -->
      <div v-if="autoReportTypes.includes(AutoReportType.FTP)" class="min-w-0 w-full">
        <Divider>FTP信息</Divider>

        <FormItem label="主机" name="jobState.autoReportState.host"
          :rules="[{ required: taskForm.values.jobState.jobStatus, message: '请输入主机' }]" class="mb-4">
          <Input v-model:value="taskForm.values.jobState.autoReportState.host" />
        </FormItem>
        <FormItem label="端口" name="jobState.autoReportState.port"
          :rules="[{ required: taskForm.values.jobState.jobStatus, message: '请输入端口' }]" class="mb-4">
          <Input v-model:value="taskForm.values.jobState.autoReportState.port" />
        </FormItem>
        <FormItem label="用户名" name="jobState.autoReportState.username"
          :rules="[{ required: taskForm.values.jobState.jobStatus, message: '请输入用户名' }]" class="mb-4">
          <Input v-model:value="taskForm.values.jobState.autoReportState.username" />
        </FormItem>
        <FormItem label="密码" name="jobState.autoReportState.password"
          :rules="[{ required: taskForm.values.jobState.jobStatus, message: '请输入密码' }]" class="mb-4">
          <InputPassword v-model:value="taskForm.values.jobState.autoReportState.password" />
        </FormItem>
        <FormItem label="远程路径" name="jobState.autoReportState.remotePath"
          :rules="[{ required: taskForm.values.jobState.jobStatus, message: '请输入远程路径' }]" class="mb-4">
          <Input v-model:value="taskForm.values.jobState.autoReportState.remotePath" />
        </FormItem>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Button, Checkbox, CheckboxGroup, Divider, FormItem, Input, InputPassword, Select, Switch, TextArea } from 'antdv-next';
import { IconifyIcon } from '@vben/icons';
import { AutoReportType, JobType } from '#/api/task';
import { useTaskFormStore } from '#/store/task-form';

const taskForm = useTaskFormStore();

const autoReportTypes = computed<AutoReportType[]>(() => taskForm.getAutoReportTypes());
const autoReportModel = computed<string[]>({
  get: () => autoReportTypes.value.map(String),
  set: (val) => taskForm.setFieldValue('jobState.autoReportState.type', val),
});

const appendixEnabled = computed<boolean>({
  get: () => taskForm.values.jobState.autoReportState.isAppendix,
  set: (val: boolean) => taskForm.setFieldValue('jobState.autoReportState.isAppendix', val),
});

const autoReportGridClass = computed(() => {
  const types = autoReportTypes.value;
  const count =
    (types.includes(AutoReportType.EMAIL) ? 1 : 0) +
    (types.includes(AutoReportType.FTP) ? 1 : 0);
  return count > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1';
});
</script>
