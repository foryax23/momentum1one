export type CourseOption = {
  id: string;
  title: string;
  university: string;
  route: "Foundation Year" | "Year 1";
  patterns: string[];
};

const foundation = [
  ["business-foundation", "BA (Hons) Business Management", "University of Wolverhampton"],
  ["marketing-foundation", "BA (Hons) Digital Marketing Management", "University of Wolverhampton"],
  ["care-foundation", "BA (Hons) Health and Social Care", "University of Wolverhampton"],
  ["fashion-foundation", "BSc (Hons) Fashion Management and Strategy", "Arts University Bournemouth"],
  ["events-foundation", "BA (Hons) Events Management", "Arts University Bournemouth"],
  ["psychology-foundation", "BSc (Hons) Psychology", "Health Sciences University"],
] as const;

// Study patterns as the client's offer templates print them (June/September 2026 intake timetable). A bare day is a daytime class;
// the offer PDF derives its DAYTIME / EVENING / WEEKEND tags from this wording (patternTags in src/components/offer-pdf/data.ts).
const patterns: Record<string, Record<string, string[]>> = {
  Manchester: {
    "business-foundation": ["Monday", "Monday + Tuesday evenings", "Friday (half day) + Sunday (half day)"],
    "marketing-foundation": ["Tuesday", "Wednesday", "Tuesday + Wednesday evenings", "Thursday evening + Sunday (half day)"],
    "care-foundation": ["Tuesday (full day) + Wednesday (half day)", "Friday (half day) + Sunday (full day)", "Sunday (full day) + Monday evening", "Wednesday evening + Sunday (full day)"],
    "fashion-foundation": ["Wednesday + Thursday"], "events-foundation": ["Monday + Tuesday", "Wednesday + Thursday"],
    "psychology-foundation": ["Friday (full day) + Saturday (half day)", "Friday (half day) + Saturday (full day)"],
  },
  Derby: {
    "business-foundation": ["Monday", "Tuesday", "Wednesday + Thursday evenings"],
    "marketing-foundation": ["Monday", "Monday + Tuesday evenings", "Wednesday + Thursday evenings"],
    "care-foundation": ["Wednesday (full day) + Sunday (half day)", "Thursday (full day) + Friday (half day)", "Friday (half day) + Saturday (full day)"],
    "fashion-foundation": ["Thursday + Friday"], "events-foundation": ["Thursday + Friday"],
    "psychology-foundation": ["Wednesday (full day) + Thursday (half day)"],
  },
  Sunderland: {
    "business-foundation": ["Friday", "Monday + Tuesday evenings", "Wednesday + Thursday evenings"],
    "marketing-foundation": ["Friday", "Thursday (half day) + Sunday (half day)", "Monday + Tuesday evenings"],
    "care-foundation": ["Friday (half day) + Saturday (full day)", "Friday (half day) + Sunday (full day)"],
    "fashion-foundation": ["Wednesday + Thursday"], "events-foundation": ["Wednesday + Thursday"],
    "psychology-foundation": ["Wednesday (half day) + Thursday (full day)", "Thursday evening + Friday (full day)"],
  },
};

function campusFoundation(name: "Manchester" | "Derby" | "Sunderland"): CourseOption[] {
  const campusPatterns = patterns[name] ?? {};
  return foundation.map(([id, title, university]) => ({
    id, title, university, route: "Foundation Year", patterns: campusPatterns[id] ?? ["Timetable to be confirmed"],
  }));
}

export const CAMPUS_COURSES: Record<string, CourseOption[]> = {
  Manchester: [
    ...campusFoundation("Manchester"),
    { id: "business-year-1", title: "BA (Hons) Business Management", university: "University of Wolverhampton", route: "Year 1", patterns: ["Timetable confirmed after application"] },
    { id: "marketing-year-1", title: "BA (Hons) Digital Marketing Management", university: "University of Wolverhampton", route: "Year 1", patterns: ["Timetable confirmed after application"] },
  ],
  Derby: [
    ...campusFoundation("Derby"),
    { id: "business-year-1", title: "BA (Hons) Business Management", university: "University of Wolverhampton", route: "Year 1", patterns: ["Timetable confirmed after application"] },
    { id: "marketing-year-1", title: "BA (Hons) Digital Marketing Management", university: "University of Wolverhampton", route: "Year 1", patterns: ["Timetable confirmed after application"] },
  ],
  Sunderland: campusFoundation("Sunderland"),
  Newcastle: foundation.slice(0, 2).map(([id, title, university], index) => ({ id, title, university, route: "Foundation Year", patterns: [index === 0 ? "Tuesday, 9am – 5pm" : "Wednesday, 9am – 5pm"] })),
  Luton: [{ id: "public-health-foundation", title: "BSc (Hons) Public Health", university: "University of Wolverhampton", route: "Foundation Year", patterns: ["Timetable to be confirmed"] }],
};

// Where each campus teaches, in the wording of the offer templates. Manchester's Foundation Year runs at Salford and its Year 1 entry at Abarna.
export const CAMPUS_SITES: Record<string, { site: string; year1Site?: string }> = {
  Manchester: { site: "Salford Campus (Manchester)", year1Site: "Abarna Campus (Manchester)" },
  Derby: { site: "Derby Campus", year1Site: "Derby Campus" },
  Sunderland: { site: "Sunderland Campus" },
  Newcastle: { site: "Newcastle Campus" },
  Luton: { site: "Luton Campus" },
};

export function campusName(full: string | null) {
  return full?.includes("Manchester") ? "Manchester" : full?.split(" ")[0] ?? "Luton";
}

export function coursesForCampus(full: string | null) {
  return CAMPUS_COURSES[campusName(full)] ?? CAMPUS_COURSES["Luton"] ?? [];
}