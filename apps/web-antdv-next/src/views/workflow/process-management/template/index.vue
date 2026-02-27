<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue';
import { useRouter } from 'vue-router';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { Button, Card, Collapse, Input, Spin, Table, Tag, message } from 'antdv-next';

import {
  getAllDepartmentsApi,
  deleteCategoryApi,
  deleteTemplateApi,
  getAllCategoryApi,
  getAllTemplateApi,
  getSysRoleApi,
  getTemplateApi,
  getUsersByDeptApi,
  type WorkflowApi,
} from '#/api/workflow';
import { useRequestLoading } from '#/composables/useRequestLoading';
import useFormStore from '#/store/workflow/form';
import useNodeStore from '#/store/workflow/node';
import CategoryFormModalComp from '#/views/workflow/components/categoryformmodal.vue';
import { capitalizeObjectKeys, getSelectRangeName } from '#/views/workflow/designer/utils';

const router = useRouter();
const formStore = useFormStore();
const nodeStore = useNodeStore();

const { loading, run: runWithLoading } = useRequestLoading();
const keyword = ref('');
const keywordInput = shallowRef<string>('');
const categories = ref<WorkflowApi.Category[]>([]);
const templates = ref<WorkflowApi.TemplateItem[]>([]);
const expandedCategoryIds = ref<string[]>([]);

const [CategoryFormModal, categoryFormModalApi] = useVbenModal({
  connectedComponent: CategoryFormModalComp,
});

const columns = [
  { dataIndex: 'Name', key: 'Name', title: '模板名称', width: 260 },
  { dataIndex: 'Code', key: 'Code', title: '模板编码', width: 180 },
  { dataIndex: 'IsEnable', key: 'IsEnable', title: '是否启用', width: 120 },
  { key: 'action', title: '操作', width: 320 },
];

const groupedData = computed(() => {
  return categories.value
    .map((category) => {
      const categoryTemplates = templates.value.filter(
        (template) =>
          template.CategoryId === category.Sysid &&
          (!keyword.value || template.Name.includes(keyword.value)),
      );
      return {
        category,
        templates: categoryTemplates,
      };
    })
    .filter((group) => group.templates.length > 0 || !keyword.value);
});

const collapseItems = computed(() =>
  groupedData.value.map((group) => ({
    key: String(group.category.Sysid),
    label: `${group.category.Name} (${group.templates.length})`,
    category: group.category,
    templates: group.templates,
  })),
);

function resetDesignerState() {
  formStore.form = {
    auditServiceName: '',
    billFormNamespace: '',
    dataBrowseFilename: '',
    enable: false,
    isDefault: false,
    name: '',
    remark: '',
    sysid: 0,
    type: '',
  };

  nodeStore.node.childNode = undefined;
  nodeStore.undoList = [];
  nodeStore.redoList = [];
}

function hydrateNodeContent(node: any) {
  if (!node || typeof node !== 'object') return;

  const selectRange = Number(node.selectRange ?? 0);
  const users = Array.isArray(node.nodeUsers) ? node.nodeUsers : [];
  const names: string[] = [];

  if (selectRange === 2) {
    for (const item of users) {
      const matched = formStore.users.find((u) => u.Sysid === Number(item.targetId));
      if (matched?.Name) names.push(matched.Name);
    }
  } else if (selectRange === 3) {
    for (const item of users) {
      const matched = formStore.roles.find((r) => r.Sysid === Number(item.targetId));
      if (matched?.Name) names.push(matched.Name);
    }
  } else if ([4, 5, 6].includes(selectRange)) {
    const title = getSelectRangeName(selectRange);
    if (title) names.push(title);
  }

  if (names.length > 0) {
    node.nodeContent = names.join(',');
  }

  if (node.childNode) {
    hydrateNodeContent(node.childNode);
  }

  if (Array.isArray(node.conditionNodeList)) {
    for (const child of node.conditionNodeList) {
      hydrateNodeContent(child);
    }
  }
}

async function loadUsersByDepartments() {
  const departmentsRes = await getAllDepartmentsApi();
  if (!departmentsRes.Success) {
    message.error(departmentsRes.Message || '加载部门失败');
    return [];
  }

  const departments = departmentsRes.Data ?? [];
  const userResults = await Promise.all(
    departments.map(async (dept) => {
      const usersRes = await getUsersByDeptApi(dept.Sysid);
      if (!usersRes.Success) return [];
      return (usersRes.Data ?? []).map<WorkflowApi.NodeUserDetail>((user) => ({
        Code: user.Code,
        Department: {
          Name: dept.Name,
          ParentId: dept.ParentId,
          Sysid: dept.Sysid,
        },
        DepartmentId: dept.Sysid,
        DepartmentName: dept.Name,
        Name: user.Name,
        ParentId: dept.Sysid,
        Sysid: user.Sysid,
        Type: 1,
      }));
    }),
  );

  return userResults.flat();
}

async function loadData() {
  await runWithLoading(async () => {
    const [categoryRes, templateRes, roleRes] = await Promise.all([
      getAllCategoryApi(),
      getAllTemplateApi(),
      getSysRoleApi(),
    ]);

    if (!categoryRes.Success) {
      message.error(categoryRes.Message || '加载流程分类失败');
      return;
    }
    if (!templateRes.Success) {
      message.error(templateRes.Message || '加载模板失败');
      return;
    }

    categories.value = categoryRes.Data ?? [];
    templates.value = templateRes.Data ?? [];
    const validCategoryIds = new Set(categories.value.map((item) => String(item.Sysid)));
    expandedCategoryIds.value = expandedCategoryIds.value.filter((id) => validCategoryIds.has(id));
    if (expandedCategoryIds.value.length === 0) {
      expandedCategoryIds.value = categories.value.map((item) => String(item.Sysid));
    }

    formStore.category = categories.value;
    if (roleRes.Success) {
      formStore.roles = roleRes.Data ?? [];
    }
    formStore.users = await loadUsersByDepartments();
  });
}

function handleSearch() {
  keyword.value = (keywordInput.value ?? '').trim();
}

function handleReset() {
  keyword.value = '';
  keywordInput.value = '';
}

function onCollapseChange(key: number | string | Array<number | string>) {
  if (Array.isArray(key)) {
    expandedCategoryIds.value = key.map((item) => String(item));
    return;
  }
  expandedCategoryIds.value = [String(key)];
}

function openCategoryModal(mode: 'add' | 'edit', category?: WorkflowApi.Category) {
  categoryFormModalApi
    .setData({
      category,
      mode,
      onOk: loadData,
    })
    .open();
}

async function openCreateTemplate() {
  resetDesignerState();
  formStore.category = categories.value;
  await router.push('/workflow/designer/basic-information');
}

async function openFormDesigner() {
  await router.push('/workflow/designer/form');
}

async function openFormPreview() {
  await router.push('/workflow/designer/form-preview');
}

async function openSavedForms() {
  await router.push('/workflow/designer/form-saved');
}

async function openTemplateEditor(mode: 'copy' | 'edit', item: WorkflowApi.TemplateItem) {
  await runWithLoading(async () => {
    const res = await getTemplateApi(item.Sysid);
    if (!res.Success) {
      message.error(res.Message || '加载模板详情失败');
      return;
    }

    const template = res.Data;
    resetDesignerState();
    formStore.category = categories.value;

    formStore.form = {
      auditServiceName: template.AuditServiceName ?? '',
      billFormNamespace: template.BillFormNamespace ?? '',
      dataBrowseFilename: template.DataBrowseFilename ?? '',
      enable: template.IsEnable === 1,
      isDefault: template.IsDefault === 1,
      name: mode === 'copy' ? `${template.Name}-copy` : template.Name,
      remark: template.Remark ?? '',
      sysid: mode === 'copy' ? 0 : template.Sysid,
      type: template.CategoryId,
    };

    const designerNode = capitalizeObjectKeys(template.Node, 2);
    if (designerNode) {
      hydrateNodeContent(designerNode);
      nodeStore.node.childNode = designerNode;
    }

    await router.push('/workflow/designer/basic-information');
  });
}

function removeTemplate(item: WorkflowApi.TemplateItem) {
  confirm({
    content: `确认删除模板“${item.Name}”？`,
    icon: 'question',
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      return await runWithLoading(async () => {
        const res = await deleteTemplateApi(item.Sysid);
        if (!res.Success) {
          message.error(res.Message || '删除模板失败');
          return false;
        }
        message.success('删除模板成功');
        await loadData();
        return true;
      });
    },
  });
}

function removeCategory(item: WorkflowApi.Category, templateCount: number) {
  if (templateCount > 0) {
    message.error('该分类下存在模板，不能删除');
    return;
  }

  confirm({
    content: `确认删除分类“${item.Name}”？`,
    icon: 'question',
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      return await runWithLoading(async () => {
        const res = await deleteCategoryApi(item.Sysid);
        if (!res.Success) {
          message.error(res.Message || '删除分类失败');
          return false;
        }
        message.success('删除分类成功');
        await loadData();
        return true;
      });
    },
  });
}

loadData();
</script>

<template>
  <Page auto-content-height content-class="p-3">
    <div class="flex h-full flex-col gap-3">
      <Card>
        <div class="flex flex-wrap items-center gap-2">
          <Input
            v-model:value="keywordInput"
            class="w-[300px]"
            placeholder="流程名称"
            @press-enter="handleSearch"
          />
          <Button type="primary" @click="handleSearch">搜索</Button>
          <Button @click="handleReset">重置</Button>
          <Button :loading="loading" @click="loadData">刷新</Button>
          <Button type="primary" @click="openCreateTemplate">新增模板</Button>
          <Button @click="openFormDesigner">表单设计器</Button>
          <Button @click="openFormPreview">表单回显</Button>
          <Button @click="openSavedForms">已保存表单</Button>
          <Button type="primary" ghost @click="openCategoryModal('add')">新增分组</Button>
        </div>
      </Card>

      <Card class="flex-1">
        <Spin :spinning="loading">
          <Collapse :items="collapseItems as any" :active-key="expandedCategoryIds" @change="onCollapseChange">
            <template #labelRender="{ item }">
              <div class="flex flex-wrap items-center gap-3">
                <span class="font-medium">{{ (item as any).label }}</span>
                <div class="flex gap-1" @click.stop>
                  <Button size="small" type="link" @click.stop="openCategoryModal('edit', (item as any).category)">
                    编辑分组
                  </Button>
                  <Button size="small" type="link" danger
                    @click.stop="removeCategory((item as any).category, (item as any).templates.length)">
                    删除分组
                  </Button>
                </div>
              </div>
            </template>
            <template #contentRender="{ item }">
              <Table size="small" row-key="Sysid" :columns="columns as any" :data-source="(item as any).templates"
                :loading="loading" :pagination="false" :scroll="{ x: 1100 }">
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'IsEnable'">
                    <Tag :color="(record as any).IsEnable === 1 ? 'success' : 'default'">
                      {{ (record as any).IsEnable === 1 ? '启用' : '禁用' }}
                    </Tag>
                  </template>
                  <template v-else-if="column.key === 'action'">
                    <div class="flex gap-1">
                      <Button type="link" @click="openTemplateEditor('edit', record as WorkflowApi.TemplateItem)">
                        编辑
                      </Button>
                      <Button type="link" @click="openTemplateEditor('copy', record as WorkflowApi.TemplateItem)">
                        复制
                      </Button>
                      <Button type="link" danger @click="removeTemplate(record as WorkflowApi.TemplateItem)">删除</Button>
                    </div>
                  </template>
                </template>
              </Table>
            </template>
          </Collapse>
        </Spin>
      </Card>
    </div>

    <CategoryFormModal />
  </Page>
</template>
