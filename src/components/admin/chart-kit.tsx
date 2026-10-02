/* eslint-disable react-refresh/only-export-components -- the colour roles, formatters and recharts defaults ship in one file with the components that use them */
import { useId, useRef, useState, type ComponentProps, type FocusEvent, type PointerEvent, type ReactNode } from "react";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { IconLedger } from "@/components/icons";
import { cn } from "@/lib/utils";
import derby from "@/assets/campuses/derby-thumb.webp";
import luton from "@/assets/campuses/luton-thumb.webp";
import manchester from "@/assets/campuses/manchester-thumb.webp";
import newcastle from "@/assets/campuses/newcastle-thumb.webp";
import sunderland from "@/assets/campuses/sunderland-thumb.webp";

/**
 * The shared chart language of the admin dashboard: one set of colour roles, one card, one tooltip, one set of axis
 * defaults, so the four blocks read as one system.
 *
 * Colour is assigned by job, never by taste. The values are the brand tokens from styles.css as hex, stepped where the
 * token itself fails a chart check on white (checked with the dataviz palette validator, light mode, surface #ffffff):
 * - `series` is --teal moved to oklch(0.50 0.105 235): the token's chroma (0.09) sits under the 0.10 floor.
 * - `routes` (Foundation Year / Year 1) is that teal with --gold moved to oklch(0.67 0.137 70): passes all six checks,
 *   worst pair ΔE 22.7 under colour-blind simulation, both at least 3:1 on white.
 * - `stages` is one hue, light to dark, for the ordered pipeline (validated as an ordinal ramp, lightest step 2.27:1).
 */
export const CHART = {
  surface: "#ffffff",
  /** Text. Labels, values, legends and ticks use these two, never a series colour. */
  ink: "#061924", inkMuted: "#3e5a67",
  /** Hairlines, one step off the surface: gridlines, the axis baseline, the hover band behind a bar. */
  grid: "#deeaf0", axis: "#c8dbe5", wash: "#eff7fc",
  /** Every single-series mark (bars, a line, an area wash): one hue. */
  series: "#046b96",
  /** The one mark or series the chart is about, when it sits among `series` or `context` marks (navy --primary). */
  emphasis: "#063a55",
  /** Comparison and catch-all marks: last week, "Other", "nothing recorded". */
  context: "#7c97a3",
  /**
   * The rest of a bar: the unfilled part of a meter, the "moved on" tail of a pipeline stage. One lighter step of the series
   * hue, ΔE 19.6 from the lightest stage colour. Barely off white by design (1.2:1), so it never carries a value alone.
   */
  track: "#d8ebf6",
  /** --gold as it is. Small marks only (a today dot, a marker); it is under 3:1 on white, so never the only carrier and never text. */
  accent: "#efac44",
  /** The two entry routes, wherever they appear together. Always with a legend. */
  routes: { "Foundation Year": "#046b96", "Year 1": "#ca841d" },
  /** Pipeline stages in order; the further along, the darker. */
  stages: { new: "#78b4d1", contacted: "#4790b3", applied: "#046b96", enrolled: "#063a55" },
  /** Status colours carry meaning, so they always come with an icon or a word. `lost` is a mark; good / bad / warn are text. */
  lost: "#c9302d", good: "#17653c", bad: "#c9302d", warn: "#7e4f04",
} as const;

export const CAMPUS_THUMBS: Record<string, string> = { Manchester: manchester, Derby: derby, Sunderland: sunderland, Newcastle: newcastle, Luton: luton };

/* ── Numbers and dates (en-GB) ────────────────────────────────────────────────────────────────────────────────────── */

const INT = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });
const PCT = [0, 1].map((digits) => new Intl.NumberFormat("en-GB", { style: "percent", maximumFractionDigits: digits }));
// day keys are plain calendar days (YYYY-MM-DD in London), so they are formatted at noon UTC and never shift
const DAY_SHORT = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short" });
const DAY_LONG = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" });
const WEEKDAY = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short" });
const noon = (day: string) => new Date(`${day}T12:00:00Z`);

/** 1284 → "1,284" */
export const fmtInt = (value: number) => INT.format(value);
/** A share from 0 to 1: 0.372 → "37%" (or "37.2%" with one digit). A real share that would round to nothing reads "<1%". */
export const fmtPct = (share: number, digits: 0 | 1 = 0) => (digits === 0 && share > 0 && share < 0.005 ? "<1%" : (PCT[digits] as Intl.NumberFormat).format(share));
/** 12 → "+12", -5 → "−5", 0 → "0" */
export const fmtSigned = (value: number) => (value === 0 ? "0" : `${value > 0 ? "+" : "−"}${fmtInt(Math.abs(value))}`);
/** 3, "lead" → "3 leads" */
export const plural = (count: number, one: string, many = `${one}s`) => `${fmtInt(count)} ${count === 1 ? one : many}`;
/** "2026-10-02" → "2 Oct" */
export const fmtDay = (day: string) => (day ? DAY_SHORT.format(noon(day)) : "");
/** "2026-10-02" → "Fri 2 Oct" */
export const fmtDayLong = (day: string) => (day ? DAY_LONG.format(noon(day)).replace(",", "") : "");
/** "2026-10-02" → "Fri" */
export const fmtWeekday = (day: string) => (day ? WEEKDAY.format(noon(day)) : "");
/** Whole hours → "under an hour", "5 hours", "3 days" */
export const fmtWaiting = (hours: number) => (hours < 1 ? "under an hour" : hours < 48 ? plural(hours, "hour") : plural(Math.floor(hours / 24), "day"));

/* ── Recharts defaults ────────────────────────────────────────────────────────────────────────────────────────────── */

const tick = { fontSize: 11, fill: CHART.inkMuted };
/** <CartesianGrid {...gridProps} />: horizontal hairlines only, solid. */
export const gridProps = { vertical: false, stroke: CHART.grid } as const;
/** <XAxis {...xAxisProps} dataKey="…" /> */
export const xAxisProps = { tickLine: false, axisLine: { stroke: CHART.axis }, tickMargin: 8, minTickGap: 20, tick } as const;
/** <YAxis {...yAxisProps} />: whole numbers, no axis line (the grid carries it). */
export const yAxisProps = { tickLine: false, axisLine: false, tickMargin: 4, width: 32, allowDecimals: false, tick } as const;
/** The name axis of a horizontal bar chart: <YAxis {...nameAxisProps} dataKey="label" /> with layout="vertical" on the chart. */
export const nameAxisProps = { type: "category", tickLine: false, axisLine: false, width: 132, tick: { fontSize: 12, fill: CHART.ink } } as const;
/** Bars stay thin and never animate: <Bar {...barProps} radius={BAR_RADIUS.up} fill={CHART.series} /> */
export const barProps = { maxBarSize: 20, isAnimationActive: false } as const;
/** Rounded at the data end, square on the baseline. `up` for columns, `right` for horizontal bars. */
export const BAR_RADIUS: Record<"up" | "right", [number, number, number, number]> = { up: [4, 4, 0, 0], right: [0, 4, 4, 0] };
/** Stacked segments are told apart by a 2px gap in the surface colour, never by an outline: <Bar {...barProps} {...stackGap} stackId="a" /> */
export const stackGap = { stroke: CHART.surface, strokeWidth: 2 } as const;
/** <Line {...lineProps} stroke={CHART.series} /> (also fits <Area>, with fill={CHART.series} fillOpacity={AREA_OPACITY}). */
export const lineProps = { type: "linear", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", dot: false, activeDot: { r: 4, strokeWidth: 2, stroke: CHART.surface }, isAnimationActive: false } as const;
export const AREA_OPACITY = 0.1;
/** <Tooltip {...tooltipProps} cursor={CURSOR.line} content={<ChartTip />} /> */
export const tooltipProps = { isAnimationActive: false, offset: 12 } as const;
/** `line`: the crosshair of a time series. `band`: the wash behind a hovered bar. */
export const CURSOR = { line: { stroke: CHART.axis, strokeWidth: 1 }, band: { fill: CHART.wash } } as const;

/* ── Card ─────────────────────────────────────────────────────────────────────────────────────────────────────────── */

/** The dashboard card: small-caps eyebrow, display-italic title, optional hint and action, then the body. */
export function Panel({ eyebrow, title, hint, action, children, className, bodyClassName }: { eyebrow: string; title: string; hint?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; bodyClassName?: string }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={cn("flex min-w-0 flex-col rounded-2xl border border-border bg-card p-5 sm:p-6", className)}>
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1 basis-48">
          <p className="text-[11px] font-bold uppercase tracking-[.14em] text-teal">{eyebrow}</p>
          <h2 id={id} className="mt-1 text-lg font-bold italic leading-snug text-primary sm:text-xl">{title}</h2>
          {hint && <p className="mt-1 max-w-prose text-sm text-muted-foreground">{hint}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className={cn("mt-5 min-w-0 flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}

/* ── Chart frame, tooltip, legend, table, empty state ─────────────────────────────────────────────────────────────── */

/**
 * Wraps one recharts chart: a <figure> named by `label`, the responsive container at a fixed height (the height includes
 * the axis band), and the table that says the same thing in text. Give the chart itself `accessibilityLayer`.
 */
export function ChartFrame({ label, config = {}, height = 260, table, className, children }: { label: string; config?: ChartConfig; height?: number; table?: ReactNode; className?: string; children: ComponentProps<typeof ChartContainer>["children"] }) {
  return (
    <figure aria-label={label} className={cn("m-0 min-w-0", className)}>
      <ChartContainer config={config} className="aspect-auto w-full" style={{ height }}>{children}</ChartContainer>
      {table}
    </figure>
  );
}

type TipRow = { name?: string | number | undefined; value?: unknown; color?: string | undefined; dataKey?: string | number | undefined; payload?: Record<string, unknown> | undefined };
type TipProps = {
  /** Filled in by recharts. */ active?: boolean | undefined; payload?: readonly TipRow[] | undefined; label?: string | number | undefined;
  /** Heading of the tooltip; defaults to the axis label as it is. */ title?: (label: string, rows: readonly TipRow[]) => ReactNode;
  /** Series names by dataKey; defaults to the series' `name`. */ names?: Record<string, string>;
  /** Defaults to whole numbers with thousands commas. */ format?: (value: number, dataKey: string) => string;
  /** Extra line under the rows (a total, a share), in muted ink. */ footer?: (rows: readonly TipRow[]) => ReactNode;
};

/** The one tooltip: <Tooltip content={<ChartTip />} />. Lists every series at the hovered position, keyed by a short stroke of its colour; the number is the strong element. */
export function ChartTip({ active, payload, label, title, names, format = fmtInt, footer }: TipProps) {
  const rows = (payload ?? []).filter((row) => typeof row.value === "number");
  if (!active || !rows.length) return null;
  const heading = title ? title(String(label ?? ""), rows) : label;
  const extra = footer?.(rows);
  return (
    <div className="grid min-w-36 gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      {heading !== undefined && heading !== "" && <p className="font-semibold text-foreground">{heading}</p>}
      {rows.map((row, i) => {
        const key = String(row.dataKey ?? i);
        const color = typeof row.payload?.["fill"] === "string" ? row.payload["fill"] : row.color;
        return (
          <p key={key} className="flex items-center gap-2">
            <span aria-hidden className="h-0.5 w-3 shrink-0 rounded-full" style={{ backgroundColor: color ?? CHART.series }} />
            <span className="text-muted-foreground">{names?.[key] ?? row.name ?? key}</span>
            <span className="ml-auto pl-3 font-bold tabular-nums text-foreground">{format(row.value as number, key)}</span>
          </p>
        );
      })}
      {extra && <p className="border-t border-border pt-1.5 text-muted-foreground">{extra}</p>}
    </div>
  );
}

/** Where a row's tooltip hangs, in pixels from the list's own corner (so a transformed ancestor cannot throw it off). */
type RowTipAt = { key: string; x: number; y: number; above: boolean; /** 0 at the list's left edge, 1 at its right: the tip slides under the pointer by that share of its own width, so it never leaves the card sideways. */ slide: number };

/**
 * Tooltip plumbing for charts drawn as plain HTML rows. Put `box` on a `relative` wrapper, spread `rowProps(key)` on each
 * row (the row needs a tabIndex or must be a button, so focus opens the tip as hover does) and render <RowTip> inside the wrapper.
 */
export function useRowTip() {
  const box = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<RowTipAt | null>(null);
  const hide = () => setTip(null);
  const show = (key: string, x: number, top: number, bottom: number) => {
    const rect = box.current?.getBoundingClientRect();
    if (!rect) return;
    const above = bottom + 150 > window.innerHeight;
    setTip({ key, x: x - rect.left, y: (above ? top : bottom) - rect.top, above, slide: Math.min(1, Math.max(0, (x - rect.left) / Math.max(1, rect.width))) });
  };
  /** Mouse and pen: the tip follows the pointer. Keyboard focus: it hangs off the row itself. A drag on touch is a scroll, not a hover. */
  const rowProps = (key: string) => ({
    onPointerMove: (event: PointerEvent<HTMLElement>) => { if (event.pointerType !== "touch") show(key, event.clientX, event.clientY - 4, event.clientY + 4); },
    onPointerLeave: (event: PointerEvent<HTMLElement>) => { if (event.pointerType !== "touch") hide(); },
    onFocus: (event: FocusEvent<HTMLElement>) => { if (!event.currentTarget.matches(":focus-visible")) return; const rect = event.currentTarget.getBoundingClientRect(); show(key, rect.left + 8, rect.top, rect.bottom - 6); },
    onBlur: hide,
  });
  return { box, tip, hide, rowProps };
}

/** The floating holder for a row's <ChartTip active … />. Decorative to a screen reader: the row itself says the same in text. */
export function RowTip({ tip, children }: { tip: RowTipAt; children: ReactNode }) {
  return <div aria-hidden className="pointer-events-none absolute z-20 w-max max-w-[17rem]" style={{ left: tip.x, top: tip.y, transform: `translate(${-tip.slide * 100}%, ${tip.above ? "calc(-100% - 12px)" : "12px"})` }}>{children}</div>;
}

export type LegendItem = { label: string; color: string; /** `bar` for bars and areas, `line` for lines. */ shape?: "bar" | "line"; /** Optional figure after the label. */ value?: string };

/** Legend for two or more series. The swatch carries the colour, the words stay in ink. */
export function SeriesLegend({ items, className }: { items: readonly LegendItem[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground", className)}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span aria-hidden className={cn("shrink-0", item.shape === "line" ? "h-0.5 w-4 rounded-full" : "h-2.5 w-2.5 rounded-[3px]")} style={{ backgroundColor: item.color }} />
          {item.label}{item.value !== undefined && <span className="font-bold tabular-nums text-foreground">{item.value}</span>}
        </li>
      ))}
    </ul>
  );
}

/**
 * The text twin of a chart. Hidden from sight by default (screen readers still read it); `visible` shows it as a plain table.
 * The first cell of each row is its header. Numbers are formatted for you.
 */
export function ChartTable({ caption, columns, rows, visible = false, className }: { caption: string; columns: readonly string[]; rows: readonly (readonly (string | number)[])[]; visible?: boolean; className?: string }) {
  const table = (
    <table className={cn(visible && "w-full text-left text-sm", className)}>
      <caption className={visible ? "sr-only" : undefined}>{caption}</caption>
      <thead className={visible ? "text-[11px] uppercase tracking-[.1em] text-muted-foreground" : undefined}>
        <tr>{columns.map((column, i) => <th key={column} scope="col" className={visible ? cn("pb-2 font-semibold", i > 0 && "text-right") : undefined}>{column}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, r) => (
          <tr key={r} className={visible ? "border-t border-border" : undefined}>
            {row.map((cell, c) => {
              const text = typeof cell === "number" ? fmtInt(cell) : cell;
              return c === 0 ? <th key={c} scope="row" className={visible ? "py-2 pr-3 font-medium" : undefined}>{text}</th> : <td key={c} className={visible ? "py-2 pl-3 text-right tabular-nums" : undefined}>{text}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
  // sr-only goes on a wrapper: a table ignores the 1px box and would stretch the page by its full, invisible height
  return visible ? table : <div className="sr-only">{table}</div>;
}

/** What a block shows when it has nothing to plot. Keep the same height as the chart it replaces. */
export function EmptyChart({ title = "Nothing to show yet", hint, height = 220, className }: { title?: string; hint?: ReactNode; height?: number; className?: string }) {
  return (
    <div className={cn("grid h-full place-items-center rounded-xl border border-dashed border-border bg-secondary/40 px-6 py-8 text-center", className)} style={{ minHeight: height }}>
      <div>
        <IconLedger size={28} className="mx-auto text-muted-foreground/70" />
        <p className="mt-2 text-sm font-semibold text-foreground">{title}</p>
        {hint && <p className="mx-auto mt-1 max-w-[36ch] text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}
