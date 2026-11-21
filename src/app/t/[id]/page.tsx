import { notFound } from 'next/navigation'
import { LiveRefresh } from '@/components/LiveRefresh'
import { Ranking } from '@/components/Ranking'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { PairCard } from '@/components/ui/PairCard'
import { ScoreRace } from '@/components/ui/ScoreRace'
import { loadTournament } from '@/lib/db'
import { clubTotals, pairNames, roundStatus, viewFor } from '@/lib/domain'

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

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 pb-6">
      <LiveRefresh tournamentId={id} />
      <header className="flex flex-col gap-4 px-4 pt-6">
        <h1 className="font-display text-4xl font-extrabold uppercase leading-tight">{view.tournament.name}</h1>
        <ScoreRace a={{ name: a.name, total: totals.A }} b={{ name: b.name, total: totals.B }} />
        <p className="font-display text-lg font-bold uppercase">{roundStatus(view)}</p>
      </header>

      <div className="flex flex-col gap-4 px-4">
        <Card title={round ? `Round ${round.number}` : 'Matches'}>
          {!round ? (
            <p className="text-ink-soft">No round open yet.</p>
          ) : matches.length === 0 ? (
            <p className="text-ink-soft">Captains are drafting. Matches appear once both lineups are in.</p>
          ) : (
            <ol className="divide-y divide-ink/20 border-y border-ink/20">
              {matches.map((m) => (
                <li key={m.id} className={`grid grid-cols-[1fr_auto_1fr] ${m.status === 'live' ? 'bg-live/25' : ''}`}>
                  <PairCard side="A" slot={m.slot} names={pairNames(view, a.id, m.round_id, m.slot)} />
                  <div className="flex min-w-20 flex-col items-center justify-center gap-1 border-x border-ink/20 px-2 py-2 text-center">
                    <span className="font-display text-sm font-bold uppercase tracking-wide">Match {m.slot}</span>
                    {m.status === 'done' ? (
                      <span className="font-display text-2xl font-extrabold">{m.score_a}–{m.score_b}</span>
                    ) : m.status === 'live' ? (
                      <>
                        <Badge tone="live">Live</Badge>
                        {m.court_id && <span className="text-sm text-ink-soft">{courtName.get(m.court_id)}</span>}
                      </>
                    ) : (
                      <span className="text-sm text-ink-soft">Pending</span>
                    )}
                  </div>
                  <PairCard side="B" slot={m.slot} names={pairNames(view, b.id, m.round_id, m.slot)} />
                </li>
              ))}
            </ol>
          )}
        </Card>

        {courts.length > 0 && (
          <Card title="Courts">
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {courts.map((c) => (
                <li key={c.id} className="flex flex-col items-start gap-1">
                  <span className="font-display font-bold uppercase">{c.name}</span>
                  {liveOn.has(c.id) ? <Badge tone="live">Match {liveOn.get(c.id)}</Badge> : <Badge mark="hollow">Free</Badge>}
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card title="Ranking">
          <Ranking view={view} />
        </Card>
      </div>
    </main>
  )
}
