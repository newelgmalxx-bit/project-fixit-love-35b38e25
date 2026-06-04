import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminLayout, PanelCard, Pill } from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { Check, X, Wallet, TrendingUp, Clock } from "lucide-react";

export const Route = createFileRoute("/admin/payouts")({
  head: () => ({ meta: [{ title: "المدفوعات والسحوبات | الإدارة" }] }),
  component: PayoutsPage,
});

type Payout = {
  id: string;
  partner: string;
  city: string;
  amount: number;
  iban: string;
  bank: string;
  date: string;
  status: "pending" | "approved" | "rejected";
};

const initialPayouts: Payout[] = [
  { id: "WD-1042", partner: "مركز جمال ريم", city: "الرياض", amount: 4820, iban: "SA03 8000 0000 6080 1016 7519", bank: "الراجحي", date: "اليوم 10:24", status: "pending" },
  { id: "WD-1041", partner: "عيادة د. سلمى", city: "جدة", amount: 7200, iban: "SA44 2000 0001 2345 6789 0123", bank: "الأهلي", date: "أمس 16:45", status: "pending" },
  { id: "WD-1038", partner: "سبا اللؤلؤة", city: "الدمام", amount: 3150, iban: "SA12 3000 0009 8765 4321 0987", bank: "الإنماء", date: "قبل يومين", status: "approved" },
  { id: "WD-1035", partner: "مركز التألق", city: "الرياض", amount: 1980, iban: "SA56 4000 0005 6789 1234 5678", bank: "الرياض", date: "قبل 4 أيام", status: "rejected" },
];

function PayoutsPage() {
  const [items, setItems] = useState<Payout[]>(initialPayouts);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  function decide(id: string, status: "approved" | "rejected") {
    setItems((arr) => arr.map((p) => (p.id === id ? { ...p, status } : p)));
    toast.success(status === "approved" ? "تمت الموافقة على السحب" : "تم رفض الطلب");
  }

  const filtered = filter === "all" ? items : items.filter((i) => i.status === filter);
  const totals = {
    pending: items.filter((i) => i.status === "pending").reduce((s, i) => s + i.amount, 0),
    approved: items.filter((i) => i.status === "approved").reduce((s, i) => s + i.amount, 0),
    total: items.reduce((s, i) => s + i.amount, 0),
  };

  const cards = [
    { label: "بانتظار المراجعة", value: `${totals.pending.toLocaleString()} ر.س`, icon: Clock, color: "from-amber-500 to-orange-600" },
    { label: "تمت الموافقة", value: `${totals.approved.toLocaleString()} ر.س`, icon: Wallet, color: "from-emerald-500 to-teal-600" },
    { label: "إجمالي السحوبات", value: `${totals.total.toLocaleString()} ر.س`, icon: TrendingUp, color: "from-violet-500 to-purple-600" },
  ];

  return (
    <AdminLayout title="المدفوعات والسحوبات" subtitle="مراجعة طلبات سحب أرصدة الشركاء">
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-3xl border border-border bg-card p-6">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${c.color} text-white shadow`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div className="mt-4 text-2xl font-black text-foreground" dir="ltr">{c.value}</div>
            <div className="mt-1 text-xs font-bold text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-6 inline-flex flex-wrap rounded-xl border border-border bg-card p-1">
        {([
          ["pending", "بانتظار", items.filter((i) => i.status === "pending").length],
          ["approved", "مقبولة", items.filter((i) => i.status === "approved").length],
          ["rejected", "مرفوضة", items.filter((i) => i.status === "rejected").length],
          ["all", "الكل", items.length],
        ] as const).map(([k, l, n]) => (
          <button key={k} onClick={() => setFilter(k as any)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold ${filter === k ? "bg-primary text-primary-foreground" : "text-foreground/60"}`}>
            {l} <span className="opacity-70">({n})</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((p) => {
          const tone = p.status === "approved" ? "emerald" : p.status === "rejected" ? "rose" : "amber";
          const label = p.status === "approved" ? "مقبول" : p.status === "rejected" ? "مرفوض" : "بانتظار";
          return (
            <PanelCard key={p.id} title={p.partner}
              subtitle={`${p.id} · ${p.city} · ${p.date}`}
              action={<Pill tone={tone as any}>{label}</Pill>}>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-muted/30 p-3">
                  <div className="text-xs font-bold text-muted-foreground">المبلغ</div>
                  <div className="mt-1 text-lg font-extrabold text-primary" dir="ltr">{p.amount.toLocaleString()} ر.س</div>
                </div>
                <div className="rounded-2xl border border-border bg-muted/30 p-3">
                  <div className="text-xs font-bold text-muted-foreground">البنك</div>
                  <div className="mt-1 text-sm font-bold">{p.bank}</div>
                </div>
                <div className="rounded-2xl border border-border bg-muted/30 p-3">
                  <div className="text-xs font-bold text-muted-foreground">IBAN</div>
                  <div className="mt-1 text-xs font-mono" dir="ltr">{p.iban}</div>
                </div>
              </div>
              {p.status === "pending" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => decide(p.id, "approved")}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700">
                    <Check className="h-4 w-4" /> موافقة وتحويل
                  </button>
                  <button onClick={() => decide(p.id, "rejected")}
                    className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100">
                    <X className="h-4 w-4" /> رفض
                  </button>
                </div>
              )}
            </PanelCard>
          );
        })}
      </div>
    </AdminLayout>
  );
}
