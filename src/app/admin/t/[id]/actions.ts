'use server'

import { randomBytes } from 'node:crypto'
import { refresh } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { broadcastChanged } from '@/lib/realtime'
import { supabaseAdmin as db } from '@/lib/supabase/admin'

/** New captain token for one club; the old link stops working. */
export async function regenerateCaptainLink(tournamentId: string, clubId: string) {
  await requireAdmin(tournamentId)
  const { error } = await db
    .from('clubs')
    .update({ captain_token: randomBytes(24).toString('hex') }) // same shape as the DB default
    .eq('id', clubId)
    .eq('tournament_id', tournamentId) // the club must belong to the tournament the caller owns
  if (error) throw new Error(error.message)
  await broadcastChanged(tournamentId)
  refresh()
}
