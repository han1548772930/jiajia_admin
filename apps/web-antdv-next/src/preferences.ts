
import { defineOverridesPreferences } from '@vben/preferences';
import logo from '/static/logo.png';

const target = import.meta.env.VITE_APP_TARGET;
const isWorkflowLikeProduction =
  import.meta.env.PROD && ['workflow', 'ocap'].includes(target);
const defaultHomePathMap: Record<string, string> = {
  ocap: '/ocap/home',
  workflow: '/workflow/my-process',
};
/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * !!! 更改配置后请清空缓存，否则可能不生效
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    name: import.meta.env.VITE_APP_TITLE,
    defaultHomePath: defaultHomePathMap[target] || '/analytics',
    compact: true,
    ...(isWorkflowLikeProduction
      ? {
          enablePreferences: false,
          layout: 'full-content',
        }
      : {}),
  },
  theme: {
    mode: 'auto',
  },
  logo: {
    source: logo,
  },
  copyright: {
    companyName: 'NmcSoft',
    enable: true,
  },
});
