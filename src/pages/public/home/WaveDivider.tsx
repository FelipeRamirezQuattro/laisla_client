type FillDividerProps = {
  variant?: "fill";
  color: string;
  className?: string;
};

type LineDividerProps = {
  variant: "line";
  color?: string;
  className?: string;
};

type WaveDividerProps = FillDividerProps | LineDividerProps;

/**
 * Hand-drawn "olitas" divider — used instead of a plain <hr> between blocks.
 * `variant="fill"` (default) is a soft wave-shaped color block, for transitioning
 * one full-bleed section into the next. `variant="line"` is a thin stroked wave,
 * for a lighter decorative break inside a section.
 */
export function WaveDivider(props: WaveDividerProps) {
  if (props.variant === "line") {
    return (
      <svg
        className={`li-wave-line ${props.className ?? ""}`}
        viewBox="0 0 320 24"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 16C20 6 40 22 60 16 80 10 100 22 120 16 140 10 160 22 180 16 200 10 220 22 240 16 260 10 280 22 300 16 310 13 320 16 320 16"
          fill="none"
          stroke={props.color ?? "var(--li-blue)"}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <div className={`li-wave-fill ${props.className ?? ""}`} aria-hidden="true">
      <svg viewBox="0 0 1440 100" preserveAspectRatio="none">
        <path
          d="M0 30C240 8 470 50 720 46 970 42 1210 10 1440 24V100H0Z"
          fill={props.color}
        />
      </svg>
    </div>
  );
}
