<template>
  <Page auto-content-height content-class="flex h-full p-2">
    <div class="min-h-0 flex-1">
      <AgGridVue class="h-full w-full" :theme="currentAgGridTheme" :column-defs="columnDefs" :components="agComponents"
        :default-col-def="defaultColDef" :locale-text="AG_GRID_LOCALE_CN" :get-row-id="getRowId" :header-height="35"
        detail-cell-renderer="logDetailCellRenderer" :detail-row-height="420" master-detail column-menu="legacy"
        v-bind="gridOptions" @grid-ready="onGridReady" />
    </div>
  </Page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue';

import { AG_GRID_LOCALE_CN } from '@ag-grid-community/locale';
import { Page } from '@vben/common-ui';

import type {
  ColDef,
  GetRowIdFunc,
  GetRowIdParams,
  GridApi,
  GridReadyEvent,
} from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';

import { getJobLogsApi, type TaskApi } from '#/api/task';
import { useAgGridTheme } from '#/composables/useAgGridTheme';
import { useRequestLoading } from '#/composables/useRequestLoading';
import { useTaskLogStore } from '#/store/task-log';
import LogDetailCellRenderer from './components/LogDetailCellRenderer.vue';

const taskLog = useTaskLogStore();
const { currentAgGridTheme, defaultColDef, gridOptions } = useAgGridTheme();

const logData = ref<TaskApi.AutoReportJobLog[]>([]);
const gridApi = shallowRef<GridApi | null>(null);
const { loading, run: runWithLoading } = useRequestLoading();
const agComponents = {
  logDetailCellRenderer: LogDetailCellRenderer,
};

const detailCell = {
  cellRenderer: 'agGroupCellRenderer',
  cellRendererParams: { suppressCount: true },
};

const columnDefs = computed<ColDef[]>(() => [
  { field: 'JobName', headerName: '任务名称', width: 200 },
  {
    field: 'Arguments',
    headerName: '参数',
    minWidth: 260,
    flex: 1,
    ...detailCell,
  },
  { field: 'CreateAt', headerName: '创建时间', width: 200 },
  { field: 'State', headerName: '状态', width: 120 },
  {
    field: 'Description',
    headerName: '描述',
    minWidth: 220,
    tooltipField: 'Description',
  },
  { field: 'ExceptionType', headerName: '异常类型', width: 200 },
  {
    field: 'ExceptionMessage',
    headerName: '异常消息',
    minWidth: 260,
    ...detailCell,
  },
  {
    field: 'ExceptionDetails',
    headerName: '异常细节',
    minWidth: 260,
    ...detailCell,
  },
]);

const getRowId: GetRowIdFunc = (params: GetRowIdParams) =>
  String(params.data.HfSetId);

function scheduleGridUpdate(cb: () => void) {
  setTimeout(() => {
    if (gridApi.value) cb();
  }, 0);
}

function syncGridData() {
  if (!gridApi.value) return;

  scheduleGridUpdate(() => {
    gridApi.value!.setGridOption('rowData', logData.value);
  });
}

function onGridReady(params: GridReadyEvent) {
  gridApi.value = params.api;
  params.api.setGridOption('isRowMaster', () => true);
  params.api.setGridOption('loading', loading.value);
  syncGridData();
}

watch(loading, (value) => {
  gridApi.value?.setGridOption('loading', value);
});

async function fetchLogs() {
  const jobId = taskLog.jobId;
  if (!jobId) return;

  await runWithLoading(async () => {
    const res = await getJobLogsApi(jobId);

    logData.value = res.Data;
    syncGridData();
  });
}

onMounted(fetchLogs);
</script>
