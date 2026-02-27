<template>
  <div v-if="taskForm.values.jobState.jobType === JobType.SCRIPT" class="w-full">
    <Divider>脚本</Divider>

    <FormItem
      label="绝对路径"
      name="jobState.script.path"
      :rules="[{ required: taskForm.values.jobState.jobStatus, message: '请输入绝对路径' }]"
      class="mb-4"
    >
      <TextArea v-model:value="taskForm.values.jobState.script.path" :rows="2" />
    </FormItem>
    
    <FormItem label="脚本参数" name="jobState.script.arguments" class="mb-4">
      <TextArea v-model:value="taskForm.values.jobState.script.arguments" :rows="2" />
    </FormItem>
  </div>
</template>

<script setup lang="ts">
import { Divider, FormItem, TextArea } from 'antdv-next';
import { JobType } from '#/api/task';
import { useTaskFormStore } from '#/store/task-form';

const taskForm = useTaskFormStore();
</script>
