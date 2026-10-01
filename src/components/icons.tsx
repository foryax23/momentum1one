import type { SVGProps } from "react";

/** Momentum One hand-drawn line icon set. Stroke follows currentColor. */
type P = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 24, children, ...p }: P & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      {children}
    </svg>
  );
}

export const IconBook = (p: P) => (
  <Base {...p}><path d="M16 9c-3-2.2-7-2.6-11-1.6v16c4-1 8-.6 11 1.6 3-2.2 7-2.6 11-1.6v-16c-4-1-8-.6-11 1.6Z" /><path d="M16 9v16" /><path d="M8 12.5c1.8-.3 3.6-.1 5 .6M8 16.5c1.8-.3 3.6-.1 5 .6" opacity=".6" /></Base>
);
export const IconMortarboard = (p: P) => (
  <Base {...p}><path d="m3 12 13-6 13 6-13 6-13-6Z" /><path d="M8.5 14.5v5.2c2 1.7 4.6 2.6 7.5 2.6s5.5-.9 7.5-2.6v-5.2" /><path d="M27 13v7" /><circle cx="27" cy="21.5" r="1.3" /></Base>
);
export const IconCampus = (p: P) => (
  <Base {...p}><path d="M4 26h24M6 26V13M26 26V13M3.5 13 16 5.5 28.5 13Z" /><path d="M10.5 26v-9M16 26v-9M21.5 26v-9" /><circle cx="16" cy="10.5" r="1.4" /></Base>
);
export const IconPin = (p: P) => (
  <Base {...p}><path d="M16 28s-8.5-8.2-8.5-14.5a8.5 8.5 0 0 1 17 0C24.5 19.8 16 28 16 28Z" /><circle cx="16" cy="13.5" r="3" /></Base>
);
export const IconPassport = (p: P) => (
  <Base {...p}><rect x="7" y="4" width="18" height="24" rx="2" /><circle cx="16" cy="13" r="4.2" /><path d="M11.8 13h8.4M16 8.8c-1.3 1.2-1.9 2.6-1.9 4.2s.6 3 1.9 4.2c1.3-1.2 1.9-2.6 1.9-4.2s-.6-3-1.9-4.2M11.5 22h9" /></Base>
);
export const IconCalendar = (p: P) => (
  <Base {...p}><rect x="5" y="7" width="22" height="20" rx="2" /><path d="M5 13h22M11 4v5M21 4v5" /><path d="M10 17.5h2M15 17.5h2M20 17.5h2M10 22h2M15 22h2" /></Base>
);
export const IconRocket = (p: P) => (
  <Base {...p}><path d="M16 3.5c3.6 2.6 5 6.6 5 11v6h-10v-6c0-4.4 1.4-8.4 5-11Z" /><circle cx="16" cy="12" r="2" /><path d="M11 16.5 7.5 20v3.5L11 22M21 16.5l3.5 3.5v3.5L21 22" /><path d="M14 24.5c0 1.6.7 2.8 2 4 1.3-1.2 2-2.4 2-4" /></Base>
);
export const IconSeal = (p: P) => (
  <Base {...p}><circle cx="16" cy="13" r="8" /><circle cx="16" cy="13" r="5" opacity=".6" /><path d="m11 19.5-2 8 4-2 3 2.5M21 19.5l2 8-4-2-3 2.5" /></Base>
);
export const IconPhone = (p: P) => (
  <Base {...p}><rect x="9" y="3.5" width="14" height="25" rx="3" /><path d="M14 7h4M15 24.5h2" /></Base>
);
export const IconEnvelope = (p: P) => (
  <Base {...p}><rect x="4" y="7.5" width="24" height="17" rx="2" /><path d="m4.5 9 11.5 8.5L27.5 9" /></Base>
);
export const IconLedger = (p: P) => (
  <Base {...p}><path d="M5 26h22" /><path d="M8 22v-5M13 22v-9M18 22v-6M23 22V8" /><path d="m7 13 6-5 5 4 6-6" opacity=".6" /></Base>
);
export const IconCare = (p: P) => (
  <Base {...p}><path d="M16 14.5c-1.6-2.8-6-2.6-6 .8 0 2.6 3.4 4.8 6 6.7 2.6-1.9 6-4.1 6-6.7 0-3.4-4.4-3.6-6-.8Z" /><path d="M3 22c3 0 5 1.5 7 3.5h7c1 0 1.6-.6 1.6-1.4 0-.9-.7-1.5-1.6-1.5h-3.5M29 22c-3 0-4.4 1-6 2.5" /></Base>
);
export const IconGlobe = (p: P) => (
  <Base {...p}><circle cx="16" cy="16" r="11" /><path d="M5 16h22M16 5c-3.2 3-4.8 6.7-4.8 11s1.6 8 4.8 11c3.2-3 4.8-6.7 4.8-11S19.2 8 16 5Z" /></Base>
);
export const IconHanger = (p: P) => (
  <Base {...p}><path d="M16 12c0-1.5 0-2 1.4-2.8a2.6 2.6 0 1 0-4-2.2" /><path d="M16 12 4.5 21.5c-.9.8-.4 2.5.9 2.5h21.2c1.3 0 1.8-1.7.9-2.5Z" /></Base>
);
export const IconCompass = (p: P) => (
  <Base {...p}><circle cx="16" cy="16" r="11" /><path d="m20.5 11.5-2.6 6.4-6.4 2.6 2.6-6.4 6.4-2.6Z" /><circle cx="16" cy="16" r=".8" fill="currentColor" /></Base>
);
export const IconArrowRight = (p: P) => (
  <Base {...p}><path d="M6 16h19M19 9.5l6.5 6.5-6.5 6.5" /></Base>
);
export const IconArrowLeft = (p: P) => (
  <Base {...p}><path d="M26 16H7M13 9.5 6.5 16l6.5 6.5" /></Base>
);
export const IconTick = (p: P) => (
  <Base {...p}><path d="M6 17.5c2.4 1.6 4.4 3.6 6 6 3.4-7 8-12.3 14-16" /></Base>
);
export const IconDownload = (p: P) => (
  <Base {...p}><path d="M16 4.5v15M10 14l6 6 6-6M5.5 22.5v3h21v-3" /></Base>
);
export const IconSearch = (p: P) => (
  <Base {...p}><circle cx="14" cy="14" r="8" /><path d="m20 20 6.5 6.5" /></Base>
);
export const IconDoor = (p: P) => (
  <Base {...p}><path d="M13 5.5H7v21h6M18 10l6 6-6 6M24 16H12" /></Base>
);
export const IconClose = (p: P) => (
  <Base {...p}><path d="M8 8l16 16M24 8 8 24" /></Base>
);
export const IconQuill = (p: P) => (
  <Base {...p}><path d="M27 4.5C17 6 10 13 7.5 24.5M27 4.5c-1 7-5 12.5-13.5 14.5M5 27.5l2.5-3" /></Base>
);

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className="animate-spin" aria-hidden>
      <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeOpacity=".2" strokeWidth="3" />
      <path d="M16 4a12 12 0 0 1 12 12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
