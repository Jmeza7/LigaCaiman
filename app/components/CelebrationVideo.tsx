"use client";
import { useEffect, useRef } from "react";

/**
 * Plays the celebration clip once (muted, inline) and freezes on the last frame.
 * Driven by JS play() so it works where native autoplay is throttled/blocked.
 * The poster (first frame) shows until playback starts.
 */
export function CelebrationVideo({
  src,
  poster,
  className = "",
  loop = false,
}: {
  src: string;
  poster: string;
  className?: string;
  loop?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const tryPlay = () => {
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && tryPlay()),
      { threshold: 0.2 }
    );
    io.observe(v);
    // also retry on first user interaction in case autoplay was blocked
    const onFirst = () => {
      tryPlay();
      window.removeEventListener("pointerdown", onFirst);
    };
    window.addEventListener("pointerdown", onFirst);
    tryPlay();
    return () => {
      io.disconnect();
      window.removeEventListener("pointerdown", onFirst);
    };
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop={loop}
      playsInline
      preload="auto"
      className={className}
    />
  );
}
