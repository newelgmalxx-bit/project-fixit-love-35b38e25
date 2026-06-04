import { auth as authNew } from './auth';
import { reviews, favorites } from './services';
import { cart as cartNew, type AddCartBody } from './cart';
import { checkout as checkoutNew } from './checkout';
import { account as accountNew } from './account';
import { admin as adminNew } from './admin';
import { publicApi } from './public';
import { request, removeToken } from './client';
import type { CartItem, Cart, ApiResponse } from './types';

export { reviews, favorites, publicApi };
export type * from './types';
export { getToken, setToken, removeToken, getUser, setUser, getSid, getLang, ApiError, BASE } from './client';

// Legacy alias used widely across the codebase.
export const clearToken = removeToken;

// ---------- Legacy CartLine type (alias of new CartItem) ----------
export type CartLine = CartItem;

// ============================================================
//  Auth — keep new shape but unwrap envelope for legacy callers
// ============================================================
export const auth = {
  ...authNew,
  verifyRegisterOtp: async (body: { email: string; otp: string }) => {
    const res = await authNew.verifyRegisterOtp(body);
    return res.data; // { user, token }
  },
  resendRegisterOtp: authNew.resendRegisterOtp,
  // Legacy: returned { user, token } directly (no envelope).
  signup: async (body: { name: string; email: string; phone?: string; password: string }) => {
    const res = await authNew.signup(body);
    return res.data; // { user?, token?, requiresOtp?, email?, message? }
  },
  login: async (body: { email?: string; phone?: string; password: string }) => {
    const res = await authNew.login(body);
    return res.data;
  },
  me: async () => {
    const res = await authNew.me();
    return res.data; // { user }
  },
  oauthGoogle: async (idToken: string) => {
    const res = await authNew.google(idToken);
    return res.data; // { user, token, isNew? }
  },
  // Convenience kept for new callers.
  google: authNew.google,
  requestEmailOtp: authNew.requestEmailOtp,
  verifyEmailOtp: async (body: { email: string; otp: string }) => {
    const res = await authNew.verifyEmailOtp(body);
    return res.data; // { user, token }
  },
  refresh: authNew.refresh,
};


// ============================================================
//  Cart — adds legacy aliases (addItem/updateItem/removeItem/applyCoupon)
// ============================================================
async function unwrapCart<T extends Promise<ApiResponse<Cart>>>(p: T): Promise<Cart> {
  const res = await p;
  return res.data;
}
export const cart = {
  ...cartNew,
  get: async () => {
    try { return await unwrapCart(cartNew.get()); } catch { return { items: [], subtotal: 0, vat: 0, total: 0, sessionId: '' } as Cart; }
  },
  addItem: async (body: AddCartBody) =>
    unwrapCart(cartNew.add(body)),
  updateItem: async (lineId: string, qty: number) =>
    unwrapCart(cartNew.updateQty(lineId, qty)),
  removeItem: async (lineId: string) =>
    unwrapCart(cartNew.remove(lineId)),
};

// ============================================================
//  Checkout — `.submit()` legacy + `.create()` new
// ============================================================
export const checkout = {
  ...checkoutNew,
  submit: async (body: Parameters<typeof checkoutNew.create>[0]) => {
    // Call /checkout (or /checkout/cod) directly so we can read the order
    // data even when the server returns `success: false` (e.g. the order
    // was created but a post-create cart cleanup step failed).
    const { getToken, getLang, getSid, ApiError } = await import('./client');
    const { normalizePaymentMethod } = await import('./checkout');
    const method = normalizePaymentMethod(body.paymentMethod);
    const payload: any = {
      paymentMethod: method,
      contactName: body.contactName ?? body.contact?.name ?? '',
      contactEmail: body.contactEmail ?? body.contact?.email ?? '',
      contactPhone: body.contactPhone ?? body.contact?.phone ?? body.phone ?? '',
      city: body.contactCity ?? body.contact?.city ?? body.city,
      contactCity: body.contactCity ?? body.contact?.city ?? body.city,
      contactAddress: body.contactAddress ?? body.contact?.address,
      notes: body.notes,
      items: body.items,
    };
    const token = getToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': getLang(),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    else headers['X-Session-Id'] = getSid();

    // Route per provider:
    //  - cod      → /checkout/cod
    //  - tamara   → /checkout (Tamara is a standalone provider, NOT MyFatoorah)
    //  - default  → /checkout/initiate (MyFatoorah hosted)
    const endpoint =
      method === 'cod' ? '/checkout/cod'
      : method === 'tamara' ? '/checkout'
      : '/checkout/initiate';
    const res = await fetch(`https://koswmat.com/api${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    let json: any = null;
    try { json = await res.json(); } catch {}
    const data = json?.data ?? json ?? {};
    const orderId = data.orderId ?? data.order_id ?? data.order?.id;
    const orderNumber = data.orderNumber ?? data.order_number ?? data.order?.number ?? data.order?.orderNumber;
    const paymentUrl = data.paymentUrl ?? data.payment_url ?? data.invoiceURL ?? data.invoice_url ?? data.url ?? data.order?.paymentUrl ?? data.order?.payment_url ?? null;
    const provider = data.provider ?? method;

    // If the order was actually created, treat it as success regardless of
    // the `success` flag or any cleanup-side errors.
    if (orderId || orderNumber) {
      return {
        orderId,
        orderNumber,
        paymentUrl,
        provider,
        order: data.order,
      };
    }

    // Real failure (auth, validation, server error, empty response).
    // Surface the actual API message (e.g. Tamara validation errors).
    const apiMsg = json?.message || json?.error || data?.message || data?.error;
    if (res.status === 401) {
      throw new ApiError(401, apiMsg || 'Unauthorized');
    }
    if (res.status === 422 || json?.errors) {
      throw new ApiError(422, apiMsg || 'Validation failed', json?.errors);
    }
    throw new ApiError(
      res.status || 502,
      apiMsg || 'تعذر إنشاء الطلب على الخادم. حاول مرة أخرى أو تواصل مع الدعم.'
    );
  },
};

// ============================================================
//  Account — legacy method names mapped to new ones
// ============================================================
export const account = {
  ...accountNew,
  getProfile: async () => {
    const res = await accountNew.profile();
    return res.data?.user;
  },
  listOrders: async (q?: { status?: string; page?: number; limit?: number }) => {
    const res: any = await accountNew.orders(q);
    return res.data; // { items, total, page, pageSize, totalPages }
  },
  getOrder: async (id: string) => {
    const res = await accountNew.orderDetail(id);
    return res.data?.order;
  },
  listTickets: async (q?: { status?: string; priority?: string; page?: number; limit?: number }) => {
    const res: any = await accountNew.tickets(q);
    return res.data;
  },
  getTicket: async (id: string) => {
    const res = await accountNew.ticketDetail(id);
    return res.data?.ticket;
  },
  replyTicket: (id: string, text: string) => accountNew.ticketReply(id, text),
  closeTicket: (id: string) => accountNew.ticketClose(id),
};

// ============================================================
//  Contact (legacy export)
// ============================================================
export const contact = {
  send: (body: { name: string; email: string; phone?: string; service?: string; budget?: string; message: string }) =>
    publicApi.sendContact(body),
};

// ============================================================
//  Admin — keep flat new methods AND nested legacy namespaces
// ============================================================
const a = adminNew;
const qs = (p?: any) => (p ? '?' + new URLSearchParams(p).toString() : '');

const adminLegacy = {
  bookings: {
    list: async (q?: any) => {
      const r: any = await a.getOrders(q);
      return r.data;
    },
    setStatus: (id: string, body: any) => a.updateOrderStatus(id, body),
    addNote: (id: string, text: string) => a.addOrderNote(id, text),
  },
  orders: {
    list: async (q?: any) => {
      const r: any = await a.getOrders(q);
      return r.data;
    },
    get: async (id: string) => {
      const r: any = await a.getOrder(id);
      const order = r?.data?.order;
      if (!order) return order;
      // Backend returns items/user as siblings of order — merge for callers.
      return { ...order, items: r?.data?.items ?? order.items, user: r?.data?.user ?? order.user };
    },
    update: (id: string, body: any) => {
      // Route payment-related updates to the dedicated /payment endpoint
      if (body && (body.paymentMethod || body.payment_method || body.paymentStatus || body.payment_status)) {
        const payload: any = {};
        if (body.paymentMethod || body.payment_method) payload.payment_method = body.paymentMethod || body.payment_method;
        if (body.paymentStatus || body.payment_status) payload.payment_status = body.paymentStatus || body.payment_status;
        return a.updateOrderPayment(id, payload);
      }
      if (body && body.status && Object.keys(body).length === 1) {
        return a.updateOrderStatus(id, body);
      }
      return a.updateOrder(id, body);
    },
    setStatus: (id: string, body: any) => a.updateOrderStatus(id, body),
    setPaymentStatus: (id: string, paymentStatus: string) => a.updateOrderPaymentStatus(id, paymentStatus),
    setPaymentMethod: (id: string, paymentMethod: string) => a.updateOrderPaymentMethod(id, paymentMethod),
    addNote: (id: string, text: string) => a.addOrderNote(id, text),
    remove: (id: string) => a.deleteOrder(id),
  },
  consultations: {
    list: async (q?: any) => {
      const r: any = await a.getBookings(q);
      return r.data;
    },
    setStatus: (id: string, body: any) => a.updateBooking(id, body),
    addNote: (id: string, text: string) => a.addBookingNote(id, text),
  },
  invoices: {
    list: async (q?: any) => {
      const r: any = await a.getInvoices(q);
      return r.data;
    },
    get: async (id: string) => {
      const r: any = await a.getInvoice(id);
      return r?.data ?? r;
    },
    create: (body: any, _pdf?: Blob) => a.createInvoice(body),
    setStatus: (id: string, status: string) => a.updateInvoiceStatus(id, status),
    remove: (id: string) => a.deleteInvoice(id),
    pdf: (id: string) => a.invoicePdf(id),
  },
  clients: {
    list: async (q?: any) => {
      const r: any = await a.getClients(q);
      return r.data;
    },
    create: (body: any) => a.createClient(body),
    update: (id: string, body: any) => a.updateClient(id, body),
    remove: (id: string) => a.deleteClient(id),
  },
  analytics: async (range?: string) => {
    const r: any = await a.getAnalytics(range);
    return r.data;
  },
  stats: async () => {
    const r: any = await a.getStats();
    return r.data;
  },
  reports: {
    generate: (body: any) => a.generateReport(body),
  },
  users: {
    list: async (q?: any) => {
      const r: any = await a.getUsers(q);
      return r.data;
    },
    get: async (id: string) => {
      const r: any = await a.getUser(id);
      return r?.data?.user ?? r?.data ?? r;
    },
    invite: (body: any) => a.inviteUser(body),
    update: (id: string, body: any) => a.updateUser(id, body),
    setRole: (id: string, role: string) => a.updateUserRole(id, role),
    setStatus: (id: string, status: string) => a.updateUserStatus(id, status),
    remove: (id: string) => a.deleteUser(id),
  },
  settings: {
    get: async <T = any>(group: string) => {
      const r: any = await a.getSettings(group);
      return (r?.data ?? r) as T;
    },
    update: (group: string, body: any) => a.updateSettings(group, body),
  },
  upload: async (file: File) => {
    const r: any = await a.upload(file);
    return r?.data ?? r;
  },
  notifications: {
    list: async (limit?: number) => {
      const r: any = await a.getNotifications(limit);
      return r?.data ?? r;
    },
    markRead: (id?: number | string) => a.markNotificationsRead(id != null ? String(id) : undefined),
  },
  tickets: {
    list: async (q?: any) => {
      const r: any = await a.getTickets(q);
      return r?.data ?? r;
    },
    get: async (id: string) => {
      const r: any = await a.getTicketDetail(id);
      return r?.data?.ticket ?? r?.data ?? r;
    },
    reply: (id: string, text: string) => a.replyTicket(id, text),
    setStatus: (id: string, status: string) => a.updateTicketStatus(id, status),
    setPriority: (id: string, priority: string) => a.updateTicketPriority(id, priority),
  },
  reviews: {
    list: async (q?: any) => {
      const r: any = await a.getReviews(q);
      return r?.data ?? r;
    },
    setStatus: (id: string, status: string) => a.updateReviewStatus(id, status),
    remove: (id: string) => a.deleteReview(id),
  },
  siteSettings: async () => {
    const r: any = await a.getSiteSettings();
    return r?.data ?? r;
  },
  tracking: {
    list: async () => {
      const r: any = await a.trackingList();
      return (r?.data?.items ?? r?.items ?? []) as any[];
    },
    create: (body: any) => a.trackingCreate(body),
    update: (id: number | string | null | undefined, body: any) => a.trackingUpdate(id, body),
    toggle: (id: number | string | null | undefined) => a.trackingToggle(id),
    remove: (id: number | string | null | undefined) => a.trackingDelete(id),
  },
};

// Merged: flat (new spec) + nested namespaces (legacy).
export const admin: typeof adminNew & typeof adminLegacy = Object.assign({}, adminNew, adminLegacy) as any;

// ============================================================
//  Default export — `api` namespace used by many old files.
// ============================================================
const api = { auth, cart, checkout, account, contact, admin };
export default api;