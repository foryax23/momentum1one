import { motion } from "motion/react";
import logoMark from "@/assets/logo-mark.png";
import { INTAKES } from "@/lib/funnel";

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

const STAGE_LABELS = ["Launch pad and hull", "Side boosters", "Command capsule", "Nose cone", "Engine ignition"];

/** Modular rocket: each funnel step docks one new piece from its own direction; completion ignites and lifts off. */
export function RocketAssembly({ step, total = 5, complete = false }: { step: number; total?: number; complete?: boolean }) {
  const shown = complete ? total : step + 1;
  const spring = { type: "spring" as const, stiffness: 260, damping: 19 };
  const dock = (n: number, from: { x?: number; y?: number }, children: React.ReactNode) => (
    <motion.g initial={false}
      animate={shown >= n ? { opacity: 1, x: 0, y: 0, scale: 1 } : { opacity: 0.1, x: from.x ?? 0, y: from.y ?? 0, scale: 0.9 }}
      transition={spring} style={{ transformOrigin: "100px 110px" }}>
      {children}
    </motion.g>
  );
  // Seam flash when a piece lands
  const Flash = ({ n, y }: { n: number; y: number }) => shown === n && !complete ? (
    <motion.rect key={`f${n}-${shown}`} x="66" y={y - 1.5} width="68" height="3" rx="1.5" fill="var(--gold)"
      initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: [0, 1, 0], scaleX: [0, 1, 1] }} transition={{ duration: 0.7, delay: 0.25 }}
      style={{ transformOrigin: "100px center" }} />
  ) : null;

  return (
    <motion.div className="relative mx-auto w-full max-w-[210px]" role="img"
      aria-label={`Rocket ${shown} of ${total} parts assembled${complete ? ", launching" : ""}`}
      animate={{ scale: 0.68 + (shown / total) * 0.32 }} transition={{ type: "spring", stiffness: 160, damping: 22 }}>
      <motion.svg viewBox="0 0 200 240" className="h-36 w-full overflow-visible sm:h-44" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
        animate={complete ? { y: [0, 2, -2, 1, -60] } : { y: 0 }}
        transition={complete ? { duration: 2.4, times: [0, .15, .3, .45, 1], ease: "easeIn", delay: 0.6 } : {}}>
        {/* stars */}
        {[[24, 30], [176, 46], [36, 120], [168, 140], [150, 18], [52, 70]].map(([x, y], i) => (
          <motion.circle key={i} cx={x} cy={y} r="1.4" fill="var(--gold)" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 2 + i * 0.4, delay: i * 0.3 }} />
        ))}

        {/* 1: hull */}
        {dock(1, { y: -40 }, <>
          <path d="M78 168V100c0-30 9-52 22-66 13 14 22 36 22 66v68Z" fill="var(--primary)" stroke="var(--teal)" />
          <path d="M78 124h44M78 150h44" stroke="var(--teal)" strokeOpacity=".5" strokeWidth="1.4" />
          <path d="M88 104v56" stroke="var(--primary-foreground)" strokeOpacity=".18" strokeWidth="4" />
        </>)}
        <Flash n={1} y={150} />

        {/* 2: boosters */}
        {dock(2, { x: -46 }, <>
          <path d="M78 128 52 156v30l26-14Z" fill="var(--teal)" stroke="var(--teal)" />
          <path d="M56 186h12v6H56Z" fill="var(--gold)" stroke="var(--gold)" />
        </>)}
        {dock(2, { x: 46 }, <>
          <path d="m122 128 26 28v30l-26-14Z" fill="var(--teal)" stroke="var(--teal)" />
          <path d="M132 186h12v6h-12Z" fill="var(--gold)" stroke="var(--gold)" />
        </>)}

        {/* 3: capsule porthole */}
        {dock(3, { y: -30 }, <>
          <circle cx="100" cy="92" r="15" fill="var(--paper, var(--card))" stroke="var(--gold)" strokeWidth="3" />
          <motion.circle cx="100" cy="92" r="9" fill="var(--gold)" animate={shown >= 3 ? { opacity: [0.35, 0.9, 0.35] } : { opacity: 0.2 }} transition={{ repeat: Infinity, duration: 2.2 }} />
          <circle cx="95" cy="87" r="3" fill="var(--primary-foreground)" opacity=".7" />
        </>)}
        <Flash n={3} y={77} />

        {/* 4: nose cone + antenna */}
        {dock(4, { y: -50 }, <>
          <path d="M84 56c4-11 9-19 16-24 7 5 12 13 16 24Z" fill="var(--gold)" stroke="var(--gold)" />
          <path d="M100 32V14" stroke="var(--gold)" />
          <motion.circle cx="100" cy="12" r="3" fill="var(--teal)" animate={shown >= 4 ? { scale: [1, 1.6, 1] } : {}} transition={{ repeat: Infinity, duration: 1.4 }} />
        </>)}
        <Flash n={4} y={56} />

        {/* 5: engine nozzle + flame */}
        {dock(5, { y: 36 }, <>
          <path d="M86 168h28l5 16H81Z" fill="var(--primary)" stroke="var(--teal)" />
          <motion.g style={{ transformOrigin: "100px 184px" }}
            animate={complete ? { scaleY: [1, 1.9, 1.5, 2.1], scaleX: [1, 1.1, .95, 1.1] } : { scaleY: [1, 1.15, .9, 1] }}
            transition={{ repeat: Infinity, duration: complete ? .35 : .8 }}>
            <path d="M84 186c0 20 16 40 16 40s16-20 16-40Z" fill="var(--teal)" opacity=".55" />
            <path d="M90 186c0 14 10 28 10 28s10-14 10-28Z" fill="var(--gold)" />
          </motion.g>
        </>)}
      </motion.svg>

      {/* exhaust smoke on launch */}
      {complete && [0, 1, 2, 3, 4, 5].map((i) => (
        <motion.span key={i} className="absolute bottom-0 left-1/2 h-6 w-6 rounded-full bg-muted"
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
