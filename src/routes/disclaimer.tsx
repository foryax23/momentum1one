import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal-page";
export const Route = createFileRoute("/disclaimer")({ head: () => ({ meta: [
  { title: "Application disclaimer | Momentum One" }, { name: "description", content: "Important information about Momentum One course guidance and personalised offers." }, { property: "og:title", content: "Application disclaimer | Momentum One" }, { property: "og:description", content: "Important information about Momentum One course guidance and personalised offers." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
] }), component: Disclaimer });
function Disclaimer() { return <LegalPage eyebrow="Important information" title="Application disclaimer" intro="Momentum One helps students understand options and prepare applications. Final decisions remain with the relevant organisations.">
  <LegalSection title="Personalised offers"><p>A personalised Momentum One offer is an information pack based on details you provide. It is not a university admission offer, confirmation of enrolment, or guarantee of a place.</p></LegalSection>
  <LegalSection title="Course information"><p>Course availability, campus, awarding institution, intake, timetable, entry route, fees, and assessment requirements are subject to confirmation and may change.</p></LegalSection>
  <LegalSection title="Funding and immigration"><p>Funding, residency, and immigration eligibility depend on individual circumstances and the decisions of relevant authorities. Momentum One does not guarantee funding, visas, or immigration outcomes.</p></LegalSection>
  <LegalSection title="Applications and decisions"><p>Education providers make admission and enrolment decisions. Momentum One can support preparation and communication but cannot guarantee acceptance, assessment results, or academic outcomes.</p></LegalSection>
</LegalPage>; }