// Admin SEO API — backend endpoints:
// GET  /admin/seo  → { global, pages, robots }
// PUT  /admin/seo  → save full payload
import { request } from "./client";
import type { ApiResponse } from "./types";

export type SeoPayload = {
  global: {
    siteName: string;
    separator: string;
    twitter: string;
    ogImage: string;
    canonicalBase: string;
  };
  pages: Array<{
    key: string;
    label: string;
    title: string;
    desc: string;
    keywords?: string;
  }>;
  robots: string;
};

export const adminSeoApi = {
  get: async (): Promise<Partial<SeoPayload>> => {
    const r = await request<ApiResponse<SeoPayload>>("/admin/seo");
    return ((r as any)?.data ?? r ?? {}) as Partial<SeoPayload>;
  },
  update: (body: Partial<SeoPayload>) =>
    request<ApiResponse<unknown>>("/admin/seo", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
};

// Public SEO (used optionally by SSR/meta tags)
export const publicSeoApi = {
  get: async (): Promise<Partial<SeoPayload>> => {
    try {
      const r = await request<ApiResponse<SeoPayload>>("/seo");
      return ((r as any)?.data ?? r ?? {}) as Partial<SeoPayload>;
    } catch {
      return {};
    }
  },
};
