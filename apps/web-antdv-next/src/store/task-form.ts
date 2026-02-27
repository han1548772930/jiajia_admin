import { defineStore } from 'pinia';
import { reactive, ref, shallowReactive } from 'vue';
import type { Dayjs } from 'dayjs';

import {
  AutoReportType,
  JobOperateType,
  JobType,
  RequestType,
  type TaskApi,
} from '#/api/task';

export const useTaskFormStore = defineStore('task-form', () => {
  const jobState = shallowReactive({
    open: false,
    title: '新增任务',
    loading: false,
  });

  const currentOpenSysid = ref<null | string>(null);

  function setCurrentOpenSysid(c: string) {
    currentOpenSysid.value = c;
  }

  const createInitialValues = () => ({
    jobState: {
      jobName: '',
      jobStatus: true,
      cron: '* * * * *',
      param: '',
      groupId: -1,
      jobId: -1,
      startTime: null as Dayjs | null,
      endTime: null as Dayjs | null | undefined,
      type: JobOperateType.ADD,
      jobType: JobType.HttpRequest,
      loopSQL: 'select 1 from dual',
      httpRequest: {
        postParam: '',
        url: 'http://',
        requestType: RequestType.GET,
        headers: [] as TaskApi.Header[],
      },
      autoReportState: {
        subject: '',
        body: '',
        to: '',
        cc: '',
        host: '',
        port: '',
        username: '',
        password: '',
        remotePath: '',
        type: [AutoReportType.EMAIL] as AutoReportType[],
        isAppendix: false,
        appendix: [] as TaskApi.Appendix[],
      },
      exe: { path: '', arguments: '' },
      dll: { path: '', fullClassName: '', methodName: '', methodParam: '' },
      script: { path: '', arguments: '' },
    },
    autoTaskGroupState: {
      name: '',
      sysid: -1,
    },
  });

  type TaskFormValues = ReturnType<typeof createInitialValues>;
  const values = reactive<TaskFormValues>(createInitialValues());

  function normalizeAutoReportTypes(value: unknown): AutoReportType[] {
    const toType = (val: unknown): AutoReportType[] => {
      const num =
        typeof val === 'string'
          ? Number(val)
          : typeof val === 'number'
            ? val
            : Number.NaN;
      if (Number.isNaN(num)) return [];
      if (num === AutoReportType.EMAIL_AND_FTP) {
        return [AutoReportType.EMAIL, AutoReportType.FTP];
      }
      if (num === AutoReportType.EMAIL || num === AutoReportType.FTP) {
        return [num];
      }
      return [];
    };
    if (Array.isArray(value)) {
      return [...new Set(value.flatMap(toType))];
    }
    return toType(value);
  }

  function setFieldValue(path: string, value: unknown) {
    if (!path) return;
    let val = value;
    if (path === 'jobState.autoReportState.type') {
      val = normalizeAutoReportTypes(value);
    }
    const segments = path
      .replace(/\[(\d+)\]/g, '.$1')
      .split('.')
      .filter(Boolean);
    if (segments.length === 0) return;
    let target: any = values;
    for (let i = 0; i < segments.length - 1; i += 1) {
      const key = segments[i]!;
      if (target[key] == null) {
        const nextKey = segments[i + 1]!;
        target[key] = String(Number(nextKey)) === nextKey ? [] : {};
      }
      target = target[key];
    }
    target[segments.at(-1)!] = val;
  }

  function handleReset() {
    Object.assign(values, createInitialValues());
  }

  const removeHeader = (idx: number) => {
    values.jobState.httpRequest.headers.splice(idx, 1);
  };
  const pushHeader = (header: TaskApi.Header) => {
    values.jobState.httpRequest.headers.push(header);
  };
  const removeAppendix = (idx: number) => {
    values.jobState.autoReportState.appendix.splice(idx, 1);
  };
  const pushAppendix = (appendix: TaskApi.Appendix) => {
    values.jobState.autoReportState.appendix.push(appendix);
  };
  const getAutoReportTypes = () =>
    normalizeAutoReportTypes(values.jobState.autoReportState.type);

  function handleAutoReportCheckbox(
    checked: boolean,
    type: AutoReportType,
  ) {
    const current = normalizeAutoReportTypes(
      values.jobState.autoReportState.type,
    );
    const apply = (next: AutoReportType[]) => {
      setFieldValue('jobState.autoReportState.type', next);
    };
    if (type === AutoReportType.EMAIL_AND_FTP) {
      apply(
        checked
          ? [
              ...new Set([
                ...current,
                AutoReportType.EMAIL,
                AutoReportType.FTP,
              ]),
            ]
          : current.filter(
              (t) =>
                t !== AutoReportType.EMAIL && t !== AutoReportType.FTP,
            ),
      );
      return;
    }
    if (checked) {
      if (!current.includes(type)) {
        apply([...new Set([...current, type])]);
      }
    } else {
      apply(current.filter((t) => t !== type));
    }
  }

  function $reset() {
    handleReset();
    jobState.open = false;
    jobState.title = '新增任务';
    jobState.loading = false;
  }

  return {
    $reset,
    currentOpenSysid,
    getAutoReportTypes,
    handleAutoReportCheckbox,
    handleReset,
    jobState,
    pushAppendix,
    pushHeader,
    removeAppendix,
    removeHeader,
    setCurrentOpenSysid,
    setFieldValue,
    values,
  };
});
