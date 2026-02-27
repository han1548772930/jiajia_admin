<template>
  <div class="flex h-12 items-center justify-start">
    <Space>
      <Button @click="props.onCancel">{{ '取消' }}</Button>
      <Button type="primary" @click="props.onConfirm">{{ '确认' }}</Button>
    </Space>
  </div>
</template>

<script setup lang="ts">
import { Button, Space } from 'antdv-next';

const props = defineProps<{
  onCancel: () => void;
  onConfirm: () => void;
}>();
</script>
