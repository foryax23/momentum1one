import { createFileRoute, redirect } from "@tanstack/react-router";
import { getAccountHome } from "@/lib/accounts.functions";

export const Route = createFileRoute("/_authenticated/account")({
  beforeLoad: async () => { const account = await getAccountHome(); throw redirect({ to: account.destination }); },
  head: () => ({ meta: [
    { title: "My account | Momentum One" }, { name: "description", content: "Open your Momentum One account." },
    { property: "og:title", content: "My account | Momentum One" }, { property: "og:description", content: "Open your Momentum One account." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }), component: () => null,
});