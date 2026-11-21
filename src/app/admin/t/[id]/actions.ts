'use server'

import { randomBytes } from 'node:crypto'
import { refresh } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { parseScores } from '@/lib/domain'
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

/** Reveals the match. The SQL function refuses a busy court or a match that isn't pending. */
export async function startMatch(tournamentId: string, courtId: string, form: FormData) {
  await requireAdmin(tournamentId)
  const matchId = String(form.get('match') ?? '')
  if (!matchId) return 'Pick a match.'
  // start_match checks the match and court share a tournament; this ties them to the one the caller owns
  const { data: court } = await db.from('courts').select('id').eq('id', courtId).eq('tournament_id', tournamentId).maybeSingle()
  if (!court) return 'Court not found.'
  const { error } = await db.rpc('start_match', { p_match_id: matchId, p_court_id: courtId })
  return error ? error.message : done(tournamentId)
}

/** The SQL function refuses while the latest round has unfinished matches. */
export async function openRound(tournamentId: string) {
  await requireAdmin(tournamentId)
  const { error } = await db.rpc('open_round', { p_tournament_id: tournamentId })
  return error ? error.message : done(tournamentId)
}

/** A match of the caller's tournament, with its round number for the audit log. */
const ownMatch = (tournamentId: string, matchId: string) =>
  db
    .from('matches')
    .select('id, slot, status, score_a, score_b, rounds!inner(number, tournament_id)')
    .eq('id', matchId)
    .eq('rounds.tournament_id', tournamentId)
    .maybeSingle()

/** Live → done with the final score; frees the court. */
export async function endMatch(tournamentId: string, matchId: string, form: FormData) {
  await requireAdmin(tournamentId)
  const s = parseScores(form.get('a'), form.get('b'))
  if (typeof s === 'string') return s
  const { data: m } = await ownMatch(tournamentId, matchId)
  if (!m) return 'Match not found.'
  const { data, error } = await db
    .from('matches')
    .update({ status: 'done', score_a: s.a, score_b: s.b, ended_at: new Date().toISOString() })
    .eq('id', matchId)
    .eq('status', 'live') // a second click, or another tab, can't overwrite a finished score
    .select('id')
  if (error) return error.message
  if (!data.length) return `Match ${m.slot} isn't live.`
  return done(tournamentId)
}

/** Corrects a finished score; old and new values go to audit_log. */
export async function editScore(tournamentId: string, matchId: string, form: FormData) {
  await requireAdmin(tournamentId)
  const s = parseScores(form.get('a'), form.get('b'))
  if (typeof s === 'string') return s
  const { data: m } = await ownMatch(tournamentId, matchId)
  if (!m) return 'Match not found.'
  if (m.status !== 'done') return `Match ${m.slot} hasn't finished.`
  if (m.score_a === s.a && m.score_b === s.b) return undefined
  const { error } = await db.from('matches').update({ score_a: s.a, score_b: s.b }).eq('id', matchId).eq('status', 'done')
  if (error) return error.message
  const round = (m.rounds as unknown as { number: number }).number
  // shortcut: score write + audit insert are two calls (not one SQL fn), so a failed insert leaves an unlogged edit; move into a migration if that matters
  const { error: e } = await db.from('audit_log').insert({
    tournament_id: tournamentId,
    actor: 'admin',
    action: 'score.edit',
    before: { round, slot: m.slot, score_a: m.score_a, score_b: m.score_b },
    after: { round, slot: m.slot, score_a: s.a, score_b: s.b },
  })
  return e ? `Saved, but the audit log failed: ${e.message}` : done(tournamentId)
}
