import { request } from './client';
import type { ApiResponse } from './types';

// Reviews are listed publicly. Pass offerId or serviceSlug to filter; omit to get all.
export const reviews = {
  list: (params?: { offerId?: string; serviceSlug?: string; limit?: number }) => {
    const sp = new URLSearchParams();
    if (params?.offerId) sp.set("offerId", params.offerId);
    if (params?.serviceSlug) sp.set("serviceSlug", params.serviceSlug);
    if (params?.limit) sp.set("limit", String(params.limit));
    const qs = sp.toString();
    return request<ApiResponse<any>>(`/reviews${qs ? `?${qs}` : ""}`);
  },
  create: (target: { offerId?: string; serviceSlug?: string }, body: { rating: number; comment?: string }) =>
    request('/account/reviews', {
      method: 'POST',
      body: JSON.stringify({
        offerId: target.offerId,
        serviceSlug: target.serviceSlug,
        rating: body.rating,
        text: body.comment ?? '',
        comment: body.comment ?? '',
      }),
    }),
};

// Favorites are keyed by offer id.
export const favorites = {
  list: () => request<ApiResponse<{ items: any[]; ids?: string[] }>>('/account/favorites'),
  add: (offerId: string) =>
    request<ApiResponse<{ favorited: boolean }>>(`/account/favorites`, {
      method: 'POST',
      body: JSON.stringify({ offerId }),
    }),
  remove: (offerId: string) =>
    request<ApiResponse<{ favorited: boolean }>>(`/account/favorites/${offerId}`, { method: 'DELETE' }),
};
