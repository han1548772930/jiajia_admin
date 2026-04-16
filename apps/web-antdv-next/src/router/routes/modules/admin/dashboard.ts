import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      affixTab: true,
      icon: 'carbon:dashboard',
      keepAlive: true,
      order: 100,
      title: '看板',
    },
    name: 'Dashboard',
    path: '/admin/dashboard',
    component: () => import('#/views/dashboard/DashboardPage.vue'),
  },
];

export default routes;
