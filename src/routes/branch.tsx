import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Loader2, LogOut, MapPin, Clock, KeyRound, Ticket, Calendar, Store,
  Plus, Pencil, Trash2, Search, X, CheckCircle2, XCircle, RefreshCw,
} from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";
import {
  branchApi, branchAuth, getBranchToken, getStoredBranch, setStoredBranch,
  type BranchMe, type ParentPartner,
} from "@/lib/api/branch";
import { BranchHoursEditor, defaultWorkingHours, parseWorkingHours, type WorkingHour } from "@/components/branches/BranchHoursEditor";

export const Route = createFileRoute("/branch")({
  head: () => ({ meta: [{ title: "Branch Dashboard | Koswmat" }] }),
  component: BranchDashboardPage,
});

type SectionKey = "overview" | "info" | "hours" | "password" | "offers" | "bookings";

function BranchDashboardPage() {
  const { lang, dir } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState<BranchMe | null>(getStoredBranch());
  const [parent, setParent] = useState<ParentPartner | null>(null);
  const [section, setSection] = useState<SectionKey>("overview");

  useEffect(() => {
    if (!getBranchToken()) { navigate({ to: "/branch-login" as any }); return; }
    (async () => {
      try {
        const d = await branchApi.me();
        setBranch(d.branch); setStoredBranch(d.branch); setParent(d.parentPartner || null);
      } catch (e: any) {
        if (e?.status === 401 || e?.status === 403) {
          await branchAuth.logout();
          navigate({ to: "/branch-login" as any });
          return;
        }
        toast.error(e?.message || L("تعذّر التحميل", "Failed to load"));
      } finally { setLoading(false); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doLogout() {
    await branchAuth.logout();
    navigate({ to: "/branch-login" as any });
  }

  const nav: { key: SectionKey; label: string; icon: any; show: boolean }[] = useMemo(() => [
    { key: "overview", label: L("نظرة عامة", "Overview"), icon: Store, show: true },
    { key: "info",     label: L("بيانات الفرع", "Branch info"), icon: MapPin, show: !!branch?.canEditInfo },
    { key: "hours",    label: L("ساعات العمل", "Working hours"), icon: Clock, show: !!branch?.canManageHours },
    { key: "offers",   label: L("العروض", "Offers"), icon: Ticket, show: !!branch?.canManageOffers },
    { key: "bookings", label: L("الحجوزات", "Bookings"), icon: Calendar, show: !!branch?.canManageBookings },
    { key: "password", label: L("كلمة المرور", "Password"), icon: KeyRound, show: true },
  ], [branch, lang]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!branch) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" dir={dir}>
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="text-xs font-bold text-muted-foreground">
              {L("تابع لـ:", "Part of:")} {parent ? (lang === "en" ? (parent.nameEn || parent.name) : parent.name) : "—"}
            </div>
            <h1 className="text-lg font-extrabold truncate">
              {lang === "en" ? (branch.nameEn || branch.nameAr) : branch.nameAr}
            </h1>
          </div>
          <button onClick={doLogout} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-bold hover:bg-muted">
            <LogOut className="h-4 w-4" /> {L("خروج", "Sign out")}
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-2xl border border-border bg-white p-3">
          <nav className="space-y-1">
            {nav.filter((n) => n.show).map((n) => {
              const Icon = n.icon;
              const active = section === n.key;
              return (
                <button key={n.key} onClick={() => setSection(n.key)}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${
                    active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                  }`}>
                  <Icon className="h-4 w-4" /> {n.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="rounded-2xl border border-border bg-white p-4 sm:p-6">
          {section === "overview" && <OverviewSection branch={branch} parent={parent} />}
          {section === "info" && branch.canEditInfo && (
            <InfoSection branch={branch} onSaved={(b) => { setBranch(b); setStoredBranch(b); }} />
          )}
          {section === "hours" && branch.canManageHours && <HoursSection />}
          {section === "offers" && branch.canManageOffers && <OffersSection />}
          {section === "bookings" && branch.canManageBookings && <BookingsSection />}
          {section === "password" && <PasswordSection />}
        </main>
      </div>
    </div>
  );
}

/* ---------------- Overview ---------------- */
function OverviewSection({ branch, parent }: { branch: BranchMe; parent: ParentPartner | null }) {
  const { lang } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);
  const Perm = ({ ok, label }: { ok?: boolean; label: string }) => (
    <div className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-border bg-muted/30 text-muted-foreground"}`}>
      {ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
      <span className="font-bold">{label}</span>
    </div>
  );
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-extrabold">{L("نظرة عامة", "Overview")}</h2>
        <p className="text-sm text-muted-foreground">{L("ملخص صلاحياتك وبيانات فرعك", "Summary of your permissions and branch info")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="text-xs font-bold text-muted-foreground">{L("المركز الأب", "Parent partner")}</div>
          <div className="mt-1 text-sm font-bold">{parent ? (lang === "en" ? (parent.nameEn || parent.name) : parent.name) : "—"}</div>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="text-xs font-bold text-muted-foreground">{L("العنوان", "Address")}</div>
          <div className="mt-1 text-sm font-bold">{branch.address || "—"}</div>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="text-xs font-bold text-muted-foreground">{L("الهاتف", "Phone")}</div>
          <div className="mt-1 text-sm font-bold" dir="ltr">{branch.phone || "—"}</div>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="text-xs font-bold text-muted-foreground">{L("الحالة", "Status")}</div>
          <div className="mt-1 text-sm font-bold">{branch.status || "active"}</div>
        </div>
      </div>

      <div>
        <h3 className="mb-2 mt-4 text-sm font-extrabold">{L("الصلاحيات المفعّلة", "Enabled permissions")}</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <Perm ok={!!branch.canManageOffers} label={L("إدارة العروض", "Manage offers")} />
          <Perm ok={!!branch.canManageHours} label={L("إدارة ساعات العمل", "Manage hours")} />
          <Perm ok={!!branch.canEditInfo} label={L("تعديل بيانات الفرع", "Edit branch info")} />
          <Perm ok={!!branch.canManageBookings} label={L("إدارة الحجوزات", "Manage bookings")} />
        </div>
      </div>
    </div>
  );
}

/* ---------------- Info ---------------- */
function InfoSection({ branch, onSaved }: { branch: BranchMe; onSaved: (b: BranchMe) => void }) {
  const { lang } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);
  const [form, setForm] = useState({
    nameAr: branch.nameAr || "", nameEn: branch.nameEn || "",
    phone: branch.phone || "", address: branch.address || "", mapsUrl: branch.mapsUrl || "",
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form.nameAr.trim()) { toast.error(L("الاسم بالعربي مطلوب", "Arabic name required")); return; }
    setSaving(true);
    try {
      const d = await branchApi.updateProfile({
        nameAr: form.nameAr.trim(),
        nameEn: form.nameEn.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        mapsUrl: form.mapsUrl.trim() || null,
      });
      toast.success(L("تم الحفظ", "Saved"));
      onSaved({ ...branch, ...d.branch });
    } catch (e: any) { toast.error(e?.message || L("فشل الحفظ", "Save failed")); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-extrabold">{L("بيانات الفرع", "Branch info")}</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={L("الاسم (عربي)", "Name (Arabic)")} value={form.nameAr} onChange={(v) => setForm({ ...form, nameAr: v })} />
        <Field label={L("الاسم (إنجليزي)", "Name (English)")} value={form.nameEn} onChange={(v) => setForm({ ...form, nameEn: v })} />
        <Field label={L("الهاتف", "Phone")} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <Field label={L("رابط الخريطة", "Maps URL")} value={form.mapsUrl} onChange={(v) => setForm({ ...form, mapsUrl: v })} />
        <div className="sm:col-span-2">
          <Field label={L("العنوان", "Address")} value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
        </div>
      </div>
      <div>
        <button onClick={save} disabled={saving} className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60">
          {saving ? L("جارٍ الحفظ…", "Saving…") : L("حفظ", "Save")}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs font-bold">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
    </div>
  );
}

/* ---------------- Hours ---------------- */
function HoursSection() {
  const { lang } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hours, setHours] = useState<WorkingHour[]>(defaultWorkingHours());

  useEffect(() => {
    branchApi.getHours()
      .then((d) => setHours(parseWorkingHours(d.workingHours)))
      .catch((e: any) => toast.error(e?.message || L("فشل التحميل", "Failed to load")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setSaving(true);
    try { await branchApi.setHours(hours); toast.success(L("تم الحفظ", "Saved")); }
    catch (e: any) { toast.error(e?.message || L("فشل الحفظ", "Save failed")); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-extrabold">{L("ساعات العمل", "Working hours")}</h2>
      <BranchHoursEditor value={hours} onChange={setHours} />
      <button onClick={save} disabled={saving} className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60">
        {saving ? L("جارٍ الحفظ…", "Saving…") : L("حفظ", "Save")}
      </button>
    </div>
  );
}

/* ---------------- Password ---------------- */
function PasswordSection() {
  const { lang } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);
  const [cur, setCur] = useState(""); const [nw, setNw] = useState(""); const [saving, setSaving] = useState(false);

  async function save() {
    if (!cur || !nw) { toast.error(L("املأ الحقول", "Fill all fields")); return; }
    if (nw.length < 6) { toast.error(L("6 أحرف على الأقل", "At least 6 characters")); return; }
    setSaving(true);
    try {
      await branchApi.changePassword({ currentPassword: cur, newPassword: nw });
      toast.success(L("تم تغيير كلمة المرور", "Password updated"));
      setCur(""); setNw("");
    } catch (e: any) { toast.error(e?.message || L("فشل التغيير", "Update failed")); }
    finally { setSaving(false); }
  }

  return (
    <div className="max-w-md space-y-4">
      <h2 className="text-xl font-extrabold">{L("تغيير كلمة المرور", "Change password")}</h2>
      <Field label={L("كلمة المرور الحالية", "Current password")} type="password" value={cur} onChange={setCur} />
      <Field label={L("كلمة المرور الجديدة", "New password")} type="password" value={nw} onChange={setNw} />
      <button onClick={save} disabled={saving} className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60">
        {saving ? L("جارٍ الحفظ…", "Saving…") : L("حفظ", "Save")}
      </button>
    </div>
  );
}

/* ---------------- Offers ---------------- */
function OffersSection() {
  const { lang } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const emptyForm = {
    titleAr: "", titleEn: "", descriptionAr: "", descriptionEn: "",
    priceBefore: "", priceAfter: "", durationMinutes: "",
    image: "", status: "draft", categoryId: "",
    termsAr: "", termsEn: "", overviewAr: "", overviewEn: "",
    validFrom: "", validTo: "",
  };
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try { const d = await branchApi.listOffers(); setItems(d.items || []); }
    catch (e: any) { toast.error(e?.message || L("فشل التحميل", "Failed to load")); setItems([]); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function openNew() { setEditingId(null); setForm(emptyForm); setOpen(true); }
  function openEdit(o: any) {
    setEditingId(o.id);
    setForm({
      titleAr: o.titleAr || o.title || "", titleEn: o.titleEn || "",
      descriptionAr: o.descriptionAr || o.description || "", descriptionEn: o.descriptionEn || "",
      priceBefore: o.priceBefore ?? "", priceAfter: o.priceAfter ?? "",
      durationMinutes: o.durationMinutes ?? "",
      image: o.image || "", status: o.status || "draft", categoryId: o.categoryId || "",
      termsAr: Array.isArray(o.termsAr) ? o.termsAr.join("\n") : (o.termsAr || ""),
      termsEn: Array.isArray(o.termsEn) ? o.termsEn.join("\n") : (o.termsEn || ""),
      overviewAr: Array.isArray(o.overviewAr) ? o.overviewAr.join("\n") : (o.overviewAr || ""),
      overviewEn: Array.isArray(o.overviewEn) ? o.overviewEn.join("\n") : (o.overviewEn || ""),
      validFrom: o.validFrom || "", validTo: o.validTo || "",
    });
    setOpen(true);
  }

  async function save() {
    if (!form.titleAr.trim()) { toast.error(L("عنوان العرض بالعربي مطلوب", "Arabic title required")); return; }
    setSaving(true);
    try {
      const payload: any = {
        titleAr: form.titleAr.trim(),
        titleEn: form.titleEn.trim() || null,
        descriptionAr: form.descriptionAr || null,
        descriptionEn: form.descriptionEn || null,
        priceBefore: form.priceBefore === "" ? null : Number(form.priceBefore),
        priceAfter: form.priceAfter === "" ? null : Number(form.priceAfter),
        durationMinutes: form.durationMinutes === "" ? null : Number(form.durationMinutes),
        image: form.image || null,
        status: form.status || "draft",
        categoryId: form.categoryId || null,
        termsAr: form.termsAr ? String(form.termsAr).split(/\n+/).filter(Boolean) : [],
        termsEn: form.termsEn ? String(form.termsEn).split(/\n+/).filter(Boolean) : [],
        overviewAr: form.overviewAr ? String(form.overviewAr).split(/\n+/).filter(Boolean) : [],
        overviewEn: form.overviewEn ? String(form.overviewEn).split(/\n+/).filter(Boolean) : [],
        validFrom: form.validFrom || null,
        validTo: form.validTo || null,
      };
      if (editingId) await branchApi.updateOffer(editingId, payload);
      else await branchApi.createOffer(payload);
      toast.success(L("تم الحفظ", "Saved"));
      setOpen(false); load();
    } catch (e: any) { toast.error(e?.message || L("فشل الحفظ", "Save failed")); }
    finally { setSaving(false); }
  }

  async function remove(o: any) {
    if (!confirm(L("حذف هذا العرض؟", "Delete this offer?"))) return;
    try { await branchApi.deleteOffer(o.id); toast.success(L("تم الحذف", "Deleted")); load(); }
    catch (e: any) { toast.error(e?.message || L("فشل الحذف", "Delete failed")); }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold">{L("عروض الفرع", "Branch offers")}</h2>
        <button onClick={openNew} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
          <Plus className="h-4 w-4" /> {L("عرض جديد", "New offer")}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          {L("لا توجد عروض بعد.", "No offers yet.")}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((o) => (
            <div key={o.id} className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-muted/20 p-4">
              <div className="min-w-0">
                <div className="text-sm font-bold truncate">{lang === "en" ? (o.titleEn || o.titleAr || o.title) : (o.titleAr || o.title)}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {o.status} · {o.priceAfter ?? o.price ?? "—"} SAR
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button onClick={() => openEdit(o)} className="rounded-lg p-2 hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => remove(o)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-background p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-extrabold">{editingId ? L("تعديل عرض", "Edit offer") : L("عرض جديد", "New offer")}</h3>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={L("العنوان (عربي)", "Title (Arabic)")} value={form.titleAr} onChange={(v) => setForm({ ...form, titleAr: v })} />
              <Field label={L("العنوان (إنجليزي)", "Title (English)")} value={form.titleEn} onChange={(v) => setForm({ ...form, titleEn: v })} />
              <div className="sm:col-span-2">
                <label className="text-xs font-bold">{L("الوصف (عربي)", "Description (Arabic)")}</label>
                <textarea rows={3} value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold">{L("الوصف (إنجليزي)", "Description (English)")}</label>
                <textarea rows={3} value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <Field label={L("السعر قبل", "Price before")} value={form.priceBefore} onChange={(v) => setForm({ ...form, priceBefore: v })} />
              <Field label={L("السعر بعد", "Price after")} value={form.priceAfter} onChange={(v) => setForm({ ...form, priceAfter: v })} />
              <Field label={L("المدة (دقائق)", "Duration (min)")} value={form.durationMinutes} onChange={(v) => setForm({ ...form, durationMinutes: v })} />
              <div>
                <label className="text-xs font-bold">{L("الحالة", "Status")}</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                  <option value="draft">draft</option>
                  <option value="active">active</option>
                  <option value="paused">paused</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <Field label={L("رابط الصورة", "Image URL")} value={form.image} onChange={(v) => setForm({ ...form, image: v })} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold">{L("مميزات (سطر لكل ميزة)", "Bullets (one per line)")}</label>
                <textarea rows={2} value={form.overviewAr} onChange={(e) => setForm({ ...form, overviewAr: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold">{L("شروط", "Terms")}</label>
                <textarea rows={2} value={form.termsAr} onChange={(e) => setForm({ ...form, termsAr: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-xl border border-border px-4 py-2 text-sm font-bold">{L("إلغاء", "Cancel")}</button>
              <button onClick={save} disabled={saving} className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60">
                {saving ? L("جارٍ الحفظ…", "Saving…") : L("حفظ", "Save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Bookings ---------------- */
function BookingsSection() {
  const { lang } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [redeemCode, setRedeemCode] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try { const d = await branchApi.listBookings({ status, search: q || undefined }); setItems(d.items || []); }
    catch (e: any) { toast.error(e?.message || L("فشل التحميل", "Failed to load")); setItems([]); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  async function updateStatus(b: any, next: string) {
    setSaving(true);
    try { await branchApi.updateBooking(b.id, { status: next }); toast.success(L("تم التحديث", "Updated")); await load(); setSelected(null); }
    catch (e: any) { toast.error(e?.message || L("فشل التحديث", "Update failed")); }
    finally { setSaving(false); }
  }
  async function redeem(b: any) {
    if (!redeemCode.trim()) { toast.error(L("أدخل الرمز", "Enter code")); return; }
    setSaving(true);
    try { await branchApi.redeemBooking(b.id, redeemCode.trim()); toast.success(L("تم تأكيد الاستخدام", "Redeemed")); setRedeemCode(""); await load(); setSelected(null); }
    catch (e: any) { toast.error(e?.message || L("فشل التأكيد", "Redeem failed")); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold">{L("حجوزات الفرع", "Branch bookings")}</h2>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-bold hover:bg-muted">
          <RefreshCw className="h-3.5 w-3.5" /> {L("تحديث", "Refresh")}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder={L("بحث...", "Search...")}
            className="w-full rounded-xl border border-border bg-background ps-9 pe-3 py-2 text-sm" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
          <option value="all">{L("كل الحالات", "All statuses")}</option>
          <option value="pending">pending</option>
          <option value="confirmed">confirmed</option>
          <option value="completed">completed</option>
          <option value="cancelled">cancelled</option>
          <option value="no_show">no_show</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          {L("لا توجد حجوزات.", "No bookings.")}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((b) => (
            <button key={b.id} onClick={() => { setSelected(b); setRedeemCode(""); }}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-3 text-start hover:bg-muted/40">
              <div className="min-w-0">
                <div className="text-sm font-bold truncate">
                  {lang === "en" ? (b.offerTitleEn || b.offerTitleAr) : (b.offerTitleAr || b.offerTitleEn)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {b.customerName || "—"} · {b.date || b.bookingDate || "—"} {b.time || b.bookingTime || ""}
                </div>
              </div>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{b.status}</span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-background p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-extrabold">{L("تفاصيل الحجز", "Booking details")}</h3>
              <button onClick={() => setSelected(null)} className="rounded-lg p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-2 text-sm">
              <Row k={L("العرض", "Offer")} v={lang === "en" ? (selected.offerTitleEn || selected.offerTitleAr) : (selected.offerTitleAr || selected.offerTitleEn)} />
              <Row k={L("العميل", "Customer")} v={selected.customerName} />
              <Row k={L("الهاتف", "Phone")} v={selected.customerPhone} />
              <Row k={L("التاريخ", "Date")} v={`${selected.date || selected.bookingDate || "—"} ${selected.time || selected.bookingTime || ""}`} />
              <Row k={L("الحالة", "Status")} v={selected.status} />
              {selected.notes && <Row k={L("ملاحظات", "Notes")} v={selected.notes} />}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button onClick={() => updateStatus(selected, "confirmed")} disabled={saving}
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 disabled:opacity-60">
                {L("تأكيد", "Confirm")}
              </button>
              <button onClick={() => updateStatus(selected, "completed")} disabled={saving}
                className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 disabled:opacity-60">
                {L("مكتمل", "Complete")}
              </button>
              <button onClick={() => updateStatus(selected, "cancelled")} disabled={saving}
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-60">
                {L("إلغاء", "Cancel")}
              </button>
              <button onClick={() => updateStatus(selected, "no_show")} disabled={saving}
                className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 disabled:opacity-60">
                {L("لم يحضر", "No-show")}
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-border p-3">
              <label className="text-xs font-bold">{L("رمز التأكيد (Redeem)", "Redeem code")}</label>
              <div className="mt-1 flex gap-2">
                <input value={redeemCode} onChange={(e) => setRedeemCode(e.target.value)}
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm" />
                <button onClick={() => redeem(selected)} disabled={saving}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60">
                  {L("تأكيد", "Redeem")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: any }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-1.5">
      <span className="text-xs font-bold text-muted-foreground">{k}</span>
      <span className="text-sm font-bold">{v || "—"}</span>
    </div>
  );
}
