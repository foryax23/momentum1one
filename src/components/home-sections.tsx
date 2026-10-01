import { useEffect, useMemo, useRef, useState } from "react";
import { animate, motion, useInView, useReducedMotion, useScroll, useTransform } from "motion/react";
import { CAMPUS_COURSES } from "@/lib/offer-catalog";
import { CAMPUSES } from "@/lib/funnel";
import { IconArrowRight } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import business from "@/assets/courses/business.jpg";
import marketing from "@/assets/courses/marketing.jpg";
import care from "@/assets/courses/care.jpg";
import publicHealth from "@/assets/courses/public-health.jpg";
import psychology from "@/assets/courses/psychology.jpg";
import fashion from "@/assets/courses/fashion.jpg";
import events from "@/assets/courses/events.jpg";
import manchester from "@/assets/campuses/manchester.jpg";
import sunderland from "@/assets/campuses/sunderland.jpg";
import derby from "@/assets/campuses/derby.jpg";
import newcastle from "@/assets/campuses/newcastle.jpg";
import luton from "@/assets/campuses/luton.jpg";
import career from "@/assets/audience/career.jpg";
import parent from "@/assets/audience/parent.jpg";
import noAlevels from "@/assets/audience/no-alevels.jpg";

const ease = [0.22, 1, 0.36, 1] as const;
const IMAGES: Record<string, string> = { business, marketing, care, "public-health": publicHealth, psychology, fashion, events };
const CAMPUS_IMAGES: Record<string, string> = { Manchester: manchester, Sunderland: sunderland, Derby: derby, Newcastle: newcastle, Luton: luton };

type DeckCourse = { key: string; award: string; name: string; title: string; university: string; campuses: string[]; routes: string[]; image: string };

function buildDeck(): DeckCourse[] {
  const map = new Map<string, DeckCourse>();
  for (const [campus, list] of Object.entries(CAMPUS_COURSES)) {
    for (const c of list) {
      const key = c.id.replace(/-(foundation|year-1)$/, "");
      const existing = map.get(key);
      if (existing) {
        if (!existing.campuses.includes(campus)) existing.campuses.push(campus);
        if (!existing.routes.includes(c.route)) existing.routes.push(c.route);
      } else {
        const [award, ...rest] = c.title.split(" ");
        map.set(key, { key, award: `${award} ${rest.shift()}`, name: rest.join(" "), title: c.title, university: c.university, campuses: [campus], routes: [c.route], image: IMAGES[key] ?? business });
      }
    }
  }
  return [...map.values()];
}

export function pickCourse(title: string) {
  window.dispatchEvent(new CustomEvent("mo:pick-course", { detail: title }));
  document.getElementById("signup")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function pickCampus(city: string) {
  window.dispatchEvent(new CustomEvent("mo:pick-city", { detail: city }));
  document.getElementById("signup")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function CourseDeck() {
  const deck = useMemo(buildDeck, []);
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const reduce = useReducedMotion();

  const scrollTo = (i: number) => {
    const el = track.current;
    const card = el?.children[i] as HTMLElement | undefined;
    if (el && card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: reduce ? "auto" : "smooth" });
  };
  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    const card = el.children[0] as HTMLElement | undefined;
    const w = card ? card.offsetWidth + 20 : 1;
    setIndex(Math.min(deck.length - 1, Math.round(el.scrollLeft / w)));
  };
  useEffect(() => {
    if (paused || reduce) return;
    const t = window.setInterval(() => {
      const el = track.current;
      if (!el) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
      scrollTo(atEnd ? 0 : index + 1);
    }, 4500);
    return () => window.clearInterval(t);
  }, [paused, index, reduce]);

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => { setPaused(false); setActive(null); }} onTouchStart={() => setPaused(true)} onFocus={() => setPaused(true)}
      onKeyDown={(e) => { if (e.key === "ArrowRight") scrollTo(Math.min(deck.length - 1, index + 1)); if (e.key === "ArrowLeft") scrollTo(Math.max(0, index - 1)); }}>
      <div className="flex items-end justify-between gap-4">
        <p className="text-sm text-muted-foreground">{String(index + 1).padStart(2, "0")} / {String(deck.length).padStart(2, "0")}</p>
        <div className="flex gap-2">
          <DeckButton label="Previous course" onClick={() => scrollTo(Math.max(0, index - 1))} flip />
          <DeckButton label="Next course" onClick={() => scrollTo(Math.min(deck.length - 1, index + 1))} />
        </div>
      </div>
      <div ref={track} onScroll={onScroll} tabIndex={0} aria-label="Courses" className="no-scrollbar -mx-5 mt-5 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-5 px-5 pb-4 pt-3 outline-none sm:-mx-8 sm:scroll-px-8 sm:px-8">
        {deck.map((c, i) => {
          const open = active === c.key;
          return (
            <motion.article key={c.key} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(i * .07, .35), duration: .7, ease }}
              onClick={() => setActive(open ? null : c.key)} data-open={open}
              className="group relative aspect-[4/5] w-[78%] shrink-0 cursor-pointer snap-start overflow-hidden rounded-2xl bg-primary shadow-lg transition-[transform,box-shadow] duration-500 hover:-translate-y-2 hover:shadow-2xl data-[open=true]:-translate-y-2 sm:w-[46%] lg:w-[31%]">
              <img src={c.image} alt={c.name} width={960} height={1200} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-110 group-data-[open=true]:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/40 to-transparent" />
              <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
                {c.routes.map((r) => <span key={r} className="rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-bold text-primary backdrop-blur">{r}</span>)}
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5 text-primary-foreground">
                <p className="text-xs font-bold uppercase tracking-[.16em] text-primary-foreground/70">{c.award}</p>
                <h3 className="mt-1 font-display text-2xl font-bold italic leading-tight">{c.name}</h3>
                <p className="mt-1 text-sm text-primary-foreground/80">{c.university}</p>
                <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 group-hover:grid-rows-[1fr] group-focus-within:grid-rows-[1fr] group-data-[open=true]:grid-rows-[1fr]">
                  <div className="overflow-hidden">
                    <div className="mt-4 flex flex-wrap gap-1.5">{c.campuses.map((x) => <span key={x} className="rounded-full border border-primary-foreground/30 px-2.5 py-1 text-xs font-semibold">{x}</span>)}</div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); pickCourse(c.title); }} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-card text-sm font-bold text-primary transition active:scale-[.98]">Check my options <IconArrowRight size={18} /></button>
                  </div>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-border"><motion.div className="h-full rounded-full bg-teal" animate={{ width: `${((index + 1) / deck.length) * 100}%` }} transition={{ duration: .5, ease }} /></div>
        <div className="flex gap-1.5">{deck.map((c, i) => <button key={c.key} type="button" aria-label={`Show ${c.name}`} onClick={() => scrollTo(i)} className={cn("h-2 rounded-full transition-all", i === index ? "w-6 bg-primary" : "w-2 bg-border")} />)}</div>
      </div>
    </div>
  );
}

function DeckButton({ label, onClick, flip }: { label: string; onClick: () => void; flip?: boolean }) {
  return <button type="button" aria-label={label} onClick={onClick} className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card text-primary transition hover:bg-primary hover:text-primary-foreground active:scale-95"><IconArrowRight size={18} className={flip ? "rotate-180" : ""} /></button>;
}

export function CampusCards() {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
      {CAMPUSES.map((campus, i) => {
        const courses = CAMPUS_COURSES[campus.name] ?? [];
        const titles = [...new Set(courses.map((c) => c.title.replace(/^\S+ \S+ /, "")))];
        return (
          <motion.article key={campus.name} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .08, duration: .6, ease }}
            className={cn("group relative h-72 overflow-hidden rounded-2xl bg-primary", i < 2 ? "lg:col-span-3" : "lg:col-span-2")}>
            <img src={CAMPUS_IMAGES[campus.name]} alt={`${campus.name} city`} width={960} height={720} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-primary-foreground">
              <div className="flex items-end justify-between gap-3">
                <div><h3 className="font-display text-2xl font-bold italic">{campus.name}</h3><p className="text-sm text-primary-foreground/80">{campus.full}</p></div>
                <p className="text-right"><span className="block font-display text-3xl font-bold italic">{titles.length}</span><span className="text-xs text-primary-foreground/70">{titles.length === 1 ? "degree" : "degrees"}</span></p>
              </div>
              <div className="grid max-h-0 overflow-hidden transition-all duration-500 group-hover:max-h-44 group-focus-within:max-h-44">
                <p className="mt-3 text-xs leading-relaxed text-primary-foreground/80">{titles.join(" · ")}</p>
                <p className="mt-2 line-clamp-2 text-xs text-primary-foreground/70">{[...new Set(courses.flatMap((c) => c.patterns))].slice(0, 2).join(" · ")}</p>
                <Button type="button" variant="secondary" size="sm" onClick={() => pickCampus(campus.name)} className="mt-3 w-fit">See my options <IconArrowRight size={15} /></Button>
              </div>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}

export function CourseComparison() {
  const deck = useMemo(buildDeck, []);
  const [selected, setSelected] = useState(deck[0]?.key ?? "");
  const course = deck.find((item) => item.key === selected) ?? deck[0];
  if (!course) return null;
  const options = Object.entries(CAMPUS_COURSES).flatMap(([campus, courses]) => courses.filter((item) => item.title === course.title).map((item) => ({ campus, ...item })));
  return (
    <div className="mt-8 grid gap-7 border-y border-border py-7 lg:grid-cols-[.8fr_1.2fr] lg:gap-12">
      <div>
        <p className="text-sm font-bold text-primary">Choose a subject</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {deck.map((item) => <Button key={item.key} type="button" variant={item.key === course.key ? "default" : "outline"} size="sm" onClick={() => setSelected(item.key)} className="h-auto rounded-full py-2 shadow-none">{item.name}</Button>)}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-[.14em] text-teal">Compare routes and schedules</p>
        <h3 className="mt-2 text-2xl font-bold italic text-primary">{course.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">Awarded by {course.university}</p>
        <div className="mt-5 divide-y divide-border border-y border-border">
          {options.map((item) => <div key={`${item.campus}-${item.id}`} className="grid gap-2 py-4 sm:grid-cols-[110px_130px_1fr_auto] sm:items-center">
            <strong className="text-sm text-primary">{item.campus}</strong><span className="text-sm font-semibold text-teal">{item.route}</span><span className="text-sm text-muted-foreground">{item.patterns.join(" · ")}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => pickCourse(item.title)} className="w-fit px-0 text-primary">Choose <IconArrowRight size={15} /></Button>
          </div>)}
        </div>
      </div>
    </div>
  );
}

export function WhatYouReceive() {
  const items = [
    ["01", "A five-page offer", "Your selected degree, entry route, campus and current study pattern in one document."],
    ["02", "A document checklist", "The identity, address and study documents to prepare before assessment."],
    ["03", "Advisor guidance", "A person checks your route, answers questions and supports the application."],
    ["04", "WhatsApp follow-up", "Continue the conversation from your phone and ask for an advisor when needed."],
  ];
  return <div className="grid gap-px overflow-hidden rounded-2xl border border-primary-foreground/15 bg-primary-foreground/15 md:grid-cols-4">{items.map(([n, title, text]) => <div key={n} className="bg-primary/90 p-6"><span className="font-display text-sm font-bold text-gold">{n}</span><h3 className="mt-8 text-lg font-bold text-primary-foreground">{title}</h3><p className="mt-2 text-sm leading-relaxed text-primary-foreground/70">{text}</p></div>)}</div>;
}

const AUDIENCE = [
  { img: career, title: "Changing career", text: "Study on evenings or set days around the job you already have." },
  { img: parent, title: "Returning to learning", text: "A Foundation Year eases you back in, with support before you start." },
  { img: noAlevels, title: "No A-levels", text: "Foundation routes are built for people without the usual grades." },
];

export function AudienceStrip() {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-3">
      {AUDIENCE.map((a, i) => (
        <motion.article key={a.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .1, duration: .6, ease }} className="group overflow-hidden rounded-2xl border border-border bg-card">
          <div className="aspect-[4/3] overflow-hidden"><img src={a.img} alt={a.title} width={800} height={1000} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-110" /></div>
          <div className="p-5"><h3 className="font-sans text-lg font-bold text-primary">{a.title}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{a.text}</p></div>
        </motion.article>
      ))}
    </div>
  );
}

function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const node = ref.current;
    const c = animate(0, to, { duration: 1.4, ease, onUpdate: (v) => { node.textContent = String(Math.round(v)); } });
    return () => c.stop();
  }, [inView, to]);
  return <span ref={ref}>{to}</span>;
}

export function StatsBand() {
  const stats: [number, string][] = [[7, "degree courses"], [5, "UK campuses"], [3, "awarding universities"], [1, "minute to check your options"]];
  return (
    <div className="grid grid-cols-2 gap-y-8 lg:grid-cols-4">
      {stats.map(([n, label]) => <div key={label} className="border-l border-primary-foreground/20 pl-5"><p className="font-display text-5xl font-bold italic text-primary-foreground sm:text-6xl"><CountUp to={n} /></p><p className="mt-1 text-sm text-primary-foreground/75">{label}</p></div>)}
    </div>
  );
}

export function ScrollTimeline({ steps }: { steps: { title: string; text: string }[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const height = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  return (
    <ol ref={ref} className="relative mt-10 grid max-w-3xl gap-8 pl-14">
      <span className="absolute bottom-2 left-5 top-2 w-0.5 bg-border" />
      <motion.span style={{ height }} className="absolute left-5 top-2 w-0.5 bg-teal" />
      {steps.map((s, i) => (
        <motion.li key={s.title} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: .6, ease }} className="relative">
          <span className="absolute -left-14 top-0 grid h-10 w-10 place-items-center rounded-full bg-primary font-display font-bold italic text-primary-foreground">{i + 1}</span>
          <h3 className="font-sans text-lg font-bold text-foreground">{s.title}</h3>
          <p className="mt-1 text-muted-foreground">{s.text}</p>
        </motion.li>
      ))}
    </ol>
  );
}
