import type { LeadResult } from "@/lib/funnel";
import { CAMPUS_SITES, campusName, coursesForCampus, type CourseOption } from "@/lib/offer-catalog";

// Everything the five pages print, built once from the lead and the catalogue. No react-pdf and no window access in here, so it can run anywhere.
// All wording is the client's template wording; Luton has no template and follows the Newcastle variant.

export type PatternTag = "DAYTIME" | "EVENING" | "WEEKEND";
/** Inline bold runs: plain strings are regular, { b } is bold. Print with <Para> (or <RichText> for a single line). */
export type Rich = (string | { b: string })[];
export type Accent = "navy" | "blue" | "sky";
export type CampusKey = "Manchester" | "Derby" | "Sunderland" | "Newcastle" | "Luton";
export type OfferPattern = { label: string; tags: PatternTag[] };
export type OfferCourse = {
  id: string; title: string; university: string;
  /** Top border of the course card, by awarding university. */
  accent: Accent;
  /** The italic line under the title. */
  routeLine: string;
  patternsLabel: "STUDY PATTERN OPTIONS" | "CLASS DAY";
  patterns: OfferPattern[];
  /** True for the course and route the student picked; it is always first in its list. */
  chosen: boolean;
};
export type OfferYear1 = { id: string; title: string; detail: string; chosen: boolean };
export type OfferFact = { icon: "cap" | "shield" | "clock" | "calendar"; label: string; value: string; note: string };
export type OfferReason = { title: string; body: string };
export type OfferWeekDay = { day: string; lines: string[]; time: string | null; tone: "navy" | "blue" | null; chosen: boolean };
export type OfferData = {
  /** name is what the fonts can print of the student's name; "" when that is nothing (a name in a script neither font carries). */
  student: { name: string; ref: string };
  /** fontFamily for any text that prints the student's name: Poppins, or Manrope for a name with letters Poppins lacks (Cyrillic, Greek, Vietnamese, Ħ, Ŋ …). */
  nameFont: NameFont;
  campus: CampusKey;
  /** Pages 2-5 header: <b>{label}</b> · {name}{rest}; name is "" when the student's name cannot be printed, and is then left out with its dot. */
  header: { label: string; name: string; rest: string };
  cover: {
    pill: string; eyebrow: string; headline: [string, string];
    /** The 15pt line under the pill: the student's name, or the template's "{Campus} campus" when the name cannot be printed. */
    name: string;
    /** Small-caps line under the name, already upper case: campus, reference, issue date (no campus when it is already the line above). Join with " · ". */
    meta: string[];
    lead: Rich; facts: OfferFact[]; bandEyebrow: string; bandTitle: string; reasons: OfferReason[];
    cta: { title: string; text: string; button: string }; tagline: string;
  };
  /** "grid": six course cards in two columns (Manchester, Derby, Sunderland). "few": one or two large cards, and "Can I apply?" moves onto page 2 (Newcastle, Luton). */
  layout: "grid" | "few";
  courses: {
    title: string; intro: string;
    /** The line beside the DAYTIME / EVENING / WEEKEND key; null when no study pattern carries a tag (timetable to be confirmed), and the key is left out. */
    legend: string | null;
    footnote: string;
    list: OfferCourse[];
    /** The Year 1 box (Manchester, Derby); null elsewhere. */
    year1: { title: string; note: string; list: OfferYear1[] } | null;
    /** Dashed note: Sunderland's Year 1 pointer, or "Looking for something else?" on the small campuses. */
    note: Rich | null;
    /** "Your week at a glance" strip on the small campuses: the class days when they are known (Newcastle), seven open days while the timetable is to be confirmed (Luton). */
    week: { title: string; days: OfferWeekDay[]; caption: string } | null;
  };
  /** What the student picked, as <b>{title}</b>{rest}; null when the lead carries no valid choice (then nothing is badged). */
  choice: { title: string; rest: string } | null;
  apply: { year1Note: boolean; lastPffDays: string | null };
  legal: string;
  contact: { phone: string; email: string; web: string };
  signature: { src: string; name: string; title: string };
  assets: { logo: string; wordmark: string };
};

export const CHOICE_BADGE = "YOUR CHOICE";
// Name and title as the client brief gives them; no surname is known.
const DIRECTOR = { name: "Robert", title: "DIRECTOR, MOMENTUM ONE" };
const CONTACT = { phone: "+44 7593 855452", email: "info@momentumone.co.uk" };
const UNIVERSITIES: Record<string, { short: string; accent: Accent }> = {
  "University of Wolverhampton": { short: "Wolverhampton", accent: "navy" },
  "Arts University Bournemouth": { short: "AUB", accent: "blue" },
  "Health Sciences University": { short: "Health Sciences", accent: "sky" },
};
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

/** The pills beside a study pattern. Evening and weekend are stated by the wording; a pattern that names only weekdays is daytime; one that names no day gets none. */
export function patternTags(label: string): PatternTag[] {
  if (!DAYS.some((day) => label.includes(day))) return [];
  const tags: PatternTag[] = [];
  if (/evening/i.test(label)) tags.push("EVENING");
  if (/Saturday|Sunday/.test(label)) tags.push("WEEKEND");
  return tags.length ? tags : ["DAYTIME"];
}

type CampusCopy = {
  lead: Rich; facts?: Partial<Record<"courses" | "universities" | "classes", [string, string, string]>>; reasons?: Partial<Record<1 | 2, OfferReason>>;
  note?: Rich; weekNames?: Record<string, string[]>; lastPffDays?: string; footnote?: string;
};
const TIMETABLE_FOOTNOTE = "Study patterns are from the June/September 2026 intake timetable. Your group and timetable for the next intake are confirmed when you enrol.";
const CAMPUS_COPY: Record<CampusKey, CampusCopy> = {
  Manchester: { lead: [{ b: "6 Foundation Year degrees" }, " from three UK universities at the Salford Campus (Manchester), plus ", { b: "Year 1 entry" }, " at the Abarna Campus."], lastPffDays: "Ran from June to September 2026" },
  Derby: { lead: [{ b: "6 Foundation Year degrees" }, " from three UK universities, plus ", { b: "Year 1 entry" }, ", all taught at the Derby Campus."], lastPffDays: "Ran from June to September 2026" },
  Sunderland: {
    lead: [{ b: "6 Foundation Year degrees" }, " — from business to psychology — awarded by three UK universities and taught at the Sunderland Campus."], lastPffDays: "Ran from June to September 2026",
    note: [{ b: "Want to start straight in Year 1?" }, " Business Management and Digital Marketing Management are also offered as Year 1 entry in Manchester and Derby — ask us."],
  },
  Newcastle: {
    lead: [{ b: "Business Management and Digital Marketing Management with Foundation Year" }, " — awarded by the University of Wolverhampton and taught at the Newcastle Campus."], lastPffDays: "Every Friday, July to August 2026",
    facts: { courses: ["COURSES", "2 degrees", "Business & Digital Marketing"], universities: ["AWARDED BY", "UK honours degree", "University of Wolverhampton"], classes: ["CLASSES", "1 day a week", "Tuesday or Wednesday, 9am – 5pm"] },
    reasons: { 1: { title: "Just one day a week", body: "Business Management runs on Tuesdays and Digital Marketing on Wednesdays, 9am – 5pm." }, 2: { title: "A full UK honours degree", body: "Your BA (Hons) is awarded by the University of Wolverhampton." } },
    note: [{ b: "Looking for something else?" }, " Health and Social Care, Fashion Management and Strategy, Events Management and Psychology (all with Foundation Year) run in Manchester, Sunderland and Derby — ask us for those offers."],
    weekNames: { "business-foundation": ["Business", "Management"], "marketing-foundation": ["Digital", "Marketing"] },
  },
  Luton: {
    lead: [{ b: "Public Health with Foundation Year" }, " — awarded by the University of Wolverhampton and taught at the Luton Campus."],
    facts: { courses: ["COURSES", "1 degree", "Public Health with Foundation Year"], universities: ["AWARDED BY", "UK honours degree", "University of Wolverhampton"], classes: ["CLASSES", "To be confirmed", "Your timetable is confirmed when you enrol"] },
    reasons: { 1: { title: "Taught at the Luton Campus", body: "We'll send you the class days for the next intake as soon as the college announces them." }, 2: { title: "A full UK honours degree", body: "Your BSc (Hons) is awarded by the University of Wolverhampton." } },
    note: [{ b: "Looking for something else?" }, " Business Management, Digital Marketing Management, Health and Social Care, Fashion Management and Strategy, Events Management and Psychology (all with Foundation Year) run in Manchester, Sunderland and Derby — ask us for those offers."],
    footnote: "Your group and timetable for the next intake are confirmed when you enrol.",
  },
};
const REASONS: OfferReason[] = [
  { title: "No grades needed to apply", body: "Foundation Year offers are based on passing the PFF Day — whatever your age, experience or academic background." },
  { title: "Study around work", body: "Choose from daytime, evening and weekend study patterns — from one day a week to two evenings." },
  { title: "UK honours degrees", body: "Awarded by the University of Wolverhampton, Arts University Bournemouth or Health Sciences University." },
  { title: "Foundation Year included", body: "Each course starts with a Foundation Year, so you can begin without the usual entry qualifications." },
];

const list = (items: string[]) => items.length > 1 ? `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}` : items[0] ?? "";
const first = <T extends { chosen: boolean }>(items: T[]) => [...items.filter((item) => item.chosen), ...items.filter((item) => !item.chosen)];
const isCampus = (name: string): name is CampusKey => name in CAMPUS_COPY;

function weekStrip(courses: OfferCourse[], order: string[], names: Record<string, string[]> | undefined, pending: boolean) {
  // Only a course with one fixed class day ("Tuesday, 9am – 5pm") can sit on the strip. Tones follow catalogue order, not the student's choice.
  const slots = courses.flatMap((course) => {
    const [day, time] = course.patterns.length === 1 ? (course.patterns[0]?.label ?? "").split(", ") : [];
    return day && time && DAYS.some((d) => d === day) ? [{ day, time, lines: names?.[course.id] ?? [course.title.replace(/^\S+ \(Hons\) /, "")], tone: order.indexOf(course.id) % 2 ? "blue" as const : "navy" as const, chosen: course.chosen }] : [];
  });
  if (!pending && (!slots.length || slots.length !== courses.length)) return null;
  const days = DAYS.map((day): OfferWeekDay => { const slot = slots.find((s) => s.day === day); return { day: day.slice(0, 3).toUpperCase(), lines: slot?.lines ?? [], time: slot?.time ?? null, tone: slot?.tone ?? null, chosen: slot?.chosen ?? false }; });
  return { title: "Your week at a glance", days, caption: pending ? "Class days for the next intake are still to be confirmed." : "One class day a week — the rest of your week stays free for work and family." };
}

export type NameFont = "Poppins" | "Manrope";
/** Whether a loaded font can draw a character. index.tsx answers from the font files; without it the name is taken to be printable in Poppins as typed. */
export type HasGlyph = (font: NameFont, char: string) => boolean;
/** The name as typed, tidied: accents composed, one space between words, invisible characters removed, and the Unicode hyphens and letter apostrophes, which
 *  the fonts do not both carry, as the "-" and curly quotes they do. */
export const tidyName = (name: string) => name.normalize("NFC").replace(/[\u2010\u2011]/g, "-").replace(/\u02bc/g, "\u2019").replace(/\u02bb/g, "\u2018").replace(/\s+/g, " ").replace(/\p{C}+/gu, "").trim();

// The whole name goes in one typeface that has every glyph printed. react-pdf can fall back to a second font letter by letter, but that mixes upright Manrope
// into italic Poppins, and in the page header it prints an empty box for a first letter that needs the second font. A letter the typeface lacks is printed
// without the accents it cannot draw (ǚ → ü, ṣ → s); anything else it cannot draw (other scripts, emoji) is dropped. Poppins is used unless Manrope keeps more.
function printableName(typed: string, has: HasGlyph): { name: string; font: NameFont } {
  const draw = (font: NameFont, char: string): [string, number] => {
    if (has(font, char)) return [char, 2];
    for (let marks = [...char.normalize("NFD")].slice(0, -1); marks.length; marks = marks.slice(0, -1)) { const plain = marks.join("").normalize("NFC"); if ([...plain].length === 1 && has(font, plain)) return [plain, 1]; }
    return ["", 0];
  };
  const set = (font: NameFont) => {
    const chars = [...typed].map((char) => draw(font, char));
    return { font, name: chars.map(([char]) => char).join("").replace(/\s+/g, " ").trim(), kept: chars.reduce((total, [, score]) => total + score, 0) };
  };
  const poppins = set("Poppins"), manrope = set("Manrope"), best = manrope.kept > poppins.kept ? manrope : poppins;
  return /\p{L}/u.test(best.name) ? best : { name: "", font: "Poppins" };
}

export function buildOfferData(lead: LeadResult, env: { origin: string; host: string }, has?: HasGlyph): OfferData {
  const short = campusName(lead.nearest_campus), key: CampusKey = isCampus(short) ? short : "Luton";
  const copy = CAMPUS_COPY[key], sites = CAMPUS_SITES[key], site = sites?.site ?? `${key} Campus`, year1Site = sites?.year1Site ?? null;
  const catalogue = coursesForCampus(lead.nearest_campus), picked = catalogue.find((c) => c.title === lead.selected_course && c.route === lead.study_route) ?? null;
  const isChosen = (course: CourseOption) => course.id === picked?.id;
  const foundation = catalogue.filter((c) => c.route === "Foundation Year"), entry = catalogue.filter((c) => c.route === "Year 1");
  const courses = first(foundation.map((course): OfferCourse => ({
    id: course.id, title: course.title, university: course.university, accent: UNIVERSITIES[course.university]?.accent ?? "navy", routeLine: "with Foundation Year",
    patternsLabel: course.patterns.length > 1 ? "STUDY PATTERN OPTIONS" : "CLASS DAY", patterns: course.patterns.map((label) => ({ label, tags: patternTags(label) })), chosen: isChosen(course),
  })));
  const year1 = first(entry.map((course): OfferYear1 => ({ id: course.id, title: course.title, detail: `Year 1 · ${course.university} · ${year1Site ?? site}`, chosen: isChosen(course) })));
  const universities = [...new Set(catalogue.map((c) => c.university))], layout = foundation.length > 2 ? "grid" : "few";
  const timetabled = courses.some((course) => course.patterns.some((pattern) => pattern.tags.length > 0));
  const typed = tidyName(lead.full_name), { name, font: nameFont } = has ? printableName(typed, has) : { name: typed, font: "Poppins" as const }, issued = new Date(lead.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const fact = (icon: OfferFact["icon"], [label, value, note]: [string, string, string]): OfferFact => ({ icon, label, value, note });
  const reasons = REASONS.map((reason, i) => (i === 1 || i === 2 ? copy.reasons?.[i] : undefined) ?? reason);
  return {
    student: { name, ref: lead.ref_code },
    nameFont,
    campus: key,
    header: { label: "Student Offer", name: name.length > 46 ? `${name.slice(0, 45).trimEnd()}…` : name, rest: ` · ${key}` },
    cover: {
      pill: "STUDENT OFFER", eyebrow: "STUDY IN THE UK · FOUNDATION YEAR DEGREES", headline: ["Launch your degree", key], name: name || `${key} campus`,
      meta: [...(name ? [`${key} campus`] : []), `Ref ${lead.ref_code}`, issued].map((part) => part.toUpperCase()),
      lead: copy.lead,
      facts: [
        fact("cap", copy.facts?.courses ?? ["COURSES", `${catalogue.length} degrees`, `${foundation.length} with Foundation Year${entry.length ? ` + ${entry.length} Year 1 entry` : ""}`]),
        fact("shield", copy.facts?.universities ?? ["UNIVERSITIES", `${universities.length} UK universities`, universities.map((u) => UNIVERSITIES[u]?.short ?? u).join(" · ")]),
        fact("clock", copy.facts?.classes ?? ["CLASSES", "1–2 days a week", "Daytime, evening & weekend options"]),
        fact("calendar", ["NEXT INTAKE", "Dates TBA", "Register your interest now"]),
      ],
      bandEyebrow: "WHY STUDENTS CHOOSE THIS ROUTE", bandTitle: "A university degree that fits your life", reasons,
      cta: { title: "Your place starts with one conversation", text: "We guide you from application to enrolment, step by step.", button: "Apply with Momentum One" },
      tagline: "BUILDING MOMENTUM FOR YOUR FUTURE",
    },
    layout,
    courses: {
      title: `Your course options in ${key}`,
      intro: `Foundation Year ${foundation.length === 1 ? "degree" : "degrees"} taught at the ${site}. ${timetabled ? "Pick the course and the study pattern that fit your week." : "We'll send you the class days as soon as the college announces them."}`,
      legend: timetabled ? "Each option is one class group — you join one." : null, footnote: copy.footnote ?? TIMETABLE_FOOTNOTE, list: courses,
      year1: year1.length ? { title: "Year 1 entry — no Foundation Year", note: "For students joining straight into Year 1. Entry requirements and timetable are confirmed with you when you apply.", list: year1 } : null,
      note: copy.note ?? null, week: layout === "few" ? weekStrip(courses, foundation.map((c) => c.id), copy.weekNames, !timetabled) : null,
    },
    choice: picked ? { title: picked.title, rest: picked.route === "Year 1" ? " · Year 1 entry" : " with Foundation Year" } : null,
    apply: { year1Note: year1.length > 0, lastPffDays: copy.lastPffDays ?? null },
    legal: `Momentum One is an independent student recruitment agency. Course details are provided by our partner college and the awarding ${universities.length > 1 ? "universities" : "university"} (${list(universities)}). Dates and class timetables for the next intake are to be confirmed and may change. Admission to Foundation Year courses depends on meeting all application requirements and passing the PFF Day.`,
    contact: { ...CONTACT, web: env.host },
    signature: { src: `${env.origin}/signature.png`, ...DIRECTOR },
    assets: { logo: `${env.origin}/offer/offer-logo.png`, wordmark: `${env.origin}/offer/offer-wordmark.png` },
  };
}
