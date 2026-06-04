import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Ticket, CheckCircle2, Clock, ArrowLeft, ArrowRight, Calendar, QrCode, ShoppingBag, Heart, LifeBuoy, MessageSquare } from "lucide-react";
import { AccountLayout } from "@/components/account/AccountLayout";
import { useLang } from "@/i18n/LanguageProvider";
import { useAuth } from "@/hooks/useAuth";


export const Route = createFileRoute("/account/")({
  head: () => ({ meta: [{ title: "حسابي | خصومات" }] }),
  component: AccountHome,
});

type StoredBooking = {
  bookingId: string;
  verifyCode: string;
  offerId: string;
  offerTitle?: string;
  date: string;
  time: string;
  customerName: string;
  redeemedAt?: string;
  createdAt: string;
};

function AccountHome() {
  const { dir } = useLang();
  const { user } = useAuth();
  const [items, setItems] = useState<StoredBooking[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("myBookings");
      const list: StoredBooking[] = raw ? JSON.parse(raw) : [];
      setItems(list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")));
    } catch {}
  }, []);

  const total = items.length;
  const upcoming = items.filter((b) => !b.redeemedAt).length;
  const done = items.filter((b) => b.redeemedAt).length;
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;
  const firstName = (user?.name || "").split(" ")[0] || "بك";

  return (
    <AccountLayout title={`أهلاً ${firstName} 👋`} subtitle="تابع حجوزاتك وأظهر الباركود عند المركز">
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Stat icon={Ticket} label="إجمالي الحجوزات" value={total.toString()} tone="primary" />
        <Stat icon={Clock} label="قادمة" value={upcoming.toString()} tone="amber" />
        <Stat icon={CheckCircle2} label="مُستخدمة" value={done.toString()} tone="emerald" />
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">آخر الحجوزات</h2>
          <Link to="/account/bookings" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
            عرض الكل <Arrow className="h-3.5 w-3.5" />
          </Link>
        </div>
        {items.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">لا توجد حجوزات بعد.</p>
            <Link
              to="/offers"
              className="mt-4 inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
            >
              تصفّح العروض
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {items.slice(0, 3).map((b) => {
              return (
                <Link
                  key={b.bookingId}
                  to="/booking/$bookingId"
                  params={{ bookingId: b.bookingId }}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3 transition hover:border-primary/50 hover:shadow-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <QrCode className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold">{b.offerTitle || "خدمة"}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" /> {b.date} • {b.time}
                      </div>
                    </div>
                  </div>
                  {b.redeemedAt ? (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">مُستخدم</span>
                  ) : (
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">قادم</span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold">روابط سريعة</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { to: "/account/bookings", icon: ShoppingBag, label: "حجوزاتي", tone: "from-primary/10 to-primary/5 text-primary" },
            { to: "/account/favorites", icon: Heart, label: "المفضلة", tone: "from-rose-100 to-rose-50 text-rose-600" },
            { to: "/account/tickets", icon: LifeBuoy, label: "الدعم", tone: "from-amber-100 to-amber-50 text-amber-600" },
          ].map((q) => (
            <Link
              key={q.to}
              to={q.to as any}
              className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-background p-4 text-center transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
            >
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${q.tone}`}>
                <q.icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-bold text-foreground">{q.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </AccountLayout>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: "primary" | "amber" | "emerald" }) {
  const tones = {
    primary: "from-primary/10 to-primary/5 text-primary",
    amber: "from-amber-100 to-amber-50 text-amber-600",
    emerald: "from-emerald-100 to-emerald-50 text-emerald-600",
  } as const;
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className={`mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}
