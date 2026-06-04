import { BadgePercent, Zap, ShieldCheck, Wallet } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";
import type { TKey } from "@/i18n/translations";

const items: { icon: typeof BadgePercent; t: TKey; d: TKey }[] = [
  { icon: BadgePercent, t: "whyus.i1.t", d: "whyus.i1.d" },
  { icon: Zap, t: "whyus.i2.t", d: "whyus.i2.d" },
  { icon: ShieldCheck, t: "whyus.i3.t", d: "whyus.i3.d" },
  { icon: Wallet, t: "whyus.i4.t", d: "whyus.i4.d" },
];

export function WhyUsSection() {
  const { t } = useLang();
  return (
    <section className="relative overflow-hidden bg-background py-10 sm:py-14">
      {/* soft ambient blobs */}
      <div aria-hidden className="pointer-events-none absolute -top-32 -end-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -start-32 h-80 w-80 rounded-full bg-[#E0254D]/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
          <div className="text-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">
              {t("whyus.kicker")}
            </span>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight text-foreground sm:text-4xl lg:text-5xl">
              {t("whyus.title")}
            </h2>
          </div>
          <p className="max-w-xl text-start text-sm leading-8 text-muted-foreground sm:text-base lg:justify-self-end">
            {t("whyus.lede")}
          </p>
        </div>

        {/* Editorial numbered grid */}
        <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-border bg-border lg:grid-cols-4">
          {items.map((i, idx) => (
            <article
              key={i.t}
              className="group relative flex flex-col items-start gap-5 bg-white p-7 text-start transition hover:bg-primary/5 sm:p-8"
            >
              <span className="absolute end-6 top-6 text-[44px] font-black leading-none text-foreground/5 transition group-hover:text-primary/15">
                0{idx + 1}
              </span>
              <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15 transition group-hover:bg-primary group-hover:text-white">
                <i.icon className="h-5 w-5" />
              </span>
              <div className="relative">
                <h3 className="text-base font-extrabold text-foreground sm:text-lg">{t(i.t)}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">{t(i.d)}</p>
              </div>
              <span className="mt-2 h-px w-10 bg-primary/40 transition-all duration-300 group-hover:w-20" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
