// Admin Agreements API — wired to backend
import { request } from "./client";

export type ApiAgreementTemplate = {
  id: string;
  title: string;
  body: string;
  version: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiPartnerAgreement = {
  id: string;
  partnerId: string;
  templateId: string | null;
  templateVersion: number;
  title: string | null;
  body: string;
  commissionPct: number;
  depositPct: number;
  customTitle: string | null;
  customBody: string | null;
  adminNotes: string | null;
  status: string; // pending | signed | cancelled
  signedName: string | null;
  signedAt: string | null;
  signatureImage: string | null;
  createdAt: string;
  updatedAt?: string;
  // Email tracking (new)
  emailSentAt?: string | null;
  emailResentCount?: number | null;
  emailLastStatus?: string | null; // queued | sent | failed | null
  hasAccessToken?: boolean;
  accessTokenExpires?: string | null;
  template?: { id: string; title: string | null; body: string | null; version: number | null } | null;
  partner?: { id: string; name: string | null; email: string | null; phone: string | null; logo: string | null };
};

function unwrap<T>(d: any, key: string): T {
  return (d?.[key] ?? d?.data?.[key] ?? d) as T;
}

export const adminAgreementsApi = {
  async listTemplates(): Promise<ApiAgreementTemplate[]> {
    const d = await request<any>("/admin/agreement-templates");
    const items = d?.items ?? d?.data?.items ?? d?.data ?? [];
    return items as ApiAgreementTemplate[];
  },
  async createTemplate(payload: { title: string; body: string; version?: number; isActive?: boolean }): Promise<ApiAgreementTemplate> {
    const d = await request<any>("/admin/agreement-templates", { method: "POST", body: JSON.stringify(payload) });
    return unwrap<ApiAgreementTemplate>(d, "item");
  },
  async listPartnerAgreements(partnerId: string): Promise<ApiPartnerAgreement[]> {
    const d = await request<any>(`/admin/partners/${partnerId}/agreements`);
    const items = d?.items ?? d?.data?.items ?? [];
    return items as ApiPartnerAgreement[];
  },
  async createPartnerAgreement(
    partnerId: string,
    payload: {
      templateId: string;
      commissionPct?: number;
      depositPct?: number;
      customTitle?: string | null;
      customBody?: string | null;
      adminNotes?: string | null;
    },
  ): Promise<ApiPartnerAgreement> {
    const d = await request<any>(`/admin/partners/${partnerId}/agreements`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return unwrap<ApiPartnerAgreement>(d, "item");
  },
  async updatePartnerAgreement(
    partnerId: string,
    agreementId: string,
    payload: Partial<{
      commissionPct: number;
      depositPct: number;
      customTitle: string | null;
      customBody: string | null;
      adminNotes: string | null;
    }>,
  ): Promise<ApiPartnerAgreement> {
    const d = await request<any>(`/admin/partners/${partnerId}/agreements/${agreementId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return unwrap<ApiPartnerAgreement>(d, "item");
  },
  async resendAgreementEmail(partnerId: string, agreementId: string): Promise<{ ok: boolean; sentAt: string; emailSent: boolean }> {
    const d = await request<any>(`/admin/partners/${partnerId}/agreements/${agreementId}/resend-email`, {
      method: "POST",
    });
    return (d?.data ?? d) as { ok: boolean; sentAt: string; emailSent: boolean };
  },
  async getAgreementQr(partnerId: string): Promise<{ agreementId: string; signedAt: string | null; qrUrl: string; qrPngBase64: string | null }> {
    const d = await request<any>(`/partner/agreement/qr?partnerId=${encodeURIComponent(partnerId)}`);
    return (d?.data ?? d) as { agreementId: string; signedAt: string | null; qrUrl: string; qrPngBase64: string | null };
  },
};
