import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout, PanelCard, PrimaryButton, GhostButton, Pill } from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";
import { Plus, Trash2, Edit, Code2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageProvider";
import { adminTrackingApi } from "@/lib/api/adminTracking";

export const Route = createFileRoute("/admin/tracking")({
  head: () => ({ meta: [{ title: "Tracking & Pixels | Admin" }] }),
  component: TrackingPage,
});

type TrackingItem = {
  id: string | number;
  name: string;
  type: "pixel" | "head" | "body";
  code: string;
  is_active: number;
  sort_order: number;
  updated_at?: string;
};

type Form = { name: string; type: "pixel" | "head" | "body"; code: string; sort_order: number; is_active: number };
const empty: Form = { name: "", type: "pixel", code: "", sort_order: 0, is_active: 1 };

const ic = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
const hasTrackingId = (id: TrackingItem["id"] | null | undefined) => id != null && String(id).trim().length > 0;

function TrackingPage() {
  const { lang, dir } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);
  const textAlign = dir === "rtl" ? "text-right" : "text-left";
  const knobOn = dir === "rtl" ? "right-0.5" : "left-0.5";
  const knobOff = dir === "rtl" ? "right-5" : "left-5";

  const [items, setItems] = useState<TrackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | number | null>(null);
  const [f, setF] = useState<Form>(empty);
  const [delId, setDelId] = useState<string | number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await adminTrackingApi.list();
      setItems((list as TrackingItem[]).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
    } catch (e: any) {
      toast.error(e?.message || L("تعذر التحميل", "Load failed"));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditId(null); setF(empty); setOpen(true); };
  const openEdit = (it: TrackingItem) => {
    if (!hasTrackingId(it.id)) {
      toast.error(L("معرّف الكود غير موجود", "Tracking code id is missing"));
      return;
    }
    setEditId(it.id);
    setF({ name: it.name, type: it.type, code: it.code, sort_order: it.sort_order ?? 0, is_active: it.is_active });
    setOpen(true);
  };

  const save = async () => {
    if (!f.name.trim() || !f.code.trim()) {
      toast.error(L("الاسم والكود مطلوبان", "Name and code are required"));
      return;
    }
    try {
      if (editId) {
        await adminTrackingApi.update(editId, f);
        toast.success(L("تم التحديث", "Updated"));
      } else {
        await adminTrackingApi.create({ name: f.name, type: f.type, code: f.code, sort_order: f.sort_order });
        toast.success(L("تمت الإضافة", "Added"));
      }
      setOpen(false);
      load();
    } catch (e: any) {
      toast.error(e?.message || L("فشل الحفظ", "Save failed"));
    }
  };

  const toggle = async (it: TrackingItem) => {
    if (!hasTrackingId(it.id)) {
      toast.error(L("معرّف الكود غير موجود", "Tracking code id is missing"));
      return;
    }
    const optimistic = it.is_active ? 0 : 1;
    setItems((arr) => arr.map((x) => (x.id === it.id ? { ...x, is_active: optimistic } : x)));
    try {
      await adminTrackingApi.update(it.id, { is_active: optimistic });
    } catch (e: any) {
      setItems((arr) => arr.map((x) => (x.id === it.id ? { ...x, is_active: it.is_active } : x)));
      toast.error(e?.message || L("فشل التحديث", "Toggle failed"));
    }
  };

  const remove = async () => {
    if (!hasTrackingId(delId)) {
      setDelId(null);
      toast.error(L("معرّف الكود غير موجود", "Tracking code id is missing"));
      return;
    }
    const id = delId;
    setDelId(null);
    const prev = items;
    setItems((arr) => arr.filter((x) => x.id !== id));
    try {
      await adminTrackingApi.remove(id!);
      toast.success(L("تم الحذف", "Deleted"));
    } catch (e: any) {
      setItems(prev);
      toast.error(e?.message || L("فشل الحذف", "Delete failed"));
    }
  };

  const typeTone = (t: string): "primary" | "violet" | "emerald" =>
    t === "pixel" ? "primary" : t === "head" ? "violet" : "emerald";
  const typeLabel = (t: string) =>
    t === "pixel" ? L("بكسل", "Pixel") : t === "head" ? L("هيدر", "Head") : L("بدي", "Body");

  return (
    <AdminLayout
      title={L("التتبع والبكسلات", "Tracking & Pixels")}
      subtitle={L("إدارة أكواد التتبع والبكسلات الإعلانية", "Manage tracking and ad pixel codes")}
      action={<PrimaryButton onClick={openAdd}><Plus className="h-4 w-4" /> {L("إضافة كود", "Add Code")}</PrimaryButton>}
    >
      <PanelCard>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className={`${textAlign} text-xs text-muted-foreground border-b border-border`}>
                <th className="px-3 py-3 font-medium">{L("الاسم", "Name")}</th>
                <th className="px-3 py-3 font-medium">{L("النوع", "Type")}</th>
                <th className="px-3 py-3 font-medium">{L("الحالة", "Status")}</th>
                <th className="px-3 py-3 font-medium">{L("الترتيب", "Order")}</th>
                <th className="px-3 py-3 font-medium">{L("آخر تحديث", "Updated")}</th>
                <th className="px-3 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-3 py-10 text-center text-xs text-muted-foreground">{L("جارٍ التحميل…", "Loading…")}</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-10 text-center text-xs text-muted-foreground">{L("لا توجد أكواد", "No codes yet")}</td></tr>
              ) : items.map((it) => (
                <tr key={it.id} className="border-b border-border hover:bg-muted/40">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary"><Code2 className="h-4 w-4" /></div>
                      <div className="font-bold">{it.name}</div>
                    </div>
                  </td>
                  <td className="px-3 py-3"><Pill tone={typeTone(it.type)}>{typeLabel(it.type)}</Pill></td>
                  <td className="px-3 py-3">
                    <button onClick={() => toggle(it)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${it.is_active ? "bg-emerald-500" : "bg-muted"}`}>
                      <span className={`absolute inline-block h-5 w-5 rounded-full bg-white shadow transition ${it.is_active ? knobOn : knobOff}`} />
                    </button>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground" data-ltr-number>{it.sort_order ?? 0}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground" data-ltr-number>{(it.updated_at || "").slice(0, 16)}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(it)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted text-primary"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => setDelId(it.id)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-rose-50 text-rose-500"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir={dir} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editId ? L("تعديل كود", "Edit Code") : L("إضافة كود جديد", "Add New Code")}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-bold space-y-1.5 block col-span-2">{L("الاسم", "Name")}
              <input className={ic} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder={L("مثال: Meta Pixel", "e.g. Meta Pixel")} />
            </label>
            <label className="text-xs font-bold space-y-1.5 block">{L("النوع", "Type")}
              <select className={ic} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as any })}>
                <option value="pixel">{L("بكسل", "Pixel")}</option>
                <option value="head">{L("هيدر (head)", "Head")}</option>
                <option value="body">{L("بدي (body)", "Body")}</option>
              </select>
            </label>
            <label className="text-xs font-bold space-y-1.5 block">{L("الترتيب", "Sort Order")}
              <input type="number" className={ic} dir="ltr" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: Number(e.target.value) || 0 })} />
            </label>
            <label className="text-xs font-bold space-y-1.5 block col-span-2">{L("الكود", "Code")}
              <textarea
                className={ic + " font-mono text-xs"}
                dir="ltr"
                style={{ minHeight: 200 }}
                value={f.code}
                onChange={(e) => setF({ ...f, code: e.target.value })}
                placeholder="<script>...</script>"
              />
            </label>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <GhostButton onClick={() => setOpen(false)}>{L("إلغاء", "Cancel")}</GhostButton>
            <PrimaryButton onClick={save}>{editId ? L("حفظ", "Save") : L("إضافة", "Add")}</PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={delId !== null} onOpenChange={(o) => !o && setDelId(null)}>
        <AlertDialogContent dir={dir}>
          <AlertDialogHeader>
            <AlertDialogTitle>{L("تأكيد الحذف", "Confirm Delete")}</AlertDialogTitle>
            <AlertDialogDescription>{L("هل أنت متأكد من حذف هذا الكود؟ لا يمكن التراجع.", "Are you sure you want to delete this code? This cannot be undone.")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{L("إلغاء", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-rose-500 hover:bg-rose-600">{L("حذف", "Delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
