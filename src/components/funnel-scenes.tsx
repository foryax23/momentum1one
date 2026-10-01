import { motion, useReducedMotion } from "motion/react";
import finLeftImg from "@/assets/rocket/fin-left.webp";
import finRightImg from "@/assets/rocket/fin-right.webp";
import flameImg from "@/assets/rocket/flame.webp";
import hullImg from "@/assets/rocket/hull.webp";
import noseImg from "@/assets/rocket/nose.webp";
import nozzleImg from "@/assets/rocket/nozzle.webp";
import portholeImg from "@/assets/rocket/porthole.webp";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Rocket geometry in hull units (hull width = 100). Parts are listed back to front.
const CANVAS = { x: -45, y: -72, w: 190, h: 318 };
const LAUNCH_H = 410; // canvas height once the exhaust flame is lit
const ROCKET_PARTS = [
  { key: "fin-left", src: finLeftImg, stage: 3, x: -42, y: 80, w: 51, from: { x: -34, y: 0 } },
  { key: "fin-right", src: finRightImg, stage: 3, x: 91, y: 80, w: 51, from: { x: 34, y: 0 } },
  { key: "nozzle", src: nozzleImg, stage: 4, x: 11, y: 150, w: 78, from: { x: 0, y: 30 } },
  { key: "hull", src: hullImg, stage: 1, x: 0, y: 0, w: 100, from: { x: 0, y: -30 } },
  { key: "porthole", src: portholeImg, stage: 2, x: 28, y: 38, w: 44, from: { x: 0, y: -24 } },
  { key: "nose", src: noseImg, stage: 5, x: 8, y: -69, w: 84, from: { x: 0, y: -34 } },
] as const;
const FLAME = { x: 25, y: 218, w: 50 };
const STAGE_KEYS = ["hull", "window", "fins", "engine", "nose"] as const;
const STAGE_LABELS = ["Hull", "Cockpit window", "Side fins", "Engine", "Nose cone"];

/** Caption for the rocket: which part the current step adds. */
export function RocketStageLabel({ step, total = 5, complete = false, className }: { step: number; total?: number; complete?: boolean; className?: string }) {
  const { t } = useI18n();
  const shown = complete ? total : step + 1;
  const label = complete
    ? t("rocket.liftoff", undefined, "Lift-off")
    : `${t("rocket.stage", { step: shown, total }, `Stage ${shown}/${total}`)} · ${t(`rocket.${STAGE_KEYS[shown - 1]}`, undefined, STAGE_LABELS[shown - 1])}`;
  return <p className={cn("text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground", className)}>{label}</p>;
}

/** Modular rocket: each funnel step docks one real part onto a faint blueprint; completion ignites the engine and lifts off. */
export function RocketAssembly({ step, total = 5, complete = false, className, sizeClassName, labelClassName }: { step: number; total?: number; complete?: boolean; className?: string; sizeClassName?: string; labelClassName?: string }) {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const shown = complete ? total : step + 1;
  const height = complete ? LAUNCH_H : CANVAS.h;
  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 260, damping: 19 };
  const place = (part: { x: number; y: number; w: number }) => ({
    left: `${((part.x - CANVAS.x) / CANVAS.w) * 100}%`,
    top: `${((part.y - CANVAS.y) / height) * 100}%`,
    width: `${(part.w / CANVAS.w) * 100}%`,
  });

  return (
    <div className={cn("relative mx-auto w-fit", className)} role="img" aria-label={t("rocket.aria", { step: shown, total }, `Rocket: ${shown} of ${total} parts assembled`)}>
      <div className={cn("relative mx-auto", sizeClassName ?? (complete ? "h-44 sm:h-52" : "h-36 sm:h-44"))} style={{ aspectRatio: `${CANVAS.w} / ${height}` }}>
        {[[4, 12], [92, 20], [10, 52], [90, 60], [78, 6], [20, 30]].map(([left, top], index) => (
          <motion.span key={index} className="absolute h-[3px] w-[3px] rounded-full bg-gold" style={{ left: `${left}%`, top: `${top}%` }}
            animate={reduce ? { opacity: 0.6 } : { opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 2 + index * 0.4, delay: index * 0.3 }} />
        ))}

        <motion.div className="absolute inset-0"
          animate={complete && !reduce ? { y: ["0%", "1%", "-1%", "0.5%", "-14%"] } : { y: "0%" }}
          transition={complete ? { duration: 2.4, times: [0, 0.15, 0.3, 0.45, 1], ease: "easeIn", delay: 0.6 } : {}}>
          {/* blueprint: where the remaining parts will dock */}
          {!complete && ROCKET_PARTS.map((part) => (
            <img key={`ghost-${part.key}`} src={part.src} alt="" draggable={false} className="pointer-events-none absolute select-none opacity-[.13] grayscale" style={place(part)} />
          ))}

          <motion.img src={flameImg} alt="" draggable={false} className="pointer-events-none absolute select-none" style={{ ...place(FLAME), transformOrigin: "50% 0%" }}
            initial={false}
            animate={complete ? (reduce ? { opacity: 1, scaleY: 1 } : { opacity: 1, scaleY: [0.75, 1.08, 0.9, 1.12], scaleX: [0.92, 1.04, 0.96, 1.05] }) : { opacity: 0, scaleY: 0.3 }}
            transition={complete && !reduce ? { opacity: { duration: 0.3 }, default: { repeat: Infinity, repeatType: "mirror", duration: 0.4 } } : { duration: 0.2 }} />

          {ROCKET_PARTS.map((part) => (
            <motion.img key={part.key} src={part.src} alt="" draggable={false} className="pointer-events-none absolute select-none" style={place(part)}
              initial={false}
              animate={shown >= part.stage ? { opacity: 1, x: 0, y: 0, scale: 1 } : { opacity: 0, x: reduce ? 0 : part.from.x, y: reduce ? 0 : part.from.y, scale: 0.86 }}
              transition={spring} />
          ))}
        </motion.div>

        {/* exhaust smoke on launch */}
        {complete && !reduce && [0, 1, 2, 3, 4, 5].map((i) => (
          <motion.span key={i} className="absolute bottom-0 left-1/2 h-6 w-6 rounded-full bg-muted"
            initial={{ opacity: 0, x: 0, scale: .4 }}
            animate={{ opacity: [0, .7, 0], x: (i % 2 ? 1 : -1) * (20 + i * 10), y: [0, 6], scale: [.4, 1.6] }}
            transition={{ duration: 1.6, delay: 0.8 + i * 0.12, repeat: Infinity, repeatDelay: 0.6 }} />
        ))}
      </div>

      <RocketStageLabel step={step} total={total} complete={complete} className={cn("mt-1 text-center", labelClassName)} />
    </div>
  );
}
