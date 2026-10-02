import * as Dialog from "@radix-ui/react-dialog";
import { useId, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { IconClose, IconDownload, IconTick, Spinner } from "@/components/icons";
import { Sheet, SheetClose, SheetOverlay, SheetPortal, SheetTitle } from "@/components/ui/sheet";
import { shortCourse } from "@/lib/lead-metrics";
import { loadOfferPdf } from "@/lib/load-offer-pdf";
import { cn } from "@/lib/utils";
import { CAMPUS_THUMBS, CHART } from "./chart-kit";
import { advisorName, leadCampus, receivedFull, STATUSES, statusKey, statusLabel, type Advisor, type Lead } from "./lead-model";
import { FIELD, LABEL } from "./parts";
import { LostIcon, StageRocket, StageSteps, StatusPill } from "./stage-mark";

const NOTES_MAX = 2000;
const AWARD = /^(B(?:A|Sc) \(Hons\)) /;
const ROUTE_COLORS: Record<string, string> = CHART.routes;

type DetailProps = {
  /** The open lead, or null when the panel is closed. */ lead: Lead | null;
  /** Undefined until the advisor list has loaded. */ advisors: readonly Advisor[] | undefined;
  onClose: () => void;
  /** Saves a change to the lead (status, notes). */ onSave: (patch: Partial<Lead>) => void;
  /** Assigns or clears the advisor; rejects with the reason when it cannot. */ onAssign: (advisorId: string | null) => Promise<void>;
  /** The WhatsApp thread and admissions pack of the lead; they need the server, so the caller supplies them. */ thread?: ((lead: Lead) => ReactNode) | undefined;
};

/**
 * One lead, in a panel that slides in from the right (from the bottom on a phone). A modal dialog: focus stays inside,
 * Escape and the backdrop close it, and focus goes back to the row it was opened from.
 */
export function LeadDetail({ lead, advisors, onClose, onSave, onAssign, thread }: DetailProps) {
  // the last lead stays on screen while the panel slides out
  const [shown, setShown] = useState(lead);
  if (lead && lead !== shown) setShown(lead);
  const [draft, setDraft] = useState<{ id: string; notes: string } | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  // Radix hands focus back to a Dialog.Trigger, and this panel has none (rows, cards and the WhatsApp queue all open it), so the opener is remembered here
  const opener = useRef<Element | null>(null);
  const saved = shown?.notes ?? "";
  const notes = draft && draft.id === shown?.id ? draft.notes : saved;
  const dirty = notes !== saved;

  function close() {
    if (dirty && !window.confirm("Close without saving your notes?")) return;
    setDraft(null);
    onClose();
  }

  return (
    <Sheet open={lead !== null} onOpenChange={(open) => { if (!open) close(); }}>
      <SheetPortal>
        <SheetOverlay className="bg-ink/45 duration-200" />
        <Dialog.Content ref={panel} aria-describedby={undefined} onOpenAutoFocus={(event) => { event.preventDefault(); opener.current = document.activeElement; panel.current?.focus(); }}
          onCloseAutoFocus={(event) => { event.preventDefault(); if (opener.current instanceof HTMLElement && opener.current.isConnected) opener.current.focus(); }}
          className="fixed inset-x-0 bottom-0 z-50 flex h-[92dvh] flex-col rounded-t-3xl border-t border-border bg-card shadow-2xl outline-none duration-250 ease-drawer data-[state=closed]:duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out motion-reduce:data-[state=closed]:fade-out-0 motion-reduce:data-[state=open]:fade-in-0 max-sm:data-[state=closed]:slide-out-to-bottom max-sm:data-[state=open]:slide-in-from-bottom sm:inset-y-0 sm:left-auto sm:right-0 sm:h-auto sm:w-[34rem] sm:max-w-[calc(100vw-3rem)] sm:rounded-none sm:rounded-l-3xl sm:border-l sm:border-t-0 sm:data-[state=closed]:slide-out-to-right sm:data-[state=open]:slide-in-from-right">
          {shown && <Body lead={shown} advisors={advisors} notes={notes} dirty={dirty} onNotes={(value) => setDraft({ id: shown.id, notes: value })} onSave={onSave} onAssign={onAssign} thread={thread} />}
        </Dialog.Content>
      </SheetPortal>
    </Sheet>
  );
}

function Body({ lead, advisors, notes, dirty, onNotes, onSave, onAssign, thread }: Omit<DetailProps, "lead" | "onClose"> & { lead: Lead; notes: string; dirty: boolean; onNotes: (value: string) => void }) {
  const [downloading, setDownloading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const status = statusKey(lead.status);
  const known = (STATUSES as readonly string[]).includes(status);
  const campus = leadCampus(lead);
  const thumb = CAMPUS_THUMBS[campus];
  const course = lead.selected_course ?? lead.interest;
  const award = lead.selected_course ? AWARD.exec(lead.selected_course)?.[1] : undefined;
  const route = lead.study_route;
  const advisorId = useId(), notesId = useId();
  // an advisor id with no name behind it: the account is no longer an advisor, or the advisor list has not loaded
  const unnamed = lead.advisor_user_id && !advisors?.some((advisor) => advisor.id === lead.advisor_user_id);

  async function downloadOffer() {
    if (!lead.selected_course || !lead.study_route) return;
    setDownloading(true);
    try {
      const { downloadOffer: createOffer } = await loadOfferPdf();
      await createOffer({ ...lead, offer_url: "" });
    } catch (error) {
      console.error(error);
      toast.error("Could not create the PDF. Please try again.");
    } finally { setDownloading(false); }
  }

  async function assign(value: string) {
    const next = value || null;
    setAssigning(true);
    try { await onAssign(next); toast.success(next ? "Advisor assigned" : "Application unassigned"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not assign advisor"); }
    finally { setAssigning(false); }
  }

  return (
    <>
      <header className="flex shrink-0 items-start gap-3 border-b border-border px-5 pb-4 pt-5 sm:px-6">
        {status === "lost" ? <LostIcon size={40} /> : <StageRocket status={lead.status} sizeClassName="h-14" />}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[.14em] text-teal">Lead <span aria-hidden className="mx-1 inline-block h-1 w-1 rounded-full bg-gold align-middle" /> {lead.ref_code}</p>
          <SheetTitle className="mt-1 break-words text-xl font-bold italic leading-snug text-primary sm:text-2xl">{lead.full_name}</SheetTitle>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground"><StatusPill status={lead.status} /><span>Received {receivedFull(lead.created_at)}</span></div>
        </div>
        <SheetClose aria-label="Close" className="-mr-2 -mt-1 grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full text-muted-foreground outline-none transition-colors duration-150 hover-fine:hover:bg-secondary hover-fine:hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"><IconClose size={20} /></SheetClose>
      </header>

      <div className="grid flex-1 content-start gap-6 overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:px-6">
        <Section label="Stage">
          <div role="group" aria-label="Stage" className="flex flex-wrap gap-2">
            {STATUSES.map((option) => {
              const current = status === option;
              return (
                <button key={option} type="button" aria-pressed={current} onClick={() => { if (!current) onSave({ status: option }); }}
                  className={cn("flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-semibold outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring", current ? "border-primary bg-secondary text-primary" : "border-border text-foreground hover-fine:hover:border-primary")}>
                  {current ? <IconTick size={14} /> : <StageSteps status={option} />}{statusLabel(option)}
                </button>
              );
            })}
          </div>
          {!known && <p className="mt-2 text-xs text-muted-foreground">This lead is marked “{statusLabel(lead.status)}”, which is not one of the five stages. Pick a stage to move it.</p>}
        </Section>

        <div>
          <label htmlFor={advisorId} className={cn(LABEL, "block")}>Assigned advisor</label>
          <select id={advisorId} value={lead.advisor_user_id ?? ""} onChange={(event) => assign(event.target.value)} disabled={assigning} className={cn(FIELD, "mt-2 h-11")}>
            <option value="">Unassigned</option>
            {unnamed && <option value={lead.advisor_user_id ?? ""}>{advisors ? "Former advisor" : "Assigned (advisor list not loaded)"}</option>}
            {advisors?.map((advisor) => <option key={advisor.id} value={advisor.id}>{advisorName(advisor)}</option>)}
          </select>
        </div>

        <Section label="Application">
          <div className="grid gap-2">
            <div className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3">
              {thumb ? <img src={thumb} alt="" width={48} height={48} loading="lazy" decoding="async" className="h-12 w-12 shrink-0 rounded-lg object-cover" /> : <span aria-hidden className="h-12 w-12 shrink-0 rounded-lg border border-dashed border-border bg-card" />}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{campus ? `${campus} campus` : "No campus chosen yet"}</p>
                <p className="text-xs text-muted-foreground">{[lead.nearest_campus && lead.nearest_campus !== campus ? lead.nearest_campus : "", lead.distance_miles == null || lead.distance_miles < 1 ? `Lives in ${lead.city}` : `About ${lead.distance_miles} ${lead.distance_miles === 1 ? "mile" : "miles"} from ${lead.city}`].filter(Boolean).join(" · ")}</p>
              </div>
            </div>
            <div className="rounded-xl bg-secondary/50 p-3">
              <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-sm font-semibold text-foreground">
                {course ? shortCourse(course) : "Course to discuss"}
                {award && <span className="whitespace-nowrap rounded border border-border bg-card px-1 text-[10px] font-semibold leading-4 text-muted-foreground">{award}</span>}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">{route && <span aria-hidden className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: ROUTE_COLORS[route] ?? CHART.context }} />}{route ?? "Entry route not chosen"}</span>
                {lead.intake && <span>Intake: {lead.intake}</span>}
              </p>
            </div>
          </div>
          {lead.selected_course && lead.study_route ? (
            <button type="button" onClick={downloadOffer} disabled={downloading} className="mt-3 flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary px-4 text-sm font-bold text-primary outline-none transition-colors duration-150 hover-fine:hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60">
              {downloading ? <Spinner size={18} /> : <IconDownload size={18} />}{downloading ? "Preparing offer" : "Download personalised offer"}
            </button>
          ) : <p className="mt-3 text-xs text-muted-foreground">The offer PDF is ready to download once a course and an entry route are chosen.</p>}
        </Section>

        <Section label="Contact and origin">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Row k="Email" wide v={<a href={`mailto:${lead.email}`} className="font-semibold text-primary underline-offset-2 hover-fine:hover:underline">{lead.email}</a>} />
            <Row k="Phone" v={<a href={`tel:${lead.phone}`} className="font-semibold text-primary underline-offset-2 hover-fine:hover:underline">{lead.phone}</a>} />
            <Row k="WhatsApp" v={lead.whatsapp ? "Yes, opted in" : "No"} />
            <Row k="City" v={lead.city} />
            <Row k="Offer email" v={lead.offer_email_status.replaceAll("_", " ")} />
            <Row k="Source" v={lead.source ?? "Direct"} />
            <Row k="Campaign" v={lead.campaign ?? "–"} />
            {lead.page && <Row k="Arrived on page" v={lead.page} />}
            {lead.interest && lead.selected_course && <Row k="Interest" v={lead.interest} />}
          </dl>
        </Section>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor={notesId} className={LABEL}>Notes</label>
            <span className="text-xs tabular-nums text-muted-foreground">{notes.length} / {NOTES_MAX}</span>
          </div>
          <textarea id={notesId} value={notes} onChange={(event) => onNotes(event.target.value)} maxLength={NOTES_MAX} rows={4} placeholder="What was said, what happens next…" className={cn(FIELD, "mt-2 h-auto py-2.5 leading-relaxed")} />
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground" aria-live="polite">{dirty ? "Not saved yet" : ""}</p>
            <button type="button" onClick={() => onSave({ notes })} disabled={!dirty} className="min-h-10 cursor-pointer rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground outline-none transition-colors duration-150 hover-fine:hover:bg-teal focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">Save notes</button>
          </div>
        </div>

        {thread && <div className="[&>div]:mt-0">{thread(lead)}</div>}
      </div>
    </>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();
  return <section aria-labelledby={id}><h3 id={id} className={cn(LABEL, "mb-2 font-sans")}>{label}</h3>{children}</section>;
}

function Row({ k, v, wide }: { k: string; v: ReactNode; wide?: boolean }) {
  return <div className={cn("min-w-0", wide && "col-span-2")}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="break-words font-medium text-foreground">{v}</dd></div>;
}
