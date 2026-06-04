import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LifeBuoy, Plus, MessageCircle, Clock, CheckCircle2, Eye, Loader2 } from "lucide-react";
import { AccountLayout } from "@/components/account/AccountLayout";
import type { Ticket } from "@/data/account";
import { useLang } from "@/i18n/LanguageProvider";
import type { TKey } from "@/i18n/translations";
import { account } from "@/lib/api";
import { normalizeTicket } from "@/lib/api/normalize";

export const Route = createFileRoute("/account/tickets/")({
  head: () => ({ meta: [{ title: "Support Tickets | koswmat" }] }),
  component: TicketsList,
});

const statusMap: Record<string, { color: string; icon: any; key: TKey }> = {
  open: { color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock, key: "ticket.status.open" },
  answered: { color: "bg-sky-100 text-sky-700 border-sky-200", icon: MessageCircle, key: "ticket.status.answered" },
  closed: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2, key: "ticket.status.closed" },
} as const;

function TicketsList() {
  const { t } = useLang();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    account.listTickets({ limit: 50 })
      .then(async (res) => {
        if (!alive) return;
        const list = (res.items || []).map(normalizeTicket);
        setTickets(list);
        setLoading(false);
        // Hydrate real message counts from detail endpoint (list returns empty messages)
        const detailed = await Promise.all(
          list.map(async (tk: Ticket) => {
            try {
              const d: any = await account.getTicket(tk.id);
              const msgs = d?.ticket?.messages || d?.messages || [];
              return { ...tk, messages: msgs.map((m: any) => ({
                id: String(m.id),
                from: m.from_type === "support" ? "support" : "client",
                author: m.authorName || m.author || "",
                text: m.text || "",
                at: m.created_at || m.at || "",
              })) };
            } catch { return tk; }
          })
        );
        if (alive) setTickets(detailed);
      })
      .catch(() => { if (alive) { setTickets([]); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  return (
    <AccountLayout title={t("account.tickets.title")} subtitle={t("account.tickets.subtitle")}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground"><span data-ltr-number>{tickets.length}</span> {t("account.tickets.totalTpl")}</p>
        <Link
          to={"/account/tickets/new" as any}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary-dark shadow-[0_8px_20px_-8px_rgba(0,174,198,0.55)]"
        >
          <Plus className="h-4 w-4" />
          {t("account.tickets.new")}
        </Link>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <LifeBuoy className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">{t("account.tickets.empty")}</p>
          </div>
        ) : (
          tickets.map((tk) => {
            const s = statusMap[tk.status];
            const Icon = s.icon;
            const msgs = tk.messages || [];
            const last = msgs[msgs.length - 1] || { author: "", text: "" };
            const msgCount = (tk as any).messages_count ?? (tk as any).messageCount ?? (tk as any).messagesCount ?? msgs.length;
            return (
              <Link
                key={tk.id}
                to="/account/tickets/$ticketId"
                params={{ ticketId: tk.id }}
                className="block rounded-2xl border border-border bg-card p-5 shadow-sm card-hover"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                      <LifeBuoy className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold line-clamp-1">{tk.subject}</h3>
                        <span className="text-xs text-muted-foreground" dir="ltr">#{tk.number}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                        <span className="font-bold">{last.author}:</span> {last.text}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span>{t("account.tickets.createdAt")} <span data-ltr-number>{tk.createdAt}</span></span>
                        <span>•</span>
                        {msgCount > 0 && (
                          <span><span data-ltr-number>{msgCount}</span> {t("account.tickets.messages")}</span>
                        )}
                        {tk.orderId && (
                          <>
                            <span>•</span>
                            <span>{t("account.tickets.linkedToOrder")}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${s.color}`}>
                      <Icon className="h-3 w-3" />
                      {t(s.key)}
                    </span>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Eye className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </AccountLayout>
  );
}