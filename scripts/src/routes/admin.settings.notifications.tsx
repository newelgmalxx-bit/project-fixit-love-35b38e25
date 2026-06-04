import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout, PanelCard, PrimaryButton } from "@/components/admin/AdminLayout";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageProvider";
import { admin as adminApi } from "@/lib/api";

export const Route = createFileRoute("/admin/settings/notifications")({
  head: () => ({ meta: [{ title: "Notifications | Settings" }] }),
  component: NotificationsPage,
});

type Channel = { email: boolean; sms: boolean; push: boolean };
type Item = { key: string; label: string; desc: string; ch: Channel };

function NotificationsPage() {
  const { lang, dir } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);
  const initial: Item[] = [
    { key: "new_order", label: L("طلب جديد", "New Order"), desc: L("عند استلام حجز جديد", "When a new booking is received"), ch: { email: true, sms: true, push: true } },
    { key: "payment_received", label: L("تأكيد دفع", "Payment Received"), desc: L("عند استلام دفعة من العميل", "When a client payment is received"), ch: { email: true, sms: false, push: true } },
    { key: "order_completed", label: L("اكتمال طلب", "Order Completed"), desc: L("عند تحديث حالة الطلب إلى مكتمل", "When an order is marked complete"), ch: { email: true, sms: false, push: false } },
    { key: "new_client", label: L("عميل جديد", "New Client"), desc: L("عند تسجيل عميل جديد", "When a new client signs up"), ch: { email: false, sms: false, push: true } },
    { key: "ticket", label: L("تذكرة دعم", "Support Ticket"), desc: L("عند إنشاء تذكرة دعم جديدة", "When a new support ticket is created"), ch: { email: true, sms: false, push: true } },
    { key: "invoice_overdue", label: L("فاتورة متأخرة", "Invoice Overdue"), desc: L("عند تأخر فاتورة عن السداد", "When an invoice is overdue"), ch: { email: true, sms: true, push: true } },
    { key: "weekly_report", label: L("تقرير أسبوعي", "Weekly Report"), desc: L("ملخّص الأداء كل يوم أحد", "Performance summary every Sunday"), ch: { email: true, sms: false, push: false } },
    { key: "marketing", label: L("تحديثات وتسويق", "Updates & Marketing"), desc: L("أخبار وميزات جديدة", "News and new features"), ch: { email: false, sms: false, push: false } },
  ];
  const [items, setItems] = useState<Item[]>(initial);
  const [quiet, setQuiet] = useState({ enabled: false, from: "22:00", to: "07:00" });

  useEffect(() => {
    (async () => {
      try {
        const s = await adminApi.settings.get<any>("notifications");
        if (s?.items?.length) setItems((cur) => cur.map((i) => ({ ...i, ch: s.items.find((x: any) => x.key === i.key)?.ch || i.ch })));
        if (s?.quiet) setQuiet(s.quiet);
      } catch {}
    })();
  }, []);

  const save = async () => {
    try { await adminApi.settings.update("notifications", { items: items.map(i => ({ key: i.key, ch: i.ch })), quiet }); toast.success(L("تم حفظ التفضيلات", "Preferences saved")); }
    catch (e: any) { toast.error(e?.message || "Save failed"); }
  };

  const toggle = (key: string, ch: keyof Channel) =>
    setItems(items.map(i => i.key === key ? { ...i, ch: { ...i.ch, [ch]: !i.ch[ch] } } : i));

  const knobOn = dir === "rtl" ? "right-0.5" : "left-0.5";
  const knobOff = dir === "rtl" ? "right-5" : "left-5";
  const textAlign = dir === "rtl" ? "text-right" : "text-left";

  return (
    <AdminLayout title={L("الإعدادات", "Settings")} subtitle={L("تفضيلات الإشعارات", "Notification preferences")} action={<PrimaryButton onClick={save}>{L("حفظ", "Save")}</PrimaryButton>}>
      <PanelCard title={L("قنوات الإشعارات", "Notification Channels")} subtitle={L("اختر القنوات لكل نوع تنبيه", "Choose channels for each alert")} className="mb-6">
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className={`${textAlign} text-xs text-muted-foreground border-b border-border`}>
                <th className="px-3 py-3 font-medium">{L("النوع", "Type")}</th>
                <th className="px-3 py-3 font-medium text-center">{L("بريد", "Email")}</th>
                <th className="px-3 py-3 font-medium text-center">SMS</th>
                <th className="px-3 py-3 font-medium text-center">{L("إشعار فوري", "Push")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map(i => (
                <tr key={i.key} className="border-b border-border">
                  <td className="px-3 py-3">
                    <div className="font-bold">{i.label}</div>
                    <div className="text-[11px] text-muted-foreground">{i.desc}</div>
                  </td>
                  {(["email", "sms", "push"] as const).map(c => (
                    <td key={c} className="px-3 py-3 text-center">
                      <button onClick={() => toggle(i.key, c)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${i.ch[c] ? "bg-primary" : "bg-muted"}`}>
                        <span className={`absolute inline-block h-5 w-5 rounded-full bg-white shadow transition ${i.ch[c] ? knobOn : knobOff}`} />
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelCard>

      <PanelCard title={L("ساعات الهدوء", "Quiet Hours")} subtitle={L("إيقاف الإشعارات خلال فترة محددة", "Pause notifications during a window")}>
        <div className="grid gap-3 sm:grid-cols-3 items-end">
          <label className="flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" className="h-4 w-4" checked={quiet.enabled} onChange={e => setQuiet({ ...quiet, enabled: e.target.checked })} />
            {L("تفعيل", "Enable")}
          </label>
          <Lb label={L("من", "From")}><input type="time" className={ic} value={quiet.from} onChange={e => setQuiet({ ...quiet, from: e.target.value })} /></Lb>
          <Lb label={L("إلى", "To")}><input type="time" className={ic} value={quiet.to} onChange={e => setQuiet({ ...quiet, to: e.target.value })} /></Lb>
        </div>
      </PanelCard>
    </AdminLayout>
  );
}
const ic = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
function Lb({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="text-xs font-bold space-y-1.5 block">{label}{children}</label>;
}
