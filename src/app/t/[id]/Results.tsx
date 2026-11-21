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
      <section className={`rounded-2xl px-5 py-6 text-white ${winner ? (winner.side === 'A' ? 'bg-club-a' : 'bg-club-b') : 'bg-ink'}`}>
        <h2 className="text-3xl font-extrabold leading-tight tracking-tight wrap-break-word">{winner ? `${winner.name} win` : 'Draw'}</h2>
        <p className="mt-1 text-base font-semibold tabular-nums">
          Final · {a.name} {totals.A} – {totals.B} {b.name}
        </p>
      </section>

      <Card title="Tabulation">
        {rounds.length === 0 ? (
          <p className="text-ink-soft">No matches finished.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {rounds.map((r) => (
              <section key={r.round.id} className="flex flex-col gap-2">
                <h3 className="font-bold">Round {r.round.number}</h3>
                <ol className="-mx-4 divide-y divide-line border-y border-line sm:-mx-5">
                  {r.matches.map((m) => (
                    <li key={m.id} className="grid grid-cols-[1fr_auto_1fr] gap-2 px-4 sm:px-5 py-2.5 text-sm">
                      <span className="min-w-0 text-club-a wrap-break-word hyphens-auto">{pair(a, m)}</span>
                      <span className="flex flex-col items-center px-2 text-center">
                        <span className="text-xs font-semibold text-ink-soft">Match {m.slot}</span>
                        <span className={`whitespace-nowrap text-xl font-extrabold tabular-nums tracking-tight ${m.score_a > m.score_b ? 'text-club-a' : 'text-club-b'}`}>{m.score_a}–{m.score_b}</span>
                      </span>
                      <span className="min-w-0 text-right text-club-b wrap-break-word hyphens-auto">{pair(b, m)}</span>
                    </li>
                  ))}
                </ol>
                <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 text-sm font-semibold tabular-nums">
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

      <Card title="Awards" action={<span className="text-right text-sm text-ink-soft">{view.tournament.name}</span>}>
        {!mvp ? (
          <p className="text-ink-soft">No matches finished.</p>
        ) : (
          <div className="flex flex-col divide-y divide-line">
            <Award title="MVP" rule="Most wins, then point difference" value={`${mvp.wins}–${mvp.losses}, ${mvp.diff > 0 ? '+' : mvp.diff < 0 ? '−' : ''}${Math.abs(mvp.diff)}`}>
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
      <h3 className="text-lg font-bold leading-tight tracking-tight wrap-anywhere">{title}</h3>
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
      <div key={c.id} className={`@container rounded-xl px-4 py-3 text-white ${field(c)}`}>
        <ul className={`grid grid-cols-1 gap-x-4 gap-y-1 font-semibold leading-tight ${size}`}>
          {names.map((s) => (
            <li key={s.player.id} className="wrap-break-word hyphens-auto">{s.player.name}</li>
          ))}
        </ul>
        <p className="mt-2 text-sm font-medium">{c.name}</p>
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
      won ? `${field(c)} font-semibold text-white` : c.side === 'A' ? 'text-club-a' : 'text-club-b'
    }`
  return (
    <ol className="flex flex-col gap-3">
      {matches.map((m) => (
        <li key={m.id} className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink-soft">Round {round.get(m.round_id)} · Match {m.slot}</span>
          <div className="grid grid-cols-[1fr_auto_1fr] border-y border-line text-sm">
            <span className={cell(a, m.score_a > m.score_b)}>{pair(a, m)}</span>
            <span className="flex items-center px-3 text-3xl font-extrabold tabular-nums tracking-tight whitespace-nowrap">{m.score_a}–{m.score_b}</span>
            <span className={cell(b, m.score_b > m.score_a)}>{pair(b, m)}</span>
          </div>
        </li>
      ))}
    </ol>
  )
}
