import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState, type ComponentType } from "react";
import logo from "@/assets/logo.png";
import logoMark from "@/assets/logo-mark.png";
import { Funnel } from "@/components/funnel";
import { UkMap } from "@/components/uk-map";
import { IconBook, IconCalendar, IconCampus, IconMortarboard, IconPassport, IconPin, IconQuill, IconSeal } from "@/components/icons";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const TITLE = "Momentum One | Start your UK university degree";
const DESC = "Get matched with UK universities near you in 60 seconds and download your personalised pathway certificate. January 2027 intake now open.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const ease = [0.22, 1, 0.36, 1] as const;
const SLIDES = ["start", "partners", "process", "courses", "students", "faq"] as const;

function Index() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(SLIDES.indexOf(e.target.id as (typeof SLIDES)[number]))),
      { threshold: 0.45 },
    );
    SLIDES.forEach((id) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  return (
    <main className="relative overflow-x-hidden">
      <SlideRail active={active} />

      {/* 01 START */}
      <section id="start" className="snap-slide relative min-h-[100svh] bg-ruled">
        <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col px-5 sm:px-8 lg:px-12">
          <header className="flex items-center justify-between py-5 sm:py-8">
            <motion.a href="#start" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }}>
              <img src={logo} alt="Momentum One, Building Momentum For Your Future" width={374} height={320} className="h-14 w-auto sm:h-20" />
            </motion.a>
            <nav className="hidden gap-8 text-sm font-semibold uppercase tracking-wide md:flex">
              <a href="#partners" className="transition-colors hover:text-teal">Partners</a>
              <a href="#process" className="transition-colors hover:text-teal">Process</a>
              <a href="#courses" className="transition-colors hover:text-teal">Courses</a>
            </nav>
          </header>

          <div className="flex flex-1 flex-col items-center justify-center gap-10 pb-16 pt-2 lg:flex-row lg:gap-16 lg:py-10">
            <div className="w-full max-w-xl flex-1 space-y-6 lg:space-y-8">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8, ease }}
                className="inline-block rounded-full border border-teal px-4 py-1 text-xs font-bold uppercase tracking-widest text-teal">
                January 2027 intake
              </motion.div>
              <h1 className="text-[2.6rem] font-bold leading-[1.05] sm:text-6xl lg:text-7xl">
                {[["Building"], ["Momentum", true], ["For Your Future"]].map(([w, accent], i) => (
                  <span key={w as string} className="block overflow-hidden pb-1">
                    <motion.span className={accent ? "block text-teal" : "block"} initial={{ y: "105%" }} animate={{ y: 0 }} transition={{ delay: 0.3 + i * 0.12, duration: 1, ease }}>
                      {w}
                    </motion.span>
                  </span>
                ))}
              </h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 1 }} className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                We match you with UK universities near you, then guide you from application to enrolment, one clear step at a time. Our support is free.
              </motion.p>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }} className="flex items-center gap-5 pt-2">
                <div className="flex -space-x-3">
                  {["bg-stone", "bg-teal/40", "bg-gold/70", "bg-ink/80"].map((c, i) => (
                    <span key={i} className={`grid h-10 w-10 place-items-center rounded-full border-2 border-paper font-display text-xs font-bold text-paper ${c}`}>{["A", "D", "S", "K"][i]}</span>
                  ))}
                </div>
                <p className="text-sm font-medium">Students across 20 UK cities</p>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1.1, ease }} className="w-full max-w-md">
              <Funnel />
            </motion.div>
          </div>

          <footer className="hidden items-end justify-between pb-8 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground lg:flex">
            <span>01 / 06</span>
            <a href="#partners" className="flex flex-col items-center gap-2">
              <span>Scroll to explore</span>
              <span className="relative h-12 w-px overflow-hidden bg-ink/40"><span className="absolute top-0 h-1/2 w-full animate-bounce bg-teal" /></span>
            </a>
            <span>Luton · Manchester · London</span>
          </footer>
        </div>
      </section>

      {/* 02 PARTNERS */}
      <Slide id="partners" n="02" kicker="Who we work with" className="bg-pages">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_380px]">
          <div>
            <Title>Partner universities and <span className="text-teal">campuses near you.</span></Title>
            <ul className="mt-10 divide-y divide-ink/15 border-y border-ink/15">
              {[
                ["University of Wolverhampton", "Awarding body · Business, Health and Public Health"],
                ["Arts University Bournemouth", "Fashion Management and Events"],
                ["Green Valley Academy", "Partner institution · Luton campus"],
                ["Partner colleges", "Manchester, Salford, Derby and Birmingham"],
              ].map(([n, s], i) => (
                <motion.li key={n} initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.6 }} transition={{ delay: i * 0.12, duration: 0.8, ease }}
                  className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-4 py-5 sm:gap-8">
                  <span className="font-display text-sm font-bold text-teal">0{i + 1}</span>
                  <div className="min-w-0">
                    <p className="font-display text-xl font-bold sm:text-2xl">{n}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{s}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
          <div className="mx-auto w-56 sm:w-72 lg:w-full"><UkMap network className="w-full" /></div>
        </div>
      </Slide>

      {/* 03 PROCESS */}
      <Slide id="process" n="03" kicker="How it works" className="bg-grid">
        <Title>From first click <span className="text-teal">to campus.</span></Title>
        <div className="mt-10 grid gap-px overflow-hidden rounded-sm border border-ink/15 bg-ink/15 sm:grid-cols-2 lg:grid-cols-4">
          {([
            [IconMortarboard, "Apply", "Tell us about you. We match the right course and campus."],
            [IconPassport, "Prepare", "We help with your documents and the short PFF pre-task."],
            [IconCalendar, "PFF Day", "Attend your Prepare for Foundation day. We coach you first."],
            [IconSeal, "Enrol", "Receive your admission offer and start your degree."],
          ] as [ComponentType<{ size?: number }>, string, string][]).map(([I, t, dsc], k) => (
            <motion.div key={t} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ delay: k * 0.12, duration: 0.8, ease }}
              className="group relative bg-paper p-6 sm:p-8">
              <span className="font-display text-6xl font-bold text-ink/[0.07]">0{k + 1}</span>
              <div className="mt-2 text-teal transition-transform duration-500 group-hover:-translate-y-1"><I size={40} /></div>
              <h3 className="mt-5 text-xl font-bold">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{dsc}</p>
              <motion.span className="absolute bottom-0 left-0 h-0.5 bg-teal" initial={{ width: 0 }} whileInView={{ width: "100%" }} viewport={{ once: true }} transition={{ delay: 0.4 + k * 0.15, duration: 0.8 }} />
            </motion.div>
          ))}
        </div>
      </Slide>

      {/* 04 COURSES */}
      <Slide id="courses" n="04" kicker="Featured courses" className="bg-ruled">
        <Title>Courses that <span className="text-teal">open doors.</span></Title>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
             { t: "BA (Hons) Business Management", m: "Manchester, Sunderland, Derby, Newcastle", d: "University of Wolverhampton", i: IconCampus },
             { t: "BA (Hons) Digital Marketing Management", m: "Manchester, Sunderland, Derby, Newcastle", d: "University of Wolverhampton", i: IconBook },
             { t: "BA (Hons) Health and Social Care", m: "Manchester, Sunderland, Derby", d: "University of Wolverhampton", i: IconPin },
             { t: "BSc (Hons) Public Health", m: "Luton", d: "University of Wolverhampton", i: IconBook },
             { t: "BSc (Hons) Psychology", m: "Manchester, Sunderland, Derby", d: "Health Sciences University", i: IconCampus },
             { t: "BSc (Hons) Fashion Management and Strategy", m: "Manchester, Sunderland, Derby", d: "Arts University Bournemouth", i: IconPin },
             { t: "BA (Hons) Events Management", m: "Manchester, Sunderland, Derby", d: "Arts University Bournemouth", i: IconBook },
           ].map((c, k) => (
            <motion.article key={c.t} initial={{ opacity: 0, rotateY: -25, x: -20 }} whileInView={{ opacity: 1, rotateY: 0, x: 0 }} viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: k * 0.15, duration: 0.9, ease }} style={{ transformPerspective: 1200, transformOrigin: "left center" }}
             className={cn("relative flex flex-col rounded-sm border border-ink/15 bg-card p-7 shadow-paper", k === 6 && "md:col-span-3 md:mx-auto md:w-[calc((100%-2.5rem)/3)]")}>
              <span className="absolute right-5 top-5 font-display text-[10px] font-bold tracking-[0.3em] text-muted-foreground">P. {12 + k * 8}</span>
              <span className="text-teal"><c.i size={36} /></span>
              <h3 className="mt-6 text-lg font-bold leading-snug">{c.t}</h3>
              <div className="mt-auto pt-8">
                <div className="h-px w-full bg-ink/15" />
                <p className="mt-4 text-sm font-semibold">{c.m}</p>
                <p className="text-xs text-muted-foreground">{c.d}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </Slide>

      {/* 05 STUDENTS */}
      <Slide id="students" n="05" kicker="Student stories" className="bg-pages">
        <div className="grid gap-8 lg:grid-cols-3">
          {[
            { q: "I didn't think university was for me. Momentum One made every step simple.", n: "Amira", c: "Birmingham" },
            { q: "They helped me prepare for the PFF day and I got my offer the same week.", n: "Daniel", c: "Manchester" },
            { q: "Back in education at 34, studying Health and Social Care. Best decision ever.", n: "Sofia", c: "London" },
          ].map((t, k) => (
            <motion.figure key={t.n} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ delay: k * 0.15, duration: 0.9, ease }}
              className={k === 0 ? "lg:col-span-3" : ""}>
              <IconQuill size={28} className="text-gold" />
              <blockquote className={`mt-4 font-serif font-semibold italic leading-tight ${k === 0 ? "text-3xl sm:text-5xl" : "text-2xl sm:text-3xl"}`}>"{t.q}"</blockquote>
              <figcaption className="mt-4 text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">{t.n} · {t.c}</figcaption>
            </motion.figure>
          ))}
        </div>
      </Slide>

      {/* 06 FAQ */}
      <Slide id="faq" n="06" kicker="Questions" className="bg-ruled">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <Title>Everything you <span className="text-teal">need to know.</span></Title>
            <img src={logoMark} alt="" width={300} height={249} loading="lazy" className="mt-10 hidden w-40 opacity-90 lg:block" />
          </div>
          <div>
            <Accordion type="single" collapsible>
              {([
                ["Do I need A-levels?", "No. Offers depend on passing the Prepare for Foundation (PFF) Day, whatever your age, experience or academic background."],
                ["Does your service cost anything?", "Our guidance is free for students."],
                ["What documents will I need?", "Photo ID (passport or ID card), a share code if you are not a UK national, proof of address, and ideally a CV and any certificates."],
                ["When does the next intake start?", "January 2027. Applications are already open, so the sooner you start the better."],
              ] as const).map(([q, a]) => (
                <AccordionItem key={q} value={q} className="border-ink/15">
                  <AccordionTrigger className="text-left font-display text-base">{q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <a href="#start" className="mt-10 inline-flex items-center gap-3 rounded bg-ink px-8 py-4 font-display font-bold text-primary-foreground transition hover:bg-teal">Get my offer</a>
          </div>
        </div>
        <footer className="mt-20 flex flex-col items-center gap-3 border-t border-ink/15 pt-8 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <img src={logo} alt="Momentum One" width={374} height={320} loading="lazy" className="h-12 w-auto" />
          <span>© {new Date().getFullYear()} Momentum One. Building Momentum For Your Future.</span>
        </footer>
      </Slide>
    </main>
  );
}

function SlideRail({ active }: { active: number }) {
  return (
    <nav className="fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-3 md:flex" aria-label="Slides">
      {SLIDES.map((s, i) => (
        <a key={s} href={`#${s}`} className="group flex items-center gap-3">
          <span className={`font-display text-[10px] font-bold tracking-widest transition ${i === active ? "text-teal opacity-100" : "opacity-0 group-hover:opacity-60"}`}>0{i + 1}</span>
          <span className={`block h-px transition-all duration-500 ${i === active ? "w-10 bg-teal" : "w-5 bg-ink/30"}`} />
        </a>
      ))}
    </nav>
  );
}

function Slide({ id, n, kicker, className, children }: { id: string; n: string; kicker: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={`snap-slide relative flex min-h-[100svh] items-center border-t border-ink/10 ${className ?? ""}`}>
      <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:px-12">
        <motion.p initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease }}
          className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-gold">
          <span className="font-display text-teal">{n}</span><span className="h-px w-8 bg-gold" />{kicker}
        </motion.p>
        {children}
      </div>
    </section>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <motion.div className="overflow-hidden" initial="hide" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
      <motion.h2 variants={{ hide: { y: "100%" }, show: { y: 0 } }} transition={{ duration: 1, ease }}
        className="max-w-3xl text-4xl font-bold leading-[1.05] sm:text-6xl">
        {children}
      </motion.h2>
    </motion.div>
  );
}
