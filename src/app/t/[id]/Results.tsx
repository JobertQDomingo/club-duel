import type { ReactNode } from 'react'
import { signed } from '@/components/Ranking'
import { Card } from '@/components/ui/Card'
import { Crest, RaceBar } from '@/components/ui/ScoreRace'
import { awards, clubTotals, pairNames, tabulation, type PlayerStat } from '@/lib/domain'
import type { Match, TournamentView } from '@/lib/types'

type Club = TournamentView['clubs'][number]
type Done = Match & { score_a: number; score_b: number }

/** After the end: winner card (or Draw) with the lead after each round, per-round tabulation with running totals, awards. */
export function Results({ view, a, b }: { view: TournamentView; a: Club; b: Club }) {
  const totals = clubTotals(view)
  const winner = totals.A === totals.B ? null : totals.A > totals.B ? a : b
  const rounds = tabulation(view)
  const aw = awards(view)
  const roundNo = new Map(view.rounds.map((r) => [r.id, r.number]))
  const pair = (club: Club, m: Match) => pairNames(view, club.id, m.round_id, m.slot)?.join(' & ')
  const each = (n: number) => (n > 1 ? ' each' : '')
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : word.endsWith('ch') ? 'es' : 's'}`
  const mvp = aw.mvp[0]
  const margin = (ms: Done[]) => (ms[0] ? Math.abs(ms[0].score_a - ms[0].score_b) : 0)

  return (
    <>
      {/* The scoreboard above already shows the totals; this card adds the verdict and how the lead moved. */}
      <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
        <div className="flex items-center gap-3">
          {winner ? (
            <span className={`flex size-12 shrink-0 items-center justify-center rounded-full text-white ${field(winner)}`}>
              <Trophy className="size-6" />
            </span>
          ) : (
            <span className="flex shrink-0">
              <Crest name={a.name} className="size-12 bg-club-a text-sm ring-2 ring-card" />
              <Crest name={b.name} className="-ml-3 size-12 bg-club-b text-sm ring-2 ring-card" />
            </span>
          )}
          <div className="min-w-0">
            <h2 className={`text-2xl font-extrabold leading-tight tracking-tight wrap-break-word hyphens-auto ${winner ? ink(winner) : ''}`}>
              {winner ? `${winner.name} win` : 'Draw'}
            </h2>
            <p className="text-sm font-semibold text-ink-soft">
              {rounds.length === 0
                ? 'No matches finished'
                : winner
                  ? `by ${plural(Math.abs(totals.A - totals.B), 'point')} over ${plural(rounds.length, 'round')}`
                  : `Level after ${plural(rounds.length, 'round')}`}
            </p>
          </div>
        </div>
        {rounds.length > 0 && (
          <>
            <h3 className="mt-5 text-sm font-bold">Lead after each round</h3>
            <ol className="mt-3 flex flex-col gap-3">
              {rounds.map((r, i) => {
                const gap = r.totalA - r.totalB
                const leader = gap > 0 ? a : gap < 0 ? b : null
                const last = i === rounds.length - 1
                return (
                  <li key={r.round.id} className="grid grid-cols-[4.25rem_minmax(0,1fr)_3.75rem] items-center gap-3">
                    <div className="leading-tight">
                      <p className={`text-xs font-semibold ${last ? 'text-ink' : 'text-ink-soft'}`}>Round {r.round.number}</p>
                      <p className="text-xs tabular-nums text-ink-soft">{r.totalA}–{r.totalB}</p>
                    </div>
                    <RaceBar
                      a={r.totalA}
                      b={r.totalB}
                      className="h-2"
                      label={`After round ${r.round.number}: ${leader ? `${leader.name} lead by ${Math.abs(gap)}` : 'level'}, ${r.totalA}–${r.totalB}`}
                    />
                    <p aria-hidden className={`flex items-center justify-end gap-1.5 text-sm tabular-nums ${last ? 'font-bold' : 'font-semibold text-ink-soft'}`}>
                      {leader ? (
                        <>
                          <span className={`size-2.5 shrink-0 rounded-full ${field(leader)}`} />+{Math.abs(gap)}
                        </>
                      ) : (
                        'Level'
                      )}
                    </p>
                  </li>
                )
              })}
            </ol>
          </>
        )}
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
          <div className="flex flex-col gap-6">
            <Mvp stats={aw.mvp} clubs={[a, b]} />
            <section className="flex flex-col gap-3">
              <AwardHead title="Top scorer" rule="Most points won" />
              <div className="grid grid-cols-2 gap-2">
                {([a, b] as const).map((c) => <TopScorer key={c.id} club={c} stats={aw.topScorer[c.side]} />)}
              </div>
            </section>
            <section className="flex flex-col gap-3">
              <AwardHead
                title="Iron player"
                rule="Most matches played"
                value={`${plural(aw.iron[0].played, 'match')}${each(aw.iron.length)}`}
                after={aw.iron.length > 1 ? `${aw.iron.length} players` : undefined}
              />
              <Fold items={aw.iron} keep={8} noun="players" render={(stats) => <Chips stats={stats} clubs={[a, b]} />} />
            </section>
            <section className="flex flex-col gap-3">
              <AwardHead title="Biggest win" rule="Largest winning margin" value={`${margin(aw.biggestWin)} points`} />
              <Fold items={aw.biggestWin} keep={2} noun="matches" render={(ms) => <MatchRows matches={ms} a={a} b={b} pair={pair} round={roundNo} />} />
            </section>
            {/* last in the card: its list drops the bottom rule so the card edge closes it */}
            <section className="flex flex-col gap-3 [&>details>ol]:border-b-0 [&>ol:last-child]:border-b-0">
              <AwardHead title="Closest match" rule="Smallest winning margin" value={`${margin(aw.closest)} points`} />
              <Fold items={aw.closest} keep={2} noun="matches" render={(ms) => <MatchRows matches={ms} a={a} b={b} pair={pair} round={roundNo} />} />
            </section>
          </div>
        )}
      </Card>
    </>
  )
}

const field = (c: Club) => (c.side === 'A' ? 'bg-club-a' : 'bg-club-b')
const ink = (c: Club) => (c.side === 'A' ? 'text-club-a' : 'text-club-b')
const clubOf = (clubs: Club[], s: PlayerStat) => clubs.find((c) => c.id === s.player.club_id)

function Trophy({ className }: { className: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 2.5h7V6a3.5 3.5 0 0 1-7 0V2.5ZM4.5 3.5H3a1.5 1.5 0 0 0 0 3h1.75M11.5 3.5H13a1.5 1.5 0 0 1 0 3h-1.75M8 9.5v3M5.5 13.5h5" />
    </svg>
  )
}

function AwardHead({ title, rule, value, after }: { title: string; rule: string; value?: string; after?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <h3 className="text-lg font-bold leading-tight tracking-tight">{title}</h3>
      <p className="text-sm text-ink-soft">
        {rule}
        {value && <> · <span className="font-semibold whitespace-nowrap text-ink">{value}</span></>}
        {after && <> · {after}</>}
      </p>
    </div>
  )
}

/** The section's one colour field: the MVP on their club's colour (ink when the tie spans both clubs). The name is the thing people screenshot. */
function Mvp({ stats, clubs }: { stats: PlayerStat[]; clubs: Club[] }) {
  const [top] = stats
  const one = stats.every((s) => s.player.club_id === top.player.club_id) ? clubOf(clubs, top) : undefined
  // ties share wins, diff and points (see awards()), so these figures hold for everyone listed
  const figures = [['Wins', top.wins], ['Point diff', signed(top.diff)], ['Points', top.pf]] as const
  return (
    <section className={`rounded-xl p-4 text-white ${one ? field(one) : 'bg-ink'}`}>
      <div className="flex items-center gap-2">
        <Trophy className="size-5" />
        <h3 className="font-bold">MVP</h3>
        {stats.length > 1 && <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">Tied</span>}
      </div>
      <ul className={`mt-3 flex flex-col gap-1 font-extrabold leading-tight tracking-tight ${stats.length === 1 ? 'text-3xl' : 'text-2xl'}`}>
        {stats.map((s) => (
          <li key={s.player.id} className="wrap-break-word hyphens-auto">
            {s.player.name}
            {!one && <span className="block text-sm font-medium tracking-normal">{clubOf(clubs, s)?.name}</span>}
          </li>
        ))}
      </ul>
      {one && <p className="mt-1.5 text-sm font-medium wrap-break-word">{one.name}</p>}
      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-white/30 pt-3">
        {figures.map(([label, value]) => (
          <div key={label} className="flex min-w-0 flex-col-reverse gap-0.5">
            <dt className="text-xs font-medium">{label}</dt>
            <dd className="text-xl font-extrabold tabular-nums tracking-tight">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs font-medium">Most wins, then point difference</p>
    </section>
  )
}

/** One club's top scorer tile; the two sit side by side like the scoreboard. */
function TopScorer({ club, stats }: { club: Club; stats: PlayerStat[] }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-line p-3">
      <p className={`flex items-center gap-1.5 text-xs font-semibold ${ink(club)}`}>
        <span aria-hidden className={`size-2 shrink-0 rounded-full ${field(club)}`} />
        <span className="min-w-0 wrap-anywhere">{club.name}</span>
      </p>
      {stats[0] ? (
        <>
          <p className="flex flex-wrap items-baseline gap-x-1">
            <span className={`text-3xl leading-none font-extrabold tabular-nums tracking-tight ${ink(club)}`}>{stats[0].pf}</span>
            <span className="text-sm text-ink-soft">points{stats.length > 1 ? ' each' : ''}</span>
          </p>
          <ul className="flex flex-col gap-1 text-[0.9375rem] leading-snug font-semibold">
            {stats.map((s) => (
              <li key={s.player.id} className="wrap-anywhere">{s.player.name}</li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-sm text-ink-soft">No points yet.</p>
      )}
    </div>
  )
}

/** Name chips with a club dot, so a tie of most of the field stays compact. */
function Chips({ stats, clubs }: { stats: PlayerStat[]; clubs: Club[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {stats.map((s) => {
        const c = clubOf(clubs, s)
        return (
          <li key={s.player.id} className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-ink/6 px-2.5 py-1 text-sm font-medium">
            {c && <span aria-hidden className={`size-2 shrink-0 rounded-full ${field(c)}`} />}
            <span className="min-w-0 wrap-anywhere">{s.player.name}</span>
            {c && <span className="sr-only">, {c.name}</span>}
          </li>
        )
      })}
    </ul>
  )
}

/** Shows the first `keep` items and folds the rest behind a native disclosure. Never folds a lone leftover. */
function Fold<T>({ items, keep, noun, render }: { items: T[]; keep: number; noun: string; render: (items: T[]) => ReactNode }) {
  if (items.length <= keep + 1) return render(items)
  return (
    <>
      {render(items.slice(0, keep))}
      <details className="group">
        <summary className="flex min-h-11 w-fit cursor-pointer list-none items-center gap-1 text-sm font-semibold text-ink-soft hover:text-ink [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">Show {items.length - keep} more {noun}</span>
          <span className="hidden group-open:inline">Show fewer</span>
          <svg aria-hidden viewBox="0 0 16 16" className="size-3.5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6l4 4 4-4" />
          </svg>
        </summary>
        {render(items.slice(keep))}
      </details>
    </>
  )
}

/** Flush match rows like the tabulation; the score takes the winner's colour and the winning pair is set semibold. */
function MatchRows({ matches, a, b, pair, round }: {
  matches: Done[]
  a: Club
  b: Club
  pair: (club: Club, m: Match) => string | undefined
  round: Map<string, number>
}) {
  return (
    <ol className="-mx-4 divide-y divide-line border-y border-line sm:-mx-5">
      {matches.map((m) => {
        const aWon = m.score_a > m.score_b
        return (
          <li key={m.id} className="px-4 py-2.5 sm:px-5">
            <p className="text-xs font-semibold text-ink-soft">Round {round.get(m.round_id)} · Match {m.slot}</p>
            <div className="mt-1 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 text-sm">
              <span className={`text-club-a wrap-anywhere ${aWon ? 'font-semibold' : ''}`}>{pair(a, m)}</span>
              <span className={`whitespace-nowrap text-xl font-extrabold tabular-nums tracking-tight ${aWon ? 'text-club-a' : 'text-club-b'}`}>{m.score_a}–{m.score_b}</span>
              <span className={`text-right text-club-b wrap-anywhere ${aWon ? '' : 'font-semibold'}`}>{pair(b, m)}</span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
