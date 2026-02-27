<template>
  <div
    class="relative z-[1] inline-flex w-[240px] grow shrink-0 before:absolute before:inset-0 before:z-[-1] before:m-auto before:h-full before:w-[2px] before:bg-[#cacaca] before:content-['']"
  >
    <div class="flex w-[240px] grow shrink-0 justify-center px-0 pt-5 pb-8 select-none">
      <Popover v-model:open="open" placement="rightTop" trigger="click">
        <template #content>
          <ContentPanel :node-id="props.nodeId" :on-click-material="handleMaterialClick" />
        </template>
        <div
          class="relative flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-full border-0 bg-[rgb(22,119,255)] text-[20px] leading-7 text-white shadow-[0_2px_4px_0_rgba(0,0,0,0.1)] transition-all duration-300 [transition-timing-function:cubic-bezier(0.645,0.045,0.355,1)] hover:scale-[1.3] hover:shadow-[0_13px_27px_0_rgba(0,0,0,0.1)] active:scale-100 active:shadow-[0_2px_4px_0_rgba(0,0,0,0.1)]"
        >
          <IconifyIcon icon="lucide:plus" class="text-[20px]" />
        </div>
      </Popover>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { Popover } from 'antdv-next';

import ContentPanel from './contentpanel.vue';

const props = defineProps<{
  nodeId: string;
}>();

const open = ref(false);

const handleMaterialClick = () => {
  open.value = false;
};
</script>
