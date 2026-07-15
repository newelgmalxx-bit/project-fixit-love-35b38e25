// Branch API — separate namespace with its own token (`branch_token`).
// Intentionally isolated from the customer/partner client so branch sessions
// don't collide with partner sessions in the same browser.
const BASE = "https://koswmat.com/api";
const TOKEN_KEY = "branch_token";
const BRANCH_KEY = "branch_current";

export type BranchPermissions = {
  isIndependent?: boolean;
  canManageOffers?: boolean;
  canManageHours?: boolean;
  canEditInfo?: boolean;
  canManageBookings?: boolean;
  hasAccount?: boolean;
};

export type BranchMe = {
  id: string;
  partnerId?: string;
  nameAr: string;
  nameEn?: string | null;
  phone?: string | null;
  address?: string | null;
  mapsUrl?: string | null;
  workingHours?: any;
  isDefault?: boolean;
  status?: string;
} & BranchPermissions;

export type ParentPartner = {
  id: string;
  name?: string;
  nameEn?: string | null;
  logo?: string | null;
};

export function getBranchToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
export function setBranchToken(t: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, t);
  try { window.dispatchEvent(new Event("koswmat:branch-auth")); } catch {}
}
export function removeBranchToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(BRANCH_KEY);
  try { window.dispatchEvent(new Event("koswmat:branch-auth")); } catch {}
}
export function getStoredBranch(): BranchMe | null {
  if (typeof window === "undefined") return null;
  try {
    const d = localStorage.getItem(BRANCH_KEY);
    return d ? JSON.parse(d) : null;
  } catch { return null; }
}
export function setStoredBranch(b: BranchMe | null) {
  if (typeof window === "undefined") return;
  if (b) localStorage.setItem(BRANCH_KEY, JSON.stringify(b));
  else localStorage.removeItem(BRANCH_KEY);
}

class BranchApiError extends Error {
  status: number;
  errors?: Record<string, any>;
  constructor(status: number, message: string, errors?: any) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

async function req<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...((opts.headers as Record<string, string>) || {}),
  };
  if (!(opts.body instanceof FormData) && opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const token = getBranchToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  let json: any = null;
  try { json = await res.json(); } catch {}
  if (!res.ok || (json && json.success === false)) {
    throw new BranchApiError(res.status, json?.message || `Request failed (${res.status})`, json?.errors);
  }
  return json as T;
}

const unwrap = <T = any>(p: Promise<any>): Promise<T> => p.then((r) => (r?.data ?? r) as T);

// =========== Auth ===========
export const branchAuth = {
  login: async (body: { email: string; password: string }) => {
    const r = await req<any>("/auth/branch/login", { method: "POST", body: JSON.stringify(body) });
    const d = r?.data ?? r;
    if (d?.token && !d?.requiresOtp) setBranchToken(d.token);
    if (d?.branch) setStoredBranch(d.branch);
    return d;
  },
  verifyOtp: async (body: { email: string; otp: string }) => {
    const r = await req<any>("/auth/branch/login/verify-otp", { method: "POST", body: JSON.stringify(body) });
    const d = r?.data ?? r;
    if (d?.token) setBranchToken(d.token);
    if (d?.branch) setStoredBranch(d.branch);
    return d;
  },
  resendOtp: (body: { email: string }) =>
    req<any>("/auth/branch/login/resend-otp", { method: "POST", body: JSON.stringify(body) }),
  logout: async () => {
    try { await req("/auth/branch/logout", { method: "POST" }); } catch {}
    removeBranchToken();
  },
  me: () => unwrap<{ user?: any; branch: BranchMe }>(req("/auth/branch/me")),
};

// =========== Branch dashboard ===========
export const branchApi = {
  me: () => unwrap<{ branch: BranchMe; parentPartner: ParentPartner | null }>(req("/branch/me")),
  updateProfile: (body: Partial<BranchMe>) =>
    unwrap<{ branch: BranchMe }>(req("/branch/profile", { method: "PUT", body: JSON.stringify(body) })),

  getHours: () => unwrap<{ workingHours: any }>(req("/branch/hours")),
  setHours: (workingHours: any) =>
    unwrap<{ workingHours: any }>(req("/branch/hours", { method: "PUT", body: JSON.stringify({ workingHours }) })),

  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    req<any>("/branch/change-password", { method: "POST", body: JSON.stringify(body) }),

  // Offers
  listOffers: (params?: { page?: number; pageSize?: number; status?: string }) => {
    const s = new URLSearchParams();
    if (params?.page) s.set("page", String(params.page));
    if (params?.pageSize) s.set("pageSize", String(params.pageSize));
    if (params?.status && params.status !== "all") s.set("status", params.status);
    const qs = s.toString();
    return unwrap<{ items: any[]; total?: number; page?: number }>(req(`/branch/offers${qs ? `?${qs}` : ""}`));
  },
  getOffer: (id: string) => unwrap<{ offer: any }>(req(`/branch/offers/${id}`)),
  createOffer: (body: any) =>
    unwrap<{ offer: any }>(req("/branch/offers", { method: "POST", body: JSON.stringify(body) })),
  updateOffer: (id: string, body: any) =>
    unwrap<{ offer: any }>(req(`/branch/offers/${id}`, { method: "PUT", body: JSON.stringify(body) })),
  deleteOffer: (id: string) => req(`/branch/offers/${id}`, { method: "DELETE" }),

  // Bookings
  listBookings: (params?: { page?: number; pageSize?: number; status?: string; search?: string }) => {
    const s = new URLSearchParams();
    if (params?.page) s.set("page", String(params.page));
    if (params?.pageSize) s.set("pageSize", String(params.pageSize));
    if (params?.status && params.status !== "all") s.set("status", params.status);
    if (params?.search) s.set("search", params.search);
    const qs = s.toString();
    return unwrap<{ items: any[]; total?: number }>(req(`/branch/bookings${qs ? `?${qs}` : ""}`));
  },
  getBooking: (id: string) => unwrap<{ booking: any }>(req(`/branch/bookings/${id}`)),
  updateBooking: (id: string, body: { status?: string; notes?: string; date?: string; time?: string }) =>
    unwrap<{ booking: any }>(req(`/branch/bookings/${id}`, { method: "PUT", body: JSON.stringify(body) })),
  redeemBooking: (id: string, code: string) =>
    req(`/branch/bookings/${id}/redeem`, { method: "POST", body: JSON.stringify({ code }) }),
};

export { BranchApiError };
