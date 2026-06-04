import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout, StatCard, PanelCard, Pill, PrimaryButton } from "@/components/admin/AdminLayout";
import { ShoppingCart, DollarSign, Package, Users, Search, Eye, Mail, ChevronLeft, ChevronRight, Loader2, Inbox } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { fmtSAR } from "@/data/admin";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageProvider";
import { admin as adminApi } from "@/lib/api";

export const Route = createFileRoute("/admin/abandoned-carts")({
  head: () => ({ meta: [{ title: "Abandoned Carts | Admin" }] }),
  component: AbandonedCartsPage,
});

type Item = {
  serviceTitle?: string;
  planName?: string | null;
  qty: number;
  price: number;
  lineTotal?: number;
  vendorName?: string;
  vendorCity?: string;
  bookingDate?: string;
  bookingTime?: string;
  depositAmount?: number;
  remainingAmount?: number;
  depositPct?: number;
  offerId?: string;
};
type Cart = {
  cart_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  item_count: number;
  total_qty: number;
  subtotal: number;
  updatedAt?: string;
  updated_at?: string;
  items: Item[];
};

function AbandonedCartsPage() {
  const { lang, dir } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);

  const [carts, setCarts] = useState<Cart[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewing, setViewing] = useState<Cart | null>(null);
  const [sending, setSending] = useState<Record<string, boolean>>({});

  const load = useCallback(async (p = page, q = search) => {
    setLoading(true);
    try {
      const res: any = await adminApi.getAbandonedCarts({ page: p, limit: 20, search: q || undefined });
      const payload = res?.data && typeof res.data === "object" && !Array.isArray(res.data) ? res.data : res;
      const data: Cart[] = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
      setCarts(data);
      setTotal(Number(payload?.total) || data.length);
      setTotalPages(Number(payload?.totalPages) || 1);
    } catch (e: any) {
      console.error("Failed to load abandoned carts", e);
      setCarts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, L]);

  useEffect(() => { load(page, search); /* eslint-disable-next-line */ }, [page]);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(1, search); }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [search]);

  const sendReminder = async (cart: Cart) => {
    setSending((s) => ({ ...s, [cart.cart_id]: true }));
    try {
      const res: any = await adminApi.remindAbandonedCart(cart.cart_id);
      toast.success(res?.message || L("تم إرسال التذكير بنجاح ✅", "Reminder sent ✅"));
    } catch (e: any) {
      toast.error(e?.message || L("فشل إرسال التذكير", "Failed to send reminder"));
    } finally {
      setSending((s) => ({ ...s, [cart.cart_id]: false }));
    }
  };

  // Stats: prefer values across current page; if total provided use it for count
  const totalCarts = total || carts.length;
  const sumValue = carts.reduce((a, c) => a + (Number(c.subtotal) || 0), 0);
  const sumItems = carts.reduce((a, c) => a + (Number(c.item_count) || 0), 0);
  const uniqueUsers = new Set(carts.map((c) => (c.customer_email || c.customer_phone || c.cart_id).toLowerCase())).size;

  const startSide = dir === "rtl" ? "right-3" : "left-3";
  const padStart = dir === "rtl" ? "pr-10 pl-3" : "pl-10 pr-3";
  const textAlign = dir === "rtl" ? "text-right" : "text-left";

  const fmtDate = (s: string) => {
    if (!s) return "—";
    const d = new Date(s.replace(" ", "T"));
    if (isNaN(d.getTime())) return s;
    return d.toLocaleString(lang === "en" ? "en-US" : "ar-EG", { dateStyle: "short", timeStyle: "short" });
  };

  return (
    <AdminLayout
      title={L("السلات المتروكة", "Abandoned Carts")}
      subtitle={L("تابع السلات غير المكتملة وأرسل تذكيرات للعملاء", "Track incomplete carts and send reminders")}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label={L("إجمالي السلات المتروكة", "Total Abandoned Carts")} value={totalCarts} icon={ShoppingCart} accent="primary" />
        <StatCard label={L("إجمالي القيمة الإجمالية", "Total Value")} value={fmtSAR(sumValue)} icon={DollarSign} accent="emerald" />
        <StatCard label={L("إجمالي المنتجات", "Total Products")} value={sumItems} icon={Package} accent="amber" />
        <StatCard label={L("عدد المستخدمين الفريدين", "Unique Users")} value={uniqueUsers} icon={Users} accent="violet" />
      </div>

      <PanelCard>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className={`absolute ${startSide} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={L("ابحث في الجدول...", "Search...")}
              className={`w-full rounded-xl border border-border bg-background ${padStart} py-2.5 text-sm`}
            />
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground">
            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
          </div>
        ) : carts.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <div className="mt-3 text-sm text-muted-foreground">{L("لا توجد سلات متروكة حتى الآن", "No abandoned carts yet")}</div>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className={`${textAlign} text-xs text-muted-foreground border-b border-border`}>
                  <th className="px-3 py-3 font-medium w-8"><input type="checkbox" /></th>
                  <th className="px-3 py-3 font-medium">{L("العميل", "Customer")}</th>
                  <th className="px-3 py-3 font-medium">{L("رقم الجوال", "Phone")}</th>
                  <th className="px-3 py-3 font-medium">{L("الإيميل", "Email")}</th>
                  <th className="px-3 py-3 font-medium">{L("الحجز", "Booking")}</th>
                  <th className="px-3 py-3 font-medium">{L("تاريخ ووقت", "Date & Time")}</th>
                  <th className="px-3 py-3 font-medium">{L("الكمية", "Qty")}</th>
                  <th className="px-3 py-3 font-medium">{L("إجمالي القيمة", "Total")}</th>
                  <th className="px-3 py-3 font-medium">{L("آخر تحديث", "Last Update")}</th>
                  <th className="px-3 py-3 font-medium">{L("الإجراءات", "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {carts.map((c) => {
                  const initials = (c.customer_name || "?").trim().charAt(0).toUpperCase();
                  const firstItem = c.items?.[0];
                  const extra = (c.items?.length || 0) - 1;
                  return (
                    <tr key={c.cart_id} className="border-b border-border hover:bg-muted/40">
                      <td className="px-3 py-3"><input type="checkbox" /></td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">{initials}</div>
                          <div>
                            <div className="font-bold">{c.customer_name || "—"}</div>
                            <div className="text-[11px] text-muted-foreground">{c.customer_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground" dir="ltr">{c.customer_phone || "—"}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{c.customer_email || "—"}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{firstItem?.serviceTitle || "—"}</span>
                          {firstItem?.vendorName && (
                            <span className="text-[11px] text-muted-foreground">{firstItem.vendorName}</span>
                          )}
                          {extra > 0 && (
                            <span className="mt-1 inline-block w-fit rounded-full bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5">
                              +{extra} {L("أخرى", "more")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs" data-ltr-number>
                        {firstItem?.bookingDate ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{firstItem.bookingDate}</span>
                            <span className="text-muted-foreground">{firstItem.bookingTime || "—"}</span>
                          </div>
                        ) : "—"}
                      </td>
                      <td className="px-3 py-3"><Pill tone="primary">{c.total_qty || c.item_count}</Pill></td>
                      <td className="px-3 py-3 font-bold text-primary" data-ltr-number>{fmtSAR(c.subtotal)}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground" data-ltr-number>{fmtDate(c.updatedAt || c.updated_at || "")}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewing(c)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted text-foreground/70"
                            title={L("عرض", "View")}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => sendReminder(c)}
                            disabled={!!sending[c.cart_id]}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary disabled:opacity-60"
                            title={L("إرسال تذكير", "Send reminder")}
                          >
                            {sending[c.cart_id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground">
              {L(`صفحة ${page} من ${totalPages}`, `Page ${page} of ${totalPages}`)}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-40"
              >
                {dir === "rtl" ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-40"
              >
                {dir === "rtl" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}
      </PanelCard>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-2xl" dir={dir}>
          <DialogHeader>
            <DialogTitle>{L("تفاصيل السلة", "Cart Details")}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-muted/30 p-4 grid sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-[11px] text-muted-foreground">{L("العميل", "Customer")}</div>
                  <div className="font-bold">{viewing.customer_name}</div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">{L("الإيميل", "Email")}</div>
                  <div>{viewing.customer_email || "—"}</div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">{L("الجوال", "Phone")}</div>
                  <div dir="ltr">{viewing.customer_phone || "—"}</div>
                </div>
              </div>

              <div className="space-y-3">
                {viewing.items?.map((it, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-foreground">{it.serviceTitle || "—"}</div>
                        {(it.vendorName || it.vendorCity) && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {it.vendorName}{it.vendorCity ? ` · ${it.vendorCity}` : ""}
                          </div>
                        )}
                      </div>
                      <div className="text-end">
                        <div className="text-xs text-muted-foreground">{L("الإجمالي", "Total")}</div>
                        <div className="font-bold text-primary" data-ltr-number>
                          {fmtSAR((Number(it.lineTotal) || (Number(it.price) || 0) * (Number(it.qty) || 0)))}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="rounded-lg bg-muted/40 p-2">
                        <div className="text-[10px] text-muted-foreground">{L("التاريخ", "Date")}</div>
                        <div className="font-bold text-foreground" data-ltr-number>{it.bookingDate || "—"}</div>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-2">
                        <div className="text-[10px] text-muted-foreground">{L("الوقت", "Time")}</div>
                        <div className="font-bold text-foreground" data-ltr-number>{it.bookingTime || "—"}</div>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-2">
                        <div className="text-[10px] text-muted-foreground">{L("الكمية", "Qty")}</div>
                        <div className="font-bold text-foreground" data-ltr-number>{it.qty}</div>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-2">
                        <div className="text-[10px] text-muted-foreground">{L("سعر الوحدة", "Unit")}</div>
                        <div className="font-bold text-foreground" data-ltr-number>{fmtSAR(it.price)}</div>
                      </div>
                      {typeof it.depositAmount === "number" && (
                        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2">
                          <div className="text-[10px] text-muted-foreground">
                            {L(`العربون${it.depositPct ? ` (${it.depositPct}%)` : ""}`, `Deposit${it.depositPct ? ` (${it.depositPct}%)` : ""}`)}
                          </div>
                          <div className="font-bold text-emerald-700 dark:text-emerald-400" data-ltr-number>{fmtSAR(it.depositAmount)}</div>
                        </div>
                      )}
                      {typeof it.remainingAmount === "number" && (
                        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-2">
                          <div className="text-[10px] text-muted-foreground">{L("المتبقي عند الحضور", "Remaining")}</div>
                          <div className="font-bold text-amber-700 dark:text-amber-400" data-ltr-number>{fmtSAR(it.remainingAmount)}</div>
                        </div>
                      )}
                      {it.offerId && (
                        <div className="rounded-lg bg-muted/40 p-2 col-span-2">
                          <div className="text-[10px] text-muted-foreground">{L("رمز العرض", "Offer ID")}</div>
                          <div className="font-bold text-foreground" data-ltr-number>{it.offerId}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center rounded-xl bg-primary/5 border border-primary/20 p-3">
                  <span className="font-bold">{L("الإجمالي الكلي", "Grand Total")}</span>
                  <span className="font-bold text-primary text-lg" data-ltr-number>{fmtSAR(viewing.subtotal)}</span>
                </div>
              </div>

              <div className="flex justify-end">
                <PrimaryButton onClick={() => sendReminder(viewing)}>
                  {sending[viewing.cart_id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  {L("إرسال تذكير", "Send reminder")}
                </PrimaryButton>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
