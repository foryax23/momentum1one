import { useMemo, useRef, useState, type FocusEvent, type KeyboardEvent, type PointerEvent } from "react";
import { byCampus, byCourse, byRoute, type Bucket, type LeadRow } from "@/lib/lead-metrics";
import { cn } from "@/lib/utils";
import { CAMPUS_THUMBS, CHART, ChartTip, EmptyChart, fmtInt, fmtPct, Panel, plural } from "./chart-kit";

type View = "campus" | "course";
const VIEWS: { key: View; label: string }[] = [{ key: "campus", label: "By campus" }, { key: "course", label: "By course" }];
const AWARD = /^(B(?:A|Sc) \(Hons\)) /;
const ROUTE_COLORS: Record<string, string> = CHART.routes;
const colHead = "text-[11px] font-semibold uppercase tracking-[.1em] text-muted-foreground";

/** Where the tooltip hangs, in pixels from the block's own corner (so a transformed ancestor cannot throw it off). */
type Tip = { id: string; x: number; y: number; above: boolean; /** 0 at the block's left edge, 1 at its right: the tip slides under the pointer by that share of its own width, so it never leaves the block sideways. */ slide: number };

/**
 * Campus and course demand: leads per campus and per course as two bar lists (one hue: the bars are one series, the names
 * are on the rows), and Foundation Year against Year 1 as one split bar (the only place the two route colours appear).
 * The lists are plain HTML rather than recharts: a course title and its award tag need a line of their own above the bar,
 * and every figure stays real text. Rows are a roving-focus list, so the tooltip opens from the keyboard too.
 */
export function DemandBlock({ leads }: { leads: readonly LeadRow[] }) {
  const { campuses, courses, routes } = useMemo(() => ({ campuses: byCampus(leads), courses: byCourse(leads), routes: byRoute(leads) }), [leads]);
  const [view, setView] = useState<View>("campus");
  const box = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);
  const hide = () => setTip(null);
  const show = (id: string, x: number, top: number, bottom: number) => {
    const rect = box.current?.getBoundingClientRect();
    if (!rect) return;
    const above = bottom + 140 > window.innerHeight;
    setTip({ id, x: x - rect.left, y: (above ? top : bottom) - rect.top, above, slide: Math.min(1, Math.max(0, (x - rect.left) / Math.max(1, rect.width))) });
  };
  /** Mouse and pen: the tip follows the pointer. Keyboard focus and a tap: it hangs off the row itself. */
  const hover = (id: string) => ({
    onPointerMove: (event: PointerEvent<HTMLElement>) => { if (event.pointerType !== "touch") show(id, event.clientX, event.clientY - 4, event.clientY + 4); },
    onPointerLeave: (event: PointerEvent<HTMLElement>) => { if (event.pointerType !== "touch") hide(); },
  });
  const focus = (id: string) => ({
    onFocus: (event: FocusEvent<HTMLElement>) => { const rect = event.currentTarget.getBoundingClientRect(); show(id, rect.left + 8, rect.top, rect.bottom - 10); },
    onBlur: hide,
  });

  if (leads.length === 0) {
    return (
      <Panel eyebrow="Campus and course demand" title="What applicants are asking for">
        <EmptyChart title="No leads yet" hint="Demand by campus, course and entry route appears with the first lead." height={320} />
      </Panel>
    );
  }

  const lists: { key: View; noun: string; head: string; buckets: Bucket[] }[] = [
    { key: "campus", noun: "campus", head: "Campus", buckets: campuses },
    { key: "course", noun: "course", head: "Course", buckets: courses },
  ];
  const shown = tip && [...campuses.map((bucket) => ({ bucket, id: `campus:${bucket.key}`, noun: "campus" })), ...courses.map((bucket) => ({ bucket, id: `course:${bucket.key}`, noun: "course" })), ...routes.map((bucket) => ({ bucket, id: `route:${bucket.key}`, noun: "route" }))].find((entry) => entry.id === tip.id);

  return (
    <Panel eyebrow="Campus and course demand" title="What applicants are asking for" hint="Where leads want to study, the course they chose and the entry route they picked." bodyClassName="flex flex-col"
      action={
        <div role="group" aria-label="Show demand" className="flex rounded-full bg-secondary p-0.5 sm:hidden">
          {VIEWS.map(({ key, label }) => (
            <button key={key} type="button" aria-pressed={view === key} onClick={() => setView(key)} className={cn("min-h-9 cursor-pointer rounded-full px-3.5 text-xs font-bold outline-none focus-visible:ring-2 focus-visible:ring-ring", view === key ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}>{label}</button>
          ))}
        </div>
      }>
      <div ref={box} className="@container relative flex flex-1 flex-col">
        {/* side by side only when the card itself is wide enough for the longest course title, its award tag and the figures on one line (the card is 7 of 12 columns from lg up, so the viewport says little) */}
        <div className="-mx-2 grid gap-x-4 gap-y-6 @[38rem]:grid-cols-[minmax(0,4fr)_minmax(0,7fr)]">
          {lists.map(({ key, noun, head, buckets }) => {
            const max = Math.max(1, ...buckets.map((bucket) => bucket.count));
            return (
              <figure key={key} aria-label={`Leads per ${noun}`} className={cn("m-0 min-w-0", view !== key && "max-sm:hidden")}>
                <figcaption aria-hidden className={cn(colHead, "mx-2 flex justify-between gap-3 border-b border-border pb-2")}><span>{head}</span><span>Leads · share</span></figcaption>
                <ul aria-label={`Leads per ${noun}, most leads first`} className="mt-1">
                  {buckets.map((bucket, i) => {
                    const id = `${key}:${bucket.key}`;
                    const award = bucket.kind === "value" && key === "course" ? AWARD.exec(bucket.key)?.[1] : undefined;
                    return (
                      // one tab stop per list, arrow keys between rows: the same reach as recharts' accessibilityLayer
                      <li key={bucket.key} tabIndex={i === 0 ? 0 : -1} onKeyDown={rowKeys} {...hover(id)} {...focus(id)}
                        className="flex items-center gap-3 rounded-lg px-2 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring" style={tip?.id === id ? { backgroundColor: CHART.wash } : undefined}>
                        {key === "campus" && <Thumb src={bucket.kind === "value" ? CAMPUS_THUMBS[bucket.label] : undefined} />}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-3">
                            {/* a flex row, so a tag that does not fit drops to its own line flush with the title instead of trailing it */}
                            <p className={cn("flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-[13px] font-semibold leading-snug", bucket.kind === "value" ? "text-foreground" : "text-muted-foreground")}>
                              <span className="min-w-0 break-words">{bucket.kind === "none" ? "Not chosen" : bucket.label}</span>
                              {award && <span className="whitespace-nowrap rounded border border-border px-1 text-[10px] font-semibold leading-4 text-muted-foreground">{award}</span>}
                              {bucket.kind === "other" && <span className="whitespace-nowrap font-normal text-muted-foreground">{plural(bucket.folded, "course")}</span>}
                            </p>
                            <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                              <span className={cn("text-sm font-bold", bucket.count > 0 && "text-foreground")}>{fmtInt(bucket.count)}</span><span className="sr-only"> {bucket.count === 1 ? "lead" : "leads"},</span>
                              <span className="inline-block w-10 text-right">{fmtPct(bucket.share)}</span><span className="sr-only"> of all leads. {detail(bucket).map((line) => `${line}. `)}</span>
                            </p>
                          </div>
                          <div aria-hidden className="mt-1.5 h-3">
                            {bucket.count > 0 && <div className="h-full rounded-r-[4px]" style={{ width: `max(4px, ${(bucket.count / max) * 100}%)`, backgroundColor: bucket.kind === "value" ? CHART.series : CHART.context }} />}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </figure>
            );
          })}
        </div>

        {/* pinned to the foot of the card, so it lines up with the neighbouring card's footer when that one is taller */}
        <figure aria-label="Leads by entry route" className="m-0 mt-auto pt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-border pt-4">
            <figcaption className={colHead}>Entry route</figcaption>
            <ul className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-xs text-muted-foreground">
              {routes.map((bucket) => (
                <li key={bucket.key} className="flex items-baseline gap-1.5">
                  <span aria-hidden className="h-2.5 w-2.5 shrink-0 self-center rounded-[3px]" style={{ backgroundColor: ROUTE_COLORS[bucket.key] ?? CHART.context }} />
                  {bucket.kind === "none" ? "Not chosen" : bucket.label}
                  <span className="text-base font-bold leading-none text-foreground">{fmtInt(bucket.count)}</span><span className="sr-only"> {bucket.count === 1 ? "lead" : "leads"},</span>
                  <span className="tabular-nums">{fmtPct(bucket.share)}</span><span className="sr-only"> of all leads</span>
                </li>
              ))}
            </ul>
          </div>
          {/* the 2px gap in the surface colour is what separates the segments; every figure is in the legend above, so the bar itself is decoration to a screen reader */}
          <div aria-hidden className="mt-3 flex h-4 gap-0.5">
            {routes.filter((bucket) => bucket.count > 0).map((bucket, i, parts) => {
              const id = `route:${bucket.key}`;
              return <div key={bucket.key} {...hover(id)} className={cn("min-w-1 basis-0 transition-opacity duration-150", i === parts.length - 1 && "rounded-r-[4px]", tip?.id.startsWith("route:") && tip.id !== id && "opacity-45")} style={{ flexGrow: bucket.count, backgroundColor: ROUTE_COLORS[bucket.key] ?? CHART.context }} />;
            })}
          </div>
        </figure>

        {tip && shown && (
          <div aria-hidden className="pointer-events-none absolute z-20 w-max max-w-[17rem]" style={{ left: tip.x, top: tip.y, transform: `translate(${-tip.slide * 100}%, ${tip.above ? "calc(-100% - 12px)" : "12px"})` }}>
            <ChartTip active label={tipTitle(shown.bucket, shown.noun)} payload={[{ dataKey: "count", name: "Leads", value: shown.bucket.count, color: shown.noun === "route" ? ROUTE_COLORS[shown.bucket.key] ?? CHART.context : shown.bucket.kind === "value" ? CHART.series : CHART.context }]}
              footer={() => <>{fmtPct(shown.bucket.share, 1)} of all leads{shown.noun !== "route" && detail(shown.bucket).map((line) => <span key={line} className="block">{line}</span>)}</>} />
          </div>
        )}
      </div>
    </Panel>
  );
}

/** Arrow keys walk the rows of one list; Home and End jump to its ends. */
function rowKeys(event: KeyboardEvent<HTMLLIElement>) {
  const row = event.currentTarget;
  const to = event.key === "ArrowDown" ? row.nextElementSibling : event.key === "ArrowUp" ? row.previousElementSibling : event.key === "Home" ? row.parentElement?.firstElementChild : event.key === "End" ? row.parentElement?.lastElementChild : null;
  if (!(to instanceof HTMLElement)) return;
  event.preventDefault();
  to.focus();
}

/** The part of a row the bar cannot show: its split by entry route and how many have applied. Said in the tooltip, and to screen readers on the row itself. */
function detail(bucket: Bucket): string[] {
  if (bucket.count === 0) return [];
  return [...(bucket.foundation + bucket.year1 > 0 ? [`Foundation Year ${fmtInt(bucket.foundation)} · Year 1 ${fmtInt(bucket.year1)}`] : []), `${fmtInt(bucket.appliedPlus)} applied or enrolled`];
}

function tipTitle(bucket: Bucket, noun: string): string {
  if (noun === "route") return bucket.label;
  if (bucket.kind === "none") return noun === "campus" ? "No campus chosen yet" : "No course chosen yet";
  if (bucket.kind === "other") return `Other courses (${fmtInt(bucket.folded)})`;
  return noun === "campus" ? `${bucket.label} campus` : bucket.key;
}

/** Campus thumbnail, or an empty slot of the same size so the bars of every row start on one line. */
function Thumb({ src }: { src: string | undefined }) {
  return src
    ? <img src={src} alt="" width={36} height={36} loading="lazy" decoding="async" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
    : <span aria-hidden className="h-9 w-9 shrink-0 rounded-lg border border-dashed border-border bg-secondary/40" />;
}
