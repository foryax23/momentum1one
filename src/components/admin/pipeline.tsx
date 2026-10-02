import { useMemo, useRef, useState, type ReactNode } from "react";
import { pipeline, STAGES, type LeadRow } from "@/lib/lead-metrics";
import { cn } from "@/lib/utils";
import { CHART, ChartTable, ChartTip, EmptyChart, fmtInt, fmtPct, Panel, plural } from "./chart-kit";
import { LostIcon, StageRocket } from "./stage-mark";

// The tail of a stage bar (leads that got this far and have since moved on) is CHART.track, the same "rest of the bar" as every
// meter. It is barely off white by design, so it never carries a value alone: every bar's end is labelled and the 2px gap marks where the tail starts.
const GRID = "grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[2.5rem_9.5rem_minmax(0,1fr)] sm:gap-x-4";

type Part = { dataKey: string; name: string; value: number; color: string };
type Row = {
  key: string; label: string; mark: ReactNode;
  /** The figure beside the name and the words after it. */ here: number; hereNote: string;
  /** Bar length as a share of all leads, and the words after the percentage at its tip. */ share: number; tipNote: string;
  parts: Part[]; footer: string; summary: string;
};

/** Leads at New, Contacted, Applied and Enrolled, the share that reached each stage, and Lost apart. Numbers: pipeline. */
export function PipelineBlock({ leads }: { leads: readonly LeadRow[] }) {
  const data = useMemo(() => pipeline(leads), [leads]);
  const { total, stages, lost, other } = data;
  const frame = useRef<HTMLElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ key: string; x: number; y: number } | null>(null);

  const rows = useMemo(() => stages.map((stage, i): Row => {
    const further = stages[i + 1]?.reached ?? 0;
    // for New this is everyone who is no longer New: further along, lost, or on a status the dashboard does not know
    const moved = stage.reached - stage.count;
    const left = i === 0 ? [lost.count ? `${fmtInt(lost.count)} lost` : "", other.count ? `${fmtInt(other.count)} on another status` : ""].filter(Boolean) : [];
    return {
      key: stage.key, label: stage.label, here: stage.count, hereNote: "here now", share: stage.reachedShare, tipNote: `${fmtInt(stage.reached)} reached`,
      mark: <StageRocket status={stage.key} />,
      parts: [{ dataKey: "here", name: "Here now", value: stage.count, color: CHART.stages[stage.key] }, ...(i < stages.length - 1 ? [{ dataKey: "moved", name: "Moved on", value: moved, color: CHART.track }] : [])],
      footer: i === 0
        ? `Every lead starts as New${left.length ? ` · ${fmtInt(further)} moved further, ${left.join(", ")}` : ""}`
        : `${fmtInt(stage.reached)} reached ${stage.label}${i < stages.length - 1 ? " or further" : ""} · ${fmtPct(stage.reachedShare)} of all leads`,
      summary: `${stage.label}: ${plural(stage.count, "lead")} here now. ${fmtInt(stage.reached)} reached this stage${i < stages.length - 1 ? " or further" : ""}, ${fmtPct(stage.reachedShare)} of all leads.`,
    };
  }), [stages, lost, other]);

  const lostRow: Row = {
    key: "lost", label: "Lost", mark: <LostIcon />, here: lost.count, hereNote: "marked lost", share: lost.share, tipNote: "of all leads",
    parts: [{ dataKey: "lost", name: "Marked lost", value: lost.count, color: CHART.lost }],
    footer: `${fmtPct(lost.share)} of all leads · the stage they left from is not recorded`,
    summary: `Lost: ${plural(lost.count, "lead")}, ${fmtPct(lost.share)} of all leads.`,
  };
  const hovered = tip && [...rows, lostRow].find((row) => row.key === tip.key);

  // the card is clamped to the block, so it can never widen the page on a phone
  function show(key: string, clientX: number, clientY: number) {
    const box = frame.current?.getBoundingClientRect();
    if (!box) return;
    const width = card.current?.offsetWidth || 272;
    setTip({ key, x: Math.max(0, Math.min(clientX - box.left + 12, box.width - width)), y: clientY - box.top + 14 });
  }
  const renderRow = (row: Row) => {
    const shown = row.parts.filter((part) => part.value > 0);
    return (
      // focusable so the keyboard gets the same card as the pointer; touch gets it on a tap and loses it on the next (a drag is a scroll, not a hover)
      <div role="group" aria-label={row.summary} tabIndex={0}
        className={cn(GRID, "-mx-2 items-center gap-y-1 rounded-xl px-2 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring")}
        // a hairline (an outline, so the focus ring keeps the box-shadow), not the wash the other lists use: the tail of the bar is as light as the wash and would sink into it
        style={tip?.key === row.key ? { outline: `1px solid ${CHART.axis}`, outlineOffset: -1 } : undefined}
        onPointerMove={(event) => { if (event.pointerType !== "touch") show(row.key, event.clientX, event.clientY); }}
        onPointerLeave={(event) => { if (event.pointerType !== "touch") setTip(null); }}
        onClick={(event) => { if (tip?.key === row.key && (event.nativeEvent as PointerEvent).pointerType === "touch") setTip(null); else show(row.key, event.clientX, event.clientY); }}
        onFocus={(event) => { if (event.currentTarget.matches(":focus-visible")) { const box = event.currentTarget.getBoundingClientRect(); show(row.key, box.right, box.bottom - 18); } }}
        onBlur={() => setTip(null)}
        onKeyDown={(event) => { if (event.key === "Escape") setTip(null); }}>
        <div aria-hidden className="row-span-2 flex justify-center sm:row-span-1">{row.mark}</div>
        <div className="flex min-w-0 items-baseline justify-between gap-3 sm:block">
          <p className="text-sm font-bold text-foreground">{row.label}</p>
          <p className="text-xs text-muted-foreground"><span className="text-2xl font-extrabold leading-none text-primary">{fmtInt(row.here)}</span> {row.hereNote}</p>
        </div>
        <div className="col-start-2 flex min-w-0 flex-col gap-1 [--room:0rem] sm:col-start-3 sm:flex-row sm:items-center sm:gap-2.5 sm:[--room:8.5rem]">
          {/* the left border is the baseline; the box keeps a few pixels for any part that is not zero */}
          <div aria-hidden className="box-content shrink-0 border-l py-1.5" style={{ borderColor: CHART.axis, width: `calc((100% - var(--room)) * ${row.share})`, minWidth: shown.length * 4 }}>
            <div className="flex h-4 gap-0.5 overflow-hidden rounded-r-[4px]">
              {shown.map((part) => <span key={part.dataKey} style={{ flex: `${part.value} 1 0px`, minWidth: 3, backgroundColor: part.color }} />)}
            </div>
          </div>
          <p className="whitespace-nowrap text-xs text-muted-foreground"><span className="text-sm font-bold text-foreground">{fmtPct(row.share)}</span> {row.tipNote}</p>
        </div>
      </div>
    );
  };

  return (
    <Panel eyebrow="Pipeline" title="Where every lead stands"
      hint={`Where leads stand today, not a history.${total > 0 ? " Each bar is every lead that got that far: the darker part is still at the stage, the lighter part has moved on." : ""}`}
      action={total > 0 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5"><span aria-hidden className="flex overflow-hidden rounded-[3px]">{STAGES.map((key) => <span key={key} className="h-2.5 w-1.5" style={{ backgroundColor: CHART.stages[key] }} />)}</span>Here now</li>
          <li className="flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: CHART.track }} />Moved on</li>
        </ul>
      )}>
      {total === 0 ? <EmptyChart title="No leads in the pipeline yet" hint="Each stage fills in as leads arrive and advisors move them along." height={240} /> : (
        <figure ref={frame} aria-label="Pipeline today: leads standing at each stage, and the share of all leads that reached it" className="relative m-0 min-w-0">
          <ol>
            {rows.map((row, i) => {
              const stage = stages[i], before = stages[i - 1];
              return (
                <li key={row.key}>
                  {stage && before && (
                    <div className={cn(GRID, "items-center")}>
                      <span aria-hidden className="mx-auto h-6 w-px" style={{ backgroundColor: CHART.axis }} />
                      <p className="flex items-center gap-1 text-xs text-muted-foreground sm:col-span-2">
                        <svg width={12} height={12} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0"><path d="M6 2v8M2.5 6.5 6 10l3.5-3.5" /></svg>
                        {stage.fromPrevious === null ? `No lead has reached ${before.label} yet` : <span><span className="font-bold text-foreground">{fmtPct(stage.fromPrevious)}</span> went on to {stage.label}</span>}
                      </p>
                    </div>
                  )}
                  {renderRow(row)}
                </li>
              );
            })}
          </ol>
          <div className="mt-2 border-t border-border pt-2">{renderRow(lostRow)}</div>
          {other.count > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              {plural(other.count, "lead")} {other.count === 1 ? "has" : "have"} a status this dashboard does not know ({other.statuses.slice(0, 3).map((entry) => `${entry.status} ${fmtInt(entry.count)}`).join(", ")}{other.statuses.length > 3 && ", …"}). They count in the total, not in any stage.
            </p>
          )}
          <ChartTable caption="Pipeline today: where every lead stands" columns={["Stage", "Leads here now", "Reached this stage or further", "Share of all leads", "Step-through from the stage before"]}
            rows={[
              ...stages.map((stage) => [stage.label, stage.count, stage.reached, fmtPct(stage.reachedShare, 1), stage.fromPrevious === null ? "not applicable" : fmtPct(stage.fromPrevious, 1)]),
              ["Lost", lost.count, "not applicable", fmtPct(lost.share, 1), "not applicable"],
              ...(other.count ? [["Other status", other.count, "not applicable", fmtPct(other.share, 1), "not applicable"]] : []),
            ]} />
          {tip && hovered && (
            <div ref={card} aria-hidden className="pointer-events-none absolute left-0 top-0 z-20 w-max max-w-[min(17rem,100%)]" style={{ transform: `translate(${tip.x}px, ${tip.y}px)` }}>
              <ChartTip active label={hovered.label} payload={hovered.parts} footer={() => hovered.footer} />
            </div>
          )}
        </figure>
      )}
    </Panel>
  );
}
