import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Menu, X, LogIn, ShoppingCart, User, Heart, Package, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";
import { useCategories } from "@/hooks/useCatalog";
import { usePartner } from "@/hooks/usePartner";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { toast } from "sonner";
import logo from "@/assets/booking-logo.png";
import flagSA from "@/assets/flag-sa.jpg";
import flagUS from "@/assets/flag-us.jpg";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/i18n/LanguageProvider";
import type { TKey } from "@/i18n/translations";
import { renderCategoryIcon } from "@/lib/categoryIcon";

const navLinks: { to: any; hash?: string; key: TKey }[] = [
  { to: "/", key: "nav.home" },
  { to: "/offers", key: "nav.allOffers" },
  { to: "/partner", key: "nav.partner" },
  { to: "/track", key: "nav.trackOrder" },
  { to: "/about", key: "nav.about" },
  { to: "/contact", key: "nav.contact" },
];




export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { isPartner, partner, partnerLogout } = usePartner();
  const { lang, toggle: toggleLang, t } = useLang();
  const navigate = useNavigate();
  const [acctOpen, setAcctOpen] = useState(false);
  const partnerName = partner?.name || partner?.vendorName || "";
  const displayName = isPartner ? partnerName : (user?.name || user?.email || "?");
  const initial = displayName.trim().charAt(0).toUpperCase();
  async function handleLogout() {
    if (isPartner) {
      await partnerLogout();
    } else {
      await logout();
    }
    setAcctOpen(false);
    toast.success(t("account.nav.logout"));
    navigate({ to: "/" });
  }
  const [mounted, setMounted] = useState(false);
  const [favCount, setFavCount] = useState(0);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    let cancelled = false;
    import("@/hooks/useFavorite").then(({ readFavs, loadFavorites }) => {
      const sync = () => {
        if (cancelled) return;
        try { setFavCount(Object.values(readFavs()).filter(Boolean).length); }
        catch { setFavCount(0); }
      };
      sync();
      loadFavorites().then(sync).catch(() => {});
      window.addEventListener("saba:favorites", sync);
      window.addEventListener("storage", sync);
      return () => {
        window.removeEventListener("saba:favorites", sync);
        window.removeEventListener("storage", sync);
      };
    });
    return () => { cancelled = true; };
  }, [isAuthenticated]);
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <img
            src={logo}
            alt="خصومات"
            width={120}
            height={48}
            className="h-9 w-auto object-contain transition-transform duration-500 group-hover:scale-105 sm:h-11"
          />
        </Link>



        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 lg:flex">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="relative py-1 text-sm font-medium text-foreground/80 transition-colors hover:text-primary after:absolute after:inset-x-0 after:-bottom-2 after:h-0.5 after:rounded-full after:bg-primary after:scale-x-0 after:origin-center after:transition-transform after:duration-300 hover:after:scale-x-100"
            activeProps={{ className: "text-primary font-bold after:scale-x-100" }}
          >
            {t("nav.home")}
          </Link>

          <CategoriesDropdown label={t("nav.services")} />

          {navLinks.slice(1).map((l) => (
            <Link
              key={l.key + (l.hash || "")}
              to={l.to}
              hash={l.hash}
              activeOptions={{ exact: l.to === "/" && !l.hash }}
              className="relative py-1 text-sm font-medium text-foreground/80 transition-colors hover:text-primary after:absolute after:inset-x-0 after:-bottom-2 after:h-0.5 after:rounded-full after:bg-primary after:scale-x-0 after:origin-center after:transition-transform after:duration-300 hover:after:scale-x-100"
              activeProps={{ className: "text-primary font-bold after:scale-x-100" }}
            >
              {t(l.key)}
            </Link>
          ))}

        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LangSwitch lang={lang} onClick={toggleLang} />
          <Link
            to={"/account/favorites" as any}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-foreground/70 transition hover:border-primary hover:text-primary"
            aria-label="favorites"
          >
            <Heart className="h-4 w-4" />
            {mounted && favCount > 0 && (
              <span className="absolute -top-1 -left-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {favCount}
              </span>
            )}
          </Link>
          <Link
            to={"/cart" as any}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-foreground/70 transition hover:border-primary hover:text-primary"
            aria-label={t("nav.cart")}
          >
            <ShoppingCart className="h-4 w-4" />
            {mounted && count > 0 && (
              <span className="absolute -top-1 -left-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
          {mounted && (isAuthenticated || isPartner) ? (
            <Popover open={acctOpen} onOpenChange={setAcctOpen}>
              <PopoverTrigger asChild>
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground shadow-[0_8px_20px_-8px_rgba(0,174,198,0.55)] transition hover:bg-primary-dark"
                  aria-label={t("nav.account")}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-primary text-xs font-bold">{initial}</span>
                  <span className="max-w-[120px] truncate">{displayName || t("nav.account")}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-60 p-2" dir={lang === "ar" ? "rtl" : "ltr"}>
                <div className="border-b border-border px-2 pb-2 mb-1">
                  <div className="text-sm font-bold truncate">{isPartner ? partnerName : (user?.name || "")}</div>
                  <div className="text-xs text-muted-foreground truncate">{isPartner ? (partner?.email || "") : (user?.email || "")}</div>
                </div>
                {isPartner ? (
                  <>
                    <Link to={"/partner-dashboard" as any} onClick={() => setAcctOpen(false)} className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted">
                      <LayoutDashboard className="h-4 w-4" /> {t("header.adminPanel")}
                    </Link>
                    <div className="my-1 h-px bg-border" />
                    <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-rose-600 hover:bg-rose-50">
                      <LogOut className="h-4 w-4" /> {t("account.nav.logout")}
                    </button>
                  </>
                ) : (
                  <>
                    {isAdmin && (
                      <Link to={"/admin" as any} onClick={() => setAcctOpen(false)} className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted">
                        <LayoutDashboard className="h-4 w-4" /> {t("header.adminPanel")}
                      </Link>
                    )}
                    <Link to={"/account" as any} onClick={() => setAcctOpen(false)} className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted">
                      <User className="h-4 w-4" /> {t("account.nav.overview")}
                    </Link>
                    <Link to={"/account/orders" as any} onClick={() => setAcctOpen(false)} className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted">
                      <Package className="h-4 w-4" /> {t("account.nav.orders")}
                    </Link>
                    <Link to={"/account/favorites" as any} onClick={() => setAcctOpen(false)} className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted">
                      <Heart className="h-4 w-4" /> {t("account.nav.favorites")}
                    </Link>
                    <Link to={"/account/profile" as any} onClick={() => setAcctOpen(false)} className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted">
                      <User className="h-4 w-4" /> {t("account.nav.profile")}
                    </Link>
                    <div className="my-1 h-px bg-border" />
                    <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-rose-600 hover:bg-rose-50">
                      <LogOut className="h-4 w-4" /> {t("account.nav.logout")}
                    </button>
                  </>
                )}
              </PopoverContent>
            </Popover>
          ) : (
            <>
              <Link
                to={"/account" as any}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-foreground/70 transition hover:border-primary hover:text-primary"
                aria-label={t("nav.account")}
              >
                <User className="h-4 w-4" />
              </Link>
              <Link
                to={"/login" as any}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-[0_8px_20px_-8px_rgba(0,174,198,0.55)] transition hover:bg-primary-dark"
              >
                <LogIn className="h-4 w-4" />
                {t("nav.login")}
              </Link>
            </>
          )}
        </div>

        {/* Mobile/Tablet quick actions */}
        <div className="flex min-w-0 items-center gap-1.5 lg:hidden">
          <LangSwitch lang={lang} onClick={toggleLang} compact label={t("nav.toggleLang")} />
          <Link
            to={"/account/favorites" as any}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-foreground/70"
            aria-label="favorites"
          >
            <Heart className="h-4 w-4" />
            {mounted && favCount > 0 && (
              <span className="absolute -top-1 -left-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {favCount}
              </span>
            )}
          </Link>
          <Link
            to={"/cart" as any}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-foreground/70"
            aria-label={t("nav.cart")}
          >
            <ShoppingCart className="h-4 w-4" />
            {mounted && count > 0 && (
              <span className="absolute -top-1 -left-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-foreground"
            onClick={() => setOpen((v) => !v)}
            aria-label={t("nav.menu")}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile slide-down sheet */}
      <div className={`lg:hidden overflow-hidden border-t border-border bg-background transition-[max-height,opacity] duration-300 ${open ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"}`}>
        <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
          {navLinks.map((l) => (
            <Link
              key={l.key + (l.hash || "")}
              to={l.to}
              hash={l.hash}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-base font-medium text-foreground/80 hover:bg-muted"
              activeProps={{ className: "text-primary font-bold bg-primary-light" }}
            >
              {t(l.key)}
            </Link>
          ))}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {mounted && (isAuthenticated || isPartner) ? (
              <div className="col-span-2 rounded-2xl border border-border bg-card p-3">
                <div className="flex items-center gap-3 border-b border-border pb-3 mb-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">{initial}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold truncate">{isPartner ? partnerName : (user?.name || "")}</div>
                    <div className="text-xs text-muted-foreground truncate">{isPartner ? (partner?.email || "") : (user?.email || "")}</div>
                  </div>
                </div>
                <div className="flex flex-col">
                  {isPartner ? (
                    <>
                      <Link to={"/partner-dashboard" as any} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-2 py-2.5 text-sm hover:bg-muted">
                        <LayoutDashboard className="h-4 w-4" /> {t("header.adminPanel")}
                      </Link>
                      <button
                        onClick={() => { setOpen(false); handleLogout(); }}
                        className="mt-1 flex items-center gap-2 rounded-md px-2 py-2.5 text-sm text-rose-600 hover:bg-rose-50 text-start"
                      >
                        <LogOut className="h-4 w-4" /> {t("account.nav.logout")}
                      </button>
                    </>
                  ) : (
                    <>
                      {isAdmin && (
                        <Link to={"/admin" as any} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-2 py-2.5 text-sm hover:bg-muted">
                          <LayoutDashboard className="h-4 w-4" /> {t("header.adminPanel")}
                        </Link>
                      )}
                      <Link to={"/account" as any} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-2 py-2.5 text-sm hover:bg-muted">
                        <User className="h-4 w-4" /> {t("account.nav.overview")}
                      </Link>
                      <Link to={"/account/orders" as any} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-2 py-2.5 text-sm hover:bg-muted">
                        <Package className="h-4 w-4" /> {t("account.nav.orders")}
                      </Link>
                      <Link to={"/account/favorites" as any} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-2 py-2.5 text-sm hover:bg-muted">
                        <Heart className="h-4 w-4" /> {t("account.nav.favorites")}
                      </Link>
                      <Link to={"/account/profile" as any} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-2 py-2.5 text-sm hover:bg-muted">
                        <User className="h-4 w-4" /> {t("account.nav.profile")}
                      </Link>
                      <button
                        onClick={() => { setOpen(false); handleLogout(); }}
                        className="mt-1 flex items-center gap-2 rounded-md px-2 py-2.5 text-sm text-rose-600 hover:bg-rose-50 text-start"
                      >
                        <LogOut className="h-4 w-4" /> {t("account.nav.logout")}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <>
                <Link
                  to={"/account" as any}
                  onClick={() => setOpen(false)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-white text-sm font-bold text-foreground/80"
                >
                  <User className="h-4 w-4" /> {t("nav.account")}
                </Link>
                <Link
                  to={"/login" as any}
                  onClick={() => setOpen(false)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-primary-foreground"
                >
                  <LogIn className="h-4 w-4" /> {t("nav.login")}
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

function CategoriesDropdown({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  const { categories } = useCategories();
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const onEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const onLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div ref={ref} className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 py-1 text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
      >
        {label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Mega panel (with invisible hover-bridge via pt-3) */}
      <div
        className={`absolute right-1/2 top-full z-40 w-[min(640px,92vw)] translate-x-1/2 pt-3 transition-all duration-200 ${
          open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        <div className="origin-top rounded-3xl border border-border bg-card p-4 shadow-2xl shadow-primary/10" dir="rtl">
        <div className="mb-3 flex items-center justify-between border-b border-border pb-2">

          <span className="text-xs font-extrabold text-foreground">تصفح حسب التصنيف</span>
          <Link
            to="/categories"
            onClick={() => setOpen(false)}
            className="text-xs font-bold text-primary hover:underline"
          >
            عرض الكل
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to="/offers/category/$slug"
              params={{ slug: c.slug }}
              onClick={() => setOpen(false)}
              className="group flex items-center gap-3 rounded-2xl border border-transparent p-3 transition hover:border-primary/20 hover:bg-muted"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${c.color} text-lg text-white shadow-sm ring-1 ring-white/30 transition group-hover:scale-110`}
              >
                {renderCategoryIcon(c.icon)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-extrabold text-foreground group-hover:text-primary">
                  {c.nameAr}
                </div>
                <div className="text-[11px] text-muted-foreground">{c.nameEn}</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#3F2A6B] to-[#E0254D] p-3 text-white">
          <div>
            <div className="text-xs font-extrabold">شوف كل العروض المتاحة</div>
            <div className="text-[11px] text-white/85">أكثر من 120 عرض حصري بانتظارك</div>
          </div>
          <Link
            to="/offers"
            onClick={() => setOpen(false)}
            className="rounded-full bg-white px-3 py-1.5 text-[11px] font-extrabold text-foreground transition hover:scale-105"
          >
            تصفح الآن
          </Link>
        </div>
      </div>
      </div>
    </div>
  );
}



export function LangSwitch({ lang, onClick, compact, label }: { lang: "ar" | "en"; onClick: () => void; compact?: boolean; label?: string }) {
  // Show the flag of the language we will switch TO (next language)
  const next = lang === "ar" ? "en" : "ar";
  const flagSrc = next === "en" ? flagUS : flagSA;
  const code = next === "en" ? "EN" : "AR";
  return (
    <button
      onClick={onClick}
      aria-label={label || "Toggle language"}
      className={
        compact
          ? "group inline-flex h-9 items-center gap-1.5 overflow-hidden rounded-full border border-border bg-white px-2.5 text-[11px] font-bold text-foreground/70 transition hover:border-primary hover:text-primary"
          : "group inline-flex items-center gap-1.5 overflow-hidden rounded-full border border-border bg-white px-3 py-1.5 text-xs font-bold text-foreground/70 transition hover:border-primary hover:text-primary"
      }
    >
      <img
        key={code}
        src={flagSrc}
        alt=""
        aria-hidden
        className="h-4 w-6 rounded-[2px] object-cover ring-1 ring-border/60 transition-transform duration-300 group-hover:scale-110"
      />
      <span className="tracking-wide">{code}</span>
    </button>
  );
}