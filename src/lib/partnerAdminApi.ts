// Partner-facing API — wired to the real backend at https://koswmat.com/api
// Backend routes (see partner.php):
//   GET    /partner/offers
//   GET    /partner/offers/{id}
//   POST   /partner/offers
//   PUT    /partner/offers/{id}
//   DELETE /partner/offers/{id}
//   GET    /partner/{partnerId}/bookings
//   GET    /partner/{partnerId}/payouts
//
// Auth: Bearer token (partner JWT). Stored in localStorage under "partner_token"
// or the legacy "admin_partner_test_key" key for backwards compatibility.
import type { PartnerOrder, PartnerOrdersResponse, PartnerPingResponse } from "@/types/partner";

const BASE_URL = "https://koswmat.com/api";
const KEY_STORAGE = "admin_partner_test_key";
const PARTNER_ID_KEY = "partner_id";

export const getPartnerKey = () => {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("partner_token") ||
    localStorage.getItem(KEY_STORAGE) ||
    ""
  );
};

export const setPartnerKey = (key: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_STORAGE, key);
};

export const getPartnerId = () => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(PARTNER_ID_KEY) || "";
};

export const setPartnerId = (id: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(PARTNER_ID_KEY, id);
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = getPartnerKey();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (key) headers["Authorization"] = `Bearer ${key}`;
  if (init.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* non-json */
  }
  if (!res.ok) {
    const msg = json?.message || json?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json as T;
}

// --------- Offers ---------
export type PartnerOffer = {
  id: string;
  partnerId: string;
  title: string;
  description?: string | null;
  priceBefore?: number;
  priceAfter?: number;
  discountPercent?: number;
  durationMinutes?: number | null;
  status: "draft" | "active" | "paused" | "expired" | string;
  gallery?: { id: string; url: string; sortOrder?: number }[];
  createdAt?: string;
  updatedAt?: string;
  [k: string]: any;
};

export type PartnerOffersListResponse = {
  data: PartnerOffer[];
  total?: number;
  page?: number;
  pages?: number;
};

// --------- Bookings (the "orders" of the partner dashboard) ---------
function mapBookingToOrder(b: any): PartnerOrder {
  return {
    id: b.id,
    reference: b.reference ?? null,
    customer_name: b.customerName ?? b.customer_name ?? null,
    customer_email: b.customerEmail ?? b.customer_email ?? null,
    customer_phone: b.customerPhone ?? b.customer_phone ?? null,
    total: Number(b.totalAmount ?? b.total ?? b.amount ?? 0),
    currency: b.currency ?? "SAR",
    status: b.status ?? "new",
    notes: b.notes ?? null,
    items: Array.isArray(b.items)
      ? b.items.map((i: any) => ({
          title: i.title ?? i.offerTitle ?? "",
          plan: i.plan ?? null,
          qty: Number(i.qty ?? 1),
          price: Number(i.price ?? i.unitPrice ?? 0),
        }))
      : [
          {
            title: b.offerTitle ?? "",
            plan: null,
            qty: 1,
            price: Number(b.amount ?? b.totalAmount ?? 0),
          },
        ],
    created_at: b.createdAt ?? b.created_at ?? new Date().toISOString(),
    updated_at: b.updatedAt ?? b.updated_at ?? null,
  };
}

export const partnerAdminApi = {
  baseUrl: BASE_URL,

  // Ping/sync are not real backend endpoints — provide local stubs so the UI can degrade gracefully.
  ping: async (): Promise<PartnerPingResponse> => {
    const key = getPartnerKey();
    if (!key) return { ok: false, message: "no token" };
    // Use a real authenticated call as a liveness check.
    try {
      await request("/partner/offers?page=1&limit=1");
      return { ok: true, message: "connected" };
    } catch (e: any) {
      return { ok: false, message: e?.message || "unreachable" };
    }
  },
  sync: async () => ({ ok: true, synced: 0, message: "sync not implemented in backend" }),

  // Offers
  listOffers: (params?: { page?: number; limit?: number; status?: string; q?: string }) => {
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.status && params.status !== "all") sp.set("status", params.status);
    if (params?.q) sp.set("q", params.q);
    const qs = sp.toString();
    return request<{ success: boolean; data: PartnerOffersListResponse | PartnerOffer[] }>(
      `/partner/offers${qs ? `?${qs}` : ""}`,
    );
  },
  getOffer: (id: string) =>
    request<{ success: boolean; data: { offer: PartnerOffer } }>(`/partner/offers/${id}`),
  createOffer: (body: Partial<PartnerOffer>) =>
    request<{ success: boolean; data: { offer: PartnerOffer } }>(`/partner/offers`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateOffer: (id: string, body: Partial<PartnerOffer>) =>
    request<{ success: boolean; data: { offer: PartnerOffer } }>(`/partner/offers/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteOffer: (id: string) =>
    request<{ success: boolean }>(`/partner/offers/${id}`, { method: "DELETE" }),

  // Bookings ↔ "orders" alias for legacy dashboard pages.
  listBookings: async (
    partnerId?: string,
    params?: { page?: number; limit?: number; status?: string },
  ): Promise<PartnerOrdersResponse> => {
    const pid = partnerId || getPartnerId();
    if (!pid) throw new Error("partnerId is required");
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.status && params.status !== "all") sp.set("status", params.status);
    const qs = sp.toString();
    const r = await request<{ success: boolean; data: any }>(
      `/partner/${pid}/bookings${qs ? `?${qs}` : ""}`,
    );
    const d: any = r?.data ?? r;
    const items: any[] = Array.isArray(d) ? d : d?.items || [];
    return {
      data: items.map(mapBookingToOrder),
      total: Array.isArray(d) ? items.length : d?.total ?? items.length,
      page: d?.page ?? 1,
    };
  },
  // Legacy alias names used by existing UI: orders === bookings, getOrder = no-op (backend has none).
  listOrders: (params?: { status?: string; q?: string; page?: number }) =>
    partnerAdminApi.listBookings(undefined, params),
  getOrder: (_id: string | number): Promise<{ data: PartnerOrder }> => {
    return Promise.reject(
      new Error("Per-booking detail endpoint not implemented for partners"),
    );
  },
  updateOrderStatus: (_id: string | number, _status: string) => {
    return Promise.reject(
      new Error("Booking status update endpoint not implemented for partners"),
    );
  },

  // Payouts
  listPayouts: (partnerId?: string, params?: { page?: number; limit?: number }) => {
    const pid = partnerId || getPartnerId();
    if (!pid) throw new Error("partnerId is required");
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.limit) sp.set("limit", String(params.limit));
    const qs = sp.toString();
    return request<{ success: boolean; data: any }>(
      `/partner/${pid}/payouts${qs ? `?${qs}` : ""}`,
    );
  },
};
