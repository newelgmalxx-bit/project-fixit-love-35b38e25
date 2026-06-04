import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, Clock, MapPin, QrCode, CheckCircle2, Ticket, X, Pencil } from "lucide-react";
import { toast } from "sonner";
import { AccountLayout } from "@/components/account/AccountLayout";


export const Route = createFileRoute("/account/bookings")({
  head: () => ({ meta: [{ title: "حجوزاتي | بوكينج" }] }),
  component: MyBookings,
});

type StoredBooking = {
  bookingId: string;
  verifyCode: string;
  offerId: string;
  offerTitle?: string;
  vendorName?: string;
  vendorCity?: string;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  total?: number;
  depositAmount?: number;
  remainingAmount?: number;
  redeemedAt?: string;
  cancelledAt?: string;
  createdAt: string;
};

function loadAll(): StoredBooking[] {
  try {
    const raw = localStorage.getItem("myBookings");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveAll(list: StoredBooking[]) {
  try { localStorage.setItem("myBookings", JSON.stringify(list)); } catch {}
}

function MyBookings() {
  const [items, setItems] = useState<StoredBooking[]>([]);
  const [edit, setEdit] = useState<StoredBooking | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");

  function refresh() {
    const list = loadAll();
    setItems(list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")));
  }

  useEffect(() => { refresh(); }, []);

  function cancelBooking(id: string) {
    if (!confirm("هل أنت متأكد من إلغاء هذا الحجز؟")) return;
    const list = loadAll().map((b) => b.bookingId === id ? { ...b, cancelledAt: new Date().toISOString() } : b);
    saveAll(list);
    toast.success("تم إلغاء الحجز");
    refresh();
  }

  function openEdit(b: StoredBooking) {
    setEdit(b);
    setEditDate(b.date);
    setEditTime(b.time);
  }

  function saveEdit() {
    if (!edit) return;
    if (!editDate || !editTime) { toast.error("اختر تاريخ ووقت"); return; }
    const list = loadAll().map((b) => b.bookingId === edit.bookingId ? { ...b, date: editDate, time: editTime } : b);
    saveAll(list);
    toast.success("تم تعديل الموعد");
    setEdit(null);
    refresh();
  }

  return (
    <AccountLayout title="حجوزاتي" subtitle="كل حجوزاتك في مكان واحد — أظهر الباركود أو الرمز عند المركز">
      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Ticket className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-extrabold">لا توجد حجوزات بعد</h3>
          <p className="mt-1 text-sm text-muted-foreground">تصفّح العروض واحجز خدمتك المفضلة الآن.</p>
          <Link to="/offers" className="mt-5 inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90">
            تصفّح العروض
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((b) => {
            const offerTitle = b.offerTitle || "خدمة";
            const venue = b.vendorName ? `${b.vendorName}${b.vendorCity ? ` — ${b.vendorCity}` : ""}` : "";
            const isPast = b.date && new Date(b.date) < new Date(new Date().toDateString());
            const canModify = !b.redeemedAt && !b.cancelledAt && !isPast;
            return (
              <div key={b.bookingId} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:border-primary/40 hover:shadow-md">
                <div className="flex items-start justify-between gap-3 border-b border-border bg-muted/30 px-5 py-3">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">رقم الحجز</div>
                    <div dir="ltr" className="text-base font-black tracking-wider text-foreground">{b.bookingId}</div>
                  </div>
                  {b.cancelledAt ? (
                    <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-700">ملغي</span>
                  ) : b.redeemedAt ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" /> تم الاستخدام
                    </span>
                  ) : (
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">مؤكد</span>
                  )}
                </div>
                <div className="grid gap-3 p-5 sm:grid-cols-[1fr,auto] sm:items-center">
                  <div className="space-y-2 text-sm">
                    <div className="font-extrabold text-foreground">{offerTitle}</div>
                    {venue && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" /> {venue}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {b.date}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {b.time}</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-1.5 text-amber-800">
                      <span className="text-[11px] font-bold">رمز التأكيد</span>
                      <span dir="ltr" className="font-black tracking-[0.3em]">{b.verifyCode}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to="/booking/$bookingId"
                      params={{ bookingId: b.bookingId }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary bg-primary/5 px-4 py-2.5 text-xs font-bold text-primary hover:bg-primary/10"
                    >
                      <QrCode className="h-4 w-4" /> عرض الباركود
                    </Link>
                    {canModify && (
                      <>
                        <button
                          onClick={() => openEdit(b)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-bold text-foreground hover:border-primary hover:text-primary"
                        >
                          <Pencil className="h-3.5 w-3.5" /> تعديل
                        </button>
                        <button
                          onClick={() => cancelBooking(b.bookingId)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                        >
                          <X className="h-3.5 w-3.5" /> إلغاء
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEdit(null)}>
          <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-extrabold">تعديل موعد الحجز</h3>
              <button onClick={() => setEdit(null)} className="rounded-full p-1 text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold">التاريخ</label>
                <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold">الوقت</label>
                <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={saveEdit} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90">
                حفظ التغييرات
              </button>
              <button onClick={() => setEdit(null)} className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold">
                إلغاء
              </button>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">* قد يحتاج المركز للتأكيد على الموعد الجديد</p>
          </div>
        </div>
      )}
    </AccountLayout>
  );
}
