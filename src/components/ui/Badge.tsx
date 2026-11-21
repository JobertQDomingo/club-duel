import type { ReactNode } from "react";

const tones = {
  warn: "bg-warn text-ink",
  live: "bg-live text-ink",
  plain: "bg-sheet text-ink border border-ink",
} as const;

/**
 * `warn` is the repeat-pair badge (defaults to the ⚠ copy from the PRD).
 * `mark` draws a fixed state cell: filled = done/submitted, hollow = not yet.
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
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 font-display text-sm font-bold uppercase leading-5 tracking-wide ${tones[tone]}`}
    >
      {tone === "warn" && <WarnIcon />}
      {mark && (
        <span
          aria-hidden
          className={`size-2.5 rounded-full border-2 border-ink ${mark === "filled" ? "bg-ink" : ""}`}
        />
      )}
      {children ?? (tone === "warn" ? "Already paired once" : null)}
    </span>
  );
}

function WarnIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round">
      <path d="M8 1.75 15 14.25H1L8 1.75Z" />
      <path d="M8 6.25v3.5M8 11.75v.25" strokeLinecap="round" />
    </svg>
  );
}
