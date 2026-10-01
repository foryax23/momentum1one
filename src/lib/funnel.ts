export const UK_CITIES = [
  "London", "Birmingham", "Manchester", "Leeds", "Glasgow",
  "Liverpool", "Sheffield", "Bristol", "Edinburgh", "Leicester",
  "Coventry", "Bradford", "Nottingham", "Cardiff", "Belfast",
  "Newcastle", "Stoke-on-Trent", "Southampton", "Derby", "Luton",
] as const;

export const INTERESTS = [
  { value: "Business Management", icon: "ledger", hint: "Lead teams and build companies" },
  { value: "Health & Social Care", icon: "care", hint: "Care, wellbeing and NHS pathways" },
  { value: "Public Health", icon: "globe", hint: "Foundation year included" },
  { value: "Fashion Management", icon: "hanger", hint: "Brand, retail and strategy" },
  { value: "Not sure yet", icon: "compass", hint: "We will help you choose" },
] as const;

export const INTAKES = [
  { value: "January 2027", short: "JAN", year: "2027", hint: "Applications open now" },
  { value: "Later in 2027", short: "SEP", year: "2027", hint: "May, June or September" },
  { value: "Just exploring", short: "ANY", year: "TIME", hint: "No rush, get the info first" },
] as const;

export type LeadResult = {
  ref_code: string;
  full_name: string;
  city: string;
  interest: string | null;
  intake: string | null;
  created_at: string;
};
