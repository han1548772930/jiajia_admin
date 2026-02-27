<template>
  <div class="w-1/2 px-2 py-1">
    <div class="flex h-16 cursor-pointer items-center rounded-[5px] px-2" @click="handleClick">
      <div
        class="mr-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-solid text-2xl text-[#ff943e]"
        :style="{ color: material.color }"
      >
        <component :is="iconComponent" v-if="iconComponent" />
      </div>
      {{ material.label }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IWorkFlowNode } from '#/views/workflow/designer/interfaces';
import type { INodeMaterial } from '#/views/workflow/designer/interfaces/material';
import useNodeStore from '#/store/workflow/node';
import { createUuid } from '#/views/workflow/designer/utils/create-uuid';

const props = defineProps<{
  material: INodeMaterial;
  nodeId: string;
  onClick?: () => void;
}>();

const nodeStore = useNodeStore();
const iconComponent = props.material.icon;

function buildNodeFromMaterial(material: INodeMaterial): IWorkFlowNode | null {
  const name = material.label;

  if (material.defaultConfig) {
    const baseConfig = structuredClone(material.defaultConfig);
    return { ...baseConfig, id: createUuid(), name } as IWorkFlowNode;
  }

  if (material.createDefault) {
    return { ...material.createDefault(), name };
  }

  return null;
}

const handleClick = () => {
  const nextNode = buildNodeFromMaterial(props.material);
  if (!nextNode) {
    console.error('Material no defaultConfig or createDefault');
    return;
  }

  nodeStore.addNode(props.nodeId, nextNode);
  props.onClick?.();
};
</script>
