<script setup lang="ts">
import type { FormDesignerNode } from '#/views/workflow/form-designer/types';

import { $t } from '#/locales';
import CanvasNodeItem from '#/views/workflow/form-designer/components/CanvasNodeItem.vue';

interface Props {
  nodes: FormDesignerNode[];
  selectedId?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'add-layout-field': [{ layoutId: string; materialKey: string; targetColumnId?: string }];
  'add-root-material': [{ beforeNodeId?: string; materialKey: string }];
  'move-offset': [{ id: string; offset: number }];
  'move-root-node': [{ fromNodeId: string; toNodeId?: string }];
  remove: [id: string];
  select: [id?: string];
}>();

function clearSelection() {
  emit('select', undefined);
}

function parseDragPayload(event: DragEvent): null | {
  materialKey?: string;
  nodeId?: string;
  source: 'canvas-root-node' | 'material';
} {
  const raw = event.dataTransfer?.getData('application/json');
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function handleRootDrop(event: DragEvent) {
  event.preventDefault();
  const payload = parseDragPayload(event);
  if (!payload) return;

  if (payload.source === 'material' && payload.materialKey) {
    emit('add-root-material', { materialKey: payload.materialKey });
    return;
  }

  if (payload.source === 'canvas-root-node' && payload.nodeId) {
    emit('move-root-node', { fromNodeId: payload.nodeId });
  }
}

function handleNodeDrop(event: DragEvent, targetNodeId: string) {
  event.preventDefault();
  event.stopPropagation();
  const payload = parseDragPayload(event);
  if (!payload) return;

  if (payload.source === 'material' && payload.materialKey) {
    emit('add-root-material', {
      beforeNodeId: targetNodeId,
      materialKey: payload.materialKey,
    });
    return;
  }

  if (payload.source === 'canvas-root-node' && payload.nodeId && payload.nodeId !== targetNodeId) {
    emit('move-root-node', {
      fromNodeId: payload.nodeId,
      toNodeId: targetNodeId,
    });
  }
}

function handleRootDragStart(event: DragEvent, nodeId: string) {
  if (!event.dataTransfer) return;

  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData(
    'application/json',
    JSON.stringify({
      nodeId,
      source: 'canvas-root-node',
    }),
  );
}
</script>

<template>
  <div class="flex h-full flex-col p-3">
    <div class="mb-3 text-sm text-muted-foreground">
      {{ $t('workflow.formDesigner.canvas.dragHint') }}
    </div>

    <div
      class="flex-1 overflow-auto rounded-md border border-dashed border-border bg-muted/20 p-3"
      @dragover.prevent
      @drop="handleRootDrop"
      @click="clearSelection"
    >
      <div v-if="props.nodes.length === 0" class="flex h-full items-center justify-center text-muted-foreground">
        {{ $t('workflow.formDesigner.canvas.dropHere') }}
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="(node, rootIndex) in props.nodes"
          :key="node.id"
          draggable="true"
          @dragstart="handleRootDragStart($event, node.id)"
          @dragover.prevent
          @drop="handleNodeDrop($event, node.id)"
        >
          <CanvasNodeItem
            :node="node"
            :selected-id="props.selectedId"
            :sibling-index="rootIndex"
            :sibling-count="props.nodes.length"
            @add-layout-field="(payload) => emit('add-layout-field', payload)"
            @move-offset="(payload) => emit('move-offset', payload)"
            @remove="(id) => emit('remove', id)"
            @select="(id) => emit('select', id)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
