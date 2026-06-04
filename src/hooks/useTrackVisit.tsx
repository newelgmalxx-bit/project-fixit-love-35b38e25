import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { BASE, getSid } from "@/lib/api";

function classifySource(referrer: string): string {
  if (!referrer) return "direct";
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host.includes("google")) return "google";
    if (host.includes("bing") || host.includes("yahoo") || host.includes("duckduckgo")) return "search";
    if (host.match(/(facebook|instagram|twitter|x\.com|tiktok|linkedin|youtube|snapchat|t\.co)/)) return "social";
    if (typeof window !== "undefined" && host === window.location.hostname) return "internal";
    return "referral";
  } catch {
    return "direct";
  }
}

export function useTrackVisit() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (path.startsWith("/admin")) return;
    const referrer = document.referrer || "";
    const body = JSON.stringify({
      path,
      referrer: referrer || null,
      source: classifySource(referrer),
      sessionId: getSid(),
      userAgent: navigator.userAgent,
    });
    fetch(`${BASE}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-Id": getSid() },
      body,
      keepalive: true,
    }).catch((e) => console.warn("[track] failed", e?.message));
  }, [path]);
}
