export const UK_CITIES = [
  "London", "Birmingham", "Manchester", "Leeds", "Glasgow",
  "Liverpool", "Sheffield", "Bristol", "Edinburgh", "Leicester",
  "Coventry", "Bradford", "Nottingham", "Cardiff", "Belfast",
  "Newcastle", "Stoke-on-Trent", "Southampton", "Derby", "Luton",
] as const;

export const INTERESTS = [
  { value: "Business Management", emoji: "📈", hint: "Lead teams & build companies" },
  { value: "Health & Social Care", emoji: "🩺", hint: "Care, wellbeing, NHS pathways" },
  { value: "Public Health", emoji: "🌍", hint: "Foundation year included" },
  { value: "Fashion Management", emoji: "✦", hint: "Brand, retail & strategy" },
  { value: "Not sure yet", emoji: "🧭", hint: "We'll help you choose" },
] as const;

export const INTAKES = [
  { value: "January 2027", hint: "Applications open now" },
  { value: "Later in 2027", hint: "May, June or September" },
  { value: "Just exploring", hint: "No rush — get the info" },
] as const;

export type LeadResult = {
  ref_code: string;
  full_name: string;
  city: string;
  interest: string | null;
  intake: string | null;
  created_at: string;
};
