import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import heroMp4 from "@/assets/hero/momentum-campus-loop.mp4.asset.json";
import heroWebm from "@/assets/hero/momentum-campus-loop.webm.asset.json";
import heroPoster from "@/assets/hero/momentum-campus-poster.png.asset.json";

export function HeroVideo() {
  const video = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const node = video.current;
    if (!node || reduce) return;
    const onVisibility = () => {
      if (document.hidden) node.pause();
      else void node.play().catch(() => undefined);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [reduce]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-primary" aria-hidden>
      <img src={heroPoster.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {!reduce && (
        <video ref={video} muted autoPlay loop playsInline preload="metadata" poster={heroPoster.url} className="absolute inset-0 h-full w-full object-cover">
          <source src={heroWebm.url} type="video/webm" />
          <source src={heroMp4.url} type="video/mp4" />
        </video>
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/88 to-primary/55" />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-primary/25" />
    </div>
  );
}