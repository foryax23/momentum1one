export const UK_CITIES = [
  "London", "Birmingham", "Manchester", "Leeds", "Glasgow",
  "Liverpool", "Sheffield", "Bristol", "Edinburgh", "Leicester",
  "Coventry", "Bradford", "Nottingham", "Cardiff", "Belfast",
  "Newcastle", "Stoke-on-Trent", "Southampton", "Derby", "Luton",
  "Sunderland",
] as const;

export const CITY_COORDINATES: Record<(typeof UK_CITIES)[number], readonly [number, number]> = {
  London: [51.507, -0.128], Birmingham: [52.486, -1.89], Manchester: [53.481, -2.243], Leeds: [53.801, -1.549], Glasgow: [55.864, -4.252],
  Liverpool: [53.408, -2.991], Sheffield: [53.381, -1.47], Bristol: [51.454, -2.588], Edinburgh: [55.953, -3.188], Leicester: [52.637, -1.14],
  Coventry: [52.407, -1.512], Bradford: [53.795, -1.759], Nottingham: [52.954, -1.158], Cardiff: [51.481, -3.179], Belfast: [54.597, -5.93],
  Newcastle: [54.978, -1.618], "Stoke-on-Trent": [53.003, -2.18], Southampton: [50.91, -1.404], Derby: [52.922, -1.476], Luton: [51.879, -0.417],
  Sunderland: [54.906, -1.381],
};

export const CAMPUSES = [
  { name: "Manchester", full: "Salford Campus, Manchester", lat: 53.4875, lon: -2.2901 },
  { name: "Sunderland", full: "Sunderland Campus", lat: 54.9069, lon: -1.3838 },
  { name: "Derby", full: "Derby Campus", lat: 52.9225, lon: -1.4746 },
  { name: "Newcastle", full: "Newcastle Campus", lat: 54.9783, lon: -1.6178 },
  { name: "Luton", full: "Luton Campus", lat: 51.8787, lon: -0.42 },
] as const;

export function nearestCampus(city: (typeof UK_CITIES)[number]) {
  const [lat, lon] = CITY_COORDINATES[city];
  const rad = (n: number) => n * Math.PI / 180;
  const distance = (toLat: number, toLon: number) => {
    const a = Math.sin(rad(toLat - lat) / 2) ** 2 + Math.cos(rad(lat)) * Math.cos(rad(toLat)) * Math.sin(rad(toLon - lon) / 2) ** 2;
    return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };
  const campus = CAMPUSES.map((c) => ({ ...c, miles: Math.round(distance(c.lat, c.lon)) })).sort((a, b) => a.miles - b.miles)[0];
  return campus;
}

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
  nearest_campus: string | null;
  distance_miles: number | null;
  created_at: string;
  selected_course: string | null;
  study_route: string | null;
  offer_url: string;
};
