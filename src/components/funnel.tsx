import { useEffect, useState } from "react";
import { loadOfferPdf } from "@/lib/load-offer-pdf";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { UK_CITIES, nearestCampus, type LeadResult } from "@/lib/funnel";
import { coursesForCampus } from "@/lib/offer-catalog";
import { submitLead } from "@/lib/leads.functions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { IconArrowLeft, IconArrowRight, IconDownload, IconPin, IconTick, Spinner } from "./icons";
import { RocketAssembly } from "./funnel-scenes";

type Data = { full_name: string; city: string; selected_course: string; study_route: "Foundation Year" | "Year 1" | ""; email: string; phone: string; whatsapp: boolean; consent: boolean; email_marketing: boolean; phone_marketing: boolean; whatsapp_marketing: boolean; website: string };
const STEPS = 5;
const LABELS = ["Name", "Location", "Course", "Phone", "Email"];
const COUNTRY_CODES: [string, string][] = [["44","UK"],["353","Ireland"],["40","Romania"],["48","Poland"],["359","Bulgaria"],["370","Lithuania"],["371","Latvia"],["372","Estonia"],["36","Hungary"],["420","Czechia"],["421","Slovakia"],["39","Italy"],["34","Spain"],["351","Portugal"],["33","France"],["49","Germany"],["31","Netherlands"],["32","Belgium"],["30","Greece"],["385","Croatia"],["90","Turkey"],["380","Ukraine"],["373","Moldova"],["91","India"],["92","Pakistan"],["880","Bangladesh"],["234","Nigeria"],["233","Ghana"],["254","Kenya"],["27","South Africa"],["20","Egypt"],["971","UAE"],["966","Saudi Arabia"],["86","China"],["63","Philippines"],["1","USA/Canada"],["55","Brazil"]];
const WA_NUMBER = "447593855452";
const DRAFT_KEY = "momentum-one-application";
const ease = [0.22, 1, 0.36, 1] as const;

export function Funnel() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [d, setD] = useState<Data>({ full_name: "", city: "", selected_course: "", study_route: "", email: "", phone: "", whatsapp: true, consent: false, email_marketing: false, phone_marketing: false, whatsapp_marketing: false, website: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LeadResult | null>(null);
  const [downloading, setDownloading] = useState(false);
  const send = useServerFn(submitLead);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(DRAFT_KEY);
       if (saved) setD((current) => ({ ...current, ...JSON.parse(saved), consent: false, email_marketing: false, phone_marketing: false, whatsapp_marketing: false, website: "" }));
    } catch { /* Ignore unavailable or malformed storage. */ }
  }, []);
  useEffect(() => {
    const onCity = (event: Event) => {
      const city = (event as CustomEvent<string>).detail;
      if (UK_CITIES.includes(city as (typeof UK_CITIES)[number])) {
        set("city", city as (typeof UK_CITIES)[number]);
        go(2);
      }
    };
    window.addEventListener("mo:pick-city", onCity);
    return () => window.removeEventListener("mo:pick-city", onCity);
  }, []);

  useEffect(() => {
    if (!result) window.localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  }, [d, result]);

  const go = (next: number) => { setDir(next > step ? 1 : -1); setStep(next); };
  const set = <K extends keyof Data>(key: K, value: Data[K]) => setD((current) => ({ ...current, [key]: value }));
  const first = d.full_name.trim().split(" ")[0];
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim());
  const [cc, setCcState] = useState("44");
  useEffect(() => { const v = window.localStorage.getItem(DRAFT_KEY + "-cc"); if (v) setCcState(v); }, []);
  const setCc = (v: string) => { setCcState(v); window.localStorage.setItem(DRAFT_KEY + "-cc", v); };
  const local = d.phone.replace(/\D/g, "").replace(/^0+/, "");
  const phoneOk = cc === "44" ? /^7\d{9}$/.test(local) : local.length >= 6 && local.length <= 14;
  const fullPhone = `+${cc} ${local}`;
  const campus = d.city ? nearestCampus(d.city as (typeof UK_CITIES)[number]) : null;
  const courses = coursesForCampus(campus?.full ?? null);
  const [preferred, setPreferred] = useState("");
  useEffect(() => {
    const onPick = (event: Event) => {
      const title = (event as CustomEvent<string>).detail;
      setPreferred(title);
      setD((current) => ({ ...current, selected_course: "", study_route: "" }));
    };
    window.addEventListener("mo:pick-course", onPick);
    return () => window.removeEventListener("mo:pick-course", onPick);
  }, []);
  useEffect(() => {
    if (!preferred || d.selected_course) return;
    const match = courses.find((c) => c.title === preferred && c.route === "Foundation Year");
    if (match) setD((current) => ({ ...current, selected_course: match.title, study_route: match.route }));
  }, [preferred, courses, d.selected_course]);

  async function submit() {
    if (!emailOk || !phoneOk || !d.consent || !campus || !d.selected_course || !d.study_route) return;
    setLoading(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const row = await send({ data: {
        full_name: d.full_name.trim(), email: d.email.trim(), phone: fullPhone,
        city: d.city as (typeof UK_CITIES)[number], interest: null, intake: "January 2027", consent: true,
         whatsapp: d.whatsapp, email_marketing: d.email_marketing, phone_marketing: d.phone_marketing, whatsapp_marketing: d.whatsapp_marketing, nearest_campus: campus.full, distance_miles: campus.miles,
        source: params.get("src") ?? params.get("utm_source"), campaign: params.get("utm_campaign"),
        page: window.location.href.slice(0, 500), website: d.website,
        selected_course: d.selected_course, study_route: d.study_route,
      }});
      setResult(row);
      window.localStorage.removeItem(DRAFT_KEY);
      go(STEPS);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally { setLoading(false); }
  }

  async function download() {
    if (!result) return;
    setDownloading(true);
    try {
      const { downloadOffer } = await loadOfferPdf();
      await downloadOffer(result);
    } catch (error) {
      console.error(error);
      toast.error("We couldn't create the PDF. Please try again.");
    } finally { setDownloading(false); }
  }

  return (
    <div id="signup" className="relative w-full scroll-mt-24 overflow-hidden rounded-[22px] border border-border bg-card shadow-paper">
      {step < STEPS && <Progress step={step} onBack={() => step > 0 && go(step - 1)} />}
      <div className={cn("p-5 sm:p-6", result && "pb-24 sm:pb-6")}>
        {step < STEPS && <RocketAssembly step={step} />}
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div key={step} custom={dir}
            initial={{ opacity: 0, x: dir * 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -28 }}
            transition={{ duration: 0.42, ease }}>
            {step === 0 && (
              <form onSubmit={(event) => { event.preventDefault(); if (d.full_name.trim().length >= 2) go(1); }} className="space-y-4">
                <Question title="What's your name?" hint="So we know what to call you." />
                <FieldLabel>Full name</FieldLabel>
                <input autoFocus autoComplete="name" value={d.full_name} maxLength={100} onChange={(event) => set("full_name", event.target.value)} placeholder="e.g. Amira Khan" className={inputClass} />
                <Primary disabled={d.full_name.trim().length < 2}>Next question <IconArrowRight size={20} /></Primary>
                <p className="text-center text-xs text-muted-foreground">Four quick questions. No long application.</p>
              </form>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <Question title={`Hi ${first}, where in the UK do you live?`} hint="Choose the nearest major city and we will match your campus." />
                <div className="grid max-h-60 grid-cols-2 gap-2 overflow-y-auto pr-1">
                  {UK_CITIES.map((city) => (
                    <Button key={city} type="button" variant="outline" onClick={() => set("city", city)}
                      className={cn("h-10 justify-start rounded-full px-3 shadow-none", d.city === city && "border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground")}>{city}</Button>
                  ))}
                </div>
                {campus && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-xl border border-border bg-secondary p-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><IconPin size={18} /></span>
                    <p className="text-sm"><strong className="block text-primary">Nearest campus: {campus.name}</strong><span className="text-muted-foreground">About {campus.miles} miles from {d.city}</span></p>
                  </motion.div>
                )}
                <Primary type="button" disabled={!d.city} onClick={() => go(2)}>Choose my course <IconArrowRight size={20} /></Primary>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <Question title={`What would you like to study in ${campus?.name}?`} hint="Choose a course and entry route for your personalised offer." />
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {courses.map((course) => {
                    const selected = d.selected_course === course.title && d.study_route === course.route;
                    return <Button key={course.id} type="button" variant="outline" onClick={() => setD((current) => ({ ...current, selected_course: course.title, study_route: course.route }))}
                      className={cn("h-auto min-h-16 w-full justify-start whitespace-normal rounded-xl px-4 py-3 text-left shadow-none", selected && "border-primary bg-secondary ring-2 ring-primary/20")}>
                      <span><strong className="block text-sm text-primary">{course.title}</strong><span className="mt-1 block text-xs text-muted-foreground">{course.route} · {course.university}</span></span>
                    </Button>;
                  })}
                </div>
                <Primary type="button" disabled={!d.selected_course} onClick={() => go(3)}>Use this course <IconArrowRight size={20} /></Primary>
              </div>
            )}

            {step === 3 && (
              <form onSubmit={(event) => { event.preventDefault(); if (phoneOk) go(4); }} className="space-y-4">
                <Question title="What's the best number to reach you?" hint="A course advisor will use it to discuss your options." />
                <FieldLabel>Mobile number</FieldLabel>
                <div className="flex gap-2"><select aria-label="Country code" value={cc} onChange={(event) => setCc(event.target.value)} className="h-14 w-28 shrink-0 rounded-xl border border-border bg-secondary px-2 font-bold text-primary outline-none focus:border-teal">{COUNTRY_CODES.map(([code, name]) => <option key={name} value={code}>{name} +{code}</option>)}</select><input type="tel" autoFocus autoComplete="tel" value={d.phone} maxLength={20} onChange={(event) => set("phone", event.target.value)} placeholder={cc === "44" ? "7700 900123" : "Mobile number without the country code"} className={cn(inputClass, "min-w-0 flex-1")} /></div>
                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border p-3">
                  <span><strong className="block text-sm">WhatsApp is okay</strong><span className="text-xs text-muted-foreground">Usually the quickest way to reach you</span></span>
                  <span className={cn("relative h-7 w-12 rounded-full transition-colors", d.whatsapp ? "bg-chart-4" : "bg-border")}><input type="checkbox" checked={d.whatsapp} onChange={(event) => set("whatsapp", event.target.checked)} className="absolute inset-0 z-10 cursor-pointer opacity-0" /><span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-card shadow transition-transform", d.whatsapp ? "translate-x-5" : "translate-x-0.5")} /></span>
                </label>
                 <Primary disabled={!phoneOk} onClick={() => phoneOk && go(4)}>Next question <IconArrowRight size={20} /></Primary>
                {d.phone && !phoneOk && <p className="text-sm font-medium text-destructive">{cc === "44" ? "Enter a valid UK mobile number." : "Enter a valid mobile number."}</p>}
              </form>
            )}

            {step === 4 && (
              <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="space-y-4">
                 <Question title="Where should we send your offer?" hint="We will prepare your personalised five-page course offer." />
                <FieldLabel>Email address</FieldLabel>
                <div className="relative"><input type="email" autoFocus autoComplete="email" value={d.email} maxLength={255} onChange={(event) => set("email", event.target.value)} placeholder="you@example.com" className={inputClass} />{emailOk && <IconTick size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-chart-4" />}</div>
                <input tabIndex={-1} autoComplete="off" value={d.website} onChange={(event) => set("website", event.target.value)} className="absolute left-[-9999px]" aria-hidden="true" />
                 <label className="flex cursor-pointer items-start gap-3 text-sm text-muted-foreground"><input type="checkbox" checked={d.consent} onChange={(event) => set("consent", event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--primary)]" /><span>I have read the <a href="/privacy" target="_blank" className="font-bold text-primary underline">privacy notice</a> and understand how my enquiry will be handled.</span></label>
                 <fieldset className="space-y-2 border-t border-border pt-3"><legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Optional updates</legend>
                   <ConsentChoice checked={d.whatsapp_marketing} onChange={(v) => set("whatsapp_marketing", v)}>WhatsApp updates</ConsentChoice>
                   <ConsentChoice checked={d.email_marketing} onChange={(v) => set("email_marketing", v)}>Email updates</ConsentChoice>
                   <ConsentChoice checked={d.phone_marketing} onChange={(v) => set("phone_marketing", v)}>Phone updates</ConsentChoice>
                 </fieldset>
                <Primary disabled={!emailOk || !d.consent || loading}>{loading ? <Spinner /> : null}{loading ? "Preparing your options" : "Show my course options"}{!loading && <IconArrowRight size={20} />}</Primary>
              </form>
            )}

            {step === STEPS && result && (
              <div className="grid justify-items-center gap-3 text-center">
                 <RocketAssembly step={STEPS - 1} complete />
                 <Question title={`Your offer is ready, ${first}.`} hint={`${result.selected_course} at ${result.nearest_campus}.`} centered />
                <div className="w-full rounded-xl bg-secondary p-4 text-left"><h3 className="font-sans text-sm font-bold">What happens next</h3><ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground"><li>We call or message you about the right course.</li><li>We check your documents and entry route.</li><li>We help you prepare for the PFF Day.</li></ol></div>
                 <Primary type="button" onClick={download} disabled={downloading}>{downloading ? <Spinner /> : <IconDownload size={20} />}Download your personalised offer</Primary>
                 <a href={result.offer_url} className="text-sm font-semibold text-primary underline underline-offset-4">Open your secure offer link</a>
                <WhatsAppRedirect name={first ?? ""} reference={result.ref_code} />
                <a href={`/auth?mode=up&email=${encodeURIComponent(d.email.trim())}`} className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-primary px-5 text-sm font-bold text-primary transition-colors hover:bg-secondary">Create my student account</a>
                <p className="text-xs text-muted-foreground">Reference: {result.ref_code}</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Progress({ step, onBack }: { step: number; onBack: () => void }) {
  return <div className="px-4 pt-4">
    <div className="flex min-h-8 items-center justify-between"><Button type="button" variant="ghost" size="sm" onClick={onBack} disabled={step === 0} className={cn("px-1 text-muted-foreground", step === 0 && "invisible")}><IconArrowLeft size={16} />Back</Button><span className="text-xs font-semibold tabular-nums text-muted-foreground">{step + 1} of {STEPS}</span></div>
    <div className="relative mx-3 mt-2 h-5"><div className="absolute left-[10%] right-[10%] top-2 h-0.5 bg-secondary" /><motion.div className="absolute left-[10%] top-2 h-0.5 bg-teal" animate={{ width: `${step * 20}%` }} transition={{ duration: .55, ease }} />
      {LABELS.map((label, index) => <span key={label} className={cn("absolute top-[11px] h-3 w-3 -translate-x-1/2 rounded-full border-2", index <= step ? "border-teal bg-teal" : "border-border bg-card")} style={{ left: `${10 + index * 20}%` }} />)}
    </div>
    <div className="flex justify-between px-1">{LABELS.map((label, index) => <span key={label} className={cn("w-1/5 text-center text-[9px] font-semibold uppercase tracking-wider", index <= step ? "text-primary" : "text-muted-foreground")}>{label}</span>)}</div>
  </div>;
}

const inputClass = "h-14 w-full rounded-xl border border-input bg-card px-4 text-base outline-none transition focus:border-teal focus:ring-4 focus:ring-teal/15";
function FieldLabel({ children }: { children: React.ReactNode }) { return <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</label>; }
function Question({ title, hint, centered = false }: { title: string; hint: string; centered?: boolean }) { return <div className={centered ? "text-center" : ""}><h2 className="text-[1.45rem] font-semibold leading-tight text-primary">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{hint}</p></div>; }
function Primary({ children, className, ...props }: React.ComponentProps<typeof Button>) { return <Button {...props} className={cn("h-14 w-full rounded-xl bg-primary px-5 text-base font-bold text-primary-foreground shadow-none transition-transform hover:bg-primary/95 active:scale-[.985]", className)}>{children}</Button>; }
function ConsentChoice({ checked, onChange, children }: { checked: boolean; onChange: (value: boolean) => void; children: React.ReactNode }) { return <label className="flex cursor-pointer items-center gap-3 text-sm text-muted-foreground"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[var(--primary)]" /><span>{children}</span></label>; }

function WhatsAppRedirect({ name, reference }: { name: string; reference: string }) {
  const [left, setLeft] = useState(6);
  const [cancelled, setCancelled] = useState(false);
  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Hi Momentum One, I'm ${name}. My reference is ${reference}.`)}`;
  useEffect(() => {
    if (cancelled) return;
    if (left <= 0) {
      if (window.self === window.top) window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    const t = window.setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left, cancelled, url]);
  return <div className="grid w-full gap-1">
    <a href={url} target="_blank" rel="noopener noreferrer" className="grid h-14 w-full place-items-center rounded-xl bg-chart-4 px-5 text-base font-bold text-primary-foreground transition-transform active:scale-[.985]">Connect with us on WhatsApp</a>
    {!cancelled && left > 0 && <p className="text-xs text-muted-foreground">Opening WhatsApp in {left}s. <button type="button" onClick={() => setCancelled(true)} className="font-semibold underline">Stay here</button></p>}
  </div>;
}
