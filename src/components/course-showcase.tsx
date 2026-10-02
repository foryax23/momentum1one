import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import { CAMPUS_COURSES, type CourseOption } from "@/lib/offer-catalog";
import { CAMPUSES } from "@/lib/funnel";
import { pickCourse, type CoursePick } from "@/components/home-sections";
import { IconArrowRight, IconClock, IconClose, IconPin, IconUniversity } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { easeOut, spring } from "@/lib/motion";
import business from "@/assets/courses/business.webp";
import marketing from "@/assets/courses/marketing.webp";
import care from "@/assets/courses/care.webp";
import fashion from "@/assets/courses/fashion.webp";
import events from "@/assets/courses/events.webp";
import psychology from "@/assets/courses/psychology.webp";
import publicHealth from "@/assets/courses/public-health.webp";
import manchester from "@/assets/campuses/manchester-thumb.webp";
import sunderland from "@/assets/campuses/sunderland-thumb.webp";
import derby from "@/assets/campuses/derby-thumb.webp";
import newcastle from "@/assets/campuses/newcastle-thumb.webp";
import luton from "@/assets/campuses/luton-thumb.webp";

const CAMPUS_IMAGES: Record<string, string> = { Manchester: manchester, Sunderland: sunderland, Derby: derby, Newcastle: newcastle, Luton: luton };
// Each course gets its own photo, accent and one-line subject summary (English fallback; translated through `course.blurb.*`).
const COURSE_LOOK: Record<string, { photo: string; accent: string; blurb: string }> = {
  business: { photo: business, accent: "#E8B04A", blurb: "Lead teams, plan budgets and run organisations." },
  marketing: { photo: marketing, accent: "#FF8A65", blurb: "Campaigns, content, brand and analytics." },
  care: { photo: care, accent: "#4FD1C5", blurb: "Care, wellbeing and the services that support people." },
  fashion: { photo: fashion, accent: "#D6A4FF", blurb: "Brand, retail and the business of fashion." },
  events: { photo: events, accent: "#F58FB8", blurb: "Plan, budget and deliver live events." },
  psychology: { photo: psychology, accent: "#7CB7FF", blurb: "How people think, feel and behave." },
  "public-health": { photo: publicHealth, accent: "#6EE7A8", blurb: "The health of communities: prevention and policy." },
};
const DEFAULT_LOOK = { photo: business, accent: "#E8B04A", blurb: "" };
const SHEET_REST = "translate(0px, 0px) scale(1)";
// The card's own photo laid over the sheet for the first frames (and the last ones on the way back), so the picture never jumps while the sheet takes over.
const FACE: Variants = { hidden: { opacity: 1 }, open: { opacity: 0, transition: { duration: 0.25, delay: 0.05, ease: easeOut } }, closed: { opacity: 1, transition: { duration: 0.2, ease: easeOut } } };
const SHADOW: Variants = { hidden: { opacity: 0 }, open: { opacity: 1, transition: { duration: 0.25, delay: 0.2, ease: easeOut } }, closed: { opacity: 0, transition: { duration: 0.1, ease: easeOut } } };

type Course = { key: string; award: string; name: string; title: string; university: string; routes: CourseOption["route"][]; campuses: { name: string; full: string; options: CourseOption[] }[] };

function buildCourses(): Course[] {
  const map = new Map<string, Course>();
  for (const [campus, list] of Object.entries(CAMPUS_COURSES)) {
    for (const option of list) {
      const key = option.id.replace(/-(foundation|year-1)$/, "");
      const [award = "", honours = "", ...rest] = option.title.split(" ");
      const course = map.get(key) ?? { key, award: `${award} ${honours}`, name: rest.join(" "), title: option.title, university: option.university, routes: [], campuses: [] };
      if (!course.routes.includes(option.route)) course.routes.push(option.route);
      const at = course.campuses.find((item) => item.name === campus);
      if (at) at.options.push(option);
      else course.campuses.push({ name: campus, full: CAMPUSES.find((item) => item.name === campus)?.full ?? campus, options: [option] });
      map.set(key, course);
    }
  }
  return [...map.values()];
}

/** The seven degrees as a swipeable slideshow; pressing a card grows it into a sheet with its campuses, routes and timetables. */
export function CourseShowcase() {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const courses = useMemo(buildCourses, []);
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  // The row cannot scroll further: where several cards fit, that happens before the last one is the current one.
  const [atEnd, setAtEnd] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);
  // Width / height of the pressed card; 0 means "just fade" (reduced motion).
  const [ratio, setRatio] = useState(0);
  // A choice made inside the sheet is applied once the sheet has closed, so the page only starts moving after the card is back in place.
  const pending = useRef<CoursePick | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const openCourse = (key: string, from: HTMLElement) => { opener.current = from; const { width, height } = from.getBoundingClientRect(); setRatio(reduce || !height ? 0 : width / height); setOpenKey(key); };
  const open = courses.find((course) => course.key === openKey) ?? null;

  // The current slide is the first one that is mostly inside the row: the centred card on phones, the leading card where two or three fit.
  // No scroll listener: swiping stays native, and React only hears about it when the slide really changes.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const slides = Array.from(el.children);
    const shown = new Set<number>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) { const i = slides.indexOf(entry.target); if (entry.intersectionRatio >= 0.6) shown.add(i); else shown.delete(i); }
      // Mid-swipe no slide may qualify: keep the last answer.
      if (!shown.size) return;
      setIndex(Math.min(...shown));
      setAtEnd(shown.has(slides.length - 1));
    }, { root: el, threshold: 0.6 });
    slides.forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, []);

  const go = (i: number) => {
    const el = track.current;
    const first = el?.firstElementChild as HTMLElement | null | undefined;
    const slide = el?.children[Math.max(0, Math.min(courses.length - 1, i))] as HTMLElement | undefined;
    // The first slide rests on its snap point when the row is at 0 (centred on phones, leading from sm up), so the distance between two slides is the scroll position that snaps to the other one.
    if (el && first && slide) el.scrollTo({ left: slide.offsetLeft - first.offsetLeft, behavior: reduce ? "auto" : "smooth" });
  };
  const choose = (detail: CoursePick) => { pending.current = detail; setOpenKey(null); };
  // Wait until the dialog has really unmounted and released its scroll lock; scrolling to the funnel any earlier is undone by the unlock.
  const applyPending = () => {
    const detail = pending.current;
    pending.current = null;
    if (detail) window.setTimeout(() => pickCourse(detail), 80);
  };

  return (
    <div onKeyDown={(e) => { if (openKey) return; if (e.key === "ArrowRight") go(index + 1); if (e.key === "ArrowLeft") go(index - 1); }}>
      <div className="mt-6 flex items-end justify-between gap-4">
        <p className="text-sm tabular-nums text-muted-foreground"><span className="font-display text-2xl font-bold italic text-primary">{String(index + 1).padStart(2, "0")}</span> / {String(courses.length).padStart(2, "0")}</p>
        <div className="flex gap-2">
          <SlideButton label={t("deck.prev", undefined, "Previous course")} onClick={() => go(index - 1)} disabled={index === 0} flip />
          <SlideButton label={t("deck.next", undefined, "Next course")} onClick={() => go(index + 1)} disabled={atEnd} />
        </div>
      </div>

      <div ref={track} tabIndex={0} aria-label={t("nav.courses", undefined, "Courses")} className="no-scrollbar -mx-5 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[11vw] pb-4 pt-2 outline-none sm:-mx-8 sm:gap-5 sm:px-8 sm:scroll-px-8">
        {courses.map((course, i) => {
          const look = COURSE_LOOK[course.key] ?? DEFAULT_LOOK;
          return (
            <div key={course.key} className={cn("w-[78vw] shrink-0 snap-center transition-opacity duration-200 ease-out sm:w-[44%] sm:snap-start lg:w-[31%]", i !== index && "max-sm:opacity-55")}>
              <article role="button" tabIndex={0} aria-haspopup="dialog"
                aria-label={`${course.title}. ${t("course.open", undefined, "See campuses and timetables")}`}
                onClick={(e) => openCourse(course.key, e.currentTarget)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openCourse(course.key, e.currentTarget); } }}
                className="group relative h-[27rem] cursor-pointer overflow-hidden rounded-[24px] sm:aspect-[4/5] sm:h-auto bg-primary text-primary-foreground shadow-lg outline-none transition-[scale,box-shadow] duration-150 ease-out focus-visible:ring-4 focus-visible:ring-teal/40 active:scale-[.98] hover-fine:hover:shadow-2xl">
                <img src={look.photo} alt="" width={720} height={900} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/45 to-primary/10" />
                <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                  <span className="rounded-full bg-card px-2.5 py-1 text-[11px] font-bold text-primary">{course.award}</span>
                  <span className="font-display text-sm font-bold italic" style={{ color: look.accent }}>{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <span className="block h-1 w-10 rounded-full" style={{ background: look.accent }} />
                  <h3 className="mt-3 font-display text-2xl font-bold italic leading-tight">{course.name}</h3>
                  <p className="mt-1.5 text-sm leading-snug text-primary-foreground/85">{t(`course.blurb.${course.key}`, undefined, look.blurb)}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold">
                    <span className="flex items-center gap-1 rounded-full border border-primary-foreground/30 px-2.5 py-1"><IconPin size={12} />{course.campuses.length} {course.campuses.length === 1 ? t("compare.campus", undefined, "campus") : t("compare.campuses", undefined, "campuses")}</span>
                    {course.routes.map((route) => <span key={route} className="rounded-full border border-primary-foreground/30 px-2.5 py-1">{route}</span>)}
                  </div>
                  <p className="mt-4 flex items-center justify-between gap-3 border-t border-primary-foreground/20 pt-3 text-sm font-bold">
                    {t("course.open", undefined, "See campuses and timetables")}
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-primary transition-transform duration-200 ease-out hover-fine:group-hover:translate-x-0.5" style={{ background: look.accent }}><IconArrowRight size={18} /></span>
                  </p>
                </div>
              </article>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex justify-center gap-1.5">
        {courses.map((course, i) => <button key={course.key} type="button" aria-label={t("deck.show", { name: course.name }, `Show ${course.name}`)} aria-current={i === index} onClick={() => go(i)} className={cn("h-2 rounded-full transition-colors duration-200", i === index ? "w-6 bg-primary" : "w-2 bg-border")} />)}
      </div>

      <Dialog.Root open={openKey !== null} onOpenChange={(next) => { if (!next) setOpenKey(null); }}>
        <AnimatePresence onExitComplete={applyPending}>
          {open && <CourseSheet key={open.key} course={open} origin={opener} ratio={ratio} onChoose={choose} onClosed={() => { if (!pending.current) opener.current?.focus({ preventScroll: true }); }} />}
        </AnimatePresence>
      </Dialog.Root>
    </div>
  );
}

/** The sheet starts as the card it was opened from and goes back to it. Only transforms and opacity move, so the browser can run all of it off the main thread: one uniform scale (nothing inside is stretched), and a bottom edge that is revealed by sliding a clipping box one way and its content the other by the same amount. */
function CourseSheet({ course, origin, ratio, onChoose, onClosed }: { course: Course; origin: RefObject<HTMLElement | null>; ratio: number; onChoose: (detail: CoursePick) => void; onClosed: () => void }) {
  const { t } = useI18n();
  const look = COURSE_LOOK[course.key] ?? DEFAULT_LOOK;
  const box = useRef<HTMLDivElement>(null);
  const entered = useRef<{ transform: string; tuck: number } | null | undefined>(undefined);
  // Where the card sits, in the sheet's own terms. Read when an animation starts (never while rendering), so closing lands on the card wherever it is by then.
  const dock = () => {
    const el = box.current;
    const card = origin.current?.getBoundingClientRect();
    if (!ratio || !el || !card?.width) return null;
    const scale = card.width / el.offsetWidth;
    return { transform: `translate(${card.left - el.offsetLeft}px, ${card.top - el.offsetTop}px) scale(${scale})`, tuck: Math.max(0, el.offsetHeight - card.height / scale) };
  };
  // Measured once on the way in, so a re-render while the sheet is open cannot replay the entrance.
  const enter = () => { if (entered.current === undefined) entered.current = dock(); return entered.current; };
  const sheet: Variants = {
    hidden: { opacity: 0 },
    open: () => { const from = enter(); return from ? { opacity: 1, transform: [from.transform, SHEET_REST], transition: { default: spring, opacity: { duration: 0.12, ease: easeOut } } } : { opacity: 1, transition: { duration: 0.2, ease: easeOut } }; },
    closed: () => { const to = dock(); return to ? { opacity: 0, transform: to.transform, transition: { default: spring, opacity: { duration: 0.15, delay: 0.3, ease: easeOut } } } : { opacity: 0, transition: { duration: 0.15, ease: easeOut } }; },
  };
  // dir -1 is the clipping box, +1 its content: equal and opposite, so the content stays put while the box's bottom edge travels.
  const slide = (dir: number): Variants => ({
    hidden: {},
    open: () => { const from = enter(); return from ? { transform: [`translateY(${dir * from.tuck}px)`, "translateY(0px)"], transition: spring } : {}; },
    closed: () => { const to = dock(); return to ? { transform: `translateY(${dir * to.tuck}px)`, transition: spring } : {}; },
  });
  return (
    <Dialog.Portal forceMount>
      <Dialog.Overlay forceMount asChild>
        {/* A plain dim. Blurring the whole page behind a moving sheet is the most expensive thing a phone can be asked to draw. */}
        <motion.div className="fixed inset-0 z-[60] bg-primary/75" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: easeOut }} />
      </Dialog.Overlay>
      <Dialog.Content forceMount asChild aria-describedby={undefined} onCloseAutoFocus={(event) => { event.preventDefault(); onClosed(); }}>
        <motion.div ref={box} variants={sheet} initial="hidden" animate="open" exit="closed" className="fixed inset-x-3 bottom-3 top-3 z-[60] mx-auto max-w-2xl origin-top-left outline-none sm:bottom-8 sm:top-8">
          {/* The shadow is its own layer: the clipping box would cut it off, and this way it is drawn once and only faded. */}
          <motion.div aria-hidden variants={SHADOW} className="pointer-events-none absolute inset-0 rounded-[28px] shadow-2xl" />
          {/* The clipping box starts above the sheet (and the sheet that far down inside it) so the spring's small overshoot never shaves the top edge. It ignores the pointer so that strip still closes the sheet like the rest of the backdrop. */}
          <motion.div variants={slide(-1)} className="pointer-events-none absolute inset-x-0 -top-4 bottom-0 overflow-hidden rounded-b-[28px]">
          <motion.div variants={slide(1)} className="pointer-events-auto absolute inset-x-0 bottom-0 top-4 flex flex-col overflow-hidden rounded-[28px] bg-card">
          <div className="relative h-48 shrink-0 overflow-hidden bg-primary text-primary-foreground sm:h-60">
            <img src={look.photo} alt="" width={720} height={900} decoding="async" className="absolute inset-0 h-full w-full object-cover object-[50%_30%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/50 to-primary/10" />
            <Dialog.Close aria-label={t("course.close", undefined, "Close")} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-card text-primary transition-[scale] duration-150 ease-out active:scale-95"><IconClose size={18} /></Dialog.Close>
            <div className="absolute inset-x-0 bottom-0 p-5">
              <span className="block h-1 w-10 rounded-full" style={{ background: look.accent }} />
              <p className="mt-3 text-xs font-bold uppercase tracking-[.16em] text-primary-foreground/75">{course.award}</p>
              <Dialog.Title className="font-display text-2xl font-bold italic leading-tight sm:text-3xl">{course.name}</Dialog.Title>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-primary"><IconUniversity size={18} className="shrink-0 text-teal" />{t("compare.awardedBy", { university: course.university }, `Awarded by ${course.university}`)}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`course.blurb.${course.key}`, undefined, look.blurb)}</p>

            <h4 className="mt-6 text-xs font-bold uppercase tracking-[.16em] text-teal">{t("course.where", undefined, "Campuses and timetables")}</h4>
            <ul className="mt-3 grid gap-3">
              {course.campuses.map((campus) => (
                <li key={campus.name} className="overflow-hidden rounded-2xl border border-border">
                  <div className="flex items-center gap-3 bg-secondary/60 p-3">
                    <img src={CAMPUS_IMAGES[campus.name]} alt="" width={132} height={132} loading="lazy" decoding="async" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                    <p className="min-w-0"><strong className="block text-primary">{campus.name}</strong><span className="block truncate text-xs text-muted-foreground">{campus.full}</span></p>
                  </div>
                  <ul className="divide-y divide-border">
                    {campus.options.map((option) => (
                      <li key={option.id} className="flex items-center gap-3 p-3">
                        <div className="min-w-0 flex-1">
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-teal">{option.route}</span>
                          <ul className="mt-2 grid gap-1 text-xs text-muted-foreground">{option.patterns.map((pattern) => <li key={pattern} className="flex items-start gap-1.5"><IconClock size={13} className="mt-0.5 shrink-0" />{pattern}</li>)}</ul>
                        </div>
                        <Button type="button" size="sm" onClick={() => onChoose({ title: option.title, route: option.route, campus: campus.name })} aria-label={`${t("compare.choose", undefined, "Choose this")}: ${campus.name}, ${option.route}`} className="h-10 shrink-0 rounded-xl px-3 font-bold">{t("compare.choose", undefined, "Choose this")} <IconArrowRight size={15} /></Button>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>

          <div className="shrink-0 border-t border-border bg-card p-3 pb-[max(.75rem,env(safe-area-inset-bottom))]">
            <Button type="button" onClick={() => onChoose(course.title)} className="h-12 w-full rounded-xl font-bold">{t("home.cta", undefined, "Check my options")} <IconArrowRight size={18} /></Button>
          </div>

          {ratio > 0 && (
            <motion.div aria-hidden variants={FACE} style={{ aspectRatio: ratio }} className="pointer-events-none absolute left-0 top-0 max-h-full w-full bg-primary">
              <img src={look.photo} alt="" width={720} height={900} decoding="async" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/45 to-primary/10" />
            </motion.div>
          )}
          </motion.div>
          </motion.div>
        </motion.div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

function SlideButton({ label, onClick, flip, disabled }: { label: string; onClick: () => void; flip?: boolean; disabled?: boolean }) {
  return <button type="button" aria-label={label} onClick={onClick} disabled={disabled} className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card text-primary transition-[scale,background-color,color,opacity] duration-150 ease-out hover-fine:hover:bg-primary hover-fine:hover:text-primary-foreground active:scale-95 disabled:pointer-events-none disabled:opacity-40"><IconArrowRight size={18} className={flip ? "rotate-180" : ""} /></button>;
}
