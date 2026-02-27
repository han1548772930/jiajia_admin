<template>
  <div v-if="taskForm.values.jobState.jobType === JobType.HttpRequest" class="w-full">
    <Divider>HttpRequest</Divider>

    <FormItem label="请求方式" name="jobState.httpRequest.requestType"
      :rules="[{ required: taskForm.values.jobState.jobStatus, message: '请选择请求方式' }]" class="mb-4">
      <Select v-model:value="taskForm.values.jobState.httpRequest.requestType" :options="requestTypeOptions"
        placeholder="请选择" />
    </FormItem>

    <FormItem label="请求地址" name="jobState.httpRequest.url"
      :rules="[{ required: taskForm.values.jobState.jobStatus, message: '请输入请求地址' }]" class="mb-4">
      <Input v-model:value="taskForm.values.jobState.httpRequest.url" />
    </FormItem>

    <FormItem v-if="taskForm.values.jobState.httpRequest.requestType === RequestType.POST" label="请求体"
      name="jobState.httpRequest.postParam" class="mb-4">
      <TextArea v-model:value="taskForm.values.jobState.httpRequest.postParam" :rows="3" />
    </FormItem>

    <!-- 请求头列表 -->
    <div v-for="(f, idx) in taskForm.values.jobState.httpRequest.headers" :key="idx"
      class="flex items-start gap-2 mb-2">
      <FormItem :label="`参数${idx + 1}`" :name="`jobState.httpRequest.headers.${idx}.key`" class="mb-0 flex-1">
        <Input v-model:value="f.key" />
      </FormItem>
      <FormItem :name="`jobState.httpRequest.headers.${idx}.value`" class="mb-0 flex-1" label=" ">
        <Input v-model:value="f.value" />
      </FormItem>
      <div class="shrink-0 mt-auto">
        <Button type="text" danger @click="taskForm.removeHeader(idx)">
          <template #icon>
            <IconifyIcon icon="ant-design:close-circle-outlined" />
          </template>
        </Button>
      </div>
    </div>

    <FormItem label="请求头" class="mb-4">
      <Button @click.prevent="() => taskForm.pushHeader({ key: '', value: '' })">
        添加参数
      </Button>
    </FormItem>
  </div>
</template>

<script setup lang="ts">
import { Button, Divider, FormItem, Input, Select, TextArea } from 'antdv-next';
import { IconifyIcon } from '@vben/icons';
import { JobType, RequestType } from '#/api/task';
import { useTaskFormStore } from '#/store/task-form';

const taskForm = useTaskFormStore();

const requestTypeOptions = [
  { label: 'GET', value: RequestType.GET },
  { label: 'POST', value: RequestType.POST },
];
</script>
