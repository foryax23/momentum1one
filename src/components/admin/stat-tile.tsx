import type { ReactNode } from "react";
import { IconArrowRight } from "@/components/icons";
import { cn } from "@/lib/utils";
import { CHART, fmtInt, fmtSigned } from "./chart-kit";

export type StatDelta = {
  /** This period minus the one it is compared with, in the tile's own unit. */ value: number;
  /** The same change as a share of the earlier figure; leave out (or null) when there is nothing to divide by. */ share?: number | null;
  /** What it is compared with, as it should read after "than": "the 7 days before". */ against: string;
  /** Whether a rise is good news. Leave out for a figure that is neither good nor bad. */ upIsGood?: boolean;
};

type StatTileProps = {
  /** Sentence case, no colon. */ label: string;
  /** The figure, already formatted (fmtInt / fmtPct). */ value: string;
  delta?: StatDelta | undefined;
  /** Sparkline values, oldest first. */ spark?: readonly number[] | undefined;
  /** Index where the current period starts; from there on the line takes the series colour. Defaults to the last point only. */ sparkAccentFrom?: number | undefined;
  /** What the sparkline shows, for screen readers: "Leads per day over the last 14 days". The values are appended. */ sparkLabel?: string | undefined;
  /** A share from 0 to 1, drawn as a thin meter under the figure. Say what it is a share of in the footnote. */ meter?: number | undefined;
  footnote?: ReactNode;
  /** Makes the whole tile one button (the label is its visible text, at the foot): for a figure the team acts on. */ action?: { label: string; onClick: () => void } | undefined;
  className?: string | undefined;
};

/** One headline number. The number is the hero; everything else is optional and quiet. */
export function StatTile({ label, value, delta, spark, sparkAccentFrom, sparkLabel, meter, footnote, action, className }: StatTileProps) {
  // a line needs two points, and a run of zeros says nothing the figure has not said
  const trend = spark && spark.length > 1 && spark.some((point) => point > 0) ? spark : undefined;
  return (
    <div className={cn("flex min-w-0 flex-col rounded-2xl border border-border bg-card p-4 sm:p-5", action && "relative transition-colors duration-150 ease-out-strong hover-fine:hover:border-primary/45", className)}>
      <p className="text-[11px] font-semibold uppercase leading-tight tracking-[.1em] text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-3xl font-extrabold leading-none text-primary sm:text-4xl">{value}</p>
        {trend && <Sparkline values={trend} accentFrom={sparkAccentFrom} />}
      </div>
      {trend && sparkLabel && <p className="sr-only">{sparkLabel}: {trend.map(fmtInt).join(", ")}.</p>}
      {meter !== undefined && (
        <div aria-hidden className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: CHART.track }}>
          <div className="h-full rounded-full" style={{ width: `${Math.min(1, Math.max(0, meter)) * 100}%`, backgroundColor: CHART.series }} />
        </div>
      )}
      {delta && <Delta {...delta} />}
      {footnote && <p className="mt-auto pt-3 text-xs leading-snug text-muted-foreground">{footnote}</p>}
      {action && (
        // the button's ::after covers the tile, so the whole card is the target while the markup stays a plain button beside plain text
        <button type="button" onClick={action.onClick} aria-label={`${label}: ${value}. ${action.label}`}
          className={cn("flex cursor-pointer items-center gap-1 self-start rounded text-xs font-bold text-primary outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-ring", footnote ? "mt-2" : "mt-auto pt-3")}>
          {action.label} <IconArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

/** Direction is said three ways (arrow, words, sign), so it never rests on colour. */
function Delta({ value, share, against, upIsGood }: StatDelta) {
  const direction = value > 0 ? "up" : value < 0 ? "down" : "flat";
  const good = upIsGood === undefined || direction === "flat" ? undefined : (direction === "up") === upIsGood;
  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-1.5 text-xs leading-snug text-muted-foreground">
      <span className="inline-flex items-center gap-1 font-bold" style={{ color: good === undefined ? CHART.ink : good ? CHART.good : CHART.bad }}>
        <svg width={12} height={12} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          {direction === "up" ? <path d="M6 10V2M2.5 5.5 6 2l3.5 3.5" /> : direction === "down" ? <path d="M6 2v8M2.5 6.5 6 10l3.5-3.5" /> : <path d="M2.5 6h7" />}
        </svg>
        {direction === "flat" ? "No change" : `${fmtInt(Math.abs(value))} ${direction === "up" ? "more" : "fewer"}`}
      </span>
      <span>{direction === "flat" ? `from ${against}` : `than ${against}`}{share != null && direction !== "flat" && ` (${fmtSigned(Math.round(share * 100))}%)`}</span>
    </p>
  );
}

const W = 92, H = 30, PAD = 4;

function Sparkline({ values, accentFrom }: { values: readonly number[]; accentFrom?: number | undefined }) {
  const last = values.length - 1;
  const top = Math.max(...values, 1);
  const x = (i: number) => PAD + (i * (W - 2 * PAD)) / last;
  const y = (value: number) => H - PAD - (value / top) * (H - 2 * PAD);
  const points = values.map((value, i) => `${x(i).toFixed(1)},${y(value).toFixed(1)}`);
  const from = Math.min(last, Math.max(0, accentFrom ?? last));
  const stroke = { fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden className="shrink-0">
      <polyline points={points.slice(0, from + 1).join(" ")} stroke={CHART.context} strokeWidth={1.5} {...stroke} />
      <polyline points={points.slice(from).join(" ")} stroke={CHART.series} strokeWidth={2} {...stroke} />
      <circle cx={x(last)} cy={y(values[last] ?? 0)} r={3.5} fill={CHART.series} stroke={CHART.surface} strokeWidth={2} />
    </svg>
  );
}
