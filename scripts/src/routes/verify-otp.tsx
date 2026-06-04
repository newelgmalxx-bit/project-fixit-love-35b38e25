import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, KeyRound, Loader2, AlertCircle, Check } from "lucide-react";
import { LangSwitch } from "@/components/layout/SiteHeader";
import { useLang } from "@/i18n/LanguageProvider";
import { useAuth } from "@/hooks/useAuth";
import { auth as authApi } from "@/lib/api/auth";
import { setToken, setUser as setStoredUser } from "@/lib/api/client";
import { toast } from "sonner";

function destinationFor(role?: string): string {
  if (role === "admin") return "/admin";
  if (role === "partner") return "/partner-dashboard";
  return "/account";
}

function VerifyOtpPage() {
  const { lang, dir, t, toggle } = useLang();
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const search = useSearch({ from: "/verify-otp" }) as { email?: string; mode?: string };
  const emailFromQuery = search?.email || "";
  const mode: "signup" | "login" = search?.mode === "login" ? "login" : "signup";

  const [email, setEmail] = useState(emailFromQuery);
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (user) navigate({ to: destinationFor(user.role) as any });
  }, [user, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError(lang === "ar" ? "أدخل بريدًا صحيحًا" : "Enter a valid email");
      return;
    }
    if (!/^\d{4,8}$/.test(otp.trim())) {
      setError(lang === "ar" ? "أدخل الرمز المرسل إلى بريدك" : "Enter the code sent to your email");
      return;
    }
    setSubmitting(true);
    try {
      const data: any = mode === "login"
        ? await authApi.verifyEmailOtp({ email: email.trim(), otp: otp.trim() })
        : await authApi.verifyRegisterOtp({ email: email.trim(), otp: otp.trim() });
      // data may be { user, token } (unwrapped) or { data: { user, token } }
      const token = data?.token ?? data?.data?.token;
      const u = data?.user ?? data?.data?.user;
      if (token) setToken(token);
      if (u) setStoredUser(u);
      await refresh();
      toast.success(mode === "login"
        ? (lang === "ar" ? "تم تسجيل الدخول" : "Logged in")
        : (lang === "ar" ? "تم تفعيل الحساب" : "Account verified"));
      navigate({ to: destinationFor(u?.role) as any });
    } catch (err: any) {
      setError(err?.message || (lang === "ar" ? "رمز غير صحيح أو منتهي" : "Invalid or expired code"));
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    setError(null);
    setInfo(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError(lang === "ar" ? "أدخل بريدًا صحيحًا" : "Enter a valid email");
      return;
    }
    setResending(true);
    try {
      if (mode === "login") {
        await authApi.requestEmailOtp({ email: email.trim() });
      } else {
        await authApi.resendRegisterOtp({ email: email.trim() });
      }
      setInfo(lang === "ar" ? "تم إرسال رمز جديد إلى بريدك" : "A new code has been sent to your email");
      setCooldown(60);
    } catch (err: any) {
      setError(err?.message || (lang === "ar" ? "تعذر إعادة الإرسال" : "Failed to resend"));
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-8" dir={dir}>
      <div className={`absolute top-4 z-20 ${dir === "rtl" ? "left-4" : "right-4"} sm:top-6`}>
        <LangSwitch lang={lang} onClick={toggle} />
      </div>
      <div className="mx-auto flex max-w-md flex-col items-center justify-center pt-16">
        <div className="w-full rounded-3xl bg-white p-8 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.25)]">
          <div className="mb-6 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <KeyRound className="h-7 w-7" />
            </div>
          </div>
          <h1 className="text-center text-2xl font-extrabold text-foreground">
            {lang === "ar" ? "تأكيد البريد الإلكتروني" : "Verify your email"}
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {lang === "ar"
              ? "أدخل الرمز المرسل إلى بريدك لإتمام التسجيل"
              : "Enter the code we sent to your inbox to finish signing up"}
          </p>

          {error && (
            <div role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="font-bold">{error}</div>
            </div>
          )}
          {info && !error && (
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
              <Check className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="font-bold">{info}</div>
            </div>
          )}

          <form className="mt-6 space-y-5" onSubmit={onSubmit}>
            <div className="text-start">
              <label className="mb-1.5 block text-xs font-bold text-foreground">
                {lang === "ar" ? "البريد الإلكتروني" : "Email"}
              </label>
              <div className="relative">
                <span className={`pointer-events-none absolute inset-y-0 ${dir === "rtl" ? "left-3" : "right-3"} flex items-center text-muted-foreground`}>
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-border bg-white px-10 py-3 text-start text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="text-start">
              <label className="mb-1.5 block text-xs font-bold text-foreground">
                {lang === "ar" ? "رمز التحقق" : "Verification code"}
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                placeholder="••••••"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-center text-lg tracking-[0.5em] placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={resend}
                disabled={resending || cooldown > 0}
                className="mt-2 text-xs font-bold text-primary hover:underline disabled:opacity-60"
              >
                {cooldown > 0
                  ? (lang === "ar" ? `إعادة الإرسال خلال ${cooldown}ث` : `Resend in ${cooldown}s`)
                  : (lang === "ar" ? "إعادة إرسال الرمز" : "Resend code")}
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-primary-dark disabled:opacity-70"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting
                ? (lang === "ar" ? "جارٍ التحقق..." : "Verifying...")
                : (lang === "ar" ? "تأكيد" : "Verify")}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/login" className="font-bold text-primary hover:underline">
              {lang === "ar" ? "العودة لتسجيل الدخول" : "Back to sign in"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/verify-otp")({
  validateSearch: (s: Record<string, unknown>) => ({ email: (s.email as string) || "", mode: (s.mode as string) || "signup" }),
  component: VerifyOtpPage,
});
