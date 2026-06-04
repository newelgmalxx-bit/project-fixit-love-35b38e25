import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout, PanelCard, PrimaryButton } from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { Plus, Trash2, MapPin, Pencil, Loader2, Search } from "lucide-react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { adminCitiesApi, type AdminCity } from "@/lib/api/adminContent";

export const Route = createFileRoute("/admin/cities")({
  head: () => ({ meta: [{ title: "المدن | الإدارة" }] }),
  component: CitiesPage,
});

const empty: Partial<AdminCity> = {
  nameAr: "",
  nameEn: "",
  sortOrder: 0,
  isActive: true,
};

function CitiesPage() {
  const [items, setItems] = useState<AdminCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeInactive, setIncludeInactive] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<AdminCity>>(empty);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await adminCitiesApi.list({
        inactive: includeInactive || undefined,
        q: q.trim() || undefined,
      });
      setItems(data.items || []);
    } catch (e: any) {
      toast.error(e?.message || "تعذّر تحميل المدن");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeInactive]);

  function openNew() { setEditing(empty); setOpen(true); }
  function openEdit(c: AdminCity) { setEditing(c); setOpen(true); }

  async function save() {
    if (!editing.nameAr?.trim() || !editing.nameEn?.trim()) {
      toast.error("الاسم بالعربي والإنجليزي مطلوبان");
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<AdminCity> = {
        nameAr: editing.nameAr!.trim(),
        nameEn: editing.nameEn!.trim(),
        sortOrder: Number(editing.sortOrder) || 0,
        isActive: editing.isActive ?? true,
      };
      if (editing.id) await adminCitiesApi.update(editing.id as any, payload);
      else await adminCitiesApi.create(payload);
      toast.success("تم الحفظ");
      setOpen(false);
      load();
    } catch (e: any) {
      toast.error(e?.message || "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(c: AdminCity) {
    try { await adminCitiesApi.toggle(c.id, !c.isActive); load(); }
    catch (e: any) { toast.error(e?.message || "تعذّر التبديل"); }
  }

  async function remove(c: AdminCity) {
    if (!confirm(`حذف "${c.nameAr}"؟`)) return;
    try { await adminCitiesApi.remove(c.id); toast.success("تم الحذف"); load(); }
    catch (e: any) { toast.error(e?.message || "فشل الحذف"); }
  }

  const activeCount = items.filter((c) => c.isActive).length;

  return (
    <AdminLayout
      title="المدن"
      subtitle={`${activeCount} مدينة مفعّلة من أصل ${items.length}`}
      action={<PrimaryButton onClick={openNew}><Plus className="h-4 w-4" /> مدينة جديدة</PrimaryButton>}
    >
      <PanelCard title="">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="بحث..."
              className="w-full rounded-xl border border-border bg-background ps-9 pe-3 py-2 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} />
            إظهار غير المفعّلة
          </label>
          <button onClick={load} className="rounded-full border border-border px-4 py-1.5 text-xs font-bold">تحديث</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">لا توجد مدن.</div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {items.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.isActive ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold truncate">
                      {c.nameAr} <span className="text-muted-foreground">· {c.nameEn}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggle(c)}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-full border ${c.isActive ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-border bg-muted text-muted-foreground"}`}>
                    {c.isActive ? "مفعّلة" : "موقوفة"}
                  </button>
                  <button onClick={() => openEdit(c)} className="rounded-lg p-2 hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(c)} className="text-rose-600 hover:bg-rose-50 rounded-lg p-2"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </PanelCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>{editing.id ? "تعديل مدينة" : "مدينة جديدة"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground">الاسم (عربي)</label>
                <input value={editing.nameAr || ""} onChange={(e) => setEditing({ ...editing, nameAr: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground">الاسم (إنجليزي)</label>
                <input value={editing.nameEn || ""} onChange={(e) => setEditing({ ...editing, nameEn: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground">الترتيب</label>
                <input type="number" value={editing.sortOrder ?? 0} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <label className="flex items-end gap-2 pb-2">
                <input type="checkbox" checked={editing.isActive ?? true} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} />
                <span className="text-sm font-bold">مفعّلة</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="rounded-xl border border-border px-4 py-2 text-sm font-bold">إلغاء</button>
            <button onClick={save} disabled={saving} className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60">
              {saving ? "جارٍ الحفظ…" : "حفظ"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
