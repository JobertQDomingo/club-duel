import { headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LiveRefresh } from '@/components/LiveRefresh'
import { Card } from '@/components/ui/Card'
import { CopyLink } from '@/components/ui/CopyLink'
import { ScoreRace } from '@/components/ui/ScoreRace'
import { requireAdmin } from '@/lib/auth'
import { loadTournament } from '@/lib/db'
import { canOpenRound, clubTotals, ranking, repeatPairs, roundStatus, viewFor } from '@/lib/domain'
import { adminSaveSlot } from '@/lib/lineup-actions'
import { LineupSlots } from '@/components/LineupSlots'
import { Badge } from '@/components/ui/Badge'
import { RosterEditor } from '@/components/RosterEditor'
import { CourtsEditor } from './CourtsEditor'
import { OpenRound } from './OpenRound'
import { RegenerateLink } from './RegenerateLink'

export const metadata = { title: 'Tournament · Club Duel' }
export const instant = false // reads the session cookie

const empty = 'text-ink-soft'

export default async function TournamentPage({ params }: PageProps<'/admin/t/[id]'>) {
  const { id } = await params
  await requireAdmin(id)
  const data = await loadTournament(id)
  if (!data) notFound()
  const view = viewFor(data, { role: 'admin' })

  const h = await headers()
  const origin = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}`
  const clubs = [...view.clubs].sort((a, b) => a.side.localeCompare(b.side))
  const [a, b] = clubs
  const totals = clubTotals(view)
  const clubName = new Map(clubs.map((c) => [c.id, c.name]))
  const rows = ranking(view)
  const round = view.rounds.at(-1) // rounds are sorted by number

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
      <LiveRefresh tournamentId={id} />
      <Link href="/admin" className="self-start underline">← My tournaments</Link>

      <header className="flex flex-col gap-4">
        <h1 className="font-display text-4xl font-extrabold uppercase leading-tight">{view.tournament.name}</h1>
        <ScoreRace a={{ name: a.name, total: totals.A }} b={{ name: b.name, total: totals.B }} />
        <p className="font-display text-lg font-bold uppercase">{roundStatus(view)}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Links" className="lg:col-span-2">
          <div className="grid gap-4 lg:grid-cols-3">
            {clubs.map((c) => (
              <div key={c.id} className="flex flex-col gap-1">
                <CopyLink label={`${c.name} captain (keep private)`} url={`${origin}/c/${c.captain_token}`} />
                <RegenerateLink tournamentId={id} clubId={c.id} clubName={c.name} />
              </div>
            ))}
            <CopyLink label="Audience" url={`${origin}/t/${id}`} />
          </div>
        </Card>

        <Card title="Court board" className="lg:col-span-2">
          <p className={empty}>No match on court.</p>
        </Card>

        <Card title={round ? `Round ${round.number} lineups` : 'Round panel'} className="lg:col-span-2">
          <div className="flex flex-col gap-6">
            {!round ? (
              <p className={empty}>No round open yet.</p>
            ) : (
              <>
                {round.locked_at && <Badge mark="filled">Locked</Badge>}
                <div className="grid gap-8 lg:grid-cols-2">
                  {clubs.map((c) => {
                    const lineup = view.lineups.find((l) => l.round_id === round.id && l.club_id === c.id)
                    if (!lineup) return null
                    const pairs = view.pairs.filter((p) => p.lineup_id === lineup.id)
                    return (
                      <section key={c.id} className="flex min-w-0 flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className={`font-display text-xl font-bold uppercase ${c.side === 'A' ? 'text-club-a' : 'text-club-b'}`}>{c.name}</h3>
                          <Badge mark={lineup.submitted_at ? 'filled' : 'hollow'}>{lineup.submitted_at ? 'Submitted' : 'Not yet'}</Badge>
                        </div>
                        <LineupSlots
                          key={lineup.id}
                          side={c.side}
                          slots={round.pairs}
                          players={view.players.filter((p) => p.club_id === c.id)}
                          pairs={pairs}
                          repeats={[...repeatPairs(view, round.id, c.id, pairs)]}
                          editable
                          clearable={!round.locked_at}
                          save={adminSaveSlot.bind(null, id, lineup.id)}
                        />
                      </section>
                    )
                  })}
                </div>
                <p className={empty}>Your lineup edits are recorded in the audit log.</p>
              </>
            )}
            <OpenRound tournamentId={id} number={(round?.number ?? 0) + 1} allowed={canOpenRound(view)} />
          </div>
        </Card>

        <Card title="Results">
          <p className={empty}>No matches finished.</p>
        </Card>

        <Card title="Ranking">
          {rows.length === 0 ? (
            <p className={empty}>No matches finished.</p>
          ) : (
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
                      {s.player.name} <span className={`text-sm ${empty}`}>{clubName.get(s.player.club_id)}</span>
                    </td>
                    <td className="py-1.5 pr-2 text-right">{s.wins}–{s.losses}</td>
                    <td className="py-1.5 pr-2 text-right">{s.diff > 0 ? `+${s.diff}` : s.diff}</td>
                    <td className="py-1.5 text-right">{s.pf}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Rosters & courts" className="lg:col-span-2">
          <div className="grid gap-8 lg:grid-cols-3">
            {clubs.map((c) => (
              <RosterEditor key={c.id} caller={{ tournamentId: id }} club={c} players={view.players.filter((p) => p.club_id === c.id)} />
            ))}
            <CourtsEditor tournamentId={id} courts={view.courts} pairs={view.tournament.pairs_per_round} />
          </div>
        </Card>
      </div>
    </main>
  )
}
