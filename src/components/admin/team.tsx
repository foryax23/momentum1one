import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { IconArrowRight } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { advisorWorkload, STAGE_LABELS, unassigned, type AdvisorLoad, type AdvisorRow, type LeadRow } from "@/lib/lead-metrics";
import { cn } from "@/lib/utils";
import { CHART, ChartTip, EmptyChart, fmtInt, Panel, plural, RowTip, useRowTip } from "./chart-kit";
import { NONE } from "./lead-model";
import { FIELD, LABEL, LeadsLoading, LoadLimitNotice } from "./parts";
import { StatTile } from "./stat-tile";

/** The open stages, in pipeline order and in the pipeline's own colours. Enrolled and lost are outcomes, so they are figures beside the bar, not part of it. */
const OPEN_STAGES = [{ key: "new", color: CHART.stages.new }, { key: "contacted", color: CHART.stages.contacted }, { key: "applied", color: CHART.stages.applied }] as const;
const AVERAGE = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });
const NO_ADVISORS: readonly AdvisorRow[] = [];

type Part = { dataKey: string; name: string; value: number; color: string };
/** The open leads of one advisor that stand at a pipeline stage: what the bar draws. */
const parts = (load: AdvisorLoad): Part[] => OPEN_STAGES.map(({ key, color }) => ({ dataKey: key, name: STAGE_LABELS[key], value: load.stages[key], color }));
/** Open leads on a status the dashboard does not know. Not a stage, so no grey can sit in the one-hue ramp for it: it is a figure beside Enrolled and Lost. */
const offStage = (load: AdvisorLoad) => load.open - OPEN_STAGES.reduce((sum, { key }) => sum + load.stages[key], 0);

/**
 * The Team tab: who has how much on their desk, the leads still waiting for an advisor, and the invite form.
 * `leadsState` replaces the workload while the leads are loading or either list failed; the invite form works either way.
 */
export function TeamTab({ leads, advisors: team, total, onInvite, onViewLeads, leadsState }: {
  leads: readonly LeadRow[];
  /** Undefined until the advisor list has loaded: "no advisors" is only said once it is known. */ advisors: readonly AdvisorRow[] | undefined;
  /** How many leads exist in all, when the server said. */ total?: number | undefined;
  /** Sends the invitation; rejects with the reason when it cannot. */ onInvite: (input: { name: string; email: string }) => Promise<void>;
  /** Opens the Leads tab on one advisor's leads (their id), or on the unassigned ones (`NONE`). */ onViewLeads?: ((advisor: string) => void) | undefined;
  leadsState?: ReactNode;
}) {
  const advisors = team ?? NO_ADVISORS;
  const blocked = leadsState ?? (team ? undefined : <LeadsLoading tiles={0} label="Loading the team" />);
  const { load, free } = useMemo(() => ({ load: advisorWorkload(leads, advisors), free: unassigned(leads) }), [leads, advisors]);
  const assignedOpen = load.advisors.reduce((sum, advisor) => sum + advisor.open, 0);
  const emails = useMemo(() => new Map(advisors.map((advisor) => [advisor.id, advisor.display_name?.trim() ? advisor.email?.trim() ?? "" : ""])), [advisors]);
  const staged = (advisor: AdvisorLoad) => advisor.open - offStage(advisor);
  const max = Math.max(1, staged(load.pool), ...load.advisors.map(staged));
  const { box, tip, rowProps } = useRowTip();
  const hovered = tip && [...load.advisors, load.pool].find((advisor) => advisor.id === tip.key);

  const row = (advisor: AdvisorLoad, pool = false) => {
    const split = parts(advisor), shown = split.filter((part) => part.value > 0), other = offStage(advisor);
    const body = (
      <>
        <span className="min-w-0">
          <span className={cn("block truncate text-sm font-semibold", pool ? "text-muted-foreground" : "text-foreground")}>{advisor.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{pool ? "Leads waiting to be handed out" : emails.get(advisor.id)}</span>
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-2.5">
            {/* the left border is the baseline; the bar scales inside what is left once the figure has its room */}
            <span aria-hidden className="box-content shrink-0 border-l py-1" style={{ borderColor: CHART.axis, width: `calc((100% - 5.5rem) * ${staged(advisor) / max})`, minWidth: shown.length * 4 }}>
              <span className="flex h-4 gap-0.5 overflow-hidden rounded-r-[4px]">{shown.map((part) => <span key={part.dataKey} style={{ flex: `${part.value} 1 0px`, minWidth: 3, backgroundColor: part.color }} />)}</span>
            </span>
            <span className="whitespace-nowrap text-xs text-muted-foreground"><span className="text-lg font-extrabold leading-none text-primary">{fmtInt(advisor.open)}</span> open</span>
          </span>
          <span className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
            <span className="sr-only">Of those:</span>
            {split.map((part) => <span key={part.dataKey} className="flex items-center gap-1"><span aria-hidden className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: part.color }} />{part.name} <span className="font-bold tabular-nums text-foreground">{fmtInt(part.value)}</span></span>)}
          </span>
        </span>
        {/* the figures on one line, the link under it, so they start at the same place in every row whether or not there is a third figure */}
        <span className="grid gap-1 text-xs text-muted-foreground">
          <span className="flex flex-wrap gap-x-4">
            <span>Enrolled <span className="font-bold tabular-nums text-foreground">{fmtInt(advisor.stages.enrolled)}</span></span>
            <span>Lost <span className="font-bold tabular-nums text-foreground">{fmtInt(advisor.lost)}</span></span>
            {other > 0 && <span>Other status <span className="font-bold tabular-nums text-foreground">{fmtInt(other)}</span></span>}
          </span>
          {onViewLeads && <span className="flex items-center gap-1 font-bold text-primary">View leads <IconArrowRight size={14} /></span>}
        </span>
      </>
    );
    // fixed outer columns: every row is its own grid, and the bars only compare when their column is the same width in each
    const layout = "grid w-full items-center gap-x-5 gap-y-2 rounded-xl px-2 py-3 text-left sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_15.5rem]";
    const lit = tip?.key === advisor.id ? { backgroundColor: CHART.wash } : undefined;
    return onViewLeads
      ? <button type="button" onClick={() => onViewLeads(pool ? NONE : advisor.id)} {...rowProps(advisor.id)} style={lit} className={cn(layout, "cursor-pointer outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring")}>{body}</button>
      : <div tabIndex={0} {...rowProps(advisor.id)} style={lit} className={cn(layout, "outline-none focus-visible:ring-2 focus-visible:ring-ring")}>{body}</div>;
  };

  return (
    <div className="grid gap-4">
      {!leadsState && <LoadLimitNotice loaded={leads.length} total={total}>The workload on this page counts those leads only. Older leads are left out, whoever they are assigned to.</LoadLimitNotice>}
      {!blocked && (
        <section aria-label="Team numbers" className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <StatTile className="col-span-2 md:col-span-1" label="Advisors" value={fmtInt(advisors.length)} footnote={advisors.length ? `${fmtInt(load.advisors.filter((advisor) => advisor.open > 0).length)} with open leads right now` : "Invite the first advisor below"} />
          <StatTile label="Open leads assigned" value={fmtInt(assignedOpen)} footnote={advisors.length ? `About ${AVERAGE.format(assignedOpen / advisors.length)} per advisor` : "Nobody to assign to yet"} />
          <StatTile label="Open, no advisor" value={fmtInt(free.open)} footnote={`${fmtInt(free.fresh)} still New`} />
        </section>
      )}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="grid min-w-0 lg:col-span-8">
          {blocked ?? (
            <Panel eyebrow="Workload" title="Leads on each advisor's desk" hint="Open leads by stage, busiest first. Enrolled and lost leads are finished work, so they are counted beside the bar.">
              {advisors.length === 0 && load.pool.total === 0 ? <EmptyChart title="No advisors yet" hint="Invite an advisor and their leads are counted here." height={220} /> : (
                <figure aria-label="Open leads per advisor, split by stage" className="m-0">
                  <div ref={box} className="relative -mx-2">
                    {advisors.length === 0
                      ? <p className="px-2 pb-3 text-sm text-muted-foreground">No advisors yet. Invite one and their leads are counted here.</p>
                      : <ul aria-label="Advisors, busiest first" className="divide-y divide-border">{load.advisors.map((advisor) => <li key={advisor.id}>{row(advisor)}</li>)}</ul>}
                    <div className="border-t border-border pt-1">{row(load.pool, true)}</div>
                    {tip && hovered && (
                      <RowTip tip={tip}>
                        <ChartTip active label={hovered.name} payload={parts(hovered)} footer={() => <>{fmtInt(hovered.open)} open{offStage(hovered) > 0 && ` (${fmtInt(offStage(hovered))} on another status)`} · {fmtInt(hovered.stages.enrolled)} enrolled · {fmtInt(hovered.lost)} lost<br />{plural(hovered.total, "lead")} in all</>} />
                      </RowTip>
                    )}
                  </div>
                  {load.former > 0 && <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">{plural(load.former, "lead")} {load.former === 1 ? "is" : "are"} still assigned to an account that is no longer an advisor. They are listed as “Former advisor” in the Leads tab; open one to reassign it.</p>}
                </figure>
              )}
            </Panel>
          )}
        </div>
        <div className="grid min-w-0 content-start lg:col-span-4">
          <InvitePanel count={team?.length} onInvite={onInvite} />
        </div>
      </div>
    </div>
  );
}

function InvitePanel({ count, onInvite }: { /** Undefined until the advisor list has loaded. */ count: number | undefined; onInvite: (input: { name: string; email: string }) => Promise<void> }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try { await onInvite({ name, email }); toast.success("Advisor invitation sent"); setName(""); setEmail(""); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not invite advisor"); }
    finally { setBusy(false); }
  }
  return (
    <Panel eyebrow="Team" title="Advisor access" hint="Invite advisors securely, then assign applications from each lead."
      action={count !== undefined && <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold tabular-nums text-primary">{plural(count, "advisor")}</span>}>
      <form onSubmit={submit} className="grid gap-3">
        <label className="grid gap-1.5"><span className={LABEL}>Advisor name</span><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" autoComplete="off" className={cn(FIELD, "h-11")} /></label>
        <label className="grid gap-1.5"><span className={LABEL}>Email</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="advisor@example.com" autoComplete="off" className={cn(FIELD, "h-11")} /></label>
        <Button disabled={busy} className="h-11">{busy ? "Sending" : "Invite advisor"}</Button>
      </form>
    </Panel>
  );
}
