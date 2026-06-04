import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminLayout, PanelCard, PrimaryButton } from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Star, Search, ImageIcon } from "lucide-react";
import {
  adminFeaturedOffersApi, adminOffersApi,
  type FeaturedOffer, type AdminOffer,
} from "@/lib/api/adminContent";

export const Route = createFileRoute("/admin/featured-offers")({
  head: () => ({ meta: [{ title: "العروض المميزة | الإدارة" }] }),
  component: FeaturedOffersPage,
});

function FeaturedOffersPage() {
  const [items, setItems] = useState<FeaturedOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<AdminOffer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await adminFeaturedOffersApi.list();
      setItems(data);
    } catch (e: any) {
      toast.error(e?.message || "تعذّر تحميل العروض المميزة");
    } finally {
      setLoading(false);
    }
  }

  async function loadOffers() {
    setLoadingOffers(true);
    try {
      const res = await adminOffersApi.list({ status: "active", q: q.trim() || undefined, limit: 50 });
      setOffers(res.items || []);
    } catch (e: any) {
      toast.error(e?.message || "تعذّر تحميل العروض");
    } finally {
      setLoadingOffers(false);
    }
  }

  useEffect(() => { load(); loadOffers(); }, []);

  const featuredOfferIds = useMemo(() => new Set(items.map((i) => i.offerId)), [items]);

  async function add(offerId: string) {
    setAdding(offerId);
    try {
      const sortOrder = (items[items.length - 1]?.sortOrder ?? 0) + 1;
      await adminFeaturedOffersApi.create({ offerId, sortOrder, isActive: true });
      toast.success("تمت الإضافة");
      load();
    } catch (e: any) {
      toast.error(e?.message || "فشل الإضافة");
    } finally {
      setAdding(null);
    }
  }

  async function remove(id: number | string) {
    if (!confirm("إزالة هذا العرض من المميزين؟")) return;
    try {
      await adminFeaturedOffersApi.remove(id);
      toast.success("تمت الإزالة");
      load();
    } catch (e: any) {
      toast.error(e?.message || "فشل الإزالة");
    }
  }

  async function updateOrder(f: FeaturedOffer, sortOrder: number) {
    try {
      await adminFeaturedOffersApi.update(f.id, { sortOrder });
      load();
    } catch (e: any) {
      toast.error(e?.message || "تعذّر تحديث الترتيب");
    }
  }

  return (
    <AdminLayout
      title="العروض المميزة"
      subtitle={`${items.length} عرض مميز حاليًا`}
      action={<PrimaryButton onClick={() => { load(); loadOffers(); }}>تحديث</PrimaryButton>}
    >
      <PanelCard title="العروض المميزة الحالية" className="mb-6">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">لا توجد عروض مميزة بعد.</div>
        ) : (
          <div className="grid gap-3">
            {items.map((f) => {
              const o = f.offer;
              return (
                <div key={f.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                  <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                    {o?.image ? (
                      <img src={o.image} alt={o.title} className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-muted-foreground opacity-40" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500" />
                      <div className="truncate text-sm font-bold">{o?.title || f.offerId}</div>
                    </div>
                    {o && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {o.priceAfter} ر.س
                        {o.priceBefore && o.priceBefore > o.priceAfter ? (
                          <span className="ms-2 line-through">{o.priceBefore} ر.س</span>
                        ) : null}
                      </div>
                    )}
                  </div>
                  <input
                    type="number"
                    defaultValue={f.sortOrder}
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (v !== f.sortOrder) updateOrder(f, v);
                    }}
                    className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-sm text-center"
                  />
                  <button onClick={() => remove(f.id)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </PanelCard>

      <PanelCard title="أضف عروضًا من القائمة النشطة">
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadOffers()}
              placeholder="بحث بالاسم..."
              className="w-full rounded-xl border border-border bg-background ps-9 pe-3 py-2 text-sm"
            />
          </div>
          <button onClick={loadOffers} className="rounded-xl border border-border px-4 py-2 text-sm font-bold">بحث</button>
        </div>
        {loadingOffers ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : offers.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">لا توجد عروض نشطة.</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((o) => {
              const isFeatured = featuredOfferIds.has(o.id) || !!o.isFeatured;
              return (
                <div key={o.id} className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                    {o.image ? (
                      <img src={o.image} alt={o.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-8 w-8 opacity-40" />
                      </div>
                    )}
                    {o.discountPercent ? (
                      <span className="absolute top-2 start-2 rounded-md bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white">
                        -{o.discountPercent}%
                      </span>
                    ) : null}
                  </div>
                  <div className="p-3">
                    <div className="truncate text-sm font-bold">{o.title}</div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">
                      {o.category?.nameAr || o.partner?.vendorName || o.titleEn || "—"}
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-sm font-extrabold text-primary">{o.priceAfter} ر.س</span>
                      {o.priceBefore && o.priceBefore > o.priceAfter ? (
                        <span className="text-xs text-muted-foreground line-through">{o.priceBefore} ر.س</span>
                      ) : null}
                    </div>
                    <button
                      disabled={isFeatured || adding === o.id}
                      onClick={() => add(o.id)}
                      className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" /> {isFeatured ? "مضاف بالفعل" : adding === o.id ? "..." : "أضف للمميزين"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PanelCard>
    </AdminLayout>
  );
}
