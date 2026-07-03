import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminLayout, PanelCard, PrimaryButton } from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Search, ImageIcon, Layers, Eye, EyeOff, ArrowRightLeft } from "lucide-react";
import {
  adminHomeSlidersApi,
  type HomeSliderEntry,
  type HomeSliderKey,
} from "@/lib/api/adminHomeSliders";
import { adminOffersApi, type AdminOffer } from "@/lib/api/adminContent";
import { useLang } from "@/i18n/LanguageProvider";

export const Route = createFileRoute("/admin/home-sliders")({
  head: () => ({ meta: [{ title: "Home Offer Sliders | Admin" }] }),
  component: HomeSlidersPage,
});

const SLIDER_LABELS: Record<HomeSliderKey, { ar: string; en: string }> = {
  slider_1: { ar: "السلايدر الأول", en: "Slider 1" },
  slider_2: { ar: "السلايدر الثاني", en: "Slider 2" },
};

function HomeSlidersPage() {
  const { lang } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);
  const currency = L("ر.س", "SAR");

  const [tab, setTab] = useState<HomeSliderKey>("slider_1");
  const [data, setData] = useState<Record<HomeSliderKey, HomeSliderEntry[]>>({
    slider_1: [],
    slider_2: [],
  });
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<AdminOffer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await adminHomeSlidersApi.list();
      setData(r);
    } catch (e: any) {
      toast.error(e?.message || L("تعذّر تحميل السلايدرين", "Failed to load sliders"));
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
      toast.error(e?.message || L("تعذّر تحميل العروض", "Failed to load offers"));
    } finally {
      setLoadingOffers(false);
    }
  }

  useEffect(() => { load(); loadOffers(); }, []);

  const current = data[tab];
  const currentIds = useMemo(() => new Set(current.map((e) => e.offerId)), [current]);

  async function add(offerId: string) {
    setBusy(offerId);
    try {
      const sortOrder = (current[current.length - 1]?.sortOrder ?? -1) + 1;
      await adminHomeSlidersApi.create({ sliderKey: tab, offerId, sortOrder, isActive: true });
      toast.success(L("تمت الإضافة", "Added"));
      load();
    } catch (e: any) {
      toast.error(e?.message || L("فشل الإضافة", "Add failed"));
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!confirm(L("إزالة هذا العرض من السلايدر؟", "Remove this offer from the slider?"))) return;
    setBusy(id);
    try {
      await adminHomeSlidersApi.remove(id);
      toast.success(L("تمت الإزالة", "Removed"));
      load();
    } catch (e: any) {
      toast.error(e?.message || L("فشل الحذف", "Delete failed"));
    } finally {
      setBusy(null);
    }
  }

  async function updateOrder(entry: HomeSliderEntry, sortOrder: number) {
    if (sortOrder === entry.sortOrder) return;
    try {
      await adminHomeSlidersApi.update(entry.id, { sortOrder });
      load();
    } catch (e: any) {
      toast.error(e?.message || L("تعذّر تحديث الترتيب", "Failed to update order"));
    }
  }

  async function toggleActive(entry: HomeSliderEntry) {
    setBusy(entry.id);
    try {
      await adminHomeSlidersApi.update(entry.id, { isActive: !entry.isActive });
      load();
    } catch (e: any) {
      toast.error(e?.message || L("تعذّر التحديث", "Update failed"));
    } finally {
      setBusy(null);
    }
  }

  async function moveTo(entry: HomeSliderEntry, target: HomeSliderKey) {
    if (entry.sliderKey === target) return;
    setBusy(entry.id);
    try {
      await adminHomeSlidersApi.update(entry.id, { sliderKey: target });
      toast.success(L("تم النقل", "Moved"));
      load();
    } catch (e: any) {
      toast.error(e?.message || L("فشل النقل", "Move failed"));
    } finally {
      setBusy(null);
    }
  }

  const otherTab: HomeSliderKey = tab === "slider_1" ? "slider_2" : "slider_1";

  return (
    <AdminLayout
      title={L("سلايدرات الصفحة الرئيسية", "Home Offer Sliders")}
      subtitle={L(
        "سلايدرين مستقلين يظهران على الصفحة الرئيسية — أضف العروض ورتّبها كما تريد.",
        "Two independent sliders shown on the home page — add and reorder offers freely.",
      )}
      action={<PrimaryButton onClick={() => { load(); loadOffers(); }}>{L("تحديث", "Refresh")}</PrimaryButton>}
    >
      {/* Tabs */}
      <div className="mb-6 inline-flex gap-1 rounded-2xl border border-border bg-card p-1">
        {(["slider_1", "slider_2"] as HomeSliderKey[]).map((k) => {
          const active = tab === k;
          const count = data[k].length;
          return (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
                active ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/70 hover:bg-muted"
              }`}
            >
              <Layers className="h-4 w-4" />
              {L(SLIDER_LABELS[k].ar, SLIDER_LABELS[k].en)}
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${active ? "bg-white/25" : "bg-muted"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <PanelCard
        title={L(`العروض داخل ${SLIDER_LABELS[tab].ar}`, `Offers in ${SLIDER_LABELS[tab].en}`)}
        className="mb-6"
      >
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : current.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {L("لا توجد عروض في هذا السلايدر بعد. أضف من الأسفل.", "No offers in this slider yet. Add from below.")}
          </div>
        ) : (
          <div className="grid gap-3">
            {current.map((f) => {
              const o = f.offer;
              const price = Number(o?.priceAfter ?? 0);
              const priceBefore = Number(o?.priceBefore ?? 0);
              const title = o
                ? (lang === "en" ? (o.titleEn || o.titleAr) : (o.titleAr || o.titleEn))
                : f.offerId;
              const vendor = o
                ? (lang === "en" ? (o.partnerNameEn || o.partnerNameAr) : (o.partnerNameAr || o.partnerNameEn))
                : "";
              return (
                <div key={f.id} className={`flex items-center gap-3 rounded-xl border bg-card p-3 ${f.isActive ? "border-border" : "border-dashed border-border opacity-60"}`}>
                  <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                    {o?.image ? (
                      <img src={o.image} alt={title || ""} className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-muted-foreground opacity-40" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{title || f.offerId}</div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">
                      {vendor || "—"}
                    </div>
                    {o && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        <span className="font-extrabold text-primary">{price} {currency}</span>
                        {priceBefore > price ? (
                          <span className="ms-2 line-through">{priceBefore} {currency}</span>
                        ) : null}
                        {o.discountPercent ? (
                          <span className="ms-2 rounded-md bg-rose-100 px-1.5 py-0.5 font-bold text-rose-700">-{o.discountPercent}%</span>
                        ) : null}
                      </div>
                    )}
                  </div>
                  <input
                    type="number"
                    defaultValue={f.sortOrder}
                    onBlur={(e) => updateOrder(f, Number(e.target.value))}
                    className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-sm text-center"
                    title={L("الترتيب", "Sort order")}
                  />
                  <button
                    onClick={() => toggleActive(f)}
                    disabled={busy === f.id}
                    title={f.isActive ? L("إيقاف", "Deactivate") : L("تفعيل", "Activate")}
                    className={`rounded-lg p-2 ${f.isActive ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-500 hover:bg-muted"}`}
                  >
                    {f.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => moveTo(f, otherTab)}
                    disabled={busy === f.id}
                    title={L(`نقل إلى ${SLIDER_LABELS[otherTab].ar}`, `Move to ${SLIDER_LABELS[otherTab].en}`)}
                    className="rounded-lg p-2 text-foreground/60 hover:bg-muted"
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => remove(f.id)}
                    disabled={busy === f.id}
                    className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                    title={L("حذف", "Delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </PanelCard>

      <PanelCard title={L("أضف عروضًا من القائمة النشطة", "Add offers from the active list")}>
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadOffers()}
              placeholder={L("بحث بالاسم...", "Search by name...")}
              className="w-full rounded-xl border border-border bg-background ps-9 pe-3 py-2 text-sm"
            />
          </div>
          <button onClick={loadOffers} className="rounded-xl border border-border px-4 py-2 text-sm font-bold">{L("بحث", "Search")}</button>
        </div>
        {loadingOffers ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : offers.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">{L("لا توجد عروض نشطة.", "No active offers.")}</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((o) => {
              const inCurrent = currentIds.has(o.id);
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
                      <span className="text-sm font-extrabold text-primary">{o.priceAfter} {currency}</span>
                      {o.priceBefore && o.priceBefore > o.priceAfter ? (
                        <span className="text-xs text-muted-foreground line-through">{o.priceBefore} {currency}</span>
                      ) : null}
                    </div>
                    <button
                      disabled={inCurrent || busy === o.id}
                      onClick={() => add(o.id)}
                      className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {inCurrent
                        ? L("مضاف بالفعل", "Already added")
                        : busy === o.id
                          ? "..."
                          : L(`أضف إلى ${SLIDER_LABELS[tab].ar}`, `Add to ${SLIDER_LABELS[tab].en}`)}
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
