import { Search, PenTool, ListChecks, HardHat, ClipboardCheck } from "lucide-react";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { useLang } from "@/i18n/LanguageProvider";
import type { TKey } from "@/i18n/translations";

const steps: { icon: typeof Search; t: TKey; d: TKey }[] = [
  { icon: Search, t: "strategy.s1.t", d: "strategy.s1.d" },
  { icon: PenTool, t: "strategy.s2.t", d: "strategy.s2.d" },
  { icon: ListChecks, t: "strategy.s3.t", d: "strategy.s3.d" },
  { icon: HardHat, t: "strategy.s4.t", d: "strategy.s4.d" },
  { icon: ClipboardCheck, t: "strategy.s5.t", d: "strategy.s5.d" },
];

export function StrategySection() {
  const { t } = useLang();
  return (
    <section className="bg-background py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading kicker={t("strategy.kicker")} title={t("strategy.title")} />

        <div className="relative mt-24">
          <div className="pointer-events-none absolute inset-x-0 top-7 hidden h-px bg-gradient-to-l from-transparent via-primary/30 to-transparent lg:block" />

          <ol className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
            {steps.map((s, idx) => (
              <li key={s.t} className="group relative flex flex-col items-center text-center">
                <div className="relative">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary/30 bg-white text-primary shadow-sm transition group-hover:border-primary group-hover:bg-primary group-hover:text-white">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-extrabold text-white shadow" dir="ltr">
                    {idx + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-sm font-bold text-foreground">{t(s.t)}</h3>
                <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{t(s.d)}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
