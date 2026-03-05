import type { ApiResponse as BaseApiResponse } from './types';

import { requestClient } from '#/api/request';

export namespace WorkflowApi {
  export type ApiResponse<T = unknown> = BaseApiResponse<T>;

  export interface Category {
    Name: string;
    Remark: string;
    Sysid: number;
  }

  export interface TemplateItem {
    Category: Category;
    CategoryId: number;
    Code: string;
    IsEnable: number;
    Name: string;
    Remark: null | string;
    Sysid: number;
    TargetTable: string;
  }

  export interface NodeUser {
    TargetId: number;
    Type: number;
  }

  export interface WorkflowNode {
    ChildNode: null | WorkflowNode;
    ExamineMode: number;
    Name: string;
    NodeUsers: NodeUser[];
    Remark: string;
    SelectRange: number;
    Type: number;
  }

  export interface TemplateDetail {
    AuditServiceName: string;
    BillFormNamespace: string;
    Category: Category;
    CategoryId: number;
    Code: string;
    CreateDate: string;
    CreatorId: number;
    DataBrowseFilename: null | string;
    EditTime: string;
    EditorId: number;
    IsDefault: number;
    IsEnable: number;
    Name: string;
    Node: WorkflowNode;
    Remark: null | string;
    Sysid: number;
    TargetTable: null | string;
  }

  export interface SaveTemplatePayload {
    AuditServiceName: string;
    BillFormNamespace: string;
    CategoryId: number;
    DataBrowseFilename: string;
    IsDefault: number;
    IsEnable: number;
    Name: string;
    Node: null | Record<string, any>;
    Remark: string;
  }

  export interface InstanceItem {
    ActiveNodeName: string;
    BillCode: string;
    BillFormNamespace: string;
    BillId: number;
    CategoryName: string;
    CreateDate: string;
    Creator: string;
    IsDel: number;
    Status: string;
    Sysid: number;
    TemplateName: string;
  }

  export interface ApprovalOpHistory {
    Activity: number;
    Content: null | string;
    CreateDate: null | string;
    NodeName: string;
    Remark: null | string;
  }

  export interface ApprovalNode {
    Activity: number;
    NodeId: null | number;
    NodeName: string;
    Seq: number;
    VerifyUsersName: null | string;
  }

  export interface Field {
    FieldLabel: string;
    FieldName: string;
    FieldValue: string;
    Seq: number;
  }

  export interface MainTable {
    Fields: Field[];
  }

  export interface SubTableRow {
    Fields: Field[];
    RowNumber: number;
  }

  export interface SubTable {
    Rows: SubTableRow[];
    TableLabel: string;
    TabledName: string;
  }

  export interface ReportForm {
    InstanceInfo?: InstanceItem;
    MainTable?: MainTable;
    SubTables?: SubTable[];
  }

  export interface MenuItem {
    Code: string;
    Name: string;
    Parentid: number;
    Seq: null | number;
    Sysid: number;
  }

  export interface NodeUserDetail {
    Code?: string;
    Department?: {
      Name?: string;
      ParentId?: number;
      Sysid?: number;
    };
    DepartmentId?: number;
    DepartmentName?: string;
    Name: string;
    ParentId: number;
    Sysid: number;
    Type: number;
  }

  export interface TemplateField {
    DbFieldName: string;
    FieldLabel: string;
    FieldName: string;
    TableName: string;
  }

  export interface Department {
    Code: string;
    CreateDate: string;
    Creator: string;
    EditTime: string;
    Editor: string;
    Name: string;
    ParentId: number;
    Seq: number;
    Sysid: number;
  }

  export interface DepartmentUser {
    Code: string;
    CreateDate: string;
    Creator: string;
    EditTime: string;
    Editor: string;
    Email: string;
    IsMaster: boolean;
    Name: string;
    Remark: null | string;
    Status: string;
    Sysid: number;
    Tel: null | string;
  }

  export interface OcapInstance {
    ApprovalStatusEnum: null | number;
    BadQty: null | number;
    Code: string;
    CreateDate: null | string;
    CreatorId: null | number;
    CurrNodeId: null | number;
    CustCode: null | string;
    CustName: null | string;
    EditTime: null | string;
    EditorId: null | number;
    EqpCode: null | string;
    EqpId: null | number;
    EqpName: null | string;
    Lot: null | string;
    LotId: null | number;
    Name: string;
    PddId: null | number;
    PoId: null | number;
    ProcessCode: null | string;
    ProcessId: null | number;
    ProcessName: null | string;
    Qty: null | number;
    Remark: null | string;
    Result: null | string;
    StepCode: null | string;
    StepId: null | number;
    StepName: null | string;
    Sysid: number;
    WoCode: null | string;
    WoId: null | number;
    Finish: boolean;
  }

  export interface OcapInstanceNode {
    Finish: boolean;
    NodeCode: string;
    NodeId: number;
    NodeName: string;
    OcapId: number;
    ProcessId: number;
    Seq: number;
    Sysid: number;
  }

  export interface OcapInstanceNodeValue {
    Caption: string;
    ControlItem: null | string;
    ControlType: string;
    Default: null | string;
    FieldId: number;
    FieldName: string;
    FieldType: string;
    FieldValue: boolean | null | number | string;
    Length: number;
    NodeId: number;
    OcapId: number;
    ProcessId: number;
    ReadOnly: number;
    Seq: number;
    Sysid: number;
    ValidateRules: null | string;
  }

  export interface OcapInstanceDetail {
    OcapInstanceNodeValueVs: OcapInstanceNodeValue[];
    OcapInstanceNodeVs: OcapInstanceNode[];
    OcapInstanceV: OcapInstance;
  }

  export interface OcapInstanceEditNodeValue {
    FieldId: number;
    FieldValue: string;
  }

  export interface OcapInstanceEditPayload {
    InstanceId: number;
    NodeId: number;
    NodeValues: OcapInstanceEditNodeValue[];
    ProcessId: number;
  }

  export interface OcapInstanceJumpPayload {
    InstanceId: number;
    NodeId: number;
    ProcessId: number;
  }
}

export enum WorkflowVerifyResult {
  Approve = 2,
  Reject = 3,
}

export async function getMyBillApi() {
  return requestClient.get<WorkflowApi.ApiResponse<WorkflowApi.InstanceItem[]>>(
    '/workflow/instance/my-bill',
  );
}

export async function getTodoApi() {
  return requestClient.get<WorkflowApi.ApiResponse<WorkflowApi.InstanceItem[]>>(
    '/workflow/instance/todo',
  );
}

export async function getDoneApi() {
  return requestClient.get<WorkflowApi.ApiResponse<WorkflowApi.InstanceItem[]>>(
    '/workflow/instance/done',
  );
}

export async function getOpHistoryApi(instanceId: number) {
  return requestClient.get<WorkflowApi.ApiResponse<WorkflowApi.ApprovalOpHistory[]>>(
    `/workflow/instance/get-op-his/${instanceId}`,
  );
}

export async function getApprovalNodesApi(instanceId: number) {
  return requestClient.get<WorkflowApi.ApiResponse<WorkflowApi.ApprovalNode[]>>(
    `/workflow/instance/get-nodes/${instanceId}`,
  );
}

export async function getReportFormApi(data: WorkflowApi.InstanceItem) {
  return requestClient.post<WorkflowApi.ApiResponse<WorkflowApi.ReportForm>>(
    '/workflow/instance/view-we-chat-data',
    data,
  );
}

export async function verifyInstanceApi(
  instanceId: number,
  remark: string,
  result: WorkflowVerifyResult,
) {
  return requestClient.post<WorkflowApi.ApiResponse<null>>(
    '/workflow/instance/verify',
    {
      EVerificationResult: result,
      InstanceId: instanceId,
      Remark: remark,
    },
  );
}

export async function getAllCategoryApi() {
  return requestClient.get<WorkflowApi.ApiResponse<WorkflowApi.Category[]>>(
    '/workflow/category/get-all',
  );
}

export async function addCategoryApi(name: string, remark: string) {
  return requestClient.post<WorkflowApi.ApiResponse<WorkflowApi.Category>>(
    '/workflow/category/create',
    { Name: name, Remark: remark },
  );
}

export async function updateCategoryApi(
  sysid: number,
  name: string,
  remark: string,
) {
  return requestClient.post<WorkflowApi.ApiResponse<WorkflowApi.Category>>(
    '/workflow/category/update',
    { Name: name, Remark: remark, Sysid: sysid },
  );
}

export async function deleteCategoryApi(sysid: number) {
  return requestClient.post<WorkflowApi.ApiResponse<null>>(
    `/workflow/category/delete/${sysid}`,
  );
}

export async function getAllTemplateApi() {
  return requestClient.get<WorkflowApi.ApiResponse<WorkflowApi.TemplateItem[]>>(
    '/workflow/template/get-all',
  );
}

export async function getTemplateApi(sysid: number) {
  return requestClient.get<WorkflowApi.ApiResponse<WorkflowApi.TemplateDetail>>(
    `/workflow/template/get/${sysid}`,
  );
}

export async function createTemplateApi(data: WorkflowApi.SaveTemplatePayload) {
  return requestClient.post<WorkflowApi.ApiResponse<WorkflowApi.TemplateDetail>>(
    '/workflow/template/create',
    data,
  );
}

export async function updateTemplateApi(
  data: WorkflowApi.SaveTemplatePayload & { Sysid: number },
) {
  return requestClient.post<WorkflowApi.ApiResponse<WorkflowApi.TemplateDetail>>(
    '/workflow/template/update',
    data,
  );
}

export async function deleteTemplateApi(sysid: number) {
  return requestClient.post<WorkflowApi.ApiResponse<null>>(
    `/workflow/template/delete/${sysid}`,
  );
}

export async function getAllMenusApi() {
  return requestClient.get<WorkflowApi.ApiResponse<WorkflowApi.MenuItem[]>>(
    '/workflow/category/get-menus',
  );
}

export async function getSysRoleApi() {
  return requestClient.get<WorkflowApi.ApiResponse<WorkflowApi.NodeUserDetail[]>>(
    '/workflow/sys-role/get-all',
  );
}

export async function getSysUserApi() {
  return requestClient.get<WorkflowApi.ApiResponse<WorkflowApi.NodeUserDetail[]>>(
    '/workflow/sys-user/get-all',
  );
}

export async function getTemplateFieldApi(billformnamespace: string) {
  return requestClient.get<WorkflowApi.ApiResponse<WorkflowApi.TemplateField[]>>(
    `/workflow/template/get-template-field/${encodeURIComponent(billformnamespace)}`,
  );
}

export async function getAllDepartmentsApi() {
  return requestClient.get<WorkflowApi.ApiResponse<WorkflowApi.Department[]>>(
    '/dept@2/get-all',
  );
}

export async function getUsersByDeptApi(deptId: number) {
  return requestClient.get<WorkflowApi.ApiResponse<WorkflowApi.DepartmentUser[]>>(
    `/sys-user/get-user-by-dept/${deptId}`,
  );
}

export async function getOcapInstanceDetailApi(ocapId: number) {
  return requestClient.get<WorkflowApi.ApiResponse<WorkflowApi.OcapInstanceDetail>>(
    `/ocap-instance/query-single/${ocapId}`,
    {
      responseReturn: 'body',
    },
  );
}

export async function editOcapInstanceApi(data: WorkflowApi.OcapInstanceEditPayload) {
  return requestClient.post<WorkflowApi.ApiResponse<null>>('/ocap-instance/edit', data, {
    responseReturn: 'body',
  });
}

export async function jumpLastOcapInstanceNodeApi(data: WorkflowApi.OcapInstanceJumpPayload) {
  return requestClient.post<WorkflowApi.ApiResponse<null>>('/ocap-instance/jump-last-node', data, {
    responseReturn: 'body',
  });
}

export async function jumpOcapInstanceNodeByIdApi(data: WorkflowApi.OcapInstanceJumpPayload) {
  return requestClient.post<WorkflowApi.ApiResponse<null>>('/ocap-instance/jump-by-node-id', data, {
    responseReturn: 'body',
  });
}
