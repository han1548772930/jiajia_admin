<template>
  <div class="priority absolute right-0 top-0">{{ `优先级${props.index + 1}` }}</div>
</template>

<script setup lang="ts">
const props = defineProps<{
  index: number;
}>();
</script>
