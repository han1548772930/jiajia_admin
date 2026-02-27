<template>
  <div v-if="taskForm.values.jobState.jobType === JobType.EXE" class="w-full">
    <Divider>可执行程序</Divider>

    <FormItem
      label="绝对路径"
      name="jobState.exe.path"
      :rules="[{ required: taskForm.values.jobState.jobStatus, message: '请输入绝对路径' }]"
      class="mb-4"
    >
      <TextArea v-model:value="taskForm.values.jobState.exe.path" :rows="2" />
    </FormItem>
    
    <FormItem label="文件参数" name="jobState.exe.arguments" class="mb-4">
      <TextArea v-model:value="taskForm.values.jobState.exe.arguments" :rows="2" />
    </FormItem>
  </div>
</template>

<script setup lang="ts">
import { Divider, FormItem, TextArea } from 'antdv-next';
import { JobType } from '#/api/task';
import { useTaskFormStore } from '#/store/task-form';

const taskForm = useTaskFormStore();
</script>
