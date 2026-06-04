import { Link } from "@tanstack/react-router";
import { ArrowLeft, ClipboardList, FileText } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";

export function ActionCardsSection() {
  const { dir, t } = useLang();
  const Arrow = (
    <ArrowLeft className={`h-4 w-4 transition-transform group-hover:-translate-x-1 ${dir === "ltr" ? "rotate-180" : ""}`} />
  );
  return (
    <section className="bg-background pt-4 pb-12">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 md:grid-cols-1 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-bl from-primary-light/70 via-white to-white p-7 shadow-sm">
          <div className="pointer-events-none absolute -top-12 -left-12 h-44 w-44 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative flex flex-col items-start text-start">
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary shadow ring-1 ring-primary/20">
              <ClipboardList className="h-5 w-5" />
            </span>
            <h3 className="text-lg font-extrabold text-foreground">{t("actionCards.track.title")}</h3>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              {t("actionCards.track.desc")}
            </p>
            <Link
              to={"/track" as any}
              className="group mt-5 inline-flex h-10 items-center gap-2 rounded-full border border-primary bg-white px-5 text-xs font-bold text-primary transition-all hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground"
            >
              {t("actionCards.track.cta")} {Arrow}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
