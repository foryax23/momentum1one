import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Download, Loader2, Mail, Rocket } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { INTAKES, INTERESTS, UK_CITIES, type LeadResult } from "@/lib/funnel";
import { submitLead } from "@/lib/leads.functions";
import { cn } from "@/lib/utils";

type Data = { full_name: string; city: string; interest: string; intake: string; email: string; phone: string; consent: boolean };
const STEPS = 5;
const ease = [0.22, 1, 0.36, 1] as const;

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
  const pick = <K extends keyof Data>(k: K, v: Data[K]) => { set(k, v); setTimeout(() => go(step + 1), 220); };

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
      toast.error("Couldn't create the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="glass relative w-full overflow-hidden rounded-3xl p-5 shadow-2xl sm:p-7">
      {step < STEPS && (
        <div className="mb-6 flex items-center gap-3">
          {step > 0 ? (
            <button onClick={() => go(step - 1)} aria-label="Back" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground transition hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : (
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-launch text-primary-foreground"><Rocket className="h-4 w-4" /></span>
          )}
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
            <motion.div className="absolute inset-y-0 left-0 rounded-full bg-launch glow" animate={{ width: `${((step + 1) / STEPS) * 100}%` }} transition={{ duration: 0.6, ease }} />
          </div>
          <span className="shrink-0 font-display text-xs tabular-nums text-muted-foreground">{step + 1}/{STEPS}</span>
        </div>
      )}

      <AnimatePresence mode="wait" custom={dir} initial={false}>
        <motion.div
          key={step}
          custom={dir}
          initial={{ opacity: 0, x: dir * 40, filter: "blur(6px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, x: dir * -40, filter: "blur(6px)" }}
          transition={{ duration: 0.4, ease }}
        >
          {step === 0 && (
            <form onSubmit={(e) => { e.preventDefault(); if (d.full_name.trim().length >= 2) go(1); }}>
              <Q title="First, what's your name?" sub="Takes 60 seconds. Your personalised offer is waiting at the end." />
              <input
                autoComplete="name" value={d.full_name} maxLength={100} onChange={(e) => set("full_name", e.target.value)}
                placeholder="Full name" className="mt-5 w-full rounded-2xl border border-input bg-background/60 px-5 py-4 text-lg outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20"
              />
              <Next disabled={d.full_name.trim().length < 2} />
            </form>
          )}

          {step === 1 && (
            <div>
              <Q title={`Nice to meet you, ${first}. Where are you closest to?`} sub="We'll match you with the nearest campus." />
              <div className="mt-5 grid max-h-[46vh] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:max-h-80 sm:grid-cols-3">
                {UK_CITIES.map((c, i) => (
                  <motion.button
                    key={c} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                    onClick={() => pick("city", c)}
                    className={cn("rounded-xl border px-3 py-3 text-left text-sm font-medium transition active:scale-95", d.city === c ? "border-primary bg-primary/15 text-foreground" : "border-border bg-background/40 text-muted-foreground hover:border-primary/60 hover:text-foreground")}
                  >{c}</motion.button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <Q title="What would you love to study?" sub="Pick the closest match — you can change it later." />
              <div className="mt-5 space-y-2">
                {INTERESTS.map((o) => (
                  <Option key={o.value} active={d.interest === o.value} onClick={() => pick("interest", o.value)} icon={o.emoji} label={o.value} hint={o.hint} />
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <Q title="When would you like to start?" sub="January 2027 applications are open right now." />
              <div className="mt-5 space-y-2">
                {INTAKES.map((o) => (
                  <Option key={o.value} active={d.intake === o.value} onClick={() => pick("intake", o.value)} icon="◷" label={o.value} hint={o.hint} />
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
              <Q title="Where should we send your offer?" sub="Your certificate is generated instantly and emailed to you." />
              <div className="mt-5 space-y-3">
                <Field type="email" autoComplete="email" placeholder="Email address" value={d.email} onChange={(v) => set("email", v)} ok={emailOk} />
                <Field type="tel" autoComplete="tel" placeholder="UK mobile (07…)" value={d.phone} onChange={(v) => set("phone", v)} ok={phoneOk} />
                <label className="flex cursor-pointer items-start gap-3 pt-1 text-xs leading-relaxed text-muted-foreground">
                  <input type="checkbox" checked={d.consent} onChange={(e) => set("consent", e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--primary)]" />
                  I agree that Momentum One may contact me by phone, email or WhatsApp about university options.
                </label>
              </div>
              <button
                disabled={!emailOk || !phoneOk || !d.consent || loading}
                className="group mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-launch px-6 py-4 font-display font-semibold text-primary-foreground glow transition active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Rocket className="h-5 w-5 transition group-hover:-translate-y-1" />}
                {loading ? "Preparing launch…" : "Get my offer"}
              </button>
            </form>
          )}

          {step === STEPS && result && (
            <div className="text-center">
              <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: [40, -10, 0], opacity: 1 }} transition={{ duration: 1.1, ease }} className="relative mx-auto grid h-20 w-20 place-items-center rounded-full bg-launch glow">
                <Rocket className="h-9 w-9 -rotate-45 text-primary-foreground" />
                <motion.span className="absolute inset-0 rounded-full border-2 border-primary" initial={{ scale: 1, opacity: 0.8 }} animate={{ scale: 2.2, opacity: 0 }} transition={{ duration: 1.6, repeat: Infinity }} />
              </motion.div>
              <h3 className="mt-6 text-2xl font-bold sm:text-3xl">Lift-off, {first}!</h3>
              <p className="mt-2 text-sm text-muted-foreground">Your Certificate of Pre-Approved Pathway is ready.</p>

              <motion.div initial={{ rotateX: 30, opacity: 0, y: 20 }} animate={{ rotateX: 0, opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8, ease }} style={{ perspective: 800 }}
                className="mx-auto mt-6 rounded-xl border-2 border-gold/70 bg-foreground p-1.5 text-left shadow-2xl">
                <div className="rounded-lg border border-accent/40 px-4 py-5 text-center text-background">
                  <p className="text-[9px] tracking-[0.3em] text-gold">CERTIFICATE OF PRE-APPROVED PATHWAY</p>
                  <p className="mt-3 font-serif text-3xl italic font-semibold">{result.full_name}</p>
                  <div className="mx-auto mt-2 h-px w-40 bg-gold" />
                  <p className="mt-3 text-xs opacity-70">{result.interest ?? "University pathway"} · {result.intake ?? "January 2027"} · {result.city}</p>
                  <p className="mt-2 font-display text-[10px] tracking-widest opacity-60">{result.ref_code}</p>
                </div>
              </motion.div>

              <button onClick={download} disabled={downloading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-launch px-6 py-4 font-display font-semibold text-primary-foreground glow transition active:scale-[0.98] disabled:opacity-60">
                {downloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                Download your offer (PDF)
              </button>
              <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground"><Mail className="h-3.5 w-3.5" /> An advisor will call you within 24 hours.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Q({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h3 className="text-2xl font-bold leading-tight sm:text-[1.75rem]">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}

function Next({ disabled }: { disabled: boolean }) {
  return (
    <button disabled={disabled} className="group mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-launch px-6 py-4 font-display font-semibold text-primary-foreground glow transition active:scale-[0.98] disabled:opacity-40 disabled:shadow-none">
      Continue <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
    </button>
  );
}

function Option({ active, onClick, icon, label, hint }: { active: boolean; onClick: () => void; icon: string; label: string; hint: string }) {
  return (
    <button onClick={onClick} className={cn("flex w-full items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition active:scale-[0.98]", active ? "border-primary bg-primary/15" : "border-border bg-background/40 hover:border-primary/60")}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-lg">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{label}</span>
        <span className="block truncate text-xs text-muted-foreground">{hint}</span>
      </span>
      {active ? <Check className="h-5 w-5 shrink-0 text-primary" /> : <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
    </button>
  );
}

function Field({ ok, onChange, ...p }: { ok: boolean; onChange: (v: string) => void; value: string; type: string; placeholder: string; autoComplete: string }) {
  return (
    <div className="relative">
      <input {...p} maxLength={255} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border border-input bg-background/60 px-5 py-4 pr-12 text-base outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20" />
      {ok && <Check className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />}
    </div>
  );
}
