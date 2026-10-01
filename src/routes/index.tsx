import { createFileRoute } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { GraduationCap, ClipboardCheck, CalendarCheck, Award, MapPin } from "lucide-react";
import logo from "@/assets/logo.png";
import { Starfield } from "@/components/starfield";
import { Funnel } from "@/components/funnel";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const TITLE = "Momentum One — Start your UK university degree";
const DESC = "Get matched with top UK universities near you in 60 seconds and download your personalised pathway offer. January 2027 intake open.";

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

function Index() {
  const hero = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: hero, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <main className="relative overflow-x-hidden">
      {/* HERO */}
      <section ref={hero} className="relative min-h-[100svh] overflow-hidden">
        <Starfield />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />

        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 pt-5 sm:px-8">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }} className="flex items-center gap-2">
            <img src={logo} alt="Momentum One" width={44} height={44} className="h-11 w-11 rounded-full bg-foreground object-contain p-0.5" />
            <span className="font-display text-sm font-bold tracking-tight">MOMENTUM<span className="text-launch">ONE</span></span>
          </motion.div>
          <a href="#how" className="rounded-full border border-border px-4 py-2 text-xs text-muted-foreground transition hover:text-foreground">How it works</a>
        </header>

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-8 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pt-16">
          <motion.div style={{ y, opacity: fade }}>
            <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8, ease }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> January 2027 intake — applications open
            </motion.span>
            <h1 className="mt-5 text-[2.6rem] font-extrabold leading-[0.95] sm:text-6xl lg:text-7xl">
              {["Your degree", "starts with", "one launch."].map((line, i) => (
                <span key={line} className="block overflow-hidden">
                  <motion.span className={i === 2 ? "block text-launch" : "block"} initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ delay: 0.3 + i * 0.12, duration: 1, ease }}>
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 1 }} className="mt-5 max-w-md text-base text-muted-foreground sm:text-lg">
              We connect you with leading UK universities near you, then guide you all the way from application to enrolment — free.
            </motion.p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }} className="mt-6 hidden gap-6 text-sm lg:flex">
              <Stat n="20+" l="UK cities" /><Stat n="4" l="partner universities" /><Stat n="1:1" l="advisor support" />
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.5, duration: 1.1, ease }} className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-launch opacity-20 blur-3xl" />
            <Funnel />
          </motion.div>
        </div>
      </section>

      {/* PARTNERS */}
      <section className="border-y border-border bg-secondary/30 py-8">
        <p className="text-center text-[10px] tracking-[0.3em] text-muted-foreground">WORKING WITH</p>
        <div className="mx-auto mt-4 flex max-w-5xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-5 font-display text-sm font-semibold text-foreground/70 sm:text-base">
          <span>University of Wolverhampton</span><span>Arts University Bournemouth</span><span>Green Valley Academy</span><span>Partner Colleges</span>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <Reveal><h2 className="text-3xl font-bold sm:text-5xl">From first click to <span className="text-launch">campus.</span></h2></Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { i: GraduationCap, t: "Apply", d: "Tell us about you. We match the right course and campus." },
            { i: ClipboardCheck, t: "Prepare", d: "We help with documents and your short pre-task." },
            { i: CalendarCheck, t: "PFF Day", d: "Attend your Prepare for Foundation day — we coach you first." },
            { i: Award, t: "Enrol", d: "Receive your admission offer and start your degree." },
          ].map((s, k) => (
            <Reveal key={s.t} delay={k * 0.1}>
              <div className="glass group h-full rounded-2xl p-6 transition hover:-translate-y-1 hover:border-primary/40">
                <div className="flex items-center justify-between">
                  <s.i className="h-7 w-7 text-primary" />
                  <span className="font-display text-4xl font-bold text-foreground/10">0{k + 1}</span>
                </div>
                <h3 className="mt-6 text-xl font-bold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* COURSES */}
      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <Reveal><h2 className="text-3xl font-bold sm:text-5xl">Featured courses</h2></Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { t: "BSc (Hons) Public Health with Foundation Year", m: "Luton · 4 years · Full-time" },
            { t: "BA (Hons) Business Management", m: "Manchester · Derby · Birmingham" },
            { t: "Health & Social Care", m: "Manchester / Salford · Flexible days" },
          ].map((c, k) => (
            <Reveal key={c.t} delay={k * 0.1}>
              <div className="relative h-full overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-secondary to-background p-6">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/20 blur-2xl" />
                <h3 className="relative text-lg font-bold leading-snug">{c.t}</h3>
                <p className="relative mt-4 flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{c.m}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-secondary/30 py-20">
        <div className="mx-auto grid max-w-6xl gap-4 px-5 sm:px-8 md:grid-cols-3">
          {[
            { q: "I didn't think university was for me. Momentum One made every step simple.", n: "Amira, Birmingham" },
            { q: "They helped me prep for the PFF day — I got my offer the same week.", n: "Daniel, Manchester" },
            { q: "Back in education at 34 studying Health & Social Care. Best decision ever.", n: "Sofia, London" },
          ].map((t, k) => (
            <Reveal key={t.n} delay={k * 0.1}>
              <figure className="glass h-full rounded-2xl p-6">
                <blockquote className="text-base leading-relaxed">“{t.q}”</blockquote>
                <figcaption className="mt-4 text-xs text-muted-foreground">— {t.n}</figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
        <Reveal><h2 className="text-3xl font-bold sm:text-4xl">Questions</h2></Reveal>
        <Accordion type="single" collapsible className="mt-8">
          {([
            ["Do I need A-levels?", "No. Offers are based on passing the Prepare for Foundation (PFF) Day, regardless of age, experience or academic background."],
            ["Does your service cost anything?", "Our guidance is free for students."],
            ["What documents will I need?", "Photo ID (passport or ID card), a share code if non-UK, proof of address, and ideally a CV and any certificates."],
            ["When does the next intake start?", "January 2027 — applications are already open, so the sooner you start the better."],
          ] as const).map(([q, a]) => (
            <AccordionItem key={q} value={q}>
              <AccordionTrigger className="text-left font-display">{q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="mt-12 text-center">
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="inline-flex rounded-full bg-launch px-8 py-4 font-display font-semibold text-primary-foreground glow">Get my offer →</a>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Momentum One · Building Momentum For Your Future
      </footer>
    </main>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return <div><div className="font-display text-2xl font-bold">{n}</div><div className="text-xs text-muted-foreground">{l}</div></div>;
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.8, delay, ease }} className="h-full">
      {children}
    </motion.div>
  );
}
