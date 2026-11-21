import { headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LiveRefresh } from '@/components/LiveRefresh'
import { Card } from '@/components/ui/Card'
import { CopyLink } from '@/components/ui/CopyLink'
import { requireAdmin } from '@/lib/auth'
import { loadTournament } from '@/lib/db'

export const metadata = { title: 'Tournament · Club Duel' }
export const instant = false // reads the session cookie

// T12 turns this into the full console.
export default async function TournamentPage({ params }: PageProps<'/admin/t/[id]'>) {
  const { id } = await params
  await requireAdmin(id)
  const data = await loadTournament(id)
  if (!data) notFound()

  const h = await headers()
  const origin = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}`
  const clubs = [...data.clubs].sort((a, b) => a.side.localeCompare(b.side))

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6">
      <LiveRefresh tournamentId={id} />
      <Link href="/admin" className="underline">← My tournaments</Link>
      <h1 className="font-display text-4xl font-extrabold uppercase leading-tight">{data.tournament.name}</h1>
      <p>
        {data.courts.length} courts · {data.tournament.pairs_per_round} pairs per round ·{' '}
        {clubs.map((c) => `${c.name} (${data.players.filter((p) => p.club_id === c.id).length})`).join(' vs ')}
      </p>
      <Card title="Links">
        <div className="flex flex-col gap-4">
          {clubs.map((c) => (
            <CopyLink key={c.id} label={`${c.name} captain (keep private)`} url={`${origin}/c/${c.captain_token}`} />
          ))}
          <CopyLink label="Audience" url={`${origin}/t/${id}`} />
        </div>
      </Card>
    </main>
  )
}
