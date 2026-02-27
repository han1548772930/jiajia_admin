<script setup lang="ts">
import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import {
  Button,
  Checkbox,
  CheckboxGroup,
  Input,
  Tag,
  Tree,
} from 'antdv-next';

import type { NodeUsersDetail } from '#/views/workflow/designer/types';

interface TreeNode {
  children?: TreeNode[];
  isLeaf?: boolean;
  key: string;
  selectable?: boolean;
  title: string;
}

interface DepartmentLike {
  Name?: string;
  ParentId?: number;
  Sysid?: number;
}

interface UserWithDepartment extends NodeUsersDetail {
  Department?: DepartmentLike;
  DepartmentId?: number;
  DepartmentName?: string;
}

interface DepartmentNode {
  children?: DepartmentNode[];
  key: string;
  title: string;
}

interface NormalizedDepartment {
  id: number;
  name: string;
  parentId: number;
  users: UserWithDepartment[];
}

interface MemberSelectModalData {
  checkedKeys: string[];
  mode: 'role' | 'user';
  onOk: (keys: string[]) => void;
  title: string;
  treeData: TreeNode[];
  users?: UserWithDepartment[];
}

const UNGROUPED_DEPT_ID = -1;

const modalTitle = ref('选择成员');
const mode = ref<'role' | 'user'>('role');

const roleTreeData = ref<TreeNode[]>([]);
const roleCheckedKeys = ref<string[]>([]);

const users = ref<UserWithDepartment[]>([]);
const selectedUserIds = ref<string[]>([]);

const deptTreeData = ref<DepartmentNode[]>([]);
const selectedDeptId = ref<null | number>(null);
const deptFilterText = ref('');
const userFilterText = ref('');
const normalizedDepartments = ref<Map<number, NormalizedDepartment>>(new Map());

let confirmCallback: ((keys: string[]) => void) | null = null;

const currentDeptUsers = computed(() => {
  if (selectedDeptId.value === null) return [];
  return normalizedDepartments.value.get(selectedDeptId.value)?.users ?? [];
});

const filteredCurrentDeptUsers = computed(() => {
  const keyword = userFilterText.value.trim().toLowerCase();
  if (!keyword) return currentDeptUsers.value;
  return currentDeptUsers.value.filter((user) => {
    const name = (user.Name ?? '').toLowerCase();
    const code = (user.Code ?? '').toLowerCase();
    return name.includes(keyword) || code.includes(keyword);
  });
});

const filteredDeptTreeData = computed(() => {
  const keyword = deptFilterText.value.trim().toLowerCase();
  if (!keyword) return deptTreeData.value;

  const matchedDeptIds = new Set<number>();
  for (const [deptId, dept] of normalizedDepartments.value.entries()) {
    const deptNameMatched = dept.name.toLowerCase().includes(keyword);
    const hasMatchedUsers = dept.users.some((user) =>
      (user.Name ?? '').toLowerCase().includes(keyword),
    );
    if (deptNameMatched || hasMatchedUsers) {
      matchedDeptIds.add(deptId);
    }
  }

  const filterNodes = (nodes: DepartmentNode[]): DepartmentNode[] => {
    const next: DepartmentNode[] = [];
    for (const node of nodes) {
      const nodeId = Number(node.key);
      const children = filterNodes(node.children ?? []);
      if (matchedDeptIds.has(nodeId) || children.length > 0) {
        next.push({
          ...node,
          children,
        });
      }
    }
    return next;
  };

  return filterNodes(deptTreeData.value);
});

const [Modal, modalApi] = useVbenModal({
  onConfirm() {
    if (mode.value === 'user') {
      confirmCallback?.([...selectedUserIds.value]);
    } else {
      confirmCallback?.([...roleCheckedKeys.value]);
    }
    modalApi.close();
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<MemberSelectModalData>();
      if (!data) return;

      modalTitle.value = data.title;
      mode.value = data.mode;
      confirmCallback = data.onOk;

      roleTreeData.value = data.treeData ?? [];
      roleCheckedKeys.value = [...(data.checkedKeys ?? [])];

      users.value = data.users ?? [];
      selectedUserIds.value = [...(data.checkedKeys ?? [])];
      deptFilterText.value = '';
      userFilterText.value = '';
      initDepartments();
      return;
    }

    resetState();
  },
});

function resetState() {
  mode.value = 'role';
  roleTreeData.value = [];
  roleCheckedKeys.value = [];
  users.value = [];
  selectedUserIds.value = [];
  deptTreeData.value = [];
  selectedDeptId.value = null;
  deptFilterText.value = '';
  userFilterText.value = '';
  normalizedDepartments.value = new Map();
  confirmCallback = null;
}

function normalizeCheckedKeys(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  if (
    value &&
    typeof value === 'object' &&
    'checked' in value &&
    Array.isArray((value as { checked: unknown[] }).checked)
  ) {
    return (value as { checked: unknown[] }).checked.map((item) => String(item));
  }

  return [];
}

function onRoleTreeCheck(value: unknown) {
  roleCheckedKeys.value = normalizeCheckedKeys(value);
}

function resolveDepartment(user: UserWithDepartment) {
  if (user.Department?.Sysid && user.Department?.Name) {
    return {
      id: user.Department.Sysid,
      name: user.Department.Name,
      parentId: user.Department.ParentId ?? 0,
    };
  }

  if (user.DepartmentId && user.DepartmentId > 0) {
    return {
      id: user.DepartmentId,
      name: user.DepartmentName || `部门${user.DepartmentId}`,
      parentId: 0,
    };
  }

  if (user.ParentId && user.ParentId > 0) {
    return {
      id: user.ParentId,
      name: `部门${user.ParentId}`,
      parentId: 0,
    };
  }

  return {
    id: UNGROUPED_DEPT_ID,
    name: '未分组',
    parentId: 0,
  };
}

function initDepartments() {
  const deptMap = new Map<number, NormalizedDepartment>();

  for (const user of users.value) {
    const dept = resolveDepartment(user);
    if (!deptMap.has(dept.id)) {
      deptMap.set(dept.id, {
        id: dept.id,
        name: dept.name,
        parentId: dept.parentId,
        users: [],
      });
    }
    deptMap.get(dept.id)?.users.push(user);
  }

  const sortedDeptIds = Array.from(deptMap.keys()).sort((a, b) => a - b);
  const rootIds = sortedDeptIds.filter((id) => {
    const parentId = deptMap.get(id)?.parentId ?? 0;
    return parentId === 0 || !deptMap.has(parentId);
  });

  const buildTree = (parentId: number): DepartmentNode[] => {
    const childIds = sortedDeptIds.filter(
      (id) => (deptMap.get(id)?.parentId ?? 0) === parentId && id !== parentId,
    );
    return childIds.map((id) => {
      const dept = deptMap.get(id)!;
      const children = buildTree(id);
      return {
        children,
        key: String(id),
        title: `${dept.name} (${dept.users.length}人)`,
      };
    });
  };

  deptTreeData.value = rootIds.map((id) => {
    const dept = deptMap.get(id)!;
    return {
      children: buildTree(id),
      key: String(id),
      title: `${dept.name} (${dept.users.length}人)`,
    };
  });

  normalizedDepartments.value = deptMap;

  if (selectedDeptId.value === null && rootIds.length > 0) {
    selectedDeptId.value = rootIds[0] ?? null;
  }
}

function onDeptSelect(keys: Array<number | string>) {
  if (keys.length === 0) {
    selectedDeptId.value = null;
    return;
  }

  selectedDeptId.value = Number(keys[0]);
}

function getUserNameById(userId: string) {
  return users.value.find((item) => String(item.Sysid) === userId)?.Name ?? '未知用户';
}

function getCurrentDeptName() {
  if (selectedDeptId.value === null) return '';
  return normalizedDepartments.value.get(selectedDeptId.value)?.name ?? '';
}

function toggleUserSelection(userId: string) {
  const index = selectedUserIds.value.indexOf(userId);
  if (index >= 0) {
    selectedUserIds.value.splice(index, 1);
  } else {
    selectedUserIds.value.push(userId);
  }
}

function removeSelectedUser(userId: string) {
  selectedUserIds.value = selectedUserIds.value.filter((id) => id !== userId);
}

function selectAllCurrentDeptUsers() {
  const ids = filteredCurrentDeptUsers.value.map((item) => String(item.Sysid));
  selectedUserIds.value = Array.from(new Set([...selectedUserIds.value, ...ids]));
}

function clearCurrentDeptUsers() {
  const ids = new Set(filteredCurrentDeptUsers.value.map((item) => String(item.Sysid)));
  selectedUserIds.value = selectedUserIds.value.filter((id) => !ids.has(id));
}
</script>

<template>
  <Modal :title="modalTitle" class="w-[980px]">
    <div v-if="mode === 'user'" class="flex h-[620px] gap-3 overflow-hidden">
      <div class="flex min-h-0 w-1/2 flex-col rounded border border-border p-2">
        <div class="mb-2 rounded bg-muted px-3 py-2 text-sm font-medium">部门结构</div>
        <Input v-model:value="deptFilterText" placeholder="按部门或人员名称筛选" allow-clear />
        <div class="mt-2 min-h-0 flex-1 overflow-auto">
          <div v-if="filteredDeptTreeData.length === 0"
            class="flex h-[100px] items-center justify-center text-sm text-muted-foreground">
            {{ deptFilterText ? '无匹配部门' : '暂无部门数据' }}
          </div>
          <Tree v-else :selected-keys="selectedDeptId !== null ? [String(selectedDeptId)] : []"
            :tree-data="filteredDeptTreeData as any" default-expand-all block-node @select="onDeptSelect" />
        </div>
      </div>

      <div class="flex min-h-0 w-1/2 flex-col overflow-hidden rounded border border-border p-2">
        <div class="mb-2 rounded border border-primary/30 bg-primary/5 px-3 py-2">
          <div class="mb-1 flex items-center justify-between text-sm font-medium">
            <span>已选成员 ({{ selectedUserIds.length }})</span>
            <Button v-if="selectedUserIds.length > 0" size="small" danger type="text" @click="selectedUserIds = []">
              清空
            </Button>
          </div>
          <div class="max-h-[120px] min-h-[36px] overflow-auto rounded bg-background p-1">
            <div v-if="selectedUserIds.length === 0"
              class="flex h-[28px] items-center justify-center text-xs text-muted-foreground">
              尚未选择成员
            </div>
            <Tag v-for="userId in selectedUserIds" v-else :key="userId" closable color="processing" class="m-[2px]"
              @close="removeSelectedUser(userId)">
              {{ getUserNameById(userId) }}
            </Tag>
          </div>
        </div>

        <div class="mb-2 rounded bg-muted px-3 py-2 text-sm font-medium">
          {{
            selectedDeptId === null
              ? '请选择部门查看成员'
              : `${getCurrentDeptName()} (${currentDeptUsers.length}人)`
          }}
        </div>

        <div v-if="selectedDeptId === null"
          class="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          请先在左侧选择部门
        </div>

        <div v-else class="flex min-h-0 flex-1 flex-col">
          <Input v-model:value="userFilterText" placeholder="按姓名或编号筛选成员" allow-clear @click.stop @mousedown.stop />
          <div class="my-2 flex gap-2">
            <Button size="small" @click="selectAllCurrentDeptUsers">全选</Button>
            <Button size="small" @click="clearCurrentDeptUsers">清空</Button>
          </div>

          <div class="min-h-0 flex-1 overflow-auto rounded border border-border p-2">
            <div v-if="filteredCurrentDeptUsers.length === 0"
              class="flex h-[100px] items-center justify-center text-sm text-muted-foreground">
              {{ userFilterText ? '无匹配成员' : '该部门暂无成员' }}
            </div>
            <CheckboxGroup v-else v-model:value="selectedUserIds" class="w-full">
              <div v-for="user in filteredCurrentDeptUsers" :key="user.Sysid"
                class="flex cursor-pointer items-center border-b border-border/60 px-1 py-2 last:border-b-0"
                @click="toggleUserSelection(String(user.Sysid))">
                <Checkbox :value="String(user.Sysid)" @click.stop />
                <div class="ml-2">
                  <div class="text-sm">{{ user.Name }}</div>
                  <div class="text-xs text-muted-foreground">{{ user.Code || '无编号' }}</div>
                </div>
              </div>
            </CheckboxGroup>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="max-h-[620px] overflow-auto rounded border border-border p-2">
      <Tree checkable default-expand-all :checked-keys="roleCheckedKeys" :tree-data="roleTreeData as any"
        @check="onRoleTreeCheck" />
    </div>
  </Modal>
</template>
