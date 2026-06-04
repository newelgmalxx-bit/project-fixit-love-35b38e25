import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout, PanelCard, PrimaryButton, GhostButton, Pill } from "@/components/admin/AdminLayout";
import { useState, useEffect } from "react";
import { Upload, Camera, Mail, Phone, Lock } from "lucide-react";
import { toast } from "sonner";
import { uploadImage } from "@/lib/image";
import { useLang } from "@/i18n/LanguageProvider";
import { account as accountApi, admin as adminApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin/settings/profile")({
  head: () => ({ meta: [{ title: "Profile | Settings" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { lang, dir } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);
  const { user, refresh } = useAuth();
  const [p, setP] = useState({
    avatar: "", name: "John Doe", email: "john@saba.sa", phone: "+966 55 111 0001",
    title: L("مدير عام", "General Manager"), bio: "", language: "ar", timezone: "Asia/Riyadh",
  });
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setP((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        avatar: user.avatar || prev.avatar,
        language: user.language || prev.language,
      }));
    }
    (async () => {
      try {
        const s = await adminApi.settings.get<any>("profile");
        if (s) setP((prev) => ({ ...prev, title: s.title || prev.title, bio: s.bio || prev.bio, timezone: s.timezone || prev.timezone }));
      } catch {}
    })();
  }, [user]);

  const saveAll = async () => {
    setSaving(true);
    try {
      await accountApi.updateProfile({ name: p.name, phone: p.phone });
      await adminApi.settings.update("profile", { title: p.title, bio: p.bio, timezone: p.timezone, language: p.language }).catch(() => {});
      await refresh();
      toast.success(L("تم حفظ التغييرات", "Changes saved"));
    } catch (e: any) {
      toast.error(e?.message || L("تعذّر الحفظ", "Could not save"));
    } finally { setSaving(false); }
  };

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const url = await uploadImage(f);
    setP({ ...p, avatar: url });
    try { await accountApi.updateProfile({ name: p.name, phone: p.phone, avatar: url }); await refresh(); } catch {}
  };
  const initials = p.name.split(" ").map(n => n[0]).slice(0, 2).join("");

  const changePwd = async () => {
    if (!pwd.current || !pwd.next) { toast.error(L("املأ جميع الحقول", "Fill all fields")); return; }
    if (pwd.next !== pwd.confirm) { toast.error(L("كلمتا المرور غير متطابقتين", "Passwords do not match")); return; }
    try {
      await accountApi.changePassword(pwd.current, pwd.next);
      toast.success(L("تم تحديث كلمة المرور", "Password updated"));
      setPwd({ current: "", next: "", confirm: "" });
    } catch (e: any) {
      toast.error(e?.message || L("تعذّر التحديث", "Could not update"));
    }
  };
  const startSide = dir === "rtl" ? "right-3" : "left-3";
  const padStart = dir === "rtl" ? "pr-9" : "pl-9";
  const corner = dir === "rtl" ? "-bottom-1 -left-1" : "-bottom-1 -right-1";

  return (
    <AdminLayout title={L("الإعدادات", "Settings")} subtitle={L("إدارة حسابك وتفضيلاتك", "Manage your account and preferences")} action={<PrimaryButton onClick={saveAll}>{saving ? L("جاري الحفظ...", "Saving...") : L("حفظ التغييرات", "Save Changes")}</PrimaryButton>}>
      <PanelCard className="mb-6">
        <div className="flex flex-wrap items-center gap-5">
          <div className="relative">
            {p.avatar
              ? <img loading="lazy" decoding="async" src={p.avatar} alt={p.name} className="h-24 w-24 rounded-2xl object-cover" />
              : <div className="h-24 w-24 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl font-extrabold">{initials}</div>
            }
            <label className={`absolute ${corner} flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow cursor-pointer`}>
              <Camera className="h-4 w-4" />
              <input type="file" accept="image/*" className="hidden" onChange={upload} />
            </label>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xl font-extrabold">{p.name}</div>
            <div className="text-sm text-muted-foreground">{p.title}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Pill tone="amber">{L("مالك", "Owner")}</Pill>
              <Pill tone="primary">{L("مدير", "Admin")}</Pill>
            </div>
          </div>
          <label className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 text-xs font-bold text-primary cursor-pointer hover:bg-primary/10">
            <Upload className="h-3.5 w-3.5" /> {L("تغيير الصورة", "Change Photo")}
            <input type="file" accept="image/*" className="hidden" onChange={upload} />
          </label>
        </div>
      </PanelCard>

      <PanelCard title={L("المعلومات الشخصية", "Personal Information")} className="mb-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <Lb label={L("الاسم الكامل", "Full Name")}><input className={ic} value={p.name} onChange={e => setP({ ...p, name: e.target.value })} /></Lb>
          <Lb label={L("المسمى الوظيفي", "Job Title")}><input className={ic} value={p.title} onChange={e => setP({ ...p, title: e.target.value })} /></Lb>
          <Lb label={L("البريد الإلكتروني", "Email")}><div className="relative"><Mail className={`absolute ${startSide} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} /><input className={`${ic} ${padStart}`} value={p.email} onChange={e => setP({ ...p, email: e.target.value })} /></div></Lb>
          <Lb label={L("رقم الجوال", "Phone")}><div className="relative"><Phone className={`absolute ${startSide} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} /><input type="tel" inputMode="tel" className={`${ic} ${padStart}`} dir="ltr" value={p.phone} onChange={e => setP({ ...p, phone: e.target.value })} /></div></Lb>
          <Lb label={L("اللغة", "Language")}>
            <select className={ic} value={p.language} onChange={e => setP({ ...p, language: e.target.value })}>
              <option value="ar">العربية</option><option value="en">English</option>
            </select>
          </Lb>
          <Lb label={L("المنطقة الزمنية", "Timezone")}>
            <select className={ic} value={p.timezone} onChange={e => setP({ ...p, timezone: e.target.value })}>
              <option value="Asia/Riyadh">{L("الرياض", "Riyadh")} (GMT+3)</option>
              <option value="Asia/Dubai">{L("دبي", "Dubai")} (GMT+4)</option>
              <option value="Africa/Cairo">{L("القاهرة", "Cairo")} (GMT+2)</option>
            </select>
          </Lb>
          <Lb label={L("نبذة", "Bio")} full><textarea rows={3} className={ic} value={p.bio} onChange={e => setP({ ...p, bio: e.target.value })} /></Lb>
        </div>
      </PanelCard>

      <PanelCard title={L("تغيير كلمة المرور", "Change Password")}>
        <div className="grid gap-3 sm:grid-cols-3">
          <Lb label={L("كلمة المرور الحالية", "Current Password")}><div className="relative"><Lock className={`absolute ${startSide} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} /><input type="password" className={`${ic} ${padStart}`} value={pwd.current} onChange={e => setPwd({ ...pwd, current: e.target.value })} /></div></Lb>
          <Lb label={L("كلمة المرور الجديدة", "New Password")}><input type="password" className={ic} value={pwd.next} onChange={e => setPwd({ ...pwd, next: e.target.value })} /></Lb>
          <Lb label={L("تأكيد كلمة المرور", "Confirm Password")}><input type="password" className={ic} value={pwd.confirm} onChange={e => setPwd({ ...pwd, confirm: e.target.value })} /></Lb>
        </div>
        <div className="mt-4 flex gap-2">
          <PrimaryButton onClick={changePwd}>{L("تحديث كلمة المرور", "Update Password")}</PrimaryButton>
          <GhostButton onClick={() => setPwd({ current: "", next: "", confirm: "" })}>{L("إلغاء", "Cancel")}</GhostButton>
        </div>
      </PanelCard>
    </AdminLayout>
  );
}
const ic = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
function Lb({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <label className={`text-xs font-bold space-y-1.5 block ${full ? "sm:col-span-2" : ""}`}>{label}{children}</label>;
}
