/**
 * User API — 根据构建目标自动切换实现
 * admin / b2b / workflow / ocap / dashboard → 对应实现
 */
import * as adminUser from './admin';
import * as b2bUser from './b2b';
import * as defaultUser from './default';
import * as ocapUser from './ocap';
import * as workflowUser from './workflow';

const userMap: Record<string, typeof defaultUser> = {
  admin: adminUser,
  b2b: b2bUser,
  dashboard: defaultUser,
  ocap: ocapUser,
  workflow: workflowUser,
};

const target = import.meta.env.VITE_APP_TARGET || 'admin';
const impl = userMap[target] ?? defaultUser;

export const getUserInfoApi = impl.getUserInfoApi;
