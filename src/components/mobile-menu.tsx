import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { buttonVariants } from "@/components/ui/button";
import { IconArrowRight } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

/** Phone header: one button that opens the site's sections and other pages. */
export function MobileMenu({ className }: { className?: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const sections: [string, string][] = [
    ["#courses", t("nav.courses", undefined, "Courses")],
    ["#campuses", t("nav.campuses", undefined, "Campuses")],
    ["#journey", t("nav.journey", undefined, "How it works")],
    ["#finance", t("nav.funding", undefined, "Funding")],
    ["#faq", t("home.questions", undefined, "Questions")],
  ];
  const pages: [string, string][] = [
    ["/auth", t("nav.account", undefined, "My account")],
    ["/privacy", t("footer.privacy", undefined, "Privacy notice")],
    ["/cookies", t("footer.cookies", undefined, "Cookie notice")],
    ["/terms", t("footer.terms", undefined, "Website terms")],
    ["/disclaimer", t("footer.disclaimer", undefined, "Application disclaimer")],
  ];
  // Close first, then scroll: the open sheet locks page scrolling until it has gone.
  const jump = (hash: string) => {
    setOpen(false);
    window.setTimeout(() => document.querySelector(hash)?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }), 240);
  };
  const row = "flex h-12 items-center rounded-xl px-3 text-[15px] font-semibold text-primary transition-colors duration-150 active:bg-secondary";
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button type="button" aria-label={t("nav.menu", undefined, "Menu")} className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-card text-primary shadow-sm outline-none transition-[scale,border-color] duration-160 ease-out focus-visible:border-primary active:scale-[0.97]", className)}><Menu size={18} strokeWidth={1.75} aria-hidden /></button>
      </SheetTrigger>
      <SheetContent side="right" aria-describedby={undefined} className="flex w-[84%] max-w-sm flex-col gap-0 p-0 ease-[cubic-bezier(0.32,0.72,0,1)] data-[state=closed]:duration-200 data-[state=open]:duration-300">
        <SheetTitle className="border-b border-border px-5 py-4 text-left text-base font-bold text-primary">{t("nav.menu", undefined, "Menu")}</SheetTitle>
        <nav className="flex-1 overflow-y-auto overscroll-contain px-2 py-3">
          <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[.14em] text-muted-foreground">{t("nav.explore", undefined, "Explore")}</p>
          {sections.map(([hash, label]) => <a key={hash} href={hash} onClick={(event) => { event.preventDefault(); jump(hash); }} className={row}>{label}</a>)}
          <p className="mt-3 border-t border-border px-3 pb-1 pt-5 text-[11px] font-bold uppercase tracking-[.14em] text-muted-foreground">{t("nav.more", undefined, "More")}</p>
          {pages.map(([href, label]) => <a key={href} href={href} className={row}>{label}</a>)}
        </nav>
        <div className="border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <a href="#signup" onClick={(event) => { event.preventDefault(); jump("#signup"); }} className={cn(buttonVariants(), "h-12 w-full rounded-xl font-bold")}>{t("home.cta", undefined, "Check my options")} <IconArrowRight /></a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
