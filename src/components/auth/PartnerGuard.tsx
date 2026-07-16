import { type ReactNode, useEffect, useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { getToken } from "@/lib/api/client";
import { partnerAuth, getStoredPartner } from "@/lib/api/partner";

export function PartnerGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState<"checking" | "ok" | "denied">("checking");

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!getToken()) {
        if (alive) setState("denied");
        return;
      }
      // Optimistic: if we already have a stored partner, allow immediately.
      if (getStoredPartner()) {
        if (alive) setState("ok");
      }
      try {
        await partnerAuth.me();
        if (alive) setState("ok");
      } catch {
        if (alive) setState("denied");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (state !== "denied") return;
    const path = location.pathname;
    const target = path === "/partner-login"
      ? "/partner-login"
      : `/partner-login?redirect=${encodeURIComponent(path)}`;
    if (typeof window !== "undefined" && window.location.pathname + window.location.search !== target) {
      window.location.replace(target);
    } else if (path !== "/partner-login") {
      navigate({ to: "/partner-login", replace: true });
    }
  }, [state, location.pathname, location.search, navigate]);

  if (state === "checking") {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state === "denied") {
    return null;
  }

  return <>{children}</>;
}
