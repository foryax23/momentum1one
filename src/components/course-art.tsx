const shapes: Record<string, React.ReactNode> = {
  business: <><rect x="55" y="42" width="90" height="116" rx="4"/><path d="M70 145V82h20v63m14 0V62h20v83M45 158h110"/></>,
  marketing: <><circle cx="100" cy="100" r="55"/><circle cx="100" cy="100" r="30"/><path d="m100 100 52-42m-20-4h22v22"/></>,
  care: <><path d="M100 157S38 121 46 72c6-34 45-36 54-8 9-28 48-26 54 8 8 49-54 85-54 85Z"/><path d="M70 105h18l9-22 13 43 10-21h18"/></>,
  "public-health": <><circle cx="100" cy="100" r="58"/><path d="M42 100h116M100 42c-22 18-31 38-31 58s9 40 31 58c22-18 31-38 31-58s-9-40-31-58Z"/></>,
  psychology: <><path d="M80 158v-31c-24-9-37-35-28-59 10-29 44-43 72-30 24 11 37 39 27 64-6 16-18 28-34 34v22"/><path d="M78 82c11-16 35-16 46 0m-50 22h52"/></>,
  fashion: <><path d="M82 48c0 12 6 18 18 18s18-6 18-18M100 66 43 119c-7 7-3 18 7 18h100c10 0 14-11 7-18Z"/></>,
  events: <><rect x="43" y="57" width="114" height="105" rx="8"/><path d="M43 88h114M70 41v31m60-31v31m-65 45h18m17 0h18m17 0h5"/></>,
};

export function CourseArt({ subject, className = "" }: { subject: string; className?: string }) {
  return <div className={`course-art ${className}`} aria-hidden><svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">{shapes[subject] ?? shapes["business"]}</svg></div>;
}