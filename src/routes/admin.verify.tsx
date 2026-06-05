import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout, PanelCard } from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";
import {
  ShieldCheck, Search, Loader2, CheckCircle2, XCircle,
  User as UserIcon, Phone, Mail, Calendar, Clock, Tag, MapPin, Store, Hash, CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageProvider";
import { adminBookingsApi, type AdminBooking } from "@/lib/api/adminBookings";
import { adminPartnersApi } from "@/lib/api/adminPartners";

export const Route = createFileRoute("/admin/verify")({
  head: () => ({ meta: [{ title: "التحقق من الحجز | الإدارة" }] }),
  component: AdminVerifyPage,
});

function clean(v: string) {
  return v.replace(/\s+/g, "").trim();
}
function pickRef(b: any): string | undefined {
  return b?.qrCode || b?.qr_code || b?.bookingNumber || b?.booking_number || b?.reference || b?.referenceCode || b?.reference_code || b?.confirmationCode || b?.confirmation_code || b?.code;
}
function pickVerifyCode(b: any): string | undefined {
  return b?.verifyCode || b?.verify_code || b?.confirmCode || b?.confirm_code || b?.pin || b?.otp;
}
function num(v: any): number | undefined {
  return v == null || v === "" ? undefined : Number(v);
}
function pickDeposit(b: any): number | undefined {
  return num(b?.deposit_amount ?? b?.depositAmount ?? b?.deposit ?? b?.paidAmount ?? b?.paid_amount);
}
function pickTotal(b: any): number | undefined {
  return num(b?.total ?? b?.total_amount ?? b?.totalAmount ?? b?.amount);
}
function pickOfferTitle(b: any): string | undefined {
  return b?.offerTitle || b?.offer_title || b?.offer?.title || b?.offer?.titleAr;
}
function pickPartnerName(b: any): string | undefined {
  return b?.partnerName || b?.partner_name || b?.partner?.name || b?.partner?.nameAr;
}
function pickCity(b: any): string | undefined {
  return b?.city || b?.partnerCity || b?.partner_city || b?.partner?.city;
}
function pickMapsUrl(b: any): string | undefined {
  return b?.mapsUrl || b?.maps_url || b?.partner?.mapsUrl || b?.partner?.maps_url;
}
function pickPayment(b: any): string | undefined {
  return b?.paymentMethod || b?.payment_method || b?.payment;
}
function pickStatus(b: any): string {
  return String(b?.status || "").toLowerCase();
}

function matchBooking(x: any, idQ: string, normalized: string, codeQ: string): boolean {
  const id = String(x.id || "").toUpperCase();
  const ref = String(pickRef(x) || "").toUpperCase().replace(/\s+/g, "").replace(/^#/, "");
  const refNorm = ref.replace(/^BK[-_ ]?/i, "");
  const v = String(pickVerifyCode(x) || "").toUpperCase();
  if (v && codeQ && v !== codeQ) return false;
  return (
    id === idQ ||
    id.endsWith(idQ) ||
    ref === idQ ||
    refNorm === normalized ||
    ref.endsWith(idQ)
  );
}

function AdminVerifyPage() {
  const { lang, dir } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);

  const [bookingId, setBookingId] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [result, setResult] = useState<
    | { status: "idle" }
    | { status: "notfound" }
    | { status: "wrong" }
    | { status: "ok"; booking: AdminBooking; alreadyRedeemed: boolean }
  >({ status: "idle" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const rawId = clean(bookingId);
    const codeQ = clean(code).toUpperCase();
    const idQ = rawId.replace(/^#/, "").replace(/^bk[-_ ]?/i, "").toUpperCase();
    const normalized = idQ;
    if (!idQ || codeQ.length < 4) {
      toast.error(L("أدخل رقم الحجز ورمز التحقق", "Enter booking # and code"));
      return;
    }
    setSubmitting(true);
    try {
      const [r1, r2] = await Promise.all([
        adminBookingsApi.list({ q: rawId, limit: 50 }).catch(() => ({ items: [] as any[] })),
        adminBookingsApi.list({ q: codeQ, limit: 50 }).catch(() => ({ items: [] as any[] })),
      ]);
      const pool: any[] = [...(r1.items || []), ...(r2.items || [])];
      let b: any = pool.find((x) => matchBooking(x, idQ, normalized, codeQ));
      if (!b) { setResult({ status: "notfound" }); return; }
      // Re-fetch full + backfill partner info
      try {
        const fresh = await adminBookingsApi.get(b.id);
        b = fresh;
        if ((!pickCity(b) || !pickMapsUrl(b)) && (b as any).partnerId) {
          try {
            const p: any = await adminPartnersApi.get((b as any).partnerId);
            b = {
              ...b,
              city: pickCity(b) || p?.city || p?.address || "",
              mapsUrl: pickMapsUrl(b) || p?.mapsUrl || p?.maps_url || "",
              partnerName: pickPartnerName(b) || p?.name || p?.nameAr || "",
            };
          } catch { /* ignore */ }
        }
      } catch { /* keep snapshot */ }
      const expected = String(pickVerifyCode(b) || "").toUpperCase();
      if (expected && expected !== codeQ) {
        setResult({ status: "wrong" });
        return;
      }
      const st = pickStatus(b);
      const already = !!(b as any).redeemed_at || !!(b as any).redeemedAt || st === "completed" || st === "redeemed";
      setResult({ status: "ok", booking: b, alreadyRedeemed: already });
    } catch (e: any) {
      toast.error(e?.message || L("تعذر التحقق", "Verify failed"));
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmRedeem() {
    if (result.status !== "ok") return;
    const b = result.booking;
    const st = pickStatus(b);
    if (st === "cancelled" || st === "refunded") {
      toast.error(L("هذا الحجز ملغي/مسترجع", "Booking is cancelled/refunded"));
      return;
    }
    setRedeeming(true);
    try {
      try {
        await adminBookingsApi.redeem(b.id, clean(code).toUpperCase());
      } catch {
        await adminBookingsApi.setStatus(b.id, "redeemed");
      }
      toast.success(L(`تم تأكيد حضور: ${b.customerName || b.id}`, `Confirmed: ${b.customerName || b.id}`));
      const fresh = await adminBookingsApi.get(b.id).catch(() => b);
      setResult({ status: "ok", booking: fresh as AdminBooking, alreadyRedeemed: true });
    } catch (e: any) {
      toast.error(e?.message || L("تعذّر تأكيد الحجز", "Failed to confirm"));
    } finally {
      setRedeeming(false);
    }
  }

  function reset() {
    setBookingId(""); setCode("");
    setResult({ status: "idle" });
  }

  const b = result.status === "ok" ? (result.booking as any) : null;
  const total = b ? pickTotal(b) : null;
  const deposit = b ? pickDeposit(b) : null;
  const remaining = (total != null && deposit != null) ? Math.max(0, +(total - deposit).toFixed(2)) : null;

  return (
    <AdminLayout
      title={L("التحقق من الحجز", "Verify booking")}
      subtitle={L("تحقق من رقم الحجز ورمز التأكيد واطّلع على كامل تفاصيل الحجز", "Verify booking # + code and view full booking details")}
    >
      <div className="mx-auto max-w-3xl">
        <PanelCard className="!p-0 overflow-hidden">
          {/* Purple header (same as partner) */}
          <div className="bg-gradient-to-r from-[#3F2A6B] to-[#5a3d8f] p-6 text-white">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold">{L("التحقق من حجز العميل", "Verify customer booking")}</h2>
                <p className="text-xs text-white/85">{L("أدخل رقم الحجز ورمز التأكيد كما يظهران للعميل", "Enter booking # + confirmation code exactly as shown")}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            <div>
              <label className={`mb-1.5 block text-xs font-bold text-muted-foreground ${dir === "rtl" ? "text-right" : "text-left"}`}>{L("رقم الحجز", "Booking #")}</label>
              <input
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                placeholder="BK-XXXXXX"
                dir="ltr"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base font-bold tracking-wider text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className={`mb-1.5 block text-xs font-bold text-muted-foreground ${dir === "rtl" ? "text-right" : "text-left"}`}>{L("رمز التأكيد", "Confirmation code")}</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^a-zA-Z0-9-]/g, "").toUpperCase().slice(0, 32))}
                placeholder="••••••"
                dir="ltr"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-2xl font-black tracking-[0.4em] text-center text-foreground outline-none focus:border-primary"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#3F2A6B] py-3 text-sm font-bold text-white hover:bg-[#3F2A6B]/90 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} {L("تحقّق", "Verify")}
            </button>
          </form>

          {result.status === "notfound" && (
            <div className="mx-6 mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
              <XCircle className="h-5 w-5 shrink-0" />
              <div className="text-sm font-bold">{L("رقم الحجز غير موجود.", "Booking # not found.")}</div>
            </div>
          )}
          {result.status === "wrong" && (
            <div className="mx-6 mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
              <XCircle className="h-5 w-5 shrink-0" />
              <div className="text-sm font-bold">{L("رمز التأكيد غير صحيح.", "Invalid confirmation code.")}</div>
            </div>
          )}

          {result.status === "ok" && b && (
            <div className="mx-6 mb-6 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50">
              <div className="flex items-center gap-3 bg-emerald-100/60 px-4 py-3 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                <div className="text-sm font-extrabold">
                  {result.alreadyRedeemed
                    ? L("تم استخدام هذا الحجز مسبقاً", "Booking already redeemed")
                    : L("الحجز صحيح ومؤكد", "Booking is valid")}
                </div>
              </div>
              <div className="space-y-2 p-4 text-sm">
                <VRow icon={Hash} label={L("رقم الحجز", "Booking #")} value={pickRef(b) || String(b.id).slice(-6).toUpperCase()} ltr />
                <VRow icon={ShieldCheck} label={L("رمز التأكيد", "Verify code")} value={pickVerifyCode(b) || "—"} ltr />
                <VRow icon={UserIcon} label={L("العميل", "Customer")} value={b.customerName || "—"} />
                <VRow icon={Phone} label={L("الجوال", "Phone")} value={b.customerPhone || "—"} ltr />
                {b.customerEmail && <VRow icon={Mail} label={L("البريد", "Email")} value={b.customerEmail} ltr />}
                <VRow icon={Tag} label={L("العرض", "Offer")} value={pickOfferTitle(b) || "—"} />
                <VRow icon={Store} label={L("المركز", "Center")} value={pickPartnerName(b) || "—"} />
                <VRow icon={MapPin} label={L("المدينة", "City")}
                  value={pickCity(b) || "—"}
                  href={pickMapsUrl(b)}
                />
                <VRow icon={Calendar} label={L("التاريخ", "Date")} value={(b as any).booking_date || (b as any).bookingDate || (b.scheduledAt ? new Date(b.scheduledAt).toLocaleDateString() : "—")} ltr />
                <VRow icon={Clock} label={L("الوقت", "Time")} value={(b as any).booking_time || (b as any).bookingTime || (b.scheduledAt ? new Date(b.scheduledAt).toLocaleTimeString() : "—")} ltr />
                {pickPayment(b) && <VRow icon={CreditCard} label={L("طريقة الدفع", "Payment")} value={String(pickPayment(b))} ltr />}
                {total != null && <VRow icon={CreditCard} label={L("الإجمالي", "Total")} value={`${total} ر.س`} ltr />}
                {deposit != null && <VRow icon={CreditCard} label={L("العربون", "Deposit")} value={`${deposit} ر.س`} ltr />}
                {remaining != null && remaining > 0 && (
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2 text-amber-800">
                    <span className="text-xs font-bold">{L("يتبقى عند الخدمة", "Due at service")}</span>
                    <span dir="ltr" className="font-extrabold">{remaining} ر.س</span>
                  </div>
                )}
                <div className="flex gap-2 pt-3">
                  {!result.alreadyRedeemed && (
                    <button
                      type="button"
                      onClick={confirmRedeem}
                      disabled={redeeming}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {redeeming && <Loader2 className="h-4 w-4 animate-spin" />} {L("تأكيد استخدام الحجز", "Confirm redemption")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={reset}
                    className="flex-1 rounded-xl border border-border bg-white py-2.5 text-sm font-bold text-foreground hover:border-primary"
                  >
                    {L("تحقّق من حجز آخر", "Verify another")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </PanelCard>
      </div>
    </AdminLayout>
  );
}

function VRow({ icon: Icon, label, value, ltr, href }: { icon: any; label: string; value: string; ltr?: boolean; href?: string }) {
  const content = href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:underline" dir={ltr ? "ltr" : undefined}>
      {value}
    </a>
  ) : (
    <div className="font-bold text-foreground" dir={ltr ? "ltr" : undefined}>{value}</div>
  );
  return (
    <div className="flex items-center justify-between gap-3 border-b border-emerald-200/60 pb-1.5 last:border-0">
      <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      {content}
    </div>
  );
}