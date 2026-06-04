import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { translate, type Lang, type TKey } from "./translations";

type Ctx = {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: TKey) => string;
};

const LanguageContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "saba_lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Always start with "ar" to match SSR, then sync with localStorage after mount
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "ar" || v === "en") setLangState(v);
    } catch {}
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  }, []);

  const toggle = useCallback(() => {
    setLang(lang === "ar" ? "en" : "ar");
  }, [lang, setLang]);

  // Sync <html lang/dir> with current language
  useEffect(() => {
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    html.setAttribute("lang", lang);
    html.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  }, [lang]);

  const value = useMemo<Ctx>(() => ({
    lang,
    dir: lang === "ar" ? "rtl" : "ltr",
    setLang,
    toggle,
    t: (key) => translate(key, lang),
  }), [lang, setLang, toggle]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Safe fallback (e.g. during SSR before provider mounts)
    return {
      lang: "ar" as Lang,
      dir: "rtl" as const,
      setLang: () => {},
      toggle: () => {},
      t: (key: TKey) => translate(key, "ar"),
    };
  }
  return ctx;
}