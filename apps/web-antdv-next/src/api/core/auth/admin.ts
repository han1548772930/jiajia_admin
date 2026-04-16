/**
 * admin 构建目标
 */
export async function loginApi(_data: {
  password?: string;
  username?: string;
}) {
  return new Promise<{ accessToken: string }>((resolve) => {
    setTimeout(() => resolve({ accessToken: `mock-token-${Date.now()}` }), 500);
  });
}

export async function refreshTokenApi() {
  return new Promise<{ data: string; status: number }>((resolve) => {
    setTimeout(
      () => resolve({ data: `mock-refresh-token-${Date.now()}`, status: 200 }),
      300,
    );
  });
}

export async function logoutApi() {
  return { success: true };
}

export async function getAccessCodesApi() {
  return ['AC_100100', 'AC_100110', 'AC_100120', 'AC_100010'];
}
