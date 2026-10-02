import * as Tabs from "@radix-ui/react-tabs";
import { useCallback, useSyncExternalStore, type ReactNode } from "react";
import logo from "@/assets/logo.webp";
import { cn } from "@/lib/utils";
import { fmtInt } from "./chart-kit";

// `urgent`: the count is people waiting, so it keeps its place on a phone. The other counts are sizes and give way there, so the four tabs fit a 360px screen.
export const ADMIN_TABS = [{ key: "overview", label: "Overview" }, { key: "leads", label: "Leads" }, { key: "whatsapp", label: "WhatsApp", urgent: true }, { key: "team", label: "Team" }] as const;
export type AdminTab = (typeof ADMIN_TABS)[number]["key"];

const isTab = (value: string): value is AdminTab => ADMIN_TABS.some((tab) => tab.key === value);
const readTab = (): AdminTab => { const hash = window.location.hash.slice(1); return isTab(hash) ? hash : "overview"; };
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("hashchange", listener);
  return () => { listeners.delete(listener); window.removeEventListener("hashchange", listener); };
}

/** The active dashboard tab, kept in the URL hash (#leads, #whatsapp, #team; no hash is Overview) so a refresh or a shared link lands on it. */
// eslint-disable-next-line react-refresh/only-export-components -- the hook belongs with the shell that owns the hash
export function useAdminTab(): readonly [AdminTab, (tab: AdminTab) => void] {
  const tab = useSyncExternalStore(subscribe, readTab, () => "overview" as const);
  const setTab = useCallback((next: AdminTab) => {
    // History.prototype on purpose: the router wraps window.history.replaceState, and going through its wrapper would
    // re-run the route guards (a Supabase round trip) on every tab change. The router's own state is passed back untouched.
    History.prototype.replaceState.call(window.history, window.history.state, "", next === "overview" ? window.location.pathname + window.location.search : `#${next}`);
    listeners.forEach((listener) => listener());
  }, []);
  return [tab, setTab];
}

const TODAY = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "long", day: "numeric", month: "long", year: "numeric" });

/**
 * The dashboard frame: brand header with an action slot, then the tab bar. Only the active panel is mounted.
 * Tabs follow the usual keyboard pattern: arrows (or Home / End) move between tabs, Enter or Space opens one.
 */
export function AdminShell({ panels, counts, countNouns, actions, title = "Admissions desk" }: {
  /** One node per tab. */ panels: Record<AdminTab, ReactNode>;
  /** A quiet count beside a tab label (leads loaded, chats waiting, advisors). Leave a tab out to show none. */ counts?: Partial<Record<AdminTab, number | undefined>> | undefined;
  /** What each count counts, read out after the number: "leads loaded", "chats waiting for an agent". */ countNouns?: Partial<Record<AdminTab, string>> | undefined;
  /** Right side of the header: export, sign out. */ actions?: ReactNode;
  title?: string;
}) {
  const [tab, setTab] = useAdminTab();
  return (
    <Tabs.Root asChild value={tab} onValueChange={(value) => { if (isTab(value)) setTab(value); }} activationMode="manual">
      <main className="min-h-screen bg-secondary/45">
        <header className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <div className="flex items-center justify-between gap-3 pb-3 pt-4 sm:gap-4 sm:pt-5">
              <div className="flex min-w-0 items-center gap-2.5 sm:gap-4">
                <img src={logo} alt="Momentum One" width={374} height={320} className="h-11 w-auto shrink-0 min-[400px]:h-12 sm:h-14" />
                <div className="min-w-0">
                  {/* the logo already says the name, so a phone keeps the one word that fits on a line */}
                  <p className="text-[11px] font-bold uppercase tracking-[.16em] text-teal"><span className="max-sm:hidden">Momentum One <span aria-hidden className="mx-1 inline-block h-1 w-1 rounded-full bg-gold align-middle" /> </span>Admin</p>
                  <h1 className="text-lg font-bold italic text-primary max-sm:leading-tight min-[400px]:text-xl sm:truncate sm:text-3xl">{title}</h1>
                  <p suppressHydrationWarning className="truncate text-xs text-muted-foreground sm:text-sm">{TODAY.format(new Date())}</p>
                </div>
              </div>
              {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
            </div>
            <Tabs.List aria-label="Dashboard sections" className="no-scrollbar -mx-4 flex overflow-x-auto px-2 sm:mx-0 sm:gap-1 sm:px-0">
              {ADMIN_TABS.map(({ key, label, ...tab }) => (
                <Tabs.Trigger key={key} value={key} className="group relative flex shrink-0 cursor-pointer items-center gap-1.5 rounded-t-lg px-2 pb-3 pt-2 text-sm font-semibold text-muted-foreground outline-none transition-colors duration-150 ease-out-strong after:absolute after:inset-x-2 after:bottom-0 after:h-[3px] after:rounded-t-full after:bg-primary after:opacity-0 after:transition-opacity after:duration-150 hover-fine:hover:text-primary focus-visible:bg-secondary focus-visible:text-primary data-[state=active]:text-primary data-[state=active]:after:opacity-100 sm:gap-2 sm:px-4 sm:after:inset-x-4">
                  {label}
                  {counts?.[key] !== undefined && <span className={cn("rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold tabular-nums leading-none text-muted-foreground transition-colors duration-150 group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-foreground", !("urgent" in tab) && "max-sm:hidden")}>{fmtInt(counts[key] ?? 0)}{countNouns?.[key] && <span className="sr-only"> {countNouns[key]}</span>}</span>}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </div>
        </header>
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-8 sm:py-8">
          {ADMIN_TABS.map(({ key }) => <Tabs.Content key={key} value={key} className="outline-none focus-visible:rounded-2xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background">{panels[key]}</Tabs.Content>)}
        </div>
      </main>
    </Tabs.Root>
  );
}
