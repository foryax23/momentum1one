import heroMp4 from "@/assets/hero/momentum-campus-loop-v2.mp4.asset.json";
import heroWebm from "@/assets/hero/momentum-campus-loop-v2.webm.asset.json";
// The poster is the largest thing painted on first load, so it ships as a small local file rather than the 0.9 MB original.
import heroPoster from "@/assets/hero/momentum-campus-poster.webp";
import { managedVideoClass, useManagedVideo } from "@/hooks/use-managed-video";
import { cn } from "@/lib/utils";

export function HeroVideo() {
  const { frame, video, mount } = useManagedVideo();

  return (
    <div ref={frame} className="absolute inset-0 overflow-hidden bg-primary" aria-hidden>
      <img src={heroPoster} alt="" width={1280} height={720} fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
      {mount && (
        <video ref={video} muted loop playsInline preload="none" className={cn("absolute inset-0 h-full w-full object-cover", managedVideoClass)}>
          {/* MP4 first: Chromium reads this WebM's header and then fails to decode it, so listing it first cost every Chrome visitor a wasted download before the MP4 started.
              It stays as the fallback the hook tries if the MP4 fails; put it back in front once it is re-encoded (8-bit 4:2:0, limited range) and plays in desktop and Android Chrome. */}
          <source src={heroMp4.url} type="video/mp4" />
          <source src={heroWebm.url} type='video/webm; codecs="vp9"' />
        </video>
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/88 to-primary/55" />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-primary/25" />
      {/* ends in solid navy so the hero runs into the next navy section without a seam */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-primary to-transparent" />
    </div>
  );
}
