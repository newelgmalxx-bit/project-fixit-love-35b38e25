// Admin SEO API — backend endpoint /admin/seo is NOT implemented.
// Stubs return empty data on read and reject on write so the UI degrades gracefully.
export const adminSeoApi = {
  get: async (): Promise<Record<string, any>> => ({}),
  update: (_body: Record<string, any>) =>
    Promise.reject(new Error("SEO settings endpoint not implemented in backend")),
};
