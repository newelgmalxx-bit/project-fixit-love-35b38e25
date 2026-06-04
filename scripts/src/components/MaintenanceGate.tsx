import { useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/i18n/LanguageProvider";
import { MaintenanceScreen } from "./MaintenanceScreen";
import { type ReactNode } from "react";

/** Gates the entire app behind maintenance mode flag from site settings.
 *  Admins and admin routes (and login) bypass the gate. */
export function MaintenanceGate({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  const { lang } = useLang();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const maintenance = false;

  const bypass =
    isAdmin ||
    path.startsWith("/admin") ||
    path.startsWith("/login") ||
    path.startsWith("/signup") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/reset-password");

  if (maintenance && !bypass) {
    return <MaintenanceScreen lang={lang} />;
  }
  return <>{children}</>;
}