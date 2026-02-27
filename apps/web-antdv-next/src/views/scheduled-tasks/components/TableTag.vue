<script setup lang="ts">
import type { ICellRendererParams } from 'ag-grid-community';

import { Tag } from 'antdv-next';

import { getJobStatusColor, getJobStatusLabel } from '../helpers';

defineOptions({
  name: 'TableTag',
});
defineProps<{
  params: ICellRendererParams;
}>();
</script>

<template>
  <Tag :color="getJobStatusColor(params.data.JobStatus)">
    {{ getJobStatusLabel(params.data.JobStatus) }}
  </Tag>
</template>
