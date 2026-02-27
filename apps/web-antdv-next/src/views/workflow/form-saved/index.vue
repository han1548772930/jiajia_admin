<script setup lang="ts">
import type { SavedFormRecord } from '#/views/workflow/form-designer/types';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Button, Card, Empty, Input, Popconfirm, Table, Tag, message } from 'antdv-next';

import useWorkflowFormDesignerStore from '#/store/workflow/form-designer';

const router = useRouter();
const designerStore = useWorkflowFormDesignerStore();

const keyword = ref('');
const records = ref<SavedFormRecord[]>([]);

const columns = [
  { dataIndex: 'title', key: 'title', title: '表单标题', width: 220 },
  { dataIndex: 'description', key: 'description', title: '描述' },
  { dataIndex: 'updatedAt', key: 'updatedAt', title: '更新时间', width: 190 },
  { key: 'action', title: '操作', width: 260 },
];

const filteredRecords = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return records.value;

  return records.value.filter((item) => {
    return (
      item.title.toLowerCase().includes(kw) ||
      item.description.toLowerCase().includes(kw)
    );
  });
});

function formatTime(value: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function loadRecords() {
  records.value = designerStore.getSavedRecords();
}

async function viewRecord(record: SavedFormRecord) {
  await router.push(`/workflow/designer/form-preview?recordId=${record.id}`);
}

async function openInDesigner(record: SavedFormRecord) {
  const loaded = designerStore.loadSavedRecord(record.id);
  if (!loaded) {
    message.error('加载失败，记录不存在');
    return;
  }
  await router.push('/workflow/designer/form');
}

function removeRecord(record: SavedFormRecord) {
  const ok = designerStore.removeSavedRecord(record.id);
  if (!ok) {
    message.error('删除失败，记录不存在');
    return;
  }
  message.success('删除成功');
  loadRecords();
}

function backToDesigner() {
  router.push('/workflow/designer/form');
}

onMounted(() => {
  loadRecords();
});
</script>

<template>
  <Page auto-content-height content-class="h-full p-3">
    <div class="flex h-full flex-col gap-3">
      <Card>
        <div class="flex flex-wrap items-center gap-2">
          <Button ghost type="primary" @click="backToDesigner">返回表单设计器</Button>
          <Input
            v-model:value="keyword"
            class="w-[320px]"
            placeholder="搜索已保存表单"
            allow-clear
          />
          <Button @click="loadRecords">刷新</Button>
          <Tag color="processing">共 {{ filteredRecords.length }} 条</Tag>
        </div>
      </Card>

      <Card class="flex-1">
        <Empty v-if="filteredRecords.length === 0" description="暂无已保存表单" />

        <Table
          v-else
          :columns="columns as any"
          :data-source="filteredRecords"
          :pagination="{ pageSize: 10 }"
          row-key="id"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'updatedAt'">
              {{ formatTime((record as SavedFormRecord).updatedAt) }}
            </template>

            <template v-else-if="column.key === 'action'">
              <div class="flex flex-wrap gap-1">
                <Button type="link" @click="viewRecord(record as SavedFormRecord)">查看</Button>
                <Button type="link" @click="openInDesigner(record as SavedFormRecord)">打开设计器</Button>
                <Popconfirm
                  :title="`确认删除已保存表单“${(record as SavedFormRecord).title}”？`"
                  ok-text="确认"
                  cancel-text="取消"
                  @confirm="removeRecord(record as SavedFormRecord)"
                >
                  <Button type="link" danger>删除</Button>
                </Popconfirm>
              </div>
            </template>
          </template>
        </Table>
      </Card>
    </div>
  </Page>
</template>
