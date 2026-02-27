import type { IWorkFlowNode } from '#/views/workflow/designer/interfaces';
import { NodeType } from '#/views/workflow/designer/interfaces';
import type { IMaterialUIs } from '#/views/workflow/designer/interfaces/material';
import ApproverSetters from '#/views/workflow/designer/components/setters/approversetters.vue';
import AuditSetters from '#/views/workflow/designer/components/setters/auditsetters.vue';
import ConditionSetters from '#/views/workflow/designer/components/setters/conditionsetters.vue';
import NotifierSetters from '#/views/workflow/designer/components/setters/notifiersetters.vue';

export const materialUis: IMaterialUIs = {
  [NodeType.approver]: {
    defaultConfig: {
      content: '请选择审批人',
      secondary: true,
    },
    settersPanel: ApproverSetters,
    validate: (node: IWorkFlowNode) => {
      if (!node.nodeContent) {
        return '未选择审批人';
      }
      return false;
    },
  },
  [NodeType.audit]: {
    defaultConfig: {
      content: '请选择办理人',
      secondary: true,
    },
    settersPanel: AuditSetters,
    validate: (node: IWorkFlowNode) => {
      if (!node.nodeContent) {
        return '未选择办理人';
      }
      return false;
    },
  },
  [NodeType.condition]: {
    defaultConfig: {
      content: '请设置条件',
    },
    settersPanel: ConditionSetters,
    validate: (node: IWorkFlowNode) => {
      if (!node.config) {
        return '未设置条件';
      }
      return false;
    },
  },
  [NodeType.notifier]: {
    defaultConfig: {
      content: '请选择抄送人',
      secondary: true,
    },
    settersPanel: NotifierSetters,
    validate: (node: IWorkFlowNode) => {
      if (!node.nodeContent) {
        return '未选择抄送人';
      }
      return false;
    },
  },
  [NodeType.start]: {
    defaultConfig: {
      content: '所有人',
    },
  },
};
