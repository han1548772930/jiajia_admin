/**
 * Auth API — 根据构建目标自动切换实现
 * admin / b2b / workflow / ocap / dashboard → 对应实现
 */
import * as adminAuth from './admin';
import * as defaultAuth from './default';

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

const authMap: Record<string, typeof defaultAuth> = {
  admin: adminAuth,
  dashboard: adminAuth,
};

const target = import.meta.env.VITE_APP_TARGET || 'admin';
const impl = authMap[target] ?? defaultAuth;

export const loginApi = impl.loginApi;
export const refreshTokenApi = impl.refreshTokenApi;
export const logoutApi = impl.logoutApi;
export const getAccessCodesApi = impl.getAccessCodesApi;
