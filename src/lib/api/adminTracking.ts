// Admin Tracking Codes API
import { request } from "./client";
import type { ApiResponse } from "./types";

export type TrackingCode = {
  id: number | string;
  name?: string;
  provider?: string;
  code?: string;
  placement?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [k: string]: any;
};

export const adminTrackingApi = {
  list: async (): Promise<TrackingCode[]> => {
    const r = await request<ApiResponse<any>>(`/admin/tracking-codes`);
    const d: any = r.data;
    return Array.isArray(d) ? d : d?.items || [];
  },
  create: (body: Partial<TrackingCode>) =>
    request<ApiResponse<any>>(`/admin/tracking-codes`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: number | string, body: Partial<TrackingCode>) =>
    request<ApiResponse<any>>(`/admin/tracking-codes/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  remove: (id: number | string) =>
    request<ApiResponse<any>>(`/admin/tracking-codes/${id}`, { method: "DELETE" }),
};
