import { createIconifyIcon } from '@vben/icons';

import { NodeType, SelectRangeEnum } from '#/views/workflow/designer/interfaces';
import type { INodeMaterial } from '#/views/workflow/designer/interfaces/material';
import { createUuid } from '#/views/workflow/designer/utils/create-uuid';

const approverIcon = createIconifyIcon('lucide:badge-check');
const notifierIcon = createIconifyIcon('lucide:bell');
const dealIcon = createIconifyIcon('lucide:file-pen-line');
const routeIcon = createIconifyIcon('lucide:git-branch');

export const defaultMaterials: INodeMaterial[] = [
  {
    color: 'rgb(87, 106, 149)',
    defaultConfig: {
      nodeType: NodeType.start,
    },
    hidden: true,
    label: '发起人',
  },
  {
    color: '#ff943e',
    defaultConfig: {
      nodeType: NodeType.approver,
      nodeUsers: [],
      selectRange: SelectRangeEnum.user,
    },
    icon: approverIcon,
    label: '审批人',
  },
  {
    color: '#4ca3fb',
    defaultConfig: {
      nodeType: NodeType.notifier,
      nodeUsers: [],
      selectRange: SelectRangeEnum.user,
    },
    icon: notifierIcon,
    label: '抄送人',
  },
  {
    color: '#fb602d',
    defaultConfig: {
      nodeType: NodeType.audit,
    },
    hidden: true,
    icon: dealIcon,
    label: '办理人',
  },
  {
    color: '#15bc83',
    createDefault: () => {
      return {
        conditionNodeList: [
          {
            id: createUuid(),
            name: '条件1',
            nodeType: NodeType.condition,
          },
          {
            id: createUuid(),
            name: '条件2',
            nodeType: NodeType.condition,
          },
        ],
        id: createUuid(),
        nodeType: NodeType.route,
      };
    },
    icon: routeIcon,
    label: '条件分支',
  },
  {
    color: '',
    defaultConfig: {
      nodeType: NodeType.condition,
    },
    hidden: true,
    label: '条件节点',
  },
];
