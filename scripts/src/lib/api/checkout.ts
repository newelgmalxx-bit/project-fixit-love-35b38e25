import { request } from './client';
import type { Order, ApiResponse } from './types';

export type PaymentMethodInfo = {
  id: string;
  name: string;
  description?: string;
  logo?: string | null;
  fee?: number;
  type?: string;
};

// Static fallback if /checkout/payment-methods is unavailable.
export const PAYMENT_METHODS: PaymentMethodInfo[] = [
  { id: 'myfatoorah', name: 'MyFatoorah', type: 'gateway' },
  { id: 'cod', name: 'Cash on Delivery', type: 'cod' },
];

// Normalize any UI-side payment id to a backend-accepted value.
// Backend accepts: "tamara" | "myfatoorah" | "cod". Anything else (mada,
// visa, numeric MyFatoorah method ids, legacy "mayfatoorah" typo) is
// treated as the MyFatoorah gateway. "tamara" is a standalone provider
// and must NOT be routed through MyFatoorah.
export function normalizePaymentMethod(id: string | null | undefined): string {
  if (id === 'cod') return 'cod';
  if (id === 'tamara') return 'tamara';
  if (id === 'tabby') return 'tabby';
  // Numeric MyFatoorah PaymentMethodId (e.g. 6, 12) — pass through.
  if (id && /^\d+$/.test(id)) return id;
  return 'myfatoorah';
}

type CheckoutBody = {
  contact?: { name?: string; email?: string; phone: string; city?: string; address?: string };
  paymentMethod: string;
  notes?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactCity?: string;
  contactAddress?: string;
  city?: string;
  phone?: string;
  date?: string;
  time?: string;
  sessionId?: string;
  items?: Array<{ offerId?: string; offerTitle?: string; offerSlug?: string; serviceSlug?: string; serviceTitle?: string; planId?: string | null; planName?: string | null; price?: number; qty?: number }>;
};

function buildPayload(body: CheckoutBody) {
  return {
    paymentMethod: normalizePaymentMethod(body.paymentMethod),
    contactName: body.contactName ?? body.contact?.name ?? '',
    contactEmail: body.contactEmail ?? body.contact?.email ?? '',
    contactPhone: body.contactPhone ?? body.contact?.phone ?? body.phone ?? '',
    city: body.contactCity ?? body.contact?.city ?? body.city,
    contactCity: body.contactCity ?? body.contact?.city ?? body.city,
    contactAddress: body.contactAddress ?? body.contact?.address,
    notes: body.notes,
    date: body.date,
    time: body.time,
    session_id: body.sessionId,
    items: body.items,
  };
}

type BookingRow = {
  bookingId: string;
  bookingNo: string;
  verifyCode?: string;
  offerId?: string | null;
  offerTitle?: string;
  total?: number;
};

type CheckoutResponse = ApiResponse<{
  // New backend (bookings table) shape
  bookingId?: string;
  bookingNumber?: string;
  bookings?: BookingRow[];
  paymentUrl?: string | null;
  invoiceId?: string | null;
  checkoutId?: string | null;
  // Legacy aliases kept for older callers
  orderId?: string;
  orderNumber?: string;
  order?: Order;
}>;

export const checkout = {
  // POST /checkout — create order (online or COD).
  create: (body: CheckoutBody) =>
    request<CheckoutResponse>('/checkout', { method: 'POST', body: JSON.stringify(buildPayload(body)) }),

  // POST /checkout/initiate — alias used for online (MyFatoorah) checkout.
  initiate: (body: CheckoutBody) =>
    request<CheckoutResponse>('/checkout/initiate', {
      method: 'POST',
      body: JSON.stringify(buildPayload({ ...body, paymentMethod: 'myfatoorah' })),
    }),

  // POST /checkout/cod — Cash on Delivery checkout.
  cod: (body: CheckoutBody) =>
    request<CheckoutResponse>('/checkout/cod', {
      method: 'POST',
      body: JSON.stringify(buildPayload({ ...body, paymentMethod: 'cod' })),
    }),

  // POST /checkout/myfatoorah — initiate hosted payment session for an existing order.
  initiateMyfatoorah: (orderId: string) =>
    request<ApiResponse<{ paymentUrl: string }>>('/checkout/myfatoorah', {
      method: 'POST', body: JSON.stringify({ orderId }),
    }),

  // GET /checkout/verify?paymentId=xxx — MyFatoorah return verification.
  verify: (paymentId: string) =>
    request<ApiResponse<{
      bookingId?: string;
      bookingNumber?: string;
      orderId?: string;
      orderNumber?: string;
      paid: boolean;
      paymentStatus?: 'paid' | 'pending' | 'failed' | 'unpaid';
      status?: 'confirmed' | 'pending' | 'cancelled';
      invoiceId?: string | null;
      paymentId?: string | null;
    }>>(`/checkout/verify?paymentId=${encodeURIComponent(paymentId)}`),

  // Legacy alias kept for older callers.
  callback: (paymentId: string) =>
    request<ApiResponse<{ paid: boolean; orderId?: string; orderNumber?: string }>>(
      `/checkout/verify?paymentId=${encodeURIComponent(paymentId)}`
    ),

  // GET /checkout/payment-methods — load methods from backend.
  paymentMethods: () =>
    request<ApiResponse<{ items: PaymentMethodInfo[] }>>('/checkout/payment-methods'),
};
