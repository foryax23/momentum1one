import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

type Choice = "all" | "essential" | null;
const STORAGE_KEY = "momentum-one-cookie-choice";

export function CookieConsent() {
  const { t } = useI18n();
  const [choice, setChoice] = useState<Choice>(null);
  const [open, setOpen] = useState(false);
  // The saved choice only exists in the browser, so nothing renders (server or first client paint) until it has been read; otherwise the banner flashes for returning visitors.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "all" || saved === "essential") setChoice(saved);
    } catch { /* Storage blocked: behave as if no choice was saved. */ }
    setReady(true);
    const reopen = () => setOpen(true);
    window.addEventListener("mo:cookie-settings", reopen);
    return () => window.removeEventListener("mo:cookie-settings", reopen);
  }, []);

  function save(next: Exclude<Choice, null>) {
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* Storage blocked: the choice still applies to this page view. */ }
    setChoice(next);
    setOpen(false);
    window.dispatchEvent(new CustomEvent("mo:cookie-choice", { detail: next }));
  }

  if (!ready || (choice && !open)) return null;
  return (
    <div className="fixed inset-x-2 bottom-2 z-[100] mx-auto max-w-2xl border border-border bg-card p-3 shadow-paper duration-200 ease-out-strong animate-in fade-in slide-in-from-bottom-2 sm:inset-x-3 sm:bottom-6 sm:p-6" role="dialog" aria-labelledby="cookie-title">
      <p className="hidden text-xs font-bold uppercase tracking-[.16em] text-teal sm:block">{t("cookie.eyebrow", undefined, "Your privacy")}</p>
      <h2 id="cookie-title" className="sr-only text-xl font-bold text-primary sm:not-sr-only sm:mt-2">{t("cookie.title", undefined, "Choose your cookie settings")}</h2>
      {/* phones get one line plus a details link, so the banner never hides the form behind it */}
      <p className="text-xs leading-snug text-muted-foreground sm:hidden">{t("cookie.short", undefined, "Essential storage keeps the site working. Optional cookies help us improve it.")} <a href="/cookies" className="font-bold text-primary underline">{t("cookie.details", undefined, "View details")}</a></p>
      <p className="mt-2 hidden text-sm leading-relaxed text-muted-foreground sm:block">{t("cookie.text", undefined, "Essential storage keeps sign-in and security working. Optional cookies may help us understand and improve the website. We do not load optional analytics or marketing tools before you agree.")}</p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-5 sm:grid-cols-3">
        <Button onClick={() => save("all")} className="h-10 px-2 text-xs sm:h-12 sm:px-4 sm:text-sm">{t("cookie.accept", undefined, "Accept all")}</Button>
        <Button onClick={() => save("essential")} variant="outline" className="h-10 px-2 text-xs sm:h-12 sm:px-4 sm:text-sm">{t("cookie.reject", undefined, "Reject non-essential")}</Button>
        <a href="/cookies" className="hidden h-12 items-center justify-center border border-border px-4 text-sm font-bold text-primary sm:inline-flex">{t("cookie.details", undefined, "View details")}</a>
      </div>
    </div>
  );
}

export function openCookieSettings() {
  window.dispatchEvent(new Event("mo:cookie-settings"));
}