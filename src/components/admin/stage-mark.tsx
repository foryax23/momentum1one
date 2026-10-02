import { RocketAssembly } from "@/components/funnel-scenes";
import { STAGES, type Stage } from "@/lib/lead-metrics";
import { cn } from "@/lib/utils";
import { CHART } from "./chart-kit";
import { statusKey, statusLabel } from "./lead-model";

/** Rocket parts fitted at each stage: the hull, then the window, then fins and engine, then the nose that finishes it. */
const ROCKET_STEP: Record<Stage, number> = { new: 0, contacted: 1, applied: 3, enrolled: 4 };
const stageOf = (status: string): Stage | undefined => STAGES.find((stage) => stage === statusKey(status));

/** The site's rocket, built as far as the stage: decoration only, so it is hidden from screen readers (its own label follows the visitor's language). */
export function StageRocket({ status, sizeClassName = "h-12", className }: { status: string; sizeClassName?: string; className?: string }) {
  return (
    // the rocket draws its stars as spans; at this size they are noise beside the numbers
    <div aria-hidden className={cn("flex shrink-0 justify-center [&_span]:hidden", className)}>
      <RocketAssembly still step={ROCKET_STEP[stageOf(status) ?? "new"]} sizeClassName={sizeClassName} labelClassName="hidden" className="mx-0" />
    </div>
  );
}

/** Lost is a status, so it gets the reserved colour together with an icon and its name. */
export function LostIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={CHART.lost} strokeWidth={size < 20 ? 2.4 : 1.8} strokeLinecap="round" aria-hidden className="shrink-0">
      <circle cx={12} cy={12} r={9} /><path d="m9 9 6 6m0-6-6 6" />
    </svg>
  );
}

/** How far along a lead is, as four steps filled in the pipeline's own colours. Always shown with the status in words. */
export function StageSteps({ status }: { status: string }) {
  const key = statusKey(status), stage = stageOf(status);
  if (key === "lost") return <LostIcon size={13} />;
  if (!stage) return <span aria-hidden className="h-2 w-2 shrink-0 rounded-full border-2" style={{ borderColor: CHART.context }} />;
  const reached = STAGES.indexOf(stage);
  return (
    <span aria-hidden className="flex shrink-0 gap-0.5">
      {STAGES.map((step, i) => <span key={step} className="h-2.5 w-[3px] rounded-full" style={{ backgroundColor: i <= reached ? CHART.stages[stage] : CHART.grid }} />)}
    </span>
  );
}

/** A lead's status as a labelled pill: the word says it, the steps show how far along that is. */
export function StatusPill({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card px-2.5 py-1 text-xs font-semibold leading-none text-foreground", className)}>
      <StageSteps status={status} />{statusLabel(status)}
    </span>
  );
}
