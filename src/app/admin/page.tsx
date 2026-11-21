import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { requireUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NewTournamentForm } from './NewTournamentForm'

export const metadata = { title: 'My tournaments · Club Duel' }
export const instant = false // reads the session cookie

export default async function AdminHome() {
  const userId = await requireUser()
  const { data: tournaments, error } = await supabaseAdmin
    .from('tournaments')
    .select('id, name, status, created_at')
    .eq('admin_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6">
      <h1 className="font-display text-4xl font-extrabold uppercase leading-tight">My tournaments</h1>
      <Card>
        {tournaments.length ? (
          <ul className="divide-y divide-ink/20">
            {tournaments.map((t) => (
              <li key={t.id}>
                <Link href={`/admin/t/${t.id}`} className="flex min-h-11 items-center justify-between gap-4 py-2 font-semibold hover:underline">
                  {t.name}
                  <span className="font-display text-sm uppercase tracking-wide text-ink-soft">{t.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>No tournaments yet. Create your first one below.</p>
        )}
      </Card>
      <Card title="New tournament">
        <NewTournamentForm />
      </Card>
    </main>
  )
}
