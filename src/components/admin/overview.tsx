import { useMemo, useState } from "react";
import { IconArrowRight, IconClock, IconTick } from "@/components/icons";
import { LEADS_LOAD_LIMIT, needsAttention, pipeline, shortCourse, unassigned, weekOverWeek, whatsappWelcome, type AdvisorRow, type AttentionItem, type LeadRow } from "@/lib/lead-metrics";
import { campusName } from "@/lib/offer-catalog";
import { fmtInt, fmtPct, fmtWaiting, Panel, plural } from "./chart-kit";
import { DemandBlock } from "./demand";
import { LeadsTrendBlock } from "./leads-trend";
import { LoadLimitNotice } from "./parts";
import { PipelineBlock } from "./pipeline";
import { SourcesBlock } from "./sources";
import { StatTile } from "./stat-tile";

const ATTENTION_ROWS = 6;

/** The Overview tab: the leads that need someone first, then the headline numbers and the four chart blocks. */
export function Overview({ leads, advisors, total, now, onOpenLead, onViewLeads, onViewUnassigned }: {
  leads: readonly LeadRow[];
  /** Undefined until the advisor list has loaded. */ advisors: readonly AdvisorRow[] | undefined;
  /** How many leads exist in all, when the server said; the charts only ever see the loaded ones. */ total?: number | undefined;
  /** When the leads were loaded (epoch ms). "Today", the 7-day windows and the waiting times are counted from it, so a refresh moves them even when no lead changed. Defaults to when the tab was opened. */ now?: number | undefined;
  /** Opens a lead's detail from the "needs attention" list. Without it the rows are plain text. */ onOpenLead?: ((id: string) => void) | undefined;
  /** "See all in Leads": opens the Leads tab on the new leads with no advisor. */ onViewLeads?: (() => void) | undefined;
  /** Makes the first tile a button: opens the Leads tab on the open leads with no advisor. */ onViewUnassigned?: (() => void) | undefined;
}) {
  const [opened] = useState(() => Date.now());
  const clock = now || opened;
  const stats = useMemo(() => ({ week: weekOverWeek(leads, clock), applied: pipeline(leads).stages[2], free: unassigned(leads), welcome: whatsappWelcome(leads), attention: needsAttention(leads, ATTENTION_ROWS, clock) }), [leads, clock]);
  const { week, applied, free, welcome, attention } = stats;
  const capped = leads.length >= LEADS_LOAD_LIMIT;
  const span = "col-span-1 md:col-span-2 xl:col-span-1";
  const wide = "col-span-1 md:col-span-3 xl:col-span-1";
  // the 7 days before are only drawn and compared when they were loaded whole; a week cut by the load limit is a floor, not a count
  const spark = week.loaded === "both" ? [...week.days.map((day) => day.previous), ...week.days.map((day) => day.current)] : week.loaded === "current" ? week.days.map((day) => day.current) : undefined;

  return (
    <div className="grid gap-4">
      <LoadLimitNotice loaded={leads.length} total={total}>Every number and chart on this page counts those {fmtInt(LEADS_LOAD_LIMIT)} only. Older leads are left out, including any that are still waiting for an advisor.</LoadLimitNotice>
      <section aria-label="Headline numbers" className="grid grid-cols-2 gap-3 md:grid-cols-6 xl:grid-cols-5">
        <StatTile className="col-span-2 xl:col-span-1" label="Open, no advisor" value={fmtInt(free.open)}
          footnote={[capped ? `Among the latest ${fmtInt(LEADS_LOAD_LIMIT)}` : "", `${fmtInt(free.fresh)} still New`, advisors ? `${plural(advisors.length, "advisor")} on the team` : ""].filter(Boolean).join(" · ")}
          action={onViewUnassigned && free.open > 0 ? { label: "See them in Leads", onClick: onViewUnassigned } : undefined} />
        <StatTile className={span} label="Last 7 full days" value={`${fmtInt(week.current)}${week.loaded === "neither" ? "+" : ""}`}
          delta={leads.length && week.loaded === "both" ? { value: week.delta, share: week.deltaShare, against: "the 7 days before", upIsGood: true } : undefined}
          spark={spark} sparkAccentFrom={week.loaded === "both" ? 7 : 0} sparkLabel={week.loaded === "both" ? "Leads per day over the last 14 full days" : "Leads per day over the last 7 full days"}
          footnote={week.loaded === "both" ? undefined : "The 7 days before are not fully loaded, so there is no comparison"} />
        <StatTile className={span} label="Reached Applied" value={fmtPct(applied?.reachedShare ?? 0)} meter={applied?.reachedShare ?? 0}
          footnote={`Applied or Enrolled: ${fmtInt(applied?.reached ?? 0)} of ${fmtInt(leads.length)}`} />
        <StatTile className={wide} label="Welcomes sent" value={fmtInt(welcome.sent)} meter={welcome.sentShare}
          footnote={`of ${fmtInt(welcome.optedIn)} WhatsApp opt-ins${welcome.failed ? ` · ${fmtInt(welcome.failed)} failed` : ""}${welcome.awaiting_template ? ` · ${fmtInt(welcome.awaiting_template)} waiting for Meta` : ""}`} />
        <StatTile className={wide} label="Total leads" value={fmtInt(Math.max(total ?? 0, leads.length))} footnote={week.today ? `${fmtInt(week.today)} arrived today` : "None yet today"} />
      </section>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="grid min-w-0 lg:col-span-8"><LeadsTrendBlock leads={leads} now={clock} /></div>
        {/* on a phone the list of people waiting comes before the charts */}
        <div className="grid min-w-0 max-lg:order-first lg:col-span-4"><NeedsAttention total={attention.total} items={attention.items} hasLeads={leads.length > 0} capped={capped} onOpenLead={onOpenLead} onViewLeads={onViewLeads} /></div>
        <div className="grid min-w-0 lg:col-span-12"><PipelineBlock leads={leads} /></div>
        <div className="grid min-w-0 lg:col-span-7"><DemandBlock leads={leads} /></div>
        <div className="grid min-w-0 lg:col-span-5"><SourcesBlock leads={leads} /></div>
      </div>
    </div>
  );
}

function NeedsAttention({ total, items, hasLeads, capped, onOpenLead, onViewLeads }: { total: number; items: AttentionItem[]; hasLeads: boolean; /** The load limit was hit: the leads waiting longest may be among the ones not loaded. */ capped: boolean; onOpenLead?: ((id: string) => void) | undefined; onViewLeads?: (() => void) | undefined }) {
  return (
    <Panel eyebrow="Needs attention" title="New and not picked up" bodyClassName="flex flex-col"
      hint={capped ? `Still New with no advisor, among the latest ${fmtInt(LEADS_LOAD_LIMIT)} leads only. Anyone waiting longer than these is not in the list.` : total ? "Leads still New with no advisor, longest wait first." : undefined}
      action={total > 0 && <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold tabular-nums text-primary">{fmtInt(total)}<span className="sr-only"> waiting</span></span>}>
      {total === 0 ? (
        <div className="grid flex-1 place-items-center rounded-xl bg-secondary/40 px-6 py-8 text-center">
          <div>
            <IconTick size={28} className="mx-auto text-teal" />
            <p className="mt-2 text-sm font-semibold text-foreground">{hasLeads ? "Nobody is waiting" : "No leads yet"}</p>
            <p className="mt-1 text-xs text-muted-foreground">{hasLeads ? "Every new lead has an advisor." : "New leads with no advisor will be listed here."}</p>
          </div>
        </div>
      ) : (
        <ul className="-mx-2 -mt-2 divide-y divide-border">
          {items.map(({ lead, waitingHours }) => {
            const row = (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">{lead.full_name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{lead.selected_course ? shortCourse(lead.selected_course) : "Course not chosen"} · {lead.nearest_campus ? campusName(lead.nearest_campus) : "No campus yet"}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-muted-foreground"><IconClock size={14} /><span className="sr-only">Waiting </span>{fmtWaiting(waitingHours)}</span>
              </>
            );
            const layout = "flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left";
            return (
              <li key={lead.id}>
                {onOpenLead
                  ? <button type="button" onClick={() => onOpenLead(lead.id)} className={`${layout} cursor-pointer outline-none transition-colors duration-150 hover-fine:hover:bg-secondary/70 focus-visible:bg-secondary/70 focus-visible:ring-2 focus-visible:ring-ring`}>{row}</button>
                  : <div className={layout}>{row}</div>}
              </li>
            );
          })}
        </ul>
      )}
      {total > 0 && (
        <p className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
          {total > items.length ? `Showing ${fmtInt(items.length)} of ${fmtInt(total)}` : plural(total, "lead")}
          {onViewLeads && <button type="button" onClick={onViewLeads} className="flex cursor-pointer items-center gap-1 rounded font-bold text-primary outline-none hover-fine:hover:underline focus-visible:ring-2 focus-visible:ring-ring">See all in Leads <IconArrowRight size={14} /></button>}
        </p>
      )}
    </Panel>
  );
}
