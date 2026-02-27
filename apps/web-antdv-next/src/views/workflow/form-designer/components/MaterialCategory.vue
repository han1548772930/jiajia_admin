<script setup lang="ts">
import type { MaterialDefinition } from '#/views/workflow/form-designer/types';

import { Button, Tag } from 'antdv-next';
import { $t } from '#/locales';

interface Props {
  categoryLabel: string;
  collapsed?: boolean;
  materials: MaterialDefinition[];
  title: string;
}

defineProps<Props>();

const emit = defineEmits<{
  add: [materialKey: string];
  toggle: [];
}>();

function handleDragStart(event: DragEvent, material: MaterialDefinition) {
  if (!event.dataTransfer) return;

  event.dataTransfer.effectAllowed = 'copy';
  event.dataTransfer.setData(
    'application/json',
    JSON.stringify({
      category: material.category,
      kind: material.kind,
      label: material.label,
      materialKey: material.key,
      source: 'material',
    }),
  );
}
</script>

<template>
  <div class="rounded-md border border-border bg-background">
    <button
      class="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium"
      type="button"
      @click="emit('toggle')"
    >
      <span>{{ title }}</span>
      <span class="text-xs text-muted-foreground">
        {{ collapsed ? $t('workflow.formDesigner.material.expand') : $t('workflow.formDesigner.material.collapse') }}
      </span>
    </button>

    <div v-if="!collapsed" class="space-y-2 border-t border-border p-2">
      <div
        v-for="item in materials"
        :key="item.key"
        class="rounded-md border border-border bg-muted/20 p-2 transition hover:border-primary"
        draggable="true"
        @dragstart="handleDragStart($event, item)"
      >
        <div class="flex items-start justify-between gap-2">
          <div>
            <div class="flex items-center gap-2 text-sm font-medium">
              <span>{{ item.label }}</span>
              <Tag size="small">{{ categoryLabel }}</Tag>
            </div>
            <div class="text-xs text-muted-foreground">{{ item.description }}</div>
          </div>
          <Button size="small" type="link" @click="emit('add', item.key)">{{ $t('workflow.formDesigner.material.add') }}</Button>
        </div>
      </div>
    </div>
  </div>
</template>
