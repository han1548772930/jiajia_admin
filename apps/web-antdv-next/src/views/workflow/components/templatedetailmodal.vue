<script setup lang="ts">
import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { Card, Empty, message } from 'antdv-next';

import { getTemplateApi, type WorkflowApi } from '#/api/workflow';
import { useRequestLoading } from '#/composables/useRequestLoading';

interface TemplateDetailModalData {
  templateId: number;
}

const { loading, run: runWithLoading } = useRequestLoading();
const template = ref<null | WorkflowApi.TemplateDetail>(null);

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<TemplateDetailModalData>();
      if (!data?.templateId) return;
      await loadTemplate(data.templateId);
      return;
    }

    template.value = null;
  },
});

const nodeJson = computed(() =>
  template.value?.Node ? JSON.stringify(template.value.Node, null, 2) : '',
);

const baseItems = computed(() => {
  if (!template.value) return [];
  return [
    { label: '模板编码', value: template.value.Code || '-' },
    { label: '流程分类', value: template.value.Category?.Name || '-' },
    { label: '是否启用', value: template.value.IsEnable === 1 ? '启用' : '禁用' },
    { label: '是否默认', value: template.value.IsDefault === 1 ? '是' : '否' },
    { label: '审计服务', value: template.value.AuditServiceName || '-' },
    { label: '业务窗体', value: template.value.BillFormNamespace || '-' },
    { label: '数据文件', value: template.value.DataBrowseFilename || '-' },
    { label: '备注', value: template.value.Remark || '-' },
  ];
});

async function loadTemplate(sysid: number) {
  await runWithLoading(async () => {
    const res = await getTemplateApi(sysid);
    if (!res.Success) {
      message.error(res.Message || '加载模板详情失败');
      return;
    }
    template.value = res.Data;
  });
}
</script>

<template>
  <Modal
    :title="template?.Name || '模板详情'"
    class="w-[85%]"
    :loading="loading"
    :footer="false"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <Empty v-if="!template && !loading" description="暂无模板数据" />
    <div v-else class="flex max-h-[72vh] flex-col gap-3 overflow-y-auto pr-1">
      <Card title="基础信息">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div v-for="item in baseItems" :key="item.label" class="rounded border border-border p-3">
            <div class="mb-1 text-xs text-muted-foreground">{{ item.label }}</div>
            <div>{{ item.value }}</div>
          </div>
        </div>
      </Card>

      <Card title="流程节点定义(JSON)">
        <pre class="overflow-x-auto rounded bg-muted p-3 text-xs">{{ nodeJson }}</pre>
      </Card>
    </div>
  </Modal>
</template>
