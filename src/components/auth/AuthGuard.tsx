import { type ReactNode, useEffect } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
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
  const navigate = useNavigate();
  const path = location.pathname || "/";
  const isAuthPath =
    path.startsWith("/login") ||
    path.startsWith("/partner-login") ||
    path.startsWith("/signup") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/reset-password") ||
    path.startsWith("/auth");
  const redirect = isAuthPath ? undefined : path;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({
        to: "/login",
        search: redirect ? ({ redirect } as any) : undefined,
        replace: true,
      });
      return;
    }
    if (requireAdmin && !isAdmin) {
      navigate({ to: "/", replace: true });
    }
  }, [loading, user, requireAdmin, isAdmin, navigate, redirect]);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requireAdmin && !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
