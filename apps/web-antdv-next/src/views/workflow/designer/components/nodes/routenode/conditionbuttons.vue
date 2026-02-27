<template>
  <div class="mini-bar absolute -right-1 -top-1 flex text-[11px] opacity-70">
    <Tooltip placement="topRight" :title="'复制条件'" arrow>
      <Button type="text" size="small" shape="circle" @click.stop="handleClone">
        <template #icon>
          <IconifyIcon icon="lucide:copy" />
        </template>
      </Button>
    </Tooltip>
    <Button type="text" size="small" shape="circle" @click.stop="handleClose">
      <template #icon>
        <IconifyIcon icon="lucide:x" />
      </template>
    </Button>
  </div>
</template>

<script setup lang="ts">
import { IconifyIcon } from '@vben/icons';
import { Button, Tooltip } from 'antdv-next';

import type { IBranchNode, IRouteNode } from '#/views/workflow/designer/interfaces';
import useNodeStore from '#/store/workflow/node';

const props = defineProps<{
  parent: IRouteNode;
  node: IBranchNode;
}>();

const nodeStore = useNodeStore();

const handleClose = () => {
  if (props.node.id) {
    nodeStore.deleteCondition(props.parent, props.node);
  }
};

const handleClone = () => {
  if (props.node.id) {
    nodeStore.cloneCondition(props.parent, props.node);
  }
};
</script>
