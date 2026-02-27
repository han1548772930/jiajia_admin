/**
 * Auth API — 根据构建目标自动切换实现
 * admin     → auth.admin.ts  （模拟）
 * dashboard / b2b / workflow → auth.default.ts（真实接口）
 */
import * as adminAuth from './auth.admin';
import * as b2bAuth from './auth.b2b';
import * as defaultAuth from './auth.default';
import * as workflowAuth from './auth.workflow';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    password?: string;
    username?: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    accessToken: string;
  }

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }
}

// 根据构建目标选择实现，新增 target 时在此添加即可
const authMap: Record<string, typeof defaultAuth> = {
  admin: adminAuth,
  b2b: b2bAuth,
  workflow: workflowAuth,
  // dashboard: dashboardAuth,
};

const target = import.meta.env.VITE_APP_TARGET || 'admin';
const impl = authMap[target] ?? defaultAuth;

export const loginApi = impl.loginApi;
export const refreshTokenApi = impl.refreshTokenApi;
export const logoutApi = impl.logoutApi;
export const getAccessCodesApi = impl.getAccessCodesApi;
