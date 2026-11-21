import { notFound } from 'next/navigation'
import { LiveRefresh } from '@/components/LiveRefresh'
import { Ranking } from '@/components/Ranking'
import { RosterEditor } from '@/components/RosterEditor'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ScoreRace } from '@/components/ui/ScoreRace'
import { requireCaptain } from '@/lib/auth'
import { loadTournament } from '@/lib/db'
import { clubTotals, pairNames, repeatPairs, viewFor } from '@/lib/domain'
import { Draft } from './Draft'

export const metadata = { title: 'Captain · Club Duel', robots: { index: false } }
export const instant = false // live DB data on every request

export default async function CaptainPage({ params }: PageProps<'/c/[token]'>) {
  const { token } = await params
  const { id: clubId, tournament_id } = await requireCaptain(token)
  const data = await loadTournament(tournament_id)
  if (!data) notFound()
  const view = viewFor(data, { role: 'captain', clubId })

  const club = view.clubs.find((c) => c.id === clubId)!
  const opponent = view.clubs.find((c) => c.id !== clubId)!
  const players = view.players.filter((p) => p.club_id === clubId)
  const round = view.rounds.at(-1) // rounds are sorted by number
  const lineup = round && view.lineups.find((l) => l.round_id === round.id && l.club_id === clubId)
  const pairs = lineup ? view.pairs.filter((p) => p.lineup_id === lineup.id) : []
  const totals = clubTotals(view)
  const [a, b] = [...view.clubs].sort((x, y) => x.side.localeCompare(y.side))
  const played = view.rounds.filter((r) => r.locked_at).reverse() // newest first
  const opponentIn = !!round && view.lineups.some((l) => l.round_id === round.id && l.club_id === opponent.id && l.submitted_at)

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 pb-6">
      <LiveRefresh tournamentId={tournament_id} />
      <header className={`px-4 py-4 text-sheet ${club.side === 'A' ? 'bg-club-a' : 'bg-club-b'}`}>
        <p className="font-display text-sm font-bold uppercase tracking-wide">{view.tournament.name} · Captain</p>
        <h1 className="font-display text-4xl font-extrabold uppercase leading-tight">{club.name}</h1>
      </header>

      <div className="flex flex-col gap-4 px-4">
        <ScoreRace a={{ name: a.name, total: totals.A }} b={{ name: b.name, total: totals.B }} />

        <Card title={round ? `Round ${round.number} lineup` : 'Lineup'}>
          {!round || !lineup ? (
            <p className="text-ink-soft">No round open yet. Your draft appears here when the admin opens a round.</p>
          ) : (
            <Draft
              key={round.id}
              token={token}
              side={club.side}
              slots={round.pairs}
              players={players}
              pairs={pairs}
              repeats={[...repeatPairs(view, round.id, clubId, pairs)]}
              submitted={!!lineup.submitted_at}
              locked={!!round.locked_at}
              opponent={{ name: opponent.name, submitted: opponentIn }}
            />
          )}
        </Card>

        {played.length > 0 && (
          <Card title="Results">
            <div className="flex flex-col gap-4">
              {played.map((r) => (
                <section key={r.id}>
                  <h3 className="font-display font-bold uppercase">Round {r.number}</h3>
                  <ol className="divide-y divide-ink/20 border-y border-ink/20">
                    {view.matches
                      .filter((m) => m.round_id === r.id)
                      .sort((x, y) => x.slot - y.slot)
                      .map((m) => {
                        const mine = pairNames(view, clubId, r.id, m.slot)
                        const theirs = pairNames(view, opponent.id, r.id, m.slot)
                        const [us, them] = club.side === 'A' ? [m.score_a, m.score_b] : [m.score_b, m.score_a]
                        return (
                          <li key={m.id} className="grid grid-cols-[auto_1fr_auto_1fr] items-center gap-2 py-1.5 text-sm">
                            <span className="font-display font-bold">#{m.slot}</span>
                            <span>{mine?.join(' & ')}</span>
                            {m.status === 'done' && us !== null && them !== null ? (
                              <span className="font-display font-extrabold">
                                {us > them ? 'W' : 'L'} {us}–{them}
                              </span>
                            ) : m.status === 'live' ? (
                              <Badge tone="live">Live</Badge>
                            ) : (
                              <span className="text-ink-soft">Pending</span>
                            )}
                            <span className="text-right">{theirs ? theirs.join(' & ') : <span className="text-ink-soft">Hidden</span>}</span>
                          </li>
                        )
                      })}
                  </ol>
                </section>
              ))}
            </div>
          </Card>
        )}

        <Card title="Ranking">
          <Ranking view={view} />
        </Card>

        <Card title="Roster">
          <RosterEditor caller={{ token }} club={club} players={players} />
        </Card>
      </div>
    </main>
  )
}
