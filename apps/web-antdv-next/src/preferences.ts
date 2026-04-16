import { defineOverridesPreferences } from '@vben/preferences';

const target = import.meta.env.VITE_APP_TARGET || 'admin';
const isDashboardTarget = target === 'dashboard';

// const defaultHomePathMap: Record<string, string> = {
//   ocap: '/ocap/home',
//   workflow: '/workflow/my-process',
// };
/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * !!! 更改配置后请清空缓存，否则可能不生效
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    name: '佳佳乐潮玩',
    compact: true,
    defaultHomePath: isDashboardTarget ? '/' : '/admin/scheduled-tasks',
    ...(isDashboardTarget
      ? {
          layout: 'full-content' as const,
          enablePreferences: false,
        }
      : {}),
  },
  theme: {
    mode: 'auto',
  },
  logo: {
    source: '',
  },
  copyright: {
    companyName: '佳佳乐潮玩',
    enable: true,
  },
});
