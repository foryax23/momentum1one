import { motion } from "motion/react";
import logoMark from "@/assets/logo-mark.png";
import { INTAKES } from "@/lib/funnel";
import hullAsset from "@/assets/rocket/01-hull.png.asset.json";
import noseAsset from "@/assets/rocket/02-nose-cone.png.asset.json";
import antennaAsset from "@/assets/rocket/03-antenna.png.asset.json";
import leftFinAsset from "@/assets/rocket/04-left-fin.png.asset.json";
import rightFinAsset from "@/assets/rocket/05-right-fin.png.asset.json";
import portholeAsset from "@/assets/rocket/06-porthole.png.asset.json";
import nozzleAsset from "@/assets/rocket/07-engine-nozzle.png.asset.json";
import flameAsset from "@/assets/rocket/08-flame.png.asset.json";
import footAsset from "@/assets/rocket/09-landing-foot.png.asset.json";

const ease = [0.22, 1, 0.36, 1] as const;

/** Step 1: an open book; the name is inked across the right page as you type. */
export function BookScene({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 320 110" className="h-24 w-full" aria-hidden>
      <motion.g initial={{ scaleX: 0.2, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ duration: 0.9, ease }} style={{ transformOrigin: "160px 60px" }}>
        <path d="M160 26c-26-12-62-14-104-6v74c42-8 78-6 104 6Z" fill="var(--card)" stroke="var(--ink)" strokeWidth="1.4" />
        <path d="M160 26c26-12 62-14 104-6v74c-42-8-78-6-104 6Z" fill="var(--card)" stroke="var(--ink)" strokeWidth="1.4" />
        <path d="M160 26v74" stroke="var(--ink)" strokeOpacity=".4" />
        {[44, 56, 68, 80].map((y) => <path key={y} d={`M72 ${y - 6}c26-4 52-3 76 3`} stroke="var(--teal)" strokeOpacity=".35" fill="none" />)}
      </motion.g>
      <text x="212" y="66" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="600" fontSize={name.length > 14 ? 15 : 20} fill="var(--ink)">
        {name || "Your name"}
      </text>
      <motion.path key={name.length > 0 ? "on" : "off"} d="M176 74c24 3 48 2 72-2" stroke="var(--teal)" strokeWidth="1.6" fill="none" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: name ? 1 : 0 }} transition={{ duration: 0.6 }} />
    </svg>
  );
}

/** Step 4: a desk calendar whose page flips to the chosen month. */
export function CalendarScene({ intake }: { intake: string }) {
  const m = INTAKES.find((i) => i.value === intake);
  return (
    <div className="flex h-24 items-center justify-center" style={{ perspective: 600 }}>
      <div className="relative h-20 w-20 rounded-md border border-ink/40 bg-card shadow-paper">
        <div className="h-5 rounded-t-md bg-teal" />
        <div className="absolute -top-1.5 left-4 h-3 w-1 rounded-full bg-ink" />
        <div className="absolute -top-1.5 right-4 h-3 w-1 rounded-full bg-ink" />
        <motion.div key={intake || "none"} initial={{ rotateX: -90, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} transition={{ duration: 0.6, ease }}
          style={{ transformOrigin: "top" }} className="flex flex-col items-center pt-1">
          <span className="font-display text-xl font-bold leading-tight text-ink">{m?.short ?? "?"}</span>
          <span className="text-[10px] tracking-widest text-muted-foreground">{m?.year ?? "WHEN"}</span>
        </motion.div>
      </div>
    </div>
  );
}

/** Step 5: an envelope; the flap folds shut once both fields are valid. */
export function EnvelopeScene({ sealed }: { sealed: boolean }) {
  return (
    <svg viewBox="0 0 320 110" className="h-24 w-full" aria-hidden>
      <rect x="110" y="34" width="100" height="64" rx="4" fill="var(--card)" stroke="var(--ink)" strokeWidth="1.4" />
      <motion.rect x="122" y="22" width="76" height="50" fill="var(--paper)" stroke="var(--gold)" strokeWidth="1"
        animate={{ y: sealed ? 40 : 18 }} transition={{ duration: 0.6, ease }} />
      <path d="M110 98l42-30M210 98l-42-30" stroke="var(--ink)" strokeOpacity=".35" strokeWidth="1.2" />
      <motion.path d="M110 34 160 70 210 34Z" fill="var(--stone)" stroke="var(--ink)" strokeWidth="1.4" strokeLinejoin="round"
        animate={{ scaleY: sealed ? 1 : -1 }} transition={{ duration: 0.6, ease }} style={{ transformOrigin: "160px 34px" }} />
      <motion.circle cx="160" cy="62" r="7" fill="var(--gold)" initial={false} animate={{ scale: sealed ? 1 : 0 }} transition={{ delay: sealed ? 0.45 : 0, type: "spring", stiffness: 400, damping: 14 }} />
    </svg>
  );
}

/** Final: the logo rocket lifts off the book and leaves an ink trail. */
export function LiftOffScene() {
  return (
    <div className="relative mx-auto h-36 w-40">
      <motion.svg viewBox="0 0 100 140" className="absolute inset-0 h-full w-full" aria-hidden>
        <motion.path d="M50 130 C 48 100, 54 80, 50 40" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" fill="none" strokeDasharray="1 7"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, delay: 0.3 }} />
      </motion.svg>
      <motion.img src={logoMark} alt="" width={120} height={100} className="absolute bottom-0 left-1/2 w-28 -translate-x-1/2"
        initial={{ y: 30, opacity: 0, scale: 0.9 }} animate={{ y: [30, -12, 0], opacity: 1, scale: 1 }} transition={{ duration: 1.3, ease }} />
    </div>
  );
}

const STAGE_LABELS = ["Hull and engine", "Navigation system", "Fins and landing gear", "Command porthole", "Engine ignition"];

/** Modular rocket: each funnel step docks one new piece from its own direction; completion ignites and lifts off. */
export function RocketAssembly({ step, total = 5, complete = false }: { step: number; total?: number; complete?: boolean }) {
  const shown = complete ? total : step + 1;
  const spring = { type: "spring" as const, stiffness: 260, damping: 19 };
  const layer = (n: number, src: string, className: string, from: { x?: number; y?: number; rotate?: number }, extra?: Record<string, unknown>) => (
    <motion.img src={src} alt="" draggable={false} className={`pointer-events-none absolute select-none object-contain ${className}`}
      initial={false} animate={shown >= n ? { opacity: 1, x: 0, y: 0, rotate: 0, scale: 1, ...extra } : { opacity: 0.08, x: from.x ?? 0, y: from.y ?? 0, rotate: from.rotate ?? 0, scale: 0.82 }} transition={spring} />
  );

  return (
    <motion.div className="relative mx-auto w-full max-w-[240px]" role="img"
      aria-label={`Rocket ${shown} of ${total} parts assembled${complete ? ", launching" : ""}`}
      animate={{ scale: 0.68 + (shown / total) * 0.32 }} transition={{ type: "spring", stiffness: 160, damping: 22 }}>
      <motion.div className="relative mx-auto h-48 w-48 sm:h-56 sm:w-56" animate={complete ? { y: [0, 2, -2, 1, -70] } : { y: 0 }} transition={complete ? { duration: 2.4, times: [0, .15, .3, .45, 1], ease: "easeIn", delay: .6 } : {}}>
        {[[8,18],[88,9],[18,52],[92,57],[72,28]].map(([left, top], index) => <motion.span key={left} className="absolute h-1 w-1 rounded-full bg-gold" style={{ left: `${left}%`, top: `${top}%` }} animate={{ opacity: [.2, 1, .2] }} transition={{ repeat: Infinity, duration: 2 + index * .35 }} />)}
        {layer(5, flameAsset.url, "z-0 left-[41%] top-[72%] w-[18%] origin-top", { y: 28 }, complete ? { scaleY: [1, 1.55, 1.2, 1.7] } : { scaleY: [1, 1.12, .94, 1] })}
        {layer(3, leftFinAsset.url, "z-10 left-[10%] top-[47%] w-[42%]", { x: -64, rotate: -10 })}
        {layer(3, rightFinAsset.url, "z-10 right-[10%] top-[47%] w-[42%]", { x: 64, rotate: 10 })}
        {layer(3, footAsset.url, "z-10 left-[19%] top-[77%] w-[28%] -rotate-12", { x: -42, y: 22 })}
        {layer(3, footAsset.url, "z-10 right-[19%] top-[77%] w-[28%] rotate-12", { x: 42, y: 22 })}
        {layer(2, antennaAsset.url, "z-20 left-[43%] top-[1%] w-[14%]", { y: -54 })}
        {layer(1, hullAsset.url, "z-30 left-[31%] top-[28%] w-[38%]", { y: -38 })}
        {layer(2, noseAsset.url, "z-40 left-[29%] top-[15%] w-[42%]", { y: -56 })}
        {layer(1, nozzleAsset.url, "z-40 left-[31%] top-[69%] w-[38%]", { y: 35 })}
        {layer(4, portholeAsset.url, "z-50 left-[40%] top-[43%] w-[20%]", { y: -26 })}
        {shown > 1 && <motion.span key={`flash-${shown}`} className="absolute left-[37%] top-[52%] z-[60] h-px w-[26%] bg-gold" initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: [0, 1, 0], scaleX: [0, 1, 1] }} transition={{ duration: .75, delay: .18 }} />}
      </motion.div>

      {/* exhaust smoke on launch */}
      {complete && [0, 1, 2, 3, 4, 5].map((i) => (
        <motion.span key={i} className="absolute bottom-5 left-1/2 h-6 w-6 rounded-full bg-muted"
          initial={{ opacity: 0, x: 0, scale: .4 }}
          animate={{ opacity: [0, .7, 0], x: (i % 2 ? 1 : -1) * (20 + i * 10), y: [0, 6], scale: [.4, 1.6] }}
          transition={{ duration: 1.6, delay: 0.8 + i * 0.12, repeat: Infinity, repeatDelay: 0.6 }} />
      ))}

      <p className="mt-1 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {complete ? "Lift-off" : `Stage ${shown}/${total} · ${STAGE_LABELS[shown - 1]}`}
      </p>
    </motion.div>
  );
}
