import 'server-only'
import { supabaseAdmin as db } from '@/lib/supabase/admin'
import type { TournamentData } from '@/lib/types'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function rows<T>({ data, error }: { data: unknown; error: { message: string } | null }): T {
  if (error) throw new Error(error.message)
  return data as T
}

// Whole tournament in one parallel batch; child tables filter through empty inner embeds.
export async function loadTournament(id: string): Promise<TournamentData | null> {
  if (!UUID.test(id)) return null // URL params can be junk; Postgres would throw 22P02
  const [tournament, clubs, players, courts, rounds, lineups, pairs, matches] = await Promise.all([
    db.from('tournaments').select('*').eq('id', id).maybeSingle(),
    db.from('clubs').select('*').eq('tournament_id', id),
    db.from('players').select('*, clubs!inner()').eq('clubs.tournament_id', id),
    db.from('courts').select('*').eq('tournament_id', id),
    db.from('rounds').select('*').eq('tournament_id', id).order('number'),
    db.from('lineups').select('*, rounds!inner()').eq('rounds.tournament_id', id),
    db.from('lineup_pairs').select('*, lineups!inner(rounds!inner())').eq('lineups.rounds.tournament_id', id),
    db.from('matches').select('*, rounds!inner()').eq('rounds.tournament_id', id),
  ])
  const data = {
    tournament: rows<TournamentData['tournament'] | null>(tournament),
    clubs: rows<TournamentData['clubs']>(clubs),
    players: rows<TournamentData['players']>(players),
    courts: rows<TournamentData['courts']>(courts),
    rounds: rows<TournamentData['rounds']>(rounds),
    lineups: rows<TournamentData['lineups']>(lineups),
    pairs: rows<TournamentData['pairs']>(pairs),
    matches: rows<TournamentData['matches']>(matches),
  }
  return data.tournament ? (data as TournamentData) : null
}
