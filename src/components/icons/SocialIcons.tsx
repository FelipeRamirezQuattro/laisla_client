type IconProps = {
  size?: number;
  className?: string;
};

/** Line-style Instagram mark — matches the site's 2px stroke, no-fill icon rule. */
export function InstagramIcon({ size = 20, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.3" />
      <circle cx="17.6" cy="6.4" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Simplified single-tone TikTok note mark — the brand glyph doesn't read cleanly as an outline. */
export function TikTokIcon({ size = 20, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M16.5 2h-3.2v13.6a2.9 2.9 0 1 1-2.3-2.84V9.5a6.1 6.1 0 1 0 5.5 6.06V9.1a7.9 7.9 0 0 0 4.5 1.4V7.3a4.7 4.7 0 0 1-4.5-4.6V2z" />
    </svg>
  );
}
