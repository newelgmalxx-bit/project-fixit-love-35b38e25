import { request, getToken, BASE } from './client';
import type { Order, ApiResponse, PaginatedResponse } from './types';

const requireTrackingId = (id: number | string | null | undefined) => {
  const trackingId = id == null ? '' : String(id).trim();
  if (!trackingId) {
    throw new Error('Tracking code id is required');
  }
  return trackingId;
};

export const admin = {
  // Dashboard
  getDashboard: () => request<ApiResponse<any>>('/admin/dashboard'),



  getOrders: (p?: any) => { const q = p ? new URLSearchParams(p).toString() : ''; return request<PaginatedResponse<Order>>(`/admin/orders${q ? '?' + q : ''}`); },
  getOrder: (id: string) => request<ApiResponse<{ order: Order }>>(`/admin/orders/${id}`),
  // Generic update (notes, etc.)
  updateOrder: (id: string, body: any) => request(`/admin/orders/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  // Dedicated status endpoint: PUT /admin/orders/{id}/status  body: { status }
  updateOrderStatus: (id: string, body: any) => {
    const status = typeof body === 'string' ? body : body?.status;
    return request(`/admin/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
  },
  // Dedicated payment endpoint: PUT /admin/orders/{id}/payment  body: { payment_method, payment_status }
  updateOrderPayment: (id: string, body: { payment_method?: string; payment_status?: string; paymentMethod?: string; paymentStatus?: string }) => {
    const payload: Record<string, any> = {};
    const method = body.payment_method ?? body.paymentMethod;
    const status = body.payment_status ?? body.paymentStatus;
    if (method != null) { payload.payment_method = method; payload.paymentMethod = method; }
    if (status != null) { payload.payment_status = status; payload.paymentStatus = status; }
    return request(`/admin/orders/${id}/payment`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  updateOrderPaymentStatus: (id: string, paymentStatus: string) =>
    request(`/admin/orders/${id}/payment`, { method: 'PUT', body: JSON.stringify({ payment_status: paymentStatus, paymentStatus }) }),
  updateOrderPaymentMethod: (id: string, paymentMethod: string) =>
    request(`/admin/orders/${id}/payment`, { method: 'PUT', body: JSON.stringify({ payment_method: paymentMethod, paymentMethod }) }),
  // Backend exposes POST /admin/orders/{id}/confirm-payment as the canonical confirm action.
  confirmOrderPayment: (id: string) =>
    request(`/admin/orders/${id}/confirm-payment`, { method: 'POST' }),
  // Backend has no generic PUT on /admin/orders/{id}; note is wired via /payment for now (no-op safe field).
  addOrderNote: (_id: string, _text: string) => Promise.reject(new Error('Order notes endpoint not implemented in backend')),
  // Order timeline (GET list + POST event)
  getOrderTimeline: (id: string) =>
    request<ApiResponse<{ orderId: string; timeline: Array<{ id: string; status: string; note: string | null; at: string }> }>>(`/admin/orders/${id}/timeline`),
  addOrderTimeline: (id: string, body: { status: string; note?: string }) =>
    request<ApiResponse<any>>(`/admin/orders/${id}/timeline`, { method: 'POST', body: JSON.stringify(body) }),
  deleteOrder: (id: string) => request(`/admin/orders/${id}`, { method: 'DELETE' }),

  getBookings: (p?: any) => { const q = p ? new URLSearchParams(p).toString() : ''; return request(`/admin/bookings${q ? '?' + q : ''}`); },
  updateBooking: (id: string, body: any) => request(`/admin/bookings/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  addBookingNote: (id: string, text: string) => request(`/admin/bookings/${id}`, { method: 'PUT', body: JSON.stringify({ note: text }) }),

  getInvoices: (p?: any) => { const q = p ? new URLSearchParams(p).toString() : ''; return request(`/admin/invoices${q ? '?' + q : ''}`); },
  getInvoice: (id: string) => request(`/admin/invoices/${id}`),
  // Backend: POST /admin/invoices accepts JSON body only (no multipart). PDFs are server-generated.
  createInvoice: (body: any) =>
    request('/admin/invoices', { method: 'POST', body: JSON.stringify(body) }),
  // Backend exposes only PUT /admin/invoices/{id}/status — generic update is unsupported.
  updateInvoiceStatus: (id: string, status: string) =>
    request(`/admin/invoices/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  updateInvoice: (id: string, body: any) => {
    if (body && typeof body === 'object' && 'status' in body) {
      return request(`/admin/invoices/${id}/status`, { method: 'PUT', body: JSON.stringify({ status: body.status }) });
    }
    return Promise.reject(new Error('Only invoice status updates are supported by backend'));
  },
  deleteInvoice: (id: string) => request(`/admin/invoices/${id}`, { method: 'DELETE' }),
  invoicePdf: (id: string) => fetch(`${BASE}/admin/invoices/${id}/pdf`, { headers: { Authorization: `Bearer ${getToken()}` } }).then(r => r.blob()),

  // "Clients" are not a separate resource in the new spec — alias to /admin/users.
  getClients: (p?: any) => { const q = p ? new URLSearchParams(p).toString() : ''; return request(`/admin/users${q ? '?' + q : ''}`); },
  createClient: (body: any) => request('/admin/users', { method: 'POST', body: JSON.stringify(body) }),
  updateClient: (id: string, body: any) => request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteClient: (id: string) => request(`/admin/users/${id}`, { method: 'DELETE' }),


  getAnalytics: (range?: string) => request(`/admin/analytics/overview${range ? '?range=' + range : ''}`),
  getAnalyticsRealtime: () => request('/admin/analytics/realtime'),
  getStats: () => request('/admin/dashboard'),

  // Reports: POST /admin/reports/generate { type, from?, to? }
  generateReport: (body: { type?: string; from?: string; to?: string; format?: string }) =>
    request<ApiResponse<any>>('/admin/reports/generate', { method: 'POST', body: JSON.stringify(body) }),

  getUsers: (p?: any) => { const q = p ? new URLSearchParams(p).toString() : ''; return request(`/admin/users${q ? '?' + q : ''}`); },
  getUser: (id: string) => request<ApiResponse<{ user: any }>>(`/admin/users/${id}`),
  inviteUser: (body: any) => request('/admin/users', { method: 'POST', body: JSON.stringify(body) }),
  updateUser: (id: string, body: any) => request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  updateUserRole: (id: string, role: string) => request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify({ role }) }),
  updateUserStatus: (id: string, status: string) => request(`/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  deleteUser: (id: string) => request(`/admin/users/${id}`, { method: 'DELETE' }),

  // Settings: backend exposes only admin-scoped /admin/settings and /admin/settings/profile.
  getSettings: (group: string) => request(group === 'profile' ? '/admin/settings/profile' : '/admin/settings'),
  updateSettings: (group: string, body: any) =>
    request(group === 'profile' ? '/admin/settings/profile' : '/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  upload: async (file: File, bucket: string = 'general') => {
    const fd = new FormData(); fd.append('file', file);
    fd.append('bucket', bucket);
    return fetch(`${BASE}/admin/upload`, {
      method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: fd,
    }).then(r => r.json());
  },

  getNotifications: (limit?: number) => request(`/admin/notifications${limit ? '?limit=' + limit : ''}`),
  markNotificationsRead: (id?: string) =>
    id
      ? request(`/admin/notifications/${id}/read`, { method: 'PUT' })
      : request(`/admin/notifications/read-all`, { method: 'POST' }),

  getTickets: (p?: any) => { const q = p ? new URLSearchParams(p).toString() : ''; return request(`/admin/tickets${q ? '?' + q : ''}`); },
  getTicketDetail: (id: string) => request(`/admin/tickets/${id}`),
  replyTicket: (id: string, text: string) => request(`/admin/tickets/${id}/messages`, { method: 'POST', body: JSON.stringify({ text }) }),
  updateTicketStatus: (id: string, status: string) => request(`/admin/tickets/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  // Backend: PUT /admin/tickets/{id}/priority  body: { priority: low|medium|high|urgent }
  updateTicketPriority: (id: string, priority: string) =>
    request<ApiResponse<any>>(`/admin/tickets/${id}/priority`, { method: 'PUT', body: JSON.stringify({ priority }) }),

  getReviews: (p?: any) => { const q = p ? new URLSearchParams(p).toString() : ''; return request(`/admin/reviews${q ? '?' + q : ''}`); },
  approveReview: (id: string) => request(`/admin/reviews/${id}/approve`, { method: 'PUT' }),
  rejectReview: (id: string) => request(`/admin/reviews/${id}/reject`, { method: 'PUT' }),
  updateReviewStatus: (id: string, status: string) => {
    if (status === 'approved' || status === 'published') return request(`/admin/reviews/${id}/approve`, { method: 'PUT' });
    if (status === 'rejected') return request(`/admin/reviews/${id}/reject`, { method: 'PUT' });
    return request(`/admin/reviews/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
  },
  deleteReview: (id: string) => request(`/admin/reviews/${id}`, { method: 'DELETE' }),

  // Site settings — backend only exposes admin-scoped /admin/settings.
  getSiteSettings: () => request('/admin/settings'),
  updateSiteSettings: (body: any) => request('/admin/settings', { method: 'PUT', body: JSON.stringify(body) }),

  // Tracking codes (pixels / head / body scripts)
  trackingList: () => request<ApiResponse<{ items: any[] }>>('/admin/tracking-codes'),
  trackingCreate: (body: any) => request('/admin/tracking-codes', { method: 'POST', body: JSON.stringify(body) }),
  trackingUpdate: (id: number | string | null | undefined, body: any) => request(`/admin/tracking-codes/${requireTrackingId(id)}`, { method: 'PUT', body: JSON.stringify(body) }),
  trackingToggle: (id: number | string | null | undefined) => request(`/admin/tracking-codes/${requireTrackingId(id)}`, { method: 'PUT', body: JSON.stringify({ toggle: true }) }),
  trackingDelete: (id: number | string | null | undefined) => request(`/admin/tracking-codes/${requireTrackingId(id)}`, { method: 'DELETE' }),
  getPublicTracking: () => request<ApiResponse<{ pixels?: string; head?: string; body?: string }>>('/tracking'),

  // Coupons (admin)
  getCoupons: () => request<ApiResponse<{ items: any[] }>>('/admin/coupons'),
  createCoupon: (body: any) => request<ApiResponse<{ coupon: any }>>('/admin/coupons', { method: 'POST', body: JSON.stringify(body) }),
  updateCoupon: (id: string, body: any) => request<ApiResponse<{ coupon: any }>>(`/admin/coupons/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCoupon: (id: string) => request(`/admin/coupons/${id}`, { method: 'DELETE' }),





  // Abandoned carts
  getAbandonedCarts: (p?: { page?: number; limit?: number; search?: string }) => {
    const q = p ? new URLSearchParams(Object.entries(p).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])).toString() : '';
    return request<ApiResponse<any[]> & { total?: number; page?: number; totalPages?: number }>(`/admin/abandoned-carts${q ? '?' + q : ''}`);
  },
  remindAbandonedCart: (cartId: string) =>
    request<ApiResponse<any>>(`/admin/abandoned-carts/${cartId}/remind`, { method: 'POST' }),

  // Favorites (admin view)
  getFavorites: (p?: { page?: number; limit?: number }) => {
    const q = p ? new URLSearchParams(Object.entries(p).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString() : '';
    return request<ApiResponse<{ items: any[]; total: number; page: number; totalPages: number }>>(`/admin/favorites${q ? '?' + q : ''}`);
  },

  // Webhook logs
  getWebhookLogs: (p?: { page?: number; limit?: number; source?: string }) => {
    const q = p ? new URLSearchParams(Object.entries(p).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString() : '';
    return request<ApiResponse<{ items: any[]; total: number; page: number; totalPages: number }>>(`/admin/webhook-logs${q ? '?' + q : ''}`);
  },
  getWebhookLog: (id: string) =>
    request<ApiResponse<{ id: string; source: string; eventType: string; payload: any; createdAt: string }>>(`/admin/webhook-logs/${id}`),
  clearWebhookLogs: () =>
    request<ApiResponse<any>>(`/admin/webhook-logs/clear`, { method: 'DELETE' }),

  // Partner schedule (admin acting on behalf of partner)
  getPartnerBlockedDate: (partnerId: string, date: string) =>
    request<ApiResponse<{ date: string; dayOff: boolean; slots: string[] }>>(
      `/admin/partners/${partnerId}/schedule/blocked?date=${encodeURIComponent(date)}`,
    ),
  togglePartnerBlockedSlot: (partnerId: string, date: string, slot: string) =>
    request<ApiResponse<{ date: string; dayOff: boolean; slots: string[] }>>(
      `/admin/partners/${partnerId}/schedule/blocked`,
      { method: 'POST', body: JSON.stringify({ date, slot }) },
    ),
  setPartnerBlockedDayOff: (partnerId: string, date: string, dayOff: boolean) =>
    request<ApiResponse<{ date: string; dayOff: boolean; slots: string[] }>>(
      `/admin/partners/${partnerId}/schedule/blocked`,
      { method: 'POST', body: JSON.stringify({ date, dayOff }) },
    ),
  getPartnerWeekly: (partnerId: string) =>
    request<ApiResponse<{ workingHours: any }>>(`/admin/partners/${partnerId}/schedule/weekly`),
  setPartnerWeekly: (partnerId: string, workingHours: any) =>
    request<ApiResponse<{ workingHours: any }>>(
      `/admin/partners/${partnerId}/schedule/weekly`,
      { method: 'PUT', body: JSON.stringify({ workingHours }) },
    ),
};