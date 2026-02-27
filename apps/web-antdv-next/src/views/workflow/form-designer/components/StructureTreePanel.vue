<script setup lang="ts">
import type { FormDesignerNode } from '#/views/workflow/form-designer/types';

import { computed, ref } from 'vue';

import { Empty, Input } from 'antdv-next';

import { $t } from '#/locales';
import StructureTreeNode from '#/views/workflow/form-designer/components/StructureTreeNode.vue';

interface Props {
  nodes: FormDesignerNode[];
  selectedId?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  select: [id: string];
}>();

const keyword = ref('');
const hasNodes = computed(() => props.nodes.length > 0);
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="mb-2 text-xs text-muted-foreground">{{ $t('workflow.formDesigner.structureTree.title') }}</div>
    <Input
      v-model:value="keyword"
      class="mb-2"
      :placeholder="$t('workflow.formDesigner.structureTree.searchPlaceholder')"
      allow-clear
    />

    <div class="min-h-0 flex-1 overflow-auto rounded border border-border p-1">
      <Empty v-if="!hasNodes" :description="$t('workflow.formDesigner.structureTree.empty')" />
      <template v-else>
        <StructureTreeNode
          v-for="node in props.nodes"
          :key="node.id"
          :node="node"
          :level="0"
          :selected-id="props.selectedId"
          :keyword="keyword"
          @select="(id) => emit('select', id)"
        />
      </template>
    </div>
  </div>
</template>
