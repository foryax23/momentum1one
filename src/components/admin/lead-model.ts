import { isOpen, STAGE_LABELS, type AdvisorRow, type LeadRow } from "@/lib/lead-metrics";
import { campusName } from "@/lib/offer-catalog";

/** A row of the `leads` table as the admin route loads it. */
export type Lead = LeadRow & {
  email: string; phone: string; interest: string | null; intake: string | null; notes: string | null;
  distance_miles: number | null; page: string | null; offer_email_status: string;
};
export type Advisor = AdvisorRow;

export const STATUSES = ["new", "contacted", "applied", "enrolled", "lost"] as const;
export const statusKey = (status: string) => status.trim().toLowerCase();
/** "applied" → "Applied"; a status the dashboard does not know keeps its own words ("on_hold" → "on hold"). */
export const statusLabel = (status: string) => (STAGE_LABELS as Record<string, string>)[statusKey(status)] ?? (status.trim().replaceAll("_", " ") || "No status");

/** Short campus name ("Manchester"), or "" when the lead has none. */
export const leadCampus = (lead: Pick<Lead, "nearest_campus">) => (lead.nearest_campus?.trim() ? campusName(lead.nearest_campus.trim()) : "");
export const advisorName = (advisor: Advisor) => advisor.display_name?.trim() || advisor.email?.trim() || "Advisor";

/* ── Dates (shown in London time, like the charts) ────────────────────────────────────────────────────────────────── */

const DAY = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", day: "numeric", month: "short" });
const DAY_YEAR = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", day: "numeric", month: "short", year: "numeric" });
const TIME = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const FULL = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const YEAR = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", year: "numeric" });

/** "2 Oct" and "14:05" (the year is added once the lead is from another year). */
export function receivedParts(at: string, now: number = Date.now()): { day: string; time: string } {
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) return { day: "Unknown date", time: "" };
  return { day: (YEAR.format(date) === YEAR.format(now) ? DAY : DAY_YEAR).format(date), time: TIME.format(date) };
}
/** "Fri 2 Oct 2026, 14:05" */
export const receivedFull = (at: string) => { const date = new Date(at); return Number.isNaN(date.getTime()) ? "Unknown date" : FULL.format(date).replace(",", ""); };

/* ── Filters ──────────────────────────────────────────────────────────────────────────────────────────────────────── */

/** `advisor` and `campus` take a real value, "" for any, or `NONE` for leads that have none. `status` also takes `OPEN`. */
export type LeadFilters = { q: string; status: string; campus: string; city: string; advisor: string };
export const NONE = "__none__";
/** Status filter for every lead still being worked: anything that is neither enrolled nor lost. */
export const OPEN = "__open__";
export const NO_FILTERS: LeadFilters = { q: "", status: "", campus: "", city: "", advisor: "" };
export const activeFilterCount = (filters: LeadFilters) => Object.values(filters).filter((value) => value.trim()).length;

export function filterLeads<T extends Lead>(leads: readonly T[], filters: LeadFilters): T[] {
  const text = filters.q.trim().toLowerCase();
  // a phone number is found whatever its spacing: "07700900123" matches "07700 900 123"
  const digits = text.replace(/\D/g, "");
  const phoneLike = digits.length >= 4 && /^[\d\s()+-]+$/.test(text);
  return leads.filter((lead) =>
    (!filters.status || (filters.status === OPEN ? isOpen(lead) : statusKey(lead.status) === filters.status)) &&
    (!filters.city || lead.city === filters.city) &&
    (!filters.campus || (filters.campus === NONE ? !leadCampus(lead) : leadCampus(lead) === filters.campus)) &&
    (!filters.advisor || (filters.advisor === NONE ? !lead.advisor_user_id : lead.advisor_user_id === filters.advisor)) &&
    (!text || [lead.full_name, lead.email, lead.phone, lead.ref_code].some((value) => value.toLowerCase().includes(text)) || (phoneLike && lead.phone.replace(/\D/g, "").includes(digits))));
}

/* ── CSV ──────────────────────────────────────────────────────────────────────────────────────────────────────────── */

const CSV_COLUMNS = ["ref_code", "full_name", "email", "phone", "whatsapp", "city", "nearest_campus", "distance_miles", "selected_course", "study_route", "offer_email_status", "intake", "source", "campaign", "status", "created_at"] as const;

function csvCell(value: unknown) {
  let text = String(value ?? "");
  // Applicants type their own names: a cell that a spreadsheet would run as a formula gets a leading apostrophe. Phone numbers and plain negative numbers are left alone.
  if (/^[=@\t\r]/.test(text) || (/^[+-]/.test(text) && !/^[+-][\d\s().-]*$/.test(text))) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/** The same columns the export has always had, in the same order, with the advisor's name added at the end. Without the advisor list (it failed to load) that last column is left out rather than exported empty. */
export function leadsCsv(rows: readonly Lead[], advisors: readonly Advisor[] | undefined): string {
  const names = advisors && new Map(advisors.map((advisor) => [advisor.id, advisorName(advisor)]));
  return [[...CSV_COLUMNS, ...(names ? ["advisor"] : [])].join(","), ...rows.map((row) => [...CSV_COLUMNS.map((column) => csvCell(row[column])), ...(names ? [csvCell(row.advisor_user_id ? names.get(row.advisor_user_id) ?? "" : "")] : [])].join(","))].join("\n");
}

export function downloadCsv(csv: string, filename = `leads-${new Date().toISOString().slice(0, 10)}.csv`) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
