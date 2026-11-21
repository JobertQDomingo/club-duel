'use server'

import { requireAdmin, requireCaptain } from '@/lib/auth'
import { MAX_NAME, parseName, parseRoster } from '@/lib/domain'
import { changed as done } from '@/lib/realtime'
import { supabaseAdmin as db } from '@/lib/supabase/admin'

/** Admin passes the tournament id (checked against the session); a captain passes their link token. */
export type Caller = { tournamentId: string } | { token: string }

/** Every action returns an error message, or undefined on success. */
type Result = string | undefined

const PLAYED = "Already played — can't remove, rename instead."

/** The tournament and the club ids this caller may edit: both clubs for the admin, their own for a captain. */
async function scope(caller: Caller): Promise<{ tournamentId: string; clubIds: string[] }> {
  if ('token' in caller) {
    const club = await requireCaptain(caller.token)
    return { tournamentId: club.tournament_id, clubIds: [club.id] }
  }
  await requireAdmin(caller.tournamentId)
  const { data, error } = await db.from('clubs').select('id').eq('tournament_id', caller.tournamentId)
  if (error) throw new Error(error.message)
  return { tournamentId: caller.tournamentId, clubIds: data.map((c) => c.id) }
}

export async function renameClub(caller: Caller, clubId: string, form: FormData): Promise<Result> {
  const { tournamentId, clubIds } = await scope(caller)
  const name = parseName(form.get('name'))
  if (!name) return `Enter a club name (up to ${MAX_NAME} characters).`
  if (!clubIds.includes(clubId)) return 'Not your club.'
  const { error } = await db.from('clubs').update({ name }).eq('id', clubId)
  return error ? error.message : done(tournamentId)
}

/** Form field `players` holds "Name, M|F" lines (from RosterInput). */
export async function addPlayers(caller: Caller, clubId: string, form: FormData): Promise<Result> {
  const { tournamentId, clubIds } = await scope(caller)
  if (!clubIds.includes(clubId)) return 'Not your club.'
  const roster = parseRoster(String(form.get('players') ?? ''))
  if (typeof roster === 'string') return roster
  const { error } = await db.from('players').insert(roster.map((p) => ({ ...p, club_id: clubId })))
  return error ? error.message : done(tournamentId)
}

export async function editPlayer(caller: Caller, playerId: string, form: FormData): Promise<Result> {
  const { tournamentId, clubIds } = await scope(caller)
  const name = parseName(form.get('name'))
  const gender = String(form.get('gender') ?? '')
  if (!name) return `Enter a player name (up to ${MAX_NAME} characters).`
  if (gender !== 'M' && gender !== 'F') return 'Pick M or F.'
  const { data, error } = await db
    .from('players')
    .update({ name, gender })
    .eq('id', playerId)
    .in('club_id', clubIds)
    .select('id')
  if (error) return error.message
  return data.length ? done(tournamentId) : 'Player not found.'
}

export async function removePlayer(caller: Caller, playerId: string): Promise<Result> {
  const { tournamentId, clubIds } = await scope(caller)
  const { error } = await db.from('players').delete().eq('id', playerId).in('club_id', clubIds)
  if (error) return error.code === '23503' ? PLAYED : error.message // 23503: FK restrict from lineup_pairs
  return done(tournamentId)
}
