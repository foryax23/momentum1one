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
