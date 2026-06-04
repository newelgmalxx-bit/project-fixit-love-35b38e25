import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout, PanelCard, PrimaryButton } from "@/components/admin/AdminLayout";
import { DebugRaw } from "@/components/admin/DebugRaw";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageProvider";
import { adminLegalApi } from "@/lib/api/adminLegal";
import { request } from "@/lib/api/client";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import type { LegalContent, LegalDocument, LegalSection } from "@/hooks/useLegalContent";

export const Route = createFileRoute("/admin/legal")({
  head: () => ({ meta: [{ title: "Legal Pages | Admin" }] }),
  component: LegalAdminPage,
});

const emptyDoc = (): LegalDocument => ({ sections: [] });
const emptySection = (): LegalSection => ({ titleAr: "", titleEn: "", bodyAr: "", bodyEn: "" });

// Try parse a backend legal page payload (could be a JSON-encoded LegalDocument
// stored in `content`, or plain text / structured fields). Always returns a LegalDocument.
function parsePage(page: any): LegalDocument {
  if (!page) return emptyDoc();
  const raw = page.content ?? page.body ?? page.contentAr ?? page.bodyAr;
  if (typeof raw === "string" && raw.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return { sections: [], ...parsed };
    } catch {/* fall through */}
  }
  if (page.sections || page.titleAr || page.titleEn) {
    return { sections: [], ...page };
  }
  if (typeof raw === "string" && raw.length) {
    return {
      titleAr: page.titleAr || "",
      titleEn: page.titleEn || "",
      sections: [{ titleAr: "", titleEn: "", bodyAr: page.contentAr || raw, bodyEn: page.contentEn || "" }],
    };
  }
  return emptyDoc();
}

function LegalAdminPage() {
  const { lang } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);
  const [tab, setTab] = useState<"privacy" | "terms">("privacy");
  const [content, setContent] = useState<LegalContent>({ privacy: emptyDoc(), terms: emptyDoc() });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rawDebug, setRawDebug] = useState<unknown>(null);

  useEffect(() => {
    (async () => {
      try {
        // Capture the raw envelope for the temp debug panel below.
        const raw: any = await request(`/admin/legal-pages`);
        setRawDebug(raw);
        const d: any = raw?.data;
        const pages: any[] = Array.isArray(d) ? d : d?.items || d?.pages || [];
        const bySlug: Record<string, any> = {};
        for (const p of pages) if (p?.slug) bySlug[String(p.slug)] = p;
        setContent({
          privacy: parsePage(bySlug.privacy),
          terms: parsePage(bySlug.terms),
        });
      } catch (e: any) {
        setRawDebug({ error: e?.message || String(e) });
        toast.error(e?.message || L("فشل تحميل الصفحات القانونية", "Failed to load legal pages"));
      }
      setLoading(false);
    })();
  }, []);

  const doc = content[tab];
  const setDoc = (next: LegalDocument) => setContent({ ...content, [tab]: next });

  const save = async () => {
    setSaving(true);
    try { localStorage.setItem("saba_legal_content_v1", JSON.stringify(content)); } catch {}
    // Flatten the structured editor into plain Markdown bodies so the backend
    // can store whichever of (bodyAr/bodyEn) or (content JSON) it chooses.
    const flatten = (which: "Ar" | "En") =>
      (doc.sections || [])
        .map((s) => {
          const t = (which === "Ar" ? s.titleAr : s.titleEn) || "";
          const b = (which === "Ar" ? s.bodyAr : s.bodyEn) || "";
          return t ? `## ${t}\n\n${b}` : b;
        })
        .filter(Boolean)
        .join("\n\n");
    try {
      // Send every plausible field name so we map to whatever the backend exposes:
      // - titleAr/titleEn + bodyAr/bodyEn for simple per-slug schemas
      // - content (JSON) so the rich section editor round-trips
      await adminLegalApi.update(tab, {
        slug: tab,
        titleAr: doc.titleAr || "",
        titleEn: doc.titleEn || "",
        bodyAr: flatten("Ar"),
        bodyEn: flatten("En"),
        content: JSON.stringify(doc),
      });
      toast.success(L("تم حفظ الصفحة", "Page saved"));
    } catch (e: any) {
      toast.error(e?.message || L("فشل الحفظ", "Save failed"));
    }
    setSaving(false);
  };


  const updateSection = (i: number, patch: Partial<LegalSection>) => {
    setDoc({ ...doc, sections: doc.sections.map((s, j) => (i === j ? { ...s, ...patch } : s)) });
  };
  const addSection = () => setDoc({ ...doc, sections: [...doc.sections, emptySection()] });
  const removeSection = (i: number) =>
    setDoc({ ...doc, sections: doc.sections.filter((_, j) => j !== i) });
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= doc.sections.length) return;
    const next = doc.sections.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setDoc({ ...doc, sections: next });
  };

  return (
    <AdminLayout
      title={L("الصفحات القانونية", "Legal Pages")}
      subtitle={L("إدارة سياسة الخصوصية والشروط والأحكام", "Manage privacy policy and terms & conditions")}
      action={<PrimaryButton onClick={() => { if (!saving && !loading) save(); }}>{saving ? L("جارٍ الحفظ...", "Saving...") : L("حفظ", "Save")}</PrimaryButton>}
    >
      <DebugRaw label="GET /admin/legal-pages" data={rawDebug} />

      <div className="mb-4 inline-flex rounded-xl border border-border bg-card p-1">
        <button
          onClick={() => setTab("privacy")}
          className={`px-4 py-2 text-xs font-bold rounded-lg ${tab === "privacy" ? "bg-primary text-white" : "text-muted-foreground"}`}
        >
          {L("سياسة الخصوصية", "Privacy Policy")}
        </button>
        <button
          onClick={() => setTab("terms")}
          className={`px-4 py-2 text-xs font-bold rounded-lg ${tab === "terms" ? "bg-primary text-white" : "text-muted-foreground"}`}
        >
          {L("الشروط والأحكام", "Terms & Conditions")}
        </button>
      </div>

      <PanelCard title={L("الترويسة (الهيدر)", "Header")} className="mb-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={L("الشارة (عربي)", "Badge (Arabic)")}>
            <input className={ic} value={doc.badgeAr || ""} onChange={(e) => setDoc({ ...doc, badgeAr: e.target.value })} />
          </Field>
          <Field label={L("الشارة (إنجليزي)", "Badge (English)")}>
            <input className={ic} value={doc.badgeEn || ""} onChange={(e) => setDoc({ ...doc, badgeEn: e.target.value })} />
          </Field>
          <Field label={L("العنوان (عربي)", "Title (Arabic)")}>
            <input className={ic} value={doc.titleAr || ""} onChange={(e) => setDoc({ ...doc, titleAr: e.target.value })} />
          </Field>
          <Field label={L("العنوان (إنجليزي)", "Title (English)")}>
            <input className={ic} value={doc.titleEn || ""} onChange={(e) => setDoc({ ...doc, titleEn: e.target.value })} />
          </Field>
          <Field label={L("النبذة (عربي)", "Subtitle (Arabic)")} full>
            <textarea rows={2} className={ic} value={doc.subtitleAr || ""} onChange={(e) => setDoc({ ...doc, subtitleAr: e.target.value })} />
          </Field>
          <Field label={L("النبذة (إنجليزي)", "Subtitle (English)")} full>
            <textarea rows={2} className={ic} value={doc.subtitleEn || ""} onChange={(e) => setDoc({ ...doc, subtitleEn: e.target.value })} />
          </Field>
          <Field label={L("آخر تحديث (عربي)", "Last Updated (Arabic)")}>
            <input className={ic} value={doc.lastUpdatedAr || ""} onChange={(e) => setDoc({ ...doc, lastUpdatedAr: e.target.value })} />
          </Field>
          <Field label={L("آخر تحديث (إنجليزي)", "Last Updated (English)")}>
            <input className={ic} value={doc.lastUpdatedEn || ""} onChange={(e) => setDoc({ ...doc, lastUpdatedEn: e.target.value })} />
          </Field>
        </div>
      </PanelCard>

      <PanelCard
        title={L("الأقسام", "Sections")}
        subtitle={L("كل قسم يظهر في الصفحة بعنوان ونص", "Each section appears on the page with a title and body")}
      >
        <div className="space-y-4">
          {doc.sections.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {L("لا توجد أقسام بعد. اضغط أضف قسماً للبدء.", "No sections yet. Click Add section to start.")}
            </div>
          )}
          {doc.sections.map((s, i) => (
            <div key={i} className="rounded-xl border border-border p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="text-xs font-bold text-primary">
                  {L("قسم", "Section")} #{i + 1}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => move(i, -1)} className="rounded-lg border border-border p-1.5 hover:bg-accent" aria-label="up">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => move(i, 1)} className="rounded-lg border border-border p-1.5 hover:bg-accent" aria-label="down">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => removeSection(i)} className="rounded-lg border border-destructive/40 p-1.5 text-destructive hover:bg-destructive/10" aria-label="delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={L("العنوان (عربي)", "Title (Arabic)")}>
                  <input className={ic} value={s.titleAr} onChange={(e) => updateSection(i, { titleAr: e.target.value })} />
                </Field>
                <Field label={L("العنوان (إنجليزي)", "Title (English)")}>
                  <input className={ic} value={s.titleEn} onChange={(e) => updateSection(i, { titleEn: e.target.value })} />
                </Field>
                <Field label={L("النص (عربي)", "Body (Arabic)")} full>
                  <textarea rows={4} className={ic} value={s.bodyAr} onChange={(e) => updateSection(i, { bodyAr: e.target.value })} />
                </Field>
                <Field label={L("النص (إنجليزي)", "Body (English)")} full>
                  <textarea rows={4} className={ic} value={s.bodyEn} onChange={(e) => updateSection(i, { bodyEn: e.target.value })} />
                </Field>
              </div>
            </div>
          ))}
          <button
            onClick={addSection}
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-primary/50 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5"
          >
            <Plus className="h-4 w-4" /> {L("أضف قسماً", "Add section")}
          </button>
        </div>
      </PanelCard>
    </AdminLayout>
  );
}

const ic = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`text-xs font-bold space-y-1.5 block ${full ? "sm:col-span-2" : ""}`}>
      {label}
      {children}
    </label>
  );
}
