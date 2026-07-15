export type Price = {
  amount: number;
  originalAmount: number | null;
  currency: "SAR";
  discountPercent: number | null;
};

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  avatar: string | null;
  role: string; // "admin" | "client" | legacy roles
  status?: "active" | "banned" | string;
  language: string | null;
  authProvider?: string;
  emailVerified?: boolean;
  createdAt: string | null;
};

export type AuthUser = User;
export type AuthResponse = {
  user?: User;
  token?: string;
  isNew?: boolean;
  requiresOtp?: boolean;
  email?: string;
  message?: string;
};
export type LoginPayload = { emailOrPhone: string; password: string };
export type RegisterPayload = {
  name: string; email: string; phone?: string;
  password: string; city?: string; language?: string;
};
export type RequestOtpPayload = { email: string };
export type VerifyOtpPayload = { email: string; otp: string };

export type ServiceListItem = {
  id: string; slug: string; sku: string;
  titleAr: string; titleEn: string;
  subtitleAr: string; subtitleEn: string;
  category: string; price: Price;
  cover: string | null; status: string;
  rating: number; reviewsCount: number;
  isFavorited: boolean;
};

export type ServicePlan = {
  id: string; name: string; price: Price;
  featured: boolean; feats: string[];
};

export type ServiceFull = ServiceListItem & {
  bannerImage: string | null;
  breadcrumbAr: string; breadcrumbEn: string;
  overviewDescriptionAr: string; overviewDescriptionEn: string;
  heroHighlights: { ar: string; en: string }[];
  overview: { titleAr: string; titleEn: string; descAr: string; descEn: string }[];
  benefits: { titleAr: string; titleEn: string; descAr: string; descEn: string }[];
  steps: { titleAr: string; titleEn: string }[];
  stats: { v: string; labelAr: string; labelEn: string }[];
  testimonials: { name: string; role: string; text: string; avatar: string | null }[];
  faqs: { qAr: string; qEn: string; aAr: string; aEn: string }[];
  plans: ServicePlan[];
  seo: { titleAr: string; titleEn: string; descriptionAr: string; descriptionEn: string; keywords: string; ogImage: string | null } | null;
};

export type Branch = {
  id: string;
  partnerId?: string | null;
  nameAr: string;
  nameEn?: string | null;
  phone?: string | null;
  address?: string | null;
  mapsUrl?: string | null;
  isDefault?: boolean;
  workingHours?: any | null;
  status?: string;
  // Independent branch fields
  isIndependent?: boolean;
  hasAccount?: boolean;
  canManageOffers?: boolean;
  canManageHours?: boolean;
  canEditInfo?: boolean;
  canManageBookings?: boolean;
  email?: string | null;
};

export type CartItem = {
  id: string; service_slug: string; service_title: string;
  plan_id: string | null; plan_name: string | null;
  price: number; original_price: number | null; qty: number;
  branchId?: string | null;
  branchName?: string | null;
};


export type Cart = {
  items: CartItem[]; subtotal: number;
  vat: number; total: number; sessionId: string;
  discount?: number; code?: string;
};

export type OrderItem = {
  id: string; service_slug: string; service_title: string;
  plan_id: string | null; plan_name: string | null;
  price: number; original_price: number | null; qty: number;
};

export type Order = {
  id: string; number: string; createdAt: string;
  status: "pending"|"confirmed"|"in_progress"|"review"|"completed"|"cancelled";
  payment_method: string; payment_id: string | null; paid: boolean;
  contact_name: string; contact_email: string; contact_phone: string;
  contact_city: string; contact_address: string;
  items: OrderItem[]; subtotal: number; vat: number; total: number;
  notes: string | null; source: string;
  timeline: { status: string; at: string; note: string }[];
  invoice: { id: string; number: string; status: string; total: number } | null;
  branch?: Branch | null;
};

export type Ticket = {
  id: string; number: string; subject: string;
  orderId: string | null;
  status: "open"|"answered"|"closed";
  priority: "low"|"normal"|"high";
  createdAt: string;
  messages: { id: string; from_type: "client"|"support"; author: string; text: string; at: string }[];
};

export type Plan = {
  id: string; nameAr: string; nameEn: string;
  price: Price; badgeAr: string | null; badgeEn: string | null;
  descriptionAr: string; descriptionEn: string;
  featuresAr: string[]; featuresEn: string[];
  highlighted: boolean; sortOrder: number; status: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export type PaginatedResponse<T> = {
  success: boolean;
  data: {
    items: T[];
    total: number; page: number;
    pageSize: number; totalPages: number;
  };
};