import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles, ChevronLeft, MapPin, Stethoscope, Dumbbell } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import medical1 from "@/assets/hero-medical-1.jpg";
import medical2 from "@/assets/hero-medical-2.jpg";
import fitness1 from "@/assets/hero-fitness-1.jpg";
import fitness2 from "@/assets/hero-fitness-2.jpg";
import { useLang } from "@/i18n/LanguageProvider";

type Slide = { img: string; title: string; city: string; discount: string };

function MiniSlider({
  slides,
  icon,
  label,
  accent,
  interval = 3800,
  dir,
}: {
  slides: Slide[];
  icon: React.ReactNode;
  label: string;
  accent: string;
  interval?: number;
  dir: "rtl" | "ltr";
}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % slides.length), interval);
    return () => clearInterval(t);
  }, [slides.length, interval]);

  return (
    <div className="relative overflow-hidden rounded-3xl shadow-2xl ring-1 ring-black/5">
      <div className="relative h-[210px] sm:h-[230px]">
        {slides.map((s, idx) => (
          <img
            key={idx}
            src={s.img}
            alt={s.title}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              i === idx ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        <span
          className="absolute top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow-lg backdrop-blur-md"
          style={{ background: accent, [dir === "rtl" ? "right" : "left"]: "12px" } as React.CSSProperties}
        >
          {icon}
          {label}
        </span>

        <span
          className="absolute top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-extrabold text-foreground shadow-md"
          style={{ [dir === "rtl" ? "left" : "right"]: "12px" } as React.CSSProperties}
          dir="ltr"
        >
          {slides[i].discount}
        </span>

        <div className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-2xl bg-[#1a1f24]/90 px-3 py-2.5 shadow-xl backdrop-blur-sm">
          <div className="flex-1 text-start text-white">
            <div className="truncate text-sm font-extrabold">{slides[i].title}</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/70">
              <MapPin className="h-3 w-3 text-primary" />
              <span>{slides[i].city}</span>
            </div>
          </div>
          <Link
            to={"/offers" as any}
            aria-label="عرض"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-lg ring-4 ring-white/10 transition hover:scale-105"
          >
            <ChevronLeft className={`h-4 w-4 ${dir === "ltr" ? "rotate-180" : ""}`} strokeWidth={2.5} />
          </Link>
        </div>

        <div className="absolute bottom-[68px] left-1/2 flex -translate-x-1/2 gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? "w-5 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  const { dir, t } = useLang();

  const medical: Slide[] = [
    { img: medical1, title: "مجمع عيادات الياسمين", city: "الرياض", discount: "-45%" },
    { img: medical2, title: "عيادات بريق للأسنان", city: "جدة", discount: "-55%" },
  ];
  const fitness: Slide[] = [
    { img: fitness1, title: "نادي بور جيم", city: "الرياض", discount: "-40%" },
    { img: fitness2, title: "استوديو زن لليوغا", city: "الخبر", discount: "-35%" },
  ];

  return (
    <section className="relative isolate overflow-hidden">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(270deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.78) 45%, rgba(255,255,255,0.45) 80%, rgba(255,255,255,0.30) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(55% 50% at 90% 20%, rgba(0,174,198,0.10) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-14 pt-12 sm:px-6 lg:px-8 lg:pb-20 lg:pt-16">
        <div className="grid min-w-0 items-stretch gap-8 lg:grid-cols-2 lg:gap-10">
          <div className="relative order-2 flex min-w-0">
            <div className="relative mx-auto flex w-full max-w-[480px] flex-col gap-4">
              <MiniSlider
                slides={medical}
                icon={<Stethoscope className="h-3.5 w-3.5" />}
                label="متاجر طبية"
                accent="linear-gradient(135deg,#00aec6,#0891b2)"
                dir={dir}
              />
              <MiniSlider
                slides={fitness}
                icon={<Dumbbell className="h-3.5 w-3.5" />}
                label="لياقة وصحة"
                accent="linear-gradient(135deg,#f43f5e,#b91c1c)"
                interval={4200}
                dir={dir}
              />
            </div>
          </div>

          <div className="order-1 flex min-w-0 flex-col text-start">
            <span className="inline-flex items-center gap-2 text-[12px] font-bold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {t("hero.studio")}
            </span>

            <h1 className="mt-5 max-w-full text-[2.25rem] font-extrabold leading-[1.18] text-foreground sm:text-5xl lg:text-[3.5rem]">
              {t("hero.title.line1")}
              <br />
              <span className="text-gradient-primary">{t("hero.title.line2")}</span>
              <br />
              <span className="text-gradient-primary">{t("hero.title.line3")}</span>
            </h1>

            <p className="mt-6 max-w-full text-sm leading-8 text-muted-foreground sm:max-w-xl sm:text-base">
              {t("hero.desc.full")}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-[12px] font-bold text-primary">
                <Stethoscope className="h-3.5 w-3.5" /> عيادات ومتاجر طبية
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1.5 text-[12px] font-bold text-rose-600">
                <Dumbbell className="h-3.5 w-3.5" /> جيم ولياقة
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1.5 text-[12px] font-bold text-amber-700">
                <Sparkles className="h-3.5 w-3.5" /> صالونات ومنتجعات
              </span>
            </div>

            <div className="mt-6 grid w-full grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-start">
              <Link
                to={"/offers" as any}
                className="group inline-flex h-12 min-w-0 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-[0_12px_30px_-10px_rgba(0,174,198,0.6)] transition-all hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-[0_18px_40px_-12px_rgba(0,174,198,0.75)] sm:px-7"
              >
                <ArrowLeft className={`h-4 w-4 transition-transform group-hover:-translate-x-1 ${dir === "ltr" ? "rotate-180" : ""}`} />
                تصفّحي العروض
              </Link>
              <Link
                to={"/partner" as any}
                className="inline-flex h-12 min-w-0 items-center justify-center gap-2 rounded-full border border-border bg-white px-5 text-sm font-bold text-foreground transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary hover:shadow-md sm:px-7"
              >
                كن شريكًا
              </Link>
            </div>

            <div className="mt-auto pt-12">
              <div className="grid min-w-0 grid-cols-3 divide-x divide-border/70 rounded-2xl border border-border/70 bg-white/70 p-4 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.2)] backdrop-blur-md [direction:ltr] sm:p-5">
                {[
                  { v: "98%", l: t("hero.stat.satisfaction") },
                  { v: "8", l: t("hero.stat.yearsExp") },
                  { v: "500+", l: t("hero.stat.completed") },
                ].map((s) => (
                  <div key={s.l} className="px-2 text-center">
                    <div
                      className="bg-gradient-to-b from-primary to-primary-dark bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl"
                      dir="ltr"
                    >
                      {s.v}
                    </div>
                    <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {s.l}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
