<script setup lang="ts">
import type {
  ColDef,
  GetRowIdFunc,
  GetRowIdParams,
  GridApi,
  GridReadyEvent,
  ValueFormatterParams,
} from 'ag-grid-community';

import type { GroupNode } from './utils/group-tree';

import type { TaskApi } from '#/api/task';

import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from 'vue';
import { useRouter } from 'vue-router';

import { confirm, Page, useVbenModal } from '@vben/common-ui';

import { AG_GRID_LOCALE_CN } from '@ag-grid-community/locale';
import { AgGridVue } from 'ag-grid-vue3';
import { Button, Dropdown, Input, message, Select, Tree } from 'antdv-next';
import dayjs from 'dayjs';

import {
  deleteJobApi,
  deleteTaskGroupApi,
  getJobListApi,
  getTaskGroupListApi,
  JobOperateType,
  triggerJobApi,
  updateTaskGroupApi,
} from '#/api/task';
import { useAgGridTheme } from '#/composables/useAgGridTheme';
import { useRequestLoading } from '#/composables/useRequestLoading';
import { useTaskFormStore } from '#/store/task-form';
import { useTaskLogStore } from '#/store/task-log';

import GroupFormModalComp from './components/GroupFormModal.vue';
import TableActionButtons from './components/TableActionButtons.vue';
import TableTag from './components/TableTag.vue';
import TaskFormModalComp from './components/TaskFormModal.vue';
import { getJobTypeLabel } from './helpers';
import { fillTaskFormFromJob } from './utils/fill-task-form';
import {
  buildGroupTree,
  collectGroupJobs,
  findGroupNode,
  findGroupParent,
} from './utils/group-tree';

const router = useRouter();
const taskForm = useTaskFormStore();
const taskLog = useTaskLogStore();
const { currentAgGridTheme, defaultColDef, gridOptions } = useAgGridTheme();

// Modal
const [GroupModal, groupModalApi] = useVbenModal({
  connectedComponent: GroupFormModalComp,
});
const [TaskModal, taskModalApi] = useVbenModal({
  connectedComponent: TaskFormModalComp,
});

// 数据
const groups = shallowRef<TaskApi.AutoTaskGroupItem[]>([]);
const flatGroups = shallowRef<TaskApi.AutoTaskGroupItem[]>([]);
const allJobs = shallowRef<TaskApi.JobData[]>([]);
const displayJobs = shallowRef<TaskApi.JobData[]>([]);
const { loading, run: runWithLoading } = useRequestLoading();
const { loading: refreshing, run: runWithRefreshing } = useRequestLoading();
const gridApi = shallowRef<GridApi | null>(null);

// 筛选
const jobNameFilter = ref<string | undefined>();
const jobOptions = computed(() =>
  allJobs.value
    .filter((j) => j.JobName)
    .map((j) => ({ label: j.JobName, value: j.JobName })),
);

// 树
const expandedKeys = ref<number[]>([]);
const selectedKeys = ref<number[]>([]);

// AG Grid 列定义
const columnDefs = computed<ColDef[]>(() => [
  {
    field: 'JobName',
    headerValueGetter: () => `任务名称 (${displayJobs.value.length})`,
    width: 200,
  },
  {
    field: 'JobStatus',
    headerName: '任务状态',
    width: 120,
    cellRenderer: TableTag,
  },
  {
    field: 'JobType',
    headerName: '任务类型',
    width: 120,
    valueFormatter: (p: ValueFormatterParams<TaskApi.JobData>) =>
      getJobTypeLabel(p.data?.JobType ?? 0),
  },
  { field: 'Param', headerName: '任务参数', width: 300, tooltipField: 'Param' },
  { field: 'Cron', headerName: 'Cron表达式', width: 200 },
  { field: 'CreateDate', headerName: '创建时间', width: 200 },
  { field: 'StartTime', headerName: '开始时间', width: 200 },
  { field: 'EndTime', headerName: '结束时间', width: 200 },
  { field: 'LastExecution', headerName: '最后执行时间', width: 200 },
  { field: 'NextExecution', headerName: '下次执行时间', width: 200 },
  {
    field: 'JobName',
    headerName: '操作',
    pinned: 'right',
    filter: false,
    width: 200,
    sortable: false,
    resizable: false,
    suppressHeaderMenuButton: true,
    suppressHeaderFilterButton: true,
    suppressHeaderContextMenu: true,
    cellRenderer: TableActionButtons,
    autoHeight: true,
    cellRendererParams: {
      onTableEdit,
      onTableDelete,
      onTableCopy,
      onTableRun,
      onTableToLog,
    },
  },
]);

const getRowId: GetRowIdFunc = (params: GetRowIdParams) =>
  String(params.data.JobId);

type TreeDropInfo = {
  dragNode: { key: number | string };
  dropToGap: boolean;
  node: { key: number | string };
};

type TreeRightClickInfo = {
  event: MouseEvent;
  node: { key?: number | string; Sysid?: number };
};

type ContextMenuClickInfo = {
  key: string;
};

function onGridReady(params: GridReadyEvent) {
  gridApi.value = params.api;
  params.api.refreshHeader();
}

const treeData = computed<GroupNode[]>(() =>
  buildGroupTree(groups.value, allJobs.value),
);
type TreeDataNode = GroupNode & { children?: TreeDataNode[]; key: number };
const treeDataForTree = computed<TreeDataNode[]>(() => {
  const mapNode = (node: GroupNode): TreeDataNode => ({
    ...node,
    key: node.Sysid,
    children: node.children?.map(mapNode),
  });
  return treeData.value.map(mapNode);
});

// 获取数据
async function fetchData() {
  await runWithLoading(
    async () => {
      const [groupRes, jobRes] = await Promise.all([
        getTaskGroupListApi(),
        getJobListApi(),
      ]);
      if (!groupRes.Success) {
        message.error(groupRes.Message);
        return;
      }
      if (!jobRes.Success) {
        message.error(jobRes.Message);
        return;
      }
      groups.value = groupRes.Data;
      flatGroups.value = groupRes.Data;
      allJobs.value = jobRes.Data;
      updateDisplay();
    },
    { rethrow: false },
  );
}

function updateDisplay() {
  const selectedId = selectedKeys.value[0];
  let base: TaskApi.JobData[] = allJobs.value;
  if (selectedId) {
    const node = findGroupNode(treeData.value, selectedId);
    if (node) base = collectGroupJobs(node, allJobs.value);
  }
  const kw = jobNameFilter.value?.trim();
  displayJobs.value = kw ? base.filter((j) => j.JobName?.includes(kw)) : base;
}

watch([selectedKeys, jobNameFilter, allJobs], updateDisplay);
watch(displayJobs, () => {
  gridApi.value?.refreshHeader();
});

function onTreeSelect(keys: (number | string)[]) {
  selectedKeys.value = keys as number[];
}

// 树拖拽
const treeDrooping = ref(false);
const onTreeDrop = async (info: TreeDropInfo) => {
  if (treeDrooping.value) return;
  const dragId = info.dragNode.key as number;
  const dropId = info.node.key as number;
  let newParentId = 0;
  if (info.dropToGap) {
    const parent = findGroupParent(treeData.value, dropId);
    newParentId = parent ? parent.Sysid : 0;
  } else {
    newParentId = dropId;
  }
  const dragNode = findGroupNode(treeData.value, dragId);
  if (!dragNode || (dragNode.ParentId ?? 0) === newParentId) return;
  treeDrooping.value = true;
  try {
    const res = await updateTaskGroupApi(dragId, dragNode.Name, newParentId);
    if (!res.Success) {
      message.error(res.Message || '移动失败');
      await fetchData();
      return;
    }
    message.success('移动成功');
    await fetchData();
  } finally {
    treeDrooping.value = false;
  }
};

// 重命名
const renamingNodeId = ref<null | number>(null);
const renamingName = ref('');

async function onRenameConfirm() {
  const id = renamingNodeId.value;
  if (!id) return;
  renamingNodeId.value = null;
  const node = findGroupNode(treeData.value, id);
  if (!node) return;
  const newName = renamingName.value.trim();
  if (!newName || newName === node.Name) return;
  const res = await updateTaskGroupApi(id, newName, node.ParentId ?? 0);
  if (res.Success) {
    message.success('重命名成功');
    await fetchData();
  } else {
    message.error(res.Message || '重命名失败');
  }
}

function onRenameCancel() {
  renamingNodeId.value = null;
}

// 右键菜单
const contextMenuVisible = ref(false);
const contextMenuNodeId = ref<number>(0);
const contextMenuPos = ref({ x: 0, y: 0 });

const nodeContextMenuItems = [
  { key: 'addGroup', label: '新增子分组' },
  { key: 'addTask', label: '新增任务' },
  { key: 'rename', label: '重命名' },
  { key: 'delete', label: '删除分组', danger: true },
];

const rootContextMenuItems = [{ key: 'addRootGroup', label: '新增分组' }];

const activeContextMenuItems = ref(nodeContextMenuItems);

function closeContextMenu() {
  contextMenuVisible.value = false;
}

function onTreeRightClick({ event, node }: TreeRightClickInfo) {
  event.preventDefault();
  event.stopPropagation();
  contextMenuVisible.value = false;
  nextTick(() => {
    activeContextMenuItems.value = nodeContextMenuItems;
    contextMenuPos.value = { x: event.clientX, y: event.clientY };
    const nodeId = Number(node.key ?? node.Sysid ?? 0);
    contextMenuNodeId.value = Number.isNaN(nodeId) ? 0 : nodeId;
    contextMenuVisible.value = true;
  });
}

function onTreeContainerRightClick(e: MouseEvent) {
  contextMenuVisible.value = false;
  nextTick(() => {
    activeContextMenuItems.value = rootContextMenuItems;
    contextMenuPos.value = { x: e.clientX, y: e.clientY };
    contextMenuNodeId.value = 0;
    contextMenuVisible.value = true;
  });
}

onMounted(() => {
  document.addEventListener('click', closeContextMenu);
  document.addEventListener('scroll', closeContextMenu, true);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', closeContextMenu);
  document.removeEventListener('scroll', closeContextMenu, true);
});

function onContextMenuClick(e: ContextMenuClickInfo) {
  contextMenuVisible.value = false;
  onContextMenu(e, contextMenuNodeId.value);
}

function onContextMenu(e: ContextMenuClickInfo, sysid: number) {
  const key = e.key as string;
  if (key === 'addRootGroup') {
    groupModalApi.setData({ mode: 'add', parentId: 0, fetchData }).open();
    return;
  }
  const node = findGroupNode(treeData.value, sysid);
  if (!node) return;
  switch (key) {
    case 'addGroup': {
      groupModalApi.setData({ mode: 'add', parentId: sysid, fetchData }).open();
      break;
    }
    case 'addTask': {
      taskForm.handleReset();
      taskForm.jobState.title = '新增任务';
      taskForm.setFieldValue('jobState.groupId', sysid);
      taskForm.setFieldValue('jobState.startTime', dayjs());
      taskModalApi.setData({ groups: flatGroups.value, fetchData }).open();
      break;
    }
    case 'delete': {
      confirm({
        content: `确定要删除分组 ${node.Name} 吗？`,
        icon: 'question',
        async beforeClose({ isConfirm }) {
          if (isConfirm) {
            const res = await deleteTaskGroupApi(sysid);
            if (!res.Success) {
              message.error(res.Message || '删除失败');
              return false;
            }
            message.success('删除成功');
            await fetchData();
          }
          return true;
        },
      });
      break;
    }
    case 'rename': {
      renamingNodeId.value = sysid;
      renamingName.value = node.Name;
      nextTick(() => {
        const input = document.querySelector(
          '.ant-tree .ant-input',
        ) as HTMLInputElement;
        if (input) {
          input.focus();
          input.select();
        }
      });
      break;
    }
  }
}

function onReset() {
  jobNameFilter.value = undefined;
  selectedKeys.value = [];
}

async function onRefresh() {
  if (refreshing.value) return;
  await runWithRefreshing(async () => {
    await fetchData();
  });
}

// 表格操作
function openTaskModal() {
  taskModalApi.setData({ groups: flatGroups.value, fetchData }).open();
}

function onTableEdit(params: TaskApi.JobData) {
  taskForm.handleReset();
  taskForm.jobState.title = '修改任务';
  fillTaskFormFromJob(taskForm, params, JobOperateType.EDIT);
  openTaskModal();
}

function onTableCopy(params: TaskApi.JobData) {
  taskForm.handleReset();
  taskForm.jobState.title = '新增任务';
  fillTaskFormFromJob(taskForm, params, JobOperateType.COPY);
  taskForm.setFieldValue('jobState.jobName', `${params.JobName}-copy`);
  openTaskModal();
}

async function onTableDelete(params: TaskApi.JobData) {
  confirm({
    content: `确定要删除任务 ${params.JobName} 吗？`,
    icon: 'question',
    async beforeClose({ isConfirm }) {
      if (isConfirm) {
        const res = await deleteJobApi(params.JobId);
        if (!res.Success) {
          message.error(res.Message);
          return false;
        }
        message.success('删除成功');
        await fetchData();
      }
      return true;
    },
  });
}

async function onTableRun(params: TaskApi.JobData) {
  confirm({
    content: `确定要运行任务 ${params.JobName} 吗？`,
    icon: 'question',
    async beforeClose({ isConfirm }) {
      if (isConfirm) {
        const res = await triggerJobApi(params.JobId);
        if (!res.Success) {
          message.error(res.Message);
          return false;
        }
        message.success('运行成功');
      }
      return true;
    },
  });
}

function onTableToLog(params: TaskApi.JobData) {
  taskLog.jobId = params.JobId;
  router.push('/admin/scheduled-tasks/log');
}

onMounted(fetchData);
</script>

<template>
  <Page auto-content-height content-class="flex h-full p-2">
    <div class="flex h-full w-full">
      <!-- 左侧树 -->
      <div
        class="flex h-full w-60 shrink-0 flex-col overflow-hidden border-r border-border"
      >
        <div
          class="flex-1 overflow-y-auto p-2"
          @contextmenu.prevent="onTreeContainerRightClick"
        >
          <Tree
            v-model:expanded-keys="expandedKeys"
            v-model:selected-keys="selectedKeys"
            :tree-data="treeDataForTree"
            :field-names="{ title: 'Name', key: 'Sysid', children: 'children' }"
            block-node
            show-line
            draggable
            @drop="onTreeDrop"
            @select="onTreeSelect"
            @right-click="onTreeRightClick"
          >
            <template #titleRender="{ Name, _jobCount, Sysid }">
              <div v-if="renamingNodeId === Sysid" @click.stop @mousedown.stop>
                <Input
                  v-model:value="renamingName"
                  class="w-[120px]"
                  @press-enter="onRenameConfirm"
                  @blur="onRenameConfirm"
                  @keydown.esc="onRenameCancel"
                />
              </div>
              <span
                v-else
                class="inline-flex h-6 items-center gap-1 leading-none"
              >
                <span class="leading-none">{{ Name }} ({{ _jobCount }})</span>
              </span>
            </template>
          </Tree>
        </div>
      </div>

      <!-- 右侧内容 -->
      <div class="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <!-- 工具栏 -->
        <div
          class="flex shrink-0 items-center gap-2 border-b border-border p-2"
        >
          <span class="text-sm text-muted-foreground">任务名称</span>
          <Select
            v-model:value="jobNameFilter"
            :options="jobOptions"
            show-search
            option-filter-prop="label"
            allow-clear
            placeholder="选择或搜索任务"
            class="w-[200px]"
          />
          <Button @click="onReset">重置</Button>
          <Button type="primary" :loading="refreshing" @click="onRefresh">
            刷新
          </Button>
        </div>

        <!-- AG Grid 表格 -->
        <div class="min-h-0 flex-1 p-2">
          <AgGridVue
            class="h-full w-full"
            :theme="currentAgGridTheme"
            :column-defs="columnDefs"
            :default-col-def="defaultColDef"
            :locale-text="AG_GRID_LOCALE_CN"
            :get-row-id="getRowId"
            :header-height="35"
            :row-data="displayJobs"
            :loading="loading"
            v-bind="gridOptions"
            @grid-ready="onGridReady"
          />
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <Dropdown
      :open="contextMenuVisible"
      :trigger="[]"
      :menu="{
        items: activeContextMenuItems,
        onClick: onContextMenuClick,
      }"
      @open-change="
        (v: boolean) => {
          contextMenuVisible = v;
        }
      "
    >
      <div
        class="pointer-events-none fixed h-px w-px"
        :style="{
          left: `${contextMenuPos.x}px`,
          top: `${contextMenuPos.y}px`,
        }"
      ></div>
    </Dropdown>

    <!-- 分组弹窗 -->
    <GroupModal />

    <!-- 任务表单弹窗 -->
    <TaskModal />
  </Page>
</template>
