import { defineConfig } from '@vben/vite-config';
// import legacy from '@vitejs/plugin-legacy';
import { loadEnv } from 'vite';

// 产品配置映射 - 根据需要自行调整
const targetConfig: Record<string, { base: string; outDir: string }> = {
  admin: { base: '/admin', outDir: './dist/admin' },
  workflow: { base: '/workflow', outDir: './dist/workflow' },
  ocap: { base: '/ocap', outDir: './dist/ocap' },
  dashboard: { base: '/dashboard', outDir: './dist/dashboard' },
  b2b: { base: '/b2b', outDir: './dist/b2b' },
};

export default defineConfig(async (config) => {
  const { mode = 'production' } = config || {};
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_APP_TARGET || 'admin';
  const cfg = targetConfig[target] || targetConfig.admin!;

  return {
    application: {},
    vite: {
      base: cfg.base,
      plugins: [
        // legacy({
        //   modernTargets: [
        //     'edge>=105',
        //     'firefox>=106',
        //     'chrome>=105',
        //     'safari>=16.4',
        //     'chromeAndroid>=105',
        //     'iOS>=16.4',
        //   ],
        //   modernPolyfills: ['es.array.to-sorted'],
        //   renderLegacyChunks: false,
        // }),
      ],
      build: {
        outDir: cfg.outDir,
      },
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            // mock代理目标地址
            target: 'http://localhost:5320/api',
            ws: true,
          },
        },
      },
    },
  };
});
