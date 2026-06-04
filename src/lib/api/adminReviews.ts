// Admin Reviews API
import { request } from "./client";
import type { ApiResponse } from "./types";

export type AdminReview = {
  id: number | string;
  rating?: number;
  comment?: string;
  status?: string;
  userId?: string;
  userName?: string;
  offerId?: string;
  offerTitle?: string;
  partnerId?: string;
  partnerName?: string;
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

export const adminReviewsApi = {
  list: async (params?: { status?: string; page?: number; limit?: number }) => {
    const r = await request<ApiResponse<any>>(`/admin/reviews${qs(params)}`);
    const d: any = r.data;
    if (Array.isArray(d)) return { items: d as AdminReview[], total: d.length, page: 1, totalPages: 1 };
    return {
      items: (d?.items || []) as AdminReview[],
      total: d?.total ?? 0,
      page: d?.page ?? 1,
      pageSize: d?.pageSize,
      totalPages: d?.totalPages ?? 1,
    };
  },
  approve: (id: number | string) =>
    request<ApiResponse<any>>(`/admin/reviews/${id}/approve`, { method: "PUT" }),
  reject: (id: number | string) =>
    request<ApiResponse<any>>(`/admin/reviews/${id}/reject`, { method: "PUT" }),
  remove: (id: number | string) =>
    request<ApiResponse<any>>(`/admin/reviews/${id}`, { method: "DELETE" }),
};
