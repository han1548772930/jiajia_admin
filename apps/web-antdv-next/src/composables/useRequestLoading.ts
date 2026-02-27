import { computed, ref } from 'vue';

interface RequestLoadingOptions {
  onError?: (error: unknown) => void;
  rethrow?: boolean;
}

export function useRequestLoading() {
  const pendingCount = ref(0);

  const loading = computed(() => pendingCount.value > 0);

  async function run<T>(request: () => Promise<T>): Promise<T>;
  async function run<T>(
    request: () => Promise<T>,
    options: RequestLoadingOptions & { rethrow?: true },
  ): Promise<T>;
  async function run<T>(
    request: () => Promise<T>,
    options: RequestLoadingOptions & { rethrow: false },
  ): Promise<T | undefined>;
  async function run<T>(
    request: () => Promise<T>,
    options?: RequestLoadingOptions,
  ): Promise<T | undefined> {
    pendingCount.value += 1;
    try {
      return await request();
    } catch (error) {
      options?.onError?.(error);
      if (options?.rethrow === false) {
        return undefined;
      }
      throw error;
    } finally {
      pendingCount.value = Math.max(0, pendingCount.value - 1);
    }
  }

  function reset() {
    pendingCount.value = 0;
  }

  return {
    loading,
    reset,
    run,
  };
}
