import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { Button } from "@/components/ui/button";
import { openCookieSettings } from "@/components/cookie-consent";

export const Route = createFileRoute("/cookies")({ head: () => ({ meta: [
  { title: "Cookie notice | Momentum One" }, { name: "description", content: "Momentum One cookie choices and storage information." }, { property: "og:title", content: "Cookie notice | Momentum One" }, { property: "og:description", content: "Momentum One cookie choices and storage information." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
] }), component: Cookies });
function Cookies() { return <LegalPage eyebrow="Cookies" title="Cookie notice" intro="You control optional website storage. Essential storage remains available so security and account features can work.">
  <LegalSection title="Essential storage"><p>We use essential browser storage for authentication, security, application progress, and your cookie choice. These features are necessary for services you request.</p></LegalSection>
  <LegalSection title="Optional analytics and marketing"><p>Optional tools may help measure website use or campaigns. They must not load until you accept them. This site currently defaults to essential storage only unless you choose otherwise.</p></LegalSection>
  <LegalSection title="Change your choice"><p>You can reopen the cookie panel at any time. Rejecting optional cookies does not prevent you from applying or signing in.</p><Button onClick={openCookieSettings} className="mt-3">Open cookie settings</Button></LegalSection>
  <LegalSection title="Review"><p>The final list of providers, cookie names, purposes, and lifetimes must be updated whenever an analytics, advertising, embedded media, or chat provider is added.</p></LegalSection>
</LegalPage>; }