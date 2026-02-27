<script setup lang="ts">
import type {
  FormDesignerNode,
  FormFieldSchema,
  GridLayoutSchema,
  SectionLayoutSchema,
} from '#/views/workflow/form-designer/types';

import { Button, Col, Divider, Empty, Row, Tag } from 'antdv-next';

import { $t } from '#/locales';
import FieldQuickPreview from '#/views/workflow/form-designer/components/FieldQuickPreview.vue';
import {
  resolveFieldDescription,
  resolveFieldLabel,
} from '#/views/workflow/form-designer/i18n';
import {
  getFieldComponentLabel,
  getMaterialByKey,
  isFieldMaterial,
  isFieldNode,
  isLayoutMaterial,
  isLayoutNode,
} from '#/views/workflow/form-designer/types';

defineOptions({
  name: 'CanvasNodeItem',
});

interface Props {
  node: FormDesignerNode;
  selectedId?: string;
  siblingCount: number;
  siblingIndex: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'add-layout-field': [{ layoutId: string; materialKey: string; targetColumnId?: string }];
  'move-offset': [{ id: string; offset: number }];
  remove: [id: string];
  select: [id?: string];
}>();

function handleSelect(id: string) {
  if (props.selectedId === id) {
    emit('select', undefined);
    return;
  }
  emit('select', id);
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

function handleLayoutDrop(event: DragEvent, layoutId: string, targetColumnId?: string) {
  event.preventDefault();
  event.stopPropagation();

  const payload = parseDragPayload(event);
  if (!payload || payload.source !== 'material' || !payload.materialKey) return;

  const material = getMaterialByKey(payload.materialKey);
  if (!material || (!isFieldMaterial(material) && !isLayoutMaterial(material))) return;

  emit('add-layout-field', {
    layoutId,
    materialKey: payload.materialKey,
    targetColumnId,
  });
}

function getLayoutLabel(layoutType: 'Divider' | 'Grid' | 'Section' | 'Table') {
  switch (layoutType) {
    case 'Section':
      return 'Section';
    case 'Grid':
      return 'Grid';
    case 'Table':
      return 'Table';
    case 'Divider':
    default:
      return 'Divider';
  }
}

function getFieldTitle(field: FormFieldSchema) {
  return resolveFieldLabel(field);
}

function getFieldDescription(field: FormFieldSchema) {
  return resolveFieldDescription(field);
}

function getNodeTitle(node: FormDesignerNode) {
  if (isFieldNode(node)) {
    return getFieldTitle(node);
  }
  return node.label;
}

function getGridColProps(count: number) {
  if (count === 3) {
    return {
      lg: 8,
      md: 12,
      sm: 24,
      xs: 24,
    };
  }

  return {
    lg: 12,
    md: 12,
    sm: 24,
    xs: 24,
  };
}
</script>

<template>
  <div
    :class="[
      'rounded-md border bg-background p-3 transition',
      props.selectedId === props.node.id ? 'border-primary ring-1 ring-primary/40' : 'border-border',
    ]"
    :style="
      isLayoutNode(props.node) && props.node.layoutType !== 'Divider' && props.node.backgroundColor
        ? { backgroundColor: props.node.backgroundColor }
        : undefined
    "
    @click.stop="handleSelect(props.node.id)"
  >
    <div class="mb-2 space-y-2">
      <div class="flex min-w-0 flex-wrap items-center gap-2">
        <Tag v-if="isFieldNode(props.node)" size="small">
          {{ getFieldComponentLabel(props.node.component) }}
        </Tag>
        <Tag v-else size="small" color="processing">
          {{ getLayoutLabel(props.node.layoutType) }}
        </Tag>
        <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ getNodeTitle(props.node) }}</span>
        <Tag v-if="isFieldNode(props.node) && props.node.required" size="small" color="error">
          Required
        </Tag>
      </div>

      <div class="flex flex-wrap items-center justify-end gap-1" @click.stop>
        <Button
          size="small"
          :disabled="props.siblingIndex === 0"
          @click="emit('move-offset', { id: props.node.id, offset: -1 })"
        >
          {{ $t('workflow.formDesigner.canvas.moveUp') }}
        </Button>
        <Button
          size="small"
          :disabled="props.siblingIndex === props.siblingCount - 1"
          @click="emit('move-offset', { id: props.node.id, offset: 1 })"
        >
          {{ $t('workflow.formDesigner.canvas.moveDown') }}
        </Button>
        <Button size="small" danger @click="emit('remove', props.node.id)">{{ $t('workflow.formDesigner.canvas.delete') }}</Button>
      </div>
    </div>

    <template v-if="isFieldNode(props.node)">
      <div class="rounded-md border border-dashed border-border p-2">
        <div v-if="getFieldDescription(props.node)" class="mb-2 text-xs text-muted-foreground">
          {{ getFieldDescription(props.node) }}
        </div>
        <div class="mb-2 text-xs text-muted-foreground">Field: {{ props.node.fieldName }}</div>
        <FieldQuickPreview :field="props.node" />
      </div>
    </template>

    <template v-else-if="props.node.layoutType === 'Section'">
      <div class="mb-2 text-xs text-muted-foreground">
        {{ props.node.description || 'Drop fields or layouts into this section' }}
      </div>
      <div
        class="space-y-2 rounded border border-dashed border-border p-2"
        :style="props.node.backgroundColor ? { backgroundColor: props.node.backgroundColor } : undefined"
        @dragover.prevent
        @drop="handleLayoutDrop($event, props.node.id)"
      >
        <Empty v-if="props.node.children.length === 0" description="Drop material here" />

        <CanvasNodeItem
          v-for="(child, childIndex) in (props.node as SectionLayoutSchema).children"
          v-else
          :key="child.id"
          :node="child"
          :selected-id="props.selectedId"
          :sibling-index="childIndex"
          :sibling-count="props.node.children.length"
          @add-layout-field="(payload) => emit('add-layout-field', payload)"
          @move-offset="(payload) => emit('move-offset', payload)"
          @remove="(id) => emit('remove', id)"
          @select="(id) => emit('select', id)"
        />
      </div>
    </template>

    <template v-else-if="props.node.layoutType === 'Grid'">
      <div class="mb-2 text-xs text-muted-foreground">Drop fields or layouts into a column</div>
      <Row :gutter="(props.node as GridLayoutSchema).gap">
        <Col
          v-for="column in (props.node as GridLayoutSchema).columns"
          :key="column.id"
          v-bind="getGridColProps((props.node as GridLayoutSchema).columns.length)"
        >
          <div
            class="h-full rounded border border-dashed border-border p-2"
            :style="props.node.backgroundColor ? { backgroundColor: props.node.backgroundColor } : undefined"
            @dragover.prevent
            @drop="handleLayoutDrop($event, props.node.id, column.id)"
          >
            <div class="mb-2 text-xs font-medium text-muted-foreground">{{ column.title }}</div>
            <Empty v-if="column.children.length === 0" description="Drop material here" />

            <div v-else class="space-y-2">
              <CanvasNodeItem
                v-for="(child, childIndex) in column.children"
                :key="child.id"
                :node="child"
                :selected-id="props.selectedId"
                :sibling-index="childIndex"
                :sibling-count="column.children.length"
                @add-layout-field="(payload) => emit('add-layout-field', payload)"
                @move-offset="(payload) => emit('move-offset', payload)"
                @remove="(id) => emit('remove', id)"
                @select="(id) => emit('select', id)"
              />
            </div>
          </div>
        </Col>
      </Row>
    </template>

    <template v-else-if="props.node.layoutType === 'Table'">
      <div class="mb-2 text-xs text-muted-foreground">Table rows are editable in preview mode</div>
      <div v-if="props.node.columns.length === 0" class="rounded border border-dashed border-border p-4">
        <Empty description="Configure table columns in properties panel" />
      </div>

      <div
        v-else
        class="overflow-hidden rounded border border-border"
        :style="props.node.backgroundColor ? { backgroundColor: props.node.backgroundColor } : undefined"
      >
        <div
          class="grid border-b border-border bg-muted/40"
          :style="{ gridTemplateColumns: `repeat(${props.node.columns.length}, minmax(0, 1fr))` }"
        >
          <div
            v-for="column in props.node.columns"
            :key="column.id"
            class="border-r border-border px-2 py-1 text-xs font-medium last:border-r-0"
          >
            {{ column.title }}
          </div>
        </div>
        <div
          v-for="rowIndex in Math.max(1, Math.min(props.node.rows.length, 2))"
          :key="`row_${rowIndex}`"
          class="grid border-b border-border last:border-b-0"
          :style="{ gridTemplateColumns: `repeat(${props.node.columns.length}, minmax(0, 1fr))` }"
        >
          <div
            v-for="column in props.node.columns"
            :key="`cell_${rowIndex}_${column.id}`"
            class="border-r border-border px-2 py-1 text-xs text-muted-foreground last:border-r-0"
          >
            {{ props.node.rows[rowIndex - 1]?.[column.dataIndex] || '...' }}
          </div>
        </div>
      </div>
      <div class="mt-2 text-xs text-muted-foreground">
        Columns: {{ props.node.columns.length }}, Rows: {{ props.node.rows.length }}
      </div>
    </template>

    <template v-else-if="props.node.layoutType === 'Divider'">
      <Divider :dashed="Boolean(props.node.dashed)">{{ props.node.label }}</Divider>
    </template>
  </div>
</template>
