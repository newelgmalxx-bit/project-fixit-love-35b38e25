import { request, getToken, BASE } from './client';
import type { User, Order, Ticket, ApiResponse, PaginatedResponse } from './types';

export const account = {
  profile: () => request<ApiResponse<{ user: User }>>('/account/profile'),

  updateProfile: (body: FormData | Record<string, any>) => {
    if (body instanceof FormData) {
      return fetch(`${BASE}/account/profile`, {
        method: 'PUT', headers: { Authorization: `Bearer ${getToken()}` }, body,
      }).then(r => r.json());
    }
    return request<ApiResponse<{ user: User }>>('/account/profile', { method: 'PUT', body: JSON.stringify(body) });
  },

  changePassword: (current: string, newPass: string) =>
    request('/account/password', { method: 'PUT', body: JSON.stringify({ currentPassword: current, newPassword: newPass }) }),

  orders: (params?: { status?: string; page?: number; limit?: number }) => {
    const clean: Record<string, string> = {};
    if (params) for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') clean[k] = String(v);
    }
    const q = new URLSearchParams(clean).toString();
    return request<PaginatedResponse<Order>>(`/account/orders${q ? '?' + q : ''}`);
  },

  orderDetail: (id: string) =>
    request<ApiResponse<{ order: Order }>>(`/account/orders/${id}`),

  tickets: (params?: { page?: number; status?: string; priority?: string; limit?: number }) => {
    const clean: Record<string, string> = {};
    if (params) for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') clean[k] = String(v);
    }
    const q = new URLSearchParams(clean).toString();
    return request<PaginatedResponse<Ticket>>(`/account/tickets${q ? '?' + q : ''}`);
  },

  ticketDetail: (id: string) =>
    request<ApiResponse<{ ticket: Ticket }>>(`/account/tickets/${id}`),

  ticketReply: (id: string, text: string) =>
    request(`/account/tickets/${id}/messages`, { method: 'POST', body: JSON.stringify({ text }) }),

  // Spec has no dedicated /close — use status update.
  ticketClose: (id: string) =>
    request(`/account/tickets/${id}/status`, { method: 'PUT', body: JSON.stringify({ status: 'closed' }) }),

  createTicket: (body: {
    subject: string;
    message: string;
    orderId?: string;
    priority?: 'low' | 'normal' | 'high';
  }) => {
    const payload: Record<string, any> = {
      subject: body.subject,
      message: body.message,
      orderId: body.orderId,
      priority: body.priority ?? 'normal',
    };
    return request<ApiResponse<{ id: string; number: string }>>('/account/tickets', {
      method: 'POST', body: JSON.stringify(payload),
    });
  },

  // Re-pay an existing unpaid order — always against the same order id.
  // POST /account/orders/{id}/pay  body: { paymentMethod }
  // Backend routes internally to the correct gateway (Tamara/Tabby/MyFatoorah)
  // and returns { paymentUrl, orderId, orderNumber } from that gateway.
  payOrder: (id: string, body?: { paymentMethod?: string }) => {
    const m = body?.paymentMethod;
    const method =
      m === 'cod' ? 'cod'
      : m === 'tamara' ? 'tamara'
      : m === 'tabby' ? 'tabby'
      : 'myfatoorah';
    return request<ApiResponse<{ paymentUrl: string; orderId: string; orderNumber: string }>>(
      `/account/orders/${id}/pay`,
      { method: 'POST', body: JSON.stringify({ paymentMethod: method }) },
    );
  },

  // ----- Invoices (auth) -----
  invoices: (params?: { page?: number }) => {
    const q = params ? new URLSearchParams(params as any).toString() : '';
    return request<PaginatedResponse<any>>(`/account/invoices${q ? '?' + q : ''}`);
  },
  invoiceDetail: (id: string) =>
    request<ApiResponse<{ invoice: any }>>(`/account/invoices/${id}`),

  // ----- Reviews (auth) -----
  createReview: (body: { serviceId: string; rating: number; comment?: string }) =>
    request<ApiResponse<{ review: any }>>('/account/reviews', {
      method: 'POST', body: JSON.stringify(body),
    }),

  // ----- Favorites (auth) — keyed by serviceId per spec -----
  favorites: () =>
    request<ApiResponse<{ items: any[] }>>('/account/favorites'),

  addFavorite: (serviceId: string) =>
    request<ApiResponse<any>>(`/account/favorites`, {
      method: 'POST',
      body: JSON.stringify({ offerId: serviceId }),
    }),

  removeFavorite: (serviceId: string) =>
    request<ApiResponse<any>>(`/account/favorites/${serviceId}`, { method: 'DELETE' }),
};