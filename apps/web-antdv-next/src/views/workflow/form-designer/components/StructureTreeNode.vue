<script setup lang="ts">
import type { FormDesignerNode } from '#/views/workflow/form-designer/types';

import { Tag } from 'antdv-next';

import { $t } from '#/locales';
import {
  getFieldComponentLabel,
  isFieldNode,
  isLayoutNode,
} from '#/views/workflow/form-designer/types';

defineOptions({
  name: 'StructureTreeNode',
});

interface Props {
  keyword?: string;
  level: number;
  node: FormDesignerNode;
  selectedId?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  select: [id: string];
}>();

function nodeLabel(node: FormDesignerNode) {
  if (isFieldNode(node)) {
    return `${node.label || node.fieldName} (${node.fieldName})`;
  }
  return node.label;
}

function nodeTypeLabel(node: FormDesignerNode) {
  if (isFieldNode(node)) {
    return getFieldComponentLabel(node.component);
  }
  return node.layoutType;
}

function matchesText(text: string, keyword: string) {
  if (!keyword) return true;
  return text.toLowerCase().includes(keyword.toLowerCase());
}

function fieldMatch(node: FormDesignerNode, keyword: string) {
  if (!isFieldNode(node)) return false;
  const text = [
    node.label,
    node.fieldName,
    node.component,
    getFieldComponentLabel(node.component),
  ].join(' ');
  return matchesText(text, keyword);
}

function layoutMatch(node: FormDesignerNode, keyword: string) {
  if (!isLayoutNode(node)) return false;
  const text = [node.label, node.layoutType].join(' ');
  return matchesText(text, keyword);
}

function hasMatchedDescendant(node: FormDesignerNode, keyword: string): boolean {
  if (!keyword) return true;
  if (isFieldNode(node)) return fieldMatch(node, keyword);
  if (layoutMatch(node, keyword)) return true;

  if (node.layoutType === 'Section') {
    return node.children.some((child) => hasMatchedDescendant(child, keyword));
  }

  if (node.layoutType === 'Grid') {
    return node.columns.some((column) => {
      if (matchesText(column.title, keyword)) return true;
      return column.children.some((child) => hasMatchedDescendant(child, keyword));
    });
  }

  return false;
}

function shouldRenderNode(node: FormDesignerNode, keyword: string) {
  return hasMatchedDescendant(node, keyword);
}

function shouldRenderColumn(
  column: { children: FormDesignerNode[]; title: string },
  keyword: string,
) {
  if (!keyword) return true;
  if (matchesText(column.title, keyword)) return true;
  return column.children.some((child) => hasMatchedDescendant(child, keyword));
}
</script>

<template>
  <template v-if="shouldRenderNode(props.node, props.keyword || '')">
    <div
      :class="[
        'mb-1 flex cursor-pointer items-center justify-between rounded px-2 py-1 text-xs transition',
        props.selectedId === props.node.id ? 'bg-primary/15 text-primary' : 'hover:bg-muted/60',
      ]"
      :style="{ paddingLeft: `${Math.max(0, props.level) * 12 + 8}px` }"
      @click.stop="emit('select', props.node.id)"
    >
      <span class="truncate">{{ nodeLabel(props.node) }}</span>
      <Tag size="small">{{ nodeTypeLabel(props.node) }}</Tag>
    </div>

    <template v-if="isLayoutNode(props.node) && props.node.layoutType === 'Section'">
      <StructureTreeNode
        v-for="child in props.node.children"
        :key="child.id"
        :node="child"
        :level="props.level + 1"
        :selected-id="props.selectedId"
        :keyword="props.keyword"
        @select="(id) => emit('select', id)"
      />
    </template>

    <template v-if="isLayoutNode(props.node) && props.node.layoutType === 'Grid'">
      <template v-for="column in props.node.columns" :key="column.id">
        <div
          v-if="shouldRenderColumn(column, props.keyword || '')"
          class="mb-1 rounded px-2 py-1 text-[11px] text-muted-foreground"
          :style="{ paddingLeft: `${(props.level + 1) * 12 + 8}px` }"
        >
          {{ $t('workflow.formDesigner.structureTree.columnPrefix') }}: {{ column.title }}
        </div>
        <StructureTreeNode
          v-for="child in column.children"
          :key="child.id"
          :node="child"
          :level="props.level + 2"
          :selected-id="props.selectedId"
          :keyword="props.keyword"
          @select="(id) => emit('select', id)"
        />
      </template>
    </template>
  </template>
</template>
