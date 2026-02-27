import type { RequestClientOptions } from '@vben/request';

import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import {
  authenticateResponseInterceptor,
  defaultResponseInterceptor,
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore } from '@vben/stores';

import { message } from 'antdv-next';

import { useAuthStore } from '#/store';

import { refreshTokenApi } from './core';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
  });

  // 重新认证：当 token 失效时触发
  async function doReAuthenticate() {
    console.warn('Access token or refresh token is invalid or expired.');
    const accessStore = useAccessStore();
    const authStore = useAuthStore();

    accessStore.setAccessToken(null);
    if (
      preferences.app.loginExpiredMode === 'modal' &&
      accessStore.isAccessChecked
    ) {
      accessStore.setLoginExpired(true);
    } else {
      await authStore.logout();
    }
  }

  // 刷新 token：按业务接口返回结构更新 accessToken
  async function doRefreshToken() {
    const accessStore = useAccessStore();
    const resp = await refreshTokenApi();
    const newToken = resp.data;
    accessStore.setAccessToken(newToken);
    return newToken;
  }

  // 统一补齐 Authorization 头
  function formatToken(token: null | string) {
    return token ? `Bearer ${token}` : null;
  }

  // 请求拦截：注入 token 与语言
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const accessStore = useAccessStore();

      config.headers.Authorization = formatToken(accessStore.accessToken);
      config.headers['Accept-Language'] = preferences.app.locale;
      return config;
    },
  });

  const legacyApiResponseConfig: Parameters<typeof defaultResponseInterceptor>[0] = {
    codeField: 'Code',
    dataField: (response: any) => response,
    successCode: (code: number) => code >= 200 && code < 300,
  };

  // 按构建目标选择后端响应结构解析规则
  const responseConfigMap: Record<string, Parameters<typeof defaultResponseInterceptor>[0]> = {
    admin: legacyApiResponseConfig,
    workflow: legacyApiResponseConfig,
    // 如需扩展其他构建目标，可在这里新增
    // b2b: { codeField: 'code', dataField: 'data', successCode: 0 },
  };

  const defaultResponseConfig: Parameters<typeof defaultResponseInterceptor>[0] = {
    codeField: 'code',
    dataField: 'data',
    successCode: 0,
  };

  // 响应拦截：统一成功/失败判断和数据解包
  const target = import.meta.env.VITE_APP_TARGET || 'admin';
  // 响应拦截：处理 token 过期与自动刷新
  client.addResponseInterceptor(
    defaultResponseInterceptor(responseConfigMap[target] ?? defaultResponseConfig),
  );

  // 响应拦截：统一错误提示
  client.addResponseInterceptor(
    authenticateResponseInterceptor({
      client,
      doReAuthenticate,
      doRefreshToken,
      enableRefreshToken: preferences.app.enableRefreshToken,
      formatToken,
    }),
  );

  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      const responseData = error?.response?.data ?? {};
      const errorMessage =
        responseData?.error ??
        responseData?.Message ??
        responseData?.message ??
        '';
      message.error(errorMessage || msg);
    }),
  );

  return client;
}

export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});

export const baseRequestClient = new RequestClient({ baseURL: apiURL });
