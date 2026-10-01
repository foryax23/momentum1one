import { AnimatePresence, motion } from "motion/react";
import { UK_CITIES } from "@/lib/funnel";

/** Simple equirectangular projection tuned to the British Isles. */
const px = (lon: number) => (lon + 8.5) * 40;
const py = (lat: number) => (59 - lat) * 64;

const GB: [number, number][] = [
  [-3.0, 58.6], [-1.8, 57.6], [-2.1, 57.1], [-2.5, 56.5], [-3.0, 56.0], [-2.0, 55.8], [-1.6, 55.6], [-1.3, 54.9],
  [-0.5, 54.4], [-0.1, 54.0], [0.1, 53.5], [0.3, 53.1], [1.7, 52.7], [1.6, 52.1], [0.9, 51.8], [1.4, 51.3],
  [0.9, 50.9], [0.0, 50.8], [-1.2, 50.7], [-2.5, 50.6], [-3.5, 50.3], [-4.2, 50.4], [-5.7, 50.05], [-5.0, 50.6],
  [-4.2, 51.1], [-3.1, 51.2], [-2.7, 51.5], [-3.4, 51.4], [-4.3, 51.6], [-5.2, 51.7], [-4.7, 52.1], [-4.1, 52.4],
  [-4.1, 52.9], [-4.7, 52.8], [-4.5, 53.4], [-3.1, 53.3], [-3.0, 53.7], [-3.4, 54.4], [-3.2, 54.9], [-4.4, 54.7],
  [-5.1, 54.8], [-4.9, 55.6], [-5.6, 55.3], [-5.6, 56.3], [-6.2, 56.7], [-5.7, 57.3], [-5.8, 57.9], [-5.0, 58.6],
];
const NI: [number, number][] = [
  [-5.9, 55.2], [-5.5, 54.6], [-5.8, 54.2], [-6.4, 54.05], [-7.3, 54.1], [-8.1, 54.4], [-7.6, 54.9], [-7.0, 55.2],
];

export const CITY_COORDS: Record<(typeof UK_CITIES)[number], [number, number]> = {
  London: [-0.13, 51.51], Birmingham: [-1.9, 52.48], Manchester: [-2.24, 53.48], Leeds: [-1.55, 53.8],
  Glasgow: [-4.25, 55.86], Liverpool: [-2.98, 53.41], Sheffield: [-1.47, 53.38], Bristol: [-2.59, 51.45],
  Edinburgh: [-3.19, 55.95], Leicester: [-1.13, 52.64], Coventry: [-1.51, 52.41], Bradford: [-1.75, 53.79],
  Nottingham: [-1.15, 52.95], Cardiff: [-3.18, 51.48], Belfast: [-5.93, 54.6], Newcastle: [-1.61, 54.97],
  "Stoke-on-Trent": [-2.18, 53.0], Southampton: [-1.4, 50.9], Derby: [-1.48, 52.92], Luton: [-0.42, 51.88],
  Sunderland: [-1.38, 54.91],
};

const toPath = (pts: [number, number][]) =>
  "M" + pts.map(([lo, la]) => `${px(lo).toFixed(1)},${py(la).toFixed(1)}`).join(" L") + " Z";

export function UkMap({ selected, className, network = false }: { selected?: string; className?: string; network?: boolean }) {
  const sel = selected ? CITY_COORDS[selected as keyof typeof CITY_COORDS] : undefined;
  const london = CITY_COORDS.London;
  return (
    <svg viewBox="0 0 420 590" className={className} aria-hidden>
      <motion.path d={toPath(GB)} fill="color-mix(in oklab, var(--teal) 7%, transparent)" stroke="var(--ink)" strokeOpacity=".55" strokeWidth="1.4" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, ease: "easeInOut" }} />
      <motion.path d={toPath(NI)} fill="color-mix(in oklab, var(--teal) 7%, transparent)" stroke="var(--ink)" strokeOpacity=".55" strokeWidth="1.4" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, delay: 0.4 }} />
      {network &&
        Object.entries(CITY_COORDS).map(([c, [lo, la]], i) => (
          <motion.line key={c} x1={px(london[0])} y1={py(london[1])} x2={px(lo)} y2={py(la)} stroke="var(--teal)" strokeOpacity=".35" strokeDasharray="2 5"
            initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.4 + i * 0.05 }} />
        ))}
      {Object.entries(CITY_COORDS).map(([c, [lo, la]]) => (
        <circle key={c} cx={px(lo)} cy={py(la)} r={c === selected ? 0 : 3.2} fill="var(--ink)" fillOpacity={c === selected ? 0 : 0.45} />
      ))}
      <AnimatePresence>
        {sel && (
          <motion.g key={selected} initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 16 }}>
            <motion.circle cx={px(sel[0])} cy={py(sel[1])} r="6" fill="none" stroke="var(--teal)" strokeWidth="2"
              initial={{ scale: 0.4, opacity: 1 }} animate={{ scale: 3.2, opacity: 0 }} transition={{ duration: 1.4, repeat: Infinity }}
              style={{ transformOrigin: `${px(sel[0])}px ${py(sel[1])}px` }} />
            <path transform={`translate(${px(sel[0]) - 14} ${py(sel[1]) - 36})`} d="M14 36S2 24 2 14a12 12 0 0 1 24 0c0 10-12 22-12 22Z" fill="var(--teal)" stroke="var(--ink)" strokeWidth="1.5" />
            <circle cx={px(sel[0])} cy={py(sel[1]) - 22} r="4.2" fill="var(--paper)" />
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  );
}
