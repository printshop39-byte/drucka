"use client";

import { useState } from "react";

interface Props {
  src: string;
  alt: string;
  emoji: string;
  className?: string;
  emojiClassName?: string;
}

// Renders a product mockup image; if it fails to load, shows the emoji fallback.
export default function MockImage({ src, alt, emoji, className, emojiClassName }: Props) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className={emojiClassName} role="img" aria-label={alt}>
        {emoji}
      </span>
    );
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
