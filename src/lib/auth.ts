import 'server-only'
import { notFound, redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { supabaseServer } from '@/lib/supabase/server'

/** The signed-in admin's user id, or a redirect to /login. */
export async function requireUser(): Promise<string> {
  const { data } = await (await supabaseServer()).auth.getClaims()
  const id = data?.claims?.sub
  if (!id) redirect('/login')
  return id
}

/** The user id if they own this tournament; otherwise /login or 404 (don't reveal that it exists). */
export async function requireAdmin(tournamentId: string): Promise<string> {
  const userId = await requireUser()
  const { data, error } = await supabaseAdmin
    .from('tournaments')
    .select('admin_id')
    .eq('id', tournamentId)
    .maybeSingle()
  if (error && error.code !== '22P02') throw new Error(error.message) // 22P02: junk id → 404
  if (data?.admin_id !== userId) notFound()
  return userId
}
