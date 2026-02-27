<template>
  <Card class="mt-4">
    <div class="text-sm text-muted-foreground mb-1">Cron 表达式</div>
    <div class="font-mono text-lg font-bold text-foreground select-all">{{ expression }}</div>
  </Card>
</template>

<script setup lang="ts">
import { Card } from 'antdv-next';

defineProps<{ expression: string }>();
</script>
