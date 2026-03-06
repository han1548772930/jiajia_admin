export async function getUserInfoApi() {
  console.log('👤 Mock User Info');
  return Promise.resolve({
    userId: '1',
    username: 'vben',
    realName: 'Vben Admin',
    avatar: 'https://unpkg.com/@vbenjs/static-source@0.1.7/source/avatar-v1.webp',
    desc: 'Super Admin',
    homePath: '/workflow/my-process',
    token: 'mock-token',
    roles: ['super'],
  });
}
