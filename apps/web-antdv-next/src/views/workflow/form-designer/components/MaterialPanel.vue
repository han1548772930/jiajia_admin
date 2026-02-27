<script setup lang="ts">
import type { FormDesignerNode } from '#/views/workflow/form-designer/types';

import { computed, reactive, ref } from 'vue';

import { Input, Tabs } from 'antdv-next';

import { $t } from '#/locales';
import MaterialCategory from '#/views/workflow/form-designer/components/MaterialCategory.vue';
import StructureTreePanel from '#/views/workflow/form-designer/components/StructureTreePanel.vue';
import {
  FORM_MATERIALS,
  MATERIAL_CATEGORIES,
} from '#/views/workflow/form-designer/types';

interface Props {
  nodes?: FormDesignerNode[];
  selectedId?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  add: [materialKey: string];
  select: [id: string];
}>();

const activeTab = ref<'components' | 'tree'>('components');
const keyword = ref('');
const tabItems = computed(() => [
  { key: 'components', label: $t('workflow.formDesigner.material.tabComponents') },
  { key: 'tree', label: $t('workflow.formDesigner.material.tabTree') },
]);

const collapsedMap = reactive<Record<string, boolean>>(
  Object.fromEntries(MATERIAL_CATEGORIES.map((item) => [item.key, false])),
);

const groupedMaterials = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  const filtered = FORM_MATERIALS.filter((item) => {
    if (!kw) return true;
    return (
      item.label.toLowerCase().includes(kw) ||
      item.description.toLowerCase().includes(kw)
    );
  });

  return MATERIAL_CATEGORIES.map((category) => ({
    key: category.key,
    label: category.label,
    materials: filtered.filter((item) => item.category === category.key),
  })).filter((item) => item.materials.length > 0);
});

function toggleCategory(key: string) {
  collapsedMap[key] = !collapsedMap[key];
}
</script>

<template>
  <div class="flex h-full flex-col p-3">
    <Tabs v-model:activeKey="activeTab" class="mb-2" :items="tabItems" />

    <div v-if="activeTab === 'components'" class="flex min-h-0 flex-1 flex-col">
      <div class="mb-2 text-sm text-muted-foreground">{{ $t('workflow.formDesigner.material.dragHint') }}</div>
      <Input
        v-model:value="keyword"
        class="mb-3"
        :placeholder="$t('workflow.formDesigner.material.searchPlaceholder')"
        allow-clear
      />

      <div class="min-h-0 flex-1 space-y-2 overflow-auto">
        <MaterialCategory
          v-for="group in groupedMaterials"
          :key="group.key"
          :title="group.label"
          :category-label="group.label"
          :materials="group.materials"
          :collapsed="collapsedMap[group.key]"
          @add="(materialKey) => emit('add', materialKey)"
          @toggle="toggleCategory(group.key)"
        />
      </div>
    </div>

    <div v-else class="min-h-0 flex-1">
      <div class="h-full rounded border border-border p-2">
        <StructureTreePanel
          :nodes="props.nodes ?? []"
          :selected-id="props.selectedId"
          @select="(id) => emit('select', id)"
        />
      </div>
    </div>
  </div>
</template>
