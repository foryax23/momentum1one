import { Children, useEffect, useRef, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
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
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const wrappers = (Array.from(el.children) as HTMLElement[]).filter((child) => child !== spacer.current);
    const cards = wrappers.map((wrapper) => wrapper.firstElementChild as HTMLElement);
    // What each card currently has written to it, so a scroll frame that changes nothing writes nothing.
    const written = cards.map(() => ({ scale: "", clip: 0 }));
    let layout: Layout = { tops: [], sticks: [], heights: [] };
    let near = false;
    let sticky = false;
    let tracking = false;

    // For each card at the current scroll position: how many later cards have landed on it (each counts 0 → 1 over its
    // final approach), and the lowest point it may still show. A card must never poke out below a shorter card covering it.
    const apply = () => {
      const y = window.scrollY;
      const { tops, sticks, heights } = layout;
      for (let index = 0; index < cards.length; index++) {
        const card = cards[index];
        const was = written[index];
        if (!card || !was) continue;
        const stick = sticks[index] ?? Number.NaN;
        const height = heights[index] ?? 0;
        let covered = 0;
        let hiddenBelow = 0;
        if (!Number.isNaN(stick)) {
          let visibleBottom = stick + height;
          for (let later = index + 1; later < tops.length; later++) {
            const laterStick = sticks[later] ?? 0;
            const approach = Math.max(120, (heights[later - 1] ?? 0) - peek);
            covered += Math.min(1, Math.max(0, (y - ((tops[later] ?? 0) - laterStick - approach)) / approach));
            const laterTop = Math.max(laterStick, (tops[later] ?? 0) - y);
            if (laterTop < stick + height) visibleBottom = Math.min(visibleBottom, laterTop + (heights[later] ?? 0));
          }
          hiddenBelow = Math.max(0, stick + height - Math.max(visibleBottom, stick + peek + 16));
        }
        const depth = reduce ? 1 : 1 - Math.min(covered, 4) * 0.035;
        const scale = reduce || !covered ? "" : depth.toFixed(4);
        const clip = hiddenBelow ? Math.ceil(hiddenBelow / depth) : 0;
        if (scale !== was.scale) { card.style.transform = scale ? `scale(${scale})` : ""; was.scale = scale; }
        if (clip !== was.clip) { card.style.clipPath = clip ? `inset(0px 0px ${clip}px 0px round 1rem)` : ""; was.clip = clip; }
      }
    };

    // Scroll work only happens while the stack is near the viewport and actually stacking (not in the grid layout, not
    // on short screens). The cards that get covered are promoted for that time so scaling them does not repaint.
    const track = () => {
      const want = near && sticky;
      if (want !== tracking) {
        tracking = want;
        if (!reduce) cards.forEach((card, index) => { if (index < cards.length - 1) card.style.willChange = want ? "transform" : ""; });
        if (want) window.addEventListener("scroll", apply, { passive: true });
        else window.removeEventListener("scroll", apply);
      }
      apply();
    };

    // Sticky elements report their stuck position, so each card's resting place is derived from the container instead.
    const measure = () => {
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
      layout = next;
      sticky = next.sticks.some((stick) => !Number.isNaN(stick));
      // A card can only stay stuck while the container still has content below it. The spacer adds that room: enough for
      // every card to remain in place when the last one lands, plus `hold` px during which the finished stack rests.
      const last = wrappers.length - 1;
      const stacked = last > 0 && !Number.isNaN(next.sticks[last] ?? Number.NaN);
      const lowest = Math.max(...next.sticks.map((stick, i) => stick + (next.heights[i] ?? 0)));
      const room = stacked ? Math.max(0, lowest - ((next.sticks[last] ?? 0) + (next.heights[last] ?? 0)) - gap) + hold : 0;
      if (spacer.current) { spacer.current.style.height = `${room}px`; spacer.current.hidden = room === 0; }
      track();
    };

    measure();
    const resized = new ResizeObserver(measure);
    resized.observe(el);
    for (const wrapper of wrappers) resized.observe(wrapper);
    window.addEventListener("resize", measure);
    const seen = new IntersectionObserver((entries) => { near = entries[entries.length - 1]?.isIntersecting ?? false; track(); }, { rootMargin: "200px 0px" });
    seen.observe(el);
    return () => {
      resized.disconnect();
      seen.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", apply);
      for (const card of cards) { card.style.transform = ""; card.style.clipPath = ""; card.style.willChange = ""; }
    };
  }, [items.length, peek, hold, reduce]);

  return (
    <div ref={root} role="list" className={cn("relative", className)}>
      {items.map((child, index) => (
        <div key={index} role="listitem" className={itemClassName?.(index)} style={{ top: `calc(var(--stack-top, 4rem) + ${index * peek}px)` }}>
          <div style={{ transformOrigin: "50% 0%" }} className="h-full">{child}</div>
        </div>
      ))}
      <div ref={spacer} hidden aria-hidden className="col-span-full" />
    </div>
  );
}
