import heroImg from "@/assets/interior-luxury-leather.jpg";
import { Star } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";

export function HeroMock() {
  const { t } = useLang();
  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <div className="relative overflow-hidden rounded-[28px] bg-white p-3 shadow-[0_30px_80px_-20px_rgba(0,174,198,0.45)] ring-1 ring-primary/15">
        <img
          src={heroImg}
          alt={t("hero.imgAlt")}
          width={1280}
          height={896}
          className="aspect-[4/3] w-full rounded-[20px] object-cover"
        />
        <div className="pointer-events-none absolute inset-3 rounded-[20px] bg-gradient-to-tr from-primary/10 via-transparent to-transparent" />
      </div>

      <div className="absolute -bottom-5 right-4 z-20 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-border">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light text-primary">
          <Star className="h-5 w-5 fill-primary text-primary" />
        </span>
        <div className="text-start">
          <div className="text-lg font-extrabold leading-none text-foreground">4.9/5</div>
          <div className="mt-1 text-[10px] text-muted-foreground">{t("heroMock.clients")}</div>
        </div>
      </div>

      <div className="absolute -top-4 left-4 z-20 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-lg">
        <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
        {t("heroMock.tag")}
      </div>
    </div>
  );
}
