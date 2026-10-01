import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";
import { Funnel } from "@/components/funnel";
import { buttonVariants } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { IconArrowRight, IconTick } from "@/components/icons";
import { AudienceStrip, CampusCards, CourseDeck, ScrollTimeline, StatsBand } from "@/components/home-sections";
import { CourseComparison, WhatYouReceive } from "@/components/home-sections";
import { HeroVideo } from "@/components/hero-video";
import { PromoVideoFeature } from "@/components/promo-video";
import { cn } from "@/lib/utils";
import heroImage from "@/assets/courses/business.jpg";

const TITLE = "Launch your UK degree | Momentum One";
const DESC = "Foundation Year and Year 1 degrees in Manchester, Sunderland, Derby, Newcastle and Luton. Check your options in under a minute.";
const ease = [0.22, 1, 0.36, 1] as const;
const WA = "https://wa.me/447593855452?text=" + encodeURIComponent("Hi Momentum One, I have a question about studying.");

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: TITLE }, { name: "description", content: DESC },
    { property: "og:title", content: TITLE }, { property: "og:description", content: DESC },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

const JOURNEY = [
  { title: "Check your options", text: "Answer five quick questions and receive your personalised course information." },
  { title: "Choose how to continue", text: "Continue on WhatsApp or ask for an advisor to call before the application continues." },
  { title: "Confirm your details", text: "Share the relevant personal information and prepare only the documents your route needs." },
  { title: "Prepare for PFF Day", text: "Complete the written pre-task and attend the campus assessment day." },
  { title: "Move towards enrolment", text: "Enrol after the institution approves your application and assessment." },
];

const FAQS: [string, string][] = [
  ["Do I need A-levels?", "Foundation Year routes do not require the usual grade profile to apply. Admission still depends on application review and passing the PFF assessment day."],
  ["Can I study while I work?", "Selected groups run during the day, evening or weekend. An advisor will confirm which patterns are available for your course and campus."],
  ["Is funding available?", "Student finance may be available for eligible students to cover tuition and living costs. An advisor confirms your eligibility before you apply."],
  ["What documents will I need?", "Usually photo ID, proof of address, a share code where relevant, and any CV or certificates you have."],
  ["What is the PFF Day?", "Prepare for Foundation Day is a one-day campus assessment. You will receive guidance and a short written pre-task before attending."],
];

function Index() {
  return <main id="top" className="overflow-x-hidden bg-background">
    <Header />
    <section className="relative min-h-[720px] overflow-hidden">
      <HeroVideo />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-10 sm:px-8 sm:py-14 lg:min-h-[720px] lg:grid-cols-[1.05fr_.95fr] lg:gap-14 lg:py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, ease }} className="grid gap-5">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-primary-foreground/25 bg-primary/55 px-3 py-1 text-xs font-semibold uppercase tracking-[.14em] text-primary-foreground backdrop-blur"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />January 2027 applications open</p>
          <h1 className="max-w-2xl text-[2.75rem] font-bold italic leading-[1.02] text-primary-foreground sm:text-6xl lg:text-[4.3rem]">A UK degree, <em className="text-gold">close to home.</em></h1>
          <p className="max-w-[40ch] text-lg leading-relaxed text-primary-foreground/80">Find a course, match with your nearest campus and receive a personalised five-page offer in under a minute.</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {["7 degree choices", "5 UK campuses", "Foundation and Year 1 routes", "Advisor support after applying"].map((item) => <li key={item} className="flex items-center gap-2 text-sm font-semibold text-primary-foreground"><span className="grid h-6 w-6 place-items-center rounded-full bg-primary-foreground/10 text-gold"><IconTick size={14} /></span>{item}</li>)}
          </ul>
          <div className="flex items-center gap-4 rounded-2xl border border-primary-foreground/20 bg-primary/60 p-3 backdrop-blur">
            <img src={heroImage} alt="Student in a seminar" width={960} height={1200} className="h-16 w-16 rounded-xl object-cover" />
            <p className="text-sm text-primary-foreground/75">Degrees awarded by <strong className="text-primary-foreground">University of Wolverhampton</strong>, <strong className="text-primary-foreground">Arts University Bournemouth</strong> and <strong className="text-primary-foreground">Health Sciences University</strong>.</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2, duration: .9, ease }}><Funnel /></motion.div>
      </div>
    </section>

    <section className="border-y border-border bg-card py-5">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-5 text-sm font-bold uppercase tracking-[.14em] text-muted-foreground sm:px-8">
        <span>University of Wolverhampton</span><span className="hidden h-1 w-1 rounded-full bg-border sm:block" /><span>Arts University Bournemouth</span><span className="hidden h-1 w-1 rounded-full bg-border sm:block" /><span>Health Sciences University</span>
      </div>
    </section>

    <Section id="courses">
      <SectionHeading eyebrow="Courses" title="Seven degrees. Pick the one that fits." intro="Hover or tap a course to see where it runs, then check your options in one click." />
      <div className="mt-6"><CourseDeck /></div>
      <CourseComparison />
    </Section>

    <Section id="for-you">
      <SectionHeading eyebrow="Who it's for" title="Built for real lives" />
      <AudienceStrip />
    </Section>

    <div className="mt-20 sm:mt-24"><PromoVideoFeature /></div>

    <section className="relative mt-20 overflow-hidden rounded-t-[50%_70px] bg-primary text-primary-foreground sm:mt-24 sm:rounded-t-[50%_90px]">
      <Stars />
      <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20"><StatsBand /></div>
    </section>

    <Section id="campuses">
      <SectionHeading eyebrow="Campuses" title="Study close to home" intro="We match you to your nearest campus automatically when you sign up." />
      <CampusCards />
    </Section>

    <Section id="journey">
      <SectionHeading eyebrow="How it works" title="From sign-up to your first class" />
      <ScrollTimeline steps={JOURNEY} />
    </Section>

    <Section id="finance">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .7, ease }} className="grid gap-6 rounded-3xl border border-border bg-secondary p-6 sm:p-10 md:grid-cols-[1.1fr_1fr] md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-teal">Funding and eligibility</p>
          <h2 className="mt-2 text-3xl font-bold italic text-primary sm:text-4xl">Know what to prepare</h2>
          <p className="mt-3 text-muted-foreground">Foundation Year can be a route for applicants without the usual A-level profile. Year 1 is available for selected courses and campuses. Admission and student finance depend on your circumstances, so an advisor confirms both before you commit.</p>
          <div className="mt-5 flex flex-wrap gap-2">{["Foundation routes", "Selected Year 1 routes", "Day, evening and weekend patterns"].map((item) => <span key={item} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-primary">{item}</span>)}</div>
        </div>
        <div className="rounded-2xl bg-card p-5">
          <h3 className="font-sans text-lg font-bold text-primary">Documents commonly requested</h3>
          <ul className="mt-4 grid gap-3 text-sm text-muted-foreground">
            {["Proof of identity", "Proof of address dated within three months of the course start", "Share code if your passport is not British", "Duolingo English certificate", "CV and qualification certificates, if available"].map((t) => <li key={t} className="flex items-start gap-3"><IconTick size={18} className="mt-0.5 shrink-0 text-teal" />{t}</li>)}
          </ul>
        </div>
      </motion.div>
    </Section>

    <section className="mt-20 bg-primary py-16 sm:mt-24 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-gold">After you apply</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold italic text-primary-foreground sm:text-4xl">More than a confirmation screen</h2>
        <p className="mt-3 max-w-2xl text-primary-foreground/75">You receive practical information you can keep, plus a clear route to a Momentum One advisor.</p>
        <div className="mt-8"><WhatYouReceive /></div>
      </div>
    </section>

    <Section id="faq">
      <div className="grid gap-8 md:grid-cols-[.8fr_1.2fr]">
        <div>
          <SectionHeading eyebrow="Questions" title="Before you sign up" />
          <a href={WA} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary">Still unsure? Message us on WhatsApp <IconArrowRight size={16} /></a>
        </div>
        <Accordion type="single" collapsible className="space-y-2">{FAQS.map(([q, a]) => <AccordionItem key={q} value={q} className="rounded-xl border border-border bg-card px-4 transition-colors data-[state=open]:border-primary/40"><AccordionTrigger className="font-sans text-base font-bold">{q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{a}</AccordionContent></AccordionItem>)}</Accordion>
      </div>
    </Section>

    <section className="relative mt-20 overflow-hidden bg-primary sm:mt-24">
      <img src={heroImage} alt="" aria-hidden width={960} height={1200} loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-25" />
      <div className="relative mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-16 sm:flex-row sm:items-center sm:px-8">
        <div><h2 className="text-3xl font-bold italic text-primary-foreground sm:text-4xl">Your degree starts with one minute.</h2><p className="mt-2 text-primary-foreground/80">Answer a few questions and download your personalised offer today.</p></div>
        <a href="#signup" className={cn(buttonVariants({ variant: "secondary" }), "h-14 rounded-xl px-7 text-base font-bold active:scale-[.98]")}>Check my options <IconArrowRight /></a>
      </div>
    </section>

    <footer className="mx-auto grid max-w-6xl gap-5 px-5 pb-28 pt-10 sm:grid-cols-[auto_1fr] sm:items-center sm:px-8 md:pb-10"><img src={logo} alt="Momentum One" width={374} height={320} className="h-16 w-auto" /><p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">Momentum One provides student recruitment and application guidance. Course availability, intake dates, timetables and admission decisions are subject to confirmation by the relevant institution. © {new Date().getFullYear()} Momentum One.</p></footer>
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden"><a href="#signup" className={cn(buttonVariants(), "h-12 w-full rounded-xl font-bold")}>Check my options <IconArrowRight /></a></div>
  </main>;
}

function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const on = () => setScrolled(window.scrollY > 24); on(); window.addEventListener("scroll", on, { passive: true }); return () => window.removeEventListener("scroll", on); }, []);
  return <header className={cn("sticky top-0 z-40 border-b bg-card/90 backdrop-blur-xl transition-all duration-300", scrolled ? "border-border shadow-sm" : "border-transparent")}>
    <div className={cn("mx-auto flex max-w-6xl items-center justify-between px-5 transition-all duration-300 sm:px-8", scrolled ? "py-2" : "py-3")}>
      <a href="#top"><img src={logo} alt="Momentum One" width={374} height={320} className={cn("w-auto transition-all duration-300", scrolled ? "h-8" : "h-10")} /></a>
      <nav className="hidden items-center gap-6 text-sm font-semibold text-primary md:flex"><a href="#courses">Courses</a><a href="#campuses">Campuses</a><a href="#journey">How it works</a><a href="#finance">Funding</a></nav>
      <div className="flex items-center gap-2"><a href="/auth" className="hidden text-sm font-semibold text-primary hover:text-teal sm:block">My account</a><a href="#signup" className={cn(buttonVariants({ variant: "outline" }), "rounded-full border-primary px-5 text-primary shadow-none hover:bg-primary hover:text-primary-foreground")}>Start here</a></div>
    </div>
  </header>;
}
function Section({ id, children }: { id: string; children: React.ReactNode }) { return <section id={id} className="mx-auto max-w-6xl scroll-mt-24 px-5 pt-20 sm:px-8 sm:pt-24">{children}</section>; }
function SectionHeading({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) { return <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .6, ease }}><p className="text-xs font-semibold uppercase tracking-[.16em] text-teal">{eyebrow}</p><h2 className="mt-2 text-3xl font-bold italic text-primary sm:text-4xl">{title}</h2>{intro && <p className="mt-3 max-w-2xl text-muted-foreground">{intro}</p>}</motion.div>; }
function Stars() { return <div className="pointer-events-none absolute inset-0" aria-hidden>{[[8,28],[18,62],[32,22],[48,55],[65,25],[77,63],[89,32],[94,75]].map(([left, top], index) => <span key={left} className="absolute h-1 w-1 rounded-full bg-primary-foreground" style={{ left: `${left}%`, top: `${top}%`, animation: `star-twinkle ${2.5 + index * .18}s ease-in-out infinite` }} />)}</div>; }
