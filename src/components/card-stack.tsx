import { Children, useEffect, useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { cn } from "@/lib/utils";

type Layout = { tops: number[]; sticks: number[]; heights: number[] };

/**
 * Wallet-style stack. Each card sticks `peek` px lower than the one before it, so the top strip of every earlier card
 * stays visible while the next card slides over it; cards underneath shrink a little as the stack builds.
 * Stickiness is opt-in per item through `itemClassName` (e.g. "max-lg:sticky"), so the same markup can be a plain grid
 * at other breakpoints. `--stack-top` on the container sets where the first card sticks (below the site header).
 */
export function CardStack({ children, peek = 48, hold = 96, className, itemClassName }: { children: ReactNode; peek?: number; hold?: number; className?: string; itemClassName?: (index: number) => string }) {
  const items = Children.toArray(children);
  const root = useRef<HTMLDivElement>(null);
  const spacer = useRef<HTMLDivElement>(null);
  const layout = useRef<Layout>({ tops: [], sticks: [], heights: [] });
  const { scrollY } = useScroll();

  // Sticky elements report their stuck position, so each card's resting place is derived from the container instead.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const measure = () => {
      const wrappers = (Array.from(el.children) as HTMLElement[]).filter((child) => child !== spacer.current);
      const gap = parseFloat(getComputedStyle(el).rowGap) || 0;
      let top = el.getBoundingClientRect().top + window.scrollY;
      const next: Layout = { tops: [], sticks: [], heights: [] };
      for (const wrapper of wrappers) {
        const style = getComputedStyle(wrapper);
        next.tops.push(top);
        next.sticks.push(style.position === "sticky" ? parseFloat(style.top) || 0 : Number.NaN);
        next.heights.push(wrapper.offsetHeight);
        top += wrapper.offsetHeight + gap;
      }
      layout.current = next;
      // A card can only stay stuck while the container still has content below it. The spacer adds that room: enough for
      // every card to remain in place when the last one lands, plus `hold` px during which the finished stack rests.
      const last = wrappers.length - 1;
      const stacked = last > 0 && !Number.isNaN(next.sticks[last] ?? Number.NaN);
      const lowest = Math.max(...next.sticks.map((stick, i) => stick + (next.heights[i] ?? 0)));
      const room = stacked ? Math.max(0, lowest - ((next.sticks[last] ?? 0) + (next.heights[last] ?? 0)) - gap) + hold : 0;
      if (spacer.current) { spacer.current.style.height = `${room}px`; spacer.current.hidden = room === 0; }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    for (const wrapper of Array.from(el.children)) if (wrapper !== spacer.current) observer.observe(wrapper);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, [items.length, hold]);

  return (
    <div ref={root} role="list" className={cn("relative", className)}>
      {items.map((child, index) => (
        <StackItem key={index} index={index} peek={peek} scrollY={scrollY} layout={layout} className={itemClassName?.(index)}>{child}</StackItem>
      ))}
      <div ref={spacer} hidden aria-hidden className="col-span-full" />
    </div>
  );
}

function StackItem({ children, index, peek, scrollY, layout, className }: { children: ReactNode; index: number; peek: number; scrollY: MotionValue<number>; layout: React.RefObject<Layout>; className?: string | undefined }) {
  const reduce = useReducedMotion();
  // For this card at scroll position y: how many later cards have landed on it (each counts 0 → 1 over its final
  // approach), and the lowest point it may still show. A card must never poke out below a shorter card covering it.
  const state = (y: number) => {
    const { tops, sticks, heights } = layout.current;
    const stick = sticks[index] ?? Number.NaN;
    const height = heights[index] ?? 0;
    if (Number.isNaN(stick)) return { covered: 0, hiddenBelow: 0 };
    let covered = 0;
    let visibleBottom = stick + height;
    for (let later = index + 1; later < tops.length; later++) {
      const laterStick = sticks[later] ?? 0;
      const approach = Math.max(120, (heights[later - 1] ?? 0) - peek);
      covered += Math.min(1, Math.max(0, (y - ((tops[later] ?? 0) - laterStick - approach)) / approach));
      const laterTop = Math.max(laterStick, (tops[later] ?? 0) - y);
      if (laterTop < stick + height) visibleBottom = Math.min(visibleBottom, laterTop + (heights[later] ?? 0));
    }
    return { covered, hiddenBelow: Math.max(0, stick + height - Math.max(visibleBottom, stick + peek + 16)) };
  };
  const scaleFor = (covered: number) => 1 - Math.min(covered, 4) * 0.035;
  const transform = useTransform(scrollY, (y) => {
    const { covered } = state(y);
    return reduce || !covered ? "none" : `scale(${scaleFor(covered).toFixed(4)})`;
  });
  const clipPath = useTransform(scrollY, (y) => {
    const { covered, hiddenBelow } = state(y);
    return hiddenBelow ? `inset(0px 0px ${Math.ceil(hiddenBelow / (reduce ? 1 : scaleFor(covered)))}px 0px round 1rem)` : "none";
  });
  return (
    <div role="listitem" className={className} style={{ top: `calc(var(--stack-top, 4rem) + ${index * peek}px)` }}>
      <motion.div style={{ transform, clipPath, transformOrigin: "50% 0%" }} className="h-full">{children}</motion.div>
    </div>
  );
}
