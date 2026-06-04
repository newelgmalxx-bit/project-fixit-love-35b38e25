import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout, PanelCard, PrimaryButton } from "@/components/admin/AdminLayout";
import { DebugRaw } from "@/components/admin/DebugRaw";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageProvider";
import { adminSeoApi } from "@/lib/api/adminSeo";


export const Route = createFileRoute("/admin/seo")({
  head: () => ({ meta: [{ title: "SEO Settings | Admin" }] }),
  component: SeoPage,
});

function SeoPage() {
  const { lang } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);
  const defaultPages = [
    { key: "home", label: L("الرئيسية", "Home"), title: L("خصومات | تصميم وتطوير المواقع والتطبيقات", "koswmat | Web & App Design"), desc: L("وكالة إبداعية متخصصة في تصميم وتطوير المواقع والتطبيقات والهويات البصرية في السعودية.", "A creative agency specialized in web, app, and brand design in Saudi Arabia.") },
    { key: "services", label: L("الخدمات", "Services"), title: L("خدماتنا | خصومات", "Our Services | koswmat"), desc: L("اكتشف خدماتنا في تصميم المواقع، تطبيقات الموبايل، الهويات البصرية، والتسويق الرقمي.", "Explore our services in web design, mobile apps, branding, and digital marketing.") },
    { key: "portfolio", label: L("أعمالنا", "Portfolio"), title: L("أعمالنا | خصومات", "Portfolio | koswmat"), desc: L("معرض مختار من أحدث مشاريعنا في تصميم المواقع وتطوير التطبيقات.", "A curated showcase of our latest web and app projects.") },
    { key: "about", label: L("من نحن", "About"), title: L("من نحن | خصومات", "About Us | koswmat"), desc: L("تعرف على قصتنا وفريقنا ورؤيتنا.", "Learn about our story, team, and vision.") },
    { key: "contact", label: L("تواصل معنا", "Contact"), title: L("تواصل معنا | خصومات", "Contact Us | koswmat"), desc: L("نسعد بالتواصل معك.", "We'd love to hear from you.") },
  ];
  const [global, setGlobal] = useState({ siteName: "خصومات", separator: "|", twitter: "@koswmat", ogImage: "", canonicalBase: "https://koswmat.com" });
  const [pages, setPages] = useState(defaultPages.map(p => ({ ...p, keywords: L("تصميم مواقع، تطبيقات، هوية بصرية", "web design, apps, branding") })));
  const [robots, setRobots] = useState("User-agent: *\nAllow: /\nSitemap: https://koswmat.com/sitemap.xml");
  const [rawDebug, setRawDebug] = useState<unknown>(null);
  useEffect(() => {
    (async () => {
      try {
        const data = await adminSeoApi.get();
        setRawDebug(data);
        if (data?.global) setGlobal({ ...global, ...data.global });
        if (Array.isArray(data?.pages) && data.pages.length) {
          setPages((prev) =>
            prev.map((p) => {
              const remote = data.pages!.find((x: any) => x.key === p.key);
              return remote ? { ...p, ...remote, keywords: remote.keywords ?? p.keywords } : p;
            }),
          );
        }
        if (typeof data?.robots === "string" && data.robots) setRobots(data.robots);
      } catch (e: any) {
        setRawDebug({ error: e?.message || String(e) });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const save = async () => {
    try { await adminSeoApi.update({ global, pages, robots }); toast.success(L("تم الحفظ", "Saved")); }
    catch (e: any) { toast.error(e?.message || L("فشل الحفظ", "Save failed")); }
  };
  return (
    <AdminLayout title={L("إعدادات SEO", "SEO Settings")} subtitle={L("تحكم في عناوين الصفحات والوصف والكلمات الدلالية", "Manage page titles, descriptions, and keywords")} action={<PrimaryButton onClick={save}>{L("حفظ", "Save")}</PrimaryButton>}>
      <DebugRaw label="GET /admin/seo" data={rawDebug} />
      <PanelCard title={L("إعدادات عامة", "General Settings")} className="mb-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <Lb label={L("اسم الموقع", "Site Name")}><input className={ic} value={global.siteName} onChange={e => setGlobal({ ...global, siteName: e.target.value })} /></Lb>
          <Lb label={L("فاصل العنوان", "Title Separator")}><input className={ic} value={global.separator} onChange={e => setGlobal({ ...global, separator: e.target.value })} /></Lb>
          <Lb label={L("حساب تويتر", "Twitter Handle")}><input className={ic} dir="ltr" value={global.twitter} onChange={e => setGlobal({ ...global, twitter: e.target.value })} /></Lb>
          <Lb label={L("رابط Canonical الأساسي", "Base Canonical URL")}><input className={ic} dir="ltr" value={global.canonicalBase} onChange={e => setGlobal({ ...global, canonicalBase: e.target.value })} /></Lb>
          <Lb label={L("صورة Open Graph الافتراضية", "Default Open Graph Image")} full><input className={ic} dir="ltr" placeholder="https://..." value={global.ogImage} onChange={e => setGlobal({ ...global, ogImage: e.target.value })} /></Lb>
        </div>
      </PanelCard>

      <PanelCard title={L("عناوين الصفحات", "Page Titles")} className="mb-6">
        <div className="space-y-4">
          {pages.map((p, i) => (
            <div key={p.key} className="rounded-xl border border-border p-4">
              <div className="text-sm font-bold text-primary mb-3">{p.label}</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Lb label={L("عنوان الصفحة (Title)", "Page Title")}><input className={ic} value={p.title} onChange={e => setPages(pages.map((x, j) => i === j ? { ...x, title: e.target.value } : x))} /></Lb>
                <Lb label={L("الكلمات الدلالية", "Keywords")}><input className={ic} value={p.keywords} onChange={e => setPages(pages.map((x, j) => i === j ? { ...x, keywords: e.target.value } : x))} /></Lb>
                <Lb label={L("وصف الصفحة (Meta Description)", "Meta Description")} full><textarea rows={2} className={ic} value={p.desc} onChange={e => setPages(pages.map((x, j) => i === j ? { ...x, desc: e.target.value } : x))} /></Lb>
              </div>
            </div>
          ))}
        </div>
      </PanelCard>

      <PanelCard title={L("ملف robots.txt", "robots.txt File")}>
        <textarea rows={6} className={ic + " font-mono text-xs"} dir="ltr" value={robots} onChange={e => setRobots(e.target.value)} />
      </PanelCard>
    </AdminLayout>
  );
}
const ic = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
function Lb({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <label className={`text-xs font-bold space-y-1.5 block ${full ? "sm:col-span-2" : ""}`}>{label}{children}</label>;
}
