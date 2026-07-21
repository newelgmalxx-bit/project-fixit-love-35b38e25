import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import heroImage from "@/assets/hero-medical-1.webp";
import quoteImage from "@/assets/hero-carwash.webp";
import imgSalon from "@/assets/hero-hair-blonde.webp";
import imgSpa from "@/assets/hero-facial.webp";
import imgFitness from "@/assets/hero-fitness-1.webp";
import imgCarwash from "@/assets/hero-carwash.webp";
import imgMedical from "@/assets/hero-medical-1.webp";
import imgLab from "@/assets/hero-hairwash.webp";
import imgCupping from "@/assets/hero-blowdry.webp";
import {
  Target, Eye, Heart, Award, Users, Globe2,
  Lightbulb, ShieldCheck, Handshake, TrendingUp, ArrowLeft, Quote,
  Briefcase, CheckCircle2, Star, Zap,
  ChevronRight, ChevronLeft,
  Cuboid, Ruler, Hammer, Home, Building2,
  Stethoscope, Dumbbell, ShoppingBag, Tag,
  CalendarCheck, Percent, HeartPulse, Gem,
  Scissors, FlaskConical, Flower2, Car, Droplets,
} from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";
import { buildSeo, breadcrumbJsonLd } from "@/lib/seo";

function AboutPage() {
  const { dir, lang } = useLang();
  const arrowFlip = dir === "ltr" ? "rotate-180" : "";
  const L = <T,>(ar: T, en: T): T => (lang === "en" ? en : ar);

  const journey = [
    { year: "2023", title: L("البداية", "The Beginning"), desc: L("انطلقنا برؤية واضحة — نبني أول منصة سعودية تجمع الخصومات الحقيقية للمراكز الطبية، الصالونات النسائية، الحجامة، اللياقة، المختبرات، السبا، ومراكز غسيل السيارات في مكان واحد.", "We launched with a clear vision — to build Saudi Arabia's first platform that gathers real discounts for medical centers, women's salons, cupping, fitness, labs, spa, and car wash centers in one place.") },
    { year: "2024", title: L("التوسّع", "Expansion"), desc: L("وسّعنا شراكاتنا لتشمل أكثر من 200 مركز ومنشأة في 7 تصنيفات مختلفة، في الرياض وجدة والدمام.", "We expanded our partnerships to include 200+ centers across 7 different categories in Riyadh, Jeddah, and Dammam.") },
    { year: "2025", title: L("تقنية وحلول", "Tech & Solutions"), desc: L("أطلقنا نظام شراء كوبونات ذكي وتوصيل فوري — العميل يشتري العرض ويستلم الكوبون بضغطة زر.", "We launched a smart coupon purchase system with instant delivery — customers buy the offer and receive the coupon with one click.") },
    { year: "2026", title: L("حضور وطني", "National Presence"), desc: L("وصلنا لأكثر من 25,000 عملية شراء ناجحة و 12,000 عميل سعيد في مختلف مدن المملكة.", "We reached 25,000+ successful purchases and 12,000+ happy customers across the Kingdom's cities.") },
  ];

  const testimonials = [
    { name: L("د. خالد العتيبي", "Dr. Khalid Al-Otaibi"), role: L("مدير متجر طبي — الرياض", "Medical Center Director — Riyadh"), quote: L("خصومات ساعدتنا نوصل لعملاء جدد بشكل مستمر. مبيعات الكوبونات زادت 45% منذ ما انضممنا.", "Koswmat helped us reach new customers consistently. Our coupon sales increased 45% since we joined.") },
    { name: L("نورة السبيعي", "Noura Al-Subaie"), role: L("مشتركة — جدة", "Customer — Jeddah"), quote: L("اشتريت كوبون جلسة ليزر بخصم 60% وكوبون يوغا بخصم 50% — كل شيء موثوق وأسعاره واضحة من البداية.", "I bought a laser session coupon at 60% off and a yoga coupon at 50% off — everything is trustworthy and prices are transparent from the start.") },
    { name: L("م. عبدالله الزهراني", "Eng. Abdullah Al-Zahrani"), role: L("مالك صالة رياضية", "Gym Owner"), quote: L("التسويق عبر المنصة فعّال جدًا. العملاء اللي يجون من خصومات ملتزمين ومهتمين بالعرض.", "Marketing through the platform is very effective. Customers coming from Koswmat are committed and interested in the offer.") },
    { name: L("سارة القحطاني", "Sara Al-Qahtani"), role: L("مشتركة — الدمام", "Customer — Dammam"), quote: L("اشتريت مجموعة العناية بالبشرة بخصم 45% ووصلتني لحد البيت. تجربة سهلة وموثوقة.", "I bought a skincare bundle at 45% off and it was delivered to my door. Easy and trustworthy experience.") },
    { name: L("د. فيصل الحربي", "Dr. Faisal Al-Harbi"), role: L("عيادة أسنان", "Dental Clinic"), quote: L("المنصة تمنحنا حضوراً رقمياً قوياً دون تكاليف تسويق ضخمة. العميل يأتي جاهزاً بالكوبون.", "The platform gives us strong digital presence without huge marketing costs. The customer comes ready with the coupon.") },
  ];

  const stats = [
    { value: "+25K", label: L("كوبون مُباع", "Coupons Sold"), icon: Tag },
    { value: "+200", label: L("شريك موثوق", "Trusted Partners"), icon: Users },
    { value: "+96%", label: L("رضا العملاء", "Client Satisfaction"), icon: Award },
    { value: L("3 سنوات", "3 Years"), label: L("خبرة في العروض", "Offers Experience"), icon: Globe2 },
  ];

  const values = [
    { icon: ShieldCheck, title: L("خصومات حقيقية", "Real Discounts"), desc: L("كل عرض يتم التحقق منه قبل النشر — نضمن لك سعرًا أقل من السوق بشكل فعلي.", "Every offer is verified before publishing — we guarantee you a price that's actually lower than the market.") },
    { icon: Heart, title: L("ثقة وراحة بال", "Trust & Peace of Mind"), desc: L("شركاؤنا متاجر مرخصة ومحلات معتمدة — حجزك مؤكد ومضمون.", "Our partners are licensed centers and certified stores — your booking is confirmed and guaranteed.") },
    { icon: Handshake, title: L("شراكة ناجحة", "Successful Partnership"), desc: L("نجعل العميل يوفّر والشريك ينمو — علاقة مربحة للطرفين.", "We make the customer save and the partner grow — a win-win relationship.") },
    { icon: Zap, title: L("تجربة سريعة", "Fast Experience"), desc: L("اختر، احجز، استفد — خلال دقائق بدون تعقيد.", "Choose, book, benefit — within minutes without hassle.") },
  ];

  const services = [
    { icon: Stethoscope, title: L("المراكز والعيادات الطبية", "Medical Centers") },
    { icon: Scissors, title: L("الصالونات النسائية", "Women's Salons") },
    { icon: Droplets, title: L("مراكز الحجامة", "Cupping Centers") },
    { icon: Dumbbell, title: L("اللياقة الصحية", "Fitness & Wellness") },
    { icon: FlaskConical, title: L("المختبرات الطبية", "Medical Labs") },
    { icon: Flower2, title: L("مراكز السبا", "Spa Centers") },
    { icon: Car, title: L("مراكز غسيل السيارات", "Car Wash Centers") },
    { icon: Tag, title: L("عروض حصرية", "Exclusive Offers") },
  ];

  const processArr = [
    { icon: SearchIcon, title: L("تصفح العروض", "Browse Offers"), desc: L("اختر من بين مئات العروض في المتاجر الطبية، الجيم، والمنتجات الصحية.", "Choose from hundreds of offers in medical centers, gyms, and health products.") },
    { icon: Percent, title: L("قارن واختار", "Compare & Choose"), desc: L("شوف الخصومات، تقييمات العملاء، وتفاصيل كل عرض قبل ما تشتري.", "See discounts, customer ratings, and offer details before you purchase.") },
    { icon: Tag, title: L("اشترِ بسهولة", "Buy Easily"), desc: L("أضف العرض للسلة وادفع بضغطة زر — الكوبون يوصلك فورًا على الإيميل والواتساب.", "Add the offer to cart and pay with one click — the coupon reaches you instantly via email and WhatsApp.") },
    { icon: Star, title: L("استمتع بالعرض", "Enjoy the Offer"), desc: L("استخدم الكوبون عند الشريك أو استلم طلبك — وقيّم تجربتك لتساعد غيرك.", "Use the coupon at the partner or receive your order — and rate your experience to help others.") },
  ];

  const pillars = [
    { icon: Target, title: L("رسالتنا", "Our Mission"), desc: L("نوفر للعملاء أفضل الخصومات على الخدمات الصحية واللياقة والمنتجات — بشفافية تامة وسهولة مطلقة.", "We provide customers with the best discounts on health services, fitness, and products — with full transparency and absolute ease.") },
    { icon: Eye, title: L("رؤيتنا", "Our Vision"), desc: L("أن نكون المنصة الأولى في المملكة للخدمات الصحية واللياقة — حيث يجد العميل القيمة ويحقق الشريك النمو.", "To be the Kingdom's leading platform for health and fitness services — where customers find value and partners achieve growth.") },
    { icon: Heart, title: L("وعدنا", "Our Promise"), desc: L("نضمن لك خصمًا حقيقيًا، حجزًا مؤكدًا، وتجربة سلسة من البداية للنهاية — بدون مفاجآت.", "We guarantee you a real discount, a confirmed booking, and a smooth experience from start to finish — no surprises.") },
  ];

  const whyList = [
    L("خصومات تصل لـ 70% على خدمات طبية ولياقة.", "Discounts up to 70% on medical and fitness services."),
    L("كل الشغلاء مرخصين ومعتمدين — ثقة كاملة.", "All partners are licensed and certified — full trust."),
    L("حجز فوري وكوبونات تلقائية بدون انتظار.", "Instant booking and automatic coupons without waiting."),
    L("تقييمات حقيقية من عملاء استخدموا الخدمة فعليًا.", "Real reviews from customers who actually used the service."),
    L("خدمة عملاء جاهزة تساعدك في أي وقت.", "Customer service ready to help you anytime."),
  ];

  const badges = [
    { v: "98%", l: L("رضا العملاء", "Client Satisfaction") },
    { v: L("فوري", "Instant"), l: L("توصيل الكوبون", "Coupon Delivery") },
    { v: "100%", l: L("عروض موثقة", "Verified Offers") },
    { v: "+200", l: L("شريك ومتجر", "Partner & Center") },
  ];

  return (
    <div dir={dir} className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden text-white">
          <div className="absolute inset-0">
            <img src={heroImage} alt={L("خصومات", "Koswmat")} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/10 via-foreground/60 to-foreground/90" />
          </div>
          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
            <div className={dir === "rtl" ? "max-w-xl text-right" : "max-w-xl text-left"}>
              <div className="mb-5 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold backdrop-blur">
                <Link to="/" className="hover:underline">{L("الرئيسية", "Home")}</Link>
                <ChevronLeft className={`h-3 w-3 ${dir === "ltr" ? "rotate-180" : ""}`} />
                <span>{L("من نحن", "About Us")}</span>
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary-light">ABOUT US</span>
              <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
                {L(<>نوفر لك الخصم،<br />وتستمتع بالخدمة</>, <>We get you the discount,<br />you enjoy the service</>)}
              </h1>
              <p className="mt-5 max-w-md text-sm leading-7 text-white/85 sm:text-base">
                {L(
                  "خصومات هي وجهتك الأولى للخصومات الحقيقية على المراكز الطبية، الصالونات النسائية، الحجامة، اللياقة، المختبرات، السبا، ومراكز غسيل السيارات — نجمع العروض ونضمن لك أفضل سعر.",
                  "Koswmat is your first destination for real discounts on medical centers, women's salons, cupping, fitness, labs, spa, and car wash centers — we gather offers and guarantee you the best price."
                )}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/"
                  className="group inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-sm font-bold text-primary-foreground shadow-[0_12px_28px_-12px_rgba(0,174,198,0.7)] transition hover:-translate-y-0.5"
                >
                  {L("تصفح العروض", "Browse Offers")}
                  <ArrowLeft className={`h-4 w-4 transition-transform group-hover:-translate-x-1 ${arrowFlip}`} />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-7 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
                >
                  {L("تواصل معنا", "Contact Us")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="border-y border-border bg-secondary/30">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-border md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-background px-6 py-10 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="text-2xl font-extrabold text-primary sm:text-3xl">{s.value}</div>
                <div className="mt-1 text-xs font-medium text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* STORY */}
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className={`order-2 lg:order-1 ${dir === "rtl" ? "text-right" : "text-left"}`}>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">{L("قصتنا", "Our Story")}</span>
              <h2 className="mt-3 text-3xl font-extrabold text-foreground md:text-4xl">
                {L(<>من فكرة بسيطة<br />إلى منصة موثوقة</>, <>From a simple idea<br />to a trusted platform</>)}
              </h2>
              <div className="mt-6 space-y-4 text-base leading-8 text-muted-foreground">
                <p>
                  {L(
                    "بدأنا في 2023 بحلم واحد: أن نجعل الخدمات الصحية والجمالية والعناية اليومية في متناول الجميع — ليس فقط عبر الجودة، بل أيضاً عبر السعر المناسب.",
                    "We started in 2023 with one dream: to make health, beauty, and everyday care services accessible to everyone — not just through quality, but also through fair pricing."
                  )}
                </p>
                <p>
                  {L(
                    "اليوم، بعد أكثر من 25,000 عملية شراء ناجحة وشراكات مع أكثر من 200 مركز في 7 تصنيفات (طبية، صالونات، حجامة، لياقة، مختبرات، سبا، غسيل سيارات)، صار اسم خصومات مرادف للثقة والوفّر.",
                    "Today, after 25,000+ successful purchases and partnerships with 200+ centers across 7 categories (medical, salons, cupping, fitness, labs, spa, car wash), Koswmat has become synonymous with trust and savings."
                  )}
                </p>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {services.map((s) => (
                  <div key={s.title} className="flex items-center gap-3 rounded-xl border border-border bg-white p-3 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                      <s.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold text-foreground">{s.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative order-1 lg:order-2">
              <div className="relative aspect-square overflow-hidden rounded-3xl shadow-lg">
                <img src={quoteImage} alt={L("خصومات", "Koswmat")} className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,90,105,0.85) 100%)" }} />
                <div className="relative flex h-full flex-col justify-end p-8 text-white md:p-10">
                  <Quote className="mb-4 h-10 w-10 opacity-70" />
                  <p className="text-xl font-bold leading-relaxed md:text-2xl">
                    {L(
                      "\"هدفنا نوفر للناس خدمات صحية ولياقة بأفضل سعر — لأن الصحة حق مش ترف.\"",
                      "\"Our goal is to provide people with health and fitness services at the best price — because health is a right, not a luxury.\""
                    )}
                  </p>
                  <div className="mt-5 h-0.5 w-16 bg-white/70" />
                  <span className="mt-2 text-sm text-white/85">{L("— فريق خصومات", "— The Koswmat Team")}</span>
                </div>
              </div>
              <div className={`absolute -bottom-6 hidden h-32 w-32 rounded-2xl border-4 border-background bg-white p-4 shadow-lg lg:block ${dir === "rtl" ? "-left-6" : "-right-6"}`}>
                <div className="flex h-full flex-col justify-between">
                  <Award className="h-6 w-6 text-primary" />
                  <div>
                    <div className="text-2xl font-extrabold text-foreground">+25K</div>
                    <div className="text-[10px] font-bold text-muted-foreground">{L("كوبون مُباع", "Coupons Sold")}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MISSION / VISION / PROMISE */}
        <section className="bg-secondary/30 py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-3">
              {pillars.map((c) => (
                <div key={c.title} className={`group relative overflow-hidden rounded-3xl border border-border bg-background p-8 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-md ${dir === "rtl" ? "text-right" : "text-left"}`}>
                  <div className={`absolute -top-8 h-24 w-24 rounded-full bg-primary/5 transition group-hover:scale-150 ${dir === "rtl" ? "-right-8" : "-left-8"}`} />
                  <div className="relative">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-md">
                      <c.icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-5 text-xl font-extrabold text-foreground">{c.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CATEGORIES GALLERY */}
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">{L("تصنيفاتنا", "Our Categories")}</span>
            <h2 className="mt-3 text-3xl font-extrabold text-foreground md:text-4xl">{L("سبع فئات تغطي احتياجاتك اليومية", "Seven categories covering your daily needs")}</h2>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
            {[
              { img: imgMedical, label: L("طبية", "Medical"), icon: Stethoscope },
              { img: imgSalon, label: L("صالونات", "Salons"), icon: Scissors },
              { img: imgCupping, label: L("حجامة", "Cupping"), icon: Droplets },
              { img: imgFitness, label: L("لياقة", "Fitness"), icon: Dumbbell },
              { img: imgLab, label: L("مختبرات", "Labs"), icon: FlaskConical },
              { img: imgSpa, label: L("سبا", "Spa"), icon: Flower2 },
              { img: imgCarwash, label: L("غسيل سيارات", "Car Wash"), icon: Car },
            ].map((c) => (
              <div key={c.label} className="group relative aspect-[3/4] overflow-hidden rounded-2xl">
                <img src={c.img} alt={String(c.label)} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-center text-white">
                  <c.icon className="mx-auto mb-1 h-5 w-5" />
                  <div className="text-xs font-extrabold">{c.label}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* JOURNEY */}
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">{L("رحلتنا", "Our Journey")}</span>
            <h2 className="mt-3 text-3xl font-extrabold text-foreground md:text-4xl">{L("محطات في طريق الثقة", "Milestones on the road to trust")}</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {journey.map((j) => (
              <div key={j.year} className={`relative rounded-2xl border border-border bg-white p-6 transition hover:-translate-y-1 hover:shadow-md ${dir === "rtl" ? "text-right" : "text-left"}`}>
                <div className="text-3xl font-extrabold text-primary">{j.year}</div>
                <div className="mt-2 text-sm font-bold text-foreground">{j.title}</div>
                <div className="mt-2 text-xs leading-6 text-muted-foreground">{j.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* WHY US */}
        <section className="bg-secondary/30 py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div dir={dir} className={`${dir === "rtl" ? "text-right" : "text-left"}`}>
                <span className="text-xs font-bold uppercase tracking-widest text-primary">{L("لماذا نحن؟", "Why Us?")}</span>
                <h2 className="mt-3 text-3xl font-extrabold text-foreground md:text-4xl">
                  {L(<>توفير، ثقة،<br />وسهولة في تجربة واحدة</>, <>Savings, trust,<br />and ease in one experience</>)}
                </h2>
                <ul className="mt-6 space-y-3">
                  {whyList.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span className="text-sm leading-7 text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 grid grid-cols-2 gap-3">
                  {badges.map((b) => (
                    <div key={b.l} className="rounded-xl border border-border bg-white p-4 text-center transition hover:shadow-md">
                      <div className="text-xl font-extrabold text-primary">{b.v}</div>
                      <div className="mt-1 text-[11px] font-bold text-muted-foreground">{b.l}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="grid grid-cols-2 gap-3">
                  {values.map((v) => (
                    <div key={v.title} className="rounded-2xl border border-border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <v.icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-3 text-sm font-extrabold text-foreground">{v.title}</h3>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">{v.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">{L("آراء العملاء", "Testimonials")}</span>
            <h2 className="mt-3 text-3xl font-extrabold text-foreground md:text-4xl">{L("عملاؤنا يتكلموا عنا", "Our customers speak for us")}</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.slice(0, 3).map((t) => (
              <div key={t.name} className="rounded-2xl border border-border bg-white p-6 transition hover:shadow-md">
                <Quote className="h-6 w-6 text-primary/40" />
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{t.quote}</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
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
                  {L("جاهز توفر على خدماتك الصحية؟", "Ready to save on your health services?")}
                </h2>
                <p className="mt-3 text-white/85">
                  {L("تصفح العروض الحالية واحجز موعدك أو اشتري منتجك بأفضل سعر في المملكة.", "Browse current offers and book your appointment or buy your product at the best price in the Kingdom.")}
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

function SearchIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  );
}

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "من نحن — خصومات | عروض المراكز الطبية والصالونات واللياقة والسبا وغسيل السيارات" },
      { name: "description", content: "تعرف على خصومات — وجهتك الأولى لخصومات حقيقية على المراكز الطبية، الصالونات النسائية، الحجامة، اللياقة، المختبرات، السبا، ومراكز غسيل السيارات في المملكة." },
      { property: "og:title", content: "من نحن — خصومات" },
      { property: "og:description", content: "أفضل العروض والخصومات على 7 تصنيفات تغطي احتياجاتك اليومية في المملكة." },
    ],
  }),
  component: AboutPage,
});
