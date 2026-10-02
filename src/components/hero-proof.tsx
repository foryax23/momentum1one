import { GraduationCap, UserRound, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

const group = { hidden: {}, shown: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } };
const pop = { hidden: { opacity: 0, transform: "translateY(4px) scale(0.92)" }, shown: { opacity: 1, transform: "translateY(0px) scale(1)" } };
// Reduced motion keeps the fade and drops the travel: the transform jumps to rest while the disc is still invisible. (MotionConfig's reducedMotion does not cover a `transform` string.)
const popIn = (reduce: boolean | null) => (reduce ? { duration: 0.3, ease: easeOut, transform: { duration: 0 } } : { duration: 0.3, ease: easeOut });

/** Trust line for the hero: who is behind the service and how many people it has helped, as two small icon stacks. */
export function HeroProof({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <div className={cn("grid grid-cols-2 overflow-hidden rounded-xl border border-primary-foreground/15 bg-primary/70", className)}>
      <Proof icon={UserRound} badge="10+" title={t("home.team", undefined, "10+ team")} text={t("home.teamSub", undefined, "supporting applicants")} />
      <Proof icon={GraduationCap} badge="500+" title={t("home.students", undefined, "500+ students")} text={t("home.studentsSub", undefined, "helped")} className="border-l border-primary-foreground/15" />
    </div>
  );
}

function Proof({ icon: Icon, badge, title, text, className }: { icon: LucideIcon; badge: string; title: string; text: string; className?: string }) {
  const transition = popIn(useReducedMotion());
  return (
    <div className={cn("flex flex-col gap-2.5 p-3.5 sm:flex-row sm:items-center sm:gap-3 sm:p-4", className)}>
      <motion.div variants={group} initial="hidden" whileInView="shown" viewport={{ once: true, amount: 0.6 }} className="flex shrink-0" aria-hidden>
        {[0, 1, 2].map((i) => (
          // solid fill (not a translucent one) so each disc cleanly covers the one it overlaps
          <motion.span key={i} variants={pop} transition={transition} style={{ backgroundColor: "color-mix(in oklab, var(--primary-foreground) 14%, var(--primary))" }} className={cn("grid h-7 w-7 place-items-center rounded-full text-primary-foreground/85 ring-2 ring-primary", i > 0 && "-ml-2")}><Icon size={14} strokeWidth={1.75} /></motion.span>
        ))}
        <motion.span variants={pop} transition={transition} className="-ml-2 grid h-7 min-w-7 place-items-center rounded-full bg-gold px-1.5 text-[10px] font-bold tabular-nums text-primary ring-2 ring-primary">{badge}</motion.span>
      </motion.div>
      <p className="min-w-0 text-xs leading-snug text-primary-foreground/70"><strong className="block text-sm font-bold leading-tight text-primary-foreground">{title}</strong>{text}</p>
    </div>
  );
}
