import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/settings")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/admin/settings" || location.pathname === "/admin/settings/") {
      throw redirect({ to: "/admin/settings/profile" });
    }
  },
  component: () => <Outlet />,
});