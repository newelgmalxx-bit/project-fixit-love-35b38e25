import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ContactSection } from "@/components/sections/ContactSection";
import heroImg from "@/assets/hero-hairwash.jpg";
import {
  Sparkles, MessageCircle, Phone, Mail, MapPin, Clock,
  Headphones, Zap, ShieldCheck, ChevronDown, ArrowLeft,
  Stethoscope, Dumbbell, ShoppingBag, Percent, Tag,
  HelpCircle, CalendarCheck, Star,
} from "lucide-react";
import { useState } from "react";
import { useLang } from "@/i18n/LanguageProvider";
import { useSiteSettings, telHref, waHref, mailHref } from "@/hooks/useSiteSettings";

function ContactPage() {
  const { t, dir, lang } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);
  const site = useSiteSettings();
  const waNumber = site.whatsapp || site.phone;

  const quickChannels = [
    waNumber ? { icon: MessageCircle, label: t("contactPage.ch.whatsapp"), value: waNumber, href: waHref(waNumber)!, accent: "from-emerald-500 to-emerald-600", ltr: true } : null,
    site.phone ? { icon: Phone, label: t("contactPage.ch.phone"), value: site.phone, href: telHref(site.phone)!, accent: "from-primary to-primary-dark", ltr: true } : null,
    site.email ? { icon: Mail, label: t("contactPage.ch.email"), value: site.email, href: mailHref(site.email)!, accent: "from-sky-500 to-sky-700", ltr: true } : null,
  ].filter(Boolean) as { icon: any; label: string; value: string; href: string; accent: string; ltr?: boolean }[];

  const promises = [
    { icon: ShieldCheck, title: L("عروض موثقة 100%", "100% Verified Offers"), desc: L("كل عرض على المنصة يتم التحقق منه — خصومات حقيقية من متاجر مرخصة ومحلات معتمدة.", "Every offer on the platform is verified — real discounts from licensed centers and certified stores.") },
    { icon: Percent, title: L("خصومات تصل لـ 70%", "Discounts up to 70%"), desc: L("نوفر لك أفضل الأسعار على الجلسات الطبية، اشتراكات الجيم، والمنتجات الصحية.", "We get you the best prices on medical sessions, gym memberships, and health products.") },
    { icon: Tag, title: L("شراء فوري وكوبون سريع", "Instant Purchase & Fast Coupon"), desc: L("اشترِ العرض أو المنتج بضغطة زر — الكوبون يوصلك فورًا على الإيميل والواتساب.", "Buy the offer or product with one click — the coupon reaches you instantly via email and WhatsApp.") },
  ];

  const faqs = [
    { q: L("كيف أشتري عرض من المنصة؟", "How do I buy an offer from the platform?"), a: L("اختار العرض اللي يناسبك، اضغط 'أضف للسلة'، أكمل عملية الشراء وادفع أونلاين — الكوبون يجيك فورًا على الواتساب والإيميل.", "Choose the offer that suits you, click 'Add to Cart', complete checkout and pay online — the coupon is sent instantly to your WhatsApp and email.") },
    { q: L("هل المتاجر والعيادات مرخصة؟", "Are the centers and clinics licensed?"), a: L("نعم، كل الشغلاء على المنصة مرخصين من الجهات الرسمية في المملكة. نتحقق من التراخيص قبل أي تعاون.", "Yes, all partners on the platform are licensed by official authorities in the Kingdom. We verify licenses before any cooperation.") },
    { q: L("كم مدة صلاحية الكوبون؟", "How long is the coupon valid?"), a: L("مدة الصلاحية تختلف حسب العرض — لكن العادة تكون بين 7 إلى 30 يوم من تاريخ الشراء. التفاصيل مكتوبة في كل عرض.", "Validity varies by offer — usually between 7 to 30 days from purchase. Details are written in each offer.") },
    { q: L("هل أقدر ألغي الحجز وأسترجع فلوسي؟", "Can I cancel and get a refund?"), a: L("نعم، لديك حق الإلغاء خلال 24 ساعة من الشراء بشرط عدم استخدام الكوبون. بعدها بتتواصل مع خدمة العملاء لمراجعتها.", "Yes, you have the right to cancel within 24 hours of purchase provided the coupon is unused. After that, contact customer service for review.") },
    { q: L("هل فيه شحن للمنتجات الصحية؟", "Do you ship health products?"), a: L("نعم، معظم المتاجر الشغلاء توفر شحن داخل المملكة. مدة التوصيل والتكلفة تختلف حسب المتجر وموقعك.", "Yes, most partner stores offer shipping within the Kingdom. Delivery time and cost vary by store and your location.") },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-primary/70" />
          <div className="absolute inset-0 bg-grid opacity-10" />
          <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/30 blur-3xl animate-pulse-glow" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl animate-pulse-glow" />

          <div className="relative mx-auto max-w-7xl px-4 py-10 lg:py-12">
            <div className="mx-auto max-w-3xl text-center text-white">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-bold backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                {L("نحن هنا لمساعدتك", "We're here to help you")}
              </span>
              <h1 className="mt-6 text-4xl font-extrabold leading-tight md:text-6xl">
                {L("خلّينا نساعدك", "Let us help you")} <span className="bg-gradient-to-r from-white via-primary-glow to-white bg-clip-text text-transparent">{L("توفّر أكتر", "save more")}</span>
                <br />
                {L("وتستمتع بأفضل الخدمات", "and enjoy the best services")}
              </h1>
              <p className="mt-6 text-lg leading-8 text-white/85">
                {L("فريق خصومات جاهز لاستقبال استفساراتك — سواء شراء عرض، استفسار عن متجر، أو مساعدة في الطلب.", "The Koswmat team is ready to receive your inquiries — whether buying an offer, asking about a center, or help with your order.")}
              </p>
            </div>
          </div>
        </section>

        {/* QUICK CHANNELS */}
        <section className="relative -mt-12 mb-4 px-4">
          <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
            {quickChannels.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="card-hover group relative overflow-hidden rounded-3xl border border-border bg-background p-6 shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${c.accent} text-white shadow-lg`}>
                    <c.icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{c.label}</div>
                    <div className="mt-1 truncate text-base font-extrabold text-foreground" dir={c.ltr ? "ltr" : undefined}>
                      {c.value}
                    </div>
                  </div>
                  <ArrowLeft className={`h-5 w-5 shrink-0 text-muted-foreground transition group-hover:-translate-x-1 group-hover:text-primary ${dir === "ltr" ? "rotate-180" : ""}`} />
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* PROMISES */}
        <section className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-10 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">{L("وعدنا لك", "Our Promise")}</span>
            <h2 className="mt-3 text-3xl font-extrabold text-foreground md:text-4xl">{L("لماذا يثق بنا عملاؤنا؟", "Why our clients trust us?")}</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {promises.map((p) => (
              <div key={p.title} className="card-hover relative rounded-3xl border border-border bg-white p-7">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-extrabold text-foreground">{p.title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CONTACT FORM (reused) */}
        <ContactSection />

        {/* MAP + LOCATION */}
        <section className="mx-auto max-w-7xl px-4 py-8">
          <div className="grid gap-6 overflow-hidden rounded-3xl border border-border bg-white shadow-sm lg:grid-cols-[1fr_1.4fr]">
            <div className="p-8 md:p-10">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">{L("مكتب خصومات", "Koswmat Office")}</span>
              <h2 className="mt-3 text-2xl font-extrabold text-foreground md:text-3xl">
                {L("زورنا أو تواصل معنا", "Visit us or reach out")}
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {L("فريقنا جاهز لاستقبالك والإجابة على كل استفساراتك — سواء كنت تبي تشتري عرض أو تستفسر عن شريك.", "Our team is ready to welcome you and answer all your inquiries — whether you want to buy an offer or ask about a partner.")}
              </p>
              <ul className="mt-6 space-y-4">
                {site.address && <Row icon={MapPin} label={t("contactPage.row.address")} value={site.address} />}
                {site.workHours && <Row icon={Clock} label={t("contactPage.row.hours")} value={site.workHours} />}
                {site.phone && <Row icon={Phone} label={t("contactPage.row.officePhone")} value={site.phone} ltr />}
              </ul>
              <a
                href="https://maps.google.com/?q=Riyadh,Saudi+Arabia"
                target="_blank"
                rel="noreferrer"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-primary-dark"
              >
                {t("common.openInMaps")}
                <ArrowLeft className={`h-4 w-4 ${dir === "ltr" ? "rotate-180" : ""}`} />
              </a>
            </div>
            <div className="relative min-h-[320px] overflow-hidden">
              <iframe
                title="Deals Platform location"
                src={`https://www.google.com/maps?q=Riyadh,Saudi+Arabia&hl=${lang}&z=12&output=embed`}
                className="absolute inset-0 h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-secondary/30 py-10">
          <div className="mx-auto max-w-4xl px-4">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">{L("أسئلة متكررة", "FAQs")}</span>
              <h2 className="mt-3 text-3xl font-extrabold text-foreground md:text-4xl">
                {L("كل اللي تحتاج تعرفه قبل ما تشتري", "Everything you need to know before buying")}
              </h2>
              <p className="mt-4 text-muted-foreground">
                {L("جمعنا لك أكثر الأسئلة اللي يسألها عملاؤنا قبل الشراء.", "We've gathered the most common questions our customers ask before purchasing.")}
              </p>
            </div>
            <div className="mt-12 space-y-3">
              {faqs.map((f, i) => (
                <FaqItem key={i} q={f.q} a={f.a} defaultOpen={i === 0} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-4 py-10">
          <div
            className="relative overflow-hidden rounded-3xl p-10 text-white md:p-14"
            style={{ background: "linear-gradient(135deg, #3F2A6B 0%, #E0254D 100%)" }}
          >
            <div className="absolute inset-0 bg-grid opacity-20" />
            <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h2 className="text-3xl font-extrabold leading-tight md:text-4xl">
                  {L("جاهز توفر على خدماتك الصحية؟", "Ready to save on health services?")}
                </h2>
                <p className="mt-3 text-white/85">
                  {L("تصفح العروض الحالية واشترِ كوبونك أو منتجك بأفضل سعر في المملكة.", "Browse current offers and buy your coupon or product at the best price in the Kingdom.")}
                </p>
              </div>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-extrabold text-primary shadow-xl transition hover:bg-white/90"
              >
                {L("اكتشف العروض", "Discover Offers")}
                <ArrowLeft className={`h-4 w-4 ${dir === "ltr" ? "rotate-180" : ""}`} />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Row({ icon: Icon, label, value, ltr }: { icon: any; label: string; value: string; ltr?: boolean }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-sm font-bold text-foreground" dir={ltr ? "ltr" : undefined}>{value}</div>
      </div>
    </li>
  );
}

function FaqItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className={`overflow-hidden rounded-2xl border bg-background transition ${open ? "border-primary/40 shadow-md" : "border-border"}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-start"
      >
        <span className="text-sm font-extrabold text-foreground md:text-base">{q}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-primary transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <p className="px-6 pb-6 text-sm leading-7 text-muted-foreground">{a}</p>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تواصل معنا — خصومات للعروض والخصومات في السعودية" },
      { name: "description", content: "تواصل مع فريق خصومات للمساعدة في الحجز أو الاستفسار عن العروض والخصومات على الصالونات والعيادات واللياقة في المملكة." },
      { property: "og:title", content: "تواصل معنا — خصومات" },
      { property: "og:description", content: "نحن هنا لمساعدتك في حجز أفضل العروض والخصومات في المملكة العربية السعودية." },
    ],
  }),
  component: ContactPage,
});
