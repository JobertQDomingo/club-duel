import { notFound } from 'next/navigation'
import { LiveRefresh } from '@/components/LiveRefresh'
import { RosterEditor } from '@/components/RosterEditor'
import { Card } from '@/components/ui/Card'
import { requireCaptain } from '@/lib/auth'
import { loadTournament } from '@/lib/db'
import { repeatPairs, viewFor } from '@/lib/domain'
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
  const opponentIn = !!round && view.lineups.some((l) => l.round_id === round.id && l.club_id === opponent.id && l.submitted_at)

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 pb-6">
      <LiveRefresh tournamentId={tournament_id} />
      <header className={`px-4 py-4 text-sheet ${club.side === 'A' ? 'bg-club-a' : 'bg-club-b'}`}>
        <p className="font-display text-sm font-bold uppercase tracking-wide">{view.tournament.name} · Captain</p>
        <h1 className="font-display text-4xl font-extrabold uppercase leading-tight">{club.name}</h1>
      </header>

      <div className="flex flex-col gap-4 px-4">
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

        <Card title="Roster">
          <RosterEditor caller={{ token }} club={club} players={players} />
        </Card>
      </div>
    </main>
  )
}
