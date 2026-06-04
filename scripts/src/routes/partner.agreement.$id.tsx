import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { partnerApi, getStoredPartner, type PartnerProfile } from "@/lib/api/partner";
import { toast } from "sonner";
import { Loader2, Check, Download, ArrowRight } from "lucide-react";
import {
  buildAgreementHtmlForPartner,
  printAgreementPdf,
  type MockPartner,
  type MockAgreement,
} from "@/lib/agreementMock";

export const Route = createFileRoute("/partner/agreement/$id")({
  head: () => ({ meta: [{ title: "اتفاقية الشراكة | خصومات" }] }),
  component: PartnerAgreementPage,
});

function toMockPartner(p: PartnerProfile | null, a: MockAgreement | null): MockPartner {
  const any = (p || {}) as any;
  return {
    id: String(any.id ?? ""),
    vendor_name: any.vendorName || any.name || any.nameAr || any.vendor_name || "—",
    owner_name: any.ownerName || any.owner_name || any.contactName || "—",
    city: any.city || any.cityName || any.address || "—",
    phone: any.phone || "—",
    email: any.email || null,
    commercial_number: any.commercialNumber || any.commercial_number || null,
    status: any.status || "active",
    commission_pct: a?.commission_pct ?? any.commissionPct ?? null,
    deposit_pct: a?.deposit_pct ?? any.depositPct ?? null,
  };
}

function PartnerAgreementPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [agreement, setAgreement] = useState<MockAgreement | null>(null);
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [signature, setSignature] = useState("");
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setPartner(getStoredPartner());
    (async () => {
      try {
        const res = await partnerApi.getAgreementById(id);
        const a: any = res.agreement;
        if (!a) { toast.error("الاتفاقية غير موجودة"); setLoading(false); return; }
        setAgreement({
          id: a.id,
          partner_id: a.partnerId ?? a.partner_id,
          template_id: a.templateId ?? null,
          template_version: a.templateVersion ? `v${a.templateVersion}` : null,
          commission_pct: Number(a.commissionPct ?? a.commission_pct ?? 0),
          deposit_pct: Number(a.depositPct ?? a.deposit_pct ?? 0),
          status: a.status,
          signed_name: a.signedName ?? null,
          signed_at: a.signedAt ?? null,
          signature_image: a.signatureImage ?? null,
          admin_notes: a.adminNotes ?? null,
          created_at: a.createdAt ?? new Date().toISOString(),
        });
      } catch (err: any) {
        toast.error(err?.message || "الاتفاقية غير موجودة");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const mockPartner = useMemo(() => toMockPartner(partner, agreement), [partner, agreement]);
  const html = useMemo(
    () => (agreement ? buildAgreementHtmlForPartner(mockPartner, agreement, null) : ""),
    [agreement, mockPartner],
  );

  async function sign() {
    if (!signature.trim() || !agree) {
      toast.error("الرجاء كتابة الاسم الكامل والموافقة على الشروط");
      return;
    }
    setSubmitting(true);
    try {
      await partnerApi.signAgreement(id, {
        signedName: signature.trim(),
        signatureImage: signature.trim(),
      });
      toast.success("تم توقيع الاتفاقية بنجاح");
      setAgreement((p) => p && ({
        ...p,
        status: "signed",
        signed_name: signature.trim(),
        signed_at: new Date().toISOString(),
      }));
    } catch (err: any) {
      toast.error(err?.message || "تعذّر توقيع الاتفاقية");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6" dir="rtl">
        <div className="text-center">
          <p className="text-lg font-bold">الاتفاقية غير موجودة أو تم حذفها</p>
          <Link to={"/partner-dashboard" as any} className="mt-4 inline-block text-primary font-bold">العودة للوحة التحكم</Link>
        </div>
      </div>
    );
  }

  const signed = agreement.status === "signed";

  return (
    <div className="min-h-screen bg-muted/30 py-8" dir="rtl">
      <div className="mx-auto max-w-5xl px-4 space-y-4">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <h1 className="text-lg font-extrabold">مراجعة اتفاقية الشراكة</h1>
          <p className="text-xs text-muted-foreground mt-1">
            راجع الاتفاقية أدناه ثم وقّع إلكترونياً. سيتم حفظ نسخة موقّعة بنفس الشكل للطباعة والتنزيل.
          </p>
        </div>

        <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
          <iframe
            srcDoc={html}
            title="اتفاقية الشراكة"
            className="w-full h-[75vh] bg-white"
          />
        </div>

        {signed ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
            <div className="flex items-center gap-2 font-extrabold">
              <Check className="h-5 w-5" /> تم توقيع الاتفاقية
            </div>
            <div className="mt-2 text-sm">
              وقّع بواسطة <b>{agreement.signed_name}</b> بتاريخ {new Date(agreement.signed_at!).toLocaleString("ar-SA")}
            </div>
            <div className="mt-4 flex gap-2 flex-wrap">
              <button
                onClick={() => printAgreementPdf(html)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
              >
                <Download className="h-4 w-4" /> تحميل / طباعة PDF
              </button>
              <button
                onClick={() => navigate({ to: "/partner-dashboard" as any })}
                className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold"
              >
                <ArrowRight className="h-4 w-4" /> الذهاب للوحة التحكم
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 rounded-2xl border-2 border-primary/30 bg-primary/5 p-4">
            <div>
              <label className="text-xs font-bold">التوقيع الإلكتروني (الاسم الكامل) *</label>
              <input
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="الاسم الكامل"
                className="mt-1 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-1 h-4 w-4 accent-primary"
              />
              <span className="text-xs">
                راجعت الاتفاقية أعلاه وأوافق إلكترونياً على جميع بنودها وعلى نسبة <b>{agreement.commission_pct}%</b>.
              </span>
            </label>
            <button
              onClick={sign}
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#3F2A6B] to-[#E0254D] px-6 py-3 text-sm font-extrabold text-white shadow-lg disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {submitting ? "جاري التوقيع..." : "وقّع الاتفاقية"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
