import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Send, LifeBuoy, Loader2, CheckCircle2 } from "lucide-react";
import { AdminLayout, PanelCard, Pill, GhostButton } from "@/components/admin/AdminLayout";
import { useLang } from "@/i18n/LanguageProvider";
import { admin } from "@/lib/api";
import { normalizeTicket } from "@/lib/api/normalize";
import type { Ticket, TicketMessage } from "@/data/account";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/tickets/$ticketId")({
  head: () => ({ meta: [{ title: "Ticket | Admin" }] }),
  errorComponent: ({ error }) => (
    <AdminLayout title="Error"><PanelCard><p className="text-sm text-muted-foreground p-6">{error.message}</p></PanelCard></AdminLayout>
  ),
  notFoundComponent: () => (
    <AdminLayout title="Not found"><PanelCard><p className="text-sm text-muted-foreground p-6">Ticket not found</p></PanelCard></AdminLayout>
  ),
  component: AdminTicketDetail,
});

function AdminTicketDetail() {
  const { lang, dir } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);
  const { ticketId } = Route.useParams();
  const [tk, setTk] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const fallback = (): Ticket | null => {
    try {
      const r = localStorage.getItem("demo_admin_tickets");
      const list: Ticket[] = r ? JSON.parse(r) : [];
      return list.find((t) => t.id === ticketId) || list[0] || null;
    } catch { return null; }
  };

  const reload = async () => {
    try {
      const fresh = await admin.tickets.get(ticketId);
      const norm = normalizeTicket(fresh);
      setTk(norm);
      setMessages(norm.messages || []);
    } catch {
      const f = fallback();
      if (f) { setTk(f); setMessages(f.messages || []); }
    }
  };

  useEffect(() => {
    let alive = true;
    setLoading(true);
    admin.tickets.get(ticketId)
      .then((t) => { if (!alive) return; const n = normalizeTicket(t); setTk(n); setMessages(n.messages || []); })
      .catch(() => { if (!alive) return; const f = fallback(); if (f) { setTk(f); setMessages(f.messages || []); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [ticketId]);

  const send = async () => {
    if (!text.trim() || !tk) return;
    const body = text.trim();
    setText(""); setSending(true);
    try {
      await admin.tickets.reply(tk.id, body);
      await reload();
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally { setSending(false); }
  };

  const close = async () => {
    if (!tk) return;
    try {
      await admin.tickets.setStatus(tk.id, "closed");
      toast.success(L("تم إغلاق التذكرة", "Ticket closed"));
      await reload();
    } catch (e: any) { toast.error(e?.message || "Failed"); }
  };

  if (loading) {
    return (
      <AdminLayout title={L("تذكرة", "Ticket")}>
        <PanelCard><div className="py-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></div></PanelCard>
      </AdminLayout>
    );
  }
  if (!tk) return (
    <AdminLayout title={L("تذكرة", "Ticket")}>
      <PanelCard><p className="text-sm text-muted-foreground p-6 text-center">{L("التذكرة غير موجودة", "Ticket not found")}</p></PanelCard>
    </AdminLayout>
  );

  const statusTone = tk.status === "closed" ? "emerald" : tk.status === "answered" ? "primary" : "amber";
  // priority is now editable via select; tone removed

  return (
    <AdminLayout title={tk.subject} subtitle={`#${tk.number}`} action={
      tk.status !== "closed" ? (
        <GhostButton onClick={close}><CheckCircle2 className="h-4 w-4" /> {L("إغلاق التذكرة", "Close ticket")}</GhostButton>
      ) : undefined
    }>
      <Link to={"/admin/tickets" as any} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
        <ChevronLeft className={`h-4 w-4 ${dir === "ltr" ? "rotate-180" : ""}`} />
        {L("كل التذاكر", "All tickets")}
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <PanelCard>
          <div className="flex items-center gap-3 border-b border-border pb-4 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <LifeBuoy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">{L("المحادثة", "Conversation")}</h3>
              <p className="text-xs text-muted-foreground"><span data-ltr-number>{messages.length}</span> {L("رسالة", "messages")}</p>
            </div>
          </div>

          <div className="max-h-[500px] space-y-4 overflow-auto">
            {messages.map((m) => {
              const isSupport = m.from === "support";
              return (
                <div key={m.id} className={`flex gap-3 ${isSupport ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isSupport ? "bg-primary text-primary-foreground" : "bg-amber-100 text-amber-700"
                  }`}>
                    {(m.author || "?").charAt(0)}
                  </div>
                  <div className={`max-w-[75%] flex flex-col ${isSupport ? "items-end" : "items-start"}`}>
                    <div className="mb-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="font-bold text-foreground">{m.author || "—"}</span>
                      <span>•</span>
                      <span data-ltr-number>{m.at}</span>
                    </div>
                    <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      isSupport ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    }`}>{m.text}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {tk.status !== "closed" ? (
            <div className="border-t border-border pt-4 mt-4">
              <div className="flex items-end gap-2">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={2}
                  placeholder={L("اكتب ردك...", "Type your reply...")}
                  className="flex-1 rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
                <button
                  onClick={send}
                  disabled={!text.trim() || sending}
                  className="flex h-11 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary-dark disabled:opacity-40"
                >
                  <Send className="h-4 w-4" /> {L("إرسال", "Send")}
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t border-border bg-muted/40 mt-4 -mx-6 -mb-6 px-6 py-3 text-center text-xs text-muted-foreground rounded-b-2xl">
              {L("هذه التذكرة مغلقة", "This ticket is closed")}
            </div>
          )}
        </PanelCard>

        <aside className="space-y-4">
          <PanelCard>
            <h3 className="text-sm font-bold mb-3">{L("معلومات التذكرة", "Ticket info")}</h3>
            <dl className="space-y-3 text-sm">
              <Row label={L("الرقم", "Number")}><span dir="ltr" className="font-medium">#{tk.number}</span></Row>
              <Row label={L("التاريخ", "Date")}><span dir="ltr" className="font-medium">{tk.createdAt}</span></Row>
              <Row label={L("الأولوية", "Priority")}>
                <select
                  value={tk.priority || "medium"}
                  onChange={async (e) => {
                    const next = e.target.value;
                    try {
                      await admin.tickets.setPriority(tk.id, next);
                      toast.success(L("تم تحديث الأولوية", "Priority updated"));
                      await reload();
                    } catch (err: any) { toast.error(err?.message || "Failed"); }
                  }}
                  className="rounded-md border border-border bg-card px-2 py-1 text-xs font-bold"
                >
                  <option value="low">{L("منخفضة", "Low")}</option>
                  <option value="medium">{L("متوسطة", "Medium")}</option>
                  <option value="high">{L("عالية", "High")}</option>
                  <option value="urgent">{L("عاجلة", "Urgent")}</option>
                </select>
              </Row>
              <Row label={L("الحالة", "Status")}><Pill tone={statusTone}>{tk.status}</Pill></Row>
              {tk.orderId && <Row label={L("الطلب المرتبط", "Linked order")}><span dir="ltr">#{tk.orderId}</span></Row>}
            </dl>
          </PanelCard>
        </aside>
      </div>
    </AdminLayout>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between"><dt className="text-muted-foreground">{label}</dt><dd>{children}</dd></div>;
}