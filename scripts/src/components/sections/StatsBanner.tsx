import { useLang } from "@/i18n/LanguageProvider";
import type { TKey } from "@/i18n/translations";

const stats: { v: string; key: TKey }[] = [
  { v: "+1000", key: "statsBanner.clients" },
  { v: "+25", key: "statsBanner.cities" },
  { v: "+50", key: "statsBanner.depts" },
  { v: "+8", key: "statsBanner.years" },
  { v: "98%", key: "statsBanner.satisfaction" },
  { v: "+500", key: "statsBanner.completed" },
];

export function StatsBanner() {
  const { t } = useLang();
  return (
    <section className="bg-background pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-y-8 rounded-2xl border border-border bg-white px-6 py-10 shadow-[0_20px_50px_-30px_rgba(0,174,198,0.35)] sm:grid-cols-3 sm:px-8 lg:grid-cols-6">
          {stats.map((s) => (
            <div key={s.key} className="text-center">
              <div className="text-2xl font-extrabold text-primary sm:text-3xl" dir="ltr">{s.v}</div>
              <div className="mt-2 text-xs text-muted-foreground">{t(s.key)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
