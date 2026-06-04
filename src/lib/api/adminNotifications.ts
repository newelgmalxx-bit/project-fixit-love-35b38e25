// Admin Notifications API
import { request } from "./client";
import type { ApiResponse } from "./types";

export type AdminNotification = {
  id: number | string;
  type?: string;
  title?: string;
  body?: string;
  message?: string;
  link?: string;
  isRead?: boolean;
  readAt?: string | null;
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

export const adminNotificationsApi = {
  list: async (params?: { limit?: number }) => {
    const r = await request<ApiResponse<any>>(`/admin/notifications${qs(params)}`);
    const d: any = r.data;
    const items: AdminNotification[] = Array.isArray(d) ? d : d?.items || [];
    const unreadCount: number =
      d?.unreadCount ?? items.filter((n) => !n.isRead).length;
    return { items, unreadCount };
  },
  markRead: (id: number | string) =>
    request<ApiResponse<any>>(`/admin/notifications/${id}/read`, { method: "POST" }),
  markAllRead: () =>
    request<ApiResponse<any>>(`/admin/notifications/read-all`, { method: "POST" }),
};
