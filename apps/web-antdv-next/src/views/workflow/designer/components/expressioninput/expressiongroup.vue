<template>
  <div class="flex min-h-[88px] items-stretch">
    <div class="relative flex w-20 items-center pr-4">
      <div
        class="absolute left-[calc(50%-8px)] h-[calc(100%-48px)] w-[30px] rounded-l-[5px] rounded-r-none border border-r-0 border-[#d9d9d9] before:absolute before:right-0 before:top-0 before:h-1.5 before:w-1.5 before:translate-x-full before:-translate-y-1/2 before:rounded-full before:border before:border-[#d9d9d9] before:content-[''] after:absolute after:right-0 after:bottom-0 after:h-1.5 after:w-1.5 after:translate-x-full after:translate-y-1/2 after:rounded-full after:border after:border-[#d9d9d9] after:content-['']"
      />
      <Select
        :value="value.groupType"
        :options="groupOptions"
        class="w-[64px]"
        @change="handleGroupTypeChange"
      />
    </div>
    <div class="flex flex-1 flex-col">
      <template v-for="(child, index) in value.children" :key="child.id">
        <ExpressionGroup
          v-if="child.nodeType === ExpressionNodeType.Group"
          :value="child as IExpressionGroup"
          :on-change="handleChildChange"
          :on-remove="() => handleRemoveChild(child.id)"
        />
        <ExpressionItem
          v-else
          :on-add-expression="() => handleAddExpAfter(index)"
          :on-add-group="(groupType) => handleAddGroupAfter(index, groupType)"
          :on-remove="() => handleRemoveChild(child.id)"
        >
          <DefaultExpressionInput
            :value="child as IExpression"
            :on-change="(val) => handleChildChange(val as IExpression)"
          />
        </ExpressionItem>
      </template>

      <div class="min-h-12" v-if="!value.children.length"></div>
      <div class="min-h-12">
        <div class="flex w-full items-center">
          <AddMenu :on-add-expression="handleAddExp" :on-add-group="handleAddGroup">
            <Button type="dashed" block>添加</Button>
          </AddMenu>
          <Button v-if="!root" type="text" danger class="ml-2" @click="handleDeleteClick">删除</Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { Button, Select } from 'antdv-next';

import {
  ExpressionGroupType,
  ExpressionNodeType,
  type IExpression,
  type IExpressionGroup,
  type IExpressionNode,
} from '#/views/workflow/designer/interfaces/setting';
import { createUuid } from '#/views/workflow/designer/utils/create-uuid';

import AddMenu from './addmenu.vue';
import DefaultExpressionInput from './defaultexpressioninput.vue';
import ExpressionItem from './expressionitem.vue';

defineOptions({ name: 'ExpressionGroup' });

const props = defineProps<{
  onChange?: (value: IExpressionGroup) => void;
  onRemove?: (nodeId: string) => void;
  root?: boolean;
  value: IExpressionGroup;
}>();

const groupOptions = computed(() => [
  { label: '且', value: ExpressionGroupType.And },
  { label: '或', value: ExpressionGroupType.Or },
]);

function createExpression(): IExpression {
  return {
    id: createUuid(),
    nodeType: ExpressionNodeType.Expression,
  };
}

function createGroup(groupType: ExpressionGroupType): IExpressionGroup {
  return {
    children: [createExpression()],
    groupType,
    id: createUuid(),
    nodeType: ExpressionNodeType.Group,
  };
}

function handleAddExp() {
  props.onChange?.({
    ...props.value,
    children: [...props.value.children, createExpression()],
  });
}

function handleAddGroup(groupType: ExpressionGroupType) {
  props.onChange?.({
    ...props.value,
    children: [...props.value.children, createGroup(groupType)],
  });
}

function handleAddExpAfter(index: number) {
  const nextChildren = [...props.value.children];
  nextChildren.splice(index + 1, 0, createExpression());
  props.onChange?.({
    ...props.value,
    children: nextChildren,
  });
}

function handleAddGroupAfter(index: number, groupType: ExpressionGroupType) {
  const nextChildren = [...props.value.children];
  nextChildren.splice(index + 1, 0, createGroup(groupType));
  props.onChange?.({
    ...props.value,
    children: nextChildren,
  });
}

function handleChildChange(node: IExpressionNode) {
  props.onChange?.({
    ...props.value,
    children: props.value.children.map((child) => (child.id === node.id ? node : child)),
  });
}

function handleGroupTypeChange(groupType: string) {
  props.onChange?.({
    ...props.value,
    groupType: groupType as ExpressionGroupType,
  });
}

function handleRemoveChild(nodeId: string) {
  props.onChange?.({
    ...props.value,
    children: props.value.children.filter((child) => child.id !== nodeId),
  });
}

function handleDeleteClick() {
  props.onRemove?.(props.value.id);
}
</script>
