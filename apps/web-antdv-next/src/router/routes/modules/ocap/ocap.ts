import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'carbon:warning-alt',
      keepAlive: true,
      order: 491,
      title: '异常管理',
    },
    name: 'OcapCenter',
    path: '/ocap',
    redirect: '/ocap/home',
    children: [
      {
        meta: {
          affixTab: true,
          title: '首页',
        },
        name: 'OcapHome',
        path: '/ocap/home',
        component: () => import('#/views/ocap/home/index.vue'),
      },
      {
        meta: {
          title: '异常列表',
        },
        name: 'OcapExceptionList',
        path: '/ocap/:ocapId',
        component: () => import('#/views/ocap/exception-list/index.vue'),
      },
      {
        meta: {
          activePath: '/ocap/:ocapId',
          hideInMenu: true,
          title: '异常处理报告',
        },
        name: 'OcapReport',
        path: '/ocap/report/:ocapId',
        component: () => import('#/views/ocap/report/index.vue'),
      },
    ],
  },
];

export default routes;

