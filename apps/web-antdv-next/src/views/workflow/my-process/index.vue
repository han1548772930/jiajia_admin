<script setup lang="ts">
import { getMyBillApi } from '#/api/workflow';
import InstanceListPanel from '#/views/workflow/components/instancelistpanel.vue';
</script>

<template>
  <InstanceListPanel :fetcher="getMyBillApi" page-title="我的流程" />
</template>
