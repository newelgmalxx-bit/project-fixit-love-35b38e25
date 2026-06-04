import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout, PanelCard, PrimaryButton } from "@/components/admin/AdminLayout";
import { useState, useEffect } from "react";
import { Sun, Moon, Monitor, PanelLeft, PanelTop, PanelRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";
import { admin as adminApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings/appearance")({
  head: () => ({ meta: [{ title: "Appearance | Settings" }] }),
  component: AppearancePage,
});

function AppearancePage() {
  const { lang } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);
  const [theme, setTheme] = useState("light");
  const [accent, setAccent] = useState("#00AEC6");
  const [nav, setNav] = useState("right");
  const [direction, setDirection] = useState("rtl");

  useEffect(() => {
    (async () => {
      try {
        const s = await adminApi.settings.get<any>("appearance");
        if (s?.theme) setTheme(s.theme);
        if (s?.accent) setAccent(s.accent);
        if (s?.nav) setNav(s.nav);
        if (s?.direction) setDirection(s.direction);
      } catch {}
    })();
  }, []);

  const save = async () => {
    try { await adminApi.settings.update("appearance", { theme, accent, nav, direction }); toast.success("Saved"); }
    catch (e: any) { toast.error(e?.message || "Save failed"); }
  };

  const accents = ["#00AEC6", "#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#eab308"];

  return (
    <AdminLayout title={L("الإعدادات", "Settings")} subtitle={L("إدارة حسابك وتفضيلاتك", "Manage your account and preferences")} action={<PrimaryButton onClick={save}>{L("حفظ", "Save")}</PrimaryButton>}>
      <PanelCard title={L("المظهر", "Appearance")} subtitle={L("تخصيص شكل وأسلوب لوحة التحكم", "Customize the dashboard look and feel")}>
        <div className="space-y-8">
          <div>
            <h4 className="text-sm font-bold mb-3">{L("السمة", "Theme")}</h4>
            <div className="grid grid-cols-3 gap-3">
              {[["light", L("فاتح", "Light"), Sun], ["dark", L("داكن", "Dark"), Moon], ["system", L("النظام", "System"), Monitor]].map(([k, l, I]: any) => (
                <button key={k} onClick={() => setTheme(k)} className={`rounded-2xl border-2 p-4 transition ${theme === k ? "border-primary bg-primary/5" : "border-border"}`}>
                  <I className="h-8 w-8 mx-auto mb-2 text-foreground/70" />
                  <div className="text-sm font-bold">{l}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold mb-3">{L("اللون المميز", "Accent Color")}</h4>
            <div className="flex flex-wrap gap-3">
              {accents.map(c => (
                <button key={c} onClick={() => setAccent(c)} className={`h-12 w-12 rounded-full transition ${accent === c ? "ring-4 ring-offset-2 ring-primary/40" : ""}`} style={{ background: c }} />
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold mb-3">{L("موضع التنقل", "Navigation Position")}</h4>
            <div className="grid grid-cols-3 gap-3">
              {[["right", L("شريط جانبي يمين", "Sidebar Right"), PanelRight], ["top", L("شريط علوي", "Top Bar"), PanelTop], ["left", L("شريط جانبي يسار", "Sidebar Left"), PanelLeft]].map(([k, l, I]: any) => (
                <button key={k} onClick={() => setNav(k)} className={`rounded-2xl border-2 p-4 transition ${nav === k ? "border-primary bg-primary/5" : "border-border"}`}>
                  <I className="h-8 w-8 mx-auto mb-2 text-foreground/70" />
                  <div className="text-sm font-bold">{l}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold mb-3">{L("اتجاه الموقع", "Site Direction")}</h4>
            <div className="grid grid-cols-2 gap-3">
              {[["rtl", L("عربي (RTL)", "Arabic (RTL)")], ["ltr", L("إنجليزي (LTR)", "English (LTR)")]].map(([k, l]) => (
                <button key={k} onClick={() => setDirection(k)} className={`rounded-2xl border-2 p-4 text-center transition ${direction === k ? "border-primary bg-primary/5" : "border-border"}`}>
                  <div className="text-sm font-bold">{l}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </PanelCard>
    </AdminLayout>
  );
}
