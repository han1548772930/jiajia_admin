/**
 * dashboard / b2b 构建目标 — 走真实接口（Vben 默认格式）
 */
import { baseRequestClient, requestClient } from '#/api/request';

export async function loginApi(data: { password?: string; username?: string }) {
  return requestClient.post<{ accessToken: string }>('/auth/login', data);
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
  return requestClient.get<string[]>('/auth/codes');
}
