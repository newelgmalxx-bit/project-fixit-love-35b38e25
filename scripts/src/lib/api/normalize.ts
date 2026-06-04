import type { Order as ApiOrder, Ticket as ApiTicket, OrderItem } from "./types";
import type { Order as UiOrder, Ticket as UiTicket, TicketMessage as UiTicketMessage, OrderStatus, PaymentMethod, CartItem } from "@/data/account";

export function normalizeOrder(o: ApiOrder): UiOrder {
  const items: CartItem[] = (o.items || []).map((l: OrderItem) => ({
    id: String(l.id),
    serviceSlug: l.service_slug,
    serviceTitle: l.service_title,
    planName: l.plan_name ?? "",
    price: Number(l.price) || 0,
    qty: Number(l.qty) || 1,
  }));
  const ps = String((o as any).payment_status ?? (o as any).paymentStatus ?? "").toLowerCase();
  const paid = !!(o as any).paid
    || ps === "paid"
    || ps === "completed"
    || ps === "success"
    || (o.status as string) === "completed";
  const paymentStatus: "unpaid" | "paid" | "refunded" =
    ps === "paid" || ps === "completed" || ps === "success" || paid
      ? "paid"
      : ps === "refunded"
      ? "refunded"
      : "unpaid";
  const inv = (o as any).invoice ?? null;
  return {
    id: o.id,
    number: o.number,
    createdAt: (((o as any).createdAt || (o as any).created_at) || "").slice(0, 10),
    status: (o.status as OrderStatus) || "pending",
    payment: (o.payment_method as PaymentMethod) || "cod",
    paid,
    paymentStatus,
    invoice: inv
      ? {
          id: String(inv.id),
          number: String(inv.number ?? inv.invoice_number ?? ""),
          status: String(inv.status ?? "pending"),
          total: Number(inv.total) || 0,
        }
      : null,
    items,
    subtotal: Number(o.subtotal) || 0,
    vat: Number(o.vat) || 0,
    total: Number(o.total) || 0,
    notes: o.notes ?? undefined,
    timeline: (o.timeline || []).map((t) => ({
      status: (t.status as OrderStatus),
      at: t.at,
      note: t.note ?? undefined,
    })),
  };
}

export function normalizeTicket(t: ApiTicket): UiTicket {
  const messages: UiTicketMessage[] = (t.messages || []).map((m) => ({
    id: m.id,
    from: m.from_type === "support" ? "support" : "client",
    author: m.author,
    text: m.text,
    at: m.at,
  }));
  return {
    id: t.id,
    number: t.number,
    subject: t.subject,
    orderId: t.orderId ?? undefined,
    status: t.status,
    priority: t.priority,
    createdAt: (((t as any).createdAt || (t as any).created_at) || "").slice(0, 10),
    messages,
  };
}