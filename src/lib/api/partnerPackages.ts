import { request, ApiError } from "./client";
import type { ApiResponse } from "./types";

export type PartnerPackage = {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  price: number; // numeric, currency = SAR. NOT charged via the platform.
  description?: string | null;
  features?: string[];
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
};

const fromApi = (raw: any): PartnerPackage => ({
  id: String(raw?.id ?? ""),
  name: raw?.name ?? raw?.nameAr ?? raw?.nameEn ?? "",
  nameAr: raw?.nameAr ?? raw?.name_ar ?? undefined,
  nameEn: raw?.nameEn ?? raw?.name_en ?? undefined,
  price: Number(raw?.price ?? 0) || 0,
  description: raw?.description ?? null,
  features: Array.isArray(raw?.features) ? raw.features : [],
  isActive: raw?.isActive ?? raw?.is_active ?? true,
  sortOrder: Number(raw?.sortOrder ?? raw?.sort_order ?? 0) || 0,
  createdAt: raw?.createdAt ?? raw?.created_at,
  updatedAt: raw?.updatedAt ?? raw?.updated_at,
});

const toApi = (b: Partial<PartnerPackage>) => ({
  name: b.name,
  nameAr: b.nameAr,
  nameEn: b.nameEn,
  name_ar: b.nameAr,
  name_en: b.nameEn,
  price: b.price,
  description: b.description ?? null,
  features: b.features ?? [],
  isActive: b.isActive ?? true,
  is_active: b.isActive ?? true,
  sortOrder: b.sortOrder ?? 0,
  sort_order: b.sortOrder ?? 0,
});

/**
 * Public list of active partner packages — shown on the partner signup form.
 * Returns [] silently when the backend endpoint isn't implemented yet (404/405)
 * so the UI degrades gracefully.
 */
export const partnerPackagesPublic = {
  list: async (): Promise<PartnerPackage[]> => {
    try {
      const r = await request<ApiResponse<{ items: any[] }>>("/partner-packages");
      const items = (r as any)?.data?.items ?? (r as any)?.items ?? [];
      return items.map(fromApi).filter((p: PartnerPackage) => p.isActive !== false);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 405)) return [];
      console.warn("[partner-packages.list]", e);
      return [];
    }
  },
};

export const adminPartnerPackagesApi = {
  list: async (): Promise<PartnerPackage[]> => {
    try {
      const r = await request<ApiResponse<{ items: any[] }>>("/admin/partner-packages");
      const items = (r as any)?.data?.items ?? (r as any)?.items ?? [];
      return items.map(fromApi);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 405)) return [];
      throw e;
    }
  },
  create: async (body: Partial<PartnerPackage>): Promise<PartnerPackage> => {
    const r = await request<ApiResponse<{ package: any }>>("/admin/partner-packages", {
      method: "POST",
      body: JSON.stringify(toApi(body)),
    });
    return fromApi((r as any)?.data?.package ?? (r as any)?.data ?? body);
  },
  update: async (id: string, body: Partial<PartnerPackage>): Promise<PartnerPackage> => {
    const r = await request<ApiResponse<{ package: any }>>(`/admin/partner-packages/${id}`, {
      method: "PUT",
      body: JSON.stringify(toApi(body)),
    });
    return fromApi((r as any)?.data?.package ?? (r as any)?.data ?? body);
  },
  remove: (id: string) =>
    request<ApiResponse<unknown>>(`/admin/partner-packages/${id}`, { method: "DELETE" }),
};
