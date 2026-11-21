'use server'

import { requireAdmin, requireCaptain } from '@/lib/auth'
import { validateLineup } from '@/lib/domain'
import { changed as done } from '@/lib/realtime'
import { supabaseAdmin as db } from '@/lib/supabase/admin'

/** Every action returns an error message, or undefined on success. */
type Result = string | undefined

/** The captain's club and its lineup in the latest round. */
async function currentLineup(token: string) {
  const club = await requireCaptain(token)
  const { data: round, error } = await db
    .from('rounds')
    .select('id, pairs, locked_at, tournaments!inner(status)')
    .eq('tournament_id', club.tournament_id)
    .order('number', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!round) return { club, error: 'No round is open yet.' as const, round: undefined, lineup: undefined }
  // A round left open at the end must not lock afterwards (its matches could never start).
  if ((round.tournaments as unknown as { status: string }).status === 'ended')
    return { club, error: 'The tournament has ended.' as const, round: undefined, lineup: undefined }
  const { data: lineup, error: e2 } = await db
    .from('lineups')
    .select('id, submitted_at')
    .eq('round_id', round.id)
    .eq('club_id', club.id)
    .single()
  if (e2) throw new Error(e2.message)
  return { club, round, lineup, error: undefined }
}

/** Validates and writes one slot. `partial` allows empty slots (a draft); a locked round needs all of them. */
async function writeSlot(lineupId: string, clubId: string, P: number, slot: number, ids: [string, string] | null, partial: boolean) {
  const [{ data: pairs, error: e1 }, { data: players, error: e2 }] = await Promise.all([
    db.from('lineup_pairs').select('slot, player1_id, player2_id').eq('lineup_id', lineupId),
    db.from('players').select('id').eq('club_id', clubId),
  ])
  if (e1 || e2) return { error: (e1 ?? e2)!.message }
  const before = pairs.find((p) => p.slot === slot) ?? null
  const next = pairs.filter((p) => p.slot !== slot)
  if (ids) {
    if (!Array.isArray(ids) || ids.length !== 2 || ids.some((id) => typeof id !== 'string')) return { error: 'Pick two players.' }
    const [player1_id, player2_id] = [...ids].sort() // DB check: player1_id < player2_id
    next.push({ slot, player1_id, player2_id })
  } else if (!Number.isInteger(slot) || slot < 1 || slot > P) return { error: 'Unknown slot.' }
  const invalid = validateLineup(next, P, players.map((p) => p.id), partial)
  if (invalid) return { error: invalid }

  const after = ids ? next.at(-1)! : null
  const { error } = after
    ? await db.from('lineup_pairs').upsert({ lineup_id: lineupId, ...after })
    : await db.from('lineup_pairs').delete().eq('lineup_id', lineupId).eq('slot', slot)
  return { error: error?.message, before, after }
}

/** Puts two players in one slot of the draft (`ids: null` clears it). */
export async function saveSlot(token: string, slot: number, ids: [string, string] | null): Promise<Result> {
  const { club, round, lineup, error } = await currentLineup(token)
  if (error) return error
  if (round.locked_at) return 'The round is locked.'
  if (lineup.submitted_at) return 'Unsubmit to change your lineup.'
  const w = await writeSlot(lineup.id, club.id, round.pairs, slot, ids, true)
  return w.error ?? done(club.tournament_id)
}

/** Admin edit of any club's lineup in the latest round, also after the lock; logged to audit_log. */
export async function adminSaveSlot(tournamentId: string, lineupId: string, slot: number, ids: [string, string] | null): Promise<Result> {
  await requireAdmin(tournamentId)
  const { data: lineup, error } = await db
    .from('lineups')
    .select('id, club_id, rounds!inner(id, number, pairs, locked_at, tournament_id)')
    .eq('id', lineupId)
    .eq('rounds.tournament_id', tournamentId) // the lineup must belong to the tournament the caller owns
    .maybeSingle()
  if (error) return error.message
  if (!lineup) return 'Unknown lineup.'
  const round = lineup.rounds as unknown as { id: string; number: number; pairs: number; locked_at: string | null }
  const { data: latest } = await db.from('rounds').select('id').eq('tournament_id', tournamentId).order('number', { ascending: false }).limit(1).single()
  if (latest?.id !== round.id) return 'Only the latest round can be edited.'
  if (round.locked_at && !ids) return 'The round is locked: pick a replacement pair instead of clearing it.'

  const w = await writeSlot(lineup.id, lineup.club_id, round.pairs, slot, ids, !round.locked_at)
  if (w.error) return w.error
  // shortcut: pair write + audit insert are two calls (not one SQL fn), so a failed insert leaves an unlogged edit; move into a migration if that matters
  const { error: e } = await db.from('audit_log').insert({
    tournament_id: tournamentId,
    actor: 'admin',
    action: 'lineup.edit',
    before: { round: round.number, club_id: lineup.club_id, slot, pair: w.before && [w.before.player1_id, w.before.player2_id] },
    after: { round: round.number, club_id: lineup.club_id, slot, pair: w.after && [w.after.player1_id, w.after.player2_id] },
  })
  return e ? `Saved, but the audit log failed: ${e.message}` : done(tournamentId)
}

/** The SQL function re-checks every slot is filled with distinct club players, and locks the round if both are in. */
export async function submitLineup(token: string): Promise<Result> {
  const { club, lineup, error } = await currentLineup(token)
  if (error) return error
  const { error: e } = await db.rpc('submit_lineup', { p_lineup_id: lineup.id })
  return e ? e.message : done(club.tournament_id)
}

/** Refused by the SQL function once the round is locked (the opponent submitted too). */
export async function unsubmitLineup(token: string): Promise<Result> {
  const { club, lineup, error } = await currentLineup(token)
  if (error) return error
  const { error: e } = await db.rpc('unsubmit_lineup', { p_lineup_id: lineup.id })
  return e ? e.message : done(club.tournament_id)
}
