import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { AdminLayout, PanelCard } from "@/components/admin/AdminLayout";
import { generateTimeSlotsBetween } from "@/lib/timeSlots";
import { admin } from "@/lib/api/admin";
import { adminPartnersApi, partnerLabel, type AdminPartner } from "@/lib/api/adminPartners";
import { Calendar, Store, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Weekly schedule order used across partner dashboard: Sat→Fri
// JS Date.getDay(): Sun=0, Mon=1, ... Sat=6 → map to this order
const DAY_INDEX_FROM_JS = [1, 2, 3, 4, 5, 6, 0]; // [Sun..Sat] → [Sat-first index]
type DayHours = { day: string; open: string; close: string; closed: boolean };
const DEFAULT_HOURS: DayHours[] = [
  { day: "السبت", open: "09:00", close: "22:00", closed: false },
  { day: "الأحد", open: "09:00", close: "22:00", closed: false },
  { day: "الإثنين", open: "09:00", close: "22:00", closed: false },
  { day: "الثلاثاء", open: "09:00", close: "22:00", closed: false },
  { day: "الأربعاء", open: "09:00", close: "22:00", closed: false },
  { day: "الخميس", open: "09:00", close: "22:00", closed: false },
  { day: "الجمعة", open: "09:00", close: "22:00", closed: true },
];


export const Route = createFileRoute("/admin/schedule")({
  head: () => ({ meta: [{ title: "إدارة المواعيد | Admin" }] }),
  component: SchedulePage,
});

function SchedulePage() {
  const [vendors, setVendors] = useState<AdminPartner[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setVendorsLoading(true);

    adminPartnersApi.list({ limit: 200 })
      .then((res) => {
        if (!alive) return;
        setVendors(Array.isArray(res.items) ? res.items : []);
      })
      .catch((e: any) => {
        if (!alive) return;
        setVendors([]);
        toast.error(e?.message || "تعذّر تحميل المراكز");
      })
      .finally(() => {
        if (alive) setVendorsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const [vendorId, setVendorId] = useState("");
  useEffect(() => {
    if (!vendorId && vendors[0]?.id) setVendorId(vendors[0].id);
  }, [vendors, vendorId]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Load partner's weekly working hours
  const [weekly, setWeekly] = useState<DayHours[]>(DEFAULT_HOURS);
  useEffect(() => {
    if (!vendorId) return;
    let alive = true;
    admin.getPartnerWeekly(vendorId)
      .then((res: any) => {
        if (!alive) return;
        const wh = res?.data?.workingHours ?? res?.workingHours;
        let parsed: any = wh;
        if (typeof wh === "string") {
          try { parsed = JSON.parse(wh); } catch { parsed = null; }
        }
        if (Array.isArray(parsed) && parsed.length === 7) setWeekly(parsed);
        else setWeekly(DEFAULT_HOURS);
      })
      .catch(() => { if (alive) setWeekly(DEFAULT_HOURS); });
    return () => { alive = false; };
  }, [vendorId]);

  // Determine today's open/close from weekly schedule
  const today = useMemo(() => {
    const d = new Date(date + "T00:00:00");
    const idx = DAY_INDEX_FROM_JS[d.getDay()];
    return weekly[idx] ?? DEFAULT_HOURS[idx];
  }, [date, weekly]);

  const slots = useMemo(
    () => (today.closed ? [] : generateTimeSlotsBetween(today.open, today.close, 30)),
    [today],
  );


  const [blocked, setBlocked] = useState<string[]>([]);
  const [dayOff, setDayOff] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  async function loadBlocked() {
    if (!vendorId || !date) return;
    setLoading(true);
    try {
      const res: any = await admin.getPartnerBlockedDate(vendorId, date);
      const data = res?.data ?? res;
      setBlocked(Array.isArray(data?.slots) ? data.slots : []);
      setDayOff(!!data?.dayOff);
    } catch (e: any) {
      toast.error(e?.message || "تعذّر تحميل المواعيد المعطّلة");
      setBlocked([]);
      setDayOff(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadBlocked(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [vendorId, date]);

  async function handleToggle(time: string) {
    if (dayOff || !vendorId) return;
    setSaving(time);
    try {
      const res: any = await admin.togglePartnerBlockedSlot(vendorId, date, time);
      const data = res?.data ?? res;
      setBlocked(Array.isArray(data?.slots) ? data.slots : []);
      setDayOff(!!data?.dayOff);
    } catch (e: any) {
      toast.error(e?.message || "تعذّر التحديث");
    } finally {
      setSaving(null);
    }
  }

  async function handleToggleDay() {
    if (!vendorId) return;
    setSaving("__day__");
    try {
      const res: any = await admin.setPartnerBlockedDayOff(vendorId, date, !dayOff);
      const data = res?.data ?? res;
      setDayOff(!!data?.dayOff);
      setBlocked(Array.isArray(data?.slots) ? data.slots : []);
      toast.success(data?.dayOff ? "تم تعطيل اليوم" : "تم تفعيل اليوم");
    } catch (e: any) {
      toast.error(e?.message || "تعذّر التحديث");
    } finally {
      setSaving(null);
    }
  }

  return (
    <AdminLayout
      title="إدارة المواعيد والتعطيل"
      subtitle="عطّل أوقات معينة لأي مركز في يوم معين عند الزحمة أو عدم التوفر"
    >
      <div className="space-y-4">
        <PanelCard title="اختيار المركز والتاريخ">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                <Store className="h-3.5 w-3.5" /> المركز
              </span>
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                disabled={vendorsLoading}
                className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold outline-none focus:border-primary"
              >
                {vendors.length === 0 && <option value="">— لا توجد مراكز —</option>}
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{partnerLabel(v)}{v.city ? ` — ${v.city}` : ""}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" /> التاريخ
              </span>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold outline-none focus:border-primary [color-scheme:light]"
              />
            </label>
          </div>
        </PanelCard>

        <PanelCard title="المواعيد - اضغط على الوقت لتعطيله/تفعيله">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-3">
            <div className="text-sm font-bold">
              تعطيل اليوم بالكامل ({date})
              {dayOff && <span className="ms-2 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-extrabold text-rose-700">معطّل بالكامل</span>}
            </div>
            <button
              type="button"
              onClick={handleToggleDay}
              disabled={!vendorId || saving === "__day__"}
              className={`rounded-full px-4 py-2 text-xs font-extrabold transition disabled:opacity-50 ${
                dayOff
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-rose-600 text-white hover:bg-rose-700"
              }`}
            >
              {saving === "__day__" ? "..." : dayOff ? "تفعيل اليوم" : "تعطيل اليوم كامل"}
            </button>
          </div>

          <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              المواعيد المشطوبة باللون الأحمر تعتبر <strong>غير متاحة</strong> للحجز،
              والعميل لن يقدر يحجزها. التعطيل هنا بيتم على مستوى المركز بالكامل.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : slots.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {today.closed
                ? `المركز مغلق يوم ${today.day} حسب مواعيد العمل.`
                : "لا توجد مواعيد متاحة في هذا اليوم."}
            </p>

          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {slots.map((s) => {
                const isBlocked = dayOff || blocked.includes(s);
                const isSaving = saving === s;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={dayOff || isSaving}
                    onClick={() => handleToggle(s)}
                    className={`rounded-xl border-2 px-3 py-3 text-sm font-extrabold transition ${
                      isBlocked
                        ? "border-dashed border-rose-300 bg-rose-50 text-rose-600 line-through"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400"
                    } ${dayOff ? "opacity-60 cursor-not-allowed" : ""} ${isSaving ? "opacity-50" : ""}`}
                    title={dayOff ? "اليوم معطّل بالكامل" : isBlocked ? "اضغط للتفعيل" : "اضغط للتعطيل"}
                  >
                    {isSaving ? "..." : s}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded border-2 border-emerald-200 bg-emerald-50" />
              متاح
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded border-2 border-dashed border-rose-300 bg-rose-50" />
              معطّل
            </span>
          </div>
        </PanelCard>
      </div>
    </AdminLayout>
  );
}
