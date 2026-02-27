<template>
  <div class="group/item flex min-h-12 items-center">
    <div class="flex-1">
      <slot />
    </div>
    <div class="flex w-[70px] items-center justify-end">
      <div :class="['hidden items-center group-hover/item:flex', { flex: addOpen }]">
        <AddMenu
          v-if="onAddExpression && onAddGroup"
          :on-add-expression="onAddExpression"
          :on-add-group="onAddGroup"
          :on-open-change="(open) => (addOpen = open)"
        >
          <Button type="text">+</Button>
        </AddMenu>
        <Button type="text" danger @click="onRemove">x</Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { Button } from 'antdv-next';

import { ExpressionGroupType } from '#/views/workflow/designer/interfaces/setting';

import AddMenu from './addmenu.vue';

defineProps<{
  onAddExpression?: () => void;
  onAddGroup?: (nodeType: ExpressionGroupType) => void;
  onRemove?: () => void;
}>();

const addOpen = ref(false);
</script>
