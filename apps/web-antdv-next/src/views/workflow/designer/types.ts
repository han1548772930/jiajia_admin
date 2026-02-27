import type { WorkflowApi } from '#/api/workflow';

export type Category = WorkflowApi.Category;
export type MenuItem = WorkflowApi.MenuItem;
export type NodeUsersDetail = WorkflowApi.NodeUserDetail;
export type TemplateField = WorkflowApi.TemplateField;
export type TemplateData = WorkflowApi.TemplateDetail;

export interface Response<T> {
  Code: number;
  Data: T;
  Extras: null;
  Message: string;
  Success: boolean;
  Timestamp: number;
}

export interface FormState {
  auditServiceName?: string;
  billFormNamespace?: string;
  dataBrowseFilename?: string;
  enable?: boolean;
  isDefault?: boolean;
  name?: string;
  remark?: string;
  sysid?: number;
  type?: number | string;
}
