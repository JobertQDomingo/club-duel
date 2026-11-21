/**
 * Signature move 1: the totals band. Each club owns a colour field; the race
 * strip's two marker bars split at the points share and grow when totals change.
 */
export function ScoreRace({
  a,
  b,
}: {
  a: { name: string; total: number };
  b: { name: string; total: number };
}) {
  // The split shows the lead, not the points share: 1.5% per point, capped, so a few points read.
  const shareA = 50 + Math.max(-40, Math.min(40, (a.total - b.total) * 1.5));
  const gap = Math.abs(a.total - b.total);
  const lead =
    gap === 0 ? "Tied" : `${a.total > b.total ? a.name : b.name} lead by ${gap}`;

  return (
    <div>
      <div className="grid grid-cols-2 text-sheet">
        <Field club={a.name} total={a.total} className="bg-club-a" />
        <Field club={b.name} total={b.total} className="bg-club-b text-right" />
      </div>
      <div
        className="relative mt-2 h-3.5 bg-sheet"
        role="img"
        aria-label={`${lead}: ${a.name} ${a.total}, ${b.name} ${b.total}`}
      >
        <div
          className="absolute inset-y-0 left-0 bg-club-a transition-[width] duration-700 ease-out-expo"
          style={{ width: `${shareA}%` }}
        />
        <div
          className="absolute inset-y-0 right-0 bg-club-b transition-[width] duration-700 ease-out-expo"
          style={{ width: `${100 - shareA}%` }}
        />
        <div className="absolute inset-y-[-3px] left-1/2 w-0.5 -translate-x-1/2 bg-ink" />
      </div>
      <p className="mt-1.5 font-display text-base font-bold uppercase" aria-live="polite">
        {lead}
      </p>
    </div>
  );
}

function Field({ club, total, className }: { club: string; total: number; className: string }) {
  return (
    <div className={`min-w-0 px-4 pt-2.5 pb-3 ${className}`}>
      <p className="truncate font-display text-sm font-bold uppercase tracking-wide">{club}</p>
      <p className="font-display text-7xl font-extrabold leading-[0.9] sm:text-8xl">{total}</p>
    </div>
  );
}
