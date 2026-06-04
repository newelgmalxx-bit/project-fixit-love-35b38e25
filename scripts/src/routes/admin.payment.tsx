import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout, PanelCard, PrimaryButton, Pill } from "@/components/admin/AdminLayout";
import { useState, useEffect } from "react";
import { CreditCard, Smartphone, Wallet, Building, Banknote } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageProvider";
import { admin as adminApi } from "@/lib/api";

export const Route = createFileRoute("/admin/payment")({
  head: () => ({ meta: [{ title: "Payment Settings | Admin" }] }),
  component: PaymentSettingsPage,
});

type Gateway = { key: string; label: string; icon: any; enabled: boolean; mode: "test" | "live"; publicKey: string; secretKey: string; merchantId?: string };

function PaymentSettingsPage() {
  const { lang, dir } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);
  const initial: Gateway[] = [
    { key: "mada", label: L("مدى", "Mada"), icon: CreditCard, enabled: true, mode: "test", publicKey: "", secretKey: "" },
    { key: "visa", label: "Visa / Mastercard", icon: CreditCard, enabled: true, mode: "test", publicKey: "", secretKey: "" },
    { key: "applepay", label: "Apple Pay", icon: Smartphone, enabled: true, mode: "test", publicKey: "", secretKey: "", merchantId: "" },
    { key: "mayfatoorah", label: "MyFatoorah", icon: Wallet, enabled: false, mode: "test", publicKey: "", secretKey: "" },
    { key: "stripe", label: "Stripe", icon: CreditCard, enabled: false, mode: "test", publicKey: "", secretKey: "" },
    { key: "paypal", label: "PayPal", icon: CreditCard, enabled: false, mode: "test", publicKey: "", secretKey: "" },
    { key: "bank", label: L("تحويل بنكي", "Bank Transfer"), icon: Building, enabled: true, mode: "live", publicKey: "", secretKey: "" },
    { key: "cash", label: L("كاش عند الاستلام", "Cash on Delivery"), icon: Banknote, enabled: false, mode: "live", publicKey: "", secretKey: "" },
  ];
  const [gateways, setGateways] = useState<Gateway[]>(initial);
  const [vat, setVat] = useState(15);
  const [currency, setCurrency] = useState("SAR");
  useEffect(() => {
    (async () => {
      try {
        const s = await adminApi.settings.get<any>("payment");
        if (s?.gateways) setGateways((cur) => cur.map(g => ({ ...g, ...(s.gateways[g.key] || {}) })));
        if (typeof s?.vat === "number") setVat(s.vat);
        if (s?.currency) setCurrency(s.currency);
      } catch {}
    })();
  }, []);
  const save = async () => {
    try {
      const payload = { vat, currency, gateways: Object.fromEntries(gateways.map(g => [g.key, g])) };
      await adminApi.settings.update("payment", payload);
      toast.success(L("تم الحفظ", "Saved"));
    } catch (e: any) { toast.error(e?.message || "Save failed"); }
  };
  const update = (k: string, patch: Partial<Gateway>) => setGateways(gateways.map(g => g.key === k ? { ...g, ...patch } : g));
  const knobOn = dir === "rtl" ? "right-0.5" : "left-0.5";
  const knobOff = dir === "rtl" ? "right-5" : "left-5";
  return (
    <AdminLayout title={L("إعدادات الدفع", "Payment Settings")} subtitle={L("بوابات الدفع والعملة والضريبة", "Payment gateways, currency, and VAT")} action={<PrimaryButton onClick={save}>{L("حفظ", "Save")}</PrimaryButton>}>
      <PanelCard title={L("إعدادات عامة", "General Settings")} className="mb-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Lb label={L("العملة", "Currency")}>
            <select className={ic} value={currency} onChange={e => setCurrency(e.target.value)}>
              <option value="SAR">{L("ريال سعودي", "Saudi Riyal")} (SAR)</option><option value="USD">USD</option><option value="AED">AED</option>
            </select>
          </Lb>
          <Lb label={L("نسبة ضريبة القيمة المضافة %", "VAT Rate %")}><input type="number" className={ic} value={vat} onChange={e => setVat(Number(e.target.value))} /></Lb>
          <Lb label={L("الرقم الضريبي", "Tax Number")}><input className={ic} dir="ltr" placeholder="3000XXXXXX" /></Lb>
        </div>
      </PanelCard>

      <PanelCard title={L("بوابات الدفع", "Payment Gateways")}>
        <div className="space-y-3">
          {gateways.map(g => {
            const I = g.icon;
            return (
              <div key={g.key} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><I className="h-5 w-5" /></div>
                    <div>
                      <div className="font-bold">{g.label}</div>
                      <Pill tone={g.enabled ? "emerald" : "muted"}>{g.enabled ? L("مفعّل", "Enabled") : L("متوقف", "Disabled")}</Pill>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={g.mode} onChange={e => update(g.key, { mode: e.target.value as any })} className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-bold">
                      <option value="test">{L("تجريبي", "Test")}</option><option value="live">{L("مباشر", "Live")}</option>
                    </select>
                    <button onClick={() => update(g.key, { enabled: !g.enabled })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${g.enabled ? "bg-primary" : "bg-muted"}`}>
                      <span className={`absolute inline-block h-5 w-5 rounded-full bg-white shadow transition ${g.enabled ? knobOn : knobOff}`} />
                    </button>
                  </div>
                </div>
                {g.enabled && g.key !== "cash" && g.key !== "bank" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Lb label="Public Key"><input className={ic} dir="ltr" value={g.publicKey} onChange={e => update(g.key, { publicKey: e.target.value })} /></Lb>
                    <Lb label="Secret Key"><input className={ic} dir="ltr" type="password" value={g.secretKey} onChange={e => update(g.key, { secretKey: e.target.value })} /></Lb>
                    {"merchantId" in g && <Lb label="Merchant ID" full><input className={ic} dir="ltr" value={g.merchantId ?? ""} onChange={e => update(g.key, { merchantId: e.target.value })} /></Lb>}
                  </div>
                )}
                {g.enabled && g.key === "bank" && <textarea rows={3} placeholder={L("بيانات الحساب البنكي...", "Bank account details...")} className={ic} />}
              </div>
            );
          })}
        </div>
      </PanelCard>
    </AdminLayout>
  );
}
const ic = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
function Lb({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <label className={`text-xs font-bold space-y-1.5 block ${full ? "sm:col-span-2" : ""}`}>{label}{children}</label>;
}
