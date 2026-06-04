// Admin Payouts API — wired to /admin/payouts
import { request } from "./client";
import type { ApiResponse } from "./types";

export type AdminPayout = {
  id: string;
  partnerId?: string;
  partnerName?: string;
  amount?: number;
  status?: string;
  method?: string;
  reference?: string | null;
  notes?: string | null;
  periodFrom?: string | null;
  periodTo?: string | null;
  paidAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  [k: string]: any;
};

function qs(params?: Record<string, any>): string {
  if (!params) return "";
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    clean[k] = String(v);
  }
  const s = new URLSearchParams(clean).toString();
  return s ? "?" + s : "";
}

function unwrapList<T>(d: any) {
  if (Array.isArray(d)) return { items: d as T[], total: d.length, page: 1, totalPages: 1 };
  return {
    items: (d?.items || []) as T[],
    total: d?.total ?? 0,
    page: d?.page ?? 1,
    pageSize: d?.pageSize,
    totalPages: d?.totalPages ?? 1,
  };
}

export const adminPayoutsApi = {
  list: async (params?: { page?: number; limit?: number; status?: string; partnerId?: string }) => {
    const r = await request<ApiResponse<any>>(`/admin/payouts${qs(params)}`);
    return unwrapList<AdminPayout>(r.data);
  },
  get: async (id: string): Promise<AdminPayout> => {
    const r = await request<ApiResponse<any>>(`/admin/payouts/${id}`);
    return r.data?.payout ?? r.data;
  },
  create: (body: Partial<AdminPayout>) =>
    request<ApiResponse<any>>(`/admin/payouts`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: Partial<AdminPayout>) =>
    request<ApiResponse<any>>(`/admin/payouts/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  setStatus: (id: string, status: string) =>
    request<ApiResponse<any>>(`/admin/payouts/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
  remove: (id: string) =>
    request<ApiResponse<any>>(`/admin/payouts/${id}`, { method: "DELETE" }),
};
