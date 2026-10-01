import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import promo from "@/assets/promo/momentum-one-promo.mp4.asset.json";
import poster from "@/assets/promo/momentum-one-promo-poster.jpg.asset.json";
import { IconArrowRight, IconTick } from "@/components/icons";

export function PromoVideoFeature() {
  const video = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const node = video.current;
    if (!node || reduce) return;
    const onVisibility = () => document.hidden ? node.pause() : void node.play().catch(() => undefined);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [reduce]);

  return (
    <section className="relative overflow-hidden bg-primary py-20 text-primary-foreground sm:py-28">
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:48px_48px]" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[.82fr_1.18fr] lg:gap-20">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative mx-auto w-full max-w-[360px]">
          <div className="absolute -inset-5 rounded-[2.2rem] border border-primary-foreground/15 bg-primary-foreground/5" />
          <div className="relative aspect-[9/16] overflow-hidden rounded-[1.65rem] border border-primary-foreground/20 bg-primary shadow-2xl">
            <img src={poster.url} alt="Momentum One student experience" className="absolute inset-0 h-full w-full object-cover" />
            {!reduce && <video ref={video} muted autoPlay loop playsInline preload="metadata" poster={poster.url} className="absolute inset-0 h-full w-full object-cover"><source src={promo.url} type="video/mp4" /></video>}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-gold">Study built around real life</p>
          <h2 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">A local route into a UK degree.</h2>
          <p className="mt-5 text-lg leading-relaxed text-primary-foreground/75">Explore the course, campus and entry route that fit your goals. Momentum One gives you a clear next step, a personalised information pack and access to an advisor.</p>
          <ul className="mt-8 grid gap-4">
            {["Foundation Year and selected Year 1 routes", "Campuses in Manchester, Sunderland, Derby, Newcastle and Luton", "Day, evening and weekend patterns on selected courses"].map((item) => <li key={item} className="flex items-start gap-3"><span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold text-primary"><IconTick size={15} /></span><span className="font-semibold">{item}</span></li>)}
          </ul>
          <a href="#signup" className="mt-8 inline-flex h-13 items-center gap-2 rounded-lg bg-gold px-6 font-bold text-primary transition-transform hover:-translate-y-0.5 active:translate-y-0">Check my options <IconArrowRight size={18} /></a>
        </motion.div>
      </div>
    </section>
  );
}