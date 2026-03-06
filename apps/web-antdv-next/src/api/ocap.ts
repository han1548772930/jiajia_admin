import type { ApiResponse as BaseApiResponse } from './types';

import { requestClient } from '#/api/request';

export namespace OcapApi {
  export type ApiResponse<T = unknown> = BaseApiResponse<T>;

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
    StepName: null | number | string;
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
    OcapInstanceNodeUserVs: OcapInstanceNodeUser[];
    OcapInstanceNodeValueVs: OcapInstanceNodeValue[];
    OcapInstanceNodeVs: OcapInstanceNode[];
    OcapInstanceV: OcapInstance;
  }

  export interface OcapInstanceEditNodeValue {
    FieldId: number;
    FieldValue: string;
  }

  export interface OcapInstanceNodeUser {
    NodeId: number;
    OcapId: number;
    ProcessId: number;
    Sysid: number;
    UserCode: string;
    UserId: number;
    UserName: string;
  }


  export interface OcapInstanceEditNodeUser {
    NodeId: number;
    UserId: number;
  }

  export interface OcapNodeInfo {
    ApprovalStatus: string;
    ApprovalStatusEnum: number;
    Code: string;
    CreateDate: null | string;
    CreatorCode: null | string;
    CreatorId: null | number;
    CreatorName: null | string;
    EditTime: null | string;
    EditorCode: null | string;
    EditorId: null | number;
    EditorName: null | string;
    Name: string;
    Remark: null | string;
    Seq: number;
    Sysid: number;
  }

  export interface OcapNodeField {
    Caption: string;
    ControlItem: null | string;
    ControlType: string;
    CreateDate: null | string;
    CreatorCode: null | string;
    CreatorId: null | number;
    CreatorName: null | string;
    DefaultValue: null | string;
    EditTime: null | string;
    EditorCode: null | string;
    EditorId: null | number;
    EditorName: null | string;
    FieldName: string;
    FieldType: string;
    Length: number;
    NodeId: number;
    ReadOnly: number;
    Seq: number;
    Sysid: number;
    ValidateRules: null | string;
  }

  export interface OcapNodeUser {
    NodeId: number;
    Sysid: number;
    UserCode: string;
    UserId: number;
    UserName: string;
  }

  export interface OcapNodeDetail {
    NodeFieldList: OcapNodeField[];
    NodeUserList: OcapNodeUser[];
    OcapNode: OcapNodeInfo;
  }

  export interface OcapInstanceEditPayload {
    InstanceId: number;
    NodeId: number;
    NodeUsers: OcapInstanceEditNodeUser[];
    NodeValues: OcapInstanceEditNodeValue[];
    ProcessId: number;
  }

  export interface OcapInstanceJumpPayload {
    InstanceId: number;
    NodeId: number;
    ProcessId: number;
  }
}

export async function getOcapInstanceDetailApi(ocapId: number) {
  return requestClient.get<OcapApi.ApiResponse<OcapApi.OcapInstanceDetail>>(
    `/ocap-instance/query-single/${ocapId}`,
    {
      responseReturn: 'body',
    },
  );
}

export async function getOcapNodeDetailApi(nodeId: number) {
  return requestClient.get<OcapApi.ApiResponse<OcapApi.OcapNodeDetail>>(
    `/ocap/node/query-single/${nodeId}`,
    {
      responseReturn: 'body',
    },
  );
}

export async function editOcapInstanceApi(data: OcapApi.OcapInstanceEditPayload) {
  return requestClient.post<OcapApi.ApiResponse<null>>('/ocap-instance/edit', data, {
    responseReturn: 'body',
  });
}

export async function jumpLastOcapInstanceNodeApi(data: OcapApi.OcapInstanceJumpPayload) {
  return requestClient.post<OcapApi.ApiResponse<null>>('/ocap-instance/jump-last-node', data, {
    responseReturn: 'body',
  });
}

export async function jumpOcapInstanceNodeByIdApi(data: OcapApi.OcapInstanceJumpPayload) {
  return requestClient.post<OcapApi.ApiResponse<null>>('/ocap-instance/jump-by-node-id', data, {
    responseReturn: 'body',
  });
}

