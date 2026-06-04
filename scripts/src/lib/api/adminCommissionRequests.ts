// Admin Commission Requests API — wired to /admin/commission-requests
import { request } from "./client";
import type { ApiResponse } from "./types";

export type AdminCommissionRequest = {
  id: string;
  partnerId: string;
  partnerName?: string | null;
  partnerEmail?: string | null;
  partnerPhone?: string | null;
  currentCommissionPct?: number | null;
  currentDepositPct?: number | null;
  requestedCommissionPct: number;
  requestedDepositPct: number;
  reason: string | null;
  status: "pending" | "approved" | "rejected" | string;
  adminNotes?: string | null;
  createdAt: string;
  [k: string]: any;
};

function qs(p?: Record<string, any>) {
  if (!p) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? "?" + s : "";
}

function normalize(r: any): AdminCommissionRequest {
  const currentPct = r.currentCommissionPct ?? r.current_commission_pct ?? r.currentPct ?? r.current_pct ?? null;
  const requestedPct = r.requestedCommissionPct ?? r.requested_commission_pct ?? r.requestedPct ?? r.requested_pct ?? 0;
  const currentDeposit = r.currentDepositPct ?? r.current_deposit_pct ?? null;
  const requestedDeposit = r.requestedDepositPct ?? r.requested_deposit_pct ?? 0;
  const adminNotes = r.adminNotes ?? r.admin_notes ?? r.adminNote ?? r.admin_note ?? null;
  return {
    id: r.id,
    partnerId: r.partnerId ?? r.partner_id,
    partnerName: r.partnerName ?? r.partner_name ?? null,
    partnerEmail: r.partnerEmail ?? r.partner_email ?? null,
    partnerPhone: r.partnerPhone ?? r.partner_phone ?? null,
    currentCommissionPct: currentPct != null ? Number(currentPct) : null,
    currentDepositPct: currentDeposit != null ? Number(currentDeposit) : null,
    requestedCommissionPct: Number(requestedPct),
    requestedDepositPct: Number(requestedDeposit),
    reason: r.reason ?? null,
    status: r.status,
    adminNotes,
    createdAt: r.createdAt ?? r.created_at,
    ...r,
  };
}


export const adminCommissionRequestsApi = {
  list: async (params?: { status?: string; partnerId?: string; q?: string; page?: number; limit?: number }) => {
    const r = await request<ApiResponse<any>>(`/admin/commission-requests${qs(params)}`);
    const d: any = r.data;
    const items: any[] = Array.isArray(d) ? d : d?.items || [];
    return {
      items: items.map(normalize),
      total: d?.total ?? items.length,
      page: d?.page ?? 1,
      totalPages: d?.totalPages ?? d?.pages ?? 1,
    };
  },
  decide: async (id: string, status: "approved" | "rejected", adminNotes?: string | null) => {
    const r = await request<ApiResponse<any>>(`/admin/commission-requests/${id}/decide`, {
      method: "PUT",
      body: JSON.stringify({ status, admin_notes: adminNotes ?? null }),
    });
    return r.data;
  },
};
