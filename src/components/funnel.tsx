import { useState, type ComponentType } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { INTAKES, INTERESTS, UK_CITIES, type LeadResult } from "@/lib/funnel";
import { submitLead } from "@/lib/leads.functions";
import { cn } from "@/lib/utils";
import {
  IconArrowLeft, IconArrowRight, IconCare, IconCompass, IconDownload, IconGlobe, IconHanger, IconLedger, IconPhone, IconTick, Spinner,
} from "./icons";
import { UkMap } from "./uk-map";
import { BookScene, CalendarScene, EnvelopeScene, LiftOffScene } from "./funnel-scenes";

type Data = { full_name: string; city: string; interest: string; intake: string; email: string; phone: string; consent: boolean };
const STEPS = 5;
const LABELS = ["Name", "City", "Course", "Intake", "Contact"];
const ease = [0.22, 1, 0.36, 1] as const;
const ICONS: Record<string, ComponentType<{ size?: number }>> = { ledger: IconLedger, care: IconCare, globe: IconGlobe, hanger: IconHanger, compass: IconCompass };

export function Funnel() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [d, setD] = useState<Data>({ full_name: "", city: "", interest: "", intake: "", email: "", phone: "", consent: false });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LeadResult | null>(null);
  const [downloading, setDownloading] = useState(false);
  const send = useServerFn(submitLead);

  const go = (n: number) => { setDir(n > step ? 1 : -1); setStep(n); };
  const set = <K extends keyof Data>(k: K, v: Data[K]) => setD((p) => ({ ...p, [k]: v }));
  const pick = <K extends keyof Data>(k: K, v: Data[K], delay = 650) => { set(k, v); setTimeout(() => go(step + 1), delay); };

  const first = d.full_name.trim().split(" ")[0];
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim());
  const phoneOk = /^(\+44\s?7\d{3}|07\d{3})\s?\d{3}\s?\d{3}$/.test(d.phone.trim());

  async function submit() {
    if (!emailOk || !phoneOk || !d.consent) return;
    setLoading(true);
    try {
      const row = await send({
        data: {
          full_name: d.full_name.trim(), email: d.email.trim(), phone: d.phone.trim(),
          city: d.city as (typeof UK_CITIES)[number], interest: d.interest || null, intake: d.intake || null, consent: true,
        },
      });
      setResult(row);
      go(STEPS);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function download() {
    if (!result) return;
    setDownloading(true);
    try {
      const { downloadOffer } = await import("./offer-pdf");
      await downloadOffer(result);
    } catch (e) {
      console.error(e);
      toast.error("We couldn't create the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="relative w-full rounded-sm border-t-4 border-teal bg-stone p-5 shadow-paper sm:p-8">
      {step < STEPS && (
        <div className="mb-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold sm:text-xl">Application onboarding</h2>
            <span className="shrink-0 font-display text-[11px] font-bold tracking-[0.25em] text-muted-foreground">0{step + 1} / 0{STEPS}</span>
          </div>
          <div className="mt-3 flex gap-1.5">
            {LABELS.map((l, i) => (
              <div key={l} className="flex-1">
                <div className="h-1 overflow-hidden rounded-full bg-ink/10">
                  <motion.div className="h-full bg-teal" initial={false} animate={{ width: i <= step ? "100%" : "0%" }} transition={{ duration: 0.5, ease }} />
                </div>
                <span className={cn("mt-1 hidden text-[9px] font-bold uppercase tracking-widest sm:block", i <= step ? "text-teal" : "text-muted-foreground/60")}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait" custom={dir} initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, x: dir * 36, rotateY: dir * 8 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          exit={{ opacity: 0, x: dir * -36, rotateY: dir * -8 }}
          transition={{ duration: 0.45, ease }}
          style={{ transformPerspective: 1200 }}
        >
          {step === 0 && (
            <form onSubmit={(e) => { e.preventDefault(); if (d.full_name.trim().length >= 2) go(1); }}>
              <BookScene name={d.full_name.trim()} />
              <Q title="First, what's your name?" sub="It takes 60 seconds. Your personalised offer is waiting at the end." />
              <Label>Full name</Label>
              <input autoComplete="name" value={d.full_name} maxLength={100} onChange={(e) => set("full_name", e.target.value)} placeholder="e.g. Amira Khan" className={inputCls} />
              <Primary disabled={d.full_name.trim().length < 2}>Continue <IconArrowRight size={20} /></Primary>
            </form>
          )}

          {step === 1 && (
            <div>
              <Back onClick={() => go(0)} />
              <Q title={`Nice to meet you, ${first}. Which city are you closest to?`} sub="We'll match you with your nearest campus." />
              <div className="mt-4 grid grid-cols-[88px_minmax(0,1fr)] gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
                <UkMap selected={d.city} className="h-full max-h-56 w-full" />
                <div className="grid max-h-56 grid-cols-2 gap-1.5 overflow-y-auto pr-1">
                  {UK_CITIES.map((c) => (
                    <button key={c} onClick={() => pick("city", c, 900)}
                      className={cn("rounded-sm border px-2.5 py-2 text-left text-[13px] font-semibold transition active:scale-95", d.city === c ? "border-teal bg-teal text-accent-foreground" : "border-ink/15 bg-card hover:border-teal")}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <Back onClick={() => go(1)} />
              <Q title="What would you love to study?" sub="Pick the closest match. You can change it later." />
              <div className="mt-4 grid grid-cols-2 gap-2" style={{ perspective: 800 }}>
                {INTERESTS.map((o, i) => {
                  const I = ICONS[o.icon] ?? IconCompass;
                  const on = d.interest === o.value;
                  return (
                    <motion.button key={o.value} onClick={() => pick("interest", o.value)}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, rotateY: on ? 360 : 0 }} transition={{ delay: on ? 0 : i * 0.05, duration: on ? 0.6 : 0.4, ease }}
                      className={cn("flex flex-col items-start gap-2 rounded-sm border p-3 text-left transition", i === 4 && "col-span-2", on ? "border-teal bg-teal text-accent-foreground" : "border-ink/15 bg-card hover:border-teal")}>
                      <span className={on ? "text-accent-foreground" : "text-teal"}><I size={28} /></span>
                      <span className="text-sm font-bold leading-tight">{o.value}</span>
                      <span className={cn("text-[11px] leading-snug", on ? "text-accent-foreground/80" : "text-muted-foreground")}>{o.hint}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <Back onClick={() => go(2)} />
              <CalendarScene intake={d.intake} />
              <Q title="When would you like to start?" sub="January 2027 applications are open right now." />
              <div className="mt-4 space-y-2">
                {INTAKES.map((o) => (
                  <button key={o.value} onClick={() => pick("intake", o.value, 800)}
                    className={cn("flex w-full items-center justify-between gap-3 rounded-sm border px-4 py-3.5 text-left transition active:scale-[0.98]", d.intake === o.value ? "border-teal bg-teal text-accent-foreground" : "border-ink/15 bg-card hover:border-teal")}>
                    <span><span className="block font-bold">{o.value}</span><span className={cn("block text-xs", d.intake === o.value ? "text-accent-foreground/80" : "text-muted-foreground")}>{o.hint}</span></span>
                    {d.intake === o.value ? <IconTick size={20} /> : <IconArrowRight size={18} className="text-muted-foreground" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
              <Back onClick={() => go(3)} />
              <EnvelopeScene sealed={emailOk && phoneOk} />
              <Q title="Where should we send your offer?" sub="Your certificate is generated instantly." />
              <Label>Email address</Label>
              <Field type="email" autoComplete="email" placeholder="you@example.com" value={d.email} onChange={(v) => set("email", v)} ok={emailOk} />
              <Label>UK mobile</Label>
              <Field type="tel" autoComplete="tel" placeholder="07700 900123" value={d.phone} onChange={(v) => set("phone", v)} ok={phoneOk} />
              <label className="mt-4 flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-muted-foreground">
                <input type="checkbox" checked={d.consent} onChange={(e) => set("consent", e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--teal)]" />
                I agree that Momentum One may contact me by phone, email or WhatsApp about university options.
              </label>
              <Primary disabled={!emailOk || !phoneOk || !d.consent || loading}>
                {loading ? <Spinner /> : null}
                {loading ? "Preparing your offer" : "Get my offer"}
                {!loading && <IconArrowRight size={20} />}
              </Primary>
            </form>
          )}

          {step === STEPS && result && (
            <div className="text-center">
              <LiftOffScene />
              <h3 className="mt-3 text-2xl font-bold sm:text-3xl">Lift off, {first}.</h3>
              <p className="mt-1 text-sm text-muted-foreground">Your Certificate of Pre-Approved Pathway is ready.</p>

              <motion.div initial={{ y: 40, opacity: 0, rotateX: 25 }} animate={{ y: 0, opacity: 1, rotateX: 0 }} transition={{ delay: 0.6, duration: 0.9, ease }} style={{ transformPerspective: 900 }}
                className="relative mx-auto mt-5 border-2 border-gold bg-card p-1.5 shadow-paper">
                <div className="border border-teal/50 px-4 py-5">
                  <p className="text-[9px] font-bold tracking-[0.3em] text-gold">CERTIFICATE OF PRE-APPROVED PATHWAY</p>
                  <p className="mt-3 font-serif text-3xl font-semibold italic">{result.full_name}</p>
                  <div className="mx-auto mt-2 h-px w-40 bg-gold" />
                  <p className="mt-3 text-xs text-muted-foreground">{result.interest ?? "University pathway"} · {result.intake ?? "January 2027"} · {result.city}</p>
                  <p className="mt-2 font-display text-[10px] font-bold tracking-widest text-teal">{result.ref_code}</p>
                </div>
                <motion.div initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 1.3, type: "spring", stiffness: 300, damping: 12 }}
                  className="absolute -bottom-5 -right-4 grid h-14 w-14 place-items-center rounded-full border-2 border-gold bg-paper font-display text-[8px] font-bold leading-tight text-gold shadow-paper">
                  M1<br />2027
                </motion.div>
              </motion.div>

              <Primary type="button" onClick={download} disabled={downloading}>
                {downloading ? <Spinner /> : <IconDownload size={20} />}
                Download your offer (PDF)
              </Primary>
              <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground"><IconPhone size={16} /> An advisor will call you within 24 hours.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {step < STEPS && (
        <svg width="60" height="60" viewBox="0 0 60 60" className="pointer-events-none absolute -bottom-6 -right-6 text-gold" aria-hidden>
          <circle cx="30" cy="30" r="25" fill="var(--paper)" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2" />
          <path d="M22 30l5 5 11-11" stroke="currentColor" strokeWidth="2.5" fill="none" />
        </svg>
      )}
    </div>
  );
}

const inputCls = "w-full rounded border border-ink/15 bg-card px-4 py-3.5 text-base outline-none transition focus:border-transparent focus:ring-2 focus:ring-teal";

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 mt-4 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{children}</label>;
}

function Q({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mt-1">
      <h3 className="text-xl font-bold leading-tight sm:text-2xl">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}

function Back({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground transition hover:text-ink">
      <IconArrowLeft size={16} /> Back
    </button>
  );
}

function Primary({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...p} className="group mt-6 flex w-full items-center justify-center gap-3 rounded bg-ink px-6 py-4 font-display font-bold text-primary-foreground transition-all hover:bg-teal active:scale-[0.98] disabled:opacity-40 disabled:hover:bg-ink">
      {children}
    </button>
  );
}

function Field({ ok, onChange, ...p }: { ok: boolean; onChange: (v: string) => void; value: string; type: string; placeholder: string; autoComplete: string }) {
  return (
    <div className="relative">
      <input {...p} maxLength={255} onChange={(e) => onChange(e.target.value)} className={cn(inputCls, "pr-12")} />
      {ok && <IconTick size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-teal" />}
    </div>
  );
}
