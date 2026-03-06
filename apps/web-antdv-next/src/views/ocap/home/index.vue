<script setup lang="ts">
import { Page } from '@vben/common-ui';
import { Alert, Card } from 'antdv-next';
</script>

<template>
  <Page auto-content-height content-class="h-full p-1 flex flex-col">
    <Card title="OCAP 首页" class="w-full">
      <div class="flex flex-col gap-4">
        <Alert
          message="欢迎进入 OCAP 异常处理中心"
          description="请从外部业务入口进入具体异常单据，或通过菜单查看异常处理说明。"
          show-icon
          type="info"
        />

        <div class="rounded border border-dashed p-6 text-sm leading-7 text-gray-600">
          <p>当前首页作为 OCAP 独立应用的默认落点，避免默认跳转到固定单据 ID。</p>
          <p>进入具体异常处理页后，地址格式示例：</p>
          <p class="mt-2 font-medium text-gray-800">/ocap/123</p>
          <p class="font-medium text-gray-800">/ocap/report/123</p>
        </div>
      </div>
    </Card>
  </Page>
</template>

