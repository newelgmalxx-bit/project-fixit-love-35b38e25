import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout, StatCard, PanelCard } from "@/components/admin/AdminLayout";
import { Eye, MousePointerClick, TrendingUp, Clock, ShoppingCart, DollarSign, Users, Activity } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";
import { useEffect, useState } from "react";
import { useLang } from "@/i18n/LanguageProvider";
import { admin as adminApi } from "@/lib/api";
import { fmtSAR } from "@/data/admin";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics | Admin" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { lang } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "year">("30d");
  const [data, setData] = useState<any>(null);
  const [realtime, setRealtime] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r: any = await adminApi.getAnalytics(range).catch(() => null);
      if (cancelled) return;
      setData(r?.data ?? r ?? {});
    })();
    return () => { cancelled = true; };
  }, [range]);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const r: any = await adminApi.getAnalyticsRealtime().catch(() => null);
      if (!cancelled) setRealtime(r?.data ?? r ?? {});
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const fmt = (n: any) => (typeof n === "number" ? n.toLocaleString(lang === "en" ? "en-US" : "ar-SA") : (n ?? "—"));
  const sources = (data?.sources ?? []).map((s: any) => ({ name: s.name, v: s.value ?? s.v ?? 0 }));
  const weekly = (Array.isArray(data?.weeklyTraffic) ? data.weeklyTraffic : []).map((v: any) => ({ d: v.day ?? v.date ?? v.d, v: v.views ?? v.v ?? 0 }));
  const monthly = (data?.monthlyRevenue ?? []).map((m: any) => ({
    m: m.month ?? m.m,
    v: Number(m.commission ?? m.revenue ?? m.v ?? 0) || 0,
    total: Number(m.total ?? m.totalValue ?? 0) || 0,
  }));
  const topPages = data?.topPages ?? [];
  const topOffers = data?.topOffers ?? data?.topServices ?? [];

  return (
    <AdminLayout title={L("التحليلات", "Analytics")} subtitle={L("رؤى متقدمة لأداء الموقع والتفاعل", "Advanced insights into site performance and engagement")} action={
      <select value={range} onChange={(e) => setRange(e.target.value as any)} className="hidden sm:inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-bold">
        <option value="7d">{L("آخر 7 أيام", "Last 7 days")}</option>
        <option value="30d">{L("آخر 30 يوم", "Last 30 days")}</option>
        <option value="90d">{L("آخر 90 يوم", "Last 90 days")}</option>
        <option value="year">{L("هذا العام", "This Year")}</option>
      </select>
    }>
      {/* Realtime */}
      {realtime && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 mb-6">
          <StatCard label={L("مستخدمون نشطون الآن", "Active Users Now")} value={fmt(realtime?.activeUsers ?? 0)} icon={Activity} accent="emerald" />
          <StatCard label={L("جلسات نشطة", "Active Sessions")} value={fmt(realtime?.activeSessions ?? 0)} icon={Users} accent="violet" />
        </div>
      )}

      {/* Visits */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label={L("الزيارات", "Visits")} value={fmt(data?.visits ?? 0)} icon={Eye} accent="primary" />
        <StatCard label={L("زوار فريدون", "Unique Visitors")} value={fmt(data?.uniqueVisitors ?? 0)} icon={Users} accent="violet" />
        <StatCard label={L("مشاهدات الصفحة", "Page Views")} value={fmt(data?.pageViews ?? 0)} icon={MousePointerClick} accent="emerald" />
        <StatCard label={L("متوسط مدة الزيارة", "Avg. Session")} value={fmt(data?.avgSession ?? "0s")} icon={Clock} accent="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <PanelCard title={L("حركة المرور الأسبوعية", "Weekly Traffic")} subtitle={L("الزيارات حسب اليوم", "Visits by day")} className="lg:col-span-2">
          <div className="h-72">
            {weekly.length === 0 || weekly.every((d: any) => !d.v) ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">{L("لا توجد بيانات بعد", "No data yet")}</div>
            ) : (
              <ResponsiveContainer>
                <LineChart data={weekly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3ebf3" />
                  <XAxis dataKey="d" stroke="#7c8aa0" fontSize={12} />
                  <YAxis stroke="#7c8aa0" fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="v" stroke="#00AEC6" strokeWidth={3} dot={{ r: 4, fill: "#00AEC6" }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </PanelCard>
        <PanelCard title={L("مصادر الزيارات", "Traffic Sources")} subtitle={L("من أين يأتي العملاء", "Where visitors come from")}>
          {sources.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">{L("لا توجد بيانات بعد", "No data yet")}</div>
          ) : (
            <ul className="space-y-3">
              {sources.map((s: { name: string; v: number }) => (
                <li key={s.name}>
                  <div className="flex justify-between text-xs mb-1"><span className="font-medium">{s.name}</span><span className="font-bold">{fmt(s.v)}</span></div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (s.v / Math.max(...sources.map((x: any) => x.v), 1)) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </PanelCard>
      </div>

      {/* Top pages + services */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <PanelCard title={L("أكثر الصفحات زيارة", "Top Pages")} subtitle={L("أعلى الصفحات أداءً", "Best performing pages")}>
          {topPages.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">{L("لا توجد بيانات بعد", "No data yet")}</div>
          ) : (
            <ul className="space-y-2">
              {topPages.map((p: any, i: number) => (
                <li key={i} className="flex justify-between text-xs border-b border-border pb-2">
                  <span className="font-medium truncate">{p.path}</span>
                  <span className="font-bold">{fmt(p.views ?? p.count ?? 0)}</span>
                </li>
              ))}
            </ul>
          )}
        </PanelCard>
        <PanelCard title={L("أكثر الخدمات طلباً", "Top Services")} subtitle={L("الخدمات الأكثر مبيعاً", "Best selling services")}>
          {topOffers.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">{L("لا توجد بيانات بعد", "No data yet")}</div>
          ) : (
            <ul className="space-y-2">
              {topOffers.map((s: any, i: number) => (
                <li key={i} className="flex justify-between items-center text-xs border-b border-border pb-2 gap-2">
                  <span className="font-medium truncate flex-1">{s.title ?? s.name}</span>
                  <span className="text-muted-foreground">{fmt(s.sold ?? s.orders ?? s.count ?? 0)}</span>
                  <span className="font-bold text-primary">{fmtSAR(s.revenue ?? s.commission ?? 0)}</span>
                  {s.partnerEarnings != null && (
                    <span className="font-bold text-emerald-600">{fmtSAR(s.partnerEarnings)}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </PanelCard>
      </div>

      {/* Revenue */}
      <h3 className="text-sm font-bold text-muted-foreground mb-3">{L("الإيرادات والطلبات", "Revenue & Orders")}</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label={L("إيراد المنصة (عمولة)", "Platform Revenue (Commission)")} value={fmtSAR(data?.totalRevenue ?? data?.revenue ?? 0)} icon={DollarSign} accent="primary" />
        <StatCard label={L("إجمالي قيمة الحجوزات", "Total Bookings Value")} value={fmtSAR(data?.totalBookingsValue ?? 0)} icon={TrendingUp} accent="emerald" />
        <StatCard label={L("مكسب الشركاء", "Partner Earnings")} value={fmtSAR(data?.totalPartnerEarnings ?? 0)} icon={Users} accent="violet" />
        <StatCard label={L("متوسط الحجز", "Avg. Booking")} value={fmtSAR(data?.avgOrderValue ?? 0)} icon={Activity} accent="amber" />
      </div>

      <PanelCard title={L("الإيرادات الشهرية", "Monthly Revenue")} subtitle={L("آخر 12 شهر", "Last 12 months")}>
        <div className="h-72">
          {monthly.length === 0 || monthly.every((d: any) => !d.v) ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">{L("لا توجد بيانات بعد", "No data yet")}</div>
          ) : (
            <ResponsiveContainer>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e3ebf3" />
                <XAxis dataKey="m" stroke="#7c8aa0" fontSize={12} />
                <YAxis stroke="#7c8aa0" fontSize={12} />
                <Tooltip />
                <Bar dataKey="v" fill="#00AEC6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </PanelCard>
    </AdminLayout>
  );
}
