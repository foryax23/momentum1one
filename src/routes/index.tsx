import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import logo from "@/assets/logo.png";
import { Funnel } from "@/components/funnel";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { IconArrowRight, IconBook, IconCalendar, IconCampus, IconMortarboard, IconPassport, IconPin, IconSeal, IconTick } from "@/components/icons";
import { CAMPUSES } from "@/lib/funnel";
import type { ComponentType } from "react";

const TITLE = "Launch your UK degree | Momentum One";
const DESC = "Explore Foundation Year degrees in Manchester, Sunderland, Derby, Newcastle and Luton. Check your nearest campus in under a minute.";
const ease = [0.22, 1, 0.36, 1] as const;

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: TITLE }, { name: "description", content: DESC },
    { property: "og:title", content: TITLE }, { property: "og:description", content: DESC },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

type Course = { award: string; name: string; university: string; campuses: readonly string[]; yearOne?: boolean };
const COURSES: readonly Course[] = [
  { award: "BA (Hons)", name: "Business Management", university: "University of Wolverhampton", campuses: ["Manchester", "Sunderland", "Derby", "Newcastle"], yearOne: true },
  { award: "BA (Hons)", name: "Digital Marketing Management", university: "University of Wolverhampton", campuses: ["Manchester", "Sunderland", "Derby", "Newcastle"], yearOne: true },
  { award: "BA (Hons)", name: "Health and Social Care", university: "University of Wolverhampton", campuses: ["Manchester", "Sunderland", "Derby"] },
  { award: "BSc (Hons)", name: "Public Health", university: "University of Wolverhampton", campuses: ["Luton"] },
  { award: "BSc (Hons)", name: "Psychology", university: "Health Sciences University", campuses: ["Manchester", "Sunderland", "Derby"] },
  { award: "BSc (Hons)", name: "Fashion Management and Strategy", university: "Arts University Bournemouth", campuses: ["Manchester", "Sunderland", "Derby"] },
  { award: "BA (Hons)", name: "Events Management", university: "Arts University Bournemouth", campuses: ["Manchester", "Sunderland", "Derby"] },
] as const;

const JOURNEY: { Icon: ComponentType<{ size?: number; className?: string }>; title: string; text: string }[] = [
  { Icon: IconMortarboard, title: "Check your options", text: "Answer four quick questions." },
  { Icon: IconCampus, title: "Talk to an advisor", text: "Choose a course, campus and study pattern." },
  { Icon: IconPassport, title: "Prepare documents", text: "Get help with ID, address evidence and certificates." },
  { Icon: IconCalendar, title: "Attend PFF Day", text: "Complete the short pre-task and campus assessment." },
  { Icon: IconSeal, title: "Start your course", text: "Enrol after your application and assessment are approved." },
];

const FAQS: [string, string][] = [
  ["Do I need A-levels?", "Foundation Year routes do not require the usual grade profile to apply. Admission still depends on application review and passing the PFF assessment day."],
  ["Can I study while I work?", "Selected groups run during the day, evening or weekend. An advisor will confirm which patterns are available for your course and campus."],
  ["What documents will I need?", "Usually photo ID, proof of address, a share code where relevant, and any CV or certificates you have."],
  ["What is the PFF Day?", "Prepare for Foundation Day is a one-day campus assessment. You will receive guidance and a short written pre-task before attending."],
];

function Index() {
  return <main className="overflow-x-hidden bg-background">
    <Header />
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-9 sm:px-8 sm:py-14 lg:grid-cols-[1.05fr_.95fr] lg:gap-14 lg:py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, ease }} className="grid gap-5">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-teal">January 2027 applications</p>
        <h1 className="max-w-2xl text-[2.75rem] font-bold italic leading-[1.02] text-primary sm:text-6xl lg:text-[4.3rem]">Launch your <em className="text-teal">UK degree.</em></h1>
        <p className="max-w-[34ch] text-lg leading-relaxed text-muted-foreground">Foundation Year routes designed around real life, with support from first question to your first class.</p>
        <div className="flex flex-wrap gap-2">
          {["No long application", "Five UK campuses", "Seven degree courses"].map((item) => <span key={item} className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-sm font-medium text-primary"><IconTick size={15} />{item}</span>)}
        </div>
        <p className="text-sm text-muted-foreground">Degrees awarded by <strong className="font-semibold text-foreground">University of Wolverhampton, Arts University Bournemouth and Health Sciences University.</strong></p>
        <Button asChild className="h-12 w-full rounded-xl sm:hidden"><a href="#signup">Check my options <IconArrowRight /></a></Button>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2, duration: .9, ease }}><Funnel /></motion.div>
    </section>

    <section className="relative overflow-hidden rounded-t-[50%_70px] bg-primary text-primary-foreground sm:rounded-t-[50%_90px]">
      <Stars />
      <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-20 sm:px-8 sm:pb-20 sm:pt-24">
        <SectionHeading eyebrow="Why students choose this route" title="A university degree that fits your life" inverse centered />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Study around work", "Day, evening and weekend class patterns are available for selected groups."],
            ["Foundation Year included", "Start with a supported route into undergraduate study."],
            ["Campuses near home", "Options across Manchester, Sunderland, Derby, Newcastle and Luton."],
            ["Support at each step", "Get help choosing a course, preparing documents and getting ready for PFF Day."],
          ].map(([title, text], index) => <motion.div key={title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .1 }} className="border-t border-primary-foreground/20 pt-4"><h3 className="font-sans text-lg font-bold text-primary-foreground">{title}</h3><p className="mt-2 text-sm leading-relaxed text-primary-foreground/75">{text}</p></motion.div>)}
        </div>
      </div>
    </section>

    <Section id="courses"><SectionHeading eyebrow="Courses" title="Seven degrees to choose from" intro="All include a Foundation Year route. Business Management and Digital Marketing Management may also offer Year 1 entry in Manchester and Derby." />
      <div className="mt-8 border-t border-border">{COURSES.map((course, index) => <motion.article key={course.name} initial={{ opacity: 0, x: -15 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(index * .06, .3) }} className="grid gap-3 border-b border-border py-5 md:grid-cols-[1.25fr_.9fr_1.4fr] md:items-center md:gap-5"><div><p className="text-xs font-bold uppercase tracking-wider text-teal">{course.award}</p><h3 className="mt-1 font-sans text-lg font-bold text-foreground">{course.name}</h3></div><p className="text-sm text-muted-foreground">{course.university}</p><div className="flex flex-wrap gap-1.5">{course.campuses.map((campus) => <span key={campus} className="rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-semibold text-primary">{campus}</span>)}{course.yearOne && <span className="rounded-full border border-dashed border-primary/50 px-2.5 py-1 text-xs font-semibold text-primary">Year 1 option</span>}</div></motion.article>)}</div>
    </Section>

    <Section id="campuses"><SectionHeading eyebrow="Campuses" title="Study close to home" />
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-5">{CAMPUSES.map((campus, index) => { const count = COURSES.filter((course) => course.campuses.includes(campus.name as never)).length; return <motion.article key={campus.name} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .08 }} className="rounded-xl border border-border bg-card p-4"><IconPin className="text-teal" size={24} /><h3 className="mt-5 font-sans text-lg font-bold text-primary">{campus.name}</h3><p className="mt-1 text-sm text-muted-foreground">{campus.full}</p><p className="mt-4 text-4xl font-bold italic text-teal">{count}</p><p className="text-xs text-muted-foreground">degree {count === 1 ? "option" : "options"}</p><p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-primary">{campus.name === "Luton" ? "January 2027" : "Intake to be confirmed"}</p></motion.article>; })}</div>
    </Section>

    <Section id="journey"><SectionHeading eyebrow="How it works" title="From sign-up to your first class" />
      <ol className="mt-9 grid gap-5 lg:grid-cols-5 lg:gap-0">
        {JOURNEY.map(({ Icon, title, text }, index) => <motion.li key={title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .08 }} className="relative grid grid-cols-[42px_1fr] gap-x-3 lg:block lg:pr-5"><span className="relative z-10 grid h-10 w-10 place-items-center rounded-full bg-primary font-display font-bold italic text-primary-foreground">{index + 1}</span>{index < 4 && <span className="absolute bottom-[-20px] left-5 top-10 w-0.5 bg-border lg:bottom-auto lg:left-10 lg:right-0 lg:top-5 lg:h-0.5 lg:w-auto" />}<div className="text-teal lg:mt-5"><Icon size={26} /></div><h3 className="mt-1 font-sans font-bold text-foreground lg:mt-3">{title}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p></motion.li>)}
      </ol>
    </Section>

    <Section id="faq"><SectionHeading eyebrow="Questions" title="Before you sign up" />
      <Accordion type="single" collapsible className="mt-8 max-w-3xl space-y-2">{FAQS.map(([question, answer]) => <AccordionItem key={question} value={question} className="rounded-xl border border-border bg-card px-4"><AccordionTrigger className="font-sans text-base font-bold">{question}</AccordionTrigger><AccordionContent className="max-w-2xl text-muted-foreground">{answer}</AccordionContent></AccordionItem>)}</Accordion>
    </Section>

    <section className="mt-20 border-y border-border bg-secondary"><div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-5 px-5 py-12 sm:flex-row sm:items-center sm:px-8"><div><h2 className="text-3xl font-bold italic text-primary">Ready to start?</h2><p className="mt-1 text-muted-foreground">Four questions. Less than a minute.</p></div><Button asChild className="h-14 rounded-xl px-7 text-base font-bold"><a href="#signup">Check my options <IconArrowRight /></a></Button></div></section>
    <footer className="mx-auto grid max-w-6xl gap-5 px-5 py-10 sm:grid-cols-[auto_1fr] sm:items-center sm:px-8"><img src={logo} alt="Momentum One" width={374} height={320} className="h-16 w-auto" /><p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">Momentum One provides student recruitment and application guidance. Course availability, intake dates, timetables and admission decisions are subject to confirmation by the relevant institution. © {new Date().getFullYear()} Momentum One.</p></footer>
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 p-3 backdrop-blur md:hidden"><Button asChild className="h-12 w-full rounded-xl font-bold"><a href="#signup">Check my options <IconArrowRight /></a></Button></div>
  </main>;
}

function Header() { return <header className="sticky top-0 z-40 border-b border-border/70 bg-card/90 backdrop-blur-xl"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8"><a href="#top"><img src={logo} alt="Momentum One" width={374} height={320} className="h-10 w-auto" /></a><nav className="hidden items-center gap-6 text-sm font-semibold text-primary md:flex"><a href="#courses">Courses</a><a href="#campuses">Campuses</a><a href="#journey">How it works</a></nav><Button asChild variant="outline" className="rounded-full border-primary px-5 text-primary shadow-none hover:bg-primary hover:text-primary-foreground"><a href="#signup">Start here</a></Button></div></header>; }
function Section({ id, children }: { id: string; children: React.ReactNode }) { return <section id={id} className="mx-auto max-w-6xl scroll-mt-24 px-5 pt-20 sm:px-8 sm:pt-24">{children}</section>; }
function SectionHeading({ eyebrow, title, intro, inverse = false, centered = false }: { eyebrow: string; title: string; intro?: string; inverse?: boolean; centered?: boolean }) { return <div className={centered ? "text-center" : ""}><p className={inverse ? "text-xs font-semibold uppercase tracking-[.16em] text-primary-foreground/70" : "text-xs font-semibold uppercase tracking-[.16em] text-teal"}>{eyebrow}</p><h2 className={inverse ? "mt-2 text-3xl font-bold italic text-primary-foreground sm:text-4xl" : "mt-2 text-3xl font-bold italic text-primary sm:text-4xl"}>{title}</h2>{intro && <p className="mt-3 max-w-2xl text-muted-foreground">{intro}</p>}</div>; }
function Stars() { return <div className="pointer-events-none absolute inset-0" aria-hidden>{[[8,28],[18,62],[32,22],[48,55],[65,25],[77,63],[89,32],[94,75]].map(([left, top], index) => <span key={left} className="absolute h-1 w-1 rounded-full bg-primary-foreground" style={{ left: `${left}%`, top: `${top}%`, animation: `star-twinkle ${2.5 + index * .18}s ease-in-out infinite` }} />)}</div>; }
