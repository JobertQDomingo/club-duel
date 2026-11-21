import { ranking } from '@/lib/domain'
import type { TournamentView } from '@/lib/types'

/** Live player ranking table (players with at least one finished match). */
export function Ranking({ view }: { view: TournamentView }) {
  const rows = ranking(view)
  if (rows.length === 0) return <p className="text-ink-soft">No matches finished.</p>
  const clubName = new Map(view.clubs.map((c) => [c.id, c.name]))
  return (
    <table className="w-full text-left">
      <thead className="font-display text-sm font-bold uppercase tracking-wide">
        <tr className="border-b border-ink">
          <th className="py-1 pr-2">#</th>
          <th className="py-1 pr-2">Player</th>
          <th className="py-1 pr-2 text-right">W–L</th>
          <th className="py-1 pr-2 text-right">Diff</th>
          <th className="py-1 text-right">PF</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-ink/20">
        {rows.map((s, i) => (
          <tr key={s.player.id}>
            <td className="py-1.5 pr-2">{i + 1}</td>
            <td className="py-1.5 pr-2">
              {s.player.name} <span className="text-sm text-ink-soft">{clubName.get(s.player.club_id)}</span>
            </td>
            <td className="py-1.5 pr-2 text-right">{s.wins}–{s.losses}</td>
            <td className="py-1.5 pr-2 text-right">{s.diff > 0 ? `+${s.diff}` : s.diff}</td>
            <td className="py-1.5 text-right">{s.pf}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
