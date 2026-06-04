// Admin Contact Messages API
import { request } from "./client";
import type { ApiResponse } from "./types";

export type ContactMessage = {
  id: number | string;
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  status?: "new" | "read" | "replied" | string;
  internalNote?: string | null;
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

export const adminContactApi = {
  list: async (params?: { page?: number; limit?: number }) => {
    const r = await request<ApiResponse<any>>(`/admin/contact-messages${qs(params)}`);
    const d: any = r.data;
    if (Array.isArray(d)) return { items: d as ContactMessage[], total: d.length, page: 1, totalPages: 1 };
    return {
      items: (d?.items || []) as ContactMessage[],
      total: d?.total ?? 0,
      page: d?.page ?? 1,
      pageSize: d?.pageSize,
      totalPages: d?.totalPages ?? 1,
    };
  },
  // Backend exposes only PUT /admin/contact-messages/{id}/read and DELETE /admin/contact-messages/{id}.
  markRead: (id: number | string) =>
    request<ApiResponse<any>>(`/admin/contact-messages/${id}/read`, { method: "PUT" }),
  remove: (id: number | string) =>
    request<ApiResponse<any>>(`/admin/contact-messages/${id}`, { method: "DELETE" }),
  // Legacy alias kept for older callers — routes "mark as read" only.
  update: (id: number | string, body: { status?: string; internalNote?: string }) => {
    if (body?.status === "read") {
      return request<ApiResponse<any>>(`/admin/contact-messages/${id}/read`, { method: "PUT" });
    }
    return Promise.reject(new Error("Only 'mark as read' is supported by backend"));
  },
};
