import type { TaskApi } from '#/api/task';

export interface GroupNode extends TaskApi.AutoTaskGroupItem {
  children?: GroupNode[];
  _jobCount?: number;
}

export function buildGroupTree(
  items: TaskApi.AutoTaskGroupItem[],
  jobs: TaskApi.JobData[],
): GroupNode[] {
  const map = new Map<number, GroupNode>();
  const roots: GroupNode[] = [];

  for (const item of items) {
    const jobCount = jobs.filter((job) => job.GroupId === item.Sysid).length;
    map.set(item.Sysid, { ...item, children: [], _jobCount: jobCount });
  }

  for (const item of items) {
    const parentId = item.ParentId || 0;
    const node = map.get(item.Sysid)!;

    if (parentId !== 0 && map.has(parentId)) {
      map.get(parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  const countDeep = (node: GroupNode): number => {
    let total = node._jobCount || 0;

    for (const child of node.children || []) {
      total += countDeep(child);
    }

    node._jobCount = total;
    return total;
  };

  roots.forEach(countDeep);
  return roots.sort((a, b) => a.Sysid - b.Sysid);
}

export function findGroupNode(nodes: GroupNode[], id: number): GroupNode | null {
  for (const node of nodes) {
    if (node.Sysid === id) {
      return node;
    }

    const child = findGroupNode(node.children || [], id);
    if (child) {
      return child;
    }
  }

  return null;
}

export function findGroupParent(
  nodes: GroupNode[],
  id: number,
  parent: GroupNode | null = null,
): GroupNode | null {
  for (const node of nodes) {
    if (node.Sysid === id) {
      return parent;
    }

    const found = findGroupParent(node.children || [], id, node);
    if (found !== null) {
      return found;
    }
  }

  return null;
}

export function collectGroupJobs(
  node: GroupNode,
  jobs: TaskApi.JobData[],
): TaskApi.JobData[] {
  const ids = new Set<number>();

  const walk = (current: GroupNode) => {
    ids.add(current.Sysid);

    for (const child of current.children || []) {
      walk(child);
    }
  };

  walk(node);

  return jobs.filter((job) => ids.has(job.GroupId));
}
