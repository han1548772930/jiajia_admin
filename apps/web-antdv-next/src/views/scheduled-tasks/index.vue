<template>
  <Page auto-content-height content-class="flex h-full p-2">
    <div class="flex h-full w-full">
      <!-- 左侧树 -->
      <div class="w-60 shrink-0 border-r border-border flex flex-col h-full overflow-hidden">
        <div class="flex-1 overflow-y-auto p-2" @contextmenu.prevent="onTreeContainerRightClick">
          <Tree v-model:expanded-keys="expandedKeys" v-model:selected-keys="selectedKeys" :tree-data="(treeData as any)"
            :field-names="{ title: 'Name', key: 'Sysid', children: 'children' }" block-node show-line draggable
            @drop="onTreeDrop" @select="onTreeSelect" @right-click="onTreeRightClick">
            <template #titleRender="{ Name, _jobCount, Sysid }">
              <div v-if="renamingNodeId === Sysid" @click.stop @mousedown.stop>
                <Input v-model:value="renamingName" class="w-[120px]" @press-enter="onRenameConfirm"
                  @blur="onRenameConfirm" @keydown.esc="onRenameCancel" />
              </div>
              <span v-else class="inline-flex items-center gap-1">
                <span>{{ Name }}</span>
                <span v-if="_jobCount" class="text-muted-foreground text-xs">({{ _jobCount }})</span>
              </span>
            </template>
          </Tree>
        </div>
      </div>

      <!-- 右侧内容 -->
      <div class="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        <!-- 工具栏 -->
        <div class="p-2 border-b border-border flex items-center gap-2 shrink-0">
          <span class="text-sm text-muted-foreground">任务名称</span>
          <Select v-model:value="jobNameFilter" :options="jobOptions" show-search option-filter-prop="label" allow-clear
            placeholder="选择或搜索任务" class="w-[200px]" />
          <Button @click="onReset">重置</Button>
          <Button type="primary" :loading="refreshing" @click="onRefresh">
            刷新
          </Button>
        </div>

        <!-- AG Grid 表格 -->
        <div class="flex-1 min-h-0 p-2">
          <AgGridVue class="w-full h-full" :theme="currentAgGridTheme" :column-defs="columnDefs"
            :default-col-def="defaultColDef" :locale-text="AG_GRID_LOCALE_CN" :get-row-id="getRowId" :header-height="35"
            column-menu="legacy" v-bind="gridOptions" @grid-ready="onGridReady" />
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <Dropdown :open="contextMenuVisible" :trigger="[]" :menu="{
      items: activeContextMenuItems,
      onClick: onContextMenuClick,
    }" @open-change="(v: boolean) => { contextMenuVisible = v }">
      <div class="fixed w-px h-px pointer-events-none" :style="{
        left: contextMenuPos.x + 'px',
        top: contextMenuPos.y + 'px',
      }" />
    </Dropdown>

    <!-- 分组弹窗 -->
    <GroupModal />

    <!-- 任务表单弹窗 -->
    <TaskModal />
  </Page>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  Button,
  Dropdown,
  Input,
  message,
  Select,
  Tree,
} from 'antdv-next';
import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { AG_GRID_LOCALE_CN } from '@ag-grid-community/locale';
import { AgGridVue } from 'ag-grid-vue3';
import type { ColDef, GetRowIdFunc, GetRowIdParams, GridApi, GridReadyEvent } from 'ag-grid-community';
import dayjs from 'dayjs';

import {
  deleteJobApi,
  deleteTaskGroupApi,
  getJobListApi,
  getTaskGroupListApi,
  JobOperateType,
  type TaskApi,
  triggerJobApi,
  updateTaskGroupApi,
} from '#/api/task';
import { useRequestLoading } from '#/composables/useRequestLoading';
import { useTaskFormStore } from '#/store/task-form';
import { useTaskLogStore } from '#/store/task-log';
import { useAgGridTheme } from '#/composables/useAgGridTheme';
import { getJobTypeLabel } from './helpers';
import TaskFormModalComp from './components/TaskFormModal.vue';
import GroupFormModalComp from './components/GroupFormModal.vue';
import TableTag from './components/TableTag.vue';
import TableActionButtons from './components/TableActionButtons.vue';
import { fillTaskFormFromJob } from './utils/fill-task-form';
import { buildGroupTree, collectGroupJobs, findGroupNode, findGroupParent, type GroupNode } from './utils/group-tree';

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
  allJobs.value.filter((j) => j.JobName).map((j) => ({ label: j.JobName, value: j.JobName })),
);

// 树
const expandedKeys = ref<number[]>([]);
const selectedKeys = ref<number[]>([]);

// AG Grid 列定义
const columnDefs = computed<ColDef[]>(() => [
  { field: 'JobName', headerName: `任务名称 (${displayJobs.value.length})`, width: 200 },
  { field: 'JobStatus', headerName: '任务状态', width: 120, cellRenderer: TableTag },
  { field: 'JobType', headerName: '任务类型', width: 120, valueFormatter: (p: any) => getJobTypeLabel(p.data.JobType) },
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

const getRowId: GetRowIdFunc = (params: GetRowIdParams) => String(params.data.JobId);

function scheduleGridUpdate(cb: () => void) {
  setTimeout(() => {
    if (gridApi.value) cb();
  }, 0);
}

function syncGridData() {
  if (!gridApi.value) return;
  scheduleGridUpdate(() => {
    gridApi.value!.setGridOption('rowData', displayJobs.value);
  });
}

function onGridReady(params: GridReadyEvent) {
  gridApi.value = params.api;
  gridApi.value.setGridOption('loading', loading.value);
  syncGridData();
}

const treeData = computed<GroupNode[]>(() => buildGroupTree(groups.value, allJobs.value));

// 获取数据
async function fetchData() {
  await runWithLoading(
    async () => {
      const [groupRes, jobRes] = await Promise.all([getTaskGroupListApi(), getJobListApi()]);
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
  syncGridData();
}

watch([selectedKeys, jobNameFilter, allJobs], updateDisplay);

watch(loading, (value) => {
  if (!gridApi.value) return;
  scheduleGridUpdate(() => {
    gridApi.value!.setGridOption('loading', value);
  });
});

function onTreeSelect(keys: (string | number)[]) {
  selectedKeys.value = keys as number[];
}

// 树拖拽
const treeDrooping = ref(false);
const onTreeDrop = async (info: any) => {
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
const renamingNodeId = ref<number | null>(null);
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
  if (!res.Success) {
    message.error(res.Message || '重命名失败');
  } else {
    message.success('重命名成功');
    await fetchData();
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

const rootContextMenuItems = [
  { key: 'addRootGroup', label: '新增分组' },
];

const activeContextMenuItems = ref(nodeContextMenuItems);

function closeContextMenu() {
  contextMenuVisible.value = false;
}

function onTreeRightClick({ event, node }: any) {
  event.preventDefault();
  event.stopPropagation();
  contextMenuVisible.value = false;
  nextTick(() => {
    activeContextMenuItems.value = nodeContextMenuItems;
    contextMenuPos.value = { x: event.clientX, y: event.clientY };
    contextMenuNodeId.value = node.key ?? node.Sysid;
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

function onContextMenuClick(e: any) {
  contextMenuVisible.value = false;
  onContextMenu(e, contextMenuNodeId.value);
}

function onContextMenu(e: any, sysid: number) {
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
    case 'rename': {
      renamingNodeId.value = sysid;
      renamingName.value = node.Name;
      nextTick(() => {
        const input = document.querySelector('.ant-tree .ant-input') as HTMLInputElement;
        if (input) { input.focus(); input.select(); }
      });
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
