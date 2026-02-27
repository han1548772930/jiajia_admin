<template>
  <div class="absolute right-0 top-0 flex">{{ `优先级${props.index + 1}` }}</div>
</template>

<script setup lang="ts">
const props = defineProps<{
  index: number;
}>();
</script>
