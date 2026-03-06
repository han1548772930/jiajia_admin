/**
 * dashboard / b2b 构建目标 — 走真实接口
 */
import type { UserInfo } from '@vben/types';

import { requestClient } from '#/api/request';

export async function getUserInfoApi() {
  return requestClient.get<UserInfo>('/user/info');
}
