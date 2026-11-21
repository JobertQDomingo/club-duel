"use client";

import { useState } from "react";
import { Badge } from "./Badge";

type Side = "A" | "B";

/**
 * One club's pair in a match. `names: null` is face-down: the card renders a
 * card back only, so hidden players never reach the DOM. When names arrive on a
 * card that mounted face-down (after a live refresh), the card flips over.
 */
export function PairCard({
  side,
  slot,
  names,
  repeat = false,
}: {
  side: Side;
  slot: number;
  names: [string, string] | null;
  repeat?: boolean;
}) {
  const [mountedHidden] = useState(names === null);
  const club = side === "A" ? "text-club-a" : "text-club-b";

  return (
    <div className={`relative min-h-18 min-w-0 px-4 py-2.5 perspective-[800px] sm:px-5 ${side === "B" ? "text-right" : ""}`}>
      {/* One line on phones: the club prefix is screen-reader only there; colour and side carry it. */}
      <p className={`text-xs font-semibold ${club}`}>
        <span className="max-sm:sr-only">Club {side} · </span>Pair {slot}
      </p>
      {names ? (
        <>
          <div className={mountedHidden ? "animate-[flip-in_320ms_var(--ease-out-expo)_240ms_both]" : ""}>
            <p className="mt-0.5 text-[0.9375rem] leading-snug wrap-break-word hyphens-auto">
              {names[0]}
              <br />
              {names[1]}
            </p>
            {repeat && (
              <div className="mt-1.5">
                <Badge tone="warn" />
              </div>
            )}
          </div>
          {mountedHidden && <CardBack side={side} className="absolute inset-x-4 top-8 animate-[flip-out_240ms_ease-in_forwards] sm:inset-x-5" />}
        </>
      ) : (
        <>
          <span className="sr-only">Hidden until the match starts</span>
          <CardBack side={side} className="mt-1" />
        </>
      )}
    </div>
  );
}

function CardBack({ side, className }: { side: Side; className: string }) {
  return (
    <div
      aria-hidden
      className={`card-back flex h-11 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold ${side === "A" ? "text-club-a" : "text-club-b"} ${className}`}
    >
      <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
        <rect x="3" y="7" width="10" height="7" rx="1.5" />
        <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
      </svg>
      Hidden
    </div>
  );
}
