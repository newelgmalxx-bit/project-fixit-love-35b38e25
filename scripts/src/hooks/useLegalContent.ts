import { useEffect, useState } from "react";
import { publicApi } from "@/lib/api";

export type LegalSection = {
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
};

export type LegalDocument = {
  badgeAr?: string;
  badgeEn?: string;
  titleAr?: string;
  titleEn?: string;
  subtitleAr?: string;
  subtitleEn?: string;
  lastUpdatedAr?: string;
  lastUpdatedEn?: string;
  sections: LegalSection[];
};

export type LegalContent = {
  privacy: LegalDocument;
  terms: LegalDocument;
};

const KEY = "saba_legal_content_v1";

function emptyDoc(): LegalDocument {
  return { sections: [] };
}

function read(): LegalContent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LegalContent) : null;
  } catch {
    return null;
  }
}

function normalize(d: any): LegalContent | null {
  if (!d || typeof d !== "object") return null;
  const norm = (doc: any): LegalDocument => {
    if (!doc || typeof doc !== "object") return emptyDoc();
    const sections: LegalSection[] = Array.isArray(doc.sections)
      ? doc.sections.map((s: any) => ({
          titleAr: String(s?.titleAr ?? s?.title_ar ?? ""),
          titleEn: String(s?.titleEn ?? s?.title_en ?? ""),
          bodyAr: String(s?.bodyAr ?? s?.body_ar ?? ""),
          bodyEn: String(s?.bodyEn ?? s?.body_en ?? ""),
        }))
      : [];
    return {
      badgeAr: doc.badgeAr ?? doc.badge_ar,
      badgeEn: doc.badgeEn ?? doc.badge_en,
      titleAr: doc.titleAr ?? doc.title_ar,
      titleEn: doc.titleEn ?? doc.title_en,
      subtitleAr: doc.subtitleAr ?? doc.subtitle_ar,
      subtitleEn: doc.subtitleEn ?? doc.subtitle_en,
      lastUpdatedAr: doc.lastUpdatedAr ?? doc.last_updated_ar,
      lastUpdatedEn: doc.lastUpdatedEn ?? doc.last_updated_en,
      sections,
    };
  };
  return { privacy: norm(d.privacy), terms: norm(d.terms) };
}

export function useLegalContent(): LegalContent {
  const [content, setContent] = useState<LegalContent>(
    () => read() ?? { privacy: emptyDoc(), terms: emptyDoc() },
  );

  useEffect(() => {
    (async () => {
      try {
        const res: any = await publicApi.getSiteSettings();
        const d = res?.data ?? res;
        const next = normalize(d?.legal);
        if (next) {
          setContent(next);
          if (typeof window !== "undefined") {
            localStorage.setItem(KEY, JSON.stringify(next));
          }
        }
      } catch {/* ignore */}
    })();
  }, []);

  return content;
}
