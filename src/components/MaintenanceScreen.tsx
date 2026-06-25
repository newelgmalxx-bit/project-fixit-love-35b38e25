import { useEffect, useState } from "react";
import { Wrench } from "lucide-react";
import logo from "@/assets/logo.png";
import { useLang } from "@/i18n/LanguageProvider";

export function MaintenanceScreen({ lang: langProp }: { lang?: "ar" | "en" } = {}) {
  const { lang: ctxLang } = useLang();
  const lang = langProp ?? ctxLang;
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  const ar = lang === "ar";
  return (
    <div dir={ar ? "rtl" : "ltr"} className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5 px-4">
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative z-10 w-full max-w-xl rounded-3xl border border-border bg-card/80 p-8 sm:p-12 text-center shadow-2xl backdrop-blur">
        <img src={logo} alt="logo" className="mx-auto mb-6 h-12 w-auto object-contain" />
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Wrench className="h-10 w-10 animate-pulse" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          {ar ? "الموقع تحت الصيانة" : "Site under maintenance"}
        </h1>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
          {ar
            ? "نعمل حالياً على تحسين تجربتك. سنعود قريباً — شكراً لصبرك."
            : "We're improving your experience. We'll be back shortly — thanks for your patience."}
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
          {ar ? "آخر تحديث:" : "Last check:"} {now.toLocaleTimeString(ar ? "ar-SA" : "en-US")}
        </div>
      </div>
    </div>
  );
}