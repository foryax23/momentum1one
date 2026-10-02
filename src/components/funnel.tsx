import { useEffect, useId, useRef, useState } from "react";
import { loadOfferPdf } from "@/lib/load-offer-pdf";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { UK_CITIES, nearestCampus, type LeadResult } from "@/lib/funnel";
import { coursesForCampus } from "@/lib/offer-catalog";
import { submitLead } from "@/lib/leads.functions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { IconArrowLeft, IconArrowRight, IconDownload, IconPin, IconTick, Spinner } from "./icons";
import { RocketAssembly, RocketStageLabel } from "./funnel-scenes";
import { useI18n } from "@/lib/i18n";
import { easeOut } from "@/lib/motion";

type Data = { full_name: string; city: string; selected_course: string; study_route: "Foundation Year" | "Year 1" | ""; email: string; phone: string; whatsapp: boolean; consent: boolean; email_marketing: boolean; phone_marketing: boolean; whatsapp_marketing: boolean; website: string };
type CoursePick = { title: string; route?: "Foundation Year" | "Year 1"; campus?: string };
const STEPS = 5;
const COUNTRY_CODES: [string, string][] = [["44","UK"],["353","Ireland"],["40","Romania"],["48","Poland"],["359","Bulgaria"],["370","Lithuania"],["371","Latvia"],["372","Estonia"],["36","Hungary"],["420","Czechia"],["421","Slovakia"],["39","Italy"],["34","Spain"],["351","Portugal"],["33","France"],["49","Germany"],["31","Netherlands"],["32","Belgium"],["30","Greece"],["385","Croatia"],["90","Turkey"],["380","Ukraine"],["373","Moldova"],["91","India"],["92","Pakistan"],["880","Bangladesh"],["234","Nigeria"],["233","Ghana"],["254","Kenya"],["27","South Africa"],["20","Egypt"],["971","UAE"],["966","Saudi Arabia"],["86","China"],["63","Philippines"],["1","USA/Canada"],["55","Brazil"]];
const WA_NUMBER = "447593855452";
const DRAFT_KEY = "momentum-one-application";
// AnimatePresence hands the latest `custom` to the step that is leaving, so Back slides the right way. `shift` is the direction, or 0 for reduced motion (a plain fade).
// The old step is gone in 120ms so the next field is on screen and focusable almost at once; its own entrance never blocks typing.
// Every state carries a translateX so the resting markup is the same on the server, on the client and with reduced motion.
const slide = {
  enter: (shift: number) => ({ opacity: 0, transform: `translateX(${shift * 16}px)` }),
  center: { opacity: 1, transform: "translateX(0px)", transition: { duration: 0.22, ease: easeOut } },
  exit: (shift: number) => ({ opacity: 0, transform: `translateX(${shift * -8}px)`, transition: { duration: 0.12, ease: easeOut } }),
};
// Press feedback for everything tappable in the funnel: named properties only, so nothing else animates by accident. Opacity is listed so a button fades between disabled and ready instead of snapping.
const press = "transition-[transform,translate,scale,opacity,background-color,border-color,color,box-shadow] duration-160 ease-out active:scale-[0.97]";
// Same pattern as zod's .email() on the server, so an address the button accepts is not rejected after submit.
const EMAIL = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9-]*\.)+[A-Z]{2,}$/i;
// Storage throws in private mode or when site data is blocked; the funnel has to keep working without it.
const store = {
  get: (key: string) => { try { return window.localStorage.getItem(key); } catch { return null; } },
  set: (key: string, value: string) => { try { window.localStorage.setItem(key, value); } catch { /* Not saved. */ } },
  remove: (key: string) => { try { window.localStorage.removeItem(key); } catch { /* Nothing to clear. */ } },
};
const validLocal = (cc: string, local: string) => (cc === "44" ? /^7\d{9}$/.test(local) : local.length >= 6 && local.length <= 14);
// Paste and autofill usually deliver the whole number ("+44 7700…", "0044 7700…"): the digits after "+"/"00", or null for a national number.
function internationalDigits(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return raw.trim().startsWith("+") ? digits : digits.startsWith("00") ? digits.slice(2) : null;
}
function localNumber(raw: string, cc: string) {
  const international = internationalDigits(raw);
  const digits = international ?? raw.replace(/\D/g, "");
  const national = digits.replace(/^0+/, "");
  if (!digits.startsWith(cc)) return national;
  const stripped = digits.slice(cc.length).replace(/^0+/, "");
  // Without "+" or "00" the leading digits may belong to the number itself, so drop them only when that is what makes it valid.
  return international !== null || (!validLocal(cc, national) && validLocal(cc, stripped)) ? stripped : national;
}

export function Funnel() {
  const { t, locale } = useI18n();
  const uid = useId();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const reduce = useReducedMotion();
  const shift = reduce ? 0 : dir;
  const [d, setD] = useState<Data>({ full_name: "", city: "", selected_course: "", study_route: "", email: "", phone: "", whatsapp: true, consent: false, email_marketing: false, phone_marketing: false, whatsapp_marketing: false, website: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LeadResult | null>(null);
  const [downloading, setDownloading] = useState(false);
  const send = useServerFn(submitLead);

  useEffect(() => {
    try {
      const saved = JSON.parse(store.get(DRAFT_KEY) ?? "null");
       if (saved && typeof saved === "object") setD((current) => ({ ...current, ...saved, city: UK_CITIES.includes(saved.city) ? saved.city : "", consent: false, email_marketing: false, phone_marketing: false, whatsapp_marketing: false, website: "" }));
    } catch { /* Ignore a malformed draft. */ }
  }, []);
  // Page-level buttons talk to the funnel through window events; the ref gives those handlers the current state.
  const latest = useRef({ name: "", city: "", done: false, go: (_next: number) => {} });
  useEffect(() => {
    const onCity = (event: Event) => {
      const city = (event as CustomEvent<string>).detail;
      if (latest.current.done || !UK_CITIES.includes(city as (typeof UK_CITIES)[number])) return;
      set("city", city as (typeof UK_CITIES)[number]);
      latest.current.go(latest.current.name.trim().length >= 2 ? 2 : 0);
    };
    window.addEventListener("mo:pick-city", onCity);
    return () => window.removeEventListener("mo:pick-city", onCity);
  }, []);

  useEffect(() => {
    if (!result) store.set(DRAFT_KEY, JSON.stringify(d));
  }, [d, result]);

  // The name field must not grab focus on load on phones: that scrolls the page and can open the keyboard unasked.
  const nameInput = useRef<HTMLInputElement>(null);
  const [navigated, setNavigated] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(min-width: 1024px)").matches && window.scrollY < 40) nameInput.current?.focus({ preventScroll: true });
  }, []);

  const card = useRef<HTMLDivElement>(null);
  const go = (next: number) => {
    setNavigated(true); setDir(next > step ? 1 : -1); setStep(next);
    // Steps differ in height, so bring the new question back into view when the card top has drifted off screen.
    requestAnimationFrame(() => {
      const top = card.current?.getBoundingClientRect().top ?? 0;
      if (top < 0 || top > window.innerHeight * 0.35) card.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    });
  };
  const set = <K extends keyof Data>(key: K, value: Data[K]) => setD((current) => ({ ...current, [key]: value }));
  const first = d.full_name.trim().split(" ")[0];
  const emailOk = EMAIL.test(d.email.trim());
  const [emailTouched, setEmailTouched] = useState(false);
  const emailError = emailTouched && d.email.trim() !== "" && !emailOk;
  const [cc, setCcState] = useState("44");
  useEffect(() => { const v = store.get(DRAFT_KEY + "-cc"); if (v && COUNTRY_CODES.some(([code]) => code === v)) setCcState(v); }, []);
  const setCc = (v: string) => { setCcState(v); store.set(DRAFT_KEY + "-cc", v); };
  const local = localNumber(d.phone, cc);
  const phoneOk = validLocal(cc, local);
  const phoneError = d.phone !== "" && !phoneOk;
  const fullPhone = `+${cc} ${local}`;
  const setPhone = (value: string) => {
    set("phone", value);
    // A full international number names its own country: follow it rather than reject it against the selected one.
    const international = internationalDigits(value);
    const code = international ? COUNTRY_CODES.find(([known]) => international.startsWith(known))?.[0] : undefined;
    if (code && code !== cc) setCc(code);
  };
  const campus = d.city ? nearestCampus(d.city as (typeof UK_CITIES)[number]) : null;
  const courses = coursesForCampus(campus?.full ?? null);
  latest.current = { name: d.full_name, city: d.city, done: result !== null, go };
  // A course picked for one campus must not survive a switch to a campus that does not run it.
  useEffect(() => {
    if (d.selected_course && !courses.some((c) => c.title === d.selected_course && c.route === d.study_route)) setD((current) => ({ ...current, selected_course: "", study_route: "" }));
  }, [courses, d.selected_course, d.study_route]);
  const [preferred, setPreferred] = useState<{ title: string; route: "Foundation Year" | "Year 1" } | null>(null);
  useEffect(() => {
    // The course deck sends a title; a comparison row sends { title, route, campus } so that exact row can be preselected.
    const onPick = (event: Event) => {
      const detail = (event as CustomEvent<string | CoursePick>).detail;
      const pick: CoursePick | null = typeof detail === "string" ? { title: detail } : detail;
      if (latest.current.done || typeof pick?.title !== "string") return;
      const city = UK_CITIES.find((known) => known === pick.campus);
      setPreferred({ title: pick.title, route: pick.route === "Year 1" ? "Year 1" : "Foundation Year" });
      setD((current) => ({ ...current, city: city ?? current.city, selected_course: "", study_route: "" }));
      latest.current.go(latest.current.name.trim().length < 2 ? 0 : city || latest.current.city ? 2 : 1);
    };
    window.addEventListener("mo:pick-course", onPick);
    return () => window.removeEventListener("mo:pick-course", onPick);
  }, []);
  useEffect(() => {
    if (!preferred || d.selected_course) return;
    const match = courses.find((c) => c.title === preferred.title && c.route === preferred.route) ?? courses.find((c) => c.title === preferred.title);
    if (match) setD((current) => ({ ...current, selected_course: match.title, study_route: match.route }));
  }, [preferred, courses, d.selected_course]);

  const questions = [
    { title: t("funnel.nameQuestion", undefined, "What's your name?"), hint: t("funnel.nameHint", undefined, "So we know what to call you.") },
    { title: t("funnel.cityQuestion", { name: first ?? "" }, `Hi ${first}, where in the UK do you live?`), hint: t("funnel.cityHint", undefined, "Choose the nearest major city and we will match your campus.") },
    { title: t("funnel.studyQuestion", { campus: campus?.name ?? "" }, `What would you like to study in ${campus?.name}?`), hint: t("funnel.studyHint", undefined, "Choose a course and entry route for your personalised offer.") },
    { title: t("funnel.phoneQuestion", undefined, "What's the best number to reach you?"), hint: t("funnel.phoneHint", undefined, "A course advisor will use it to discuss your options.") },
    { title: t("funnel.emailQuestion", undefined, "What's your email address?"), hint: t("funnel.emailHint", undefined, "Your personalised offer opens on the next screen. Your advisor will use this email to stay in touch.") },
  ];
  const privacyText = t("funnel.privacy", undefined, "I have read the privacy notice and understand how my enquiry will be handled.");
  const privacyLink = t("funnel.privacyLink", undefined, "privacy notice");
  const privacyAt = privacyText.indexOf(privacyLink);

  async function submit() {
    // A draft or a page-level course pick can leave an earlier answer missing: go back to it instead of failing silently.
    if (d.full_name.trim().length < 2) { go(0); return; }
    if (!campus) { go(1); return; }
    if (!d.selected_course || !d.study_route) { go(2); return; }
    if (!phoneOk) { go(3); return; }
    if (!emailOk || !d.consent) return;
    setLoading(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const row = await send({ data: {
        full_name: d.full_name.trim(), email: d.email.trim(), phone: fullPhone,
        city: d.city as (typeof UK_CITIES)[number], interest: null, intake: null, consent: true,
         whatsapp: d.whatsapp, email_marketing: d.email_marketing, phone_marketing: d.phone_marketing, whatsapp_marketing: d.whatsapp_marketing, nearest_campus: campus.full, distance_miles: campus.miles,
        source: (params.get("src") ?? params.get("utm_source"))?.slice(0, 100) ?? null, campaign: params.get("utm_campaign")?.slice(0, 100) ?? null,
        page: window.location.href.slice(0, 500), website: d.website,
        selected_course: d.selected_course, study_route: d.study_route,
      }});
      setResult(row);
      store.remove(DRAFT_KEY);
      go(STEPS);
    } catch (error) {
      // Server messages are English and validation failures arrive as raw JSON; show the applicant translated text instead.
      const unavailable = error instanceof Error && error.message.includes("not available at the selected campus");
      if (unavailable) go(2);
      toast.error(unavailable ? t("funnel.courseUnavailable", undefined, "That course is not available at the selected campus.") : t("funnel.error", undefined, "Something went wrong. Please check your details and try again."));
    } finally { setLoading(false); }
  }

  async function download() {
    if (!result) return;
    setDownloading(true);
    try {
      const { downloadOffer } = await loadOfferPdf();
      await downloadOffer(result, locale);
    } catch (error) {
      console.error(error);
      toast.error(t("funnel.pdfError", undefined, "We couldn't create the PDF. Please try again."));
    } finally { setDownloading(false); }
  }

  return (
    <div id="signup" ref={card} className="relative w-full scroll-mt-24 overflow-hidden rounded-[22px] border border-border bg-card shadow-paper">
      {step < STEPS && <Progress step={step} onBack={() => step > 0 && go(step - 1)} />}
      <div className={cn("px-5 pb-5 pt-3 sm:p-6", result && "pb-24 pt-5 sm:pb-6")}>
        {step < STEPS && (
          <div className="mb-4 flex items-center gap-4 sm:flex-col sm:items-stretch sm:gap-3">
            <RocketAssembly step={step} className="mx-0 shrink-0 sm:mx-auto" sizeClassName="h-28 sm:h-44" labelClassName="hidden sm:block" />
            <AnimatePresence mode="wait" custom={shift} initial={false}>
              <motion.div key={step} custom={shift} variants={slide} initial="enter" animate="center" exit="exit" className="min-w-0 flex-1">
                <RocketStageLabel step={step} className="mb-1 sm:hidden" />
                {questions[step] && <Question {...questions[step]} id={`${uid}-question`} focus={navigated && (step === 1 || step === 2)} />}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
        <AnimatePresence mode="wait" custom={shift} initial={false}>
          <motion.div key={step} custom={shift}
            variants={slide} initial="enter" animate="center" exit="exit">
            {step === 0 && (
              <form onSubmit={(event) => { event.preventDefault(); if (d.full_name.trim().length >= 2) go(1); }} className="space-y-4">
                 <FieldLabel htmlFor={`${uid}-name`}>{t("funnel.fullName", undefined, "Full name")}</FieldLabel>
                <input id={`${uid}-name`} ref={nameInput} autoFocus={navigated} autoComplete="name" required value={d.full_name} maxLength={100} onChange={(event) => set("full_name", event.target.value)} placeholder={t("funnel.namePlaceholder", undefined, "e.g. Amira Khan")} className={inputClass} />
                 <Primary disabled={d.full_name.trim().length < 2}>{t("funnel.next", undefined, "Next question")} <IconArrowRight size={20} /></Primary>
                 <p className="text-center text-xs text-muted-foreground">{t("funnel.quick", undefined, "Four more quick questions. No long application.")}</p>
              </form>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div role="group" aria-labelledby={`${uid}-question`} className="grid max-h-60 grid-cols-2 gap-2 overflow-y-auto pr-1">
                  {UK_CITIES.map((city) => (
                    <Button key={city} type="button" variant="outline" aria-pressed={d.city === city} onClick={() => set("city", city)}
                      className={cn("h-10 justify-start rounded-full px-3 shadow-none", press, d.city === city && "border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground")}>{city}</Button>
                  ))}
                </div>
                {/* initial={false}: a campus already chosen arrives with the step; only a first pick gets its own entrance. */}
                <AnimatePresence initial={false}>
                {campus && (
                  <motion.div role="status" initial={{ opacity: 0, transform: `translateY(${reduce ? 0 : 8}px)` }} animate={{ opacity: 1, transform: "translateY(0px)" }} transition={{ duration: 0.2, ease: easeOut }} className="flex items-center gap-3 rounded-xl border border-border bg-secondary p-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><IconPin size={18} /></span>
                     <p className="text-sm"><strong className="block text-primary">{t("funnel.nearest", { campus: campus.name }, `Nearest campus: ${campus.name}`)}</strong><span className="text-muted-foreground">{t("funnel.distance", { miles: campus.miles, city: d.city }, `About ${campus.miles} miles from ${d.city}`)}</span></p>
                  </motion.div>
                )}
                </AnimatePresence>
                 <Primary type="button" disabled={!d.city} onClick={() => go(2)}>{t("funnel.chooseCourse", undefined, "Choose my course")} <IconArrowRight size={20} /></Primary>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div role="group" aria-labelledby={`${uid}-question`} className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {courses.map((course) => {
                    const selected = d.selected_course === course.title && d.study_route === course.route;
                    return <Button key={course.id} type="button" variant="outline" aria-pressed={selected} onClick={() => { setPreferred(null); setD((current) => ({ ...current, selected_course: course.title, study_route: course.route })); }}
                      className={cn("h-auto min-h-16 w-full justify-start whitespace-normal rounded-xl px-4 py-3 text-left shadow-none", press, selected && "border-primary bg-secondary ring-2 ring-primary/20")}>
                      <span><strong className="block text-sm text-primary">{course.title}</strong><span className="mt-1 block text-xs text-muted-foreground">{course.route} · {course.university}</span></span>
                    </Button>;
                  })}
                </div>
                 <Primary type="button" disabled={!d.selected_course} onClick={() => go(3)}>{t("funnel.useCourse", undefined, "Use this course")} <IconArrowRight size={20} /></Primary>
              </div>
            )}

            {step === 3 && (
              <form onSubmit={(event) => { event.preventDefault(); if (phoneOk) go(4); }} className="space-y-4">
                 <FieldLabel htmlFor={`${uid}-phone`}>{t("funnel.mobile", undefined, "Mobile number")}</FieldLabel>
                <div className="flex gap-2"><select aria-label={t("funnel.country", undefined, "Country code")} value={cc} onChange={(event) => setCc(event.target.value)} className="h-14 w-28 shrink-0 rounded-xl border border-border bg-secondary px-2 font-bold text-primary outline-none focus:border-teal">{COUNTRY_CODES.map(([code, name]) => <option key={name} value={code}>{name} +{code}</option>)}</select><input id={`${uid}-phone`} type="tel" autoFocus autoComplete="tel" required aria-invalid={phoneError || undefined} aria-describedby={phoneError ? `${uid}-phone-error` : undefined} value={d.phone} maxLength={24} onChange={(event) => setPhone(event.target.value)} placeholder={cc === "44" ? "7700 900123" : t("funnel.phonePlaceholder", undefined, "Mobile number without the country code")} className={cn(inputClass, "min-w-0 flex-1")} /></div>
                <label className="group/wa flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border p-3">
                   <span><strong id={`${uid}-whatsapp`} className="block text-sm">{t("funnel.whatsappOk", undefined, "WhatsApp is okay")}</strong><span id={`${uid}-whatsapp-hint`} className="text-xs text-muted-foreground">{t("funnel.whatsappFast", undefined, "Usually the quickest way to reach you")}</span></span>
                  <span className={cn("relative h-7 w-12 rounded-full transition-[scale,background-color] duration-160 ease-out group-active/wa:scale-[0.97] has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-teal/30", d.whatsapp ? "bg-chart-4" : "bg-border")}><input type="checkbox" role="switch" aria-labelledby={`${uid}-whatsapp`} aria-describedby={`${uid}-whatsapp-hint`} checked={d.whatsapp} onChange={(event) => set("whatsapp", event.target.checked)} className="absolute inset-0 z-10 cursor-pointer opacity-0" /><span aria-hidden className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-card shadow transition-[translate] duration-160 ease-out-strong", d.whatsapp ? "translate-x-5" : "translate-x-0.5")} /></span>
                </label>
                  <Primary disabled={!phoneOk}>{t("funnel.next", undefined, "Next question")} <IconArrowRight size={20} /></Primary>
                 {phoneError && <p id={`${uid}-phone-error`} role="alert" className="text-sm font-medium text-destructive">{cc === "44" ? t("funnel.invalidUk", undefined, "Enter a valid UK mobile number.") : t("funnel.invalid", undefined, "Enter a valid mobile number.")}</p>}
              </form>
            )}

            {step === 4 && (
              <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="space-y-4">
                 <FieldLabel htmlFor={`${uid}-email`}>{t("funnel.emailAddress", undefined, "Email address")}</FieldLabel>
                <div className="relative"><input id={`${uid}-email`} type="email" autoFocus autoComplete="email" required aria-invalid={emailError || undefined} aria-describedby={emailError ? `${uid}-email-error` : undefined} value={d.email} maxLength={255} onChange={(event) => set("email", event.target.value)} onBlur={() => setEmailTouched(true)} placeholder={t("funnel.emailPlaceholder", undefined, "you@example.com")} className={inputClass} />{emailOk && <IconTick size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-chart-4 animate-in fade-in zoom-in-90 duration-150 ease-out-strong" />}</div>
                {emailError && <p id={`${uid}-email-error`} role="alert" className="text-sm font-medium text-destructive">{t("funnel.invalidEmail", undefined, "Enter a valid email address.")}</p>}
                <input tabIndex={-1} autoComplete="off" value={d.website} onChange={(event) => set("website", event.target.value)} className="absolute left-[-9999px]" aria-hidden="true" />
                 <label className="flex cursor-pointer items-start gap-3 text-sm text-muted-foreground"><input type="checkbox" required checked={d.consent} onChange={(event) => set("consent", event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--primary)]" /><span>{privacyAt < 0 ? `${privacyText} ` : privacyText.slice(0, privacyAt)}<a href="/privacy" target="_blank" className="font-bold text-primary underline">{privacyLink}</a>{privacyAt < 0 ? "" : privacyText.slice(privacyAt + privacyLink.length)}</span></label>
                 <fieldset className="space-y-2 border-t border-border pt-3"><legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("funnel.optional", undefined, "Optional updates")}</legend>
                   <ConsentChoice checked={d.whatsapp_marketing} onChange={(v) => set("whatsapp_marketing", v)}>{t("funnel.whatsappUpdates", undefined, "WhatsApp updates")}</ConsentChoice>
                   <ConsentChoice checked={d.email_marketing} onChange={(v) => set("email_marketing", v)}>{t("funnel.emailUpdates", undefined, "Email updates")}</ConsentChoice>
                   <ConsentChoice checked={d.phone_marketing} onChange={(v) => set("phone_marketing", v)}>{t("funnel.phoneUpdates", undefined, "Phone updates")}</ConsentChoice>
                 </fieldset>
                 <Primary disabled={!emailOk || !d.consent || loading}>{loading ? <Spinner /> : null}{loading ? t("funnel.preparing", undefined, "Preparing your options") : t("funnel.show", undefined, "Show my course options")}{!loading && <IconArrowRight size={20} />}</Primary>
              </form>
            )}

            {step === STEPS && result && (
              <div className="grid justify-items-center gap-3 text-center">
                 <RocketAssembly step={STEPS - 1} complete />
                  <Question title={t("funnel.ready", { name: first ?? "" }, `Your offer is ready, ${first}.`)} hint={t("funnel.readyHint", { course: result.selected_course ?? "", campus: result.nearest_campus ?? "" }, `${result.selected_course} at ${result.nearest_campus}.`)} centered focus />
                <div className="w-full rounded-xl bg-secondary p-4 text-left"><h3 className="font-sans text-sm font-bold">{t("funnel.nextSteps", undefined, "What happens next")}</h3><ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground"><li>{t("funnel.nextStep1", undefined, "We call or message you about the right course.")}</li><li>{t("funnel.nextStep2", undefined, "We check your documents and entry route.")}</li><li>{t("funnel.nextStep3", undefined, "We help you prepare for the PFF Day.")}</li></ol></div>
                  <Primary type="button" onClick={download} disabled={downloading}>{downloading ? <Spinner /> : <IconDownload size={20} />}{t("funnel.download", undefined, "Download your personalised offer")}</Primary>
                  <a href={result.offer_url} className="text-sm font-semibold text-primary underline underline-offset-4">{t("funnel.open", undefined, "Open your secure offer link")}</a>
                 <WhatsAppRedirect name={first ?? ""} reference={result.ref_code} auto={d.whatsapp} />
                 <a href={`/auth?mode=up&email=${encodeURIComponent(d.email.trim())}`} className={cn("inline-flex h-12 w-full items-center justify-center rounded-xl border border-primary px-5 text-sm font-bold text-primary hover:bg-secondary", press)}>{t("funnel.create", undefined, "Create my student account")}</a>
                 <p className="text-xs text-muted-foreground">{t("funnel.reference", undefined, "Reference")}: {result.ref_code}</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Progress({ step, onBack }: { step: number; onBack: () => void }) {
  const { t } = useI18n();
  const labels = [t("funnel.name", undefined, "Name"), t("funnel.location", undefined, "Location"), t("funnel.course", undefined, "Course"), t("funnel.phone", undefined, "Phone"), t("funnel.email", undefined, "Email")];
  // The fill spans the whole track and is scaled from the left: same look as growing its width, without a layout pass per frame.
  const track = <><div className="absolute left-[10%] right-[10%] top-2 h-0.5 bg-secondary" /><div className="absolute left-[10%] right-[10%] top-2 h-0.5 origin-left bg-teal transition-transform duration-250 ease-out-strong" style={{ transform: `scaleX(${step / (STEPS - 1)})` }} />
    {labels.map((label, index) => <span key={label} className={cn("absolute top-[3px] h-3 w-3 -translate-x-1/2 rounded-full border-2 transition-colors duration-200", index <= step ? "border-teal bg-teal" : "border-border bg-card")} style={{ left: `${10 + index * 20}%` }} />)}</>;
  return <div className="px-4 pt-3 sm:pt-4">
    <div className="flex min-h-8 items-center justify-between gap-2"><Button type="button" variant="ghost" size="sm" onClick={onBack} disabled={step === 0} className={cn("px-1 text-muted-foreground", press, step === 0 && "invisible")}><IconArrowLeft size={16} />{t("funnel.back", undefined, "Back")}</Button><div className="relative h-5 flex-1 sm:hidden" aria-hidden>{track}</div>
      {/* The dots and labels are decorative; this polite status is what tells assistive tech which step is showing. */}
      <span role="status" className="text-xs font-semibold tabular-nums text-muted-foreground"><span aria-hidden>{step + 1} {t("funnel.of", undefined, "of")} {STEPS}</span><span className="sr-only">{t("funnel.stepAria", { step: step + 1, total: STEPS, label: labels[step] ?? "" }, `Step ${step + 1} of ${STEPS}: ${labels[step]}`)}</span></span></div>
    <div className="hidden sm:block" aria-hidden>
      <div className="relative mx-3 mt-2 h-5">{track}</div>
      <div className="flex justify-between px-1">{labels.map((label, index) => <span key={label} className={cn("w-1/5 text-center text-[9px] font-semibold uppercase tracking-wider", index <= step ? "text-primary" : "text-muted-foreground")}>{label}</span>)}</div>
    </div>
  </div>;
}

const inputClass = "h-14 w-full rounded-xl border border-input bg-card px-4 text-base outline-none transition-[border-color,box-shadow] duration-150 ease-out focus:border-teal focus:ring-4 focus:ring-teal/15";
function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) { return <label htmlFor={htmlFor} className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</label>; }
function Question({ title, hint, centered = false, id, focus = false }: { title: string; hint: string; centered?: boolean; id?: string; focus?: boolean }) {
  const heading = useRef<HTMLHeadingElement>(null);
  // Screens with no text field take focus on their heading, so keyboard and screen-reader users are not dropped on <body>.
  useEffect(() => { if (focus) heading.current?.focus({ preventScroll: true }); }, [focus]);
  return <div className={centered ? "text-center" : ""}><h2 id={id} ref={heading} tabIndex={focus ? -1 : undefined} className="text-[1.3rem] font-semibold leading-tight text-primary outline-none sm:text-[1.45rem]">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{hint}</p></div>;
}
function Primary({ children, className, ...props }: React.ComponentProps<typeof Button>) { return <Button {...props} className={cn("h-14 w-full rounded-xl bg-primary px-5 text-base font-bold text-primary-foreground shadow-none hover:bg-primary/95", press, className)}>{children}</Button>; }
function ConsentChoice({ checked, onChange, children }: { checked: boolean; onChange: (value: boolean) => void; children: React.ReactNode }) { return <label className="flex cursor-pointer items-center gap-3 text-sm text-muted-foreground"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[var(--primary)]" /><span>{children}</span></label>; }

/** WhatsApp button for the success screen; `auto` (the applicant left "WhatsApp is okay" on) adds the countdown that tries to open it for them. */
function WhatsAppRedirect({ name, reference, auto }: { name: string; reference: string; auto: boolean }) {
  const { t } = useI18n();
  const [left, setLeft] = useState(6);
  const [status, setStatus] = useState<"counting" | "idle" | "blocked">(auto ? "counting" : "idle");
  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Hi Momentum One, I'm ${name}. My reference is ${reference}.`)}`;
  useEffect(() => {
    if (status !== "counting") return;
    const timer = window.setTimeout(() => {
      if (left > 1) { setLeft(left - 1); return; }
      // No click is behind this call, so popup blockers usually refuse it. "noopener" would hide the result, so the opener is cut by hand and a refusal is reported next to the button, which always works.
      let opened: Window | null = null;
      try {
        if (window.self === window.top) opened = window.open(url, "_blank");
        if (opened) opened.opener = null;
      } catch { /* Counted as opened or blocked by what window.open returned. */ }
      setStatus(opened ? "idle" : "blocked");
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [left, status, url]);
  return <div className="grid w-full gap-1">
    <a href={url} target="_blank" rel="noopener noreferrer" className={cn("grid h-14 w-full place-items-center rounded-xl bg-chart-4 px-5 text-base font-bold text-primary-foreground", press)}>{t("funnel.whatsapp", undefined, "Connect with us on WhatsApp")}</a>
    {status === "counting" && <p className="text-xs text-muted-foreground">{t("funnel.opening", { seconds: left }, `Opening WhatsApp in ${left}s.`)} <button type="button" onClick={() => setStatus("idle")} className="font-semibold underline">{t("funnel.stay", undefined, "Stay here")}</button></p>}
    {status === "blocked" && <p role="status" className="text-xs text-muted-foreground">{t("funnel.whatsappBlocked", undefined, "Your browser didn't open WhatsApp automatically. Use the button above.")}</p>}
  </div>;
}
