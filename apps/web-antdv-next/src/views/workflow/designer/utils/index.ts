import { message } from 'antdv-next';

import type { NodeUsersDetail } from '#/views/workflow/designer/types';
import type { IWorkFlowNode } from '#/views/workflow/designer/interfaces';
import { SelectRangeEnum } from '#/views/workflow/designer/interfaces';
import { createUuid } from '#/views/workflow/designer/utils/create-uuid';

export function notifyError(msg: string, duration = 4.5) {
  message.error({ content: msg, duration });
}

export function notifySuccess(msg: string, duration = 4.5) {
  message.success({ content: msg, duration });
}

export function showLoading(msg = '加载中...') {
  return message.loading({ content: msg, duration: 20 });
}

export function handleStatusColor(status: string) {
  switch (status) {
    case '审批中': {
      return 'blue';
    }
    case '审批失败': {
      return 'red';
    }
    case '审批通过': {
      return 'green';
    }
    default: {
      return 'default';
    }
  }
}

export function getSelectRangeName(type: number) {
  switch (type) {
    case 1: {
      return '所有人';
    }
    case 2: {
      return '指定人员';
    }
    case 3: {
      return '指定角色';
    }
    case 4: {
      return '发起人';
    }
    case 5: {
      return '制单人';
    }
    case 6: {
      return '上级主管';
    }
    default: {
      return '';
    }
  }
}

export function getExamineModeEnum(type: number) {
  switch (type) {
    case 1: {
      return '依次审批';
    }
    case 2: {
      return '会签(需所有审批人同意)';
    }
    case 3: {
      return '或签(任意一名审批人处理即可)';
    }
    default: {
      return '';
    }
  }
}

function capitalizeFirstLetter(value: string, mode: 1 | 2) {
  const first = mode === 1 ? value.charAt(0).toUpperCase() : value.charAt(0).toLowerCase();
  return `${first}${value.slice(1)}`;
}

function resolveNodeType(type?: number) {
  if (type === 1) return 'approver';
  if (type === 2) return 'notifier';
  if (type === 3) return 'audit';
  if (type === 4) return 'route';
  if (type === 5) return 'condition';
  return undefined;
}

export function capitalizeObjectKeys(obj: any, mode: 1 | 2): any {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => capitalizeObjectKeys(item, mode));
  }

  if (typeof obj !== 'object') return obj;

  const next: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = capitalizeFirstLetter(key, mode);
    next[newKey] = capitalizeObjectKeys(value, mode);
  }

  if (mode === 2) {
    const nodeType = resolveNodeType(next.type);
    if (nodeType) {
      next.nodeType = nodeType;
      if (!next.id) {
        next.id = createUuid();
      }
    }
  }

  return next;
}

export function transformArray(data: NodeUsersDetail[]) {
  const byId = new Map<number, any>();
  for (const item of data) {
    byId.set(item.Sysid, {
      children: [],
      key: String(item.Sysid),
      title: item.Name,
    });
  }

  for (const item of data) {
    if (item.ParentId !== 0) {
      const parent = byId.get(item.ParentId);
      const current = byId.get(item.Sysid);
      if (parent && current) {
        parent.children.push(current);
      }
    }
  }

  return data
    .filter((item) => item.ParentId === 0)
    .map((item) => byId.get(item.Sysid))
    .filter(Boolean);
}

export function findEmptyNodeUsers(
  node: IWorkFlowNode,
  result: Array<{ name: string; selectRange: SelectRangeEnum }> = [],
) {
  if (
    node.nodeUsers &&
    node.nodeUsers.length === 0 &&
    node.selectRange &&
    ![SelectRangeEnum.starter, SelectRangeEnum.supervisor, SelectRangeEnum.originator].includes(
      node.selectRange,
    )
  ) {
    result.push({
      name: node.name ?? '',
      selectRange: node.selectRange,
    });
  }

  if (node.childNode) {
    findEmptyNodeUsers(node.childNode, result);
  }

  return result;
}



