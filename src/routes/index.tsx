import { createFileRoute } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";
import { Funnel } from "@/components/funnel";
import { buttonVariants } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { IconArrowRight, IconTick } from "@/components/icons";
import { CourseShowcase } from "@/components/course-showcase";
import { AudienceCards, CampusStack, JourneyStack } from "@/components/home-stacks";
import { HeroVideo } from "@/components/hero-video";
import { PromoVideoFeature } from "@/components/promo-video";
import { SectionVideo } from "@/components/section-video";
import { cn } from "@/lib/utils";
import { openCookieSettings } from "@/components/cookie-consent";
import { IconAgents, IconUniversity } from "@/components/icons";
import vortexHubAsset from "@/assets/partners/vortex-hub.webp.asset.json";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/lib/i18n";

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

function Index() {
  const { t } = useI18n();
  const journey = [
    { title: t("journey.title1", undefined, "Check your options"), text: t("journey.text1", undefined, "Answer five quick questions and receive your personalised course information.") },
    { title: t("journey.title2", undefined, "Choose how to continue"), text: t("journey.text2", undefined, "Continue on WhatsApp or ask for an advisor to call before the application continues.") },
    { title: t("journey.title3", undefined, "Confirm your details"), text: t("journey.text3", undefined, "Share the relevant personal information and prepare only the documents your route needs.") },
    { title: t("journey.title4", undefined, "Prepare for PFF Day"), text: t("journey.text4", undefined, "Complete the written pre-task and attend the campus assessment day.") },
    { title: t("journey.title5", undefined, "Move towards enrolment"), text: t("journey.text5", undefined, "Enrol after the institution approves your application and assessment.") },
  ];
  const faqs: [string, string][] = [
    [t("faq.q1", undefined, "Do I need A-levels?"), t("faq.a1", undefined, "Foundation Year routes do not require the usual grade profile to apply. Admission still depends on application review and passing the PFF assessment day.")],
    [t("faq.q2", undefined, "Can I study while I work?"), t("faq.a2", undefined, "Selected groups run during the day, evening or weekend. An advisor will confirm which patterns are available for your course and campus.")],
    [t("faq.q3", undefined, "Is funding available?"), t("faq.a3", undefined, "Student finance may be available for eligible students to cover tuition and living costs. An advisor confirms your eligibility before you apply.")],
    [t("faq.q4", undefined, "What documents will I need?"), t("faq.a4", undefined, "Usually photo ID, proof of address, a share code where relevant, and any CV or certificates you have.")],
    [t("faq.q5", undefined, "What is the PFF Day?"), t("faq.a5", undefined, "Prepare for Foundation Day is a one-day campus assessment. You will receive guidance and a short written pre-task before attending.")],
  ];
  // overflow-x-clip, not -hidden: hidden would turn <main> into a scroll container and the sticky header would never stick.
  return <main id="top" className="overflow-x-clip bg-background">
    <AnnouncementBar />
    <Header />
    <section className="relative min-h-[720px] overflow-hidden bg-primary">
      <HeroVideo />
      <div className="relative mx-auto grid max-w-6xl items-start gap-5 px-5 pb-9 pt-5 sm:gap-8 sm:px-8 sm:py-14 lg:min-h-[720px] lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-14 lg:py-16">
        <div className="grid gap-3 duration-700 animate-in fade-in slide-in-from-bottom-4 sm:gap-5">
          <p className="hidden text-xs font-bold uppercase tracking-[.18em] text-gold sm:block">{t("home.eyebrow", undefined, "Your next move starts here")}</p>
          <RotatingHeadline />
          <p className="text-[15px] leading-snug text-primary-foreground/80 sm:hidden">{t("home.introShort", undefined, "Get your personalised course offer in under a minute.")}</p>
          <p className="hidden max-w-[40ch] text-lg leading-relaxed text-primary-foreground/80 sm:block">{t("home.intro", undefined, "Find a course, match with your nearest campus and receive a personalised five-page offer in under a minute.")}</p>
          <HeroStats className="hidden lg:grid" />
        </div>
        <div className="duration-700 animate-in fade-in slide-in-from-bottom-6"><Funnel /></div>
        <HeroStats className="lg:hidden" />
      </div>
    </section>

    <section className="bg-primary py-10 text-primary-foreground sm:py-14">
      <div className="mx-auto grid max-w-6xl items-center gap-7 px-5 sm:px-8 lg:grid-cols-[1.35fr_.65fr] lg:gap-12">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="overflow-hidden">
          <SectionVideo kind="start" className="w-full" />
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 18 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
           <p className="text-xs font-bold uppercase tracking-[.16em] text-gold">{t("home.videoEyebrow", undefined, "Your application, made clearer")}</p>
           <h2 className="mt-3 text-3xl font-bold italic sm:text-4xl">{t("home.videoTitle", undefined, "Start your university journey with a plan.")}</h2>
           <p className="mt-4 leading-relaxed text-primary-foreground/75">{t("home.videoText", undefined, "Check your course and campus options, receive personalised information, then continue with an advisor.")}</p>
           <a href="#signup" className={cn(buttonVariants({ variant: "secondary" }), "mt-6 h-12 rounded-lg px-5 font-bold")}>{t("home.cta", undefined, "Check my options")} <IconArrowRight size={18} /></a>
        </motion.div>
      </div>
    </section>

    <UniversityRail />

    <Section id="courses">
      <SectionHeading eyebrow={t("home.coursesEyebrow", undefined, "Courses")} title={t("home.coursesTitle", undefined, "Seven degrees. Pick the one that fits.")} intro={t("home.coursesSwipe", undefined, "Swipe through the degrees and tap one to see its campuses and timetables.")} />
      <CourseShowcase />
    </Section>

    <Section id="for-you">
      <SectionHeading eyebrow={t("home.forYou", undefined, "Who it's for")} title={t("home.realLives", undefined, "Built for real lives")} />
      <AudienceCards />
    </Section>

    <div className="mt-20 sm:mt-24"><PromoVideoFeature /></div>

    <Section id="campuses">
      <ImmersiveSectionIntro kind="campuses" eyebrow={t("home.campusesEyebrow", undefined, "Campuses")} title={t("home.campusesTitle", undefined, "Study close to home")} intro={t("home.campusesIntro", undefined, "We match you to your nearest campus automatically when you sign up.")} align="right" />
      <CampusStack />
    </Section>

    <Section id="journey">
      <ImmersiveSectionIntro kind="journey" eyebrow={t("home.journeyEyebrow", undefined, "How it works")} title={t("home.journeyTitle", undefined, "From sign-up to your first class")} intro={t("home.journeyIntro", undefined, "Five clear stages, with a Momentum One advisor alongside you when you need support.")} />
      <JourneyStack steps={journey} />
    </Section>

    <Section id="finance">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .7, ease }} className="grid gap-6 rounded-3xl border border-border bg-secondary p-6 sm:p-10 md:grid-cols-[1.1fr_1fr] md:items-center">
        <div>
           <p className="text-xs font-semibold uppercase tracking-[.16em] text-teal">{t("home.financeEyebrow", undefined, "Funding and eligibility")}</p>
           <h2 className="mt-2 text-3xl font-bold italic text-primary sm:text-4xl">{t("home.financeTitle", undefined, "Know what to prepare")}</h2>
          <p className="mt-3 text-muted-foreground">{t("home.financeText", undefined, "Foundation Year can be a route for applicants without the usual A-level profile. Year 1 is available for selected courses and campuses. Admission and student finance depend on your circumstances, so an advisor confirms both before you commit.")}</p>
          <div className="mt-5 flex flex-wrap gap-2">{[t("home.financeChip1", undefined, "Foundation routes"), t("home.financeChip2", undefined, "Selected Year 1 routes"), t("home.financeChip3", undefined, "Day, evening and weekend patterns")].map((item) => <span key={item} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-primary">{item}</span>)}</div>
        </div>
        <div className="rounded-2xl bg-card p-5">
          <h3 className="font-sans text-lg font-bold text-primary">{t("home.docsTitle", undefined, "Documents commonly requested")}</h3>
          <ul className="mt-4 grid gap-3 text-sm text-muted-foreground">
            {[t("home.doc1", undefined, "Proof of identity"), t("home.doc2", undefined, "Proof of address dated within three months of the course start"), t("home.doc3", undefined, "Share code if your passport is not British"), t("home.doc4", undefined, "Duolingo English certificate"), t("home.doc5", undefined, "CV and qualification certificates, if available")].map((item) => <li key={item} className="flex items-start gap-3"><IconTick size={18} className="mt-0.5 shrink-0 text-teal" />{item}</li>)}
          </ul>
        </div>
      </motion.div>
    </Section>

    <Section id="faq">
      <div className="grid gap-8 md:grid-cols-[.8fr_1.2fr]">
        <div>
           <SectionHeading eyebrow={t("home.questions", undefined, "Questions")} title={t("home.before", undefined, "Before you sign up")} />
           <a href={WA} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary">{t("home.whatsapp", undefined, "Still unsure? Message us on WhatsApp")} <IconArrowRight size={16} /></a>
        </div>
        <Accordion type="single" collapsible className="space-y-2">{faqs.map(([q, a], i) => <AccordionItem key={i} value={`faq-${i}`} className="rounded-xl border border-border bg-card px-4 transition-colors data-[state=open]:border-primary/40"><AccordionTrigger className="font-sans text-base font-bold">{q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{a}</AccordionContent></AccordionItem>)}</Accordion>
      </div>
    </Section>

    <section className="relative mt-20 overflow-hidden bg-primary sm:mt-24">
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(var(--gold)_1px,transparent_1px),linear-gradient(90deg,var(--gold)_1px,transparent_1px)] [background-size:64px_64px]" />
      <div className="relative mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-16 sm:flex-row sm:items-center sm:px-8">
         <div><h2 className="text-3xl font-bold italic text-primary-foreground sm:text-4xl">{t("home.finalTitle", undefined, "Your degree starts with one minute.")}</h2><p className="mt-2 text-primary-foreground/80">{t("home.finalText", undefined, "Answer a few questions and download your personalised offer today.")}</p></div>
         <a href="#signup" className={cn(buttonVariants({ variant: "secondary" }), "h-14 rounded-xl px-7 text-base font-bold active:scale-[.98]")}>{t("home.cta", undefined, "Check my options")} <IconArrowRight /></a>
      </div>
    </section>

    <footer className="bg-secondary/60 px-5 pb-28 pt-12 sm:px-8 md:pb-12"><div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1fr_auto]"><div><img src={logo} alt="Momentum One" width={374} height={320} className="h-16 w-auto" /><p className="mt-4 max-w-2xl text-xs leading-relaxed text-muted-foreground">{t("footer.about", undefined, "Momentum One provides student recruitment and application guidance. Course availability, intake dates, timetables, funding and admission decisions are subject to confirmation by the relevant institution.")}</p><p className="mt-3 text-xs text-muted-foreground">MOMENTUM ONE LTD · {t("footer.company", undefined, "Company")} 16641977 · 6 Harewood Drive, Taverham, Norwich, NR8 6XH · info@momentumone.co.uk · 07383 207062</p></div><nav className="grid content-start gap-2 text-sm font-semibold text-primary"><a href="/privacy">{t("footer.privacy", undefined, "Privacy notice")}</a><a href="/cookies">{t("footer.cookies", undefined, "Cookie notice")}</a><a href="/terms">{t("footer.terms", undefined, "Website terms")}</a><a href="/disclaimer">{t("footer.disclaimer", undefined, "Application disclaimer")}</a><button type="button" onClick={openCookieSettings} className="text-left font-semibold">{t("footer.settings", undefined, "Cookie settings")}</button><a href="/auth">{t("footer.signin", undefined, "Account sign in")}</a></nav></div><div className="mx-auto mt-8 flex max-w-6xl flex-col gap-4 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} Momentum One.</p><div className="flex items-center gap-3"><span className="font-semibold uppercase tracking-[.14em]">{t("footer.powered", undefined, "Powered by")}</span><img src={vortexHubAsset.url} alt="Vortex Hub" width={1920} height={720} loading="lazy" className="h-8 w-auto object-contain" /></div></div></footer>
    <StickyCta />
  </main>;
}

function AnnouncementBar() {
  const { t } = useI18n();
  const text = t("home.announcement", undefined, "January 2027 applications open · Personalised course options in one minute · Advisor support available · ");
  return <div className="overflow-hidden bg-gold py-2 text-primary"><div className="animate-ticker flex w-max whitespace-nowrap text-[11px] font-bold uppercase tracking-[.16em]"><span>{text}</span><span aria-hidden>{text}</span></div></div>;
}

function RotatingHeadline() {
  const { t } = useI18n();
  const phrases = [t("home.phrase1", undefined, "close to home."), t("home.phrase2", undefined, "built around life."), t("home.phrase3", undefined, "with a clear next step.")];
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => { const timer = window.setInterval(() => setIndex((value) => (value + 1) % phrases.length), 3200); return () => window.clearInterval(timer); }, []);
  return <h1 className="max-w-2xl text-[2.125rem] font-bold leading-[1.05] text-primary-foreground sm:text-6xl sm:leading-[1.02] lg:text-[4.3rem]">{t("home.headline", undefined, "A UK degree,")}<span className="mt-1 grid overflow-hidden text-[clamp(1.5rem,7vw,2.125rem)] text-gold sm:text-[1em]">{phrases.map((phrase, i) => <motion.span key={i} aria-hidden={i !== index} initial={false} animate={{ opacity: i === index ? 1 : 0, y: i === index || reduce ? 0 : 20 }} transition={{ duration: .5, ease }} className="[grid-area:1/1]">{phrase}</motion.span>)}</span></h1>;
}

function HeroStats({ className }: { className?: string }) {
  const { t } = useI18n();
  return <div className={cn("grid grid-cols-2 gap-px overflow-hidden border border-primary-foreground/15 bg-primary-foreground/15", className)}>
    <div className="flex items-center gap-3 bg-primary/80 p-4"><IconAgents className="shrink-0 text-gold" /><p className="text-sm text-primary-foreground/70"><strong className="block text-xl text-primary-foreground">{t("home.team", undefined, "10+ team")}</strong>{t("home.teamSub", undefined, "supporting applicants")}</p></div>
    <div className="flex items-center gap-3 bg-primary/80 p-4"><IconUniversity className="shrink-0 text-gold" /><p className="text-sm text-primary-foreground/70"><strong className="block text-xl text-primary-foreground">{t("home.students", undefined, "100+ students")}</strong>{t("home.studentsSub", undefined, "helped")}</p></div>
  </div>;
}

/** Phone-only shortcut back to the funnel; stays out of the way while the funnel itself is on screen. */
function StickyCta() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const target = document.getElementById("signup");
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry ? !entry.isIntersecting : false));
    observer.observe(target);
    return () => observer.disconnect();
  }, []);
  return <div inert={!visible} className={cn("fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur transition-transform duration-300 md:hidden", visible ? "translate-y-0" : "translate-y-full")}><a href="#signup" className={cn(buttonVariants(), "h-12 w-full rounded-xl font-bold")}>{t("home.cta", undefined, "Check my options")} <IconArrowRight /></a></div>;
}

function UniversityRail() {
  const { t } = useI18n();
  const names = ["University of Wolverhampton", "Arts University Bournemouth", "Health Sciences University"];
  return <section className="overflow-hidden border-y border-border bg-card py-6" aria-labelledby="awarded-by"><p id="awarded-by" className="mb-4 text-center text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground">{t("home.awarded", undefined, "Courses awarded by")}</p><div className="animate-ticker flex w-max items-center whitespace-nowrap">{[...names, ...names].map((name, index) => <span key={`${name}-${index}`} aria-hidden={index >= names.length || undefined} className="flex items-center px-8 text-sm font-extrabold uppercase text-primary sm:px-14"><IconUniversity size={23} className="mr-3 text-teal" />{name}</span>)}</div></section>;
}

function Header() {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const on = () => setScrolled(window.scrollY > 24); on(); window.addEventListener("scroll", on, { passive: true }); return () => window.removeEventListener("scroll", on); }, []);
  return <header className={cn("sticky top-0 z-40 border-b bg-card/90 backdrop-blur-xl transition-all duration-300", scrolled ? "border-border shadow-sm" : "border-transparent")}>
    <div className={cn("mx-auto flex max-w-6xl items-center justify-between px-5 transition-all duration-300 sm:px-8", scrolled ? "py-2" : "py-3")}>
      <a href="#top"><img src={logo} alt="Momentum One" width={374} height={320} className={cn("w-auto transition-all duration-300", scrolled ? "h-8" : "h-10")} /></a>
      <nav className="hidden items-center gap-6 text-sm font-semibold text-primary md:flex"><a href="#courses">{t("nav.courses", undefined, "Courses")}</a><a href="#campuses">{t("nav.campuses", undefined, "Campuses")}</a><a href="#journey">{t("nav.journey", undefined, "How it works")}</a><a href="#finance">{t("nav.funding", undefined, "Funding")}</a></nav>
      <div className="flex items-center gap-2"><LanguageSwitcher compact /><a href="/auth" className="hidden text-sm font-semibold text-primary hover:text-teal sm:block">{t("nav.account", undefined, "My account")}</a><a href="#signup" className={cn(buttonVariants({ variant: "outline" }), "hidden rounded-full border-primary px-5 text-primary shadow-none hover:bg-primary hover:text-primary-foreground sm:inline-flex")}>{t("nav.start", undefined, "Start here")}</a></div>
    </div>
  </header>;
}
function Section({ id, children }: { id: string; children: React.ReactNode }) { return <section id={id} className="mx-auto max-w-6xl scroll-mt-24 px-5 pt-20 sm:px-8 sm:pt-24">{children}</section>; }
function SectionHeading({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) { return <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .6, ease }}><p className="text-xs font-semibold uppercase tracking-[.16em] text-teal">{eyebrow}</p><h2 className="mt-2 text-3xl font-bold italic text-primary sm:text-4xl">{title}</h2>{intro && <p className="mt-3 max-w-2xl text-muted-foreground">{intro}</p>}</motion.div>; }
function ImmersiveSectionIntro({ kind, eyebrow, title, intro, align = "left" }: { kind: "courses" | "campuses" | "journey"; eyebrow: string; title: string; intro?: string; align?: "left" | "right" }) {
  const right = align === "right";
  return <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .7, ease }} className="relative -mx-5 min-h-80 overflow-hidden bg-primary sm:-mx-8 sm:min-h-96 lg:mx-0">
    <SectionVideo kind={kind} immersive className="absolute inset-0" />
    <div className={cn("absolute inset-0", right ? "bg-gradient-to-l from-primary/90 via-primary/40 to-transparent" : "bg-gradient-to-r from-primary/90 via-primary/40 to-transparent")} />
    <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-primary/70 to-transparent" />
    <div className={cn("relative flex min-h-80 max-w-3xl flex-col justify-end px-5 pb-12 pt-24 text-primary-foreground sm:min-h-96 sm:px-10 sm:pb-16", right && "ml-auto text-right sm:items-end")}>
      <p className="text-xs font-bold uppercase tracking-[.16em] text-gold">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold italic sm:text-5xl">{title}</h2>
      {intro && <p className="mt-4 max-w-xl leading-relaxed text-primary-foreground/75">{intro}</p>}
    </div>
    <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-background to-transparent" />
  </motion.div>;
}
