import { useEffect, useRef } from "react";

/** Canvas starfield with cursor / device-tilt parallax. */
export function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, raf = 0;
    let tx = 0, ty = 0, px = 0, py = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    type Star = { x: number; y: number; z: number; r: number; t: number };
    let stars: Star[] = [];

    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.floor((w * h) / 4500);
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        z: Math.random() * 0.9 + 0.1, r: Math.random() * 1.3 + 0.2, t: Math.random() * Math.PI * 2,
      }));
    };
    const onMove = (e: PointerEvent) => { tx = (e.clientX / w - 0.5) * 30; ty = (e.clientY / h - 0.5) * 30; };
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      tx = Math.max(-30, Math.min(30, e.gamma)); ty = Math.max(-30, Math.min(30, e.beta - 45));
    };

    const draw = () => {
      px += (tx - px) * 0.05; py += (ty - py) * 0.05;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        if (!reduce) { s.y -= s.z * 0.25; s.t += 0.02; }
        if (s.y < -5) { s.y = h + 5; s.x = Math.random() * w; }
        const a = 0.35 + Math.sin(s.t) * 0.3 + s.z * 0.35;
        ctx.globalAlpha = Math.max(0.05, Math.min(1, a));
        ctx.fillStyle = s.z > 0.85 ? "#9fe3f5" : "#ffffff";
        ctx.beginPath();
        ctx.arc(s.x + px * s.z, s.y + py * s.z, s.r * s.z + 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    resize(); draw();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("deviceorientation", onTilt);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("deviceorientation", onTilt);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
