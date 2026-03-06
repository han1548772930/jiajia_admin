export async function getUserInfoApi() {
  return Promise.resolve({
    userId: '1',
    username: 'vben',
    realName: 'Vben Admin',
    avatar: 'https://unpkg.com/@vbenjs/static-source@0.1.7/source/avatar-v1.webp',
    desc: 'Super Admin',
    homePath: '/ocap/home',
    token: 'mock-token',
    roles: ['super'],
  });
}
