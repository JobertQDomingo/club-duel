import { Button } from '@/components/ui/Button'
import { ranking, type PlayerStat } from '@/lib/domain'
import type { TournamentView } from '@/lib/types'

export const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0') // U+2212: a hyphen reads as a dash
const label = 'text-xs font-semibold text-ink-soft'

/** Live player ranking table (players with at least one finished match). Tap a name for how the numbers add up. */
export function Ranking({ view }: { view: TournamentView }) {
  const rows = ranking(view)
  if (rows.length === 0) return <p className="text-ink-soft">No matches finished.</p>
  const clubName = new Map(view.clubs.map((c) => [c.id, c.name]))
  const dot = new Map(view.clubs.map((c) => [c.id, c.side === 'A' ? 'bg-club-a' : 'bg-club-b']))
  return (
    <>
      <table className="w-full text-left tabular-nums">
        <thead className={label}>
          <tr className="border-b border-line">
            <th className="py-2 pr-2 font-semibold">#</th>
            <th className="py-2 pr-2 font-semibold">Player</th>
            <th className="whitespace-nowrap py-2 pr-2 text-right font-semibold">W–L</th>
            <th className="py-2 pr-2 text-right font-semibold">Diff</th>
            <th className="py-2 text-right font-semibold">PF</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((s, i) => (
            <tr key={s.player.id}>
              <td className="py-1.5 pr-2 text-sm font-semibold text-ink-soft">{i + 1}</td>
              <td className="w-full max-w-0 pr-2">
                {/* native popover: tap or click opens it, tap outside or Esc closes it, no client JS */}
                <button type="button" popoverTarget={`stats-${s.player.id}`} className="group min-h-11 w-full py-1 text-left">
                  <span className="font-semibold underline decoration-ink/30 decoration-dotted underline-offset-4 wrap-anywhere group-hover:decoration-ink">{s.player.name}</span>
                  <span className="flex items-center gap-1.5 text-sm text-ink-soft">
                    <span aria-hidden className={`size-2 flex-none rounded-full ${dot.get(s.player.club_id)}`} />
                    <span className="truncate">{clubName.get(s.player.club_id)}</span>
                  </span>
                </button>
                <StatSheet id={`stats-${s.player.id}`} s={s} club={clubName.get(s.player.club_id)} />
              </td>
              <td className="whitespace-nowrap py-1.5 pr-2 text-right">{s.wins}–{s.losses}</td>
              <td className="whitespace-nowrap py-1.5 pr-2 text-right">{signed(s.diff)}</td>
              <td className="py-1.5 text-right font-semibold">{s.pf}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-sm text-ink-soft">Tap a name to see the games behind the numbers.</p>
    </>
  )
}

/** One player's games, then the sums behind W–L, PF, PA and Diff. */
function StatSheet({ id, s, club }: { id: string; s: PlayerStat; club?: string }) {
  const sum = (xs: number[]) => (xs.length > 1 ? `${xs.join(' + ')} = ` : '')
  return (
    <div
      id={id}
      popover="auto"
      className="m-auto max-h-[calc(100dvh-2rem)] tabular-nums w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl bg-card p-5 text-ink shadow-[0_12px_40px_rgb(17_24_39/0.22)] backdrop:bg-ink/40"
    >
      <div className="flex flex-col gap-3">
        <h3 className="border-b border-line pb-3 text-xl font-bold leading-tight tracking-tight wrap-anywhere">
          {s.player.name}
          {club && <span className="block text-sm font-medium tracking-normal text-ink-soft">{club}</span>}
        </h3>

        <ol className="divide-y divide-line border-b border-line">
          {s.games.map((g) => (
            <li key={`${g.round}:${g.slot}`} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 py-2">
              <span className={label}>Round {g.round} · Match {g.slot}</span>
              <span className="row-span-2 self-center text-right">
                <span className="block whitespace-nowrap text-lg font-bold">
                  {g.pf > g.pa ? 'W' : 'L'} {g.pf}–{g.pa}
                </span>
                <span className="block text-sm text-ink-soft">{signed(g.pf - g.pa)}</span>
              </span>
              <span className="text-sm wrap-anywhere">
                with {g.partner?.name ?? '?'} vs {g.opponents.map((p) => p.name).join(' & ')}
              </span>
            </li>
          ))}
        </ol>

        <dl className="grid grid-cols-[auto_1fr_auto] items-baseline gap-x-3 gap-y-2">
          <dt className={label}>W–L</dt>
          <dd className="text-sm text-ink-soft">{s.wins} won, {s.losses} lost</dd>
          <dd className="text-right text-lg font-bold">{s.wins}–{s.losses}</dd>
          <dt className={label}>PF</dt>
          <dd className="text-sm text-ink-soft">Points won: {sum(s.games.map((g) => g.pf))}</dd>
          <dd className="text-right text-lg font-bold">{s.pf}</dd>
          <dt className={label}>PA</dt>
          <dd className="text-sm text-ink-soft">Points lost: {sum(s.games.map((g) => g.pa))}</dd>
          <dd className="text-right text-lg font-bold">{s.pa}</dd>
          <dt className={label}>Diff</dt>
          <dd className="text-sm text-ink-soft">PF − PA = {s.pf} − {s.pa} =</dd>
          <dd className="text-right text-lg font-bold">{signed(s.diff)}</dd>
        </dl>

        <Button variant="secondary" popoverTarget={id} popoverTargetAction="hide" className="self-start">
          Close
        </Button>
      </div>
    </div>
  )
}
