import { useLang } from "@/i18n/LanguageProvider";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { useState } from "react";

export type BranchAccountForm = {
  isIndependent?: boolean;
  canManageOffers?: boolean;
  canManageHours?: boolean;
  canEditInfo?: boolean;
  canManageBookings?: boolean;
  email?: string | null;
  password?: string | null;
};

/**
 * Reusable form section for the "independent branch" controls. Rendered
 * inside both the admin and partner "add/edit branch" dialogs so behavior
 * stays identical.
 */
export function BranchAccountFields({
  value,
  onChange,
  editing,
  hasAccount,
}: {
  value: BranchAccountForm;
  onChange: (patch: Partial<BranchAccountForm>) => void;
  editing?: boolean;
  hasAccount?: boolean;
}) {
  const { lang } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);
  const [show, setShow] = useState(false);

  const perm = (
    label: string,
    key: keyof BranchAccountForm,
  ) => (
    <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold">
      <input
        type="checkbox"
        checked={!!value[key]}
        onChange={(e) => onChange({ [key]: e.target.checked } as any)}
      />
      {label}
    </label>
  );

  function genPassword() {
    const s = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 4).toUpperCase();
    onChange({ password: s });
  }

  return (
    <div className="rounded-2xl border border-border bg-muted/20 p-3">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!value.isIndependent}
          onChange={(e) => onChange({ isIndependent: e.target.checked })}
        />
        <span className="text-sm font-extrabold">
          {L("فرع مستقل بلوحة تحكم خاصة", "Independent branch with its own dashboard")}
        </span>
      </label>

      {value.isIndependent && (
        <div className="mt-3 space-y-3">
          <div>
            <div className="mb-1.5 text-xs font-bold text-muted-foreground">
              {L("الصلاحيات", "Permissions")}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {perm(L("إدارة العروض", "Manage offers"), "canManageOffers")}
              {perm(L("إدارة ساعات العمل", "Manage hours"), "canManageHours")}
              {perm(L("تعديل بيانات الفرع", "Edit branch info"), "canEditInfo")}
              {perm(L("إدارة الحجوزات", "Manage bookings"), "canManageBookings")}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold">
                {L("إيميل الفرع", "Branch email")} {!editing || !hasAccount ? "*" : ""}
              </label>
              <input
                type="email"
                value={value.email || ""}
                onChange={(e) => onChange({ email: e.target.value })}
                placeholder="branch@example.com"
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold">
                {L("كلمة مرور الفرع", "Branch password")}{" "}
                {editing && hasAccount ? (
                  <span className="text-muted-foreground">
                    {L("(اتركها فارغة للإبقاء عليها)", "(leave blank to keep)")}
                  </span>
                ) : "*"}
              </label>
              <div className="relative mt-1">
                <input
                  type={show ? "text" : "password"}
                  value={value.password || ""}
                  onChange={(e) => onChange({ password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
                <div className="absolute end-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                  <button type="button" onClick={() => setShow((v) => !v)} className="p-1 text-muted-foreground">
                    {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button type="button" onClick={genPassword} title={L("توليد", "Generate")} className="p-1 text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function BranchStatusBadges({
  isIndependent,
  hasAccount,
}: {
  isIndependent?: boolean;
  hasAccount?: boolean;
}) {
  const { lang } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
          isIndependent
            ? "bg-emerald-100 text-emerald-800"
            : "bg-slate-100 text-slate-700"
        }`}
      >
        {isIndependent ? L("مستقل", "Independent") : L("تابع للمركز فقط", "Center-managed")}
      </span>
      {isIndependent && (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            hasAccount ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
          }`}
        >
          {hasAccount ? L("لديه حساب دخول", "Has login") : L("بدون حساب", "No login yet")}
        </span>
      )}
    </div>
  );
}

export function TempPasswordDialog({
  open,
  password,
  onClose,
}: {
  open: boolean;
  password: string | null;
  onClose: () => void;
}) {
  const { lang } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);
  if (!open || !password) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-extrabold">{L("كلمة مرور الفرع المؤقتة", "Branch temporary password")}</h3>
        <p className="mt-2 text-xs text-muted-foreground">
          {L(
            "انسخ كلمة المرور دي وأرسلها للفرع الآن — لن تظهر مرة أخرى.",
            "Copy this password and share it with the branch now — it won't be shown again.",
          )}
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-3 font-mono text-sm">
          <span className="flex-1 select-all break-all">{password}</span>
          <button
            onClick={() => { try { navigator.clipboard.writeText(password); } catch {} }}
            className="rounded-lg bg-primary px-3 py-1 text-xs font-bold text-primary-foreground"
          >
            {L("نسخ", "Copy")}
          </button>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground">
            {L("تم", "Done")}
          </button>
        </div>
      </div>
    </div>
  );
}
