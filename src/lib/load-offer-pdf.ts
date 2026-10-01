// The PDF renderer only works in the browser. Gating on import.meta.env.SSR lets the
// server build drop the import entirely, so it never initialises on the server.
export async function loadOfferPdf() {
  if (import.meta.env.SSR) throw new Error("PDF generation is browser-only");
  return import("@/components/offer-pdf");
}
