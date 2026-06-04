import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth/AuthGuard";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Panel | koswmat" }] }),
  component: () => (
    <AuthGuard requireAdmin>
      <Outlet />
    </AuthGuard>
  ),
});
