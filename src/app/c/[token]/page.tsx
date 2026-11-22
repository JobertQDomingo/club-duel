import { notFound } from 'next/navigation'
import { LiveRefresh } from '@/components/LiveRefresh'
import { Ranking } from '@/components/Ranking'
import { RosterEditor } from '@/components/RosterEditor'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ScoreRace } from '@/components/ui/ScoreRace'
import { Tabs } from '@/components/ui/Tabs'
import { requireCaptain } from '@/lib/auth'
import { loadTournament } from '@/lib/db'
import { clubTotals, pairNames, pastPartners, repeatPairs, roundStatus, viewFor } from '@/lib/domain'
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

  const lineupTab = (
    <Card title={round ? `Round ${round.number} lineup` : 'Lineup'}>
      {view.tournament.status === 'ended' ? (
        <p className="text-ink-soft">The tournament has ended. No more lineups.</p>
      ) : !round || !lineup ? (
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
          partners={pastPartners(view, round.id, clubId)}
          submitted={!!lineup.submitted_at}
          locked={!!round.locked_at}
          opponent={{ name: opponent.name, submitted: opponentIn }}
        />
      )}
    </Card>
  )

  const resultsTab =
    played.length === 0 ? (
      <Card>
        <p className="text-ink-soft">No results yet. Each round shows here once both lineups lock.</p>
      </Card>
    ) : (
      played.map((r) => (
        <Card key={r.id} title={`Round ${r.number}`}>
          <ol className="divide-y divide-line">
            {view.matches
              .filter((m) => m.round_id === r.id)
              .sort((x, y) => x.slot - y.slot)
              .map((m) => {
                const mine = pairNames(view, clubId, r.id, m.slot)
                const theirs = pairNames(view, opponent.id, r.id, m.slot)
                const [us, them] = club.side === 'A' ? [m.score_a, m.score_b] : [m.score_b, m.score_a]
                return (
                  <li key={m.id} className="grid grid-cols-[auto_1fr_auto_1fr] items-center gap-3 py-2.5 text-sm first:pt-0 last:pb-0">
                    <span className="text-xs font-semibold text-ink-soft">#{m.slot}</span>
                    <span className="min-w-0 wrap-break-word">{mine?.join(' & ')}</span>
                    {m.status === 'done' && us !== null && them !== null ? (
                      <span className={`whitespace-nowrap rounded-lg px-2 py-0.5 font-bold tabular-nums ${us > them ? 'bg-ink text-white' : 'bg-ink/[0.06]'}`}>
                        {us > them ? 'W' : 'L'} {us}–{them}
                      </span>
                    ) : m.status === 'live' ? (
                      <Badge tone="live">Live</Badge>
                    ) : (
                      <span className="text-ink-soft">Pending</span>
                    )}
                    <span className="min-w-0 text-right wrap-break-word">{theirs ? theirs.join(' & ') : <span className="text-ink-soft">Hidden</span>}</span>
                  </li>
                )
              })}
          </ol>
        </Card>
      ))
    )

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-3 px-4 pb-8">
      <LiveRefresh tournamentId={tournament_id} />
      <header className={`-mx-4 flex items-center justify-between gap-3 px-4 py-4 text-white ${club.side === 'A' ? 'bg-club-a' : 'bg-club-b'}`}>
        <h1 className="min-w-0 text-2xl font-bold tracking-tight wrap-anywhere">{club.name}</h1>
        <span className="flex-none rounded-full bg-ink/25 px-2.5 py-0.5 text-xs font-semibold">Captain</span>
      </header>
      <ScoreRace
        heading={<h2 className="mb-4 text-lg font-bold tracking-tight wrap-anywhere">{view.tournament.name}</h2>}
        a={{ name: a.name, total: totals.A }}
        b={{ name: b.name, total: totals.B }}
        status={roundStatus(view)}
        ended={view.tournament.status === 'ended'}
      />
      <Tabs
        label="Captain sections"
        tabs={[
          { id: 'lineup', label: 'Lineup', content: lineupTab },
          { id: 'results', label: 'Results', live: view.matches.some((m) => m.status === 'live'), content: resultsTab },
          { id: 'ranking', label: 'Ranking', content: <Card title="Ranking"><Ranking view={view} /></Card> },
          { id: 'roster', label: 'Roster', content: <Card title="Roster"><RosterEditor caller={{ token }} club={club} players={players} /></Card> },
        ]}
      />
    </main>
  )
}
