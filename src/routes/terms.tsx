import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal-page";
export const Route = createFileRoute("/terms")({ head: () => ({ meta: [
  { title: "Website terms | Momentum One" }, { name: "description", content: "Terms for using the Momentum One website and student account services." }, { property: "og:title", content: "Website terms | Momentum One" }, { property: "og:description", content: "Terms for using the Momentum One website and student account services." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
] }), component: Terms });
function Terms() { return <LegalPage eyebrow="Terms" title="Website terms" intro="These terms describe the permitted use of Momentum One’s website, guidance, offers, and account areas.">
  <LegalSection title="Our service"><p>Momentum One provides educational recruitment, course information, application guidance, document support, interview preparation, and enrolment support. Website information is general guidance and may change.</p></LegalSection>
  <LegalSection title="Your responsibilities"><p>Provide accurate information, keep account details secure, use only documents you are entitled to share, and do not misuse the website or another person’s information.</p></LegalSection>
  <LegalSection title="Availability and intellectual property"><p>We may update or suspend features for maintenance, security, or service changes. Momentum One branding, original copy, interface, and materials may not be copied or reused without permission.</p></LegalSection>
  <LegalSection title="Links and third parties"><p>External education providers and communications services operate under their own terms. A link or course reference does not transfer responsibility for their decisions or services to Momentum One.</p></LegalSection>
  <LegalSection title="Liability"><p>Nothing excludes liability that cannot legally be excluded. Any final limitation wording should be reviewed by a qualified UK solicitor against Momentum One’s actual services and contracts.</p></LegalSection>
  <LegalSection title="Governing law"><p>These terms are intended to be governed by the laws of England and Wales. Final contractual wording and consumer rights implications require professional review before publication.</p></LegalSection>
</LegalPage>; }