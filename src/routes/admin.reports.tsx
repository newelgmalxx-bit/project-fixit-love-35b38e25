import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout, StatCard, PanelCard, PrimaryButton } from "@/components/admin/AdminLayout";
import { DollarSign, ShoppingCart, TrendingUp, Users, Package, Activity, Download } from "lucide-react";
import { fmtSAR } from "@/data/admin";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageProvider";
import { admin as adminApi } from "@/lib/api";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "Reports | Admin" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { lang, dir } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);
  const types = [L("الملخص المالي", "Financial Summary"), L("تقرير المبيعات", "Sales Report"), L("تقرير العملاء", "Clients Report"), L("تقرير الخدمات", "Services Report")];
  const periods = [L("آخر 7 أيام", "Last 7 days"), L("آخر 30 يوم", "Last 30 days"), L("آخر 90 يوم", "Last 90 days"), L("هذا العام", "This Year")];
  const periodsExt = [L("آخر 30 يوم", "Last 30 days"), L("آخر 3 أشهر", "Last 3 months"), L("آخر 12 شهر", "Last 12 months"), L("هذا العام", "This Year")];
  const formats = ["CSV (Excel)", "PDF", "JSON"];
  const [type, setType] = useState(types[0]);
  const [period, setPeriod] = useState(periodsExt[0]);
  const [format, setFormat] = useState(formats[0]);
  const [topPeriod, setTopPeriod] = useState(periods[1]);
  const [stats, setStats] = useState<{ revenue: number; orders: number; clients: number; activeServices: number; vat: number; profitMargin: string }>({
    revenue: 0, orders: 0, clients: 0, activeServices: 0, vat: 0, profitMargin: "0%",
  });

  useEffect(() => {
    (async () => {
      try {
        const [s, an, op, cp, sp] = await Promise.all([
          adminApi.stats().catch(() => null),
          adminApi.analytics().catch(() => null),
          adminApi.orders.list({ limit: 1000 }).catch(() => ({ items: [] })),
          adminApi.clients.list({ limit: 1000 }).catch(() => ({ items: [] })),
          Promise.resolve({ items: [] }),
        ]);
        const a: any = an || s || {};
        const orders: any[] = (op as any)?.items || [];
        const clients: any[] = (cp as any)?.items || [];
        const services: any[] = (sp as any)?.items || [];
        const ordersTotal = orders.length || Number(a.ordersCount ?? a.totalBookings) || 0;
        const revenueTotal = orders.reduce((sum, o: any) => sum + (Number(o.total ?? o.amount ?? o.subtotal) || 0), 0) || Number(a.revenue) || 0;
        const clientsTotal = clients.length || Number(a.totalClients) || 0;
        const activeSvc = services.filter((s: any) => s.active !== false && s.status !== "inactive").length || Number(a.activeServices) || 0;
        const vatTotal = orders.reduce((sum, o: any) => sum + (Number(o.vat) || 0), 0);
        const marginPct = a.profitMargin != null
          ? Number(a.profitMargin)
          : (revenueTotal > 0 ? ((revenueTotal - vatTotal) / revenueTotal) * 100 : 0);
        setStats({
          revenue: revenueTotal,
          orders: ordersTotal,
          clients: clientsTotal,
          activeServices: activeSvc,
          vat: vatTotal,
          profitMargin: `${marginPct.toFixed(1)}%`,
        });
      } catch {}
    })();
  }, []);

  const generate = async () => {
    const typeMap: Record<string, "sales" | "clients" | "services"> = {
      [L("الملخص المالي", "Financial Summary")]: "sales",
      [L("تقرير المبيعات", "Sales Report")]: "sales",
      [L("تقرير العملاء", "Clients Report")]: "clients",
      [L("تقرير الخدمات", "Services Report")]: "services",
    };
    const apiType = typeMap[type] || "sales";
    const fmt: "csv" | "json" = format.startsWith("JSON") ? "json" : "csv";
    if (!format.startsWith("PDF")) {
      try {
        await adminApi.reports.generate({ type: apiType, format: fmt });
        toast.success(L(`تم توليد التقرير (${fmt.toUpperCase()})`, `Report generated (${fmt.toUpperCase()})`));
        return;
      } catch {/* fallback to local */}
    }
    const rows: [string, string][] = [
      [L("إجمالي المبيعات", "Total Sales"), String(stats.revenue)],
      [L("إجمالي الطلبات", "Total Orders"), String(stats.orders)],
      [L("إجمالي الضريبة", "Total VAT"), String(stats.vat)],
      [L("العملاء النشطون", "Active Clients"), String(stats.clients)],
      [L("الخدمات النشطة", "Active Services"), String(stats.activeServices)],
      [L("هامش الربح", "Profit Margin"), stats.profitMargin],
    ];
    let blob: Blob, ext: string, mime: string;
    if (format.startsWith("JSON")) {
      blob = new Blob([JSON.stringify({ type, period, data: Object.fromEntries(rows) }, null, 2)], { type: "application/json" });
      ext = "json"; mime = "json";
    } else if (format.startsWith("PDF")) {
      const html = `<html dir="${dir}"><head><meta charset="utf-8"><title>${type}</title><style>body{font-family:sans-serif;padding:24px}h1{color:#00AEC6}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{padding:10px;border:1px solid #ddd;text-align:${dir === "rtl" ? "right" : "left"}}</style></head><body><h1>${type}</h1><p>${period}</p><table><thead><tr><th>${L("المؤشر", "Metric")}</th><th>${L("القيمة", "Value")}</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join("")}</tbody></table></body></html>`;
      blob = new Blob([html], { type: "text/html" });
      ext = "html"; mime = "html";
    } else {
      const csv = ["Metric,Value", ...rows.map(r => r.join(","))].join("\n");
      blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
      ext = "csv"; mime = "csv";
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `report-${Date.now()}.${ext}`; a.click();
    URL.revokeObjectURL(url);
    toast.success(L(`تم توليد التقرير (${mime.toUpperCase()})`, `Report generated (${mime.toUpperCase()})`));
  };

  const exportTopCsv = () => {
    const csv = `Metric,Value\nTotal Sales,${stats.revenue}\nTotal Orders,${stats.orders}\nTotal VAT,${stats.vat}`;
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "summary.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success(L("تم تصدير الملخص", "Summary exported"));
  };

  return (
    <AdminLayout title={L("التقارير", "Reports")} subtitle={L("تحليلات متقدمة وتقارير الأعمال", "Advanced business analytics and reports")} action={
      <div className="flex gap-2">
        <select value={topPeriod} onChange={(e) => setTopPeriod(e.target.value)} className="h-10 rounded-xl border border-border bg-card px-3 text-xs font-bold">
          {periods.map(p => <option key={p}>{p}</option>)}
        </select>
        <PrimaryButton onClick={exportTopCsv}><Download className="h-4 w-4" /> {L("تصدير CSV", "Export CSV")}</PrimaryButton>
      </div>
    }>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <StatCard label={L("إجمالي المبيعات", "Total Sales")} value={fmtSAR(stats.revenue)} icon={DollarSign} accent="primary" />
        <StatCard label={L("إجمالي الطلبات", "Total Orders")} value={stats.orders} icon={ShoppingCart} accent="violet" />
        <StatCard label={L("إجمالي الضريبة", "Total VAT")} value={fmtSAR(stats.vat)} icon={TrendingUp} accent="emerald" />
        <StatCard label={L("العملاء النشطون", "Active Clients")} value={stats.clients} icon={Users} accent="amber" />
        <StatCard label={L("الخدمات النشطة", "Active Services")} value={stats.activeServices} icon={Package} accent="primary" />
        <StatCard label={L("هامش الربح", "Profit Margin")} value={stats.profitMargin} icon={Activity} accent="violet" />
      </div>

      <PanelCard title={L("مولد التقارير المخصصة", "Custom Report Generator")} subtitle={L("إنشاء تقارير محددة للمحاسبة والتحليل", "Create reports for accounting and analysis")}>
        <div className="grid gap-4 md:grid-cols-3 mb-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{L("نوع التقرير", "Report Type")}</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm">
              {types.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{L("الفترة الزمنية", "Period")}</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm">
              {periodsExt.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{L("الصيغة", "Format")}</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm">
              {formats.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <PrimaryButton onClick={generate}><Download className="h-4 w-4" /> {L("توليد وتنزيل", "Generate & Download")}</PrimaryButton>
        </div>
      </PanelCard>
    </AdminLayout>
  );
}
