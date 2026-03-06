/**
 * admin 构建目标 — 模拟登录，不走真实接口
 */

export async function loginApi(data: { password?: string; username?: string }) {
  console.log('🔐 Mock Login:', data);
  return new Promise<{ accessToken: string }>((resolve) => {
    setTimeout(() => resolve({ accessToken: `mock-token-${Date.now()}` }), 500);
  });
}

export async function refreshTokenApi() {
  console.log('🔄 Mock Refresh Token');
  return new Promise<{ data: string; status: number }>((resolve) => {
    setTimeout(() => resolve({ data: `mock-refresh-token-${Date.now()}`, status: 200 }), 300);
  });
}

export async function logoutApi() {
  console.log('👋 Mock Logout');
  return Promise.resolve({ success: true });
}

export async function getAccessCodesApi() {
  console.log('🔑 Mock Access Codes');
  return Promise.resolve(['AC_100100', 'AC_100110', 'AC_100120', 'AC_100010']);
}
