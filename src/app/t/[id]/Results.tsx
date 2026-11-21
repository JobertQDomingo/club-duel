import { Card } from '@/components/ui/Card'
import { awards, clubTotals, pairNames, tabulation, type PlayerStat } from '@/lib/domain'
import type { Match, TournamentView } from '@/lib/types'

type Club = TournamentView['clubs'][number]

/** After the end: winner banner (or Draw), per-round tabulation with running totals, awards. */
export function Results({ view, a, b }: { view: TournamentView; a: Club; b: Club }) {
  const totals = clubTotals(view)
  const winner = totals.A === totals.B ? null : totals.A > totals.B ? a : b
  const rounds = tabulation(view)
  const aw = awards(view)
  const roundNo = new Map(view.rounds.map((r) => [r.id, r.number]))
  const pair = (club: Club, m: Match) => pairNames(view, club.id, m.round_id, m.slot)?.join(' & ')
  const players = (xs: PlayerStat[], stat: (s: PlayerStat) => string) =>
    xs.length ? xs.map((s) => `${s.player.name} (${stat(s)})`).join(', ') : '—'
  const matchLine = (ms: Match[]) =>
    ms.length
      ? ms.map((m) => `Round ${roundNo.get(m.round_id)} · Match ${m.slot}: ${pair(a, m)} ${m.score_a}–${m.score_b} ${pair(b, m)}`)
      : ['—']
  const awardRows: [string, string[]][] = [
    ['MVP', [players(aw.mvp, (s) => `${s.wins} W, ${s.diff > 0 ? '+' : ''}${s.diff}`)]],
    [`Top scorer · ${a.name}`, [players(aw.topScorer.A, (s) => `${s.pf} pts`)]],
    [`Top scorer · ${b.name}`, [players(aw.topScorer.B, (s) => `${s.pf} pts`)]],
    ['Iron player', [players(aw.iron, (s) => `${s.played} played`)]],
    ['Biggest win', matchLine(aw.biggestWin)],
    ['Closest match', matchLine(aw.closest)],
  ]

  return (
    <>
      <section className={`px-4 py-5 text-sheet ${winner ? (winner.side === 'A' ? 'bg-club-a' : 'bg-club-b') : 'bg-ink'}`}>
        <p className="font-display text-sm font-bold uppercase tracking-wide">Final result</p>
        <p className="font-display text-4xl font-extrabold uppercase leading-tight">{winner ? `${winner.name} win` : 'Draw'}</p>
        <p className="font-display text-lg font-bold uppercase">
          {a.name} {totals.A} – {totals.B} {b.name}
        </p>
      </section>

      <Card title="Tabulation">
        {rounds.length === 0 ? (
          <p className="text-ink-soft">No matches finished.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {rounds.map((r) => (
              <section key={r.round.id} className="flex flex-col gap-2">
                <h3 className="font-display text-xl font-bold uppercase">Round {r.round.number}</h3>
                <ol className="divide-y divide-ink/20 border-y border-ink/20">
                  {r.matches.map((m) => (
                    <li key={m.id} className="grid grid-cols-[1fr_auto_1fr] gap-2 py-2">
                      <span className="min-w-0 text-club-a">{pair(a, m)}</span>
                      <span className="flex flex-col items-center px-2 text-center">
                        <span className="font-display text-sm font-bold uppercase tracking-wide">Match {m.slot}</span>
                        <span className="font-display text-xl font-extrabold">{m.score_a}–{m.score_b}</span>
                      </span>
                      <span className="min-w-0 text-right text-club-b">{pair(b, m)}</span>
                    </li>
                  ))}
                </ol>
                <dl className="grid grid-cols-[1fr_auto] gap-x-4 font-display font-bold uppercase">
                  <dt>Round {r.round.number}</dt>
                  <dd className="text-right">{r.A}–{r.B}</dd>
                  <dt>Running total</dt>
                  <dd className="text-right">{r.totalA}–{r.totalB}</dd>
                </dl>
              </section>
            ))}
          </div>
        )}
      </Card>

      <Card title="Awards">
        <dl className="divide-y divide-ink/20 border-y border-ink/20">
          {awardRows.map(([label, lines]) => (
            <div key={label} className="flex flex-col gap-0.5 py-2">
              <dt className="font-display text-sm font-bold uppercase tracking-wide">{label}</dt>
              {lines.map((l) => <dd key={l}>{l}</dd>)}
            </div>
          ))}
        </dl>
      </Card>
    </>
  )
}
