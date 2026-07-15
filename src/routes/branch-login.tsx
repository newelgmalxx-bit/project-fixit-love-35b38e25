import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Loader2, MapPin, AlertCircle, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { LangSwitch } from "@/components/layout/SiteHeader";
import { useLang } from "@/i18n/LanguageProvider";
import { branchAuth } from "@/lib/api/branch";

export const Route = createFileRoute("/branch-login")({
  head: () => ({
    meta: [
      { title: "Branch Sign in | Koswmat" },
      { name: "description", content: "Branch dashboard sign-in for independent branches on Koswmat." },
    ],
  }),
  component: BranchLoginPage,
});

function BranchLoginPage() {
  const { lang, dir, toggle } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);
  const navigate = useNavigate();
  const [step, setStep] = useState<"password" | "otp">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError(L("أدخل بريدًا إلكترونيًا صحيحًا", "Enter a valid email")); return;
    }
    if (!password) { setError(L("أدخل كلمة المرور", "Enter your password")); return; }
    setSubmitting(true);
    try {
      const d: any = await branchAuth.login({ email: email.trim(), password });
      if (d?.requiresOtp) { setStep("otp"); toast.success(L("تم إرسال رمز التحقق", "Verification code sent")); return; }
      toast.success(L("مرحباً بعودتك", "Welcome back"));
      navigate({ to: "/branch" as any });
    } catch (err: any) {
      const status = err?.status;
      if (status === 403) setError(err?.message || L("لوحة تحكم هذا الفرع غير مفعّلة حاليًا", "This branch dashboard is not active"));
      else if (status === 429) setError(err?.message || L("محاولات كثيرة، حاول لاحقًا", "Too many attempts, try again later"));
      else setError(err?.message || L("بيانات الدخول غير صحيحة", "Invalid credentials"));
    } finally { setSubmitting(false); }
  }

  async function onOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{4,8}$/.test(otp.trim())) { setError(L("أدخل الرمز", "Enter the code")); return; }
    setSubmitting(true);
    try {
      await branchAuth.verifyOtp({ email: email.trim(), otp: otp.trim() });
      toast.success(L("مرحباً بك", "Welcome"));
      navigate({ to: "/branch" as any });
    } catch (err: any) {
      setError(err?.message || L("الرمز غير صحيح أو منتهي", "Invalid or expired code"));
    } finally { setSubmitting(false); }
  }

  async function resend() {
    setError(null); setResending(true);
    try {
      await branchAuth.resendOtp({ email: email.trim() });
      toast.success(L("تم إرسال رمز جديد", "New code sent"));
    } catch (err: any) {
      setError(err?.message || L("تعذّر إعادة الإرسال", "Failed to resend"));
    } finally { setResending(false); }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-8" dir={dir}>
      <div className={`absolute top-4 z-20 ${dir === "rtl" ? "left-4" : "right-4"}`}>
        <LangSwitch lang={lang} onClick={toggle} />
      </div>
      <div className="mx-auto flex max-w-md flex-col items-center justify-center pt-16">
        <div className="w-full rounded-3xl bg-white p-8 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.25)]">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {step === "password" ? <MapPin className="h-7 w-7" /> : <KeyRound className="h-7 w-7" />}
            </div>
          </div>
          <h1 className="text-center text-2xl font-extrabold text-foreground">
            {step === "password" ? L("تسجيل دخول الفرع", "Branch sign in") : L("رمز التحقق", "Verify code")}
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {step === "password"
              ? L("ادخل لإدارة فرعك", "Sign in to manage your branch")
              : L("أرسلنا رمزًا إلى بريدك", "We sent a code to your email")}
          </p>

          {error && (
            <div role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="font-bold">{error}</div>
            </div>
          )}

          {step === "password" ? (
            <form className="mt-6 space-y-4" onSubmit={onPassword}>
              <div>
                <label className="mb-1.5 block text-xs font-bold">{L("البريد الإلكتروني", "Email")}</label>
                <div className="relative">
                  <Mail className={`pointer-events-none absolute inset-y-0 ${dir === "rtl" ? "left-3" : "right-3"} my-auto h-4 w-4 text-muted-foreground`} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="branch@example.com"
                    className="w-full rounded-xl border border-border bg-white px-3 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold">{L("كلمة المرور", "Password")}</label>
                <div className="relative">
                  <Lock className={`pointer-events-none absolute inset-y-0 ${dir === "rtl" ? "left-3" : "right-3"} my-auto h-4 w-4 text-muted-foreground`} />
                  <button type="button" onClick={() => setShowPwd((v) => !v)}
                    className={`absolute inset-y-0 ${dir === "rtl" ? "right-3" : "left-3"} my-auto flex items-center text-muted-foreground`}>
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <input type={showPwd ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-border bg-white px-10 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <button type="submit" disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-extrabold text-primary-foreground disabled:opacity-70">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {L("دخول", "Sign in")}
              </button>
            </form>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={onOtp}>
              <div>
                <label className="mb-1.5 block text-xs font-bold">{L("رمز التحقق", "Verification code")}</label>
                <input inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full rounded-xl border border-border bg-white px-3 py-3 text-center text-lg tracking-[0.5em] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <button type="submit" disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-extrabold text-primary-foreground disabled:opacity-70">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {L("تحقق", "Verify")}
              </button>
              <div className="flex items-center justify-between text-xs">
                <button type="button" onClick={() => setStep("password")} className="font-bold text-muted-foreground">
                  {L("تغيير البريد", "Change email")}
                </button>
                <button type="button" onClick={resend} disabled={resending} className="font-bold text-primary disabled:opacity-60">
                  {resending ? L("جارٍ الإرسال…", "Resending…") : L("إعادة الإرسال", "Resend code")}
                </button>
              </div>
            </form>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/" className="font-bold text-primary hover:underline">{L("العودة للرئيسية", "Back to home")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
