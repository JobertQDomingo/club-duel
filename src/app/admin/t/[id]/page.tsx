import { headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LiveRefresh } from '@/components/LiveRefresh'
import { Card } from '@/components/ui/Card'
import { CopyLink } from '@/components/ui/CopyLink'
import { ScoreRace } from '@/components/ui/ScoreRace'
import { requireAdmin } from '@/lib/auth'
import { loadAuditLog, loadTournament } from '@/lib/db'
import { canOpenRound, clubTotals, ranking, repeatPairs, roundStatus, viewFor } from '@/lib/domain'
import { adminSaveSlot } from '@/lib/lineup-actions'
import { LineupSlots } from '@/components/LineupSlots'
import { Badge } from '@/components/ui/Badge'
import { PairCard } from '@/components/ui/PairCard'
import { RosterEditor } from '@/components/RosterEditor'
import { editScore, endMatch } from './actions'
import { CourtsEditor } from './CourtsEditor'
import { OpenRound } from './OpenRound'
import { RegenerateLink } from './RegenerateLink'
import { EndMatch, ScoreForm } from './ScoreForm'
import { StartMatch } from './StartMatch'

export const metadata = { title: 'Tournament · Club Duel' }
export const instant = false // reads the session cookie

const empty = 'text-ink-soft'

export default async function TournamentPage({ params }: PageProps<'/admin/t/[id]'>) {
  const { id } = await params
  await requireAdmin(id)
  const [data, audit] = await Promise.all([loadTournament(id), loadAuditLog(id)])
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
  const courts = [...view.courts].sort((x, y) => x.name.localeCompare(y.name, undefined, { numeric: true }))
  const liveOn = new Map(view.matches.filter((m) => m.status === 'live').map((m) => [m.court_id, m]))
  const pending = view.matches
    .filter((m) => m.round_id === round?.id && m.status === 'pending')
    .sort((x, y) => x.slot - y.slot)
    .map(({ id, slot }) => ({ id, slot }))
  const playerName = new Map(view.players.map((p) => [p.id, p.name]))
  const pairNames = (clubId: string, roundId: string, slot: number): [string, string] | null => {
    const lineup = view.lineups.find((l) => l.round_id === roundId && l.club_id === clubId)
    const pair = lineup && view.pairs.find((p) => p.lineup_id === lineup.id && p.slot === slot)
    return pair ? [playerName.get(pair.player1_id) ?? '?', playerName.get(pair.player2_id) ?? '?'] : null
  }
  const roundNo = new Map(view.rounds.map((r) => [r.id, r.number]))
  const finished = view.matches
    .filter((m) => m.status === 'done')
    .sort((x, y) => roundNo.get(x.round_id)! - roundNo.get(y.round_id)! || x.slot - y.slot)
  const clubNames: [string, string] = [a.name, b.name]
  const names = (ids: string[] | null) => (ids ? ids.map((p) => playerName.get(p) ?? '?').join(' & ') : 'empty')
  type Logged = { round: number; slot: number; club_id?: string; pair?: string[] | null; score_a?: number; score_b?: number }
  const auditLine = (e: (typeof audit)[number]) => {
    const [was, now] = [e.before, e.after] as [Logged, Logged]
    return e.action === 'score.edit'
      ? `Round ${now.round} · Match ${now.slot} score ${was.score_a}–${was.score_b} → ${now.score_a}–${now.score_b}`
      : `Round ${now.round} · ${clubName.get(now.club_id!) ?? '?'} pair ${now.slot}: ${names(was.pair ?? null)} → ${names(now.pair ?? null)}`
  }

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
          {courts.length === 0 ? (
            <p className={empty}>No courts yet. Add one under Rosters &amp; courts.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courts.map((c) => {
                const m = liveOn.get(c.id)
                return (
                  <section key={c.id} className="flex min-w-0 flex-col gap-3 border border-ink p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-xl font-bold uppercase">{c.name}</h3>
                      {m ? <Badge tone="live">Live · Match {m.slot}</Badge> : <Badge mark="hollow">Free</Badge>}
                    </div>
                    {m ? (
                      <>
                        <div className="grid grid-cols-2 divide-x divide-ink/20 border-t border-ink/20">
                          <PairCard side="A" slot={m.slot} names={pairNames(a.id, m.round_id, m.slot)} />
                          <PairCard side="B" slot={m.slot} names={pairNames(b.id, m.round_id, m.slot)} />
                        </div>
                        <EndMatch slot={m.slot} clubs={clubNames} action={endMatch.bind(null, id, m.id)} />
                      </>
                    ) : pending.length > 0 ? (
                      <StartMatch key={pending.map((p) => p.id).join()} tournamentId={id} court={c} pending={pending} />
                    ) : (
                      <p className={empty}>{round && !round.locked_at ? 'Matches start once both lineups are in.' : 'No pending match.'}</p>
                    )}
                  </section>
                )
              })}
            </div>
          )}
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
          <div className="flex flex-col gap-6">
            {finished.length === 0 ? (
              <p className={empty}>No matches finished.</p>
            ) : (
              <ul className="divide-y divide-ink/20 border-y border-ink/20">
                {finished.map((m) => (
                  <li key={m.id} className="flex flex-col gap-2 py-3">
                    <h3 className="font-display font-bold uppercase">Round {roundNo.get(m.round_id)} · Match {m.slot}</h3>
                    <p className="text-sm">
                      <span className="text-club-a">{pairNames(a.id, m.round_id, m.slot)?.join(' & ')}</span>
                      <span className={empty}> vs </span>
                      <span className="text-club-b">{pairNames(b.id, m.round_id, m.slot)?.join(' & ')}</span>
                    </p>
                    <ScoreForm
                      key={`${m.score_a}-${m.score_b}`} // remount so defaultValue shows the saved score
                      clubs={clubNames}
                      score={[m.score_a!, m.score_b!]}
                      submit="Save"
                      action={editScore.bind(null, id, m.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
            <section className="flex flex-col gap-2">
              <h3 className="font-display font-bold uppercase">Audit log</h3>
              {audit.length === 0 ? (
                <p className={empty}>No corrections yet.</p>
              ) : (
                <ol className="divide-y divide-ink/20 text-sm">
                  {audit.map((e) => (
                    <li key={e.id} className="py-1.5">
                      {/* shortcut: time is formatted in the server's timezone (UTC on Vercel); format on the client if the venue needs local time */}
                      <span className={empty}>{new Date(e.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} · {e.actor} · </span>
                      {auditLine(e)}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
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
