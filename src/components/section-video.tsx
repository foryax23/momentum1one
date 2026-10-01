import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import campusesVideo from "@/assets/section-videos/momentum-one-campuses-loop.mp4.asset.json";
import campusesPoster from "@/assets/section-videos/momentum-one-campuses-poster.jpg.asset.json";
import coursesVideo from "@/assets/section-videos/momentum-one-courses-loop.mp4.asset.json";
import coursesPoster from "@/assets/section-videos/momentum-one-courses-poster.jpg.asset.json";
import journeyVideo from "@/assets/section-videos/momentum-one-howitworks-loop.mp4.asset.json";
import journeyPoster from "@/assets/section-videos/momentum-one-howitworks-poster.jpg.asset.json";
import startVideo from "@/assets/section-videos/momentum-one-start-uni.mp4.asset.json";
import startPoster from "@/assets/section-videos/momentum-one-start-uni-poster.jpg.asset.json";
import { cn } from "@/lib/utils";

const media = {
  campuses: { video: campusesVideo.url, poster: campusesPoster.url, ratio: "aspect-square" },
  courses: { video: coursesVideo.url, poster: coursesPoster.url, ratio: "aspect-square" },
  journey: { video: journeyVideo.url, poster: journeyPoster.url, ratio: "aspect-square" },
  start: { video: startVideo.url, poster: startPoster.url, ratio: "aspect-video" },
} as const;

type SectionVideoProps = {
  kind: keyof typeof media;
  className?: string;
};

export function SectionVideo({ kind, className }: SectionVideoProps) {
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [nearby, setNearby] = useState(false);
  const reduce = useReducedMotion();
  const saveData = typeof navigator !== "undefined" && Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
  const item = media[kind];

  useEffect(() => {
    const node = frame.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setNearby(Boolean(entry?.isIntersecting)), { rootMargin: "180px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = video.current;
    if (!node) return;
    const syncPlayback = () => {
      if (document.hidden || !nearby) node.pause();
      else void node.play().catch(() => undefined);
    };
    syncPlayback();
    document.addEventListener("visibilitychange", syncPlayback);
    return () => document.removeEventListener("visibilitychange", syncPlayback);
  }, [nearby]);

  return (
    <div ref={frame} className={cn("relative overflow-hidden border border-primary-foreground/15 bg-primary shadow-paper", item.ratio, className)} aria-hidden>
      <img src={item.poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {nearby && !reduce && !saveData && (
        <video ref={video} muted autoPlay loop playsInline preload="metadata" poster={item.poster} className="absolute inset-0 h-full w-full object-cover">
          <source src={item.video} type="video/mp4" />
        </video>
      )}
    </div>
  );
}