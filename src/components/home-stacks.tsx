import { motion, useReducedMotion } from "motion/react";
import { CAMPUS_COURSES } from "@/lib/offer-catalog";
import { CAMPUSES } from "@/lib/funnel";
import { IconArrowRight, IconPin, IconTick } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { CardStack } from "@/components/card-stack";
import { RocketAssembly } from "@/components/funnel-scenes";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import manchester from "@/assets/campuses/manchester.jpg";
import sunderland from "@/assets/campuses/sunderland.jpg";
import derby from "@/assets/campuses/derby.jpg";
import newcastle from "@/assets/campuses/newcastle.jpg";
import luton from "@/assets/campuses/luton.jpg";
import careerPhoto from "@/assets/audience/career.jpg";
import returningPhoto from "@/assets/audience/parent.jpg";
import noAlevelsPhoto from "@/assets/audience/no-alevels.jpg";

const ease = [0.23, 1, 0.32, 1] as const;
const CAMPUS_IMAGES: Record<string, string> = { Manchester: manchester, Sunderland: sunderland, Derby: derby, Newcastle: newcastle, Luton: luton };
const STACK_PEEK = 52;
// Counts come from the catalogue itself, so these figures can never disagree with the cards below them.
const DEGREE_COUNT = new Set(Object.values(CAMPUS_COURSES).flatMap((list) => list.map((c) => c.title))).size;
const UNIVERSITY_COUNT = new Set(Object.values(CAMPUS_COURSES).flatMap((list) => list.map((c) => c.university))).size;

function pickCampus(city: string) {
  window.dispatchEvent(new CustomEvent("mo:pick-city", { detail: city }));
  document.getElementById("signup")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
}

/** Campus cards: a wallet-style stack while scrolling on phones and tablets, a grid on large screens. */
export function CampusStack() {
  const { t } = useI18n();
  const facts: [number, string][] = [[CAMPUSES.length, t("facts.campuses", undefined, "campuses")], [DEGREE_COUNT, t("facts.degrees", undefined, "degrees")], [UNIVERSITY_COUNT, t("facts.universities", undefined, "awarding universities")]];
  return (
    <>
      <dl className="mt-6 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card">
        {facts.map(([n, label]) => <div key={label} className="flex flex-col-reverse px-3 py-3 text-center sm:px-5"><dt className="text-[11px] font-semibold uppercase leading-tight tracking-[.1em] text-muted-foreground">{label}</dt><dd className="font-display text-3xl font-bold italic text-primary">{n}</dd></div>)}
      </dl>
      <CardStack peek={STACK_PEEK} className="mt-5 grid gap-4 [--stack-top:3.75rem] lg:grid-cols-6" itemClassName={(i) => cn("max-lg:[@media(min-height:560px)]:sticky", i < 2 ? "lg:col-span-3" : "lg:col-span-2")}>
        {CAMPUSES.map((campus) => {
          const courses = CAMPUS_COURSES[campus.name] ?? [];
          const titles = [...new Set(courses.map((c) => c.title.replace(/^\S+ \S+ /, "")))];
          return (
            <article key={campus.name} className="group relative h-72 overflow-hidden rounded-2xl bg-primary shadow-[0_-12px_28px_-16px_rgb(0_0_0/.55)]">
              <img src={CAMPUS_IMAGES[campus.name]} alt={t("campus.photoAlt", { name: campus.name }, `${campus.name} city`)} width={960} height={720} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out hover-fine:group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-primary/25" />
              {/* the top strip is what stays visible once the next card has slid over this one */}
              <header className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 bg-gradient-to-b from-primary/90 to-transparent px-5 text-primary-foreground" style={{ height: STACK_PEEK + 12 }}>
                <h3 className="font-display text-xl font-bold italic">{campus.name}</h3>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-primary-foreground/85"><IconPin size={14} className="text-gold" />{titles.length} {titles.length === 1 ? t("campus.degree", undefined, "degree") : t("campus.degrees", undefined, "degrees")}</p>
              </header>
              <div className="absolute inset-x-0 bottom-0 p-5 text-primary-foreground">
                <p className="text-sm font-semibold text-primary-foreground/90">{campus.full}</p>
                <p className="mt-2 text-xs leading-relaxed text-primary-foreground/85">{titles.join(" · ")}</p>
                <p className="mt-2 line-clamp-1 text-xs text-primary-foreground/70">{[...new Set(courses.flatMap((c) => c.patterns))].slice(0, 2).join(" · ")}</p>
                <Button type="button" variant="secondary" size="sm" onClick={() => pickCampus(campus.name)} className="mt-3 w-fit">{t("campus.cta", undefined, "See my options")} <IconArrowRight size={15} /></Button>
              </div>
            </article>
          );
        })}
      </CardStack>
    </>
  );
}

/** The five stages as a stack: each card adds what you do, what you get, and one more part of the rocket. */
export function JourneyStack({ steps }: { steps: { title: string; text: string }[] }) {
  const { t } = useI18n();
  const you = t("journey.byYou", undefined, "You");
  const together = t("journey.byTogether", undefined, "Together");
  const detail: { by: string; label: string; items: string[] }[] = [
    { by: you, label: t("journey.get", undefined, "You get"), items: [t("journey.d1a", undefined, "A five-page personalised pack: degree, entry route, campus and study pattern"), t("journey.d1b", undefined, "One application reference to keep")] },
    { by: you, label: t("journey.choice", undefined, "Your choice"), items: [t("journey.d2a", undefined, "Carry on in WhatsApp"), t("journey.d2b", undefined, "Or ask an advisor to call you before you share anything else")] },
    { by: together, label: t("home.docsTitle", undefined, "Documents commonly requested"), items: [t("home.doc1", undefined, "Proof of identity"), t("home.doc2", undefined, "Proof of address dated within three months of the course start"), t("home.doc3", undefined, "Share code if your passport is not British"), t("home.doc4", undefined, "Duolingo English certificate"), t("home.doc5", undefined, "CV and qualification certificates, if available")] },
    { by: you, label: t("journey.expect", undefined, "What to expect"), items: [t("journey.d4a", undefined, "A short written pre-task, with guidance"), t("journey.d4b", undefined, "One assessment day on campus")] },
    { by: "Momentum One", label: t("journey.then", undefined, "And then"), items: [t("journey.d5a", undefined, "We confirm your next step"), t("journey.d5b", undefined, "Optional student account: your course, stage and next action in one place")] },
  ];
  return (
    <CardStack peek={STACK_PEEK} className="mt-8 grid gap-4 [--stack-top:3.75rem] lg:[--stack-top:5rem]" itemClassName={() => "[@media(min-height:560px)]:sticky"}>
      {steps.map((step, i) => {
        const more = detail[i];
        return (
          <article key={i} className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_-12px_28px_-18px_rgb(0_0_0/.4)]">
            <header className="flex items-center gap-3 px-4 sm:px-6" style={{ height: STACK_PEEK }}>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{i + 1}</span>
              <h3 className="line-clamp-2 min-w-0 font-sans text-[15px] font-bold leading-tight text-foreground sm:text-lg">{step.title}</h3>
              {more && <span className="ml-auto shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-teal">{more.by}</span>}
            </header>
            <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-3 px-4 pb-5 sm:px-6 lg:grid-cols-[1fr_1.1fr_auto] lg:gap-x-10">
              <p className="text-sm leading-relaxed text-muted-foreground lg:pt-1">{step.text}</p>
              <RocketAssembly step={Math.min(i, 4)} className="row-span-2 mx-0 self-center lg:order-last lg:row-span-1" sizeClassName="h-24 lg:h-28" labelClassName="hidden" />
              {more && <div>
                <p className="text-[11px] font-bold uppercase tracking-[.14em] text-teal">{more.label}</p>
                <ul className="mt-2 grid gap-1.5 text-sm text-foreground">{more.items.map((item) => <li key={item} className="flex items-start gap-2"><IconTick size={16} className="mt-0.5 shrink-0 text-teal" />{item}</li>)}</ul>
              </div>}
            </div>
          </article>
        );
      })}
    </CardStack>
  );
}

/** Who it's for: a real photo per situation, with a small animated figure that shows the point instead of stating a number. */
export function AudienceCards() {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const audience = [
    { photo: careerPhoto, title: t("audience.title1", undefined, "Changing career"), text: t("audience.text1", undefined, "Study on evenings or set days around the job you already have."), figure: <WeekFigure /> },
    { photo: returningPhoto, title: t("audience.title2", undefined, "Returning to learning"), text: t("audience.text2", undefined, "A Foundation Year eases you back in, with support before you start."), figure: <PathFigure /> },
    { photo: noAlevelsPhoto, title: t("audience.title3", undefined, "No A-levels"), text: t("audience.text3", undefined, "Foundation routes are built for people without the usual grades."), figure: <EntryFigure /> },
  ];
  return (
    <div className="no-scrollbar -mx-5 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0">
      {audience.map((a) => (
        <article key={a.title} className="w-[84%] shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-card md:w-auto">
          <div className="relative h-64 overflow-hidden bg-primary">
            <motion.img src={a.photo} alt="" width={800} height={1008} loading="lazy" className="absolute inset-0 h-full w-full object-cover object-[50%_22%]"
              initial={{ transform: "scale(1)" }} whileInView={{ transform: reduce ? "scale(1)" : "scale(1.07)" }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 7, ease: "linear" }} />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-primary/85 to-transparent" />
            <div className="absolute inset-x-3 bottom-3 rounded-xl border border-primary-foreground/20 bg-primary/75 p-3 text-primary-foreground backdrop-blur-md">{a.figure}</div>
          </div>
          <div className="p-5"><h3 className="font-sans text-lg font-bold text-primary">{a.title}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{a.text}</p></div>
        </article>
      ))}
    </div>
  );
}

const reveal = { hidden: { opacity: 0, transform: "translateY(6px) scale(0.96)" }, shown: { opacity: 1, transform: "translateY(0px) scale(1)" } };
// Parent variants only orchestrate: children share the labels and enter one after another.
const group = (stagger: number) => ({ hidden: {}, shown: { transition: { staggerChildren: stagger, delayChildren: 0.15 } } });
const figureProps = { whileInView: "shown", viewport: { once: true, amount: 0.8 } } as const;

/** A week at a glance: the job fills the weekdays, study lands on two evenings. */
function WeekFigure() {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const days = t("figure.days", undefined, "M T W T F S S").split(" ");
  return (
    <motion.div {...figureProps} variants={group(0.12)} initial={reduce ? "shown" : "hidden"} aria-hidden>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day, i) => (
          <div key={i} className="grid gap-1">
            <span className="text-center text-[10px] font-bold text-primary-foreground/70">{day}</span>
            <span className={cn("h-3.5 rounded-sm", i < 5 ? "bg-primary-foreground/30" : "bg-primary-foreground/10")} />
            {i < 2 ? <motion.span variants={reveal} transition={{ duration: 0.4, ease }} className="h-3.5 rounded-sm bg-gold" /> : <span className="h-3.5 rounded-sm bg-primary-foreground/10" />}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-4 text-[11px] font-semibold">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-primary-foreground/40" />{t("figure.work", undefined, "Work")}</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-gold" />{t("figure.study", undefined, "Study, two evenings")}</span>
      </div>
    </motion.div>
  );
}

/** The route back in: Foundation Year first, then the degree years. */
function PathFigure() {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const stops = ["Foundation Year", "Year 1", t("figure.degree", undefined, "Your degree")];
  return (
    <motion.div {...figureProps} variants={group(0.22)} initial={reduce ? "shown" : "hidden"} aria-hidden className="relative grid grid-cols-3">
      <span className="absolute left-[16.6%] right-[16.6%] top-[7px] h-0.5 bg-primary-foreground/25" />
      {stops.map((stop, i) => (
        <motion.div key={stop} variants={reveal} transition={{ duration: 0.4, ease }} className="relative grid justify-items-center gap-1.5">
          <span className={cn("h-4 w-4 rounded-full border-2", i === 0 ? "border-gold bg-gold" : "border-gold bg-primary")} />
          <span className="text-center text-[11px] font-semibold leading-tight">{stop}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

/** What entry actually rests on when there are no A-levels. */
function EntryFigure() {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const checks = [t("figure.application", undefined, "Your application"), t("figure.assessment", undefined, "An assessment day")];
  return (
    <motion.ul {...figureProps} variants={group(0.18)} initial={reduce ? "shown" : "hidden"} aria-hidden className="grid gap-1.5 text-xs font-semibold">
      <motion.li variants={reveal} transition={{ duration: 0.4, ease }} className="flex items-center justify-between gap-3 text-primary-foreground/60"><span className="line-through">A-levels</span><span className="rounded-full border border-primary-foreground/30 px-2 py-0.5 text-[10px] uppercase tracking-wider">{t("figure.notNeeded", undefined, "Not needed to apply")}</span></motion.li>
      {checks.map((check) => <motion.li key={check} variants={reveal} transition={{ duration: 0.4, ease }} className="flex items-center gap-2"><span className="grid h-4 w-4 place-items-center rounded-full bg-gold text-primary"><IconTick size={11} /></span>{check}</motion.li>)}
    </motion.ul>
  );
}
