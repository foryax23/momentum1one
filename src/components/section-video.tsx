import campusesVideo from "@/assets/section-videos/momentum-one-campuses-loop.mp4.asset.json";
import campusesPoster from "@/assets/section-videos/momentum-one-campuses-poster.jpg.asset.json";
import coursesVideo from "@/assets/section-videos/momentum-one-courses-loop.mp4.asset.json";
import coursesPoster from "@/assets/section-videos/momentum-one-courses-poster.jpg.asset.json";
import journeyVideo from "@/assets/section-videos/momentum-one-howitworks-loop.mp4.asset.json";
import journeyPoster from "@/assets/section-videos/momentum-one-howitworks-poster.jpg.asset.json";
import startVideo from "@/assets/section-videos/momentum-one-start-uni.mp4.asset.json";
import startPoster from "@/assets/section-videos/momentum-one-start-uni-poster.jpg.asset.json";
import { managedVideoClass, useManagedVideo } from "@/hooks/use-managed-video";
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
  immersive?: boolean;
};

export function SectionVideo({ kind, className, immersive = false }: SectionVideoProps) {
  const { frame, video, mount } = useManagedVideo();
  const item = media[kind];

  return (
    <div
      ref={frame}
      className={cn(
        "relative overflow-hidden bg-primary",
        immersive ? "h-full min-h-64" : `border border-primary-foreground/15 shadow-paper ${item.ratio}`,
        className,
      )}
      aria-hidden
    >
      <img src={item.poster} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      {mount && (
        <video ref={video} muted loop playsInline preload="metadata" className={cn("absolute inset-0 h-full w-full object-cover", managedVideoClass)}>
          <source src={item.video} type="video/mp4" />
        </video>
      )}
    </div>
  );
}