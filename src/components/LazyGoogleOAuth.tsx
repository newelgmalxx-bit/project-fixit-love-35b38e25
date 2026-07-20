import { lazy, Suspense, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";

const GoogleOAuthProvider = lazy(() =>
  import("@react-oauth/google").then((m) => ({ default: m.GoogleOAuthProvider })),
);

// Routes that actually use Google OAuth. On any other route we skip mounting
// the provider entirely, so the Google Identity Services script never loads.
const AUTH_PATHS = ["/login", "/signup", "/partner-login"];

export function LazyGoogleOAuth({
  clientId,
  children,
}: {
  clientId: string;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const needsGoogle = AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (!needsGoogle) return <>{children}</>;

  return (
    <Suspense fallback={<>{children}</>}>
      <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>
    </Suspense>
  );
}
