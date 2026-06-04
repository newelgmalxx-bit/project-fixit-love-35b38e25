import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, XCircle, Package, Home, RotateCcw, Loader2, AlertTriangle } from "lucide-react";
import { z } from "zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { useLang } from "@/i18n/LanguageProvider";
import api, { ApiError } from "@/lib/api";

type StatusKind = "success" | "pending" | "failed" | "error";

export const Route = createFileRoute("/payment/result")({
  validateSearch: z.object({
    status: z.string().optional(),
    order: z.string().optional(),
    pid: z.string().optional(),
    paymentId: z.string().optional(),
    message: z.string().optional(),
  }),
  head: () => ({ meta: [{ title: "Payment Result | koswmat" }] }),
  component: PaymentResultPage,
});

function normalize(s?: string): StatusKind {
  const v = (s || "").toLowerCase();
  if (["success", "paid", "completed", "confirmed"].includes(v)) return "success";
  if (["pending", "processing", "in_progress"].includes(v)) return "pending";
  if (["failed", "failure", "declined", "cancelled", "canceled"].includes(v)) return "failed";
  return v ? "error" : "error";
}

const MAX_ATTEMPTS = 8; // ~24s of polling before we surface a clear error.

function PaymentResultPage() {
  const search = Route.useSearch();
  const { lang } = useLang();
  const navigate = useNavigate();
  const ar = lang === "ar";
  const paymentId = search.paymentId || search.pid;

  // Initial kind: if we have a paymentId we always start in `pending` and verify.
  const [kind, setKind] = useState<StatusKind>(() =>
    paymentId ? "pending" : normalize(search.status),
  );
  const [orderNumber, setOrderNumber] = useState<string | undefined>(search.order);
  const [errorMsg, setErrorMsg] = useState<string | undefined>(search.message);
  const [attempts, setAttempts] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const [orderId, setOrderId] = useState<string | undefined>(undefined);

  const verifyOnce = useCallback(async (): Promise<"success" | "failed" | "pending" | "error"> => {
    if (!paymentId) return "error";
    setVerifying(true);
    try {
      const res = await api.checkout.verify(paymentId);
      const d: any = res?.data || {};
      if (d.orderNumber) setOrderNumber(d.orderNumber);
      if (d.orderId) setOrderId(d.orderId);
      // Redirect to the order summary page as soon as we have ANY positive
      // signal from the gateway — order ref, paid=true, or even just a
      // confirmed payment (used for plan orders that may not always return
      // an orderId in the verify payload).
      if (d.paid === true || d.orderId || d.orderNumber) {
        navigate({
          to: "/checkout/success" as any,
          search: {
            order: d.orderId || search.order,
            o: d.orderNumber,
            paid: d.paid === true ? "1" : undefined,
          } as any,
          replace: true,
        });
        return d.paid === true ? "success" : "pending";
      }
      if (d.paid === false) return "pending";
      return "pending";
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 0 || e.status >= 500) {
          setErrorMsg(ar ? "تعذر الاتصال بخادم الدفع." : "Couldn't reach the payment server.");
        } else if (e.status === 404) {
          setErrorMsg(ar ? "لم يتم العثور على عملية الدفع." : "Payment not found.");
          return "failed";
        } else {
          setErrorMsg(e.message);
        }
      } else {
        setErrorMsg(ar ? "خطأ غير متوقع أثناء التحقق من الدفع." : "Unexpected error verifying payment.");
      }
      return "error";
    } finally {
      setVerifying(false);
    }
  }, [paymentId, ar, navigate]);

  const runVerification = useCallback(async () => {
    if (!paymentId) return;
    setKind("pending");
    setErrorMsg(undefined);
    setAttempts(0);
    cancelledRef.current = false;

    const tick = async () => {
      if (cancelledRef.current) return;
      setAttempts((n) => n + 1);
      const result = await verifyOnce();
      if (cancelledRef.current) return;
      if (result === "success") {
        stopTimer();
        setKind("success");
        // verifyOnce() already navigated to /checkout/success on success.
      } else if (result === "failed") {
        stopTimer();
        setKind("failed");
      } else if (result === "error") {
        // Network / server error — keep retrying until attempts exhausted.
      }
    };

    await tick();
    timerRef.current = setInterval(() => {
      // Stop after MAX_ATTEMPTS — show a clear error with manual retry.
      setAttempts((n) => {
        if (n >= MAX_ATTEMPTS) {
          stopTimer();
          setKind("error");
          setErrorMsg((prev) =>
            prev ||
            (ar
              ? "استغرق التحقق وقتًا طويلاً. اضغط إعادة المحاولة، أو راجع طلباتك للاطلاع على الحالة."
              : "Verification is taking too long. Press retry or check your orders for the latest status."),
          );
          return n;
        }
        return n;
      });
      tick();
    }, 3000);
  }, [paymentId, navigate, orderNumber, verifyOnce, ar]);

  useEffect(() => {
    if (!paymentId) {
      const k = normalize(search.status);
      setKind(k);
      setOrderNumber(search.order);
      // Failed/error → go to the dedicated failed page (never bounce to /cart).
      if (k === "failed" || k === "error") {
        navigate({
          to: "/checkout/failed" as any,
          search: { order: search.order, message: search.message } as any,
          replace: true,
        });
        return;
      }
      // Success/pending with order ref → jump to summary.
      if (search.order) {
        navigate({
          to: "/checkout/success" as any,
          search: { order: search.order, o: search.order } as any,
          replace: true,
        });
      }
      return;
    }
    runVerification();
    return () => {
      cancelledRef.current = true;
      stopTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  const config = {
    success: {
      title: ar ? "تم الدفع بنجاح" : "Payment Successful",
      body: ar
        ? "تم استلام دفعتك وتأكيد طلبك. سنتواصل معك قريبًا لبدء التنفيذ."
        : "We received your payment and confirmed your order. We'll be in touch shortly.",
      Icon: CheckCircle2,
      iconBg: "from-emerald-400 to-emerald-600",
      shadow: "shadow-[0_20px_50px_-15px_rgba(16,185,129,0.6)]",
      ping: "bg-emerald-400/30",
      spin: false,
    },
    pending: {
      title: ar ? "جارٍ تأكيد الدفع" : "Confirming Payment",
      body: ar
        ? "جارٍ التحقق من الدفع لدى البوابة، يرجى الانتظار..."
        : "Verifying your payment with the gateway, please wait...",
      Icon: Loader2,
      iconBg: "from-amber-400 to-amber-500",
      shadow: "shadow-[0_20px_50px_-15px_rgba(245,158,11,0.55)]",
      ping: "bg-amber-400/30",
      spin: true,
    },
    failed: {
      title: ar ? "لم يتم الدفع" : "Payment Failed",
      body:
        errorMsg ||
        (ar
          ? "لم يكتمل الدفع. يمكنك المحاولة مرة أخرى أو اختيار وسيلة دفع مختلفة."
          : "Your payment was not completed. You can try again or pick a different method."),
      Icon: XCircle,
      iconBg: "from-rose-400 to-rose-600",
      shadow: "shadow-[0_20px_50px_-15px_rgba(244,63,94,0.6)]",
      ping: "",
      spin: false,
    },
    error: {
      title: ar ? "تعذر التحقق من الدفع" : "Couldn't Verify Payment",
      body:
        errorMsg ||
        (ar
          ? "حدث خطأ أثناء الاتصال ببوابة الدفع. حاول مرة أخرى أو راجع طلباتك."
          : "We couldn't reach the payment gateway. Try again or check your orders."),
      Icon: AlertTriangle,
      iconBg: "from-orange-400 to-orange-600",
      shadow: "shadow-[0_20px_50px_-15px_rgba(249,115,22,0.55)]",
      ping: "",
      spin: false,
    },
  }[kind];

  const { Icon } = config;

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteHeader />
      <main className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-4 py-8 text-center">
        <div className="relative">
          {config.ping && (
            <div className={`absolute inset-0 animate-ping rounded-full ${config.ping}`} />
          )}
          <div
            className={`relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${config.iconBg} ${config.shadow}`}
          >
            <Icon className={`h-14 w-14 text-white ${config.spin ? "animate-spin" : ""}`} />
          </div>
        </div>
        <h1 className="mt-8 text-3xl font-bold">{config.title}</h1>
        <p className="mt-3 max-w-md text-muted-foreground">{config.body}</p>

        {orderNumber && (
          <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-border bg-card px-5 py-2.5 shadow-sm">
            <span className="text-sm text-muted-foreground">{ar ? "رقم الطلب" : "Order #"}</span>
            <span className="text-base font-bold text-primary">{orderNumber}</span>
          </div>
        )}

        {kind === "pending" && (
          <p className="mt-4 text-xs text-muted-foreground">
            {ar
              ? `محاولة ${attempts}/${MAX_ATTEMPTS} — يتم التحديث تلقائيًا كل 3 ثوانٍ`
              : `Attempt ${attempts}/${MAX_ATTEMPTS} — auto-refreshing every 3 seconds`}
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {kind === "success" && (
            <>
              <Link
                to={"/account/orders" as any}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-primary-dark"
              >
                <Package className="h-4 w-4" />
                {ar ? "طلباتي" : "My Orders"}
              </Link>
              <Link
                to={"/" as any}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-card px-6 text-sm font-bold hover:bg-muted"
              >
                <Home className="h-4 w-4" />
                {ar ? "الرئيسية" : "Home"}
              </Link>
            </>
          )}

          {kind === "error" && (
            <>
              <button
                onClick={runVerification}
                disabled={verifying}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-primary-dark disabled:opacity-60"
              >
                {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                {ar ? "إعادة المحاولة" : "Retry verification"}
              </button>
              <Link
                to={"/account/orders" as any}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-card px-6 text-sm font-bold hover:bg-muted"
              >
                <Package className="h-4 w-4" />
                {ar ? "طلباتي" : "My Orders"}
              </Link>
            </>
          )}

          {kind === "failed" && (
            <>
              <Link
                to={"/checkout" as any}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-primary-dark"
              >
                <RotateCcw className="h-4 w-4" />
                {ar ? "حاول مرة أخرى" : "Try Again"}
              </Link>
              <Link
                to={"/" as any}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-card px-6 text-sm font-bold hover:bg-muted"
              >
                <Home className="h-4 w-4" />
                {ar ? "الرئيسية" : "Home"}
              </Link>
            </>
          )}

          {kind === "pending" && (
            <Link
              to={"/account/orders" as any}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-card px-6 text-sm font-bold hover:bg-muted"
            >
              <Package className="h-4 w-4" />
              {ar ? "طلباتي" : "My Orders"}
            </Link>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
