import { Document, pdf } from "@react-pdf/renderer";
import type { LeadResult } from "@/lib/funnel";
import type { Locale } from "@/lib/i18n";
import { campusName } from "@/lib/offer-catalog";
import { buildOfferData, tidyName } from "./data";
import { hasGlyph, loadFallbackFonts, loadFonts } from "./theme";
import { CoverPage } from "./cover";
import { CoursesPage } from "./courses";
import { ApplyPage } from "./apply";
import { ChecklistPage } from "./checklist";
import { PffDayPage } from "./pff-day";

// The client's five-page A4 offer, personalised for one lead. English only.
// Browser-only: reach it through loadOfferPdf() (src/lib/load-offer-pdf.ts), never with a static import, so the PDF renderer stays out of the server bundle.

/** origin serves /offer/*.png and /signature.png; host is what the contact card prints as the web address. */
export async function createOfferBlob(lead: LeadResult, env: { origin: string; host: string }) {
  // The fonts come first: what can be printed of the student's name is read from the font files themselves.
  await loadFonts();
  if ([...tidyName(lead.full_name)].some((char) => !hasGlyph("Poppins", char))) await loadFallbackFonts();
  const data = buildOfferData(lead, env, hasGlyph);
  return pdf(<Document title={`Momentum One Offer ${data.student.ref}`} author="Momentum One" language="en">
    <CoverPage data={data} /><CoursesPage data={data} /><ApplyPage data={data} /><ChecklistPage data={data} /><PffDayPage data={data} />
  </Document>).toBlob();
}

// The callers still pass their locale; the offer is English only, so it is ignored.
export async function downloadOffer(lead: LeadResult, _locale?: Locale) {
  const blob = await createOfferBlob(lead, { origin: window.location.origin, host: window.location.host });
  const url = URL.createObjectURL(blob), a = document.createElement("a");
  const campus = campusName(lead.nearest_campus).replace(/\s+/g, "-");
  const course = (lead.selected_course ?? "Course").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  a.href = url; a.download = `Momentum-One-${lead.ref_code}-${campus}-${course}.pdf`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000);
}
