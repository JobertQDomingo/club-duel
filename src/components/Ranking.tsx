import { Button } from '@/components/ui/Button'
import { ranking, type PlayerStat } from '@/lib/domain'
import type { TournamentView } from '@/lib/types'

const signed = (n: number) => (n > 0 ? `+${n}` : String(n))
const label = 'font-display text-sm font-bold uppercase tracking-wide'

/** Live player ranking table (players with at least one finished match). Tap a name for how the numbers add up. */
export function Ranking({ view }: { view: TournamentView }) {
  const rows = ranking(view)
  if (rows.length === 0) return <p className="text-ink-soft">No matches finished.</p>
  const clubName = new Map(view.clubs.map((c) => [c.id, c.name]))
  return (
    <>
      <table className="w-full text-left">
        <thead className={label}>
          <tr className="border-b border-ink">
            <th className="py-1 pr-2">#</th>
            <th className="py-1 pr-2">Player</th>
            <th className="whitespace-nowrap py-1 pr-2 text-right">W–L</th>
            <th className="py-1 pr-2 text-right">Diff</th>
            <th className="py-1 text-right">PF</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/20">
          {rows.map((s, i) => (
            <tr key={s.player.id}>
              <td className="py-1.5 pr-2">{i + 1}</td>
              <td className="pr-2">
                {/* native popover: tap or click opens it, tap outside or Esc closes it, no client JS */}
                <button type="button" popoverTarget={`stats-${s.player.id}`} className="min-h-11 w-full py-1 text-left hover:text-ink-soft">
                  <span className="underline decoration-ink/40 decoration-dotted underline-offset-4">{s.player.name}</span>{' '}
                  <span className="text-sm text-ink-soft">{clubName.get(s.player.club_id)}</span>
                </button>
                <StatSheet id={`stats-${s.player.id}`} s={s} club={clubName.get(s.player.club_id)} />
              </td>
              <td className="whitespace-nowrap py-1.5 pr-2 text-right">{s.wins}–{s.losses}</td>
              <td className="whitespace-nowrap py-1.5 pr-2 text-right">{signed(s.diff)}</td>
              <td className="py-1.5 text-right">{s.pf}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-sm text-ink-soft">Tap a name to see the games behind the numbers.</p>
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
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto border border-ink bg-sheet p-4 text-ink backdrop:bg-ink/40"
    >
      <div className="flex flex-col gap-3">
        <h3 className="border-b border-ink pb-2 font-display text-xl font-bold uppercase leading-tight">
          {s.player.name}
          {club && <span className="block text-sm tracking-wide text-ink-soft">{club}</span>}
        </h3>

        <ol className="divide-y divide-ink/20 border-b border-ink/20">
          {s.games.map((g) => (
            <li key={`${g.round}:${g.slot}`} className="grid grid-cols-[1fr_auto] gap-x-3 py-2">
              <span className={label}>Round {g.round} · Match {g.slot}</span>
              <span className="row-span-2 self-center text-right">
                <span className="block whitespace-nowrap font-display text-lg font-bold">
                  {g.pf > g.pa ? 'W' : 'L'} {g.pf}–{g.pa}
                </span>
                <span className="block text-sm text-ink-soft">{signed(g.pf - g.pa)}</span>
              </span>
              <span className="text-sm wrap-break-word">
                with {g.partner?.name ?? '?'} vs {g.opponents.map((p) => p.name).join(' & ')}
              </span>
            </li>
          ))}
        </ol>

        <dl className="grid grid-cols-[auto_1fr_auto] items-baseline gap-x-3 gap-y-2">
          <dt className={label}>W–L</dt>
          <dd className="text-sm text-ink-soft">{s.wins} won, {s.losses} lost</dd>
          <dd className="text-right font-display text-lg font-bold">{s.wins}–{s.losses}</dd>
          <dt className={label}>PF</dt>
          <dd className="text-sm text-ink-soft">Points won: {sum(s.games.map((g) => g.pf))}</dd>
          <dd className="text-right font-display text-lg font-bold">{s.pf}</dd>
          <dt className={label}>PA</dt>
          <dd className="text-sm text-ink-soft">Points lost: {sum(s.games.map((g) => g.pa))}</dd>
          <dd className="text-right font-display text-lg font-bold">{s.pa}</dd>
          <dt className={label}>Diff</dt>
          <dd className="text-sm text-ink-soft">PF − PA = {s.pf} − {s.pa} =</dd>
          <dd className="text-right font-display text-lg font-bold">{signed(s.diff)}</dd>
        </dl>

        <Button variant="secondary" popoverTarget={id} popoverTargetAction="hide" className="self-start">
          Close
        </Button>
      </div>
    </div>
  )
}
