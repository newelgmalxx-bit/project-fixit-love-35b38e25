import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Search,
  Sparkles,
  Megaphone,
  BadgePercent,
} from "lucide-react";
import { publicApi } from "@/lib/api/public";
import { useCategories } from "@/hooks/useCatalog";
import { renderCategoryIcon } from "@/lib/categoryIcon";
import heroFacial from "@/assets/hero-facial.jpg";
import heroHairBlonde from "@/assets/hero-hair-blonde.jpg";
import heroHairCurl from "@/assets/hero-hair-curl.jpg";
import heroHairwash from "@/assets/hero-hairwash.jpg";
import heroBlowdry from "@/assets/hero-blowdry.jpg";
import heroMedical from "@/assets/hero-medical-1.jpg";
import heroFitness from "@/assets/hero-fitness-1.jpg";
import heroCarwash from "@/assets/hero-carwash.jpg";

type Slide = {
  kicker: string;
  titleLine1: string;
  titleLine2: string;
  description: string;
  image: string;
  badge: { value: string; label: string };
  gradient: string; // tailwind from-* via-* to-*
  ambient: string; // bg-{color} for blobs
};

const slides: Slide[] = [
  {
    kicker: "عروض متنوعة كل يوم",
    titleLine1: "كل اللي تحتاجيه،",
    titleLine2: "بخصومات حصرية ومتنوعة",
    description:
      "عروض مختارة من قطاعات مختلفة — جمال، صحة، لياقة، عناية وأكثر — بخصومات تصل حتى 73% وتتجدد باستمرار.",
    image: heroFacial,
    badge: { value: "73%", label: "أعلى خصم اليوم" },
    gradient: "from-[#3F2A6B] via-[#7A4FB8] to-[#E0254D]",
    ambient: "bg-[#E0254D]/25",
  },
  {
    kicker: "صالونات ومراكز تجميل",
    titleLine1: "إطلالة أحلى،",
    titleLine2: "بأقوى عروض الصالونات",
    description:
      "صبغة، قصات، تسريحات، عناية بشرة وأكثر — من باقة واسعة من الصالونات والمراكز بأسعار حصرية.",
    image: heroHairBlonde,
    badge: { value: "60%", label: "خصومات الصالونات" },
    gradient: "from-[#3F2A6B] via-[#A23A8A] to-[#E0254D]",
    ambient: "bg-[#A23A8A]/25",
  },
  {
    kicker: "تشكيلة متجددة من العروض",
    titleLine1: "اختاري من تشكيلة واسعة،",
    titleLine2: "تناسب كل احتياجاتك",
    description:
      "أكثر من 120 عرض حصري في تخصصات مختلفة، نضيف عروض جديدة كل أسبوع لتلاقي اللي يناسبك بسرعة.",
    image: heroHairCurl,
    badge: { value: "55%", label: "عروض متنوعة" },
    gradient: "from-[#2A1B4E] via-[#5B3A9E] to-[#9B3FB8]",
    ambient: "bg-[#5B3A9E]/30",
  },
  {
    kicker: "عناية وجمال شامل",
    titleLine1: "دلّلي نفسك،",
    titleLine2: "بأفضل خدمات العناية",
    description:
      "بروتين، كيراتين، سبا، حجامة، وعلاجات تجميل متنوعة بإشراف متخصصين — احجزي بكل سهولة من المنصة.",
    image: heroHairwash,
    badge: { value: "50%", label: "عروض العناية" },
    gradient: "from-[#3F2A6B] via-[#6B3FA8] to-[#E0254D]",
    ambient: "bg-[#6B3FA8]/25",
  },
  {
    kicker: "مناسبات وتصفيف احترافي",
    titleLine1: "لكل مناسبة عرض،",
    titleLine2: "ولكل ذوق اختيار",
    description:
      "تصفيف، مكياج، تجهيز عرائس، وعروض مميزة لكل المناسبات — تجدّيها كلها في مكان واحد.",
    image: heroBlowdry,
    badge: { value: "45%", label: "عروض المناسبات" },
    gradient: "from-[#3F2A6B] via-[#8A3FB8] to-[#E0254D]",
    ambient: "bg-[#3F2A6B]/30",
  },
  {
    kicker: "مراكز وعيادات طبية",
    titleLine1: "صحتك أولًا،",
    titleLine2: "بأفضل المراكز والعيادات",
    description:
      "أسنان، جلدية، ليزر، تجميل طبي وأكثر — من مراكز وعيادات معتمدة بخصومات حقيقية ومتنوعة.",
    image: heroMedical,
    badge: { value: "55%", label: "خصومات طبية" },
    gradient: "from-[#0b3b4a] via-[#0891b2] to-[#00aec6]",
    ambient: "bg-[#00aec6]/25",
  },
  {
    kicker: "لياقة، يوغا، ورياضة",
    titleLine1: "نشاطك يبدأ هنا،",
    titleLine2: "بعروض رياضية متنوعة",
    description:
      "اشتراكات جيم، يوغا، كروس فيت، ومدربين خاصين من نوادي مختلفة — اختاري الأنسب لك بأفضل سعر.",
    image: heroFitness,
    badge: { value: "40%", label: "عروض الرياضة" },
    gradient: "from-[#7f1d1d] via-[#b91c1c] to-[#f43f5e]",
    ambient: "bg-[#f43f5e]/25",
  },
  {
    kicker: "مراكز غسيل السيارات",
    titleLine1: "سيارتك تلمع كالجديدة،",
    titleLine2: "بأفضل مراكز الغسيل",
    description:
      "غسيل خارجي وداخلي، بوليش، تلميع، وتنظيف بالبخار من مراكز معتمدة بخصومات حصرية تصل حتى 50%.",
    image: heroCarwash,
    badge: { value: "50%", label: "خصم الغسيل" },
    gradient: "from-[#1e293b] via-[#1d4ed8] to-[#0ea5e9]",
    ambient: "bg-[#1d4ed8]/25",
  },
];

export function OffersHero() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, direction: "rtl", align: "start" },
    [Autoplay({ delay: 6000, stopOnInteraction: false })]
  );
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/", hash: "featured-offers" });
  };

  return (
    <section className="relative overflow-hidden bg-background">
      {/* Slider */}
      <div className="embla overflow-hidden" ref={emblaRef}>
        <div className="embla__container flex">
          {slides.map((s, i) => (
            <div
              key={i}
              className="embla__slide relative min-w-0 flex-[0_0_100%]"
            >
              <SlideContent
                slide={s}
                slideIndex={i}
                q={q}
                setQ={setQ}
                onSearch={onSearch}
                active={selected === i}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Arrows hidden — dots-only navigation */}

      {/* Dots */}
      <div className="relative z-20 flex items-center justify-center gap-2 pb-6 pt-1 sm:absolute sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 sm:p-0">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => scrollTo(i)}
            aria-label={`الشريحة ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              selected === i
                ? "w-8 bg-primary"
                : "w-2 bg-foreground/30 hover:bg-foreground/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

function SlideContent({
  slide,
  slideIndex,
  q,
  setQ,
  onSearch,
  active,
}: {
  slide: Slide;
  slideIndex: number;
  q: string;
  setQ: (v: string) => void;
  onSearch: (e: React.FormEvent) => void;
  active: boolean;
}) {
  const { categories } = useCategories();
  return (
    <div className="relative">
      {/* Ambient glows colored per slide — desktop only (heavy blur lags mobile) */}
      <div
        className={`pointer-events-none absolute -top-40 -right-32 hidden h-[28rem] w-[28rem] rounded-full sm:block ${slide.ambient} blur-[120px]`}
      />
      <div className="pointer-events-none absolute -bottom-40 -left-32 hidden h-[28rem] w-[28rem] rounded-full bg-primary/20 blur-[120px] sm:block" />
      <div className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(ellipse_at_top,theme(colors.primary/8),transparent_60%)] sm:block" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-4 px-4 py-5 sm:gap-12 sm:px-6 sm:py-14 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:py-20">
        {/* Content */}
        <div
          className={`order-2 lg:order-1 lg:col-span-7 transition-all duration-700 ${
            active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> {slide.kicker}
          </span>

          <h1 className="mt-3 text-2xl font-extrabold leading-[1.2] tracking-tight text-foreground sm:mt-5 sm:text-5xl lg:text-6xl">
            {slide.titleLine1}
            <br />
            <span
              className={`bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent`}
            >
              {slide.titleLine2}
            </span>
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:mt-5 sm:text-lg">
            {slide.description}
          </p>

          {/* Search */}
          <form
            onSubmit={onSearch}
            suppressHydrationWarning
            className="mt-4 flex max-w-xl items-center gap-2 rounded-full border border-border bg-card p-2 shadow-xl shadow-primary/10 ring-1 ring-black/5 sm:mt-8"
          >
            <Search className="ms-3 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث عن خدمة، متجر، أو مدينة…"
              suppressHydrationWarning
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              className={`shrink-0 rounded-full bg-gradient-to-r ${slide.gradient} px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition hover:scale-[1.02]`}
            >
              ابحث
            </button>
          </form>

          {/* Quick category pills */}
          <div className="mt-3 flex flex-wrap gap-2 sm:mt-6">
            <span className="self-center text-xs font-medium text-muted-foreground">
              شائع:
            </span>
            {categories.slice(0, 5).map((c) => (
              <Link
                key={c.slug}
                to="/offers/category/$slug"
                params={{ slug: c.slug }}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              >
                <span className="me-1 inline-flex h-4 w-4 items-center justify-center overflow-hidden">{renderCategoryIcon(c.icon)}</span>
                {c.nameAr}
              </Link>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-5 grid max-w-xl grid-cols-3 gap-2 border-t border-border pt-4 text-center sm:mt-10 sm:gap-4 sm:pt-6 sm:text-start">
            <Stat value="+120" label="عرض حصري" />
            <Stat value="+45" label="متجر معتمد" />
            <Stat value="73%" label="أقصى خصم" />
          </div>
        </div>

        {/* Visual */}
        <div
          className={`order-1 lg:order-2 lg:col-span-5 transition-all duration-700 ${
            active ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <div className="relative mx-auto w-full max-w-md">
            <div
              className={`absolute -inset-4 hidden rounded-[2rem] bg-gradient-to-tr ${slide.gradient} opacity-30 blur-2xl sm:block`}
            />
            <div className="relative overflow-hidden rounded-[1.25rem] border border-border bg-card shadow-xl shadow-primary/20 sm:rounded-[2rem] sm:shadow-2xl">
              <img
                src={slide.image}
                alt="عرض مميز"
                width={896}
                height={1152}
                loading="lazy"
                decoding="async"
                className="aspect-[5/4] w-full object-cover sm:aspect-[4/5]"
              />

              <div
                className={`absolute top-2 end-2 flex items-center gap-1.5 rounded-xl bg-gradient-to-br ${slide.gradient} px-2.5 py-1.5 text-white shadow-lg ring-1 ring-white/20 sm:top-3 sm:end-3 sm:gap-2 sm:px-3 sm:py-2`}
              >
                <BadgePercent className="h-4 w-4 sm:h-5 sm:w-5" />
                <div className="leading-tight">
                  <div className="text-base font-extrabold sm:text-lg">
                    {slide.badge.value}
                  </div>
                  <div className="text-[9px] opacity-90 sm:text-[10px]">
                    {slide.badge.label}
                  </div>
                </div>
              </div>


              <SponsoredAdOverlay slideIndex={slideIndex} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type SponsoredAd = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  cta_label: string | null;
  slide_index: number | null;
  offer_id: string | null;
};

type DemoAd = {
  title: string;
  subtitle: string;
  offerId: string; // routes to /offers/$offerId
};

// One demo ad per slider — each links to a specific offer detail page
const DEMO_ADS_BY_SLIDE: Record<number, DemoAd> = {
  0: { title: "باقة عروس متكاملة", subtitle: "صالون لمسات الجمال — خصم خاص لفترة محدودة", offerId: "of-2001" },
  1: { title: "صبغة شعر + قص + سشوار", subtitle: "صالون لمسات الجمال — وفّري حتى 60%", offerId: "of-2002" },
  2: { title: "مساج ملكي 90 دقيقة + ساونا", subtitle: "سبا روز الفاخر — استرخاء كامل", offerId: "of-6001" },
  3: { title: "باقة عناية مغربية كاملة", subtitle: "سبا روز الفاخر — تجربة فاخرة بسعر مميز", offerId: "of-6002" },
  4: { title: "تنظيف بشرة عميق + هايدرافيشل", subtitle: "عيادات سمايل بلس — بشرة نضرة فورًا", offerId: "of-1003" },
  5: { title: "جلسة ليزر إزالة شعر — كامل الجسم", subtitle: "عيادات سمايل بلس — احجزي بخصم خاص", offerId: "of-1002" },
  6: { title: "اشتراك شهري + 4 جلسات مدرب خاص", subtitle: "نادي بيور فيت — ابدئي رحلتك الرياضية", offerId: "of-4001" },
  7: { title: "باقة تحاليل شاملة (35 تحليل)", subtitle: "مختبرات الحياة الطبية — اطمئني على صحتك", offerId: "of-5001" },
};

function SponsoredAdOverlay({ slideIndex }: { slideIndex: number }) {
  const [ads, setAds] = useState<SponsoredAd[]>([]);
  const [offers, setOffers] = useState<Record<string, any>>({});
  const [partners, setPartners] = useState<Record<string, any>>({});

  const getPartnerName = (partner: any) => {
    return (
      partner?.vendorName ||
      partner?.vendor_name ||
      partner?.vendorNameAr ||
      partner?.vendorNameEn ||
      partner?.name ||
      partner?.nameAr ||
      partner?.nameEn ||
      null
    );
  };

  const getCenterName = (offer: any, ad: SponsoredAd) => {
    return (
      offer?.vendor?.name ||
      offer?.vendorName ||
      offer?.vendor_name ||
      offer?.vendorNameAr ||
      offer?.vendorNameEn ||
      offer?.partner?.vendorName ||
      offer?.partner?.vendor_name ||
      offer?.partner?.name ||
      offer?.partner?.nameAr ||
      offer?.partnerName ||
      offer?.partner_name ||
      offer?.merchantName ||
      offer?.merchant_name ||
      offer?.centerName ||
      offer?.center_name ||
      getPartnerName(partners[offer?.partnerId]) ||
      ad.subtitle
    );
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await publicApi.getSponsoredAds();
        if (!alive || !data) return;
        const mapped = data.map((a: any) => ({
          id: a.id,
          title: a.titleAr || a.titleEn || a.title || "",
          subtitle: a.subtitle ?? null,
          image_url: a.image || a.imageUrl || null,
          link_url: a.linkUrl || null,
          cta_label: a.ctaLabel ?? null,
          slide_index: a.slideIndex ?? null,
          offer_id: a.offerId ?? null,
        })) as SponsoredAd[];
        setAds(mapped);

        // Fetch linked offers
        const ids = Array.from(new Set(mapped.map((a) => a.offer_id).filter(Boolean))) as string[];
        const results = await Promise.all(ids.map(async (id) => {
          try { return [id, await publicApi.getOffer(id)] as const; } catch { return [id, null] as const; }
        }));
        if (!alive) return;
        const map: Record<string, any> = {};
        for (const [id, o] of results) if (o) map[id] = o;
        setOffers(map);

        const partnerIds = Array.from(
          new Set(results.map(([, offer]) => offer?.partnerId).filter(Boolean))
        ) as string[];
        const partnerResults = await Promise.all(
          partnerIds.map(async (id) => {
            try {
              return [id, await publicApi.getPartner(id)] as const;
            } catch {
              return [id, null] as const;
            }
          })
        );
        if (!alive) return;
        const partnerMap: Record<string, any> = {};
        for (const [id, partner] of partnerResults) if (partner) partnerMap[id] = partner;
        setPartners(partnerMap);
      } catch { /* ignore */ }
    })();
    return () => { alive = false; };
  }, []);

  const slideAds = ads.filter((a) => a.slide_index == null || Number(a.slide_index) === 0 || Number(a.slide_index) === slideIndex + 1);

  const baseClass =
    "absolute inset-x-3 bottom-3 flex items-center gap-2.5 rounded-2xl bg-card/95 px-3 py-2.5 shadow-xl ring-1 ring-border backdrop-blur transition hover:bg-card sm:inset-x-5 sm:bottom-5 sm:gap-3 sm:px-4 sm:py-3";

  const renderInner = (title: string, subtitle: string | null, image: string | null, showBookBtn = false) => (
    <>
      {image ? (
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-12 sm:w-12">
          <img src={image} alt={title} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-12 sm:w-12">
          <Megaphone className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
          <Megaphone className="h-2.5 w-2.5" /> إعلان ممول
        </div>
        <div className="truncate text-xs font-extrabold text-foreground sm:text-sm">{title}</div>
        {subtitle && (
          <div className="truncate text-[10px] text-muted-foreground sm:text-[11px]">{subtitle}</div>
        )}
      </div>
      {showBookBtn && (
        <div className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground sm:px-4 sm:py-2 sm:text-xs">
          احجز الآن
        </div>
      )}
    </>
  );

  if (slideAds.length > 0) {
    const ad = slideAds[0];
    if (ad.offer_id) {
      const offer = offers[ad.offer_id];
      const title = offer?.title || offer?.titleAr || offer?.titleEn || ad.title;
      const subtitle = getCenterName(offer, ad);
      const image = offer?.image || offer?.imageUrl || offer?.coverImage || ad.image_url;
      return (
        <Link to="/offers/$offerId" params={{ offerId: ad.offer_id }} className={baseClass}>
          {renderInner(title, subtitle, image, true)}
        </Link>
      );
    }
    const inner = renderInner(ad.title, ad.subtitle, ad.image_url);
    if (ad.link_url) {
      return (
        <a href={ad.link_url} target="_blank" rel="noreferrer" className={baseClass}>
          {inner}
        </a>
      );
    }
    return <div className={baseClass}>{inner}</div>;
  }

  const demo = DEMO_ADS_BY_SLIDE[slideIndex] ?? DEMO_ADS_BY_SLIDE[0];
  return (
    <Link
      to="/offers/$offerId"
      params={{ offerId: demo.offerId }}
      className={baseClass}
    >
      {renderInner(demo.title, demo.subtitle, null)}
    </Link>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0 px-1">
      <div className="text-xl font-extrabold leading-none text-foreground sm:text-3xl">
        {value}
      </div>
      <div className="mt-1.5 text-[11px] leading-5 text-muted-foreground sm:text-sm">{label}</div>
    </div>
  );
}
