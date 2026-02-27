import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'carbon:workflow-automation',
      keepAlive: true,
      order: 490,
      title: '流程中心',
    },
    name: 'WorkflowCenter',
    path: '/workflow',
    children: [
      {
        meta: {
          affixTab: true,
          title: '我的流程',
        },
        name: 'WorkflowMyProcess',
        path: '/workflow/my-process',
        component: () => import('#/views/workflow/my-process/index.vue'),
      },
      {
        meta: {
          title: '待办审批',
        },
        name: 'WorkflowApprovalUpcoming',
        path: '/workflow/approval-center/upcoming',
        component: () => import('#/views/workflow/approval-center/upcoming/index.vue'),
      },
      {
        meta: {
          title: '已办审批',
        },
        name: 'WorkflowApprovalDone',
        path: '/workflow/approval-center/done',
        component: () => import('#/views/workflow/approval-center/done/index.vue'),
      },
      {
        meta: {
          title: '模板管理',
        },
        name: 'WorkflowTemplateManagement',
        path: '/workflow/process-management/template',
        component: () => import('#/views/workflow/process-management/template/index.vue'),
      },
      {
        meta: {
          hideInMenu: true,
          title: '模板设计',
        },
        name: 'WorkflowTemplateDesigner',
        path: '/workflow/designer/basic-information',
        component: () =>
          import('#/views/workflow/designer/components/basicinformation/index.vue'),
      },
      // {
      //   meta: {
      //     title: '已保存表单',
      //   },
      //   name: 'WorkflowSavedForms',
      //   path: '/workflow/designer/form-saved',
      //   component: () => import('#/views/workflow/form-saved/index.vue'),
      // },
      // {
      //   meta: {
      //     title: '表单设计器',
      //   },
      //   name: 'WorkflowFormDesigner',
      //   path: '/workflow/designer/form',
      //   component: () => import('#/views/workflow/form-designer/index.vue'),
      // },
      // {
      //   meta: {
      //     hideInMenu: true,
      //     title: '表单回显',
      //   },
      //   name: 'WorkflowFormPreview',
      //   path: '/workflow/designer/form-preview',
      //   component: () => import('#/views/workflow/form-preview/index.vue'),
      // },
    ],
  },
];

export default routes;
