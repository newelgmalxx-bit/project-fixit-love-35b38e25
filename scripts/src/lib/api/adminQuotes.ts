// Admin Quote Requests API — wired to /admin/quotes
import { request } from "./client";
import type { ApiResponse } from "./types";

export type AdminQuote = {
  id: string;
  trackingCode?: string;
  name?: string;
  phone?: string;
  city?: string;
  projectType?: string;
  projectName?: string;
  area?: number | null;
  budget?: string | null;
  startDate?: string | null;
  expectedDelivery?: string | null;
  status?: string;
  notes?: string | null;
  files?: any[];
  createdAt?: string;
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

export const adminQuotesApi = {
  list: async (params?: { page?: number; limit?: number; status?: string; q?: string }) => {
    const r = await request<ApiResponse<any>>(`/admin/quotes${qs(params)}`);
    return unwrapList<AdminQuote>(r.data);
  },
  get: async (id: string): Promise<AdminQuote> => {
    const r = await request<ApiResponse<any>>(`/admin/quotes/${id}`);
    return r.data?.quote ?? r.data;
  },
  update: (id: string, body: Partial<AdminQuote>) =>
    request<ApiResponse<any>>(`/admin/quotes/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  setStatus: (id: string, status: string) =>
    request<ApiResponse<any>>(`/admin/quotes/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
  remove: (id: string) =>
    request<ApiResponse<any>>(`/admin/quotes/${id}`, { method: "DELETE" }),
};
