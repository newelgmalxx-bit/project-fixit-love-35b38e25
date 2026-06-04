import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, Save, Loader2, Package as PackageIcon, ChevronDown, ChevronUp, X, Pencil } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout, PanelCard } from "@/components/admin/AdminLayout";
import { adminPartnerPackagesApi, type PartnerPackage } from "@/lib/api/partnerPackages";
import { useLang } from "@/i18n/LanguageProvider";
import { fmtSAR } from "@/data/admin";

export const Route = createFileRoute("/admin/partner-packages")({
  head: () => ({ meta: [{ title: "باقات الشركاء | Admin" }] }),
  component: PartnerPackagesPage,
});

type Draft = Partial<PartnerPackage> & { _new?: boolean };

function PartnerPackagesPage() {
  const { lang } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);
  const [items, setItems] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [newFeature, setNewFeature] = useState<Record<number, string>>({});

  async function load() {
    setLoading(true);
    try {
      const data = await adminPartnerPackagesApi.list();
      setItems(data);
      setOpenIdx(null);
    } catch (e: any) {
      toast.error(e?.message || "تعذّر تحميل الباقات");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const addNew = () => {
    setItems((arr) => {
      const next = [
        ...arr,
        {
          _new: true,
          nameAr: "",
          price: 0,
          description: "",
          features: [] as string[],
          isActive: true,
          sortOrder: arr.length,
        } as Draft,
      ];
      setOpenIdx(next.length - 1);
      return next;
    });
  };

  const updateField = (idx: number, patch: Partial<Draft>) => {
    setItems((arr) => arr.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  };

  const addFeature = (idx: number) => {
    const v = (newFeature[idx] || "").trim();
    if (!v) return;
    const current = items[idx]?.features || [];
    updateField(idx, { features: [...current, v] });
    setNewFeature((m) => ({ ...m, [idx]: "" }));
  };

  const removeFeature = (idx: number, fi: number) => {
    const current = items[idx]?.features || [];
    updateField(idx, { features: current.filter((_, k) => k !== fi) });
  };

  const normalizeFeatures = (features: string[] = [], pending?: string) => {
    const merged = [...features, pending || ""];
    return merged.map((f) => f.trim()).filter(Boolean);
  };

  const save = async (idx: number) => {
    const p = items[idx];
    const features = normalizeFeatures(p.features || [], newFeature[idx]);
    if (!p.nameAr || (p.price ?? 0) < 0) {
      toast.error("ادخل اسم الباقة وسعراً صحيحاً");
      return;
    }
    setSavingId(p.id || `new-${idx}`);
    try {
      const body: Partial<PartnerPackage> = {
        name: p.nameAr,
        nameAr: p.nameAr,
        nameEn: p.nameEn || p.nameAr,
        price: Number(p.price) || 0,
        description: p.description || null,
        features,
        isActive: p.isActive ?? true,
        sortOrder: p.sortOrder ?? idx,
      };
      const saved = p._new || !p.id
        ? await adminPartnerPackagesApi.create(body)
        : await adminPartnerPackagesApi.update(p.id, body);
      setItems((arr) => arr.map((x, i) => (i === idx ? { ...saved } : x)));
      setNewFeature((m) => ({ ...m, [idx]: "" }));
      setOpenIdx(null);
      toast.success("تم الحفظ");
    } catch (e: any) {
      toast.error(e?.message || "فشل الحفظ — قد تكون نقطة الـ API غير منشورة بعد");
    } finally {
      setSavingId(null);
    }
  };

  const remove = async (idx: number) => {
    const p = items[idx];
    if (!confirm(`حذف الباقة "${p.nameAr || p.name}"؟`)) return;
    if (p._new || !p.id) {
      setItems((arr) => arr.filter((_, i) => i !== idx));
      if (openIdx === idx) setOpenIdx(null);
      return;
    }
    try {
      await adminPartnerPackagesApi.remove(p.id);
      setItems((arr) => arr.filter((_, i) => i !== idx));
      if (openIdx === idx) setOpenIdx(null);
      toast.success("تم الحذف");
    } catch (e: any) {
      toast.error(e?.message || "فشل الحذف");
    }
  };

  return (
    <AdminLayout
      title={L("باقات الشركاء", "Partner Packages")}
      subtitle={L(
        "باقات الاشتراك المعروضة في نموذج تسجيل الشريك. السداد يتم خارج المنصة.",
        "Subscription packages shown on partner signup. Payment is handled off-platform.",
      )}
      action={
        <button
          type="button"
          onClick={addNew}
          disabled={items.length >= 4}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:brightness-110 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> {L("باقة جديدة", "New package")}
        </button>
      }
    >
      <PanelCard
        title={L("الباقات", "Packages")}
        subtitle={L("يُفضّل عرض باقتين فقط للشريك", "Show two packages on the signup form")}
      >
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> جاري التحميل…</div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            <PackageIcon className="mx-auto mb-2 h-6 w-6" />
            لا توجد باقات بعد — أضف باقة لتظهر في نموذج تسجيل الشريك.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((p, i) => {
              const isOpen = openIdx === i;
              return (
                <div key={p.id || `new-${i}`} className={`rounded-2xl border bg-background overflow-hidden transition-all ${isOpen ? "border-primary border-2 shadow-md ring-2 ring-primary/20" : "border-border"}`}>
                  {/* Header (summary) — always visible, click to toggle */}
                  <button
                    type="button"
                    onClick={() => setOpenIdx(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-start hover:bg-muted/40 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <PackageIcon className="h-5 w-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="font-bold text-sm truncate">
                          {p.nameAr || p.name || L("باقة جديدة", "New package")}
                          {p.isActive === false && <span className="ms-2 text-[10px] font-bold text-muted-foreground">(معطلة)</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {fmtSAR(Number(p.price) || 0)} · {(p.features?.length || 0)} ميزة
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {isOpen ? <>إخفاء <ChevronUp className="h-4 w-4" /></> : <>تعديل <Pencil className="h-3.5 w-3.5" /> <ChevronDown className="h-4 w-4" /></>}
                    </div>
                  </button>

                  {/* Body (form) — only when expanded */}
                  {isOpen && (
                    <div className="border-t border-border p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Lb label="اسم الباقة (عربي) *">
                          <input className={ic} value={p.nameAr || ""} onChange={(e) => updateField(i, { nameAr: e.target.value })} placeholder="مثال: الباقة الأساسية" />
                        </Lb>
                        <Lb label="السعر (ر.س) *">
                          <input type="number" min={0} step="1" className={ic} value={p.price ?? 0} onChange={(e) => updateField(i, { price: Number(e.target.value) })} />
                        </Lb>
                        <Lb label="الوصف" full>
                          <textarea rows={2} className={ic} value={p.description || ""} onChange={(e) => updateField(i, { description: e.target.value })} placeholder="وصف مختصر يظهر تحت اسم الباقة" />
                        </Lb>

                        {/* Features list — add one at a time */}
                        <div className="sm:col-span-2 space-y-2">
                          <div className="text-xs font-bold">المميزات</div>
                          <div className="space-y-1.5">
                            {(p.features || []).map((f, fi) => (
                              <div key={fi} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                <input
                                  className="flex-1 bg-transparent text-sm outline-none"
                                  value={f}
                                  onChange={(e) => {
                                    const next = [...(p.features || [])];
                                    next[fi] = e.target.value;
                                    updateField(i, { features: next });
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeFeature(i, fi)}
                                  className="rounded p-1 text-muted-foreground hover:text-rose-600 hover:bg-rose-50"
                                  aria-label="حذف"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              className={ic}
                              placeholder="اكتب ميزة ثم اضغط إضافة"
                              value={newFeature[i] || ""}
                              onChange={(e) => setNewFeature((m) => ({ ...m, [i]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") { e.preventDefault(); addFeature(i); }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => addFeature(i)}
                              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold hover:bg-muted"
                            >
                              <Plus className="h-3.5 w-3.5" /> إضافة
                            </button>
                          </div>
                        </div>

                        <Lb label="ترتيب العرض">
                          <input type="number" className={ic} value={p.sortOrder ?? i} onChange={(e) => updateField(i, { sortOrder: Number(e.target.value) })} />
                        </Lb>
                        <Lb label="الحالة">
                          <select className={ic} value={(p.isActive ?? true) ? "1" : "0"} onChange={(e) => updateField(i, { isActive: e.target.value === "1" })}>
                            <option value="1">نشطة</option>
                            <option value="0">معطلة</option>
                          </select>
                        </Lb>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                        <div className="text-xs text-muted-foreground">
                          معاينة السعر: <b className="text-foreground">{fmtSAR(Number(p.price) || 0)}</b>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => remove(i)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> حذف
                          </button>
                          <button
                            type="button"
                            onClick={() => save(i)}
                            disabled={savingId !== null}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:brightness-110 disabled:opacity-50"
                          >
                            {savingId === (p.id || `new-${i}`) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            حفظ
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </PanelCard>
    </AdminLayout>
  );
}

const ic = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
function Lb({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <label className={`text-xs font-bold space-y-1.5 block ${full ? "sm:col-span-2" : ""}`}>{label}{children}</label>;
}
