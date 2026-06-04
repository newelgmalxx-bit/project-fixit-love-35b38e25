import { ArrowLeft, Play } from "lucide-react";
import { Link } from "@tanstack/react-router";
import mainImg from "@/assets/hero-facial.jpg";
import accentImg from "@/assets/hero-hair-blonde.jpg";
import { useLang } from "@/i18n/LanguageProvider";

export function AboutIntroSection() {
  const { dir, t } = useLang();
  return (
    <section className="relative bg-gradient-to-b from-secondary/30 to-background py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          {/* Image collage */}
          <div className="relative order-1 lg:order-2">
            <div className="relative aspect-[5/4] w-full overflow-hidden rounded-[28px] shadow-[0_40px_80px_-30px_rgba(63,42,107,0.45)] ring-1 ring-black/5">
              <img src={mainImg} alt="Beauty & wellness deals" className="h-full w-full object-cover" />
              {/* play badge */}
              <button
                type="button"
                className="absolute bottom-5 start-5 inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-foreground shadow-lg backdrop-blur transition hover:bg-white"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white">
                  <Play className="h-3.5 w-3.5" fill="currentColor" />
                </span>
                {t("aboutIntro.pill.creative")}
              </button>
            </div>
            {/* secondary image */}
            <div className="absolute -bottom-10 end-[-12px] hidden h-44 w-56 overflow-hidden rounded-2xl border-4 border-background shadow-xl sm:block lg:end-[-24px] lg:h-52 lg:w-64">
              <img src={accentImg} alt="" className="h-full w-full object-cover" />
            </div>
            {/* stats badge */}
            <div className="absolute -top-6 start-[-12px] hidden rounded-2xl bg-white px-5 py-4 shadow-xl ring-1 ring-black/5 sm:block">
              <div className="text-2xl font-extrabold text-primary">{t("aboutIntro.stat1.n")}</div>
              <div className="text-xs font-bold text-muted-foreground">{t("aboutIntro.stat1.l")}</div>
            </div>
            <div aria-hidden className="pointer-events-none absolute -inset-6 -z-10 rounded-[36px] bg-gradient-to-tr from-primary/15 via-transparent to-[#E0254D]/15 blur-3xl" />
          </div>

          {/* Copy */}
          <div className="order-2 text-start lg:order-1">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">
              {t("aboutIntro.kicker")}
            </span>
            <h2 className="mt-4 text-3xl font-extrabold leading-[1.2] text-foreground sm:text-4xl lg:text-[2.6rem]">
              {t("aboutIntro.title.tail")}
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-8 text-muted-foreground sm:text-base">
              {t("aboutIntro.desc")}
            </p>

            {/* Stats row */}
            <div className="mt-8 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-white py-4 [direction:ltr]">
              {[
                { n: t("aboutIntro.stat1.n"), l: t("aboutIntro.stat1.l") },
                { n: t("aboutIntro.stat2.n"), l: t("aboutIntro.stat2.l") },
                { n: t("aboutIntro.stat3.n"), l: t("aboutIntro.stat3.l") },
              ].map((s) => (
                <div key={s.l} className="px-3 text-center">
                  <div className="text-xl font-extrabold text-foreground sm:text-2xl">{s.n}</div>
                  <div className="mt-1 text-xs font-bold text-muted-foreground sm:text-xs">{s.l}</div>
                </div>
              ))}
            </div>

            <Link
              to={"/offers" as any}
              className="group mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-sm font-bold text-primary-foreground shadow-[0_15px_30px_-12px_rgba(63,42,107,0.5)] transition hover:-translate-y-0.5 hover:bg-primary-dark"
            >
              {t("aboutIntro.cta")}
              <ArrowLeft className={`h-4 w-4 transition-transform group-hover:-translate-x-1 ${dir === "ltr" ? "rotate-180" : ""}`} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
