import { useEffect } from "react";
import { BASE } from "@/lib/api/client";

type TrackingSettings = { pixels?: string; head?: string; body?: string };

const MARK = "data-saba-tracking";

function injectRawHTML(html: string, target: HTMLElement, slot: string) {
  if (!html) return;
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  Array.from(tpl.content.childNodes).forEach((node) => {
    if (node.nodeType === 1) {
      const el = node as HTMLElement;
      if (el.tagName === "SCRIPT") {
        const s = document.createElement("script");
        for (const a of Array.from(el.attributes)) s.setAttribute(a.name, a.value);
        s.text = el.textContent || "";
        s.setAttribute(MARK, slot);
        target.appendChild(s);
      } else {
        el.setAttribute(MARK, slot);
        target.appendChild(el);
      }
    } else if (node.nodeType === 3 && node.textContent?.trim()) {
      target.appendChild(node.cloneNode(true));
    }
  });
}

let injected = false;

export function useInjectTracking() {
  useEffect(() => {
    if (injected || typeof window === "undefined") return;
    injected = true;
    (async () => {
      try {
        const res = await fetch(`${BASE}/tracking`, { headers: { Accept: "application/json" } });
        if (!res.ok) return;
        const json = await res.json();
        const s: TrackingSettings = (json?.data ?? json) || {};
        if (s.pixels) injectRawHTML(s.pixels, document.head, "pixels");
        if (s.head) injectRawHTML(s.head, document.head, "head");
        if (s.body) injectRawHTML(s.body, document.body, "body");
      } catch {
        /* tracking endpoint unavailable — silently skip */
      }
    })();
  }, []);
}
