import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import finLeftImg from "@/assets/rocket/fin-left.webp";
import finRightImg from "@/assets/rocket/fin-right.webp";
import flameImg from "@/assets/rocket/flame.webp";
import hullImg from "@/assets/rocket/hull.webp";
import noseImg from "@/assets/rocket/nose.webp";
import nozzleImg from "@/assets/rocket/nozzle.webp";
import portholeImg from "@/assets/rocket/porthole.webp";
import { useI18n } from "@/lib/i18n";
import { easeInOut, easeOut, spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

// Rocket geometry in hull units (hull width = 100). Parts are listed back to front; iw/ih are the files' pixel sizes.
const CANVAS = { x: -45, y: -72, w: 190, h: 318 };
const LAUNCH_H = 410; // canvas height once the exhaust flame is lit
const ROCKET_PARTS = [
  { key: "fin-left", src: finLeftImg, stage: 3, x: -42, y: 80, w: 51, iw: 134, ih: 249, from: { x: -34, y: 0 } },
  { key: "fin-right", src: finRightImg, stage: 3, x: 91, y: 80, w: 51, iw: 134, ih: 248, from: { x: 34, y: 0 } },
  { key: "nozzle", src: nozzleImg, stage: 4, x: 11, y: 150, w: 78, iw: 204, ih: 240, from: { x: 0, y: 30 } },
  { key: "hull", src: hullImg, stage: 1, x: 0, y: 0, w: 100, iw: 260, ih: 419, from: { x: 0, y: -30 } },
  { key: "porthole", src: portholeImg, stage: 2, x: 28, y: 38, w: 44, iw: 150, ih: 149, from: { x: 0, y: -24 } },
  { key: "nose", src: noseImg, stage: 5, x: 8, y: -69, w: 84, iw: 220, ih: 225, from: { x: 0, y: -34 } },
] as const;
const FLAME = { x: 25, y: 218, w: 50, iw: 162, ih: 381 };
const STARS = [[4, 12], [92, 20], [10, 52], [90, 60], [78, 6], [20, 30]] as const;
const STAGE_KEYS = ["hull", "window", "fins", "engine", "nose"] as const;
const STAGE_LABELS = ["Hull", "Cockpit window", "Side fins", "Engine", "Nose cone"];

const PART = "pointer-events-none absolute select-none";
const GHOST = "opacity-[.13] grayscale";
const STAR = "absolute h-[3px] w-[3px] rounded-full bg-gold opacity-60";
const DOCKED = { opacity: 1, transform: "translate(0px, 0px) scale(1)" };
const GROUNDED = "translateY(0%)";
// A short rumble on the pad, then the climb. The climb eases in and out so the rocket settles instead of stopping dead.
const LIFT_OFF = [GROUNDED, "translateY(1%)", "translateY(-1%)", "translateY(0.5%)", "translateY(-14%)"];
const FLAME_LOW = "scale(0.92, 0.75)";
const FLICKER = [FLAME_LOW, "scale(1.04, 1.08)", "scale(0.96, 0.9)", "scale(1.05, 1.12)"];
// One smoke cycle: 1.6s of drift, then 0.6s of rest. The rest lives in the keyframes because a repeatDelay would take
// the loop off the compositor. Easings on the loops are given per segment: a single easing would be applied to the whole
// cycle once the browser runs it.
const SMOKE_CYCLE = 2.2;

const place = (part: { x: number; y: number; w: number }, height: number) => ({
  left: `${((part.x - CANVAS.x) / CANVAS.w) * 100}%`,
  top: `${((part.y - CANVAS.y) / height) * 100}%`,
  width: `${(part.w / CANVAS.w) * 100}%`,
});

type RocketProps = { step: number; total?: number | undefined; complete?: boolean | undefined; className?: string | undefined; sizeClassName?: string | undefined; labelClassName?: string | undefined };

/** Caption for the rocket: which part the current step adds. */
export function RocketStageLabel({ step, total = 5, complete = false, className }: { step: number; total?: number; complete?: boolean; className?: string }) {
  const { t } = useI18n();
  const shown = complete ? total : step + 1;
  const label = complete
    ? t("rocket.liftoff", undefined, "Lift-off")
    : `${t("rocket.stage", { step: shown, total }, `Stage ${shown}/${total}`)} · ${t(`rocket.${STAGE_KEYS[shown - 1]}`, undefined, STAGE_LABELS[shown - 1])}`;
  return <p className={cn("text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground", className)}>{label}</p>;
}

/**
 * Modular rocket: each funnel step docks one real part onto a faint blueprint; completion ignites the engine and lifts off.
 * `still` draws the same rocket for a given step with plain elements (no motion, no observers) for places that show
 * several of them at once.
 */
export function RocketAssembly({ still = false, ...props }: RocketProps & { still?: boolean }) {
  return still ? <StillRocket {...props} /> : <LiveRocket {...props} />;
}

function RocketFrame({ step, total = 5, complete = false, className, sizeClassName, labelClassName, canvasRef, children }: RocketProps & { canvasRef?: RefObject<HTMLDivElement | null>; children: ReactNode }) {
  const { t } = useI18n();
  const shown = complete ? total : step + 1;
  return (
    <div className={cn("relative mx-auto w-fit", className)} role="img" aria-label={t("rocket.aria", { step: shown, total }, `Rocket: ${shown} of ${total} parts assembled`)}>
      <div ref={canvasRef} className={cn("relative mx-auto", sizeClassName ?? (complete ? "h-44 sm:h-52" : "h-36 sm:h-44"))} style={{ aspectRatio: `${CANVAS.w} / ${complete ? LAUNCH_H : CANVAS.h}` }}>
        {children}
      </div>
      <RocketStageLabel step={step} total={total} complete={complete} className={cn("mt-1 text-center", labelClassName)} />
    </div>
  );
}

function StillRocket(props: RocketProps) {
  const { step, total = 5, complete = false } = props;
  const shown = complete ? total : step + 1;
  const height = complete ? LAUNCH_H : CANVAS.h;
  return (
    <RocketFrame {...props}>
      {STARS.map(([left, top], index) => <span key={index} className={STAR} style={{ left: `${left}%`, top: `${top}%` }} />)}
      {complete && <img src={flameImg} alt="" width={FLAME.iw} height={FLAME.ih} loading="lazy" decoding="async" draggable={false} className={PART} style={place(FLAME, height)} />}
      {/* blueprint parts first: a ghost must never draw over a part that is already fitted */}
      {[false, true].map((fitted) => ROCKET_PARTS.filter((part) => shown >= part.stage === fitted).map((part) => (
        <img key={part.key} src={part.src} alt="" width={part.iw} height={part.ih} loading="lazy" decoding="async" draggable={false} className={cn(PART, !fitted && GHOST)} style={place(part, height)} />
      )))}
    </RocketFrame>
  );
}

function LiveRocket(props: RocketProps) {
  const { step, total = 5, complete = false } = props;
  const reduce = useReducedMotion();
  const canvas = useRef<HTMLDivElement>(null);
  // Everything that loops (stars, flame, smoke) only runs while the rocket is on screen.
  const onScreen = useInView(canvas);
  const shown = complete ? total : step + 1;
  const height = complete ? LAUNCH_H : CANVAS.h;
  const launching = complete && !reduce;
  const burning = launching && onScreen;
  // Targets never depend on `reduce`, so server and client markup agree. Reduced motion keeps the fade and drops the
  // travel: the transform jumps while the part is invisible (before the fade in, after the fade out).
  const dock = (docked: boolean) => (reduce ? { opacity: { duration: 0.2 }, transform: { duration: 0, delay: docked ? 0 : 0.2 } } : { default: spring, opacity: { duration: 0.2, ease: easeOut } });
  const smoke = (index: number, times: number[]) => ({ duration: SMOKE_CYCLE, times, delay: 0.8 + index * 0.12, repeat: Infinity });
  // The flame only mounts on the finished rocket. Fetch it once the visitor is under way so lift-off never waits on it.
  useEffect(() => { if (step > 0 && !complete) new Image().src = flameImg; }, [step, complete]);

  return (
    <RocketFrame {...props} canvasRef={canvas}>
      {/* star-twinkle is defined in styles.css; the reduced-motion block there stops it on the stars' own opacity */}
      {STARS.map(([left, top], index) => (
        <span key={index} className={STAR} style={{ left: `${left}%`, top: `${top}%`, animation: `star-twinkle ${2 + index * 0.4}s ease-in-out ${index * 0.3}s infinite ${onScreen ? "running" : "paused"}` }} />
      ))}

      <motion.div className="absolute inset-0" initial={{ transform: GROUNDED }}
        animate={{ transform: launching ? LIFT_OFF : GROUNDED }}
        transition={launching ? { duration: 2.4, times: [0, 0.15, 0.3, 0.45, 1], ease: ["easeInOut", "easeInOut", "easeInOut", easeInOut], delay: 0.6 } : { duration: 0 }}>
        {/* blueprint: where the remaining parts will dock */}
        {!complete && ROCKET_PARTS.map((part) => (
          <img key={`ghost-${part.key}`} src={part.src} alt="" width={part.iw} height={part.ih} decoding="async" draggable={false} className={cn(PART, GHOST)} style={place(part, height)} />
        ))}

        {complete && (
          <motion.img src={flameImg} alt="" width={FLAME.iw} height={FLAME.ih} decoding="async" draggable={false} className={PART} style={{ ...place(FLAME, height), transformOrigin: "50% 0%" }}
            initial={{ opacity: 0, transform: FLAME_LOW }}
            animate={{ opacity: 1, transform: burning ? FLICKER : reduce ? "scale(1, 1)" : FLAME_LOW }}
            transition={{ opacity: { duration: 0.3, ease: easeOut }, transform: burning ? { duration: 0.4, ease: ["easeInOut", "easeInOut", "easeInOut"], repeat: Infinity, repeatType: "reverse" } : { duration: 0 } }} />
        )}

        {ROCKET_PARTS.map((part) => {
          const docked = shown >= part.stage;
          return (
            <motion.img key={part.key} src={part.src} alt="" width={part.iw} height={part.ih} decoding="async" draggable={false} className={PART} style={place(part, height)}
              initial={false}
              animate={docked ? DOCKED : { opacity: 0, transform: `translate(${part.from.x}px, ${part.from.y}px) scale(0.86)` }}
              transition={dock(docked)} />
          );
        })}
      </motion.div>

      {/* exhaust smoke on launch */}
      {burning && [0, 1, 2, 3, 4, 5].map((i) => {
        const drift = `translate(${(i % 2 ? 1 : -1) * (20 + i * 10)}px, 6px) scale(1.6)`;
        return (
          <motion.span key={i} className="absolute bottom-0 left-1/2 h-6 w-6 rounded-full bg-muted"
            initial={{ opacity: 0, transform: "translate(0px, 0px) scale(0.4)" }}
            animate={{ opacity: [0, 0.7, 0, 0], transform: ["translate(0px, 0px) scale(0.4)", drift, drift] }}
            transition={{ opacity: { ...smoke(i, [0, 0.36, 0.73, 1]), ease: ["easeInOut", "easeInOut", "linear"] }, transform: { ...smoke(i, [0, 0.73, 1]), ease: ["easeOut", "linear"] } }} />
        );
      })}
    </RocketFrame>
  );
}
