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

/** Single-tone WhatsApp glyph — filled, matches the brand's widely-recognized mark. */
export function WhatsAppIcon({ size = 20, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.47 14.38c-.29-.15-1.7-.84-1.97-.93-.26-.1-.46-.15-.65.15-.2.29-.75.93-.92 1.12-.17.2-.34.22-.63.08-.29-.15-1.22-.45-2.32-1.43-.86-.76-1.44-1.71-1.6-2-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.51-.08-.15-.65-1.57-.9-2.15-.24-.57-.48-.49-.65-.5h-.56c-.2 0-.51.07-.78.37s-1.03 1.01-1.03 2.46 1.06 2.85 1.2 3.05c.15.2 2.08 3.18 5.05 4.46.7.3 1.25.48 1.68.62.7.22 1.34.19 1.85.12.56-.09 1.7-.7 1.94-1.37.24-.68.24-1.26.17-1.38-.07-.12-.26-.2-.55-.34z" />
      <path d="M12.02 2C6.5 2 2 6.48 2 12c0 1.86.5 3.6 1.38 5.1L2 22l5.02-1.32A9.96 9.96 0 0 0 12.02 22C17.53 22 22 17.52 22 12S17.53 2 12.02 2Zm0 18.18c-1.68 0-3.24-.48-4.56-1.32l-.33-.2-3 .79.8-2.93-.21-.3A8.15 8.15 0 0 1 3.84 12c0-4.51 3.67-8.18 8.18-8.18S20.2 7.49 20.2 12s-3.67 8.18-8.18 8.18Z" />
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
