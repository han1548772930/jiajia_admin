import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useTaskLogStore = defineStore('task-log', () => {
  const jobId = ref<null | number>(null);

  function $reset() {
    jobId.value = null;
  }

  return { $reset, jobId };
});
