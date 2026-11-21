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

const done = async (tournamentId: string) => {
  await broadcastChanged(tournamentId)
  refresh()
  return undefined
}

/** Court + pairs actions return an error message, or undefined on success. */
export async function addCourt(tournamentId: string, form: FormData) {
  await requireAdmin(tournamentId)
  const name = String(form.get('name') ?? '').trim()
  if (!name) return 'Enter a court name.'
  const { error } = await db.from('courts').insert({ tournament_id: tournamentId, name })
  return error ? error.message : done(tournamentId)
}

export async function renameCourt(tournamentId: string, courtId: string, form: FormData) {
  await requireAdmin(tournamentId)
  const name = String(form.get('name') ?? '').trim()
  if (!name) return 'Enter a court name.'
  const { error } = await db.from('courts').update({ name }).eq('id', courtId).eq('tournament_id', tournamentId)
  return error ? error.message : done(tournamentId)
}

export async function removeCourt(tournamentId: string, courtId: string) {
  await requireAdmin(tournamentId)
  const { error } = await db.from('courts').delete().eq('id', courtId).eq('tournament_id', tournamentId)
  if (error) return error.code === '23503' ? "Already used — can't remove, rename instead." : error.message // FK restrict from matches
  return done(tournamentId)
}

/** Applies to rounds opened afterwards (rounds snapshot their own count). */
export async function setPairsPerRound(tournamentId: string, form: FormData) {
  await requireAdmin(tournamentId)
  const pairs = Number(form.get('pairs'))
  if (!Number.isInteger(pairs) || pairs < 1 || pairs > 50) return 'Pairs per round must be a whole number from 1 to 50.'
  const { error } = await db.from('tournaments').update({ pairs_per_round: pairs }).eq('id', tournamentId)
  return error ? error.message : done(tournamentId)
}
