'use server'

import { refresh } from 'next/cache'
import { requireCaptain } from '@/lib/auth'
import { validateLineup } from '@/lib/domain'
import { broadcastChanged } from '@/lib/realtime'
import { supabaseAdmin as db } from '@/lib/supabase/admin'

/** Every action returns an error message, or undefined on success. */
type Result = string | undefined

/** The captain's club and its lineup in the latest round. */
async function currentLineup(token: string) {
  const club = await requireCaptain(token)
  const { data: round, error } = await db
    .from('rounds')
    .select('id, pairs, locked_at')
    .eq('tournament_id', club.tournament_id)
    .order('number', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!round) return { club, error: 'No round is open yet.' as const, round: undefined, lineup: undefined }
  const { data: lineup, error: e2 } = await db
    .from('lineups')
    .select('id, submitted_at')
    .eq('round_id', round.id)
    .eq('club_id', club.id)
    .single()
  if (e2) throw new Error(e2.message)
  return { club, round, lineup, error: undefined }
}

async function done(tournamentId: string): Promise<Result> {
  await broadcastChanged(tournamentId)
  refresh()
  return undefined
}

/** Puts two players in one slot of the draft (`ids: null` clears it). */
export async function saveSlot(token: string, slot: number, ids: [string, string] | null): Promise<Result> {
  const { club, round, lineup, error } = await currentLineup(token)
  if (error) return error
  if (round.locked_at) return 'The round is locked.'
  if (lineup.submitted_at) return 'Unsubmit to change your lineup.'

  const [{ data: pairs, error: e1 }, { data: players, error: e2 }] = await Promise.all([
    db.from('lineup_pairs').select('slot, player1_id, player2_id').eq('lineup_id', lineup.id),
    db.from('players').select('id').eq('club_id', club.id),
  ])
  if (e1 || e2) return (e1 ?? e2)!.message
  const next = pairs.filter((p) => p.slot !== slot)
  if (ids) {
    if (!Array.isArray(ids) || ids.length !== 2 || ids.some((id) => typeof id !== 'string')) return 'Pick two players.'
    const [player1_id, player2_id] = [...ids].sort() // DB check: player1_id < player2_id
    next.push({ slot, player1_id, player2_id })
  } else if (!Number.isInteger(slot) || slot < 1 || slot > round.pairs) return 'Unknown slot.'
  const invalid = validateLineup(next, round.pairs, players.map((p) => p.id), true)
  if (invalid) return invalid

  const { error: e3 } = ids
    ? await db.from('lineup_pairs').upsert({ lineup_id: lineup.id, ...next.at(-1)! })
    : await db.from('lineup_pairs').delete().eq('lineup_id', lineup.id).eq('slot', slot)
  return e3 ? e3.message : done(club.tournament_id)
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
