import type { ApiResponse } from '#/api/types';

import { message } from 'antdv-next';
import CryptoJS from 'crypto-js';

import { baseRequestClient, requestClient } from '#/api/request';

function hmacSha256ToBase64(value: string, secret: string) {
  return CryptoJS.HmacSHA256(value, secret).toString(CryptoJS.enc.Base64);
}

export async function loginApi(data: { password?: string; username?: string }) {
  const encryptedPassword = hmacSha256ToBase64(data.password ?? '', 'nmcsoft');

  const response = await requestClient.post<{
    data: ApiResponse<unknown>;
    headers: Record<string, string | string[] | undefined>;
  }>(
    '/auth/login',
    {
      Password: encryptedPassword,
      Username: data.username,
    },
    { responseReturn: 'raw' },
  );

  const body = response.data;
  const isSuccess = Boolean(body?.Success && body.Code >= 200 && body.Code < 300);
  if (!isSuccess) {
    message.error(body?.Message || '登录失败');
    return { accessToken: '' };
  }

  const tokenHeader = response.headers?.['access-token'];
  const accessToken = Array.isArray(tokenHeader) ? tokenHeader[0] : tokenHeader;
  if (!accessToken) {
    message.error('登录成功但未返回 access-token');
  }

  return { accessToken: accessToken ?? '' };
}

export async function refreshTokenApi() {
  return baseRequestClient.post<{ data: string; status: number }>(
    '/auth/refresh',
    { withCredentials: true },
  );
}

export async function logoutApi() {
  return baseRequestClient.post('/auth/logout', { withCredentials: true });
}

export async function getAccessCodesApi() {
  return [];
}
