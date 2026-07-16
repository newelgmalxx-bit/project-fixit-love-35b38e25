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
    navigate({
      to: "/partner-login",
      search: path === "/partner-login" ? undefined : ({ redirect: path } as any),
      replace: true,
    });
  }, [state, location.pathname, navigate]);

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
