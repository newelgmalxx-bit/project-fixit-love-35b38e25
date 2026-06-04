import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Sparkles, TrendingUp, Users, BadgeCheck, ShieldCheck, Headphones, Store, ArrowLeft, Check,
  Mail, Lock, Eye, EyeOff, Loader2, ClipboardCheck,
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { useCategories } from "@/hooks/useCatalog";
import { partnerAuth } from "@/lib/api/partner";
import partnerHero from "@/assets/partner-hero.webp";

export const Route = createFileRoute("/partner")({
  head: () => ({
    meta: [
      { title: "كن شريكاً | خصومات" },
      { name: "description", content: "انضم إلى شبكة شركاء خصومات في السعودية — سجّل مركزك (طبي، صالون، حجامة، لياقة، مختبر، سبا، غسيل سيارات) واستقبل حجوزات جديدة بكل سهولة عبر لوحة تحكم خاصة بك." },
      { property: "og:title", content: "كن شريكاً | خصومات" },
      { property: "og:description", content: "وسّع نشاطك واستقبل عملاء جدد في 7 تصنيفات مختلفة عبر منصة خصومات في المملكة." },
      { property: "og:image", content: partnerHero },
    ],
  }),
  component: PartnerPage,
});

type Form = {
  vendorName: string;
  ownerName: string;
  category: string;
  city: string;
  phone: string;
  email: string;
  password: string;
  commercialNumber: string;
  notes: string;
};

const initial: Form = {
  vendorName: "", ownerName: "", category: "", city: "",
  phone: "", email: "", password: "", commercialNumber: "", notes: "",
};

const benefits = [
  { icon: TrendingUp, title: "زيادة الحجوزات", text: "وصول لآلاف العملاء الباحثين عن خدمتك يومياً في جميع التصنيفات" },
  { icon: Users, title: "عملاء حقيقيون", text: "حجوزات مؤكدة ومدفوعة مسبقاً عبر المنصة" },
  { icon: BadgeCheck, title: "ملف موثّق", text: "علامة توثيق وتقييمات حقيقية تبني ثقة عملائك" },
  { icon: ShieldCheck, title: "مدفوعات آمنة", text: "تسوية مالية أسبوعية مع تقارير مفصّلة" },
  { icon: Headphones, title: "دعم مخصّص", text: "مدير حساب يساعدك على رفع أدائك" },
  { icon: Store, title: "لوحة تحكم خاصة", text: "إدارة كاملة للعروض والحجوزات والإحصائيات لكل تصنيف" },
];

const steps = [
  { n: "01", title: "سجّل بياناتك", text: "أنشئ حساب الشريك خلال دقيقتين" },
  { n: "02", title: "مراجعة من الإدارة", text: "نراجع طلبك ونرسل لك اتفاقية الشراكة مع نسبة العمولة" },
  { n: "03", title: "وقّع الاتفاقية", text: "افتح اتفاقيتك من لوحة التحكم ووقّعها إلكترونياً" },
  { n: "04", title: "تفعيل وبدء العمل", text: "يتم تفعيل حسابك تلقائياً بعد التوقيع — أضف عروضك واستقبل الحجوزات" },
];

function PartnerPage() {
  const { categories } = useCategories();
  const [f, setF] = useState<Form>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const navigate = useNavigate();
  const upd = <K extends keyof Form,>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.vendorName || !f.ownerName || !f.phone || !f.category || !f.city || !f.email || !f.password) {
      toast.error("يرجى تعبئة كل الحقول المطلوبة");
      return;
    }
    if (f.password.length < 8) {
      toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }
    setSubmitting(true);
    try {
      await partnerAuth.register({
        vendorName: f.vendorName,
        ownerName: f.ownerName,
        email: f.email.trim(),
        phone: f.phone,
        password: f.password,
        category: f.category,
        city: f.city,
        commercialNumber: f.commercialNumber || undefined,
        notes: f.notes || undefined,
      });
      setSubmitted(true);
      toast.success("تم استلام طلبك بنجاح. ستراجعه الإدارة وترسل لك اتفاقية الشراكة قريباً.");
      setF(initial);
      setTimeout(() => navigate({ to: "/partner-dashboard" as any }), 2000);
    } catch (err: any) {
      toast.error(err?.message || "حدث خطأ، حاول مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background" dir="rtl">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero with image */}
        <section className="relative overflow-hidden">
          <img
            src={partnerHero}
            alt="شراكة خصومات"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#3F2A6B]/85 via-[#5b3a8a]/75 to-[#E0254D]/80" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 text-white sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold backdrop-blur">
                <Sparkles className="h-3 w-3" /> فرصة لأصحاب المراكز الطبية، الصالونات، الحجامة، اللياقة، المختبرات، السبا، وغسيل السيارات
              </span>
              <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight drop-shadow sm:text-5xl">
                كن شريكاً مع <span className="text-amber-300">خصومات</span>
                <br />
                ووسّع نشاطك
              </h1>
              <p className="mt-4 max-w-lg text-base text-white/90">
                انضم لأكثر من 500 مركز شريك على منصتنا في 7 تصنيفات مختلفة. سجّل مركزك واستلم لوحة تحكم خاصة بك تدير منها كل العروض والحجوزات والإيرادات.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm font-bold">
                <a href="#partner-form" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-foreground shadow-lg transition hover:-translate-y-0.5">
                  سجّل الآن مجاناً <ArrowLeft className="h-4 w-4" />
                </a>
                <Link to={"/partner-login" as any} className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-3 text-white backdrop-blur transition hover:bg-white/20">
                  لدي حساب شريك
                </Link>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-3 text-center">
                {[
                  { n: "+500", l: "مركز شريك" },
                  { n: "+10K", l: "حجز شهري" },
                  { n: "4.8★", l: "رضا الشركاء" },
                ].map((s) => (
                  <div key={s.l} className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur">
                    <div className="text-xl font-black">{s.n}</div>
                    <div className="text-[11px] text-white/80">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="relative rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur">
                <div className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-white/80">7 تصنيفات مفتوحة للشراكة</div>
                <div className="grid grid-cols-2 gap-2.5">
                  {categories.map((c) => (
                    <div key={c.slug} className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/5">
                      <img src={c.cover} alt={c.nameAr} className="h-20 w-full object-cover opacity-80 transition group-hover:scale-110 group-hover:opacity-100" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-white">
                          <span>{c.icon}</span>
                          <span className="truncate">{c.nameAr}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Form */}
        <section id="partner-form" className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
            <div className="bg-gradient-to-r from-[#3F2A6B] to-[#E0254D] p-6 text-white">
              <h2 className="text-2xl font-extrabold">أنشئ حساب الشريك</h2>
              <p className="mt-1 text-sm text-white/85">عبّي البيانات وهتحصل على لوحة تحكم خاصة بك بعد الموافقة</p>
            </div>

            {submitted && (
              <div className="m-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
                <Check className="h-5 w-5" />
                <div className="text-sm font-bold">تم استلام طلبك — جاري تحويلك للوحة التحكم</div>
              </div>
            )}

            <form onSubmit={submit} className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
              <Field label="اسم المركز *" value={f.vendorName} onChange={(v) => upd("vendorName", v)} placeholder="مثال: مركز لمسة جمال / مغسلة الصفوة" />
              <Field label="اسم المسؤول *" value={f.ownerName} onChange={(v) => upd("ownerName", v)} placeholder="الاسم الكامل" />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground">التصنيف *</label>
                <select
                  value={f.category}
                  onChange={(e) => upd("category", e.target.value)}
                  className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">اختر التصنيف</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.nameAr}</option>
                  ))}
                </select>
              </div>
              <Field label="المدينة *" value={f.city} onChange={(v) => upd("city", v)} placeholder="الرياض" />

              <Field label="رقم الجوال *" value={f.phone} onChange={(v) => upd("phone", v)} placeholder="+966 5X XXX XXXX" type="tel" />
              <Field label="البريد الإلكتروني *" value={f.email} onChange={(v) => upd("email", v)} placeholder="you@example.com" type="email" icon={<Mail className="h-4 w-4" />} />

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground">كلمة المرور * (8 أحرف على الأقل)</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-muted-foreground">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type={showPwd ? "text" : "password"}
                    value={f.password}
                    onChange={(e) => upd("password", e.target.value)}
                    placeholder="••••••••"
                    className="h-11 w-full rounded-xl border border-border bg-background ps-9 pe-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute inset-y-0 end-3 flex items-center text-muted-foreground hover:text-foreground"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Field label="السجل التجاري" value={f.commercialNumber} onChange={(v) => upd("commercialNumber", v)} placeholder="1010XXXXXX" className="sm:col-span-2" />

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground">ملاحظات إضافية</label>
                <textarea
                  value={f.notes}
                  onChange={(e) => upd("notes", e.target.value)}
                  rows={3}
                  placeholder="عرّفنا أكتر عن نشاطك..."
                  className="rounded-xl border border-border bg-background p-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* تنبيه بسير العمل */}
              <div className="sm:col-span-2 rounded-2xl border-2 border-primary/30 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ClipboardCheck className="h-5 w-5" />
                  </div>
                  <div className="text-xs leading-6 text-foreground/85">
                    بعد إرسال الطلب يتم إنشاء حساب مركزك بحالة <b className="text-primary">قيد المراجعة</b>. تقوم الإدارة بمراجعة بياناتك وإرسال اتفاقية الشراكة (تتضمّن نسبة العمولة/العربون الخاصة بمركزك) إلى لوحة تحكم الشريك. بمجرد توقيع الاتفاقية إلكترونياً من حسابك يتم <b className="text-primary">تفعيل الحساب تلقائياً</b> وتتمكن من إضافة العروض واستقبال الحجوزات.
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#3F2A6B] to-[#E0254D] px-6 py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {submitting ? "جاري إرسال الطلب..." : "إرسال طلب الانضمام"}
                  {!submitting && <ArrowLeft className="h-4 w-4" />}
                </button>
                <p className="mt-3 text-center text-[11px] text-muted-foreground">
                  {submitted ? "تم استلام طلبك — جاري تحويلك للوحة التحكم..." : "سيصلك إشعار داخل لوحة تحكم الشريك بمجرد إرسال الاتفاقية من الإدارة."}
                </p>
              </div>

            </form>
          </div>
        </section>

        {/* Benefits */}
        <section id="benefits" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
              لماذا تنضم{" "}
              <span className="bg-gradient-to-r from-[#3F2A6B] to-[#E0254D] bg-clip-text text-transparent">إلينا؟</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              مزايا حقيقية تجعل شراكتك مع خصومات قراراً رابحاً
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <div key={b.title} className="group rounded-3xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3F2A6B] to-[#E0254D] text-white shadow-md transition group-hover:scale-110">
                  <b.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-extrabold text-foreground">{b.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{b.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section className="bg-muted/30 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">كيف نبدأ؟</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
                4 خطوات بسيطة ويصبح ملفك جاهزاً
              </p>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s) => (
                <div key={s.n} className="relative rounded-3xl border border-border bg-card p-6">
                  <div className="text-4xl font-black bg-gradient-to-br from-[#3F2A6B] to-[#E0254D] bg-clip-text text-transparent">
                    {s.n}
                  </div>
                  <h3 className="mt-3 text-base font-extrabold text-foreground">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>


      <SiteFooter />
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text", className = "", icon,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; className?: string; icon?: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-bold text-foreground">{label}</label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-muted-foreground">{icon}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`h-11 w-full rounded-xl border border-border bg-background ${icon ? "ps-9" : "ps-3"} pe-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20`}
        />
      </div>
    </div>
  );
}
