import type { Component } from 'vue';

import type { IWorkFlowNode, NodeType, NodeUsersList, SelectRangeEnum } from './workflow';

export interface MaterialNodeDefaultConfig {
  nodeType: NodeType;
  nodeUsers?: NodeUsersList[];
  selectRange?: SelectRangeEnum;
}

export interface INodeMaterial {
  color: string;
  label: string;
  icon?: Component;
  defaultConfig?: MaterialNodeDefaultConfig;
  createDefault?: () => IWorkFlowNode;
  hidden?: boolean;
}

export interface MaterialDefaultConfig {
  secondary?: boolean;
  content?: string;
}

export interface IMaterialUI<FlowNode extends IWorkFlowNode> {
  defaultConfig?: MaterialDefaultConfig;
  settersPanel?: Component;
  handleConfirm?: () => void;
  validate?: (node: FlowNode) => false | string | undefined;
}

export interface IMaterialUIs {
  [nodeType: string]: IMaterialUI<IWorkFlowNode> | undefined;
}
