import logoWhite from "@/assets/booking-logo.png";
import authIllustration from "@/assets/auth-hero-collage.jpg";
import { ShieldCheck, Headphones, BarChart3, CloudCog } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";

export function AuthHero({ variant = "login" }: { variant?: "login" | "signup" }) {
  const { t, dir } = useLang();
  const features = [
    { icon: CloudCog, title: t("auth.hero.f1.t"), desc: t("auth.hero.f1.d") },
    { icon: BarChart3, title: t("auth.hero.f2.t"), desc: t("auth.hero.f2.d") },
    { icon: Headphones, title: t("auth.hero.f3.t"), desc: t("auth.hero.f3.d") },
    { icon: ShieldCheck, title: t("auth.hero.f4.t"), desc: t("auth.hero.f4.d") },
  ];
  const align = dir === "rtl" ? "text-right" : "text-left";
  const dividerAlign = dir === "rtl" ? "ms-auto" : "me-auto";
  return (
    <div dir={dir} className="relative flex flex-col justify-between overflow-hidden p-6 text-white sm:p-10" style={{ background: "linear-gradient(135deg, #3F2A6B 0%, #E0254D 100%)" }}>
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

      <div className="relative flex justify-start">
        <img src={logoWhite} alt="خصومات" className="h-14 w-auto opacity-95 sm:h-20" />
      </div>

      <div className={`relative mt-6 ${align}`}>
        <h2 className="text-2xl font-extrabold leading-tight sm:text-3xl">
          {t("auth.hero.welcome")} <span className="whitespace-nowrap">{dir === "rtl" ? "خصومات" : "Koswmat"}</span>
        </h2>
        <div className={`my-3 h-0.5 w-16 rounded-full bg-white/60 ${dividerAlign}`} />
        <p className="text-xs leading-6 text-white/80 sm:text-sm sm:leading-7">
          {variant === "signup" ? t("auth.hero.tagline.signup") : t("auth.hero.tagline.login")}
        </p>
      </div>

      <div className="relative my-6 flex justify-center">
        <div className="w-full max-w-xs overflow-hidden rounded-3xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)] ring-1 ring-white/10 sm:max-w-sm lg:max-w-md">
          <img src={authIllustration} alt="" className="aspect-square w-full object-cover" />
        </div>
      </div>

      <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur">
              <f.icon className="h-4 w-4" />
            </div>
            <div className="text-[11px] font-bold">{f.title}</div>
            <div className="text-[10px] text-white/70">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}