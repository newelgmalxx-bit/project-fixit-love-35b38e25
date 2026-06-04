import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout, PanelCard, Pill, PrimaryButton, GhostButton } from "@/components/admin/AdminLayout";
import { Loader2, Inbox, Eye, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageProvider";
import { adminContactApi, type ContactMessage } from "@/lib/api/adminContact";

export const Route = createFileRoute("/admin/contact-messages")({
  head: () => ({ meta: [{ title: "رسائل التواصل | الإدارة" }] }),
  component: ContactPage,
});

function statusTone(s?: string): "amber" | "primary" | "emerald" | "muted" {
  const v = (s || "").toLowerCase();
  if (v === "new" || v === "unread") return "amber";
  if (v === "read") return "primary";
  if (v === "replied") return "emerald";
  return "muted";
}

const STATUS_OPTIONS = ["new", "read", "replied"];

function ContactPage() {
  const { lang, dir } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);
  const [items, setItems] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [viewing, setViewing] = useState<ContactMessage | null>(null);

  async function load(p = page) {
    setLoading(true);
    try {
      const data = await adminContactApi.list({ page: p, limit: 20 });
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || p);
    } catch (e: any) {
      toast.error(e?.message || L("تعذّر تحميل الرسائل", "Failed to load messages"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(1); /* eslint-disable-next-line */ }, []);

  return (
    <AdminLayout
      title={L("رسائل التواصل", "Contact messages")}
      subtitle={L("صندوق وارد رسائل نموذج التواصل", "Inbox for contact form messages")}
      action={<GhostButton onClick={() => load()}><RefreshCw className="h-4 w-4" /> {L("تحديث", "Refresh")}</GhostButton>}
    >
      <PanelCard>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className={`${dir === "rtl" ? "text-right" : "text-left"} text-xs text-muted-foreground border-b border-border`}>
                <th className="px-3 py-3 font-medium">{L("الاسم", "Name")}</th>
                <th className="px-3 py-3 font-medium">{L("البريد / الهاتف", "Email / Phone")}</th>
                <th className="px-3 py-3 font-medium">{L("الموضوع", "Subject")}</th>
                <th className="px-3 py-3 font-medium">{L("التاريخ", "Date")}</th>
                <th className="px-3 py-3 font-medium">{L("الحالة", "Status")}</th>
                <th className="px-3 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-3 py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-10 text-center text-xs text-muted-foreground">
                  <Inbox className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  {L("لا توجد رسائل", "No messages")}
                </td></tr>
              ) : items.map((m) => (
                <tr key={m.id} className="border-b border-border hover:bg-muted/40">
                  <td className="px-3 py-3 font-bold">{m.name || "—"}</td>
                  <td className="px-3 py-3 text-xs" dir="ltr">{m.email || m.phone || "—"}</td>
                  <td className="px-3 py-3 text-xs truncate max-w-[260px]">{m.subject || "—"}</td>
                  <td className="px-3 py-3 text-xs" dir="ltr">{m.createdAt ? new Date(m.createdAt).toLocaleString() : "—"}</td>
                  <td className="px-3 py-3"><Pill tone={statusTone(m.status)}>{m.status || "new"}</Pill></td>
                  <td className="px-3 py-3">
                    <button onClick={() => setViewing(m)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted text-primary">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
          <div className="text-xs text-muted-foreground" data-ltr-number>
            {L(`${total} رسالة · صفحة ${page}/${totalPages}`, `${total} messages · page ${page}/${totalPages}`)}
          </div>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1 || loading} onClick={() => load(page - 1)}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-3 text-xs font-bold disabled:opacity-40">
              <ChevronRight className="h-3.5 w-3.5 rtl:hidden" />
              <ChevronLeft className="h-3.5 w-3.5 ltr:hidden" />
              {L("السابق", "Prev")}
            </button>
            <button disabled={page >= totalPages || loading} onClick={() => load(page + 1)}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-3 text-xs font-bold disabled:opacity-40">
              {L("التالي", "Next")}
              <ChevronLeft className="h-3.5 w-3.5 rtl:hidden" />
              <ChevronRight className="h-3.5 w-3.5 ltr:hidden" />
            </button>
          </div>
        </div>
      </PanelCard>

      <MessageModal
        message={viewing}
        onClose={() => setViewing(null)}
        onUpdated={() => { load(); }}
      />
    </AdminLayout>
  );
}

function MessageModal({ message, onClose, onUpdated }: { message: ContactMessage | null; onClose: () => void; onUpdated: () => void }) {
  const { lang, dir } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);
  const [status, setStatus] = useState("new");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (message) {
      setStatus(message.status || "new");
      setNote(message.internalNote || "");
    }
  }, [message]);

  if (!message) return null;

  async function save() {
    if (!message) return;
    setBusy(true);
    try {
      await adminContactApi.update(message.id, { status, internalNote: note });
      toast.success(L("تم الحفظ", "Saved"));
      onUpdated();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || L("فشل الحفظ", "Save failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!message} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir={dir} className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{L("تفاصيل الرسالة", "Message details")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <Info label={L("الاسم", "Name")}>{message.name || "—"}</Info>
            <Info label={L("البريد", "Email")}><span dir="ltr">{message.email || "—"}</span></Info>
            <Info label={L("الهاتف", "Phone")}><span dir="ltr">{message.phone || "—"}</span></Info>
            <Info label={L("التاريخ", "Date")}>
              <span dir="ltr">{message.createdAt ? new Date(message.createdAt).toLocaleString() : "—"}</span>
            </Info>
          </div>
          <Info label={L("الموضوع", "Subject")}>{message.subject || "—"}</Info>
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="text-[10px] font-bold text-muted-foreground">{L("الرسالة", "Message")}</div>
            <div className="mt-2 whitespace-pre-wrap text-sm leading-7">{message.message || "—"}</div>
          </div>

          <label className="block">
            <div className="text-xs font-bold">{L("الحالة", "Status")}</div>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="block">
            <div className="text-xs font-bold">{L("ملاحظة داخلية", "Internal note")}</div>
            <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          </label>
        </div>
        <DialogFooter className="gap-2">
          <GhostButton onClick={onClose}>{L("إغلاق", "Close")}</GhostButton>
          <PrimaryButton onClick={save}>{busy ? L("جارٍ...", "Saving...") : L("حفظ", "Save")}</PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2">
      <div className="text-[10px] font-bold text-muted-foreground">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}
