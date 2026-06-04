import { createFileRoute, redirect } from "@tanstack/react-router";

// Products and offers are unified in the API; redirect to the offer page.
export const Route = createFileRoute("/product/$id")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/offers/$offerId", params: { offerId: params.id } });
  },
  component: () => null,
});
