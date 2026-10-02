import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

const REDUCE = "(prefers-reduced-motion: reduce)";
const subscribeReduce = (notify: () => void) => {
  const query = window.matchMedia(REDUCE);
  query.addEventListener?.("change", notify);
  return () => query.removeEventListener?.("change", notify);
};
const subscribeNever = () => () => undefined;
const onServer = () => false;

/** The system "reduce motion" setting. False on the server and while hydrating so the markup always matches, then follows the setting live. */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeReduce, () => window.matchMedia(REDUCE).matches, onServer);
}

/** Android Data Saver / "Lite" connections: the visitor asked not to spend data on extras. */
function useSaveData() {
  return useSyncExternalStore(subscribeNever, () => Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData), onServer);
}

/** Classes for a managed <video>: invisible until frames are really showing, so the poster underneath covers a slow, refused or failed start. */
export const managedVideoClass = "opacity-0 transition-opacity duration-250 ease-out data-playing:opacity-100";

/** iOS only starts inline video that is already muted when play() runs, and it reads the attributes as well as the properties (React sets `muted` as a property only). */
function prime(el: HTMLVideoElement) {
  el.muted = true;
  el.defaultMuted = true;
  el.playsInline = true;
  el.setAttribute("muted", "");
  el.setAttribute("playsinline", "");
  el.setAttribute("webkit-playsinline", "");
}

// Browsers that refuse autoplay (iOS Low Power Mode, in-app browsers) allow muted inline playback from inside a user gesture.
// pointerdown alone is not enough: for touch, only touchend and click count as a gesture on iOS and Chrome.
const GESTURES = ["pointerdown", "touchend", "click"] as const;
const mounted = new Set<HTMLVideoElement>();
const waiting = new Set<() => void>();
const onGesture = () => {
  for (const retry of Array.from(waiting)) retry();
  // iOS lifts its restriction per element, and only for a play() made inside a gesture. Unlock the videos that exist but are off screen as well
  // (play then pause at once, so nothing is shown or decoded yet); they then start by themselves when the visitor scrolls to them.
  for (const el of mounted) {
    if (!el.paused) continue;
    prime(el);
    el.play()?.catch(() => undefined);
    el.pause();
  }
};
function waitForGesture(retry: () => void) {
  if (!waiting.size) for (const type of GESTURES) window.addEventListener(type, onGesture, { capture: true, passive: true });
  waiting.add(retry);
}
function stopWaiting(retry: () => void) {
  if (!waiting.delete(retry) || waiting.size) return;
  for (const type of GESTURES) window.removeEventListener(type, onGesture, { capture: true });
}

function start(el: HTMLVideoElement, retry: () => void) {
  if (!el.paused) return;
  prime(el);
  // Old browsers return nothing. AbortError only means a pause() arrived first; NotAllowedError is a refused autoplay.
  el.play()?.then(() => stopWaiting(retry), (error: unknown) => { if ((error as { name?: string } | null)?.name === "NotAllowedError") waitForGesture(retry); });
}

/**
 * One policy for every decorative background video:
 * - nothing is rendered on the server, for reduced motion or for Data Saver: the poster image under the video is the whole experience;
 * - the <video> is created only once its frame is within `margin` of the viewport, and is then kept so a later visit resumes instantly;
 * - it downloads nothing until it is first played (`preload="none"`: with "metadata" Chromium buffered half of a clip that was still below the fold, competing with the hero on first load);
 * - it plays only while the frame is on screen and the tab is visible, so off-screen videos never decode;
 * - if the browser refuses autoplay the poster stays and playback is retried from the visitor's next tap or click;
 * - if a source fails to decode the poster comes back and the next <source> is tried.
 * The element gets `data-playing` once frames are really showing; `managedVideoClass` keeps it transparent until then, so a refused or slow video never shows a black frame or the iOS play badge.
 *
 * Usage: put `frame` on the box the video fills and render `{mount && <video ref={video} muted loop playsInline preload="none" className={managedVideoClass}>…</video>}` over the poster <img>.
 */
export function useManagedVideo<F extends HTMLElement = HTMLDivElement>({ margin = "200px 0px" }: { margin?: string } = {}) {
  const frame = useRef<F>(null);
  const node = useRef<HTMLVideoElement | null>(null);
  const onScreen = useRef(false);
  const [near, setNear] = useState(false);
  const reduce = usePrefersReducedMotion();
  const saveData = useSaveData();
  const allowed = !reduce && !saveData;

  const sync = useCallback(function run() {
    const el = node.current;
    if (!el) return;
    if (onScreen.current && !document.hidden) start(el, run);
    else { stopWaiting(run); el.pause(); }
  }, []);

  useEffect(() => {
    const el = frame.current;
    if (!el || !allowed) return;
    if (typeof IntersectionObserver === "undefined") { onScreen.current = true; setNear(true); return; }
    const nearby = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) { setNear(true); nearby.disconnect(); } }, { rootMargin: margin });
    const visible = new IntersectionObserver((entries) => { onScreen.current = Boolean(entries[entries.length - 1]?.isIntersecting); sync(); });
    nearby.observe(el);
    visible.observe(el);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("pageshow", sync);
    return () => {
      nearby.disconnect();
      visible.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pageshow", sync);
      stopWaiting(sync);
      onScreen.current = false;
    };
  }, [allowed, margin, sync]);

  const video = useCallback((el: HTMLVideoElement | null) => {
    node.current = el;
    if (!el) return;
    prime(el);
    mounted.add(el);
    // Not for the play-then-pause unlock above: its `playing` event arrives after the pause, with no frame worth showing.
    const reveal = () => { if (!el.paused) el.setAttribute("data-playing", ""); };
    // A decode failure after the browser has picked a <source> (VP9 with no working decoder on this device, say) never moves on to the next one by itself:
    // go back to the poster and load the next source directly.
    const recover = () => {
      if (!el.error) return;
      el.removeAttribute("data-playing");
      const sources = Array.from(el.querySelectorAll("source"));
      const failed = sources.findIndex((source) => source.src === el.currentSrc);
      const next = sources[failed + 1];
      if (failed < 0 || !next) return;
      el.src = next.src;
      el.load();
      sync();
    };
    el.addEventListener("playing", reveal);
    el.addEventListener("error", recover);
    sync();
    return () => {
      el.removeEventListener("playing", reveal);
      el.removeEventListener("error", recover);
      mounted.delete(el);
      stopWaiting(sync);
      node.current = null;
    };
  }, [sync]);

  return { frame, video, mount: allowed && near };
}
