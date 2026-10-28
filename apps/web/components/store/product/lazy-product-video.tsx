"use client";

import { useEffect, useRef, useState } from "react";

const PRELOAD_MARGIN = "300px";

interface LazyProductVideoProps {
  url: string;
  posterUrl: string | null;
  title: string;
}

export function LazyProductVideo({ url, posterUrl, title }: LazyProductVideoProps): React.ReactNode {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [nearViewport, setNearViewport] = useState(false);

  useEffect(() => {
    const element = videoRef.current;
    if (!element || nearViewport) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setNearViewport(true);
        observer.disconnect();
      },
      { rootMargin: PRELOAD_MARGIN }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [nearViewport]);

  return (
    <video
      ref={videoRef}
      controls
      preload="metadata"
      playsInline
      poster={posterUrl ?? undefined}
      src={nearViewport ? url : undefined}
      aria-label={title}
      className="h-full w-full object-contain"
    >
      Tu navegador no puede reproducir este video.{" "}
      <a href={url} className="underline">
        Descárgalo aquí
      </a>
      .
    </video>
  );
}
