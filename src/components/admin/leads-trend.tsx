import { useMemo, useState, type ComponentProps, type ReactNode } from "react";
import { Area, AreaChart, CartesianGrid, Customized, ReferenceDot, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { useIsMobile } from "@/hooks/use-mobile";
import { dailyCounts, LEADS_LOAD_LIMIT, loadedFrom, londonDay, oldestDay, weekOverWeek, type LeadRow } from "@/lib/lead-metrics";
import { cn } from "@/lib/utils";
import { AREA_OPACITY, CHART, ChartTable, ChartTip, CURSOR, EmptyChart, fmtDay, fmtDayLong, fmtInt, fmtWeekday, gridProps, lineProps, Panel, tooltipProps, xAxisProps, yAxisProps } from "./chart-kit";

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];
const NAMES = { current: "Last 7 full days", previous: "7 days before" };
const AVERAGE = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });
const LABEL = "text-[11px] font-semibold uppercase leading-tight tracking-[.1em] text-muted-foreground";

/** One plotted day. `previous` is null when that earlier day was not loaded (see `loadedFrom`), which is not the same as no leads. */
type Point = { day: string; current: number; previous?: number | null; previousDay?: string };

/** Whole-number axis: 0 to a round top in at most five steps, never shorter than 0 to 4 so one lead does not draw a mountain. */
function countTicks(max: number): number[] {
  const rough = Math.max(max, 4) / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((factor) => factor * magnitude).find((candidate) => candidate >= rough) ?? 10 * magnitude;
  return Array.from({ length: Math.ceil(Math.max(max, 4) / step) + 1 }, (_, i) => i * step);
}

function trend(leads: readonly LeadRow[], range: Range, now: number) {
  const today = londonDay(now), week = weekOverWeek(leads, now);
  const firstDay = oldestDay(leads) || today;
  // At the load limit the days up to `cut` are unknown, not zero, so they are left off the chart.
  const cut = loadedFrom(leads);
  const known = (day: string) => day > cut || day === today;
  // The 7-day view is the two full weeks of weekOverWeek, so today is not in it; 30 and 90 days run up to today.
  const span: Point[] = range === 7
    ? week.days.map((entry) => ({ day: entry.day, current: entry.current, previous: known(entry.previousDay) ? entry.previous : null, previousDay: entry.previousDay }))
    : dailyCounts(leads, range, now).map((entry) => ({ day: entry.day, current: entry.count }));
  const points = span.filter((point) => known(point.day));
  const sum = (days: readonly Point[]) => days.reduce((total, point) => total + point.current, 0);
  // The average covers full days from the first lead on: today is still filling up, and the days before any lead arrived are not slow days.
  const full = points.filter((point) => point.day !== today && point.day >= firstDay);
  const busiest = points.reduce<Point | null>((best, point) => (point.current > 0 && point.current >= (best?.current ?? 0) ? point : best), null);
  const every = range === 7 ? 1 : range === 30 ? 7 : 14; // a label a week (a fortnight at 90 days), counted back from the last day
  return {
    today, week, points, busiest, last: points[points.length - 1],
    total: sum(points), average: full.length ? sum(full) / full.length : null, averageFrom: full.length < points.filter((point) => point.day !== today).length ? full[0]?.day ?? "" : "",
    yTicks: countTicks(Math.max(0, ...points.flatMap((point) => [point.current, point.previous ?? 0]))),
    xTicks: points.filter((_, i) => (points.length - 1 - i) % every === 0).map((point) => point.day),
    /** First day drawn when the load limit cuts into this range, else "". */
    cutFrom: points.length < span.length ? points[0]?.day ?? today : "",
  };
}

/**
 * Leads per day for the last 30 or 90 days up to today, or the last 7 full days set against the 7 before. Numbers: dailyCounts and weekOverWeek.
 * `now` is when the leads were loaded; the days are counted from it, so a refresh moves "today" even when no lead changed.
 */
export function LeadsTrendBlock({ leads, now }: { leads: readonly LeadRow[]; now?: number | undefined }) {
  const [range, setRange] = useState<Range>(30);
  const [opened] = useState(() => Date.now());
  const clock = now || opened;
  const view = useMemo(() => trend(leads, range, clock), [leads, range, clock]);
  const { today, week, points, last, busiest } = view;
  const compare = range === 7;
  // On a phone the end labels' margin would take a third of the plot, so the keyed figures above the chart carry the names alone.
  const phone = useIsMobile(), endLabels = compare && !phone;
  const label = compare ? "Leads per day, the last 7 full days against the 7 days before" : `Leads per day over the last ${range} days`;

  if (leads.length === 0) {
    return (
      <Panel eyebrow="Leads over time" title="New leads, day by day" bodyClassName="flex flex-col">
        <EmptyChart title="No leads yet" hint="The first lead starts the chart." height={300} className="flex-1" />
      </Panel>
    );
  }

  return (
    <Panel eyebrow="Leads over time" title="New leads, day by day" bodyClassName="flex flex-col"
      hint={view.cutFrom ? `Only the latest ${fmtInt(LEADS_LOAD_LIMIT)} leads are loaded, so this chart starts on ${fmtDay(view.cutFrom)}.` : undefined}
      action={
        <div role="group" aria-label="Days shown" className="flex rounded-full border border-border bg-secondary/60 p-0.5">
          {RANGES.map((days) => (
            <button key={days} type="button" aria-pressed={range === days} onClick={() => setRange(days)}
              className={cn("h-9 cursor-pointer rounded-full px-3 text-xs font-bold outline-none transition-colors duration-150 ease-out-strong focus-visible:ring-2 focus-visible:ring-ring sm:h-8", range === days ? "bg-primary text-primary-foreground" : "text-muted-foreground hover-fine:hover:text-primary")}>
              {days} days
            </button>
          ))}
        </div>
      }>
      {/* only the 7-day view has two series: its two totals are the legend, each keyed by a stroke of its line. The verdict on the pair is the "Last 7 full days" tile's. */}
      {compare && (
        <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <dl className="flex gap-x-7">
            <WeekTotal label={NAMES.current} color={CHART.series} value={`${fmtInt(week.current)}${week.loaded === "neither" ? "+" : ""}`} strong />
            {week.loaded === "both" && <WeekTotal label={NAMES.previous} color={CHART.context} value={fmtInt(week.previous)} />}
          </dl>
          {week.loaded !== "both" && <p className="max-w-[34ch] text-xs leading-snug text-muted-foreground">The 7 days before are not fully loaded, so there is nothing to compare with.</p>}
        </div>
      )}

      {/* chart-kit's ChartFrame has a fixed height; this one takes whatever the card has left, so the block ends level with its neighbour.
          A press must not focus the chart: recharts' keyboard layer would snap the tooltip to the first day (Tab and the arrow keys still reach it). */}
      <figure aria-label={label} onMouseDown={(event) => event.preventDefault()} className="relative m-0 min-h-[220px] min-w-0 flex-1">
        <ChartContainer config={{}} className="absolute inset-0 aspect-auto">
          <AreaChart accessibilityLayer data={points} margin={{ top: 10, right: endLabels ? 122 : 22, bottom: 0, left: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis {...xAxisProps} dataKey="day" ticks={view.xTicks} minTickGap={compare ? 2 : 16} tickFormatter={(day: string) => (day === today ? "Today" : compare ? fmtWeekday(day) : fmtDay(day))} />
            <YAxis {...yAxisProps} ticks={view.yTicks} domain={[0, view.yTicks[view.yTicks.length - 1] ?? 4]} />
            <Tooltip {...tooltipProps} cursor={CURSOR.line} content={<TrendTip today={today} compare={compare} />} />
            {compare && <Area {...lineProps} dataKey="previous" stroke={CHART.context} strokeWidth={1.5} fill="none" />}
            <Area {...lineProps} dataKey="current" stroke={CHART.series} fill={CHART.series} fillOpacity={AREA_OPACITY} />
            {!compare && <ReferenceDot x={today} y={week.today} isFront {...TODAY_DOT} />}
            {endLabels && last && <Customized component={<EndLabels day={last.day} ends={[{ label: NAMES.current, value: last.current, color: CHART.series }, { label: NAMES.previous, value: last.previous ?? null, color: CHART.context }]} />} />}
          </AreaChart>
        </ChartContainer>
        <ChartTable caption={label} columns={compare ? ["Day", NAMES.current, "Same weekday, a week earlier"] : ["Day", "Leads"]}
          rows={points.map((point) => { const day = `${fmtDayLong(point.day)}${point.day === today ? " (today so far)" : ""}`; return compare ? [day, point.current, point.previous ?? "not loaded"] : [day, point.current]; })} />
      </figure>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-border pt-3 sm:flex sm:flex-wrap sm:gap-x-8">
        <Fact label="Today so far" value={fmtInt(week.today)} note={compare ? "not in this chart" : undefined}
          mark={compare ? undefined : <svg width={12} height={12} viewBox="0 0 12 12" aria-hidden className="shrink-0"><circle cx={6} cy={6} {...TODAY_DOT} /></svg>} />
        {!compare && <Fact label={`Last ${range} days`} value={`${fmtInt(view.total)}${view.cutFrom ? "+" : ""}`} note={view.total === 1 ? "lead" : "leads"} />}
        <Fact label="Daily average" value={view.average === null ? "–" : AVERAGE.format(view.average)} note={view.average === null ? undefined : view.averageFrom ? `since ${fmtDay(view.averageFrom)}` : "full days only"} />
        <Fact label="Busiest day" value={busiest ? fmtInt(busiest.current) : "–"} note={busiest ? `${fmtDayLong(busiest.day)}${busiest.day === today ? " (today)" : ""}` : "no leads in this range"} />
      </dl>
    </Panel>
  );
}

// Today's point is still filling up, so it gets its own marker: --gold inside a ring of the series colour (the ring carries the contrast).
const TODAY_DOT = { r: 4, fill: CHART.accent, stroke: CHART.series, strokeWidth: 2 } as const;

function Fact({ label, value, note, mark }: { label: string; value: string; note?: string | undefined; mark?: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className={LABEL}>{label}</dt>
      <dd className="mt-1 flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">{mark}<span className="font-bold text-foreground">{value}</span>{note}</dd>
    </div>
  );
}

/** One of the two week totals above the 7-day chart. The stroke before the label is the line's key, so the pair doubles as the legend. */
function WeekTotal({ label, color, value, strong = false }: { label: string; color: string; value: string; strong?: boolean }) {
  return (
    <div>
      <dt className={cn(LABEL, "flex items-center gap-1.5")}><span aria-hidden className="h-0.5 w-4 shrink-0 rounded-full" style={{ backgroundColor: color }} />{label}</dt>
      <dd className={cn("mt-1.5 text-2xl font-bold leading-none", strong ? "text-primary" : "text-muted-foreground")}>{value}</dd>
    </div>
  );
}

/** The kit tooltip with this chart's words: the day as heading, the current series first, and the date the comparison point belongs to. */
function TrendTip({ today, compare, payload, ...tip }: ComponentProps<typeof ChartTip> & { today: string; compare: boolean }) {
  return (
    <ChartTip {...tip} payload={payload ? [...payload].reverse() : payload}
      title={(day) => `${fmtDayLong(day)}${day === today ? " · today so far" : ""}`}
      names={compare ? NAMES : { current: "Leads" }}
      footer={(rows) => { const before = compare ? rows[0]?.payload?.["previousDay"] : null; return typeof before === "string" && before ? `7 days before is ${fmtDayLong(before)}` : null; }} />
  );
}

type AxisScale = (value: string | number) => number | undefined;
type ChartState = { xAxisMap?: Record<string, { scale?: AxisScale }>; yAxisMap?: Record<string, { scale?: AxisScale }>; offset?: { top?: number; height?: number } };
const LABEL_GAP = 14;

/**
 * Direct labels at the right-hand end of the two lines (recharts hands the scales to a <Customized> child). When the lines end
 * close together the labels are moved just far enough apart to stay readable; each keeps a stroke of its line's colour as its key.
 */
function EndLabels({ xAxisMap, yAxisMap, offset, day, ends }: ChartState & { day: string; ends: readonly { label: string; value: number | null; color: string }[] }) {
  const xScale = Object.values(xAxisMap ?? {})[0]?.scale, yScale = Object.values(yAxisMap ?? {})[0]?.scale;
  const x = xScale?.(day);
  if (x === undefined || !yScale) return null;
  const placed = ends.flatMap((end) => { const y = end.value === null ? undefined : yScale(end.value); return y === undefined ? [] : [{ ...end, y }]; }).sort((a, b) => a.y - b.y);
  const [upper, lower] = placed;
  if (upper && lower && lower.y - upper.y < LABEL_GAP) {
    const top = offset?.top ?? 0, bottom = top + (offset?.height ?? 0);
    const middle = Math.min(Math.max((upper.y + lower.y) / 2, top + LABEL_GAP / 2), bottom - LABEL_GAP / 2);
    upper.y = middle - LABEL_GAP / 2; lower.y = middle + LABEL_GAP / 2;
  }
  return (
    <g aria-hidden>
      {placed.map((end) => (
        <g key={end.label} transform={`translate(${x + 10},${end.y})`}>
          <line x1={0} x2={8} stroke={end.color} strokeWidth={2} strokeLinecap="round" />
          <text x={13} dy="0.35em" fontSize={11} fontWeight={600} fill={CHART.inkMuted}>{end.label}</text>
        </g>
      ))}
    </g>
  );
}
