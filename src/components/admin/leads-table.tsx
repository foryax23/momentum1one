import { useMemo, useState, type KeyboardEvent } from "react";
import { IconClose, IconSearch } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { UK_CITIES } from "@/lib/funnel";
import { CAMPUS_NAMES, LEADS_LOAD_LIMIT, shortCourse } from "@/lib/lead-metrics";
import { cn } from "@/lib/utils";
import { EmptyChart, fmtInt, Panel } from "./chart-kit";
import { activeFilterCount, advisorName, leadCampus, NO_FILTERS, NONE, OPEN, receivedParts, STATUSES, statusKey, statusLabel, type Advisor, type Lead, type LeadFilters } from "./lead-model";
import { FIELD, LoadLimitNotice, TEXT_BUTTON } from "./parts";
import { StatusPill } from "./stage-mark";

const PAGE = 25;
const th = "px-3 py-2.5 font-semibold first:pl-6 last:pr-6";
const td = "px-3 py-3 align-top first:pl-6 last:pr-6";

/**
 * The Leads tab: filters, the count of what they leave, and the table. The filters live with the caller, because the
 * header's CSV export and the links from other tabs ("See all waiting", an advisor's leads) use the same set.
 */
export function LeadsTab({ leads, rows, advisors, filters, onFilters, onOpen, openId, total }: {
  /** Every loaded lead, newest first. */ leads: readonly Lead[];
  /** `leads` after the filters. */ rows: readonly Lead[];
  /** Leave undefined until the advisor list has loaded: an assigned lead then reads "Assigned", not "Former advisor". */ advisors: readonly Advisor[] | undefined;
  filters: LeadFilters; onFilters: (next: LeadFilters) => void;
  onOpen: (id: string) => void;
  /** The lead whose detail is open, so its row stays marked. */ openId?: string | null | undefined;
  /** How many leads exist in all, when the server said (the table itself never holds more than the load limit). */ total?: number | undefined;
}) {
  const [page, setPage] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [seen, setSeen] = useState(filters);
  if (seen !== filters) { setSeen(filters); setPage(0); setCursor(0); }

  const names = useMemo(() => new Map((advisors ?? []).map((advisor) => [advisor.id, advisorName(advisor)])), [advisors]);
  // statuses outside the five the dashboard knows still get a filter option, so no lead is unreachable
  const extraStatuses = useMemo(() => [...new Set(leads.map((lead) => statusKey(lead.status)))].filter((status) => status && !(STATUSES as readonly string[]).includes(status)).sort(), [leads]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const current = Math.min(page, pages - 1);
  const visible = rows.slice(current * PAGE, current * PAGE + PAGE);
  const active = activeFilterCount(filters);
  const set = (patch: Partial<LeadFilters>) => onFilters({ ...filters, ...patch });
  const go = (next: number) => { setPage(next); setCursor(0); };
  const capped = leads.length >= LEADS_LOAD_LIMIT;
  const now = Date.now();
  const lines = visible.map((lead) => ({
    lead, campus: leadCampus(lead), received: receivedParts(lead.created_at, now),
    course: lead.selected_course ?? lead.interest, route: lead.study_route ?? lead.intake,
    advisor: lead.advisor_user_id ? names.get(lead.advisor_user_id) ?? (advisors ? "Former advisor" : "Assigned") : "",
  }));

  return (
    <div className="grid gap-4">
      <LoadLimitNotice loaded={leads.length} total={total}>Older leads are not in this table, in the search or in the CSV export.</LoadLimitNotice>
      <Panel eyebrow="Leads" title="Every applicant, newest first" hint="Open a lead to change its status, assign an advisor, add notes or download the offer." bodyClassName="flex flex-col">
        <form role="search" aria-label="Filter leads" onSubmit={(event) => event.preventDefault()} className="grid grid-cols-2 gap-2 lg:grid-cols-[minmax(0,1.7fr)_repeat(4,minmax(0,1fr))]">
          <div className="relative col-span-2 lg:col-span-1">
            <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="search" value={filters.q} onChange={(event) => set({ q: event.target.value })} placeholder="Search name, email, phone, ref…" aria-label="Search by name, email, phone or reference" autoComplete="off" spellCheck={false} className={cn(FIELD, "pl-9")} />
          </div>
          <select value={filters.status} onChange={(event) => set({ status: event.target.value })} aria-label="Status" className={FIELD}>
            <option value="">All statuses</option>
            <option value={OPEN}>Open: not enrolled or lost</option>
            {[...STATUSES, ...extraStatuses].map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
          </select>
          <select value={filters.campus} onChange={(event) => set({ campus: event.target.value })} aria-label="Campus" className={FIELD}>
            <option value="">All campuses</option>
            {CAMPUS_NAMES.map((campus) => <option key={campus}>{campus}</option>)}
            <option value={NONE}>No campus yet</option>
          </select>
          <select value={filters.city} onChange={(event) => set({ city: event.target.value })} aria-label="City" className={FIELD}>
            <option value="">All cities</option>
            {UK_CITIES.map((city) => <option key={city}>{city}</option>)}
          </select>
          <select value={filters.advisor} onChange={(event) => set({ advisor: event.target.value })} aria-label="Advisor" className={FIELD}>
            <option value="">All advisors</option>
            <option value={NONE}>No advisor yet</option>
            {advisors?.map((advisor) => <option key={advisor.id} value={advisor.id}>{advisorName(advisor)}</option>)}
          </select>
        </form>

        <div className={cn("mt-3 flex min-h-8 flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm text-muted-foreground", leads.length === 0 && "sr-only")}>
          <p role="status">
            <span className="font-bold text-foreground">{fmtInt(rows.length)}</span>{active > 0 ? ` of ${fmtInt(leads.length)}` : ""} {rows.length === 1 && active === 0 ? "lead" : "leads"}{active > 0 ? ` ${rows.length === 1 ? "matches" : "match"} ${active === 1 ? "the filter" : `the ${active} filters`}` : capped ? " loaded" : ""}
          </p>
          {active > 0 && <button type="button" onClick={() => onFilters(NO_FILTERS)} className={cn(TEXT_BUTTON, "flex items-center gap-1")}><IconClose size={14} />Clear all filters</button>}
        </div>

        {rows.length === 0 ? (
          <div className="mt-3">
            {leads.length === 0
              ? <EmptyChart title="No leads yet" hint="Applications from the website land here the moment they are sent." height={260} />
              : <EmptyChart title="No lead matches these filters" hint={<button type="button" onClick={() => onFilters(NO_FILTERS)} className={TEXT_BUTTON}>Clear all filters</button>} height={260} />}
          </div>
        ) : (
          <>
            {/* a phone gets one card per lead; contact details are one tap away in the lead itself */}
            <ul aria-label="Leads, newest first" className="-mx-5 mt-3 divide-y divide-border border-y border-border sm:hidden">
              {lines.map(({ lead, campus, received, course, route, advisor }) => (
                <li key={lead.id}>
                  <button type="button" aria-haspopup="dialog" onClick={() => onOpen(lead.id)} className={cn("grid w-full cursor-pointer gap-1.5 px-5 py-3.5 text-left outline-none focus-visible:bg-secondary/60", openId === lead.id && "bg-secondary/60")}>
                    <span className="flex items-start justify-between gap-3">
                      <span className="min-w-0"><span className="block truncate font-semibold text-foreground">{lead.full_name}</span><span className="block text-xs text-muted-foreground">{lead.ref_code} · {received.day}, {received.time}</span></span>
                      <StatusPill status={lead.status} />
                    </span>
                    <span className="text-sm text-foreground">{course ? shortCourse(course) : "Course not chosen"}{route && <span className="text-muted-foreground"> · {route}</span>}</span>
                    <span className="text-xs text-muted-foreground">{campus ? `${campus} campus` : "No campus yet"} · {advisor || "No advisor yet"}</span>
                  </button>
                </li>
              ))}
            </ul>
            {/* from a tablet up, the table; it scrolls sideways inside its own box when the window is narrow, the page never does */}
            <div className="-mx-6 mt-3 hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[66rem] text-left text-sm">
                <caption className="sr-only">Leads, newest first. The applicant's name opens the lead; the arrow keys move between rows.</caption>
                <thead className="border-y border-border bg-secondary/50 text-[11px] uppercase tracking-[.1em] text-muted-foreground">
                  <tr>
                    <th scope="col" className={th}>Applicant</th><th scope="col" className={th}>Contact</th><th scope="col" className={th}>Campus</th><th scope="col" className={th}>Course</th>
                    <th scope="col" className={th}>Status</th><th scope="col" className={th}>Advisor</th><th scope="col" className={th}>Received</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map(({ lead, campus, received, course, route, advisor }, i) => (
                    <tr key={lead.id} onClick={() => onOpen(lead.id)} className={cn("cursor-pointer border-b border-border transition-colors duration-150 hover-fine:hover:bg-secondary/50 has-[:focus-visible]:bg-secondary/60", openId === lead.id && "bg-secondary/60")}>
                      <td className={td}>
                        {/* one tab stop for the table: the arrow keys walk the rows, Enter opens (the click bubbles to the row) */}
                        <button type="button" tabIndex={i === Math.min(cursor, visible.length - 1) ? 0 : -1} onFocus={() => setCursor(i)} onKeyDown={rowKeys} aria-haspopup="dialog" className="-m-1 block max-w-56 cursor-pointer rounded-md p-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          <span className="block truncate font-semibold text-foreground">{lead.full_name}</span>
                          <span className="block text-xs text-muted-foreground">{lead.ref_code}</span>
                        </button>
                      </td>
                      <td className={td}><div className="max-w-60 truncate">{lead.email}</div><div className="text-xs text-muted-foreground">{lead.phone}</div></td>
                      <td className={td}>
                        <div className={cn(!campus && "text-muted-foreground")}>{campus || "Not chosen"}</div>
                        <div className="whitespace-nowrap text-xs text-muted-foreground">{lead.city}{lead.distance_miles != null && lead.distance_miles >= 1 && ` · ${fmtInt(lead.distance_miles)} mi`}</div>
                      </td>
                      <td className={td}>
                        <div className={cn("min-w-44 max-w-56", !course && "text-muted-foreground")}>{course ? shortCourse(course) : "Not chosen"}</div>
                        {route && <div className="text-xs text-muted-foreground">{route}</div>}
                      </td>
                      <td className={td}><StatusPill status={lead.status} /></td>
                      <td className={cn(td, "whitespace-nowrap", !advisor && "text-muted-foreground")}>{advisor || "No advisor yet"}</td>
                      <td className={cn(td, "whitespace-nowrap")}><div>{received.day}</div><div className="text-xs text-muted-foreground">{received.time}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 text-sm text-muted-foreground">
                <p>Rows <span className="font-bold text-foreground">{fmtInt(current * PAGE + 1)}–{fmtInt(current * PAGE + visible.length)}</span> of {fmtInt(rows.length)}</p>
                <nav aria-label="Pages of leads" className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={current === 0} onClick={() => go(current - 1)}>Previous</Button>
                  <span className="px-1 text-xs tabular-nums">Page {current + 1} of {pages}</span>
                  <Button variant="outline" size="sm" disabled={current >= pages - 1} onClick={() => go(current + 1)}>Next</Button>
                </nav>
              </div>
            )}
          </>
        )}
      </Panel>
    </div>
  );
}

/** Arrow keys walk the rows of the page; Home and End jump to its ends. */
function rowKeys(event: KeyboardEvent<HTMLButtonElement>) {
  const row = event.currentTarget.closest("tr");
  const to = event.key === "ArrowDown" ? row?.nextElementSibling : event.key === "ArrowUp" ? row?.previousElementSibling : event.key === "Home" ? row?.parentElement?.firstElementChild : event.key === "End" ? row?.parentElement?.lastElementChild : null;
  const button = to?.querySelector("button");
  if (!button) return;
  event.preventDefault();
  button.focus();
}
