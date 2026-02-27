<template>
  <div class="flex w-[360px] flex-wrap">
    <MaterialItem
      v-for="(material, index) in materials"
      :key="getMaterialKey(material, index)"
      :node-id="nodeId"
      :material="material"
      @click="onClickMaterial"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { INodeMaterial } from '#/views/workflow/designer/interfaces/material';
import useNodeStore from '#/store/workflow/node';
import MaterialItem from '#/views/workflow/designer/components/nodes/addbutton/materialitem.vue';

const props = defineProps<{
  nodeId: string;
  onClickMaterial: () => void;
}>();

const nodeStore = useNodeStore();

const materials = computed(() => nodeStore.materials.filter((material) => !material.hidden));

const onClickMaterial = () => {
  props.onClickMaterial();
};

const getMaterialKey = (material: INodeMaterial, index: number) => {
  return material.defaultConfig?.nodeType
    ? `${material.defaultConfig.nodeType}-${index}`
    : `${material.label}-${index}`;
};
</script>
