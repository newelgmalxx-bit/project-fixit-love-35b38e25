import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AdminLayout, PanelCard, PrimaryButton, GhostButton } from "@/components/admin/AdminLayout";
import { CreditCard, Calendar, BarChart3, Facebook, Tag, Music, Link2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageProvider";
import { admin as adminApi } from "@/lib/api";

export const Route = createFileRoute("/admin/settings/integrations")({
  head: () => ({ meta: [{ title: "Integrations | Settings" }] }),
  component: IntegrationsPage,
});

type Field = { key: string; label: string; type?: "text" | "password" | "url"; placeholder?: string; help?: string };
type Item = { id: string; icon: any; name: string; desc: string; connected: boolean; fields: Field[]; docs?: string };

function IntegrationsPage() {
  const { lang, dir } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);
  const initialItems: Item[] = [
    {
      id: "moyasar", icon: CreditCard, name: "Moyasar", desc: L("بوابة الدفع الإلكتروني", "Online payment gateway"), connected: true,
      fields: [
        { key: "publishable", label: L("المفتاح العام (Publishable Key)", "Publishable Key"), placeholder: "pk_live_..." },
        { key: "secret", label: L("المفتاح السري (Secret Key)", "Secret Key"), type: "password", placeholder: "sk_live_..." },
        { key: "webhook", label: "Webhook URL", type: "url", placeholder: "https://..." },
      ],
      docs: "https://moyasar.com/docs",
    },
    {
      id: "ga4", icon: BarChart3, name: "Google Analytics (GA4)", desc: L("تتبع الزيارات والتحليلات", "Visitor analytics tracking"), connected: true,
      fields: [
        { key: "id", label: "Measurement ID", placeholder: "G-XXXXXXXXXX" },
        { key: "stream", label: L("Stream ID (اختياري)", "Stream ID (optional)") },
      ],
    },
    {
      id: "fbpixel", icon: Facebook, name: "Facebook Pixel", desc: L("تتبع الإعلانات والتحويلات", "Ad and conversion tracking"), connected: false,
      fields: [
        { key: "pixel", label: "Pixel ID", placeholder: "123456789012345" },
        { key: "capi", label: "Conversions API Token", type: "password" },
      ],
    },
    {
      id: "gtm", icon: Tag, name: "Google Tag Manager", desc: L("إدارة أكواد التتبع", "Manage tracking tags"), connected: false,
      fields: [{ key: "id", label: "Container ID", placeholder: "GTM-XXXXXXX" }],
    },
    {
      id: "tiktok", icon: Music, name: "TikTok Pixel", desc: L("تتبع إعلانات تيك توك", "TikTok ad tracking"), connected: false,
      fields: [
        { key: "pixel", label: "Pixel ID" },
        { key: "token", label: "Access Token", type: "password" },
      ],
    },
    {
      id: "partner", icon: Link2, name: "Partner API", desc: L("ربط مع شركة الشريك لتبادل الطلبات", "Connect with partner company for order exchange"), connected: false,
      fields: [
        { key: "endpoint", label: "Endpoint URL", type: "url", placeholder: "https://api.partner.com" },
        { key: "key", label: "API Key", type: "password" },
        { key: "webhook", label: "Webhook Secret", type: "password" },
      ],
    },
  ];

  const [items, setItems] = useState<Item[]>(initialItems);
  const [active, setActive] = useState<Item | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [stored, setStored] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    (async () => {
      try {
        const raw = await adminApi.settings.get<any>("integrations");
        // Backend may return an array, null, or { values, connected }
        const s = raw && !Array.isArray(raw) && typeof raw === "object" ? raw : {};
        const v = s.values && typeof s.values === "object" ? s.values : {};
        setStored(v);
        if (Array.isArray(s.connected)) {
          setItems((cur) => cur.map(it => ({ ...it, connected: s.connected.includes(it.id) })));
        }
      } catch {}
    })();
  }, []);

  const openSetup = (it: Item) => {
    setActive(it);
    const v = stored?.[it.id];
    setValues(v && typeof v === "object" ? v : {});
  };

  const save = async () => {
    if (!active) return;
    const newItems = items.map(x => x.id === active.id ? { ...x, connected: true } : x);
    const newStored = { ...stored, [active.id]: values };
    try {
      await adminApi.settings.update("integrations", {
        values: newStored,
        connected: newItems.filter(x => x.connected).map(x => x.id),
      });
      setItems(newItems);
      setStored(newStored);
      toast.success(L(`تم ربط ${active.name}`, `${active.name} connected`));
    } catch (e: any) { toast.error(e?.message || "Save failed"); }
    setActive(null);
  };

  const disconnect = async () => {
    if (!active) return;
    const newItems = items.map(x => x.id === active.id ? { ...x, connected: false } : x);
    try {
      await adminApi.settings.update("integrations", {
        values: stored,
        connected: newItems.filter(x => x.connected).map(x => x.id),
      });
      setItems(newItems);
      toast.success(L(`تم فصل ${active.name}`, `${active.name} disconnected`));
    } catch (e: any) { toast.error(e?.message || "Save failed"); }
    setActive(null);
  };

  return (
    <AdminLayout title={L("الإعدادات", "Settings")} subtitle={L("إدارة التكاملات والربط الخارجي", "Manage integrations and external connections")}>
      <PanelCard title={L("التكاملات", "Integrations")} subtitle={L("اربط أدواتك وخدماتك المفضلة", "Connect your favorite tools and services")}>
        <div className="space-y-3">
          {items.map(it => {
            const I = it.icon;
            return (
              <div key={it.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><I className="h-5 w-5" /></div>
                  <div className="min-w-0">
                    <div className="font-bold truncate">{it.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{it.desc}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-xs">
                    <span className={`h-2 w-2 rounded-full ${it.connected ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                    {it.connected ? L("متصل", "Connected") : L("غير متصل", "Not connected")}
                  </span>
                  <button onClick={() => openSetup(it)} className={`rounded-xl px-4 py-2 text-xs font-bold ${it.connected ? "bg-primary/10 text-primary" : "bg-primary text-primary-foreground"}`}>
                    {it.connected ? L("إدارة", "Manage") : L("إعداد", "Setup")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </PanelCard>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent dir={dir} className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {active && <active.icon className="h-5 w-5 text-primary" />}
              {L("ربط", "Connect")} {active?.name}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-2">
            {active?.desc}. {L("أدخل بيانات الربط الخاصة بحسابك.", "Enter your account credentials.")}
          </p>
          <div className="grid gap-3">
            {active?.fields.map(f => (
              <label key={f.key} className="text-xs font-bold space-y-1.5 block">
                {f.label}
                <input
                  type={f.type ?? "text"}
                  placeholder={f.placeholder}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal"
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                />
                {f.help && <span className="block text-[11px] font-normal text-muted-foreground">{f.help}</span>}
              </label>
            ))}
            {active?.docs && (
              <a href={active.docs} target="_blank" rel="noreferrer" className="text-[11px] text-primary font-bold">{L("عرض التوثيق ↗", "View docs ↗")}</a>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            {active?.connected && (
              <button onClick={disconnect} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-bold text-rose-600 hover:bg-rose-100">
                <Trash2 className="h-4 w-4" /> {L("فصل الاتصال", "Disconnect")}
              </button>
            )}
            <GhostButton onClick={() => setActive(null)}>{L("إلغاء", "Cancel")}</GhostButton>
            <PrimaryButton onClick={save}>{active?.connected ? L("تحديث", "Update") : L("ربط", "Connect")}</PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
