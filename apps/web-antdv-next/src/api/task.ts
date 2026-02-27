import type { ApiResponse as BaseApiResponse } from './types';

import { requestClient } from '#/api/request';

export namespace TaskApi {
  /** 基础实体 */
  export interface BaseEntity {
    Sysid: number;
    CreateDate: string;
    CreatorId?: number;
    EditTime?: string;
    EditorId?: number;
  }

  /** API 标准响应 */
  export type ApiResponse<T = unknown> = BaseApiResponse<T>;

  /** 任务组 */
  export interface AutoTaskGroupItem extends BaseEntity {
    Name: string;
    Jobs?: JobData[];
    ParentId?: number;
  }

  /** 任务数据 */
  export interface JobData {
    JobId: number;
    JobName: string;
    JobStatus: number;
    JobType: number;
    Param: string;
    GroupId: number;
    GroupName: string;
    CreateDate: string;
    StartTime: string;
    EndTime: string;
    LastExecution: string;
    NextExecution: string;
    Cron: string;
  }

  /** 任务日志 */
  export interface AutoReportJobLog {
    HfSetId: number;
    JobName: string;
    Namespace: string;
    Method: string;
    ParameterTypes: string;
    Arguments: string;
    CreateAt: string;
    State: string;
    Description: string;
    ExceptionType: string | null;
    ExceptionMessage: string | null;
    ExceptionDetails: string | null;
  }

  /** 创建任务请求 */
  export interface CreateJobRequest {
    JobName: string;
    JobType: number;
    JobStatus: number;
    Cron: string;
    Param: string;
    GroupId: number;
    StartTime: Date | string;
    EndTime?: Date | null | string;
  }

  /** 更新任务请求 */
  export interface UpdateJobRequest extends CreateJobRequest {
    JobId: number;
  }

  /** 附件 */
  export interface Appendix {
    fileName: string;
    sql: string;
    fileType: 'csv' | 'xlsx';
    emptySend: boolean;
    emptySendMail: boolean;
    showPasswordSQL: boolean;
    passwordSQL: string;
  }

  /** 请求头 */
  export interface Header {
    key: string;
    value: string;
  }
}

/** 任务类型 */
export enum JobType {
  HttpRequest = 0,
  AutoReport = 1,
  EXE = 2,
  DLL = 3,
  SCRIPT = 4,
}

/** 请求类型 */
export enum RequestType {
  GET = 0,
  POST = 1,
  UNKNOWN = -1,
}

/** 任务操作类型 */
export enum JobOperateType {
  ADD = 0,
  EDIT = 1,
  DELETE = 2,
  COPY = 3,
}

/** 自动报告类型 */
export enum AutoReportType {
  EMAIL = 0,
  FTP = 1,
  EMAIL_AND_FTP = 2,
}

// ========== 任务组 ==========

/** 获取所有任务组 */
export async function getTaskGroupListApi() {
  return requestClient.get<TaskApi.ApiResponse<TaskApi.AutoTaskGroupItem[]>>(
    '/auto-task-group/get',
  );
}

/** 创建任务组 */
export async function createTaskGroupApi(name: string, parentId: number) {
  return requestClient.post<TaskApi.ApiResponse<null>>(
    '/auto-task-group/add',
    { Name: name, ParentId: parentId },
  );
}

/** 更新任务组 */
export async function updateTaskGroupApi(
  id: number,
  name: string,
  parentId?: number,
) {
  return requestClient.post<TaskApi.ApiResponse<null>>(
    '/auto-task-group/edit',
    { Sysid: id, Name: name, ParentId: parentId },
  );
}

/** 删除任务组 */
export async function deleteTaskGroupApi(id: number) {
  return requestClient.post<TaskApi.ApiResponse<null>>(
    `/auto-task-group/delete/${id}`,
  );
}

// ========== 任务 ==========

/** 获取所有任务 */
export async function getJobListApi() {
  return requestClient.get<TaskApi.ApiResponse<TaskApi.JobData[]>>(
    '/auto-task/get-job',
  );
}

/** 创建任务 */
export async function createJobApi(data: TaskApi.CreateJobRequest) {
  return requestClient.post<TaskApi.ApiResponse<null>>(
    '/auto-task/add-job',
    data,
  );
}

/** 更新任务 */
export async function updateJobApi(data: TaskApi.UpdateJobRequest) {
  return requestClient.post<TaskApi.ApiResponse<null>>(
    '/auto-task/update-job',
    data,
  );
}

/** 删除任务 */
export async function deleteJobApi(id: number) {
  return requestClient.post<TaskApi.ApiResponse<null>>(
    `/auto-task/delete-job/${id}`,
  );
}

/** 立即触发任务 */
export async function triggerJobApi(id: number) {
  return requestClient.post<TaskApi.ApiResponse<null>>(
    `/auto-task/trigger-now/${id}`,
  );
}

/** 获取任务日志 */
export async function getJobLogsApi(id: number) {
  return requestClient.get<TaskApi.ApiResponse<TaskApi.AutoReportJobLog[]>>(
    `/auto-task/get-log/${id}`,
  );
}
