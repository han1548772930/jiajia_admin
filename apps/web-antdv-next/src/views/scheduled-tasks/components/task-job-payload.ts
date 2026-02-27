import dayjs from 'dayjs';

import {
  AutoReportType,
  JobType,
  RequestType,
  type TaskApi,
} from '#/api/task';
import type { useTaskFormStore } from '#/store/task-form';

type TaskFormStore = ReturnType<typeof useTaskFormStore>;
type TaskFormValues = TaskFormStore['values'];

export function buildJobParam(
  values: TaskFormValues,
  autoReportTypes: AutoReportType[],
): Record<string, unknown> {
  const param: Record<string, unknown> = {};

  if (Number(values.jobState.jobType) === JobType.HttpRequest) {
    param['HttpMethod'] = Number(values.jobState.httpRequest.requestType);
    param['Url'] = values.jobState.httpRequest.url;
    param['RequestBody'] = null;
    param['Headers'] = null;

    if (values.jobState.httpRequest.postParam.trim()) {
      param['RequestBody'] =
        Number(values.jobState.httpRequest.requestType) === RequestType.GET
          ? null
          : JSON.stringify(values.jobState.httpRequest.postParam);
    } else {
      param['RequestBody'] = JSON.stringify('{}');
    }

    if (values.jobState.httpRequest.headers.length > 0) {
      param['Headers'] = {};

      for (const item of values.jobState.httpRequest.headers) {
        (param['Headers'] as Record<string, string>)[item.key] = item.value;
      }
    }
  }

  if (Number(values.jobState.jobType) === JobType.AutoReport) {
    param['MailConfig'] = null;
    param['FTPConfig'] = null;
    param['LoopSQL'] = values.jobState.loopSQL;

    if (autoReportTypes.includes(AutoReportType.EMAIL)) {
      param['MailConfig'] = {
        Subject: values.jobState.autoReportState.subject,
        Body: values.jobState.autoReportState.body,
        To: values.jobState.autoReportState.to,
        CC: values.jobState.autoReportState.cc,
        IsBodyHtml: true,
        AttachmentsConfig: null as null | Record<string, unknown>[],
      };

      if (
        values.jobState.autoReportState.isAppendix &&
        values.jobState.autoReportState.appendix.length > 0
      ) {
        (param['MailConfig'] as Record<string, unknown>)['AttachmentsConfig'] = [];

        for (const appendix of values.jobState.autoReportState.appendix) {
          (
            (param['MailConfig'] as Record<string, unknown>)['AttachmentsConfig'] as Record<string, unknown>[]
          ).push({
            FileName: appendix.fileName,
            SQL: appendix.sql,
            FileType: appendix.fileType,
            EmptySend: appendix.emptySend,
            EmptySendMail: appendix.emptySendMail,
            PasswordSQL: appendix.passwordSQL.trim() ?? null,
          });
        }
      }
    }

    if (autoReportTypes.includes(AutoReportType.FTP)) {
      param['FTPConfig'] = {
        Host: values.jobState.autoReportState.host,
        Username: values.jobState.autoReportState.username,
        Password: values.jobState.autoReportState.password,
        Port: values.jobState.autoReportState.port,
        RemotePath: values.jobState.autoReportState.remotePath,
      };
    }
  }

  if (Number(values.jobState.jobType) === JobType.EXE) {
    param['Path'] = values.jobState.exe.path;
    param['Arguments'] = values.jobState.exe.arguments;
  }

  if (Number(values.jobState.jobType) === JobType.DLL) {
    param['Path'] = values.jobState.dll.path;
    param['FullClassName'] = values.jobState.dll.fullClassName;
    param['MethodName'] = values.jobState.dll.methodName;
    param['MethodParam'] = values.jobState.dll.methodParam;
  }

  if (Number(values.jobState.jobType) === JobType.SCRIPT) {
    param['Path'] = values.jobState.script.path;
    param['Arguments'] = values.jobState.script.arguments;
  }

  return param;
}

export function buildCreateJobPayload(
  values: TaskFormValues,
  param: Record<string, unknown>,
): TaskApi.CreateJobRequest {
  return {
    GroupId: values.jobState.groupId,
    JobName: values.jobState.jobName,
    JobType: Number(values.jobState.jobType),
    JobStatus: values.jobState.jobStatus ? 1 : 0,
    Param: JSON.stringify(param),
    Cron: values.jobState.cron,
    StartTime: (values.jobState.startTime || dayjs()).toDate(),
    EndTime: values.jobState.endTime?.toDate() ?? null,
  };
}

export function buildUpdateJobPayload(
  values: TaskFormValues,
  param: Record<string, unknown>,
): TaskApi.UpdateJobRequest {
  return {
    ...buildCreateJobPayload(values, param),
    JobId: values.jobState.jobId,
  };
}
