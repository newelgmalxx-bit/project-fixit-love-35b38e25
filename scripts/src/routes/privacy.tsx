import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ShieldCheck, ChevronLeft } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";
import { useLegalContent } from "@/hooks/useLegalContent";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | koswmat" },
      { name: "description", content: "koswmat privacy policy — how we collect, use and protect your data." },
      { property: "og:title", content: "Privacy Policy | koswmat" },
      { property: "og:description", content: "How we handle your data at koswmat." },
    ],
  }),
  component: PrivacyPage,
});

const DEFAULT_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9"] as const;

function PrivacyPage() {
  const { t, lang, dir } = useLang();
  const { privacy } = useLegalContent();
  const pick = (ar?: string, en?: string, fallback = "") => {
    const v = lang === "en" ? en || ar : ar || en;
    return v && v.trim() ? v : fallback;
  };
  const badge = pick(privacy.badgeAr, privacy.badgeEn, t("legal.privacy.badge"));
  const title = pick(privacy.titleAr, privacy.titleEn, t("legal.privacy.title"));
  const subtitle = pick(privacy.subtitleAr, privacy.subtitleEn, t("legal.privacy.subtitle"));
  const lastUpdated = pick(privacy.lastUpdatedAr, privacy.lastUpdatedEn, t("legal.lastUpdatedDate"));
  const sections =
    privacy.sections && privacy.sections.length > 0
      ? privacy.sections.map((s) => ({
          title: pick(s.titleAr, s.titleEn),
          body: pick(s.bodyAr, s.bodyEn),
        }))
      : DEFAULT_KEYS.map((k) => ({
          title: t(`legal.privacy.${k}.t` as any),
          body: t(`legal.privacy.${k}.b` as any),
        }));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-l from-primary-dark via-primary to-primary-dark text-white">
          <div className="mx-auto max-w-5xl px-4 py-8 text-center sm:px-6 lg:px-8">
            <div className="mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5" /> {badge}
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
                <Link to={"/terms" as any} className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                  {t("legal.gotoTerms")} <ChevronLeft className={`h-3 w-3 ${dir === "ltr" ? "rotate-180" : ""}`} />
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
