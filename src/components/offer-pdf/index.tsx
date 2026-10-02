import { Document, pdf } from "@react-pdf/renderer";
import type { LeadResult } from "@/lib/funnel";
import type { Locale } from "@/lib/i18n";
import { campusName } from "@/lib/offer-catalog";
import { buildOfferData, type OfferData } from "./data";
import { loadFonts } from "./theme";
import { CoverPage } from "./cover";
import { CoursesPage } from "./courses";
import { ApplyPage } from "./apply";
import { ChecklistPage } from "./checklist";
import { PffDayPage } from "./pff-day";

// The client's five-page A4 offer, personalised for one lead. English only.
export function OfferDocument({ data }: { data: OfferData }) {
  return <Document title={`Momentum One Offer ${data.student.ref}`} author="Momentum One" language="en">
    <CoverPage data={data} /><CoursesPage data={data} /><ApplyPage data={data} /><ChecklistPage data={data} /><PffDayPage data={data} />
  </Document>;
}

/** origin serves /offer/*.png and /signature.png; host is what the contact card prints as the web address. */
export async function createOfferBlob(lead: LeadResult, env: { origin: string; host: string }) {
  const data = buildOfferData(lead, env);
  await loadFonts(Array.isArray(data.nameFont));
  return pdf(<OfferDocument data={data} />).toBlob();
}

// The callers still pass their locale; the offer is English only, so it is ignored.
export async function downloadOffer(lead: LeadResult, _locale?: Locale) {
  const blob = await createOfferBlob(lead, { origin: window.location.origin, host: window.location.host });
  const url = URL.createObjectURL(blob), a = document.createElement("a");
  const campus = campusName(lead.nearest_campus).replace(/\s+/g, "-");
  const course = (lead.selected_course ?? "Course").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  a.href = url; a.download = `Momentum-One-${lead.ref_code}-${campus}-${course}.pdf`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000);
}
