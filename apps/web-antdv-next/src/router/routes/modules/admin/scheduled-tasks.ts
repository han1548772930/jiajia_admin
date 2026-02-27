import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ic:baseline-schedule',
      keepAlive: true,
      order: 500,
      title: '计划任务',
    },
    name: 'ScheduledTasks',
    path: '/admin',
    children: [
      {
        meta: {
          title: '任务管理',
          affixTab: true,
        },
        name: 'ScheduledTasksList',
        path: '/admin/scheduled-tasks',
        component: () => import('#/views/scheduled-tasks/index.vue'),
      },
      {
        meta: {
          title: '任务日志',
          // hideInMenu: true,
        },
        name: 'ScheduledTasksLog',
        path: '/admin/scheduled-tasks/log',
        component: () => import('#/views/scheduled-tasks/log.vue'),
      },
    ],
  },
];

export default routes;
