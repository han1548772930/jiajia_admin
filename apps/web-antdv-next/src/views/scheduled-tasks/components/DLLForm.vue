<template>
  <div v-if="taskForm.values.jobState.jobType === JobType.DLL" class="w-full">
    <Divider>DLL类库</Divider>

    <FormItem
      label="绝对路径"
      name="jobState.dll.path"
      :rules="[{ required: taskForm.values.jobState.jobStatus, message: '请输入绝对路径' }]"
      class="mb-4"
    >
      <TextArea v-model:value="taskForm.values.jobState.dll.path" :rows="2" />
    </FormItem>
    
    <FormItem label="全限定名称" name="jobState.dll.fullClassName" class="mb-4">
      <TextArea v-model:value="taskForm.values.jobState.dll.fullClassName" :rows="2" />
    </FormItem>
    
    <FormItem label="方法名称" name="jobState.dll.methodName" class="mb-4">
      <TextArea v-model:value="taskForm.values.jobState.dll.methodName" :rows="2" />
    </FormItem>
    
    <FormItem label="方法参数" name="jobState.dll.methodParam" class="mb-4">
      <TextArea v-model:value="taskForm.values.jobState.dll.methodParam" :rows="2" />
    </FormItem>
  </div>
</template>

<script setup lang="ts">
import { Divider, FormItem, TextArea } from 'antdv-next';
import { JobType } from '#/api/task';
import { useTaskFormStore } from '#/store/task-form';

const taskForm = useTaskFormStore();
</script>
