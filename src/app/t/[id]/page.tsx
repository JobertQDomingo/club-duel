import { notFound } from 'next/navigation'
import { LiveRefresh } from '@/components/LiveRefresh'
import { Ranking } from '@/components/Ranking'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { PairCard } from '@/components/ui/PairCard'
import { ScoreRace } from '@/components/ui/ScoreRace'
import { Tabs } from '@/components/ui/Tabs'
import { loadTournament } from '@/lib/db'
import { clubTotals, pairNames, roundStatus, viewFor } from '@/lib/domain'
import { Results } from './Results'

export const metadata = { title: 'Live · Club Duel' }
export const instant = false // live DB data on every request

export default async function AudiencePage({ params }: PageProps<'/t/[id]'>) {
  const { id } = await params
  const data = await loadTournament(id)
  if (!data) notFound()
  const view = viewFor(data, { role: 'audience' }) // the only data this page may render

  const [a, b] = [...view.clubs].sort((x, y) => x.side.localeCompare(y.side))
  const totals = clubTotals(view)
  const round = view.rounds.at(-1) // rounds are sorted by number
  const matches = view.matches.filter((m) => m.round_id === round?.id).sort((x, y) => x.slot - y.slot)
  const courts = [...view.courts].sort((x, y) => x.name.localeCompare(y.name, undefined, { numeric: true }))
  const courtName = new Map(courts.map((c) => [c.id, c.name]))
  const liveOn = new Map(view.matches.filter((m) => m.status === 'live').map((m) => [m.court_id, m.slot]))

  const liveTab = (
    <>
      <Card title={round ? `Round ${round.number}` : 'Matches'}>
        {!round ? (
          <p className="text-ink-soft">No round open yet.</p>
        ) : matches.length === 0 ? (
          <p className="text-ink-soft">Captains are drafting. Matches appear once both lineups are in.</p>
        ) : (
          <ol className="-mx-4 divide-y divide-line border-y border-line sm:-mx-5 last:border-b-0">
            {matches.map((m) => (
              // phones: match info on its own line above the two pairs, so each pair gets half the row for long names; sm+: A | info | B
              <li
                key={m.id}
                className={`grid grid-cols-2 [grid-template-areas:'m_m'_'a_b'] sm:grid-cols-[1fr_auto_1fr] sm:[grid-template-areas:'a_m_b'] ${m.status === 'live' ? 'bg-live-bg/60' : ''}`}
              >
                <div className="min-w-0 [grid-area:a]">
                  <PairCard side="A" slot={m.slot} names={pairNames(view, a.id, m.round_id, m.slot)} />
                </div>
                <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 pt-2.5 text-center [grid-area:m] sm:min-w-20 sm:max-w-40 sm:flex-col sm:flex-nowrap sm:px-2 sm:py-2">
                  <span className="text-xs font-semibold text-ink-soft">Match {m.slot}</span>
                  {m.status === 'done' ? (
                    <span className={`whitespace-nowrap text-2xl font-extrabold tabular-nums tracking-tight ${m.score_a! > m.score_b! ? 'text-club-a' : 'text-club-b'}`}>{m.score_a}–{m.score_b}</span>
                  ) : m.status === 'live' ? (
                    <>
                      <Badge tone="live">Live</Badge>
                      {m.court_id && <span className="text-xs font-semibold text-live-ink wrap-anywhere">{courtName.get(m.court_id)}</span>}
                    </>
                  ) : (
                    <span className="text-sm text-ink-soft">Pending</span>
                  )}
                </div>
                <div className="min-w-0 [grid-area:b]">
                  <PairCard side="B" slot={m.slot} names={pairNames(view, b.id, m.round_id, m.slot)} />
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>
      {courts.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold tracking-tight">Courts</h2>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {courts.map((c) => (
              <li key={c.id} className={`flex flex-col items-start gap-1.5 rounded-xl border px-3 py-2.5 ${liveOn.has(c.id) ? 'border-live/30 bg-live-bg' : 'border-line bg-card'}`}>
                <span className="font-semibold">{c.name}</span>
                {liveOn.has(c.id) ? <Badge tone="live">Match {liveOn.get(c.id)}</Badge> : <Badge mark="hollow">Free</Badge>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )

  const ranking = { id: 'ranking', label: 'Ranking', content: <Card title="Ranking"><Ranking view={view} /></Card> }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 pt-4 pb-8 sm:pt-6">
      <LiveRefresh tournamentId={id} />
      <ScoreRace
        heading={<h1 className="mb-4 text-xl font-bold tracking-tight wrap-anywhere sm:mb-5 sm:text-2xl">{view.tournament.name}</h1>}
        a={{ name: a.name, total: totals.A }}
        b={{ name: b.name, total: totals.B }}
        status={roundStatus(view)}
      />
      <Tabs
        label="Live sections"
        tabs={
          view.tournament.status === 'ended'
            ? [{ id: 'results', label: 'Results', content: <Results view={view} a={a} b={b} /> }, ranking]
            : [{ id: 'live', label: 'Live', live: liveOn.size > 0, content: liveTab }, ranking]
        }
      />
    </main>
  )
}
