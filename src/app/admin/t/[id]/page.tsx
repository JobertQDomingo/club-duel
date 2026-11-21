import { headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LiveRefresh } from '@/components/LiveRefresh'
import { LocalTime } from '@/components/LocalTime'
import { Card } from '@/components/ui/Card'
import { CopyLink } from '@/components/ui/CopyLink'
import { ScoreRace } from '@/components/ui/ScoreRace'
import { Tabs } from '@/components/ui/Tabs'
import { requireAdmin } from '@/lib/auth'
import { loadAuditLog, loadTournament } from '@/lib/db'
import { canOpenRound, clubTotals, pairNames, pastPartners, repeatPairs, rosterShortfall, roundStatus, viewFor } from '@/lib/domain'
import { adminSaveSlot } from '@/lib/lineup-actions'
import { LineupSlots } from '@/components/LineupSlots'
import { Ranking } from '@/components/Ranking'
import { Badge } from '@/components/ui/Badge'
import { PairCard } from '@/components/ui/PairCard'
import { RosterEditor } from '@/components/RosterEditor'
import { editScore, endMatch } from './actions'
import { CourtsEditor } from './CourtsEditor'
import { EndTournament } from './EndTournament'
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
  const round = view.rounds.at(-1) // rounds are sorted by number
  const courts = [...view.courts].sort((x, y) => x.name.localeCompare(y.name, undefined, { numeric: true }))
  const liveOn = new Map(view.matches.filter((m) => m.status === 'live').map((m) => [m.court_id, m]))
  const ended = view.tournament.status === 'ended'
  const pending = view.matches
    .filter((m) => !ended && m.round_id === round?.id && m.status === 'pending') // start_match refuses after the end
    .sort((x, y) => x.slot - y.slot)
    .map(({ id, slot }) => ({ id, slot }))
  const playerName = new Map(view.players.map((p) => [p.id, p.name]))
  const roundNo = new Map(view.rounds.map((r) => [r.id, r.number]))
  const finished = view.matches
    .filter((m) => m.status === 'done')
    .sort((x, y) => roundNo.get(x.round_id)! - roundNo.get(y.round_id)! || x.slot - y.slot)
  const clubNames: [string, string] = [a.name, b.name]
  const courtName = new Map(courts.map((c) => [c.id, c.name]))
  const roundMatches = view.matches.filter((m) => m.round_id === round?.id).sort((x, y) => x.slot - y.slot)
  const names = (ids: string[] | null) => (ids ? ids.map((p) => playerName.get(p) ?? '?').join(' & ') : 'empty')
  type Logged = { round: number; slot: number; club_id?: string; pair?: string[] | null; score_a?: number; score_b?: number }
  const auditLine = (e: (typeof audit)[number]) => {
    const [was, now] = [e.before, e.after] as [Logged, Logged]
    return e.action === 'score.edit'
      ? `Round ${now.round} · Match ${now.slot} score ${was.score_a}–${was.score_b} → ${now.score_a}–${now.score_b}`
      : `Round ${now.round} · ${clubName.get(now.club_id!) ?? '?'} pair ${now.slot}: ${names(was.pair ?? null)} → ${names(now.pair ?? null)}`
  }

  const courtsTab = (
    <>
      {courts.length === 0 ? (
        <Card>
          <p className={empty}>No courts yet. Add one in Setup.</p>
        </Card>
      ) : liveOn.size === 0 && pending.length === 0 ? (
        // nothing to run on any court: say why once, with the next action, instead of every court saying "No pending match"
        <Card>
          <div className="flex flex-col gap-3">
            <p className="text-lg font-bold tracking-tight">
              {ended ? 'Tournament ended.' : !round ? 'No round open yet.' : !round.locked_at ? 'Matches start once both lineups are in.' : `Round ${round.number} is complete.`}
            </p>
            {canOpenRound(view) && <OpenRound tournamentId={id} number={(round?.number ?? 0) + 1} blocked={rosterShortfall(view)} />}
          </div>
        </Card>
      ) : (
        // grid-cols-1 on every grid: an implicit auto track grows to its widest child and scrolls phones sideways
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {courts.map((c) => {
            const m = liveOn.get(c.id)
            return (
              <section key={c.id} className="@container flex min-w-0 flex-col gap-3 rounded-2xl border border-line bg-card p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="min-w-0 text-lg font-bold tracking-tight wrap-anywhere">{c.name}</h3>
                  {m ? <Badge tone="live">Live · Match {m.slot}</Badge> : <Badge mark="hollow">Free</Badge>}
                </div>
                {m ? (
                  <>
                    <div className="-mx-4 grid grid-cols-1 divide-y divide-line border-y border-line sm:-mx-5 @sm:grid-cols-2 @sm:divide-x @sm:divide-y-0">
                      <PairCard side="A" slot={m.slot} names={pairNames(view, a.id, m.round_id, m.slot)} />
                      <PairCard side="B" slot={m.slot} names={pairNames(view, b.id, m.round_id, m.slot)} />
                    </div>
                    <div className="mt-auto">
                      <EndMatch slot={m.slot} clubs={clubNames} action={endMatch.bind(null, id, m.id)} />
                    </div>
                  </>
                ) : pending.length > 0 ? (
                  <div className="mt-auto">
                    <StartMatch key={pending.map((p) => p.id).join()} tournamentId={id} court={c} pending={pending} />
                  </div>
                ) : (
                  <p className={empty}>No pending match.</p>
                )}
              </section>
            )
          })}
        </div>
      )}
      {round && roundMatches.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold tracking-tight">Round {round.number} matches</h2>
          <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {roundMatches.map((m) => (
              <li key={m.id} className={`flex min-h-16 flex-col justify-center gap-0.5 rounded-xl border px-3 py-2 ${m.status === 'live' ? 'border-live/30 bg-live-bg' : 'border-line bg-card'}`}>
                <span className="text-xs font-semibold text-ink-soft">Match {m.slot}</span>
                {m.status === 'done' ? (
                  <span className={`whitespace-nowrap text-lg font-bold tabular-nums ${m.score_a! > m.score_b! ? 'text-club-a' : 'text-club-b'}`}>{m.score_a}–{m.score_b}</span>
                ) : m.status === 'live' ? (
                  <span className="text-sm font-semibold text-live-ink">Live{m.court_id && ` · ${courtName.get(m.court_id)}`}</span>
                ) : (
                  <span className="text-sm text-ink-soft">Pending</span>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  )

  const lineupsTab = (
    <>
      {!round ? (
        <Card>
          <p className={empty}>No round open yet.</p>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight">Round {round.number} lineups</h2>
            {round.locked_at && <Badge mark="filled">Locked</Badge>}
          </div>
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            {clubs.map((c) => {
              const lineup = view.lineups.find((l) => l.round_id === round.id && l.club_id === c.id)
              if (!lineup) return null
              const pairs = view.pairs.filter((p) => p.lineup_id === lineup.id)
              return (
                <Card key={c.id}>
                  <div className="mb-3 flex items-start gap-2">
                    <span aria-hidden className={`mt-2 size-2.5 flex-none rounded-full ${c.side === 'A' ? 'bg-club-a' : 'bg-club-b'}`} />
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="min-w-0 text-lg font-bold tracking-tight wrap-anywhere">{c.name}</h3>
                    <Badge mark={lineup.submitted_at ? 'filled' : 'hollow'}>{lineup.submitted_at ? 'Submitted' : 'Not yet'}</Badge>
                    </div>
                  </div>
                  <LineupSlots
                    key={lineup.id}
                    side={c.side}
                    slots={round.pairs}
                    players={view.players.filter((p) => p.club_id === c.id)}
                    pairs={pairs}
                    repeats={[...repeatPairs(view, round.id, c.id, pairs)]}
                    partners={pastPartners(view, round.id, c.id)}
                    editable
                    clearable={!round.locked_at}
                    save={adminSaveSlot.bind(null, id, lineup.id)}
                  />
                </Card>
              )
            })}
          </div>
          <p className={`${empty} text-sm`}>Your lineup edits are recorded in the audit log.</p>
        </>
      )}
      {!ended && (
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <OpenRound
              tournamentId={id}
              number={(round?.number ?? 0) + 1}
              blocked={canOpenRound(view) ? rosterShortfall(view) : `Opens when every match of Round ${round?.number} is done.`}
            />
            <EndTournament
              tournamentId={id}
              live={liveOn.size > 0}
              tied={totals.A === totals.B}
              pending={view.matches.filter((m) => m.status === 'pending').length}
            />
          </div>
        </Card>
      )}
    </>
  )

  const resultsTab = (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[3fr_2fr]">
      <Card title="Finished matches">
        {finished.length === 0 ? (
          <p className={empty}>No matches finished.</p>
        ) : (
          <ul className="divide-y divide-line">
            {finished.map((m) => (
              // keyed on the score: a saved edit remounts the row, which closes it and refreshes the form's defaults
              <li key={`${m.id}:${m.score_a}-${m.score_b}`}>
                <details className="group">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 py-2 [&::-webkit-details-marker]:hidden">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-semibold text-ink-soft">Round {roundNo.get(m.round_id)} · Match {m.slot}</h3>
                      <p className="text-sm wrap-break-word">
                        <span className="text-club-a">{pairNames(view, a.id, m.round_id, m.slot)?.join(' & ')}</span>
                        <span className={empty}> vs </span>
                        <span className="text-club-b">{pairNames(view, b.id, m.round_id, m.slot)?.join(' & ')}</span>
                      </p>
                    </div>
                    <span className={`whitespace-nowrap text-xl font-bold tabular-nums tracking-tight ${m.score_a! > m.score_b! ? 'text-club-a' : 'text-club-b'}`}>{m.score_a}–{m.score_b}</span>
                    <span className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-ink-soft group-hover:bg-ink/5 group-hover:text-ink">
                      Edit
                      <svg aria-hidden viewBox="0 0 16 16" className="size-3.5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 6l4 4 4-4" />
                      </svg>
                    </span>
                  </summary>
                  <div className="pb-4">
                    <ScoreForm clubs={clubNames} score={[m.score_a!, m.score_b!]} submit="Save score" action={editScore.bind(null, id, m.id)} />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card title="Audit log">
        {audit.length === 0 ? (
          <p className={empty}>No corrections yet.</p>
        ) : (
          <ol className="divide-y divide-line text-sm">
            {audit.map((e) => (
              <li key={e.id} className="py-2 first:pt-0 last:pb-0">
                <span className={`${empty} tabular-nums`}><LocalTime iso={e.created_at} /> · {e.actor} · </span>
                {auditLine(e)}
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  )

  const setupTab = (
    <>
      <Card title="Links">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {clubs.map((c) => (
            <div key={c.id} className="flex flex-col gap-1">
              <CopyLink label={`${c.name} captain (keep private)`} url={`${origin}/c/${c.captain_token}`} />
              <RegenerateLink tournamentId={id} clubId={c.id} clubName={c.name} />
            </div>
          ))}
          <CopyLink label="Audience" url={`${origin}/t/${id}`} />
        </div>
      </Card>
      {/* two columns, not three: a third of the console left roster names ~10 characters wide; courts sit under Club A */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        {clubs.map((c) => (
          <Card key={c.id} title={`Club ${c.side} roster`}>
            <RosterEditor caller={{ tournamentId: id }} club={c} players={view.players.filter((p) => p.club_id === c.id)} />
          </Card>
        ))}
        <Card title="Courts">
          <CourtsEditor tournamentId={id} courts={view.courts} pairs={view.tournament.pairs_per_round} />
        </Card>
      </div>
    </>
  )

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 pt-2 pb-8 sm:pt-4">
      <LiveRefresh tournamentId={id} />
      <Link href="/admin" className="inline-flex min-h-11 items-center gap-1 self-start text-sm font-semibold text-ink-soft hover:text-ink">
        <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 3.5 5.5 8l4.5 4.5" />
        </svg>
        My tournaments
      </Link>
      <ScoreRace
        heading={<h1 className="mb-4 text-xl font-bold tracking-tight wrap-anywhere sm:mb-5 sm:text-2xl">{view.tournament.name}</h1>}
        a={{ name: a.name, total: totals.A }}
        b={{ name: b.name, total: totals.B }}
        status={roundStatus(view)}
      />
      <Tabs
        label="Tournament sections"
        tabs={[
          { id: 'courts', label: 'Courts', live: liveOn.size > 0, content: courtsTab },
          { id: 'lineups', label: 'Lineups', content: lineupsTab },
          { id: 'results', label: 'Results', content: resultsTab },
          { id: 'ranking', label: 'Ranking', content: <Card title="Ranking"><Ranking view={view} /></Card> },
          { id: 'setup', label: 'Setup', content: setupTab },
        ]}
      />
    </main>
  )
}
