import { createFileRoute, Link } from "@tanstack/react-router";
import { XCircle, RotateCcw, Home, Wallet, Loader2, Package } from "lucide-react";
import { z } from "zod";
import { useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { useLang } from "@/i18n/LanguageProvider";
import { account } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/payment/failed")({
  validateSearch: z.object({
    order: z.string().optional(),
    m: z.string().optional(),
  }),
  head: () => ({ meta: [{ title: "Payment Failed | koswmat" }] }),
  component: PaymentFailedPage,
});

function PaymentFailedPage() {
  const { lang } = useLang();
  const { order: orderId, m } = Route.useSearch();
  const [retrying, setRetrying] = useState(false);

  const retryPayment = async () => {
    if (!orderId) return;
    setRetrying(true);
    try {
      const method = m === "tamara" ? "tamara" : m === "tabby" ? "tabby" : m === "cod" ? "cod" : "myfatoorah";
      const res: any = await account.payOrder(orderId, { paymentMethod: method });
      const url = res?.data?.paymentUrl || res?.paymentUrl;
      if (url) {
        window.location.href = url;
        return;
      }
      toast.error(lang === "ar" ? "تعذر بدء الدفع" : "Could not start payment");
    } catch {
      toast.error(lang === "ar" ? "تعذر بدء الدفع" : "Could not start payment");
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteHeader />
      <main className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-4 py-8 text-center">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-rose-600 shadow-[0_20px_50px_-15px_rgba(244,63,94,0.6)]">
          <XCircle className="h-14 w-14 text-white" />
        </div>
        <h1 className="mt-8 text-3xl font-bold">
          {lang === "ar" ? "فشل عملية الدفع" : "Payment Failed"}
        </h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          {lang === "ar"
            ? "حدث خطأ أثناء معالجة الدفع. يمكنك المحاولة مرة أخرى أو اختيار وسيلة دفع مختلفة."
            : "Something went wrong while processing your payment. Please try again or choose a different method."}
        </p>
        {orderId && (
          <div className="mt-5 inline-flex items-center gap-3 rounded-full border border-border bg-card px-5 py-2.5 shadow-sm">
            <span className="text-sm text-muted-foreground">
              {lang === "ar" ? "رقم الطلب" : "Order"}
            </span>
            <span className="text-base font-bold text-primary" dir="ltr">{orderId}</span>
          </div>
        )}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {orderId ? (
            <button
              onClick={retryPayment}
              disabled={retrying}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-dark px-6 text-sm font-bold text-primary-foreground shadow-sm hover:opacity-95 disabled:opacity-60"
            >
              {retrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
              {lang === "ar" ? "أعد محاولة الدفع" : "Retry payment"}
            </button>
          ) : (
            <Link
              to={"/cart" as any}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-primary-dark"
            >
              <RotateCcw className="h-4 w-4" />
              {lang === "ar" ? "حاول مرة أخرى" : "Try Again"}
            </Link>
          )}
          {orderId && (
            <Link
              to={"/account/orders/$orderId" as any}
              params={{ orderId } as any}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-card px-6 text-sm font-bold hover:bg-muted"
            >
              <Package className="h-4 w-4" />
              {lang === "ar" ? "تفاصيل الطلب" : "Order details"}
            </Link>
          )}
          <Link
            to={"/" as any}
            className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-card px-6 text-sm font-bold hover:bg-muted"
          >
            <Home className="h-4 w-4" />
            {lang === "ar" ? "الرئيسية" : "Home"}
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
