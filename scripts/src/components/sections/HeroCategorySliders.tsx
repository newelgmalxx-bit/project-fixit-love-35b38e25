import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, MapPin, Stethoscope, Dumbbell } from "lucide-react";
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
      <div className="relative h-[220px] sm:h-[240px]">
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

        <div className="absolute bottom-[72px] left-1/2 flex -translate-x-1/2 gap-1.5">
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

export function HeroCategorySliders() {
  const { dir } = useLang();

  const medical: Slide[] = [
    { img: medical1, title: "مجمع عيادات الياسمين", city: "الرياض", discount: "-45%" },
    { img: medical2, title: "عيادات بريق للأسنان", city: "جدة", discount: "-55%" },
  ];
  const fitness: Slide[] = [
    { img: fitness1, title: "نادي بور جيم", city: "الرياض", discount: "-40%" },
    { img: fitness2, title: "استوديو زن لليوغا", city: "الخبر", discount: "-35%" },
  ];

  return (
    <section className="relative bg-background">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-2 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-foreground sm:text-2xl">
              تصفّحي حسب التخصص
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              أحدث عروض المتاجر الطبية والجيم واليوغا — محدّثة يوميًا.
            </p>
          </div>
          <Link
            to={"/offers" as any}
            className="hidden shrink-0 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground hover:border-primary hover:text-primary sm:inline-flex"
          >
            كل العروض
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
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
    </section>
  );
}
