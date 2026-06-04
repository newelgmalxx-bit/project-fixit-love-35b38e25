import { PencilRuler, Sparkles, Cuboid, Box, Hammer } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";
import type { TKey } from "@/i18n/translations";

const steps: { n: number; icon: typeof PencilRuler; title: TKey; desc: TKey }[] = [
  { n: 1, icon: PencilRuler, title: "process.s1.t", desc: "process.s1.d" },
  { n: 2, icon: Sparkles, title: "process.s2.t", desc: "process.s2.d" },
  { n: 3, icon: Cuboid, title: "process.s3.t", desc: "process.s3.d" },
  { n: 4, icon: Box, title: "process.s4.t", desc: "process.s4.d" },
  { n: 5, icon: Hammer, title: "process.s5.t", desc: "process.s5.d" },
];

export function ProcessSection() {
  const { t } = useLang();
  return (
    <section className="bg-secondary/30 py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">{t("process.kicker")}</span>
          <h2 className="mt-3 text-3xl font-extrabold text-foreground sm:text-4xl">{t("process.title")}</h2>
          <p className="mt-4 text-sm text-muted-foreground sm:text-base">
            {t("process.desc")}
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((s, i) => (
            <div
              key={s.n}
              className="group relative flex flex-col items-center rounded-3xl border border-border bg-white p-6 text-center transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
            >
              <span className="absolute -top-3 end-6 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-foreground px-2 text-[11px] font-extrabold text-background">
                {t("process.stepLabel")} {s.n}
              </span>
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <s.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-sm font-extrabold text-foreground">{t(s.title)}</h3>
              <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{t(s.desc)}</p>
              {i < steps.length - 1 && (
                <span className="pointer-events-none absolute left-0 top-1/2 hidden h-px w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/30 to-transparent lg:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
