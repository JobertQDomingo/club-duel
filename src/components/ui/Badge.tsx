import type { ReactNode } from "react";

const tones = {
  warn: "bg-warn-bg text-warn-ink",
  live: "bg-live-bg text-live-ink",
  plain: "bg-ink/[0.06] text-ink-soft",
} as const;

/**
 * `warn` is the repeat-pair badge (defaults to the ⚠ copy from the PRD); `live` carries a pulsing dot.
 * `mark` draws a state dot: filled = done/submitted, hollow = not yet.
 */
export function Badge({
  tone = "plain",
  mark,
  children,
}: {
  tone?: keyof typeof tones;
  mark?: "filled" | "hollow";
  children?: ReactNode;
}) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full wrap-break-word px-2.5 py-0.5 text-xs font-semibold leading-5 ${tones[tone]}`}
    >
      {tone === "warn" && <WarnIcon />}
      {tone === "live" && <LiveDot />}
      {mark && (
        <span
          aria-hidden
          className={`size-2 rounded-full border-[1.5px] border-current ${mark === "filled" ? "bg-current" : ""}`}
        />
      )}
      {children ?? (tone === "warn" ? "Already paired once" : null)}
    </span>
  );
}

export function LiveDot() {
  return (
    <span aria-hidden className="relative flex size-2">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-60" />
      <span className="relative size-2 rounded-full bg-live" />
    </span>
  );
}

function WarnIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-3.5 text-warn" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round">
      <path d="M8 1.75 15 14.25H1L8 1.75Z" />
      <path d="M8 6.25v3.5M8 11.75v.25" strokeLinecap="round" />
    </svg>
  );
}
