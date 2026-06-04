import { useLang } from "@/i18n/LanguageProvider";

const logos = [
  "Aramco", "STC", "SABIC", "Almarai", "Mobily", "Saudia",
  "Riyad Bank", "Tadawul", "neom", "Moyasar",
];

export function LogosMarquee() {
  const { t } = useLang();
  return (
    <section className="border-y border-border bg-secondary/40 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("logos.trusted")}
        </p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_10%,#000_90%,transparent)]">
          <div className="flex w-max animate-marquee gap-12">
            {[...logos, ...logos].map((name, i) => (
              <div
                key={i}
                className="flex h-10 shrink-0 items-center text-xl font-extrabold tracking-tight text-foreground/40 transition hover:text-primary"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}