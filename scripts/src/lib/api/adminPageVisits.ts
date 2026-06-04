// Admin Page Visits API — wired to /admin/page-visits
import { request } from "./client";
import type { ApiResponse } from "./types";

export type PageVisit = {
  id: string;
  path: string;
  sessionId?: string | null;
  source?: string | null;
  referrer?: string | null;
  userAgent?: string | null;
  createdAt: string;
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

export const adminPageVisitsApi = {
  list: async (params?: { page?: number; limit?: number; from?: string; to?: string }) => {
    const r = await request<ApiResponse<any>>(`/admin/page-visits${qs(params)}`);
    const d: any = r.data;
    if (Array.isArray(d)) return { items: d as PageVisit[], total: d.length };
    return {
      items: (d?.items || []) as PageVisit[],
      total: d?.total ?? 0,
      page: d?.page ?? 1,
      totalPages: d?.totalPages ?? 1,
    };
  },
  clear: () =>
    request<ApiResponse<any>>(`/admin/page-visits/clear`, { method: "DELETE" }),
};
