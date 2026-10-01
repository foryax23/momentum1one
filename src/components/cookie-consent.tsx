import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Choice = "all" | "essential" | null;
const STORAGE_KEY = "momentum-one-cookie-choice";

export function CookieConsent() {
  const [choice, setChoice] = useState<Choice>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "all" || saved === "essential") setChoice(saved);
    const reopen = () => setOpen(true);
    window.addEventListener("mo:cookie-settings", reopen);
    return () => window.removeEventListener("mo:cookie-settings", reopen);
  }, []);

  function save(next: Exclude<Choice, null>) {
    window.localStorage.setItem(STORAGE_KEY, next);
    setChoice(next);
    setOpen(false);
    window.dispatchEvent(new CustomEvent("mo:cookie-choice", { detail: next }));
  }

  if (choice && !open) return null;
  return (
    <div className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-2xl border border-border bg-card p-5 shadow-paper sm:bottom-6 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="cookie-title">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-teal">Your privacy</p>
      <h2 id="cookie-title" className="mt-2 text-xl font-bold text-primary">Choose your cookie settings</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Essential storage keeps sign-in and security working. Optional cookies may help us understand and improve the website. We do not load optional analytics or marketing tools before you agree.</p>
      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        <Button onClick={() => save("all")} className="h-12">Accept all</Button>
        <Button onClick={() => save("essential")} variant="outline" className="h-12">Reject non-essential</Button>
        <a href="/cookies" className="inline-flex h-12 items-center justify-center border border-border px-4 text-sm font-bold text-primary">View details</a>
      </div>
    </div>
  );
}

export function openCookieSettings() {
  window.dispatchEvent(new Event("mo:cookie-settings"));
}