import type { RouteRecordRaw } from 'vue-router';

import { mergeRouteModules, traverseTreeValues } from '@vben/utils';

import { coreRoutes, fallbackNotFoundRoute } from './core';

// 共享路由：modules/ 根目录下的 .ts 文件
const sharedRouteFiles = import.meta.glob('./modules/*.ts', {
  eager: true,
});

// 各 target 专属路由：modules/{target}/ 目录下的 .ts 文件
const targetRouteFiles: Record<string, Record<string, unknown>> = {
  admin: import.meta.glob('./modules/admin/**/*.ts', { eager: true }),
  workflow: import.meta.glob('./modules/workflow/**/*.ts', { eager: true }),
  ocap: import.meta.glob('./modules/ocap/**/*.ts', { eager: true }),
  b2b: import.meta.glob('./modules/b2b/**/*.ts', { eager: true }),
  dashboard: import.meta.glob('./modules/dashboard/**/*.ts', { eager: true }),
};

const target = import.meta.env.VITE_APP_TARGET || 'admin';

/** 动态路由 = 共享路由 + 当前 target 专属路由 */
const dynamicRoutes: RouteRecordRaw[] =
  target === 'dashboard'
    ? []
    : mergeRouteModules({
        ...sharedRouteFiles,
        ...targetRouteFiles[target],
      });

/** 外部路由列表，访问这些页面可以不需要Layout，可能用于内嵌在别的系统(不会显示在菜单中) */
// const externalRoutes: RouteRecordRaw[] = mergeRouteModules(externalRouteFiles);
// const staticRoutes: RouteRecordRaw[] = mergeRouteModules(staticRouteFiles);
const staticRoutes: RouteRecordRaw[] = [];
const externalRoutes: RouteRecordRaw[] = [];

/** 路由列表，由基本路由、外部路由和404兜底路由组成
 *  无需走权限验证（会一直显示在菜单中） */
const routes: RouteRecordRaw[] = [
  ...coreRoutes,
  ...externalRoutes,
  fallbackNotFoundRoute,
];

/** 基本路由列表，这些路由不需要进入权限拦截 */
const coreRouteNames = traverseTreeValues(coreRoutes, (route) => route.name);

/** 有权限校验的路由列表，包含动态路由和静态路由 */
const accessRoutes =
  target === 'dashboard' ? [] : [...dynamicRoutes, ...staticRoutes];
export { accessRoutes, coreRouteNames, routes };
