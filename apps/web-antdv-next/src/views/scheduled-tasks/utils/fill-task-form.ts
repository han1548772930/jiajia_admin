import { message } from 'antdv-next';
import dayjs from 'dayjs';

import {
  AutoReportType,
  JobOperateType,
  JobType,
  type TaskApi,
} from '#/api/task';
import type { useTaskFormStore } from '#/store/task-form';

import { getJobRequestType } from '../helpers';

type TaskFormStore = ReturnType<typeof useTaskFormStore>;

export function fillTaskFormFromJob(
  taskForm: TaskFormStore,
  params: TaskApi.JobData,
  opType: JobOperateType,
) {
  taskForm.setFieldValue('jobState.groupId', params.GroupId);
  taskForm.setFieldValue('jobState.jobName', params.JobName);
  taskForm.setFieldValue('jobState.jobType', params.JobType);
  taskForm.setFieldValue('jobState.jobStatus', params.JobStatus === 1);
  taskForm.setFieldValue('jobState.cron', params.Cron);
  taskForm.setFieldValue('jobState.startTime', params.StartTime ? dayjs(params.StartTime) : null);
  taskForm.setFieldValue('jobState.endTime', params.EndTime ? dayjs(params.EndTime) : null);
  taskForm.setFieldValue('jobState.jobId', params.JobId);

  try {
    const paramObject = JSON.parse(params.Param);
    taskForm.setFieldValue('jobState.loopSQL', paramObject['LoopSQL'] ?? 'select 1 from dual');

    if (params.JobType === JobType.HttpRequest) {
      if (paramObject['HttpMethod'] !== undefined) {
        taskForm.setFieldValue('jobState.httpRequest.requestType', getJobRequestType(paramObject['HttpMethod']));
        taskForm.setFieldValue('jobState.httpRequest.url', paramObject['Url']);
      }

      const headers = paramObject['Headers'];
      for (const key in headers) {
        taskForm.pushHeader({ key, value: headers[key] });
      }

      if (paramObject['RequestBody']) {
        taskForm.setFieldValue('jobState.httpRequest.postParam', JSON.parse(paramObject['RequestBody']));
      }
    }

    if (params.JobType === JobType.AutoReport) {
      const mailConfig = paramObject['MailConfig'];
      const ftpConfig = paramObject['FTPConfig'];
      taskForm.setFieldValue('jobState.autoReportState.type', []);

      if (mailConfig) {
        taskForm.setFieldValue('jobState.autoReportState.subject', mailConfig['Subject']);
        taskForm.setFieldValue('jobState.autoReportState.body', mailConfig['Body']);
        taskForm.setFieldValue('jobState.autoReportState.to', mailConfig['To']);
        taskForm.setFieldValue('jobState.autoReportState.cc', mailConfig['CC']);

        const file = mailConfig['AttachmentsConfig'];
        taskForm.setFieldValue('jobState.autoReportState.isAppendix', false);

        if (file) {
          taskForm.setFieldValue('jobState.autoReportState.isAppendix', true);

          for (const current of file) {
            taskForm.pushAppendix({
              fileName: current['FileName'],
              sql: current['SQL'],
              fileType: current['FileType'],
              emptySend: current['EmptySend'] ?? false,
              emptySendMail: current['EmptySendMail'] ?? false,
              showPasswordSQL: Boolean(current['PasswordSQL']),
              passwordSQL: current['PasswordSQL'] ?? '',
            });
          }
        }

        taskForm.handleAutoReportCheckbox(true, AutoReportType.EMAIL);
      }

      if (ftpConfig) {
        taskForm.setFieldValue('jobState.autoReportState.host', ftpConfig['Host']);
        taskForm.setFieldValue('jobState.autoReportState.port', ftpConfig['Port']);
        taskForm.setFieldValue('jobState.autoReportState.username', ftpConfig['Username']);
        taskForm.setFieldValue('jobState.autoReportState.password', ftpConfig['Password']);
        taskForm.setFieldValue('jobState.autoReportState.remotePath', ftpConfig['RemotePath']);
        taskForm.handleAutoReportCheckbox(true, AutoReportType.FTP);
      }
    }

    if (params.JobType === JobType.EXE) {
      taskForm.setFieldValue('jobState.exe.path', paramObject['Path']);
      taskForm.setFieldValue('jobState.exe.arguments', paramObject['Arguments']);
    }

    if (params.JobType === JobType.DLL) {
      taskForm.setFieldValue('jobState.dll.path', paramObject['Path']);
      taskForm.setFieldValue('jobState.dll.fullClassName', paramObject['FullClassName']);
      taskForm.setFieldValue('jobState.dll.methodName', paramObject['MethodName']);
      taskForm.setFieldValue('jobState.dll.methodParam', paramObject['MethodParam']);
    }

    if (params.JobType === JobType.SCRIPT) {
      taskForm.setFieldValue('jobState.script.path', paramObject['Path']);
      taskForm.setFieldValue('jobState.script.arguments', paramObject['Arguments']);
    }

    taskForm.setFieldValue('jobState.type', opType);
  } catch {
    message.error('参数解析失败');
  }
}
