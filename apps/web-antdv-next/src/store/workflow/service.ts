import { defineStore } from 'pinia';

import { loginApi } from '#/api/core/auth/workflow';
import {
  createTemplateApi,
  getAllMenusApi,
  getSysRoleApi,
  getSysUserApi,
  getTemplateFieldApi,
  updateTemplateApi,
} from '#/api/workflow';

const useDesignerServiceStore = defineStore('workflow-designer-service-store', {
  actions: {
    async login(username: string, password: string) {
      return loginApi({ username, password });
    },
    async createTemplate(data: Record<string, any>) {
      return createTemplateApi(data as any);
    },
    async getAllmenus() {
      return getAllMenusApi();
    },
    async getSysRole() {
      return getSysRoleApi();
    },
    async getSysUser() {
      return getSysUserApi();
    },
    async getTemplateField(billformnamespace: string) {
      return getTemplateFieldApi(billformnamespace);
    },
    async updateTemplate(data: Record<string, any>) {
      return updateTemplateApi(data as any);
    },
  },
});

export default useDesignerServiceStore;

