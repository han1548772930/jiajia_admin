import type { ApiResponse as BaseApiResponse } from './types';

import { useAccessStore } from '@vben/stores';

import { requestClient } from '#/api/request';

export namespace DashboardApi {
  export type ApiResponse<T = unknown> = BaseApiResponse<T>;

  export interface MonthPointItem {
    CurrPoint?: number;
    CurrMonthPoint?: number;
    Name?: string;
  }

  export interface MonthSignItem {
    Name?: string;
    SignDays?: number;
  }

  export interface PddMainItem {
    Code?: string;
    CreateDate?: string;
    Creator?: string;
    CreatorId?: number;
    EditTime?: string;
    Editor?: string;
    EditorId?: number;
    ImageUrl?: null | string;
    Name?: string;
    Point?: number;
    Price?: number;
    Remark?: null | string;
    Sysid?: number;
    TypeId?: number;
  }
}

type DashboardTableCell = string;
type DashboardTableRow = DashboardTableCell[];
type DashboardLoginPayload = {
  Password?: string;
  Username?: string;
};

type DashboardRawResponse = {
  data?: Record<string, any>;
  headers?: Record<string, any>;
};

const DASHBOARD_LOGIN_PAYLOAD: DashboardLoginPayload = {
  Password: 'e9cGG3G2o1JlQaTnond9I1VA2C0m4eDudpPC4pOTvNY=',
  Username: 'S01',
};

let loginPromise: null | Promise<null | string> = null;

const productSalesData: DashboardTableRow[] = [
  ['1', '16.0(璀璨诡幻)'],
  ['2', '宝石4'],
  ['3', '151惊'],
  ['4', '宝石3'],
  ['5', '15.0(利刃猛醒)'],
  ['6', '15.0(利刃猛醒)'],
  ['7', '15.0(利刃猛醒)'],
  ['8', '15.0(利刃猛醒)'],
  ['9', '15.0(利刃猛醒)'],
  ['10', '15.0(利刃猛醒)'],
  ['10', '15.0(利刃猛醒)'],
  ['10', '15.0(利刃猛醒)'],
  ['10', '15.0(利刃猛醒)'],
  ['10', '15.0(利刃猛醒)'],
  ['10', '15.0(利刃猛醒)'],
];

function createSuccessResponse<T>(data: T): DashboardApi.ApiResponse<T> {
  return {
    Code: 200,
    Data: data,
    Extras: null,
    Message: 'success',
    Success: true,
    Timestamp: Date.now(),
  };
}

function normalizeToken(token: null | string | undefined) {
  if (!token) return null;
  return token.replace(/^Bearer\\s+/i, '').trim() || null;
}

function extractToken(response: DashboardRawResponse) {
  const body = response?.data ?? {};
  const headers = response?.headers ?? {};
  const candidates = [
    body?.accessToken,
    body?.token,
    body?.AccessToken,
    body?.Token,
    body?.Data?.accessToken,
    body?.Data?.token,
    body?.data?.accessToken,
    body?.data?.token,
    headers.authorization,
    headers.Authorization,
    headers.token,
    headers.Token,
    headers['access-token'],
    headers['x-access-token'],
  ];

  for (const candidate of candidates) {
    const token = normalizeToken(
      typeof candidate === 'string' ? candidate : undefined,
    );
    if (token) {
      return token;
    }
  }

  return null;
}

function mergeDashboardLoginPayload(
  payload?: DashboardLoginPayload,
): DashboardLoginPayload {
  return {
    ...DASHBOARD_LOGIN_PAYLOAD,
    ...payload,
  };
}

async function performDashboardLogin(payload?: DashboardLoginPayload) {
  const accessStore = useAccessStore();
  const response = await requestClient.post<DashboardRawResponse>(
    '/auth/login',
    mergeDashboardLoginPayload(payload),
    {
      responseReturn: 'raw',
    },
  );

  const token = extractToken(response);
  if (token) {
    accessStore.setAccessToken(token);
  }
  return token;
}

export async function loginByDashboardApi(payload?: DashboardLoginPayload) {
  const accessToken = await performDashboardLogin(payload);
  if (!accessToken) {
    throw new Error('Login did not return access token');
  }
  return { accessToken };
}

function unwrapArrayResponse<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }
  if (Array.isArray((payload as any)?.Data)) {
    return (payload as any).Data as T[];
  }
  if (Array.isArray((payload as any)?.data)) {
    return (payload as any).data as T[];
  }
  return [];
}

function mapRankRows<T extends { Name?: string }>(
  items: T[],
  valueGetter: (item: T) => number | string | undefined,
): DashboardTableRow[] {
  return items.map((item, index) => [
    String(index + 1),
    item.Name?.trim() || '--',
    String(valueGetter(item) ?? 0),
  ]);
}

function mapMonthPointRows(
  items: DashboardApi.MonthPointItem[],
): DashboardTableRow[] {
  return items.map((item, index) => [
    String(index + 1),
    item.Name?.trim() || '--',
    String(item.CurrMonthPoint ?? 0),
    String(item.CurrPoint ?? 0),
  ]);
}

function mapRedemptionRows(
  items: DashboardApi.PddMainItem[],
): DashboardTableRow[] {
  return items.map((item, index) => [
    String(index + 1),
    item.ImageUrl?.trim() || '',
    item.Name?.trim() || '--',
    String(item.Price ?? 0),
    String(item.Point ?? 0),
  ]);
}

async function ensureDashboardAccessToken() {
  const accessStore = useAccessStore();
  if (accessStore.accessToken) {
    return accessStore.accessToken;
  }

  if (!loginPromise) {
    loginPromise = performDashboardLogin().finally(() => {
      loginPromise = null;
    });
  }

  return loginPromise;
}

export { ensureDashboardAccessToken };

export async function getTodayInstockQtyApi(): Promise<
  DashboardApi.ApiResponse<number>
> {
  return createSuccessResponse(128_600);
}

export async function getProductSalesDataApi(): Promise<
  DashboardApi.ApiResponse<DashboardTableRow[]>
> {
  return createSuccessResponse(productSalesData);
}

export async function getStaffRankDataApi(): Promise<
  DashboardApi.ApiResponse<DashboardTableRow[]>
> {
  await ensureDashboardAccessToken();
  const payload = await requestClient.post<DashboardApi.MonthPointItem[]>(
    '/shop-activity/cust-point/month-point',
    undefined,
    { responseReturn: 'body' },
  );
  const rows = mapMonthPointRows(
    unwrapArrayResponse<DashboardApi.MonthPointItem>(payload),
  );
  return createSuccessResponse(rows);
}

export async function getRegionRankDataApi(): Promise<
  DashboardApi.ApiResponse<DashboardTableRow[]>
> {
  await ensureDashboardAccessToken();
  const payload = await requestClient.post<DashboardApi.MonthSignItem[]>(
    '/shop-activity/cust-sign/month-sign',
    undefined,
    { responseReturn: 'body' },
  );
  const rows = mapRankRows(
    unwrapArrayResponse<DashboardApi.MonthSignItem>(payload),
    (item) => item.SignDays,
  );
  return createSuccessResponse(rows);
}

export async function getRedemptionListDataApi(): Promise<
  DashboardApi.ApiResponse<DashboardTableRow[]>
> {
  await ensureDashboardAccessToken();
  const payload = await requestClient.get<DashboardApi.PddMainItem[]>(
    '/shop-activity/pdd/query-main',
    undefined,
  );
  const rows = mapRedemptionRows(
    unwrapArrayResponse<DashboardApi.PddMainItem>(payload),
  );
  return createSuccessResponse(rows);
}
