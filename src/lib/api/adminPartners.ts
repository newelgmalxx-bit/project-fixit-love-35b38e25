// Admin Partners API — wired to https://koswmat.com/api
import { request } from "./client";
import type { ApiResponse } from "./types";

export type PartnerStatus = string; // backend-defined; use raw values

export type AdminPartner = {
  id: string;
  vendorName?: string;
  nameAr?: string;
  nameEn?: string;
  city?: string;
  email?: string;
  phone?: string;
  status: PartnerStatus;
  commissionPct?: number;
  depositPct?: number;
  createdAt?: string;
  updatedAt?: string;
  packageId?: string;
  package?: { id: string; name: string; price: number };
  [k: string]: any;
};

export type PartnerListParams = {
  status?: string;
  city?: string;
  q?: string;
  page?: number;
  limit?: number;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize?: number;
  totalPages?: number;
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

function unwrapList<T>(d: any): Paginated<T> {
  if (Array.isArray(d)) return { items: d, total: d.length, page: 1 };
  return {
    items: d?.items || d?.data || [],
    total: d?.total ?? d?.items?.length ?? 0,
    page: d?.page ?? 1,
    pageSize: d?.pageSize,
    totalPages: d?.totalPages,
  };
}

export const adminPartnersApi = {
  list: async (params?: PartnerListParams): Promise<Paginated<AdminPartner>> => {
    const r = await request<ApiResponse<any>>(`/admin/partners${qs(params)}`);
    return unwrapList<AdminPartner>(r.data);
  },
  get: async (id: string): Promise<AdminPartner> => {
    const r = await request<ApiResponse<any>>(`/admin/partners/${id}`);
    return r.data?.partner ?? r.data;
  },
  create: (body: Partial<AdminPartner>) =>
    request<ApiResponse<any>>(`/admin/partners`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: Partial<AdminPartner>) =>
    request<ApiResponse<any>>(`/admin/partners/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  setStatus: (id: string, status: string) =>
    request<ApiResponse<any>>(`/admin/partners/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
  remove: (id: string, opts?: { force?: boolean }) =>
    request<ApiResponse<any>>(
      `/admin/partners/${id}${opts?.force ? "?force=1" : ""}`,
      { method: "DELETE" }
    ),
  resetPassword: (id: string) =>
    request<ApiResponse<any>>(`/admin/partners/${id}/reset-password`, { method: "POST" }),
  // NOTE: Backend exposes /admin/offers?partnerId=... rather than a nested /admin/partners/{id}/offers route.
  offers: async (id: string, params?: { page?: number; limit?: number }) => {
    const r = await request<ApiResponse<any>>(`/admin/offers${qs({ ...(params || {}), partnerId: id })}`);
    return unwrapList<any>(r.data);
  },
  // NOTE: Backend exposes /admin/bookings?partnerId=... — use the global bookings list scoped by partner.
  bookings: async (id: string, params?: { page?: number; limit?: number }) => {
    const r = await request<ApiResponse<any>>(`/admin/bookings${qs({ ...(params || {}), partnerId: id })}`);
    return unwrapList<any>(r.data);
  },
  // NOTE: Backend exposes /admin/payouts?partnerId=... rather than a nested route.
  payouts: async (id: string, params?: { page?: number; limit?: number }) => {
    const r = await request<ApiResponse<any>>(`/admin/payouts${qs({ ...(params || {}), partnerId: id })}`);
    return unwrapList<any>(r.data);
  },
};

export function partnerLabel(p: AdminPartner): string {
  return (
    p.vendorNameAr ||
    p.vendorNameEn ||
    p.vendorName ||
    p.nameAr ||
    p.nameEn ||
    p.name ||
    p.ownerName ||
    p.email ||
    p.id
  );
}
