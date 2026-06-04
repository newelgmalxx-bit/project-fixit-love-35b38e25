import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { FileText, ChevronLeft } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";
import { useLegalContent } from "@/hooks/useLegalContent";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions | koswmat" },
      { name: "description", content: "Terms and conditions for using koswmat services." },
      { property: "og:title", content: "Terms & Conditions | koswmat" },
      { property: "og:description", content: "Review the terms and conditions of koswmat services." },
    ],
  }),
  component: TermsPage,
});

const DEFAULT_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10"] as const;

function TermsPage() {
  const { t, lang, dir } = useLang();
  const { terms } = useLegalContent();
  const pick = (ar?: string, en?: string, fallback = "") => {
    const v = lang === "en" ? en || ar : ar || en;
    return v && v.trim() ? v : fallback;
  };
  const badge = pick(terms.badgeAr, terms.badgeEn, t("legal.terms.badge"));
  const title = pick(terms.titleAr, terms.titleEn, t("legal.terms.title"));
  const subtitle = pick(terms.subtitleAr, terms.subtitleEn, t("legal.terms.subtitle"));
  const lastUpdated = pick(terms.lastUpdatedAr, terms.lastUpdatedEn, t("legal.lastUpdatedDate"));
  const sections =
    terms.sections && terms.sections.length > 0
      ? terms.sections.map((s) => ({
          title: pick(s.titleAr, s.titleEn),
          body: pick(s.bodyAr, s.bodyEn),
        }))
      : DEFAULT_KEYS.map((k) => ({
          title: t(`legal.terms.${k}.t` as any),
          body: t(`legal.terms.${k}.b` as any),
        }));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-l from-primary-dark via-primary to-primary-dark text-white">
          <div className="mx-auto max-w-5xl px-4 py-8 text-center sm:px-6 lg:px-8">
            <div className="mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold backdrop-blur">
              <FileText className="h-3.5 w-3.5" /> {badge}
            </div>
            <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/85">{subtitle}</p>
            <p className="mt-2 text-[11px] text-white/70">{lastUpdated}</p>
          </div>
        </section>

        <section className="py-14">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-6 rounded-3xl border border-border/60 bg-white p-8 text-start shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)] sm:p-10">
              {sections.map((s, i) => (
                <Section key={i} title={s.title}>{s.body}</Section>
              ))}

              <div className="mt-2 flex justify-end">
                <Link to={"/privacy" as any} className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                  {t("legal.gotoPrivacy")} <ChevronLeft className={`h-3 w-3 ${dir === "ltr" ? "rotate-180" : ""}`} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 text-lg font-extrabold text-foreground">{title}</h2>
      <p className="whitespace-pre-line text-sm leading-8 text-foreground/75">{children}</p>
    </div>
  );
}
