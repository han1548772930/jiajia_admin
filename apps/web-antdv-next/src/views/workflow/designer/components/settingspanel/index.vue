<template>
  <Drawer>
    <div class="flex h-full flex-col">
      <div class="flex min-h-[52px] items-center border-b border-[hsl(var(--border))] px-4 py-3">
        <NodeTitle v-if="selectNode" :node="selectNode" :on-name-change="handleNameChange" />
      </div>
      <div v-if="materialUi?.settersPanel" class="flex-1 overflow-auto p-3">
        <component :is="materialUi.settersPanel" />
      </div>
    </div>

    <template #footer>
      <Footer :on-cancel="handleClose" :on-confirm="handleConfirm" />
    </template>
  </Drawer>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import Footer from '#/views/workflow/designer/components/settingspanel/footer.vue';
import NodeTitle from '#/views/workflow/designer/components/settingspanel/nodetitlesetting.vue';
import useNodeStore from '#/store/workflow/node';

const nodeStore = useNodeStore();

const selectNodeId = computed(() => nodeStore.selectedNode);
const selectNode = computed(() => {
  return selectNodeId.value ? nodeStore.getNode(selectNodeId.value) : undefined;
});
const materialUi = computed(() => {
  return selectNode.value ? nodeStore.materialUis[selectNode.value.nodeType] : undefined;
});

const [Drawer, drawerApi] = useVbenDrawer({
  class: 'workflow-settings-drawer !w-[656px] max-w-[656px]',
  closable: false,
  contentClass: '!p-0',
  header: false,
  onOpenChange(isOpen) {
    if (!isOpen) {
      nodeStore.selectedNode = undefined;
    }
  },
  placement: 'right',
  showCancelButton: false,
  showConfirmButton: false,
});

watch(
  selectNodeId,
  (nodeId) => {
    if (nodeId) {
      drawerApi.open();
      return;
    }
    drawerApi.close();
  },
  { immediate: true },
);

const handleClose = () => {
  nodeStore.selectedNode = undefined;
};

const handleConfirm = () => {
  materialUi.value?.handleConfirm?.();
};

const handleNameChange = (name?: string) => {
  if (selectNode.value) {
    selectNode.value.name = name || '';
  }
};
</script>
