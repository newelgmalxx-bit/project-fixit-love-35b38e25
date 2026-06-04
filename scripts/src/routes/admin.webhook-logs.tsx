import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout, PanelCard, Pill, GhostButton } from "@/components/admin/AdminLayout";
import { admin } from "@/lib/api";
import { useLang } from "@/i18n/LanguageProvider";
import { toast } from "sonner";
import { Loader2, Trash2, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/admin/webhook-logs")({
  head: () => ({ meta: [{ title: "سجلات Webhook | الإدارة" }] }),
  component: WebhookLogsPage,
});

function WebhookLogsPage() {
  const { lang } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r: any = await admin.getWebhookLogs({ page: 1, limit: 100 });
      setItems(r?.data?.items ?? []);
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const view = async (id: string) => {
    try {
      const r: any = await admin.getWebhookLog(id);
      setSelected(r?.data ?? null);
    } catch (e: any) { toast.error(e?.message || "Failed"); }
  };

  const clearAll = async () => {
    if (!confirm(L("مسح كل السجلات؟", "Clear all logs?"))) return;
    try {
      await admin.clearWebhookLogs();
      toast.success(L("تم المسح", "Cleared"));
      setSelected(null);
      await load();
    } catch (e: any) { toast.error(e?.message || "Failed"); }
  };

  return (
    <AdminLayout
      title={L("سجلات Webhook", "Webhook logs")}
      subtitle={L("استلام أحداث المدفوعات والخدمات الخارجية", "Incoming events from payments and external services")}
      action={
        <div className="flex gap-2">
          <GhostButton onClick={load}><RefreshCw className="h-4 w-4" /> {L("تحديث", "Refresh")}</GhostButton>
          <GhostButton onClick={clearAll}><Trash2 className="h-4 w-4" /> {L("مسح الكل", "Clear all")}</GhostButton>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <PanelCard title={L("السجلات", "Logs")} className="lg:col-span-2">
          {loading ? (
            <div className="py-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{L("لا توجد سجلات", "No logs")}</p>
          ) : (
            <div className="divide-y divide-border">
              {items.map((it) => (
                <button key={it.id} onClick={() => view(it.id)}
                  className={`w-full text-start py-3 px-2 hover:bg-muted/40 rounded-lg flex items-center justify-between gap-2 ${selected?.id === it.id ? "bg-muted/60" : ""}`}>
                  <div>
                    <div className="text-sm font-bold">{it.eventType || "-"}</div>
                    <div className="text-xs text-muted-foreground" dir="ltr">{it.createdAt}</div>
                  </div>
                  <Pill tone="primary">{it.source}</Pill>
                </button>
              ))}
            </div>
          )}
        </PanelCard>

        <PanelCard title={L("التفاصيل", "Details")}>
          {selected ? (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground">ID</div>
              <div className="text-xs font-mono break-all">{selected.id}</div>
              <div className="text-xs text-muted-foreground">{L("النوع", "Event")}</div>
              <div className="text-sm font-bold">{selected.eventType}</div>
              <div className="text-xs text-muted-foreground">Payload</div>
              <pre dir="ltr" className="text-xs bg-muted/50 p-3 rounded-lg max-h-[480px] overflow-auto whitespace-pre-wrap break-all">
                {typeof selected.payload === "string" ? selected.payload : JSON.stringify(selected.payload, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">{L("اختر سجلاً لعرضه", "Pick a log to view")}</p>
          )}
        </PanelCard>
      </div>
    </AdminLayout>
  );
}
