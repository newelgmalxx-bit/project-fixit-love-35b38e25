import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LifeBuoy, Eye, Loader2, MessageCircle, Clock, CheckCircle2, Search } from "lucide-react";
import { AdminLayout, PanelCard, Pill } from "@/components/admin/AdminLayout";
import { useLang } from "@/i18n/LanguageProvider";
import { admin } from "@/lib/api";
import { normalizeTicket } from "@/lib/api/normalize";
import type { Ticket } from "@/data/account";

export const Route = createFileRoute("/admin/tickets/")({
  head: () => ({ meta: [{ title: "Tickets | Admin" }] }),
  component: AdminTicketsList,
});

const statusTone: Record<string, { tone: "amber" | "primary" | "emerald"; icon: any; ar: string; en: string }> = {
  open: { tone: "amber", icon: Clock, ar: "مفتوحة", en: "Open" },
  answered: { tone: "primary", icon: MessageCircle, ar: "تم الرد", en: "Answered" },
  closed: { tone: "emerald", icon: CheckCircle2, ar: "مغلقة", en: "Closed" },
};

const priorityTone: Record<string, { tone: "rose" | "amber" | "emerald"; ar: string; en: string }> = {
  high: { tone: "rose", ar: "عالية", en: "High" },
  normal: { tone: "amber", ar: "عادية", en: "Normal" },
  low: { tone: "emerald", ar: "منخفضة", en: "Low" },
};

function AdminTicketsList() {
  const { lang } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    admin.tickets.list({ limit: 100, status: statusFilter || undefined })
      .then((res) => { if (!alive) return; const arr = (res.items || []).map(normalizeTicket); setTickets(arr); })
      .catch(() => { if (alive) setTickets([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [statusFilter]);

  const filtered = tickets.filter((tk) =>
    !q.trim() || (tk.subject || "").toLowerCase().includes(q.toLowerCase()) || (tk.number || "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <AdminLayout title={L("التذاكر", "Tickets")} subtitle={L("إدارة تذاكر دعم العملاء", "Manage customer support tickets")}>
      <PanelCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={L("ابحث بالرقم أو الموضوع...", "Search by number or subject...")}
              className="w-full rounded-lg border border-border bg-background ltr:pl-9 rtl:pr-9 px-3 py-2 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">{L("كل الحالات", "All statuses")}</option>
            <option value="open">{L("مفتوحة", "Open")}</option>
            <option value="answered">{L("تم الرد", "Answered")}</option>
            <option value="closed">{L("مغلقة", "Closed")}</option>
          </select>
        </div>

        {loading ? (
          <div className="py-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <LifeBuoy className="mx-auto h-10 w-10 mb-2" />
            {L("لا توجد تذاكر", "No tickets found")}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border text-start">
                  <th className="px-3 py-3 font-medium text-start">#</th>
                  <th className="px-3 py-3 font-medium text-start">{L("الموضوع", "Subject")}</th>
                  <th className="px-3 py-3 font-medium text-start">{L("الأولوية", "Priority")}</th>
                  <th className="px-3 py-3 font-medium text-start">{L("الحالة", "Status")}</th>
                  <th className="px-3 py-3 font-medium text-start">{L("الرسائل", "Messages")}</th>
                  <th className="px-3 py-3 font-medium text-start">{L("التاريخ", "Date")}</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tk) => {
                  const s = statusTone[tk.status] ?? statusTone.open;
                  const p = priorityTone[tk.priority] ?? priorityTone.normal;
                  const Icon = s.icon;
                  return (
                    <tr key={tk.id} className="border-b border-border hover:bg-muted/40">
                      <td className="px-3 py-3 text-xs text-muted-foreground" dir="ltr">#{tk.number}</td>
                      <td className="px-3 py-3 font-bold line-clamp-1">{tk.subject}</td>
                      <td className="px-3 py-3"><Pill tone={p.tone}>{L(p.ar, p.en)}</Pill></td>
                      <td className="px-3 py-3"><Pill tone={s.tone}><Icon className="h-3 w-3" /> {L(s.ar, s.en)}</Pill></td>
                      <td className="px-3 py-3 text-xs text-muted-foreground" data-ltr-number>{tk.messages?.length ?? 0}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground" data-ltr-number>{tk.createdAt}</td>
                      <td className="px-3 py-3">
                        <Link
                          to="/admin/tickets/$ticketId"
                          params={{ ticketId: tk.id }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </PanelCard>
    </AdminLayout>
  );
}