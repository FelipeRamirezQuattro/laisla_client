import { useEffect, useRef, useState } from "react";
import type { ImgHTMLAttributes } from "react";

type ProgressiveImageProps = {
  src: string;
  alt: string;
  className?: string;
  loading?: ImgHTMLAttributes<HTMLImageElement>["loading"];
};

export function ProgressiveImage({
  src,
  alt,
  className = "",
  loading = "lazy",
}: ProgressiveImageProps) {
  const [loaded, setLoaded] = useState(false);
  const revealFrame = useRef<number>();

  useEffect(() => {
    setLoaded(false);
    return () => {
      if (revealFrame.current) window.cancelAnimationFrame(revealFrame.current);
    };
  }, [src]);

  function revealImage() {
    if (revealFrame.current) window.cancelAnimationFrame(revealFrame.current);
    revealFrame.current = window.requestAnimationFrame(() => {
      revealFrame.current = window.requestAnimationFrame(() => setLoaded(true));
    });
  }

  return (
    <span
      className={`progressive-image ${loaded ? "is-loaded" : ""} ${className}`}
      aria-busy={!loaded}
    >
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        onLoad={revealImage}
      />
    </span>
  );
}
