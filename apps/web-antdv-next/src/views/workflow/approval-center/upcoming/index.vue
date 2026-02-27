<script setup lang="ts">
import { getTodoApi } from '#/api/workflow';
import InstanceListPanel from '#/views/workflow/components/instancelistpanel.vue';
</script>

<template>
  <InstanceListPanel approval-mode :fetcher="getTodoApi" page-title="待办审批" />
</template>
