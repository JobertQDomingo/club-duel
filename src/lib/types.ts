// Row types matching supabase/migrations/0001_init.sql. Timestamps are ISO strings.

export type Tournament = {
  id: string
  admin_id: string
  name: string
  pairs_per_round: number
  status: 'setup' | 'active' | 'ended'
  created_at: string
  ended_at: string | null
}

export type Club = {
  id: string
  tournament_id: string
  side: 'A' | 'B'
  name: string
  captain_token: string
}

export type Player = {
  id: string
  club_id: string
  name: string
  gender: 'M' | 'F'
}

export type Court = {
  id: string
  tournament_id: string
  name: string
}

export type Round = {
  id: string
  tournament_id: string
  number: number
  pairs: number
  locked_at: string | null
}

export type Lineup = {
  id: string
  round_id: string
  club_id: string
  submitted_at: string | null
}

export type LineupPair = {
  lineup_id: string
  slot: number
  player1_id: string // always < player2_id
  player2_id: string
}

export type Match = {
  id: string
  round_id: string
  slot: number
  court_id: string | null
  status: 'pending' | 'live' | 'done'
  score_a: number | null
  score_b: number | null
  started_at: string | null
  ended_at: string | null
}

export type AuditEntry = {
  id: number
  tournament_id: string
  actor: string
  action: string
  before: unknown
  after: unknown
  created_at: string
}

export type TournamentData = {
  tournament: Tournament
  clubs: Club[]
  players: Player[]
  courts: Court[]
  rounds: Round[]
  lineups: Lineup[]
  pairs: LineupPair[]
  matches: Match[]
}
