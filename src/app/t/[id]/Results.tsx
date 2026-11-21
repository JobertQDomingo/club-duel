import type { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'
import { awards, clubTotals, pairNames, tabulation, type PlayerStat } from '@/lib/domain'
import type { Match, TournamentView } from '@/lib/types'

type Club = TournamentView['clubs'][number]
type Done = Match & { score_a: number; score_b: number }

/** After the end: winner banner (or Draw), per-round tabulation with running totals, awards. */
export function Results({ view, a, b }: { view: TournamentView; a: Club; b: Club }) {
  const totals = clubTotals(view)
  const winner = totals.A === totals.B ? null : totals.A > totals.B ? a : b
  const rounds = tabulation(view)
  const aw = awards(view)
  const roundNo = new Map(view.rounds.map((r) => [r.id, r.number]))
  const pair = (club: Club, m: Match) => pairNames(view, club.id, m.round_id, m.slot)?.join(' & ')
  const each = (n: number) => (n > 1 ? ' each' : '')
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 'es'}`
  const mvp = aw.mvp[0]
  const margin = (ms: Done[]) => (ms[0] ? Math.abs(ms[0].score_a - ms[0].score_b) : 0)

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
                      <span className="min-w-0 text-club-a wrap-break-word hyphens-auto">{pair(a, m)}</span>
                      <span className="flex flex-col items-center px-2 text-center">
                        <span className="font-display text-sm font-bold uppercase tracking-wide">Match {m.slot}</span>
                        <span className="font-display text-xl font-extrabold">{m.score_a}–{m.score_b}</span>
                      </span>
                      <span className="min-w-0 text-right text-club-b wrap-break-word hyphens-auto">{pair(b, m)}</span>
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

      <Card title="Awards" action={<span className="text-right text-ink-soft">{view.tournament.name}</span>}>
        {!mvp ? (
          <p className="text-ink-soft">No matches finished.</p>
        ) : (
          <div className="flex flex-col divide-y divide-ink/20">
            <Award title="MVP" rule="Most wins, then point difference" value={`${mvp.wins}–${mvp.losses}, ${mvp.diff > 0 ? '+' : ''}${mvp.diff}`}>
              <Winners stats={aw.mvp} clubs={[a, b]} />
            </Award>
            {([a, b] as const).map((c) => {
              const top = aw.topScorer[c.side]
              return (
                <Award key={c.id} title={`Top scorer · ${c.name}`} rule="Most points won" value={top[0] && `${top[0].pf} points${each(top.length)}`}>
                  <Winners stats={top} clubs={[c]} />
                </Award>
              )
            })}
            <Award title="Iron player" rule="Most matches played" value={`${plural(aw.iron[0].played, 'match')}${each(aw.iron.length)}`}>
              <Winners stats={aw.iron} clubs={[a, b]} />
            </Award>
            <Award title="Biggest win" rule="Largest winning margin" value={`${margin(aw.biggestWin)} points`}>
              <MatchRows matches={aw.biggestWin} a={a} b={b} pair={pair} round={roundNo} />
            </Award>
            <Award title="Closest match" rule="Smallest winning margin" value={`${margin(aw.closest)} points`}>
              <MatchRows matches={aw.closest} a={a} b={b} pair={pair} round={roundNo} />
            </Award>
          </div>
        )}
      </Card>
    </>
  )
}

const field = (c: Club) => (c.side === 'A' ? 'bg-club-a' : 'bg-club-b')

function Award({ title, rule, value, children }: { title: string; rule: string; value?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 py-4 first:pt-1 last:pb-0">
      <h3 className="font-display text-xl font-bold uppercase leading-tight">{title}</h3>
      <p className="text-ink-soft">
        {rule}
        {value && <> · <span className="font-semibold whitespace-nowrap text-ink">{value}</span></>}
      </p>
      {children}
    </section>
  )
}

/** Winners on their club's marker field, one field per club; the name is the thing people screenshot. */
function Winners({ stats, clubs }: { stats: PlayerStat[]; clubs: Club[] }) {
  return clubs.map((c) => {
    const names = stats.filter((s) => s.player.club_id === c.id)
    if (!names.length) return null
    const size = names.length === 1 ? 'text-3xl' : names.length <= 4 ? 'text-2xl' : 'text-lg @3xs:grid-cols-2'
    return (
      <div key={c.id} className={`@container px-4 py-3 text-sheet ${field(c)}`}>
        <ul className={`grid grid-cols-1 gap-x-4 gap-y-1 font-semibold leading-tight ${size}`}>
          {names.map((s) => (
            <li key={s.player.id} className="wrap-break-word hyphens-auto">{s.player.name}</li>
          ))}
        </ul>
        <p className="mt-2 font-display text-sm font-bold uppercase tracking-wide">{c.name}</p>
      </div>
    )
  })
}

/** Ruled match rows; the winning pair's cell takes its club's field. */
function MatchRows({ matches, a, b, pair, round }: {
  matches: Done[]
  a: Club
  b: Club
  pair: (club: Club, m: Match) => string | undefined
  round: Map<string, number>
}) {
  const cell = (c: Club, won: boolean) =>
    `flex min-w-0 items-center px-2 py-2 wrap-break-word hyphens-auto ${c.side === 'B' ? 'justify-end text-right' : ''} ${
      won ? `${field(c)} font-semibold text-sheet` : c.side === 'A' ? 'text-club-a' : 'text-club-b'
    }`
  return (
    <ol className="flex flex-col gap-3">
      {matches.map((m) => (
        <li key={m.id} className="flex flex-col gap-1">
          <span className="font-display text-sm font-bold uppercase tracking-wide">Round {round.get(m.round_id)} · Match {m.slot}</span>
          <div className="grid grid-cols-[1fr_auto_1fr] border-y border-ink">
            <span className={cell(a, m.score_a > m.score_b)}>{pair(a, m)}</span>
            <span className="flex items-center px-3 font-display text-3xl font-extrabold whitespace-nowrap">{m.score_a}–{m.score_b}</span>
            <span className={cell(b, m.score_b > m.score_a)}>{pair(b, m)}</span>
          </div>
        </li>
      ))}
    </ol>
  )
}
