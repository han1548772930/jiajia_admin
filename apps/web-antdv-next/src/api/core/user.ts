/**
 * User API — 根据构建目标自动切换实现
 * admin     → user.admin.ts  （模拟）
 * dashboard / b2b / workflow → user.default.ts（真实接口）
 */
import * as adminUser from './user.admin';
import * as b2bUser from './user.b2b';
import * as defaultUser from './user.default';

// 根据构建目标选择实现，新增 target 时在此添加即可
const userMap: Record<string, typeof defaultUser> = {
  admin: adminUser,
  b2b: b2bUser,
  dashboard: defaultUser,
  workflow: adminUser,
};

const target = import.meta.env.VITE_APP_TARGET || 'admin';
const impl = userMap[target] ?? defaultUser;

export const getUserInfoApi = impl.getUserInfoApi;
