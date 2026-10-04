import { ReactNode, useEffect, useState } from 'react';

interface EventImageProps {
  src?: string;
  alt: string;
  fallback: ReactNode;
}

export function EventImage({ src, alt, fallback }: EventImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  if (!src || failed) return <>{fallback}</>;

  return <img src={src} alt={alt} onError={() => setFailed(true)} />;
}
