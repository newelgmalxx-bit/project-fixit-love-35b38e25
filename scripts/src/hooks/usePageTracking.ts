import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { BASE } from "@/lib/api";

const SESSION_KEY = "pv_sid";

export function usePageTracking() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.searchStr });
  const sidRef = useRef<string>("");

  // initialize session id from sessionStorage on mount (browser only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    sidRef.current = sessionStorage.getItem(SESSION_KEY) || "";
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const track = async () => {
      try {
        const fullPath = path + (search ? (search.startsWith("?") ? search : `?${search}`) : "");
        const body: Record<string, string> = { path: fullPath };
        if (sidRef.current) body.session_id = sidRef.current;

        const res = await fetch(`${BASE}/track`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(body),
          keepalive: true,
        });
        if (!res.ok) return;
        const json = await res.json().catch(() => null);
        const newSid: string | undefined = json?.data?.session_id ?? json?.session_id;
        if (newSid && newSid !== sidRef.current) {
          sidRef.current = newSid;
          sessionStorage.setItem(SESSION_KEY, newSid);
        }
      } catch {
        /* silent fail — tracking must never break the site */
      }
    };

    track();
  }, [path, search]);
}
