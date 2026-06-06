import { type ReactNode } from "react";
import { Navigate, useLocation } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  children: ReactNode;
  /** When true, also require admin role. */
  requireAdmin?: boolean;
};

export function AuthGuard({ children, requireAdmin = false }: Props) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    const path = location.pathname || "/";
    // Avoid redirect loops: don't store auth pages as the redirect target,
    // and don't double-encode (the router serializes search params for us).
    const isAuthPath =
      path.startsWith("/login") ||
      path.startsWith("/partner-login") ||
      path.startsWith("/signup") ||
      path.startsWith("/forgot-password") ||
      path.startsWith("/reset-password") ||
      path.startsWith("/auth");
    const redirect = isAuthPath ? undefined : path;
    return <Navigate to="/login" search={{ redirect } as any} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
