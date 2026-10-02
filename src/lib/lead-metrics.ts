import { CAMPUS_COURSES, campusName } from "./offer-catalog";

/**
 * Numbers behind the admin dashboard. Everything here is a pure function over the lead rows already loaded in the browser:
 * no history table exists, so every figure describes where leads stand NOW, and "reached" is always a floor (a lost lead
 * may have been contacted first, but nothing records it).
 */

/** The lead columns the dashboard reads. The route's full row type is a superset, so its `Lead[]` passes as `LeadRow[]`. */
export type LeadRow = {
  id: string; ref_code: string; full_name: string; city: string; status: string; created_at: string;
  nearest_campus: string | null; selected_course: string | null; study_route: string | null;
  source: string | null; campaign: string | null; whatsapp: boolean; whatsapp_status: string; advisor_user_id: string | null;
};
export type AdvisorRow = { id: string; display_name: string | null; email: string | null };

type Leads = readonly LeadRow[];
type Clock = number | Date;

/** The admin route loads the newest leads up to this many. At the limit, older leads are missing, not zero. */
export const LEADS_LOAD_LIMIT = 1000;

export const STAGES = ["new", "contacted", "applied", "enrolled"] as const;
export type Stage = (typeof STAGES)[number];
export const STAGE_LABELS: Record<Stage | "lost", string> = { new: "New", contacted: "Contacted", applied: "Applied", enrolled: "Enrolled", lost: "Lost" };
export const ROUTES = ["Foundation Year", "Year 1"] as const;
export const CAMPUS_NAMES = Object.keys(CAMPUS_COURSES);
export const COURSE_TITLES = [...new Set(Object.values(CAMPUS_COURSES).flatMap((courses) => courses.map((course) => course.title)))];

const clean = (value: string | null | undefined) => value?.trim() ?? "";
const statusOf = (lead: LeadRow) => clean(lead.status).toLowerCase();
const stageIndex = (lead: LeadRow) => (STAGES as readonly string[]).indexOf(statusOf(lead));
const share = (part: number, whole: number) => (whole > 0 ? part / whole : 0);
/** Applied or enrolled today. */
export const isAppliedPlus = (lead: LeadRow) => stageIndex(lead) >= 2;
/** Still being worked: anything that is neither enrolled nor lost. */
export const isOpen = (lead: LeadRow) => !["enrolled", "lost"].includes(statusOf(lead));

/* ── Days ─────────────────────────────────────────────────────────────────────────────────────────────────────────── */

const LONDON = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" });

/** Calendar day in Europe/London as YYYY-MM-DD ("" for an unreadable date). */
export function londonDay(at: string | Clock): string {
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) return "";
  const parts = LONDON.formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** Move a YYYY-MM-DD key by whole calendar days, so a clock change can never skip or repeat a day. */
export function shiftDay(day: string, by: number): string {
  const [year = 1970, month = 1, date = 1] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date + by)).toISOString().slice(0, 10);
}

export type DayCount = { day: string; count: number };

/** Leads per London day for the last `days` days, oldest first, today last, zero-filled. */
export function dailyCounts(leads: Leads, days = 30, now: Clock = Date.now()): DayCount[] {
  const today = londonDay(now);
  const out = Array.from({ length: Math.max(0, days) }, (_, i) => ({ day: shiftDay(today, i - days + 1), count: 0 }));
  const byDay = new Map(out.map((entry) => [entry.day, entry]));
  for (const lead of leads) { const entry = byDay.get(londonDay(lead.created_at)); if (entry) entry.count++; }
  return out;
}

/** The oldest London day any loaded lead arrived on ("" with no leads). */
export function oldestDay(leads: Leads): string {
  return leads.reduce((oldest, lead) => { const day = londonDay(lead.created_at); return day && (!oldest || day < oldest) ? day : oldest; }, "");
}

/**
 * At the load limit the oldest loaded day is cut short and every day before it is missing: those days are unknown, not zero.
 * Returns that cut day (only days after it are loaded whole), or "" when every lead is loaded.
 */
export const loadedFrom = (leads: Leads) => (leads.length >= LEADS_LOAD_LIMIT ? oldestDay(leads) : "");

export type WeekCompare = {
  /** Leads in the last 7 complete London days: the 7 days ending yesterday. */ current: number;
  /** Leads in the 7 days before those. */ previous: number;
  delta: number;
  /** delta / previous, or null when there is nothing to compare against. */ deltaShare: number | null;
  /** Leads so far today. Today is in neither week. */ today: number;
  /** The two weeks side by side, oldest first: `day` belongs to the last 7 days, `previousDay` is the same weekday a week earlier. */
  days: { day: string; previousDay: string; current: number; previous: number }[];
  /** Which of the two weeks were loaded whole (see `loadedFrom`). Unless "both", `previous` and the delta are not real numbers; at "neither", `current` is a floor. */
  loaded: "both" | "current" | "neither";
};

/**
 * The last 7 complete days against the 7 before them. Today is left out of both: a day that is still filling up set
 * against seven full ones reads as a drop every morning and drifts back to level by the evening.
 */
export function weekOverWeek(leads: Leads, now: Clock = Date.now()): WeekCompare {
  const span = dailyCounts(leads, 15, now);
  const days = span.slice(7, 14).map((entry, i) => ({ day: entry.day, previousDay: span[i]?.day ?? "", current: entry.count, previous: span[i]?.count ?? 0 }));
  const current = days.reduce((sum, entry) => sum + entry.current, 0);
  const previous = days.reduce((sum, entry) => sum + entry.previous, 0);
  const from = loadedFrom(leads), first = days[0];
  const loaded = !from || !first || from < first.previousDay ? "both" : from < first.day ? "current" : "neither";
  return { current, previous, delta: current - previous, deltaShare: previous > 0 ? (current - previous) / previous : null, today: span[14]?.count ?? 0, days, loaded };
}

/* ── Pipeline ─────────────────────────────────────────────────────────────────────────────────────────────────────── */

export type PipelineStage = {
  key: Stage; label: string;
  /** Leads standing at this stage now. */ count: number;
  /** Leads at this stage or further along now. */ reached: number;
  /** `reached` as a share of every lead (New is always 1 unless there are no leads). */ reachedShare: number;
  /** `reached` as a share of the stage before it; null for New and when the stage before is empty. */ fromPrevious: number | null;
};
export type Pipeline = {
  total: number;
  stages: PipelineStage[];
  lost: { count: number; share: number };
  /** Statuses the dashboard does not know. Counted in `total` and in New's `reached`, never dropped. */
  other: { count: number; share: number; statuses: { status: string; count: number }[] };
};

/** Where every lead stands, in stage order. Enrolled counts as having passed Applied and Contacted; Lost and unknown statuses sit outside the stages. */
export function pipeline(leads: Leads): Pipeline {
  const counts = STAGES.map(() => 0);
  const unknown = new Map<string, number>();
  let lost = 0;
  for (const lead of leads) {
    const index = stageIndex(lead);
    if (index >= 0) counts[index] = (counts[index] ?? 0) + 1;
    else if (statusOf(lead) === "lost") lost++;
    else { const key = statusOf(lead) || "(blank)"; unknown.set(key, (unknown.get(key) ?? 0) + 1); }
  }
  const total = leads.length;
  const other = total - lost - counts.reduce((sum, n) => sum + n, 0);
  // Every lead entered as New, so New's "reached" is the whole list; later stages count themselves and everything after.
  const reached = STAGES.map((_, i) => (i === 0 ? total : counts.slice(i).reduce((sum, n) => sum + n, 0)));
  const stages = STAGES.map((key, i) => {
    const before = reached[i - 1];
    return { key, label: STAGE_LABELS[key], count: counts[i] ?? 0, reached: reached[i] ?? 0, reachedShare: share(reached[i] ?? 0, total), fromPrevious: before ? (reached[i] ?? 0) / before : null };
  });
  const statuses = [...unknown].map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count || a.status.localeCompare(b.status));
  return { total, stages, lost: { count: lost, share: share(lost, total) }, other: { count: other, share: share(other, total), statuses } };
}

/* ── Breakdowns ───────────────────────────────────────────────────────────────────────────────────────────────────── */

export type Bucket = {
  key: string; label: string; count: number;
  /** Share of all leads passed in. */ share: number;
  /** How the bucket splits by entry route (leads with no route are in neither). */ foundation: number; year1: number;
  /** Leads in the bucket that are Applied or Enrolled now. */ appliedPlus: number;
  /** "value": a real category · "other": the folded long tail · "none": leads with nothing recorded. */
  kind: "value" | "other" | "none";
  /** How many categories an "other" bucket holds (0 everywhere else). */ folded: number;
};

const NO_VALUE = "__none__";
const OTHER = "__other__";
const emptyBucket = (key: string, label: string, kind: Bucket["kind"]): Bucket => ({ key, label, count: 0, share: 0, foundation: 0, year1: 0, appliedPlus: 0, kind, folded: 0 });

/** Group leads by `valueOf` (keys compared through `fold`); `seed` opens buckets that must be listed even when empty. */
function tally(leads: Leads, valueOf: (lead: LeadRow) => string, labelOf: (key: string, firstSeen: string) => string, seed: readonly string[] = [], fold = (value: string) => value) {
  const buckets = new Map<string, Bucket>();
  const open = (value: string) => {
    const key = fold(value) || NO_VALUE;
    let bucket = buckets.get(key);
    if (!bucket) { bucket = emptyBucket(key, labelOf(key, value), key === NO_VALUE ? "none" : key === OTHER ? "other" : "value"); buckets.set(key, bucket); }
    return bucket;
  };
  for (const value of seed) open(value);
  for (const lead of leads) {
    const bucket = open(valueOf(lead));
    bucket.count++;
    if (clean(lead.study_route) === ROUTES[0]) bucket.foundation++;
    else if (clean(lead.study_route) === ROUTES[1]) bucket.year1++;
    if (isAppliedPlus(lead)) bucket.appliedPlus++;
  }
  return [...buckets.values()];
}

/** Biggest first. With `top`, a tail of two or more categories folds into one "Other" bucket; "Other" and the "nothing recorded" bucket always come last. */
function rank(buckets: Bucket[], total: number, top?: number): Bucket[] {
  // sort() is stable, so ties keep the order the buckets were opened in (catalogue order for seeded lists)
  const values = buckets.filter((bucket) => bucket.kind === "value").sort((a, b) => b.count - a.count);
  const tail = top === undefined ? [] : values.slice(top).filter((bucket) => bucket.count > 0);
  const out = tail.length > 1 ? values.slice(0, top) : values.slice(0, top === undefined ? undefined : top + tail.length);
  if (tail.length > 1) {
    const other = emptyBucket(OTHER, "Other", "other");
    for (const bucket of tail) { other.count += bucket.count; other.foundation += bucket.foundation; other.year1 += bucket.year1; other.appliedPlus += bucket.appliedPlus; other.folded++; }
    out.push(other);
  }
  const none = buckets.find((bucket) => bucket.kind === "none");
  if (none?.count) out.push(none);
  return out.map((bucket) => ({ ...bucket, share: share(bucket.count, total) }));
}

/** "BA (Hons) Business Management" → "Business Management". */
export const shortCourse = (title: string) => title.replace(/^B(A|Sc) \(Hons\) /, "");

/** Leads per campus by short campus name. All five campuses are always listed (zero-filled); leads with no campus come last as "No campus yet". */
export function byCampus(leads: Leads): Bucket[] {
  return rank(tally(leads, (lead) => (clean(lead.nearest_campus) ? campusName(clean(lead.nearest_campus)) : ""), (key) => (key === NO_VALUE ? "No campus yet" : key), CAMPUS_NAMES), leads.length);
}

/** Leads per course (label is the short title, key the full one). Every catalogue course is listed, zero-filled; a tail past `top` folds into "Other". */
export function byCourse(leads: Leads, top = 8): Bucket[] {
  return rank(tally(leads, (lead) => clean(lead.selected_course), (key) => (key === NO_VALUE ? "Course not chosen" : shortCourse(key)), COURSE_TITLES), leads.length, top);
}

/** Foundation Year and Year 1, always listed and always in that order; then "Other route" and "Route not chosen", each only when it has leads. */
export function byRoute(leads: Leads): Bucket[] {
  const routeOf = (lead: LeadRow) => { const route = clean(lead.study_route); return !route || (ROUTES as readonly string[]).includes(route) ? route : OTHER; };
  const order: string[] = [...ROUTES, OTHER, NO_VALUE];
  return tally(leads, routeOf, (key) => (key === NO_VALUE ? "Route not chosen" : key === OTHER ? "Other route" : key), ROUTES)
    .map((bucket) => ({ ...bucket, share: share(bucket.count, leads.length) }))
    .sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
}

const SOURCE_NAMES: Record<string, string> = { facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok", google: "Google", whatsapp: "WhatsApp", youtube: "YouTube", linkedin: "LinkedIn", snapchat: "Snapchat" };
const lower = (value: string) => value.toLowerCase();

/** Where leads came from (the `src` / `utm_source` on the link), matched case-insensitively. Top `top` by volume, then "Other", then "Direct or unknown". */
export function bySource(leads: Leads, top = 6): Bucket[] {
  return rank(tally(leads, (lead) => clean(lead.source), (key, raw) => (key === NO_VALUE ? "Direct or unknown" : SOURCE_NAMES[key] ?? raw), [], lower), leads.length, top);
}

/** Leads per campaign (`utm_campaign`), matched case-insensitively. Top `top` by volume, then "Other", then "No campaign". */
export function byCampaign(leads: Leads, top = 6): Bucket[] {
  return rank(tally(leads, (lead) => clean(lead.campaign), (key, raw) => (key === NO_VALUE ? "No campaign" : raw), [], lower), leads.length, top);
}

/* ── Team and follow-up ───────────────────────────────────────────────────────────────────────────────────────────── */

/** Leads with no advisor: all of them, the ones still open (not enrolled, not lost), and the ones still New. */
export function unassigned(leads: Leads): { total: number; open: number; fresh: number } {
  const free = leads.filter((lead) => !lead.advisor_user_id);
  return { total: free.length, open: free.filter(isOpen).length, fresh: free.filter((lead) => statusOf(lead) === "new").length };
}

export type WelcomeOutcomes = {
  /** Leads who said WhatsApp is okay; the outcome counts below cover only these. */ optedIn: number;
  notOptedIn: number;
  sent: number; sending: number; pending: number; awaiting_template: number; failed: number;
  /** Opted-in leads with a welcome status the dashboard does not know. */ other: number;
  /** sent / optedIn. */ sentShare: number;
};

/** What happened to the WhatsApp welcome for leads who opted in (a lead who did not opt in stays "pending" for ever, so they are counted apart). */
export function whatsappWelcome(leads: Leads): WelcomeOutcomes {
  const out = { optedIn: 0, notOptedIn: 0, sent: 0, sending: 0, pending: 0, awaiting_template: 0, failed: 0, other: 0, sentShare: 0 };
  for (const lead of leads) {
    if (!lead.whatsapp) { out.notOptedIn++; continue; }
    out.optedIn++;
    const status = clean(lead.whatsapp_status);
    if (status === "sent" || status === "sending" || status === "pending" || status === "awaiting_template" || status === "failed") out[status]++;
    else out.other++;
  }
  out.sentShare = share(out.sent, out.optedIn);
  return out;
}

export type AttentionItem<T extends LeadRow = LeadRow> = { lead: T; /** Whole hours since the lead arrived (never negative). */ waitingHours: number };

/** New leads nobody has picked up: status New with no advisor, longest wait first. `total` is the full count, `items` the first `limit`. */
export function needsAttention<T extends LeadRow>(leads: readonly T[], limit = 8, now: Clock = Date.now()): { total: number; items: AttentionItem<T>[] } {
  const at = (lead: LeadRow) => { const time = new Date(lead.created_at).getTime(); return Number.isNaN(time) ? Infinity : time; };
  const waiting = leads.filter((lead) => statusOf(lead) === "new" && !lead.advisor_user_id).sort((a, b) => at(a) - at(b));
  const clock = new Date(now).getTime();
  return { total: waiting.length, items: waiting.slice(0, Math.max(0, limit)).map((lead) => ({ lead, waitingHours: Number.isFinite(at(lead)) ? Math.max(0, Math.floor((clock - at(lead)) / 36e5)) : 0 })) };
}

export type AdvisorLoad = {
  id: string; name: string; total: number;
  /** Assigned leads that are neither enrolled nor lost. */ open: number;
  stages: Record<Stage, number>; lost: number;
};

/** Leads per advisor, busiest (most open leads) first, every advisor listed. `pool` is the same breakdown for leads with no advisor; `former` counts leads assigned to an account that is no longer in the advisor list. */
export function advisorWorkload(leads: Leads, advisors: readonly AdvisorRow[]): { advisors: AdvisorLoad[]; pool: AdvisorLoad; unassigned: number; former: number } {
  const blank = (id: string, name: string): AdvisorLoad => ({ id, name, total: 0, open: 0, stages: { new: 0, contacted: 0, applied: 0, enrolled: 0 }, lost: 0 });
  const loads = new Map<string, AdvisorLoad>(advisors.map((advisor) => [advisor.id, blank(advisor.id, clean(advisor.display_name) || clean(advisor.email) || "Advisor")]));
  const pool = blank("", "No advisor yet");
  let former = 0;
  for (const lead of leads) {
    const load = lead.advisor_user_id ? loads.get(lead.advisor_user_id) : pool;
    if (!load) { former++; continue; }
    load.total++;
    if (isOpen(lead)) load.open++;
    const stage = STAGES[stageIndex(lead)];
    if (stage) load.stages[stage]++;
    else if (statusOf(lead) === "lost") load.lost++;
  }
  return { advisors: [...loads.values()].sort((a, b) => b.open - a.open || b.total - a.total), pool, unassigned: pool.total, former };
}
