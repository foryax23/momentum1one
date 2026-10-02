import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { LEADS_LOAD_LIMIT } from "@/lib/lead-metrics";
import { cn } from "@/lib/utils";
import { fmtInt } from "./chart-kit";

/** Text inputs and selects across the dashboard. */
export const FIELD = "h-10 w-full min-w-0 rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors duration-150 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-60";
/** Small-caps label above a group of fields or figures (the quiet sibling of a panel's eyebrow). */
export const LABEL = "text-[11px] font-semibold uppercase leading-tight tracking-[.1em] text-muted-foreground";
/** Text buttons inside panels ("See all", "Clear filters"). */
export const TEXT_BUTTON = "cursor-pointer rounded font-bold text-primary outline-none hover-fine:hover:underline focus-visible:ring-2 focus-visible:ring-ring";

/** A plain statement the team must not miss: a gold bar, a strong first line, the detail under it. Not an error. */
export function Notice({ title, children, action, className }: { title: string; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div role="note" className={cn("flex items-start gap-3 rounded-2xl border border-border bg-card p-4", className)}>
      <span aria-hidden className="w-1 shrink-0 self-stretch rounded-full bg-gold" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-foreground">{title}</p>
        {children && <div className="mt-0.5 text-sm text-muted-foreground">{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/**
 * The scope statement for a tab whose numbers come from the loaded leads: shown once, above everything it scopes, as soon as
 * the load limit is hit (older leads are then missing, not zero). `children` says what that means on this tab.
 */
export function LoadLimitNotice({ loaded, total, children }: { /** Leads in the browser. */ loaded: number; /** Leads in all, when the server said. */ total?: number | undefined; children: ReactNode }) {
  if (loaded < LEADS_LOAD_LIMIT) return null;
  return <Notice title={`Only the latest ${fmtInt(LEADS_LOAD_LIMIT)} leads are loaded`}>{total !== undefined && total > loaded ? `There are ${fmtInt(total)} leads in all. ` : ""}{children}</Notice>;
}

const block = "rounded-2xl border border-border bg-card";
const bone = "animate-pulse rounded-md bg-primary/10";

/** First load of the leads: the page keeps its shape (tiles, then cards) so nothing jumps when the numbers arrive. */
export function LeadsLoading({ tiles = 5, label = "Loading leads" }: { tiles?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className="grid gap-4">
      {tiles > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6 xl:grid-cols-5">
          {Array.from({ length: tiles }, (_, i) => (
            <div key={i} className={cn(block, "p-4 sm:p-5", i === 0 ? "col-span-2 xl:col-span-1" : i < 3 ? "col-span-1 md:col-span-2 xl:col-span-1" : "col-span-1 md:col-span-3 xl:col-span-1")}>
              <div className={cn(bone, "h-3 w-24")} /><div className={cn(bone, "mt-3 h-9 w-20")} /><div className={cn(bone, "mt-5 h-3 w-32 max-w-full")} />
            </div>
          ))}
        </div>
      )}
      <div className={cn(block, "p-5 sm:p-6")}>
        <div className={cn(bone, "h-3 w-28")} /><div className={cn(bone, "mt-3 h-6 w-64 max-w-full")} />
        <div className="mt-6 grid gap-3">{Array.from({ length: 6 }, (_, i) => <div key={i} className={cn(bone, "h-9")} style={{ opacity: 1 - i * 0.13 }} />)}</div>
      </div>
      <p className="sr-only">{label}…</p>
    </div>
  );
}

/** The leads could not be loaded at all. Says so, says what still works, offers the retry. */
export function LeadsError({ message, onRetry, retrying = false }: { message?: string | undefined; onRetry: () => void; retrying?: boolean }) {
  return (
    <div role="alert" className={cn(block, "grid place-items-center px-6 py-14 text-center")}>
      <div className="max-w-md">
        <svg width={32} height={32} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mx-auto text-destructive"><path d="M16 5 3.5 26.5h25L16 5Z" /><path d="M16 13v6.5M16 23v.5" /></svg>
        <h2 className="mt-3 text-lg font-bold italic text-primary sm:text-xl">The leads could not be loaded</h2>
        <p className="mt-1 text-sm text-muted-foreground">Nothing has been lost. Check the connection and try again; if it keeps failing, sign out and back in.</p>
        {message && <p className="mt-2 break-words text-xs text-muted-foreground">Details: {message}</p>}
        <Button className="mt-5" onClick={onRetry} disabled={retrying}>{retrying ? "Trying again" : "Try again"}</Button>
      </div>
    </div>
  );
}

const CLOCK = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });

/** Reloads the leads and says when they were last loaded. The data also refreshes by itself when the window gets focus back. */
export function RefreshButton({ onRefresh, fetching, updatedAt }: { onRefresh: () => void; fetching: boolean; /** Epoch milliseconds of the last successful load; 0 before the first. */ updatedAt: number }) {
  return (
    <div className="hidden items-center gap-2.5 sm:flex">
      {updatedAt > 0 && <p suppressHydrationWarning className="hidden text-xs text-muted-foreground lg:block">{fetching ? "Refreshing…" : `Updated ${CLOCK.format(updatedAt)}`}</p>}
      <Button variant="outline" size="icon" aria-label="Refresh leads" title="Refresh leads" onClick={onRefresh} disabled={fetching} className="h-10 w-10 disabled:opacity-100">
        <svg width={18} height={18} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cn(fetching && "animate-spin")}><path d="M26.5 16a10.5 10.5 0 1 1-3.1-7.4" /><path d="M24.5 4v5.5H19" /></svg>
      </Button>
    </div>
  );
}
