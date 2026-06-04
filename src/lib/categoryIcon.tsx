import type { ReactNode } from "react";

export function renderCategoryIcon(icon?: string | null, fallback: ReactNode = "✨") {
  const ic = (icon || "").trim();
  if (!ic) return fallback;

  if (/^https?:\/\//i.test(ic)) {
    return <img src={ic} alt="" className="h-full w-full object-cover" />;
  }

  const isSymbol = [...ic].length <= 2;
  return <span aria-hidden>{isSymbol ? ic : fallback}</span>;
}
