"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { leadLine } from "@/lib/domain";

type Club = { name: string; total: number };

/**
 * The scoreboard: crest, club and total per side (stacked rows in a narrow card,
 * a face-off once the card is 48rem wide, so long club names keep room), then the race bar whose split shows the lead. Totals
 * count up and the bars grow when a score lands.
 */
export function ScoreRace({ a, b, heading, status, ended = false }: { a: Club; b: Club; heading?: ReactNode; status?: string; ended?: boolean }) {
  const lead = leadLine(a, b, ended);
  const tone = (mine: number, theirs: number) => (mine < theirs ? "text-ink-soft" : "text-ink");
  const total = "text-[2.5rem] font-extrabold tabular-nums leading-none tracking-tight @3xl:text-[3.5rem]";
  const name = "min-w-0 font-semibold leading-tight wrap-anywhere hyphens-auto @3xl:text-lg @3xl:font-bold";
  const crest = "size-9 text-xs @3xl:size-12 @3xl:text-sm";

  return (
    <section className="@container rounded-2xl border border-line bg-card p-4 sm:p-6">
      {heading}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-3 [grid-template-areas:'ca_na_ta'_'cb_nb_tb'] @3xl:grid-cols-[auto_1fr_auto_auto_auto_1fr_auto] @3xl:gap-x-4 @3xl:[grid-template-areas:'ca_na_ta_d_tb_nb_cb']">
        <Crest name={a.name} className={`${crest} bg-club-a [grid-area:ca]`} />
        <p className={`${name} [grid-area:na]`}>{a.name}</p>
        <p className={`${total} ${tone(a.total, b.total)} text-right [grid-area:ta]`}>
          <Count value={a.total} />
        </p>
        <span aria-hidden className="hidden text-3xl font-light text-ink/25 [grid-area:d] @3xl:block">
          –
        </span>
        <p className={`${total} ${tone(b.total, a.total)} text-right [grid-area:tb] @3xl:text-left`}>
          <Count value={b.total} />
        </p>
        <p className={`${name} [grid-area:nb] @3xl:text-right`}>{b.name}</p>
        <Crest name={b.name} className={`${crest} bg-club-b [grid-area:cb]`} />
      </div>

      <div className="mt-4">
        <RaceBar a={a.total} b={b.total} label={`${lead}: ${a.name} ${a.total}, ${b.name} ${b.total}`} />
      </div>
      <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
        <p className="font-semibold" aria-live="polite">
          {lead}
        </p>
        {status && <p className="text-ink-soft">{status}</p>}
      </div>
    </section>
  );
}

/** The lead as a split bar with a centre tick. The split shows the lead, not the points share: 1.5% per point, capped, so a few points read. */
export function RaceBar({ a, b, label, className = "h-2.5" }: { a: number; b: number; label: string; className?: string }) {
  const shareA = 50 + Math.max(-40, Math.min(40, (a - b) * 1.5));
  return (
    <div className="relative" role="img" aria-label={label}>
      <div className={`flex overflow-hidden rounded-full bg-line ${className}`}>
        <div className="bg-club-a transition-[width] duration-700 ease-out-expo" style={{ width: `${shareA}%` }} />
        <div className="flex-1 bg-club-b" />
      </div>
      <div className="absolute -inset-y-1 left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-ink" />
    </div>
  );
}

/** Club monogram: first letters of the first two words ("Riverside PC" → RP). The caller sets size, text size and fill. */
export function Crest({ name, className }: { name: string; className: string }) {
  const words = name.trim().split(/\s+/);
  const initials = (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase();
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${className}`}
    >
      {initials}
    </span>
  );
}

/** Counts from the previous total to the new one (instantly under reduced motion). */
function Count({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const start = prev.current;
    prev.current = value;
    const ms = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 700;
    const t0 = performance.now();
    let raf = requestAnimationFrame(function tick(t) {
      const p = ms ? Math.min(1, (t - t0) / ms) : 1;
      setShown(p < 1 ? Math.round(start + (value - start) * (1 - 2 ** (-10 * p))) : value);
      if (p < 1) raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{shown}</>;
}
