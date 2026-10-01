import { createFileRoute } from "@tanstack/react-router";
import { loadOfferPdf } from "@/lib/load-offer-pdf";
import { useState } from "react";
import { getOffer } from "@/lib/leads.functions";
import { Button } from "@/components/ui/button";
import { IconDownload, IconSeal, Spinner } from "@/components/icons";
import logo from "@/assets/logo.png";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/offer/$token")({
  loader: ({ params }) => getOffer({ data: { token: params.token } }),
  head: () => ({ meta: [
    { title: "Your personalised offer | Momentum One" },
    { name: "description", content: "Download your private Momentum One course offer." },
    { property: "og:title", content: "Your personalised offer | Momentum One" },
    { property: "og:description", content: "Download your private Momentum One course offer." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex, nofollow" },
  ] }),
  errorComponent: () => <main className="grid min-h-screen place-items-center bg-background px-5 text-center"><div><IconSeal size={54} className="mx-auto text-primary" /><h1 className="mt-5 text-2xl font-bold">This offer link is unavailable</h1><p className="mt-2 text-sm text-muted-foreground">It may be invalid or expired. Contact Momentum One for a fresh link.</p><a href="/" className="mt-6 inline-block font-semibold text-primary underline underline-offset-4">Return home</a></div></main>,
  component: OfferPage,
});

function OfferPage() {
  const { locale, t } = useI18n();
  const lead = Route.useLoaderData();
  const [busy, setBusy] = useState<"offer" | "certificate" | null>(null);
  async function download(kind: "offer" | "certificate") { setBusy(kind); try { const docs = await loadOfferPdf(); if (kind === "offer") await docs.downloadOffer(lead, locale); else await docs.downloadCertificate(lead, locale); } finally { setBusy(null); } }
  return <main className="min-h-screen bg-background px-5 py-10"><div className="mx-auto max-w-xl text-center">
    <div className="flex items-center justify-between"><img src={logo} alt="Momentum One" className="h-20 w-auto" /><LanguageSwitcher compact /></div>
    <div className="mt-8 border border-border bg-card p-6 shadow-paper sm:p-9"><IconSeal size={50} className="mx-auto text-gold" /><p className="mt-5 text-xs font-bold uppercase tracking-widest text-primary">Your private document centre</p><h1 className="mt-2 text-3xl font-bold">{lead.full_name}</h1><p className="mt-3 text-muted-foreground">{lead.selected_course}<br />{lead.study_route} · {lead.nearest_campus}</p><div className="mt-7 grid gap-3"><Button onClick={() => download("offer")} disabled={busy !== null} className="h-14 w-full rounded-xl text-base font-bold">{busy === "offer" ? <Spinner /> : <IconDownload size={20} />}{busy === "offer" ? t("funnel.preparing", undefined, "Preparing your offer") : t("funnel.download", undefined, "Download five-page offer")}</Button><Button variant="outline" onClick={() => download("certificate")} disabled={busy !== null} className="h-14 w-full rounded-xl text-base font-bold">{busy === "certificate" ? <Spinner /> : <IconSeal size={20} />}{busy === "certificate" ? "Preparing your certificate" : "Download pathway certificate"}</Button></div><p className="mt-5 text-xs leading-relaxed text-muted-foreground">The pathway certificate records your selected study route. It is not a university admission offer or academic qualification.</p><p className="mt-4 text-xs text-muted-foreground">{t("funnel.reference", undefined, "Reference")} {lead.ref_code}</p></div>
  </div></main>;
}