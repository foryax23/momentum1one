import { cn } from "@/lib/utils";

const TONES = {
  navy: "var(--primary)",
  white: "var(--background)",
  /** the footer's pale tint */
  soft: "color-mix(in oklab, var(--secondary) 60%, var(--background))",
} as const;
type Tone = keyof typeof TONES;

// Ease-in-out stops: a straight two-colour gradient shows a visible line where it starts and ends.
const STOPS = Array.from({ length: 13 }, (_, i) => {
  const position = i / 12;
  return [position, (1 - Math.cos(Math.PI * position)) / 2] as const;
});

function blend(from: Tone, to: Tone) {
  return `linear-gradient(to bottom in oklab, ${STOPS.map(([position, mix]) => `color-mix(in oklab, ${TONES[to]} ${(mix * 100).toFixed(1)}%, ${TONES[from]}) ${(position * 100).toFixed(1)}%`).join(", ")})`;
}

/** A band that carries one section's background colour into the next, so sections never meet at a hard edge. */
export function SectionBlend({ from, to, className }: { from: Tone; to: Tone; className?: string }) {
  // The 1px shadows repeat each neighbour's colour past the band's own edges, so fractional pixels never show a hairline seam.
  return <div aria-hidden className={cn("h-28 sm:h-40", className)} style={{ background: blend(from, to), boxShadow: `0 -1px 0 ${TONES[from]}, 0 1px 0 ${TONES[to]}` }} />;
}
