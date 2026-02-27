/**
 * admin 构建目标 — 模拟用户信息
 */

export async function getUserInfoApi() {
  console.log('👤 Mock User Info');
  return Promise.resolve({
    userId: '1',
    username: 'vben',
    realName: 'Vben Admin',
    avatar:
      'https://unpkg.com/@vbenjs/static-source@0.1.7/source/avatar-v1.webp',
    desc: 'Super Admin',
    homePath: '/admin/scheduled-tasks',
    token: 'mock-token',
    roles: ['super'],
  });
}
