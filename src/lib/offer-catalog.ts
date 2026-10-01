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

const patterns: Record<string, Record<string, string[]>> = {
  Manchester: {
    "business-foundation": ["Monday daytime", "Monday + Tuesday evenings", "Friday + Sunday half days"],
    "marketing-foundation": ["Tuesday daytime", "Wednesday daytime", "Tuesday + Wednesday evenings", "Thursday evening + Sunday half day"],
    "care-foundation": ["Tuesday full day + Wednesday half day", "Friday half day + Sunday full day", "Sunday full day + Monday evening"],
    "fashion-foundation": ["Wednesday + Thursday daytime"], "events-foundation": ["Monday + Tuesday daytime", "Wednesday + Thursday daytime"],
    "psychology-foundation": ["Friday full day + Saturday half day", "Friday half day + Saturday full day"],
  },
  Derby: {
    "business-foundation": ["Monday daytime", "Tuesday daytime", "Wednesday + Thursday evenings"],
    "marketing-foundation": ["Monday daytime", "Monday + Tuesday evenings", "Wednesday + Thursday evenings"],
    "care-foundation": ["Wednesday full day + Sunday half day", "Thursday full day + Friday half day", "Friday half day + Saturday full day"],
    "fashion-foundation": ["Thursday + Friday daytime"], "events-foundation": ["Thursday + Friday daytime"],
    "psychology-foundation": ["Wednesday full day + Thursday half day"],
  },
  Sunderland: {
    "business-foundation": ["Friday daytime", "Monday + Tuesday evenings", "Wednesday + Thursday evenings"],
    "marketing-foundation": ["Friday daytime", "Thursday + Sunday half days", "Monday + Tuesday evenings"],
    "care-foundation": ["Friday half day + Saturday full day", "Friday half day + Sunday full day"],
    "fashion-foundation": ["Wednesday + Thursday daytime"], "events-foundation": ["Wednesday + Thursday daytime"],
    "psychology-foundation": ["Wednesday half day + Thursday full day", "Thursday evening + Friday full day"],
  },
};

export const CAMPUS_COURSES: Record<string, CourseOption[]> = {
  Manchester: [
    ...foundation.map(([id, title, university]) => ({ id, title, university, route: "Foundation Year" as const, patterns: patterns.Manchester[id] })),
    { id: "business-year-1", title: "BA (Hons) Business Management", university: "University of Wolverhampton", route: "Year 1", patterns: ["Timetable confirmed after application"] },
    { id: "marketing-year-1", title: "BA (Hons) Digital Marketing Management", university: "University of Wolverhampton", route: "Year 1", patterns: ["Timetable confirmed after application"] },
  ],
  Derby: [
    ...foundation.map(([id, title, university]) => ({ id, title, university, route: "Foundation Year" as const, patterns: patterns.Derby[id] })),
    { id: "business-year-1", title: "BA (Hons) Business Management", university: "University of Wolverhampton", route: "Year 1", patterns: ["Timetable confirmed after application"] },
    { id: "marketing-year-1", title: "BA (Hons) Digital Marketing Management", university: "University of Wolverhampton", route: "Year 1", patterns: ["Timetable confirmed after application"] },
  ],
  Sunderland: foundation.map(([id, title, university]) => ({ id, title, university, route: "Foundation Year", patterns: patterns.Sunderland[id] })),
  Newcastle: foundation.slice(0, 2).map(([id, title, university], index) => ({ id, title, university, route: "Foundation Year", patterns: [index === 0 ? "Tuesday, 9am to 5pm" : "Wednesday, 9am to 5pm"] })),
  Luton: [{ id: "public-health-foundation", title: "BSc (Hons) Public Health", university: "University of Wolverhampton", route: "Foundation Year", patterns: ["Timetable to be confirmed"] }],
};

export function campusName(full: string | null) {
  return full?.includes("Manchester") ? "Manchester" : full?.split(" ")[0] ?? "Luton";
}

export function coursesForCampus(full: string | null) {
  return CAMPUS_COURSES[campusName(full)] ?? CAMPUS_COURSES.Luton;
}