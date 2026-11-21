"use client";

import { useState } from "react";
import { Badge } from "./Badge";

type Side = "A" | "B";

/**
 * One club's pair in a match. `names: null` is face-down: the card renders
 * masking tape only, so hidden players never reach the DOM. When names arrive
 * on a card that mounted face-down (after a live refresh), the tape peels off.
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
    <div
      className={`relative min-h-18 overflow-hidden px-3 py-2 ${side === "B" ? "text-right" : ""}`}
    >
      <p className={`font-display text-sm font-bold uppercase tracking-wide ${club}`}>
        Club {side} · Pair {slot}
      </p>
      {names ? (
        <>
          <p className="text-base leading-snug">
            {names[0]}
            <br />
            {names[1]}
          </p>
          {repeat && (
            <div className="mt-1">
              <Badge tone="warn" />
            </div>
          )}
          {mountedHidden && <Tape peel />}
        </>
      ) : (
        <>
          <span className="sr-only">Hidden until the match starts</span>
          <Tape />
        </>
      )}
    </div>
  );
}

function Tape({ peel = false }: { peel?: boolean }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-x-2 top-7 h-12 -rotate-1 bg-tape shadow-[0_2px_4px_rgb(22_24_29/0.18)] ${peel ? "animate-[peel_600ms_var(--ease-out-expo)_150ms_forwards]" : ""}`}
    />
  );
}
