import { JobType, RequestType } from '#/api/task';

/** 获取任务类型显示名称 */
export function getJobTypeLabel(type: number): string {
  switch (type) {
    case JobType.HttpRequest: {
      return 'HttpRequest';
    }
    case JobType.AutoReport: {
      return 'AutoReport';
    }
    case JobType.EXE: {
      return '可执行程序';
    }
    case JobType.DLL: {
      return 'DLL类库';
    }
    case JobType.SCRIPT: {
      return '脚本';
    }
    default: {
      return '未知类型';
    }
  }
}

/** 从 HTTP method 数值获取 RequestType */
export function getJobRequestType(method: number): RequestType {
  switch (method) {
    case 0: {
      return RequestType.GET;
    }
    case 1: {
      return RequestType.POST;
    }
    default: {
      return RequestType.UNKNOWN;
    }
  }
}

/** 获取任务状态显示名称 */
export function getJobStatusLabel(status: number): string {
  switch (status) {
    case 0: {
      return '停用';
    }
    case 1: {
      return '启用';
    }
    default: {
      return '未知';
    }
  }
}

/** 获取任务状态对应的 Tag 颜色 */
export function getJobStatusColor(status: number): string {
  switch (status) {
    case 0: {
      return 'error';
    }
    case 1: {
      return 'success';
    }
    default: {
      return 'default';
    }
  }
}
