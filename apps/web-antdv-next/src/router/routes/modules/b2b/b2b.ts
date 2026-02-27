import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ic:baseline-schedule',
      keepAlive: true,
      order: 500,
      title: 'B2B',
    },
    name: 'B2B',
    path: '/b2b',
    component: () => import('#/views/b2b/index.vue'),

  },
];

export default routes;
