import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { byCampaign, bySource, type Bucket, type LeadRow } from "@/lib/lead-metrics";
import { cn } from "@/lib/utils";
import { CHART, ChartTip, EmptyChart, fmtInt, fmtPct, Panel, plural } from "./chart-kit";

const TOP_SOURCES = 6;
const TOP_CAMPAIGNS = 5;
/** Under this many leads a conversion percentage swings too much to compare, so the table says "2 of 7" instead. */
const MIN_SAMPLE = 10;
const colHead = "text-[11px] font-semibold uppercase tracking-[.1em] text-muted-foreground";
const note = "rounded-xl bg-secondary/40 px-4 py-3";

type Sort = "leads" | "rate";
/** Where the tooltip hangs, in pixels from the bar list's own corner. `slide` (0 at the left edge, 1 at the right) shifts it under the pointer by that share of its own width, so it never leaves the card sideways. */
type Tip = { key: string; x: number; y: number; above: boolean; slide: number };

const rate = (bucket: Bucket) => (bucket.count > 0 ? bucket.appliedPlus / bucket.count : 0);
const rated = (bucket: Bucket) => bucket.count >= MIN_SAMPLE;
/** "14 reached Applied (23%)", or the bare count when the bucket is too small for a percentage. */
const reached = (bucket: Bucket) => `${fmtInt(bucket.appliedPlus)} reached Applied${rated(bucket) ? ` (${fmtPct(rate(bucket))})` : ""}`;
const sourceName = (bucket: Bucket) => (bucket.kind === "other" ? `Other: ${fmtInt(bucket.folded)} smaller sources` : bucket.label);

/**
 * Sources and campaigns: which links bring leads (one bar list, one hue; the two catch-all rows are grey) and which
 * campaigns turn into applications (a table, because the count and the rate matter equally and a rate needs its sample
 * beside it). The bars are plain HTML rather than recharts: recharts has no keyboard reach in a horizontal bar chart,
 * and a long source tag has to end in an ellipsis instead of running into its bar. The names sit left of the bars
 * (they are short), where the demand card puts a course title on a line of its own; the bars are 12px in both.
 */
export function SourcesBlock({ leads }: { leads: readonly LeadRow[] }) {
  const [showAll, setShowAll] = useState(false);
  const [sort, setSort] = useState<Sort>("leads");
  const [tip, setTip] = useState<Tip | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const tableId = useId();
  const { sources, top, every } = useMemo(() => ({ sources: bySource(leads, TOP_SOURCES), top: byCampaign(leads, TOP_CAMPAIGNS), every: byCampaign(leads, leads.length) }), [leads]);
  const campaigns = useMemo(() => {
    const list = showAll ? every : top;
    if (sort === "leads") return list;
    // best rate first; campaigns too small for a percentage keep their order below those, and the catch-all rows stay last
    const named = list.filter((bucket) => bucket.kind === "value");
    return [...named.filter(rated).sort((a, b) => rate(b) - rate(a) || b.count - a.count), ...named.filter((bucket) => !rated(bucket)), ...list.filter((bucket) => bucket.kind !== "value")];
  }, [showAll, sort, top, every]);

  if (leads.length === 0) {
    return (
      <Panel eyebrow="Sources and campaigns" title="Where leads come from">
        <EmptyChart title="No leads yet" hint="Sources and campaigns are read from the link each lead arrives through." height={320} />
      </Panel>
    );
  }

  const named = every.filter((bucket) => bucket.kind === "value").length;
  const canExpand = top.some((bucket) => bucket.kind === "other");
  const anySmall = campaigns.some((bucket) => !rated(bucket));
  const only = sources.length === 1 ? sources[0] : undefined;
  const max = Math.max(1, ...sources.map((bucket) => bucket.count));
  const shown = tip && sources.find((bucket) => bucket.key === tip.key);
  const hide = () => setTip(null);
  const show = (key: string, x: number, above: number, below: number) => {
    const rect = box.current?.getBoundingClientRect();
    if (!rect) return;
    const flip = below + 120 > window.innerHeight;
    setTip({ key, x: x - rect.left, y: (flip ? above : below) - rect.top, above: flip, slide: Math.min(1, Math.max(0, (x - rect.left) / Math.max(1, rect.width))) });
  };

  return (
    <Panel eyebrow="Sources and campaigns" title="Where leads come from" hint="Which links and campaigns bring leads, and how many of those leads stand at Applied or Enrolled now." bodyClassName="flex flex-col">
      {only ? (
        // one source is one number, not a one-bar chart
        <div className={note}>
          <p className="text-sm font-semibold text-foreground">{only.kind === "none" ? "No source recorded yet" : only.label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {only.kind === "none"
              ? `${leads.length === 1 ? "The only lead" : `All ${fmtInt(leads.length)} leads`} came in without a source tag. Add ?src= or utm_source= to a link and its leads are counted here.`
              : `The only source so far: ${plural(only.count, "lead")}, ${reached(only)}.`}
          </p>
        </div>
      ) : (
        <figure aria-label="Leads by source" className="m-0 min-w-0">
          {/* no figures heading on the right: each bar carries its count and share at its own tip, so there is no column for one to sit over */}
          <figcaption aria-hidden className={cn(colHead, "border-b border-border pb-2")}>Source</figcaption>
          <div ref={box} className="relative">
            {/* one grid for the whole list, so every bar starts on the same line whatever the longest name is */}
            <ul aria-label="Leads by source, most leads first" className="-mx-2 mt-1 grid grid-cols-[fit-content(7.5rem)_minmax(0,1fr)] gap-x-3 sm:grid-cols-[fit-content(9rem)_minmax(0,1fr)]">
              {sources.map((bucket, i) => (
                // one tab stop for the list, arrow keys between rows; the tooltip opens on focus as it does on hover
                <li key={bucket.key} tabIndex={i === 0 ? 0 : -1} onKeyDown={rowKeys}
                  onPointerMove={(event) => { if (event.pointerType !== "touch") show(bucket.key, event.clientX, event.clientY - 4, event.clientY + 4); }}
                  onPointerLeave={(event) => { if (event.pointerType !== "touch") hide(); }}
                  onFocus={(event) => { const rect = event.currentTarget.getBoundingClientRect(); show(bucket.key, rect.left + 8, rect.top, rect.bottom); }} onBlur={hide}
                  className="col-span-full grid grid-cols-subgrid items-center rounded-lg px-2 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring" style={tip?.key === bucket.key ? { backgroundColor: CHART.wash } : undefined}>
                  <p className={cn("truncate text-[13px] leading-5", bucket.kind === "value" ? "font-semibold text-foreground" : "font-medium text-muted-foreground")}>{bucket.label}</p>
                  <div className="flex min-w-0 items-center gap-2">
                    {/* the bar scales inside what is left once the figures have their room, so the longest bar's label never wraps */}
                    <div aria-hidden className="h-3 min-w-0.5 shrink-0 rounded-r-[4px]" style={{ width: `calc((100% - 4.5rem) * ${bucket.count / max})`, backgroundColor: bucket.kind === "value" ? CHART.series : CHART.context }} />
                    <p className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                      <span className="text-sm font-bold text-foreground">{fmtInt(bucket.count)}</span><span className="sr-only"> {bucket.count === 1 ? "lead" : "leads"},</span>
                      <span className="ml-1.5">{fmtPct(bucket.share)}</span><span className="sr-only"> of all leads{bucket.kind === "other" ? `, ${fmtInt(bucket.folded)} smaller sources together` : ""}. {reached(bucket)}.</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            {tip && shown && (
              <div aria-hidden className="pointer-events-none absolute z-20 w-max max-w-[17rem]" style={{ left: tip.x, top: tip.y, transform: `translate(${-tip.slide * 100}%, ${tip.above ? "calc(-100% - 12px)" : "12px"})` }}>
                <ChartTip active label={sourceName(shown)} payload={[{ dataKey: "count", name: "Leads", value: shown.count, color: shown.kind === "value" ? CHART.series : CHART.context }]}
                  footer={() => <>{fmtPct(shown.share, 1)} of all leads<br />{reached(shown)}</>} />
              </div>
            )}
          </div>
        </figure>
      )}

      <div className="mt-6 flex flex-1 flex-col">
        {named === 0 ? (
          <div className={note}>
            <p className="text-sm font-semibold text-foreground">No campaign recorded yet</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Add utm_campaign= to an ad link and its leads are counted here, with how many go on to apply.</p>
          </div>
        ) : (
          <>
            <table id={tableId} className="w-full text-left text-sm">
              <caption className="sr-only">Campaigns, with their leads and how many stand at Applied or Enrolled now{showAll ? "" : `. The ${TOP_CAMPAIGNS} with the most leads are listed one by one`}</caption>
              <thead className={colHead}>
                <tr>
                  <th scope="col" className="w-full pb-2 font-semibold">Campaign</th>
                  <th scope="col" aria-sort={sort === "leads" ? "descending" : undefined} className="pb-2 pl-3 text-right font-semibold"><SortButton label="Leads" active={sort === "leads"} onClick={() => setSort("leads")} /></th>
                  <th scope="col" className="pb-2 pl-3 text-right font-semibold">Applied<span className="sr-only"> or Enrolled</span></th>
                  <th scope="col" aria-sort={sort === "rate" ? "descending" : undefined} className="pb-2 pl-3 text-right font-semibold"><SortButton label="Rate" active={sort === "rate"} onClick={() => setSort("rate")} /></th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((bucket) => {
                  const catchAll = bucket.kind !== "value";
                  return (
                    <tr key={bucket.key} className="border-t border-border">
                      <th scope="row" className={cn("py-2 pr-1 align-middle [overflow-wrap:anywhere]", catchAll ? "font-medium text-muted-foreground" : "font-semibold text-foreground")}>
                        {bucket.label}{bucket.kind === "other" && <span className="font-normal"> · {plural(bucket.folded, "campaign")}</span>}
                      </th>
                      <td className="py-2 pl-3 text-right align-middle font-bold tabular-nums text-foreground">{fmtInt(bucket.count)}</td>
                      <td className="py-2 pl-3 text-right align-middle tabular-nums text-muted-foreground">{fmtInt(bucket.appliedPlus)}</td>
                      <td className="whitespace-nowrap py-2 pl-3 text-right align-middle tabular-nums">
                        {rated(bucket) ? (
                          <span className="inline-flex items-center justify-end gap-1.5">
                            <span aria-hidden className="h-1.5 w-9 overflow-hidden rounded-full sm:w-14" style={{ backgroundColor: catchAll ? CHART.grid : CHART.track }}>
                              <span className="block h-full rounded-full" style={{ width: `${rate(bucket) * 100}%`, backgroundColor: catchAll ? CHART.context : CHART.series }} />
                            </span>
                            <span className="min-w-[2.25rem] font-bold text-foreground">{fmtPct(rate(bucket))}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">{fmtInt(bucket.appliedPlus)} of {fmtInt(bucket.count)}<span className="sr-only">: too few leads for a percentage</span></span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mt-auto pt-1">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
                <p className="min-w-0 flex-1 basis-40">{anySmall ? `Under ${MIN_SAMPLE} leads the rate stays a count: too few to compare.` : `${plural(named, "campaign")} in all.`}</p>
                {canExpand && (
                  <button type="button" aria-expanded={showAll} aria-controls={tableId} onClick={() => setShowAll((open) => !open)}
                    className="cursor-pointer rounded font-bold text-primary outline-none hover-fine:hover:underline focus-visible:ring-2 focus-visible:ring-ring">
                    {showAll ? `Show top ${TOP_CAMPAIGNS}` : `Show all ${fmtInt(named)} campaigns`}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Panel>
  );
}

/** A column heading that sorts the campaign table (always biggest first). The arrow marks the column in charge; it hangs in the gap to the left, so the heading stays flush right over its numbers. */
function SortButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} title={active ? undefined : `Sort by ${label.toLowerCase()}`}
      className={cn("relative -my-2 cursor-pointer rounded py-2 font-semibold uppercase outline-none transition-colors duration-150 hover-fine:hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring", active && "text-foreground")}>
      {active && <svg width={8} height={8} viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="absolute right-full top-1/2 -mt-1 mr-0.5"><path d="M4 1v6M1.5 4.5 4 7l2.5-2.5" /></svg>}
      {label}
    </button>
  );
}

/** Arrow keys walk the source rows; Home and End jump to the ends. */
function rowKeys(event: KeyboardEvent<HTMLLIElement>) {
  const row = event.currentTarget;
  const to = event.key === "ArrowDown" ? row.nextElementSibling : event.key === "ArrowUp" ? row.previousElementSibling : event.key === "Home" ? row.parentElement?.firstElementChild : event.key === "End" ? row.parentElement?.lastElementChild : null;
  if (!(to instanceof HTMLElement)) return;
  event.preventDefault();
  to.focus();
}
