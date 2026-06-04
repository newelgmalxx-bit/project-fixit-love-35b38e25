import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout, StatCard, PanelCard, Pill, PrimaryButton, GhostButton } from "@/components/admin/AdminLayout";
import { Store, CheckCircle2, Clock, XCircle, Search, Eye, Phone, Mail, MapPin, Tag, Star, Calendar, FileText, BadgeCheck, Ban, MoreHorizontal, Pencil, Loader2, KeyRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { adminPartnersApi, partnerLabel, type AdminPartner } from "@/lib/api/adminPartners";
import { adminCategoriesApi, type AdminCategory } from "@/lib/api/adminContent";

export const Route = createFileRoute("/admin/merchants")({
  head: () => ({ meta: [{ title: "إدارة المراكز | Admin" }] }),
  component: MerchantsPage,
});

type Status = "active" | "pending" | "suspended" | "rejected";
type Merchant = {
  id: string;
  name: string;
  owner: string;
  category: string;
  city: string;
  phone: string;
  email: string;
  commercialNumber: string;
  status: Status;
  rating: number;
  offers: number;
  bookings: number;
  revenue: number;
  joined: string;
  mapsUrl?: string;
  categoryIds?: number[];
  description?: string;
  terms?: string;
  password?: string;
};

const STATUS_META: Record<Status, { label: string; tone: "emerald" | "amber" | "rose" | "muted"; icon: any }> = {
  active: { label: "نشط", tone: "emerald", icon: CheckCircle2 },
  pending: { label: "قيد المراجعة", tone: "amber", icon: Clock },
  suspended: { label: "موقوف", tone: "muted", icon: Ban },
  rejected: { label: "مرفوض", tone: "rose", icon: XCircle },
};

function normalizeStatus(s: any): Status {
  const v = String(s || "").toLowerCase();
  if (v === "active" || v === "approved") return "active";
  if (v === "suspended" || v === "blocked") return "suspended";
  if (v === "rejected") return "rejected";
  return "pending";
}

function mapPartner(p: AdminPartner): Merchant {
  return {
    id: String(p.id),
    name: (p as any).vendor_name || (p as any).vendorNameAr || (p as any).vendorNameEn || p.vendorName || p.nameAr || p.nameEn || (p as any).name || partnerLabel(p),
    owner: (p as any).ownerName || (p as any).owner_name || (p as any).contactName || "—",
    category: (p as any).categoryNameAr || (p as any).category || "—",
    city: p.city || (p as any).cityName || "—",
    phone: p.phone || "—",
    email: p.email || "—",
    commercialNumber: (p as any).commercialNumber || (p as any).commercial_number || "—",
    status: normalizeStatus(p.status),
    rating: Number((p as any).rating ?? 0),
    offers: Number((p as any).offersCount ?? (p as any).offers_count ?? 0),
    bookings: Number((p as any).bookingsCount ?? (p as any).bookings_count ?? 0),
    revenue: Number((p as any).revenue ?? 0),
    joined: (p.createdAt || (p as any).created_at || "").slice(0, 10),
    mapsUrl: (p as any).mapsUrl || (p as any).maps_url || "",
  };
}

function MerchantsPage() {
  const [items, setItems] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | Status>("all");
  const [q, setQ] = useState("");
  const [viewing, setViewing] = useState<Merchant | null>(null);
  const [editing, setEditing] = useState<Merchant | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await adminPartnersApi.list({ limit: 200 });
      const base = (res.items || []).map(mapPartner);
      setItems(base);
      // Fetch real offers + bookings counts per partner in parallel
      const enriched = await Promise.all(
        base.map(async (m) => {
          try {
            const [off, bk] = await Promise.all([
              adminPartnersApi.offers(m.id, { limit: 1 }).catch(() => ({ total: 0, items: [] as any[] })),
              adminPartnersApi.bookings(m.id, { limit: 500 }).catch(() => ({ total: 0, items: [] as any[] })),
            ]);
            const revenue = (bk.items || []).reduce((s: number, b: any) => {
              const ps = String(b.paymentStatus || b.payment_status || "").toLowerCase();
              const st = String(b.status || "").toLowerCase();
              const isPaid =
                ps === "paid" ||
                ps === "captured" ||
                ps === "deposit_paid" ||
                st === "completed" ||
                st === "confirmed";
              if (!isPaid) return s;
              const amt = Number(
                b.totalAmount ?? b.total_amount ?? b.total ??
                b.amount ?? b.paidAmount ?? b.paid_amount ??
                b.depositAmount ?? b.deposit_amount ?? 0
              );
              return s + (isFinite(amt) ? amt : 0);
            }, 0);
            return { ...m, offers: off.total || (off.items?.length ?? 0), bookings: bk.total || (bk.items?.length ?? 0), revenue };
          } catch {
            return m;
          }
        })
      );
      setItems(enriched);
    } catch (e: any) {
      toast.error(e?.message || "تعذّر تحميل المراكز");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = items;
    if (tab !== "all") list = list.filter((m) => m.status === tab);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter((m) =>
        [m.name, m.owner, m.city, m.email, m.phone, m.commercialNumber].some((v) => String(v).toLowerCase().includes(s))
      );
    }
    return list;
  }, [items, tab, q]);

  const counts = {
    all: items.length,
    active: items.filter((m) => m.status === "active").length,
    pending: items.filter((m) => m.status === "pending").length,
    suspended: items.filter((m) => m.status === "suspended").length,
    rejected: items.filter((m) => m.status === "rejected").length,
  };

  async function setStatus(id: string, status: Status) {
    try {
      await adminPartnersApi.setStatus(id, status);
      setItems((arr) => arr.map((m) => (m.id === id ? { ...m, status } : m)));
      setViewing((v) => (v && v.id === id ? { ...v, status } : v));
      toast.success("تم تحديث حالة المركز");
    } catch (e: any) {
      toast.error(e?.message || "تعذّر تحديث الحالة");
    }
  }

  async function addCenter(data: Omit<Merchant, "id" | "rating" | "offers" | "bookings" | "revenue" | "joined">) {
    try {
      const res: any = await adminPartnersApi.create({
        vendorName: data.name,
        nameAr: data.name,
        city: data.city,
        phone: data.phone,
        email: data.email,
        status: data.status,
        ...({
          ownerName: data.owner,
          category: data.category,
          commercialNumber: data.commercialNumber,
          mapsUrl: data.mapsUrl,
          categoryIds: data.categoryIds || [],
          description: data.description || "",
          terms: data.terms || "",
          password: data.password || undefined,
        } as any),
      });
      const tempPwd = res?.data?.partner?.tempPassword || res?.partner?.tempPassword;
      if (tempPwd) {
        toast.success(`تمت إضافة المركز — كلمة المرور المؤقتة: ${tempPwd}`, {
          duration: 12000,
          action: { label: "نسخ", onClick: () => navigator.clipboard.writeText(tempPwd) },
        });
      } else {
        toast.success("تمت إضافة المركز");
      }
      setAddOpen(false);
      load();
    } catch (e: any) {
      toast.error(e?.message || "تعذّر إضافة المركز");
    }
  }

  async function updateCenter(id: string, data: Omit<Merchant, "id" | "rating" | "offers" | "bookings" | "revenue" | "joined">) {
    try {
      await adminPartnersApi.update(id, {
        vendorName: data.name,
        nameAr: data.name,
        city: data.city,
        phone: data.phone,
        email: data.email,
        status: data.status,
        ...({
          ownerName: data.owner,
          category: data.category,
          commercialNumber: data.commercialNumber,
          mapsUrl: data.mapsUrl,
          categoryIds: data.categoryIds || [],
          description: data.description || "",
          terms: data.terms || "",
        } as any),
      });
      toast.success("تم تحديث بيانات المركز");
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e?.message || "تعذّر التحديث");
    }
  }

  const revenueTotal = items.reduce((s, m) => s + m.revenue, 0);

  return (
    <AdminLayout
      title="إدارة المراكز"
      subtitle="راجع وفعّل المراكز، تابع أداءها والتزامها بمعايير المنصة"
      action={
        <PrimaryButton onClick={() => setAddOpen(true)}>
          <Store className="h-4 w-4" /> إضافة مركز يدوي
        </PrimaryButton>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="إجمالي المراكز" value={counts.all} icon={Store} accent="primary" hint={`${counts.active} نشط`} />
        <StatCard label="بانتظار المراجعة" value={counts.pending} icon={Clock} accent="amber" hint="يحتاج إجراء" />
        <StatCard label="مراكز موقوفة" value={counts.suspended} icon={Ban} accent="rose" />
        <StatCard label="إجمالي الإيرادات" value={`${revenueTotal.toLocaleString()} ر.س`} icon={BadgeCheck} accent="emerald" />
      </div>

      <PanelCard
        className="mt-6"
        title={`قائمة المراكز (${filtered.length})`}
        subtitle="اعتمد أو ارفض طلبات الانضمام، وعدّل حالة المراكز النشطة."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث باسم المركز، المالك، السجل التجاري…"
                className="h-10 w-64 rounded-xl border border-border bg-background pe-9 ps-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <button onClick={load} className="rounded-xl border border-border px-3 py-2 text-xs font-bold hover:bg-muted">تحديث</button>
          </div>
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { v: "all", l: "الكل", c: counts.all },
            { v: "pending", l: "قيد المراجعة", c: counts.pending },
            { v: "active", l: "نشط", c: counts.active },
            { v: "suspended", l: "موقوف", c: counts.suspended },
            { v: "rejected", l: "مرفوض", c: counts.rejected },
          ].map((o) => (
            <button
              key={o.v}
              onClick={() => setTab(o.v as typeof tab)}
              className={[
                "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition",
                tab === o.v ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {o.l} <span className="opacity-70">({o.c})</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-xs font-bold text-muted-foreground">
              <tr>
                <th className="p-3 text-start">المركز</th>
                <th className="p-3 text-start">التواصل</th>
                <th className="p-3 text-start">رقم التواصل</th>
                <th className="p-3 text-start">التصنيف · المدينة</th>
                <th className="p-3 text-start">العروض</th>
                <th className="p-3 text-start">الحجوزات</th>
                <th className="p-3 text-start">الإيراد</th>
                <th className="p-3 text-start">التقييم</th>
                <th className="p-3 text-start">الحالة</th>
                <th className="p-3 text-end">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const s = STATUS_META[m.status];
                return (
                  <tr key={m.id} className="border-t border-border hover:bg-muted/20">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#3F2A6B] to-[#E0254D] text-sm font-extrabold text-white">
                          {(m.name || "?").charAt(0)}
                        </div>
                        <div>
                          <div className="font-extrabold text-foreground">{m.name}</div>
                          <div className="text-xs text-muted-foreground">{m.owner}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm font-bold text-foreground" dir="ltr">{m.email}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm font-bold text-foreground" dir="ltr">{m.phone}</div>
                    </td>
                    <td className="p-3 text-sm">
                      <div className="font-bold text-foreground">{m.category}</div>
                      <div className="text-xs text-muted-foreground">{m.city}</div>
                    </td>
                    <td className="p-3 font-bold">{m.offers}</td>
                    <td className="p-3 font-bold">{m.bookings}</td>
                    <td className="p-3 font-bold" dir="ltr">{m.revenue.toLocaleString()} ر.س</td>
                    <td className="p-3">
                      {m.rating > 0 ? (
                        <span className="inline-flex items-center gap-1 text-sm font-bold">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {m.rating}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <Pill tone={s.tone}>
                        <s.icon className="h-3 w-3" /> {s.label}
                      </Pill>
                    </td>
                    <td className="p-3 text-end">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setViewing(m)}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-bold hover:bg-muted"
                        >
                          <Eye className="h-3.5 w-3.5" /> عرض
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {m.status === "pending" && (
                              <>
                                <DropdownMenuItem onClick={() => setStatus(m.id, "active")}>
                                  <CheckCircle2 className="me-2 h-4 w-4 text-emerald-600" /> اعتماد المركز
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatus(m.id, "rejected")}>
                                  <XCircle className="me-2 h-4 w-4 text-rose-600" /> رفض الطلب
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem onClick={() => setEditing(m)}>
                              <Pencil className="me-2 h-4 w-4" /> تعديل البيانات
                            </DropdownMenuItem>
                            {m.status === "active" && (
                              <DropdownMenuItem onClick={() => setStatus(m.id, "suspended")}>
                                <Ban className="me-2 h-4 w-4 text-amber-600" /> إيقاف مؤقت
                              </DropdownMenuItem>
                            )}
                            {(m.status === "suspended" || m.status === "rejected") && (
                              <DropdownMenuItem onClick={() => setStatus(m.id, "active")}>
                                <CheckCircle2 className="me-2 h-4 w-4 text-emerald-600" /> إعادة تفعيل
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-10 text-center text-sm text-muted-foreground">لا توجد مراكز مطابقة</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}
      </PanelCard>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-2xl">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle className="text-end">{viewing.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4" dir="rtl">
                <div className="flex flex-wrap items-center gap-2">
                  {(() => {
                    const s = STATUS_META[viewing.status];
                    return (
                      <Pill tone={s.tone}>
                        <s.icon className="h-3 w-3" /> {s.label}
                      </Pill>
                    );
                  })()}
                  <Pill tone="primary"><Tag className="h-3 w-3" /> {viewing.category}</Pill>
                  <Pill tone="muted"><MapPin className="h-3 w-3" /> {viewing.city}</Pill>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 text-sm">
                  <div className="flex items-center gap-2"><Store className="h-4 w-4 text-primary" /> {viewing.owner}</div>
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> <span dir="ltr">{viewing.phone}</span></div>
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> {viewing.email}</div>
                  <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> س.ت: <span dir="ltr">{viewing.commercialNumber}</span></div>
                  <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> انضم: {viewing.joined || "—"}</div>
                  <div className="flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" /> {viewing.rating > 0 ? `${viewing.rating} / 5` : "بدون تقييم"}</div>
                  {viewing.mapsUrl && (
                    <a href={viewing.mapsUrl} target="_blank" rel="noopener noreferrer" className="sm:col-span-2 inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 font-bold text-primary hover:bg-primary/10">
                      <MapPin className="h-4 w-4" /> فتح الموقع على خرائط جوجل
                    </a>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3 rounded-2xl border border-border bg-muted/30 p-4 text-center">
                  <div>
                    <div className="text-2xl font-black">{viewing.offers}</div>
                    <div className="text-xs text-muted-foreground">عرض</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black">{viewing.bookings}</div>
                    <div className="text-xs text-muted-foreground">حجز</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black" dir="ltr">{viewing.revenue.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">إيراد (ر.س)</div>
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                {viewing.status === "pending" && (
                  <>
                    <GhostButton onClick={() => setStatus(viewing.id, "rejected")}>رفض</GhostButton>
                    <PrimaryButton onClick={() => setStatus(viewing.id, "active")}>اعتماد المركز</PrimaryButton>
                  </>
                )}
                {viewing.status === "active" && (
                  <GhostButton onClick={() => setStatus(viewing.id, "suspended")}>إيقاف مؤقت</GhostButton>
                )}
                {(viewing.status === "suspended" || viewing.status === "rejected") && (
                  <PrimaryButton onClick={() => setStatus(viewing.id, "active")}>إعادة تفعيل</PrimaryButton>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AddCenterDialog open={addOpen} onClose={() => setAddOpen(false)} onSave={addCenter} />
      <AddCenterDialog
        open={!!editing}
        onClose={() => setEditing(null)}
        initial={editing || undefined}
        onSave={(data) => editing && updateCenter(editing.id, data)}
      />
    </AdminLayout>
  );
}

function AddCenterDialog({
  open, onClose, onSave, initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (m: Omit<Merchant, "id" | "rating" | "offers" | "bookings" | "revenue" | "joined">) => void;
  initial?: Merchant;
}) {
  const empty = {
    name: "", owner: "", category: "", city: "", phone: "", email: "",
    commercialNumber: "", mapsUrl: "", status: "active" as Status,
    categoryIds: [] as number[], description: "", terms: "", password: "",
  };
  const [f, setF] = useState(empty);
  const [cats, setCats] = useState<AdminCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);

  useEffect(() => {
    if (!open) return;
    setF(initial ? {
      name: initial.name, owner: initial.owner, category: initial.category, city: initial.city,
      phone: initial.phone, email: initial.email, commercialNumber: initial.commercialNumber,
      mapsUrl: initial.mapsUrl || "", status: initial.status,
      categoryIds: initial.categoryIds || [],
      description: initial.description || "",
      terms: initial.terms || "",
      password: "",
    } : empty);
    // load categories list once dialog opens
    setLoadingCats(true);
    adminCategoriesApi.list({})
      .then((d: any) => setCats((d?.items || d || []) as AdminCategory[]))
      .catch(() => setCats([]))
      .finally(() => setLoadingCats(false));
  }, [open, initial]);

  function up<K extends keyof typeof f>(k: K, v: (typeof f)[K]) { setF((p) => ({ ...p, [k]: v })); }
  function reset() { setF(empty); }
  function toggleCat(id: number) {
    setF((p) => ({
      ...p,
      categoryIds: p.categoryIds.includes(id) ? p.categoryIds.filter((x) => x !== id) : [...p.categoryIds, id],
    }));
  }
  function genPwd() {
    const s = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 4).toUpperCase();
    up("password", s);
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) { toast.error("اسم المركز مطلوب"); return; }
    if (!f.owner.trim()) { toast.error("اسم المالك مطلوب"); return; }
    if (!f.city.trim()) { toast.error("المدينة مطلوبة"); return; }
    if (!f.phone.trim()) { toast.error("رقم الجوال مطلوب"); return; }
    if (!initial && !f.email.trim()) { toast.error("البريد الإلكتروني مطلوب لإرسال بيانات الدخول"); return; }
    onSave({ ...f });
    reset();
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && (reset(), onClose())}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader><DialogTitle className="text-end">{initial ? "تعديل بيانات المركز" : "إضافة مركز يدوي"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs font-bold">اسم المركز *</label>
            <input value={f.name} onChange={(e) => up("name", e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold">اسم المالك *</label>
            <input value={f.owner} onChange={(e) => up("owner", e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold">المدينة *</label>
            <input value={f.city} onChange={(e) => up("city", e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold">رقم الجوال *</label>
            <input value={f.phone} onChange={(e) => up("phone", e.target.value)} placeholder="+966…" className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold">البريد الإلكتروني {initial ? "" : "*"}</label>
            <input value={f.email} onChange={(e) => up("email", e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold">السجل التجاري</label>
            <input value={f.commercialNumber} onChange={(e) => up("commercialNumber", e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-bold">رابط الموقع على خرائط جوجل</label>
            <input dir="ltr" value={f.mapsUrl} onChange={(e) => up("mapsUrl", e.target.value)} placeholder="https://maps.app.goo.gl/..." className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          </div>

          {/* Categories multi-select */}
          <div className="sm:col-span-2">
            <label className="text-xs font-bold flex items-center gap-2">
              <Tag className="h-3.5 w-3.5" /> التصنيفات (يمكن اختيار أكثر من واحد)
            </label>
            <div className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-border bg-muted/30 p-2">
              {loadingCats ? (
                <div className="flex items-center justify-center py-3 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : cats.length === 0 ? (
                <div className="py-2 text-center text-xs text-muted-foreground">لا توجد تصنيفات</div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {cats.map((c) => {
                    const checked = f.categoryIds.includes(Number(c.id));
                    return (
                      <label key={c.id} className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs cursor-pointer transition ${checked ? "border-primary bg-primary/10 font-bold" : "border-border bg-background hover:bg-muted"}`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleCat(Number(c.id))} className="accent-primary" />
                        <span className="truncate">{c.nameAr || c.nameEn || c.slug}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">{f.categoryIds.length} تصنيف محدد</p>
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label className="text-xs font-bold">وصف المركز</label>
            <textarea
              rows={3}
              value={f.description}
              onChange={(e) => up("description", e.target.value)}
              placeholder="نبذة عن المركز وخدماته..."
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Terms */}
          <div className="sm:col-span-2">
            <label className="text-xs font-bold">شروط المركز</label>
            <textarea
              rows={3}
              value={f.terms}
              onChange={(e) => up("terms", e.target.value)}
              placeholder="الشروط الخاصة بالمركز (سياسة الإلغاء، التحضير قبل الموعد...)"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Password — create only */}
          {!initial && (
            <div className="sm:col-span-2">
              <label className="text-xs font-bold flex items-center gap-2">
                <KeyRound className="h-3.5 w-3.5" /> كلمة مرور المركز (اختياري)
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  dir="ltr"
                  value={f.password}
                  onChange={(e) => up("password", e.target.value)}
                  placeholder="اتركها فارغة لتوليد تلقائي وإرسالها بالإيميل"
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono"
                />
                <button type="button" onClick={genPwd} className="rounded-xl border border-border bg-muted px-3 py-2 text-xs font-bold hover:bg-muted/70">توليد</button>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                سيتم إرسال بيانات الدخول للمركز على بريده الإلكتروني تلقائياً.
              </p>
            </div>
          )}

          <div className="sm:col-span-2">
            <label className="text-xs font-bold">الحالة</label>
            <select value={f.status} onChange={(e) => up("status", e.target.value as Status)} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
              <option value="active">نشط</option>
              <option value="pending">قيد المراجعة</option>
              <option value="suspended">موقوف</option>
            </select>
          </div>
          <DialogFooter className="sm:col-span-2">
            <button type="button" onClick={() => { reset(); onClose(); }} className="rounded-xl border border-border px-4 py-2 text-sm font-bold">إلغاء</button>
            <button type="submit" className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground">حفظ المركز</button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
