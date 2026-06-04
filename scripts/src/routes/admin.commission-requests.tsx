import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout, PanelCard, Pill } from "@/components/admin/AdminLayout";
import { adminCommissionRequestsApi } from "@/lib/api/adminCommissionRequests";
import { adminPartnersApi } from "@/lib/api/adminPartners";
import { adminAgreementsApi } from "@/lib/api/adminAgreements";
import { toast } from "sonner";
import { Check, X, Loader2, Percent, Search, FileText } from "lucide-react";


export const Route = createFileRoute("/admin/commission-requests")({
  head: () => ({ meta: [{ title: "طلبات تعديل العمولة | الإدارة" }] }),
  component: CommissionRequestsPage,
});

type Req = {
  id: string;
  partner_id: string;
  current_commission_pct: number | null;
  current_deposit_pct: number | null;
  requested_commission_pct: number;
  requested_deposit_pct: number;
  reason: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
};

type Partner = { id: string; vendor_name: string; owner_name: string; city: string; phone: string };


function CommissionRequestsPage() {
  const [items, setItems] = useState<Req[]>([]);
  const [partners, setPartners] = useState<Record<string, Partner>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    try {
      const res = await adminCommissionRequestsApi.list();
      const map: Record<string, Partner> = {};

      // Seed from joined fields returned by the list endpoint (may be partial)
      res.items.forEach((r: any) => {
        if (r.partnerId && !map[r.partnerId]) {
          map[r.partnerId] = {
            id: r.partnerId,
            vendor_name: r.partnerName || r.partner_name || r.vendorName || r.vendor_name || "",
            owner_name: r.ownerName || r.owner_name || "",
            city: r.partnerCity || r.city || "",
            phone: r.partnerPhone || r.partner_phone || r.phone || "",
          };
        }
      });

      // Always enrich every partner via /admin/partners/{id} so we get
      // the canonical vendor name, city, owner & commission settings.
      // Also fetch latest signed agreement to use its commission/deposit
      // as the "current" fallback (same source as agreements page).
      const ids = Array.from(new Set(res.items.map((r: any) => r.partnerId).filter(Boolean))) as string[];
      const enriched: Record<string, any> = {};
      const latestAg: Record<string, any> = {};
      await Promise.all(
        ids.map(async (pid) => {
          try {
            const p: any = await adminPartnersApi.get(pid);
            enriched[pid] = p;
            map[pid] = {
              id: pid,
              vendor_name:
                p.vendorName || p.vendor_name || p.nameAr || p.name_ar || p.name ||
                map[pid]?.vendor_name || "",
              owner_name:
                p.ownerName || p.owner_name || map[pid]?.owner_name || "",
              city: p.city || map[pid]?.city || "",
              phone: p.phone || map[pid]?.phone || "",
            };
          } catch { /* ignore */ }
          try {
            const ags = await adminAgreementsApi.listPartnerAgreements(pid);
            const signed = ags
              .filter((a) => a.status === "signed")
              .sort((a, b) => (b.signedAt || b.createdAt || "").localeCompare(a.signedAt || a.createdAt || ""))[0];
            latestAg[pid] = signed
              || ags.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))[0]
              || null;
          } catch { /* ignore */ }
        })
      );

      const rows: Req[] = res.items.map((r) => {
        const p = enriched[r.partnerId] || {};
        const ag = latestAg[r.partnerId];
        const fallbackCurrent =
          (ag && typeof ag.commissionPct === "number" ? ag.commissionPct : null) ??
          p.commissionPct ?? p.commission_pct ?? null;
        const fallbackDeposit =
          (ag && typeof ag.depositPct === "number" ? ag.depositPct : null) ??
          p.depositPct ?? p.deposit_pct ?? null;
        const rawCurCom = r.currentCommissionPct ?? (r as any).current_commission_pct;
        const rawCurDep = r.currentDepositPct ?? (r as any).current_deposit_pct;
        // Treat 0/null/undefined as "missing" so we fall back to the latest agreement
        const curCom = rawCurCom != null && Number(rawCurCom) > 0 ? Number(rawCurCom) : fallbackCurrent;
        const curDep = rawCurDep != null && Number(rawCurDep) > 0 ? Number(rawCurDep) : fallbackDeposit;
        return {
          id: r.id,
          partner_id: r.partnerId,
          current_commission_pct: curCom,
          current_deposit_pct: curDep,
          requested_commission_pct: r.requestedCommissionPct,
          requested_deposit_pct: r.requestedDepositPct,
          reason: r.reason,
          status: r.status,
          admin_notes: r.adminNotes ?? null,
          created_at: r.createdAt,
        };
      });


      setItems(rows);
      setPartners(map);
    } catch (err: any) {
      toast.error(err?.message || "تعذّر تحميل الطلبات");
      setItems([]);
      setPartners({});
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function decide(req: Req, status: "approved" | "rejected") {
    const adminNote = notes[req.id] || null;

    if (req.id.startsWith("demo-")) {
      setItems((prev) => prev.map((r) => r.id === req.id ? { ...r, status, admin_notes: adminNote } : r));
      toast.success(status === "approved" ? "تمت الموافقة (بيانات تجريبية)" : "تم رفض الطلب (بيانات تجريبية)");
      return;
    }

    try {
      await adminCommissionRequestsApi.decide(req.id, status, adminNote);
      toast.success(status === "approved" ? "تمت الموافقة وتحديث النسبة" : "تم رفض الطلب");
      load();
    } catch (err: any) {
      toast.error(err?.message || "تعذّر تحديث الطلب");
    }
  }

  const byStatus = filter === "all" ? items : items.filter((i) => i.status === filter);
  const q = search.trim().toLowerCase();
  const filtered = q
    ? byStatus.filter((i) => {
        const p = partners[i.partner_id];
        if (!p) return false;
        return (
          p.vendor_name?.toLowerCase().includes(q) ||
          p.owner_name?.toLowerCase().includes(q) ||
          p.phone?.toLowerCase().includes(q)
        );
      })
    : byStatus;
  const pendingCount = items.filter((i) => i.status === "pending").length;

  return (
    <AdminLayout
      title="طلبات تعديل العمولة"
      subtitle={`${pendingCount} طلب بانتظار المراجعة`}
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl border border-border bg-card p-1">
          {([
            ["all", "الكل", items.length],
            ["pending", "بانتظار", pendingCount],
            ["approved", "مقبولة", items.filter((i) => i.status === "approved").length],
            ["rejected", "مرفوضة", items.filter((i) => i.status === "rejected").length],
          ] as const).map(([k, l, n]) => (

            <button
              key={k}
              onClick={() => setFilter(k as any)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold ${filter === k ? "bg-primary text-primary-foreground" : "text-foreground/60"}`}
            >
              {l} <span className="opacity-70">({n})</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم المركز أو رقم الهاتف…"
            className="w-full rounded-xl border border-border bg-background ps-10 pe-3 py-2 text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <PanelCard title="">
          <div className="py-12 text-center text-sm text-muted-foreground">
            {q ? "لا توجد نتائج مطابقة للبحث." : "لا توجد طلبات في هذا التصنيف."}
          </div>
        </PanelCard>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => {
            const p = partners[r.partner_id];
            const tone = r.status === "approved" ? "emerald" : r.status === "rejected" ? "rose" : "amber";
            const label = r.status === "approved" ? "مقبول" : r.status === "rejected" ? "مرفوض" : "بانتظار";
            return (
              <PanelCard
                key={r.id}
                title={p?.vendor_name || p?.owner_name || "مركز"}
                subtitle={p ? [p.owner_name, p.city, p.phone].filter(Boolean).join(" · ") : r.partner_id}
                action={<Pill tone={tone as any}>{label}</Pill>}
              >
                <div className="rounded-2xl border border-border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                    <Percent className="h-3.5 w-3.5" /> نسبة العمولة / العربون
                    <span className="text-[10px] font-medium text-muted-foreground/70">(العربون الذي يدفعه العميل هو عمولة المنصة)</span>
                  </div>
                  <div className="mt-1 text-lg font-extrabold">
                    <span className="text-muted-foreground">{r.current_commission_pct ?? "—"}%</span>
                    <span className="mx-2 text-muted-foreground">←</span>
                    <span className="text-primary">{r.requested_commission_pct}%</span>
                  </div>
                </div>


                <div className="mt-4 rounded-2xl border border-border bg-card/60 p-4">
                  <div className="flex items-center gap-2 mb-3 text-sm font-bold">
                    <FileText className="h-4 w-4 text-primary" /> تفاصيل الطلب
                  </div>
                  <dl className="grid gap-y-2 gap-x-4 text-sm sm:grid-cols-2">
                    <div className="flex justify-between sm:block">
                      <dt className="text-xs font-bold text-muted-foreground">المركز (مقدّم الخدمة)</dt>
                      <dd className="font-semibold">{p?.vendor_name || "—"}</dd>
                    </div>
                    <div className="flex justify-between sm:block">
                      <dt className="text-xs font-bold text-muted-foreground">المسؤول</dt>
                      <dd className="font-semibold">{p?.owner_name || "—"}</dd>
                    </div>
                    <div className="flex justify-between sm:block">
                      <dt className="text-xs font-bold text-muted-foreground">المدينة</dt>
                      <dd className="font-semibold">{p?.city || "—"}</dd>
                    </div>
                    <div className="flex justify-between sm:block">
                      <dt className="text-xs font-bold text-muted-foreground">رقم الهاتف</dt>
                      <dd className="font-semibold" dir="ltr">{p?.phone || "—"}</dd>
                    </div>
                    <div className="flex justify-between sm:block">
                      <dt className="text-xs font-bold text-muted-foreground">تاريخ الإرسال</dt>
                      <dd className="font-semibold">{new Date(r.created_at).toLocaleString("ar")}</dd>
                    </div>
                    <div className="flex justify-between sm:block">
                      <dt className="text-xs font-bold text-muted-foreground">الحالة</dt>
                      <dd className="font-semibold">{label}</dd>
                    </div>
                  </dl>

                  <div className="mt-3 rounded-xl border border-border bg-background p-3 text-sm">
                    <div className="text-xs font-bold text-muted-foreground mb-1">سبب الطلب كاملًا</div>
                    <div className="whitespace-pre-wrap leading-relaxed">{r.reason || "لم يُذكر سبب."}</div>
                  </div>

                  {r.status !== "pending" && (
                    <div
                      className={`mt-3 rounded-xl border p-3 text-sm ${r.status === "approved" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900"}`}
                    >
                      <div className="text-xs font-bold mb-1">
                        {r.status === "approved" ? "ملاحظة الموافقة" : "سبب الرفض"}
                      </div>
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {r.admin_notes || (r.status === "approved" ? "تمت الموافقة دون ملاحظات إضافية." : "تم الرفض دون ملاحظات إضافية.")}
                      </div>
                    </div>
                  )}
                </div>

                {r.status === "pending" && (
                  <div className="mt-4 space-y-3">
                    <textarea
                      value={notes[r.id] || ""}
                      onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                      placeholder="ملاحظة الإدارة (سبب الموافقة أو الرفض)…"
                      rows={2}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => decide(r, "approved")}
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        <Check className="h-4 w-4" /> موافقة وتطبيق النسبة
                      </button>
                      <button
                        onClick={() => decide(r, "rejected")}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
                      >
                        <X className="h-4 w-4" /> رفض
                      </button>
                    </div>
                  </div>
                )}
              </PanelCard>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}

