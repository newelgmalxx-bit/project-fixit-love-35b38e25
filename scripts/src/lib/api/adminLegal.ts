// Admin Legal Pages API
import { request } from "./client";
import type { ApiResponse } from "./types";

export type LegalPage = {
  slug: string;
  titleAr?: string;
  titleEn?: string;
  contentAr?: string;
  contentEn?: string;
  updatedAt?: string;
  [k: string]: any;
};

export const adminLegalApi = {
  list: async (): Promise<LegalPage[]> => {
    const r = await request<ApiResponse<any>>(`/admin/legal-pages`);
    const d: any = r.data;
    return Array.isArray(d) ? d : d?.items || d?.pages || [];
  },
  update: (slug: string, body: Partial<LegalPage>) =>
    request<ApiResponse<any>>(`/admin/legal-pages/${encodeURIComponent(slug)}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
};
