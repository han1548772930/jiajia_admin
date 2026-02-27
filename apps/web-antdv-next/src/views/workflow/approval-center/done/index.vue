<script setup lang="ts">
import { getDoneApi } from '#/api/workflow';
import InstanceListPanel from '#/views/workflow/components/instancelistpanel.vue';
</script>

<template>
  <InstanceListPanel :fetcher="getDoneApi" page-title="已办审批" />
</template>
