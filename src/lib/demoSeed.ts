// One-time demo data seeder. Populates localStorage keys used by:
// - Account section (myBookings, favorites)
// - Admin section (manual offers/centers, categories, cities, reviews,
//   tickets, abandoned carts, payouts overrides)
// - Partner dashboard (demo offers/bookings/commission requests)
//
// Each key has its own seeded flag so reseeding is idempotent unless the
// user clears localStorage.

const FLAG_PREFIX = "demo_seeded_v2:";

function seedKey(key: string, value: unknown) {
  const flag = `${FLAG_PREFIX}${key}`;
  try {
    if (localStorage.getItem(flag) === "1") return;
    const existing = localStorage.getItem(key);
    // Don't overwrite if user already has real data
    if (existing) {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed) && parsed.length > 0) {
        localStorage.setItem(flag, "1");
        return;
      }
      if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
        localStorage.setItem(flag, "1");
        return;
      }
    }
    localStorage.setItem(key, JSON.stringify(value));
    localStorage.setItem(flag, "1");
  } catch {
    /* ignore */
  }
}

export function seedDemoOnce() {
  if (typeof window === "undefined") return;

  // ===== Account: My Bookings =====
  const today = new Date();
  const day = (offset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };
  seedKey("myBookings", [
    {
      bookingId: "BK-A1B2C3",
      verifyCode: "284913",
      offerId: "of-1001",
      date: day(2),
      time: "10:30",
      qty: 1,
      total: 320,
      depositAmount: 64,
      remainingAmount: 256,
      depositPct: 20,
      customerName: "محمد العتيبي",
      customerEmail: "m.otaibi@example.com",
      customerPhone: "+966555112233",
      createdAt: new Date(today.getTime() - 2 * 86400000).toISOString(),
    },
    {
      bookingId: "BK-D4E5F6",
      verifyCode: "591046",
      offerId: "of-2001",
      date: day(5),
      time: "16:00",
      qty: 1,
      total: 180,
      depositAmount: 36,
      remainingAmount: 144,
      depositPct: 20,
      customerName: "نورة الزهراني",
      customerEmail: "noura@example.com",
      customerPhone: "+966554455667",
      createdAt: new Date(today.getTime() - 1 * 86400000).toISOString(),
    },
    {
      bookingId: "BK-G7H8I9",
      verifyCode: "763215",
      offerId: "of-6001",
      date: day(-3),
      time: "14:00",
      qty: 2,
      total: 540,
      depositAmount: 108,
      remainingAmount: 432,
      depositPct: 20,
      customerName: "سارة القحطاني",
      customerEmail: "sara.q@example.com",
      customerPhone: "+966503344556",
      redeemedAt: new Date(today.getTime() - 3 * 86400000).toISOString(),
      createdAt: new Date(today.getTime() - 7 * 86400000).toISOString(),
    },
    {
      bookingId: "BK-J0K1L2",
      verifyCode: "428107",
      offerId: "of-4001",
      date: day(7),
      time: "11:00",
      qty: 1,
      total: 450,
      depositAmount: 90,
      remainingAmount: 360,
      depositPct: 20,
      customerName: "خالد الشهري",
      customerEmail: "k.shehri@example.com",
      customerPhone: "+966507788990",
      createdAt: new Date(today.getTime() - 0.5 * 86400000).toISOString(),
    },
  ]);

  // ===== Account: Favorites — start empty; user adds real ones =====
  seedKey("saba_service_favorites_v1", {});

  // ===== Admin: Manual centers =====
  seedKey("admin_manual_centers", [
    {
      id: "mc-1",
      vendor_name: "مركز النخبة الطبي",
      owner_name: "د. عبدالله الراشد",
      city: "الرياض",
      category: "طبي",
      phone: "+966112345678",
      email: "info@nokhba-medical.sa",
      address: "حي العليا، شارع الملك فهد",
      working_hours: "السبت - الخميس: 9 صباحاً - 11 مساءً",
      status: "active",
      commercial_number: "1010234567",
      logo_url: "",
      cover_url: "",
      about: "مركز طبي متكامل يقدم خدمات طب الأسنان، الجلدية، والتجميل.",
      commission_pct: 12,
      deposit_pct: 25,
      created_at: new Date().toISOString(),
    },
    {
      id: "mc-2",
      vendor_name: "صالون لمسات الإبداع",
      owner_name: "هند المالكي",
      city: "جدة",
      category: "صالونات",
      phone: "+966126543210",
      email: "contact@lamsat.sa",
      address: "حي الروضة، طريق الأمير سلطان",
      working_hours: "يومياً: 10 صباحاً - 12 منتصف الليل",
      status: "active",
      commercial_number: "4030123456",
      logo_url: "",
      cover_url: "",
      about: "صالون نسائي متخصص في العناية بالشعر والبشرة.",
      commission_pct: 10,
      deposit_pct: 20,
      created_at: new Date().toISOString(),
    },
    {
      id: "mc-3",
      vendor_name: "سبا الواحة الفاخر",
      owner_name: "ريم العبدالكريم",
      city: "الدمام",
      category: "سبا ومساج",
      phone: "+966138765432",
      email: "spa@alwaha.sa",
      address: "كورنيش الدمام، فندق إنتركونتيننتال",
      working_hours: "يومياً: 11 صباحاً - 10 مساءً",
      status: "pending",
      commercial_number: "2050987654",
      logo_url: "",
      cover_url: "",
      about: "سبا فاخر يقدم جلسات استرخاء ومساج علاجي.",
      commission_pct: 15,
      deposit_pct: 30,
      created_at: new Date().toISOString(),
    },
    {
      id: "mc-4",
      vendor_name: "نادي بيور فيت",
      owner_name: "أحمد الدوسري",
      city: "الرياض",
      category: "صحة ولياقة",
      phone: "+966114567890",
      email: "info@purefit.sa",
      address: "حي الياسمين، شارع الإمام سعود",
      working_hours: "24 ساعة",
      status: "active",
      commercial_number: "1010345678",
      logo_url: "",
      cover_url: "",
      about: "نادي رياضي متكامل بأحدث المعدات ومدربين متخصصين.",
      commission_pct: 8,
      deposit_pct: 15,
      created_at: new Date().toISOString(),
    },
  ]);

  // ===== Admin: Manual offers =====
  seedKey("admin_manual_offers", [
    {
      id: "mo-1",
      title: "تنظيف أسنان احترافي + تلميع",
      description: "جلسة تنظيف كاملة مع تلميع وفلورايد، مدة الجلسة 45 دقيقة.",
      price: 199,
      original_price: 350,
      category: "طبي",
      status: "active",
      image_url: "",
      center_name: "مركز النخبة الطبي",
      partner_id: "mc-1",
      created_at: new Date(today.getTime() - 5 * 86400000).toISOString(),
    },
    {
      id: "mo-2",
      title: "بكج عناية كاملة بالشعر (3 جلسات)",
      description: "صبغة + بروتين + قص وتصفيف لمدة 3 جلسات متتالية.",
      price: 599,
      original_price: 1200,
      category: "صالونات",
      status: "active",
      image_url: "",
      center_name: "صالون لمسات الإبداع",
      partner_id: "mc-2",
      created_at: new Date(today.getTime() - 3 * 86400000).toISOString(),
    },
    {
      id: "mo-3",
      title: "جلسة مساج علاجي 90 دقيقة",
      description: "مساج كامل للجسم لإزالة التوتر وتنشيط الدورة الدموية.",
      price: 380,
      original_price: 600,
      category: "سبا ومساج",
      status: "draft",
      image_url: "",
      center_name: "سبا الواحة الفاخر",
      partner_id: "mc-3",
      created_at: new Date(today.getTime() - 1 * 86400000).toISOString(),
    },
    {
      id: "mo-4",
      title: "اشتراك شهري نادي صحي",
      description: "اشتراك مفتوح يشمل جميع الأنشطة والمدرب الشخصي.",
      price: 449,
      original_price: 750,
      category: "صحة ولياقة",
      status: "active",
      image_url: "",
      center_name: "نادي بيور فيت",
      partner_id: "mc-4",
      created_at: new Date(today.getTime() - 7 * 86400000).toISOString(),
    },
    {
      id: "mo-5",
      title: "جلسة ليزر إزالة شعر — مناطق صغيرة",
      description: "جلسة آمنة وفعالة بأحدث أجهزة الليزر.",
      price: 149,
      original_price: 300,
      category: "تجميل",
      status: "active",
      image_url: "",
      center_name: "مركز النخبة الطبي",
      partner_id: "mc-1",
      created_at: new Date(today.getTime() - 10 * 86400000).toISOString(),
    },
  ]);

  // ===== Admin: Categories =====
  seedKey("saba_admin_categories_v1", [
    { id: "cat-1", slug: "medical", name_ar: "طبي", name_en: "Medical", icon: "🩺", active: true },
    { id: "cat-2", slug: "salons", name_ar: "صالونات", name_en: "Salons", icon: "💇", active: true },
    { id: "cat-3", slug: "spa", name_ar: "سبا ومساج", name_en: "Spa & Massage", icon: "💆", active: true },
    { id: "cat-4", slug: "fitness", name_ar: "صحة ولياقة", name_en: "Fitness", icon: "🏋️", active: true },
    { id: "cat-5", slug: "beauty", name_ar: "تجميل", name_en: "Beauty", icon: "✨", active: true },
    { id: "cat-6", slug: "labs", name_ar: "مختبرات", name_en: "Labs", icon: "🧪", active: true },
  ]);

  // ===== Admin: Cities =====
  seedKey("saba_admin_cities_v1", [
    { id: "ct-1", name_ar: "الرياض", name_en: "Riyadh", active: true },
    { id: "ct-2", name_ar: "جدة", name_en: "Jeddah", active: true },
    { id: "ct-3", name_ar: "الدمام", name_en: "Dammam", active: true },
    { id: "ct-4", name_ar: "مكة المكرمة", name_en: "Makkah", active: true },
    { id: "ct-5", name_ar: "المدينة المنورة", name_en: "Madinah", active: true },
    { id: "ct-6", name_ar: "الخبر", name_en: "Khobar", active: true },
    { id: "ct-7", name_ar: "تبوك", name_en: "Tabuk", active: false },
  ]);

  // ===== Admin: Reviews =====
  seedKey("demo_admin_reviews", [
    { id: "rv-1", serviceTitle: "تنظيف أسنان احترافي", serviceSlug: "dental-clean", userName: "محمد العتيبي", userEmail: "m@example.com", rating: 5, comment: "تجربة ممتازة، فريق محترف ومركز نظيف جداً.", status: "published", createdAt: new Date(today.getTime() - 2*86400000).toISOString() },
    { id: "rv-2", serviceTitle: "عناية بالشعر", serviceSlug: "hair-care", userName: "نورة الزهراني", userEmail: "n@example.com", rating: 4, comment: "النتيجة رائعة لكن الانتظار كان طويلاً قليلاً.", status: "published", createdAt: new Date(today.getTime() - 4*86400000).toISOString() },
    { id: "rv-3", serviceTitle: "جلسة مساج", serviceSlug: "massage", userName: "خالد الشهري", userEmail: "k@example.com", rating: 5, comment: "أفضل جلسة مساج جربتها، أنصح بها بشدة.", status: "pending", createdAt: new Date(today.getTime() - 1*86400000).toISOString() },
    { id: "rv-4", serviceTitle: "اشتراك نادي", serviceSlug: "gym", userName: "سارة القحطاني", userEmail: "s@example.com", rating: 3, comment: "المعدات جيدة لكن المكان مزدحم.", status: "pending", createdAt: new Date(today.getTime() - 6*86400000).toISOString() },
    { id: "rv-5", serviceTitle: "ليزر تجميلي", serviceSlug: "laser", userName: "ريم الحربي", userEmail: "r@example.com", rating: 2, comment: "النتيجة لم تكن كما توقعت.", status: "rejected", createdAt: new Date(today.getTime() - 8*86400000).toISOString() },
  ]);

  // ===== Admin: Tickets =====
  seedKey("demo_admin_tickets", [
    { id: "tk-1", number: "TK-1042", subject: "استفسار عن استرداد عربون", userName: "محمد العتيبي", userEmail: "m@example.com", priority: "high", status: "open", lastMessage: "هل يمكنني استرداد العربون بعد إلغاء الحجز؟", createdAt: new Date(today.getTime() - 1*86400000).toISOString() },
    { id: "tk-2", number: "TK-1041", subject: "مشكلة في تأكيد الحجز", userName: "نورة الزهراني", userEmail: "n@example.com", priority: "normal", status: "in_progress", lastMessage: "لم يصلني الباركود في رسالة التأكيد.", createdAt: new Date(today.getTime() - 2*86400000).toISOString() },
    { id: "tk-3", number: "TK-1040", subject: "تعديل موعد الحجز", userName: "خالد الشهري", userEmail: "k@example.com", priority: "low", status: "closed", lastMessage: "تم التعديل، شكراً لكم.", createdAt: new Date(today.getTime() - 5*86400000).toISOString() },
    { id: "tk-4", number: "TK-1039", subject: "شكوى من جودة الخدمة", userName: "سارة القحطاني", userEmail: "s@example.com", priority: "high", status: "open", lastMessage: "أتمنى متابعة الموضوع.", createdAt: new Date(today.getTime() - 3*86400000).toISOString() },
  ]);

  // ===== Admin: Abandoned carts =====
  seedKey("demo_admin_abandoned_carts", [
    { id: "ac-1", customer_name: "أحمد البقمي", customer_email: "a.bagmi@example.com", customer_phone: "+966551112233", total: 380, items_count: 1, last_seen: new Date(today.getTime() - 1*3600000).toISOString(), items: [{ serviceTitle: "جلسة مساج 90 دقيقة", qty: 1, price: 380 }] },
    { id: "ac-2", customer_name: "هند العنزي", customer_email: "h.anzi@example.com", customer_phone: "+966552223344", total: 599, items_count: 1, last_seen: new Date(today.getTime() - 3*3600000).toISOString(), items: [{ serviceTitle: "بكج عناية كاملة بالشعر", qty: 1, price: 599 }] },
    { id: "ac-3", customer_name: "فهد السعيد", customer_email: "f.saeed@example.com", customer_phone: "+966553334455", total: 199, items_count: 1, last_seen: new Date(today.getTime() - 12*3600000).toISOString(), items: [{ serviceTitle: "تنظيف أسنان", qty: 1, price: 199 }] },
    { id: "ac-4", customer_name: "ليلى الخالدي", customer_email: "l.khaledi@example.com", customer_phone: "+966554445566", total: 898, items_count: 2, last_seen: new Date(today.getTime() - 26*3600000).toISOString(), items: [{ serviceTitle: "ليزر تجميلي", qty: 2, price: 449 }] },
  ]);

  // ===== Admin: Payouts (additional demo data) =====
  seedKey("demo_admin_payouts", [
    { id: "po-1", partner_name: "مركز النخبة الطبي", amount: 4280, iban: "SA0380000000608010167519", bank_name: "البنك الأهلي السعودي", status: "pending", requested_at: new Date(today.getTime() - 1*86400000).toISOString() },
    { id: "po-2", partner_name: "صالون لمسات الإبداع", amount: 2150, iban: "SA4420000001234567891011", bank_name: "بنك الراجحي", status: "approved", requested_at: new Date(today.getTime() - 5*86400000).toISOString() },
    { id: "po-3", partner_name: "سبا الواحة الفاخر", amount: 6720, iban: "SA0945000000019876543210", bank_name: "بنك الرياض", status: "pending", requested_at: new Date(today.getTime() - 2*86400000).toISOString() },
    { id: "po-4", partner_name: "نادي بيور فيت", amount: 1890, iban: "SA1010000000456789012345", bank_name: "بنك ساب", status: "rejected", requested_at: new Date(today.getTime() - 7*86400000).toISOString() },
  ]);

  // ===== Partner Dashboard: demo data =====
  seedKey("demo_partner_offers", [
    { id: "po-of-1", title: "خصم خاص — تنظيف بشرة عميق", price: 220, original_price: 400, category: "تجميل", status: "active", created_at: new Date(today.getTime() - 3*86400000).toISOString() },
    { id: "po-of-2", title: "باقة 5 جلسات مساج", price: 1500, original_price: 2500, category: "سبا ومساج", status: "active", created_at: new Date(today.getTime() - 8*86400000).toISOString() },
    { id: "po-of-3", title: "جلسة عناية بالقدمين", price: 99, original_price: 180, category: "تجميل", status: "draft", created_at: new Date(today.getTime() - 1*86400000).toISOString() },
  ]);
  seedKey("demo_partner_bookings", [
    { id: "pb-1", customer_name: "محمد العتيبي", customer_phone: "+966555112233", offer_title: "خصم خاص — تنظيف بشرة عميق", amount: 220, deposit_amount: 44, status: "confirmed", booking_date: day(2), booking_time: "10:30" },
    { id: "pb-2", customer_name: "نورة الزهراني", customer_phone: "+966554455667", offer_title: "باقة 5 جلسات مساج", amount: 1500, deposit_amount: 300, status: "pending", booking_date: day(4), booking_time: "16:00" },
    { id: "pb-3", customer_name: "خالد الشهري", customer_phone: "+966507788990", offer_title: "جلسة عناية بالقدمين", amount: 99, deposit_amount: 20, status: "completed", booking_date: day(-2), booking_time: "14:00" },
    { id: "pb-4", customer_name: "سارة القحطاني", customer_phone: "+966503344556", offer_title: "خصم خاص — تنظيف بشرة عميق", amount: 220, deposit_amount: 44, status: "completed", booking_date: day(-5), booking_time: "11:00" },
  ]);
}
