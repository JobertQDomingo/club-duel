// Pure derived numbers. No IO here, so the server and tests can share it.
import type { LineupPair, Match, Player, TournamentData } from "./types";

export type PlayerStat = {
  player: Player;
  played: number;
  wins: number;
  losses: number;
  pf: number;
  pa: number;
  diff: number;
};

// The DB check guarantees a done match has two non-null, unequal scores.
const doneMatches = (data: TournamentData) =>
  data.matches.filter((m): m is Match & { score_a: number; score_b: number } => m.status === "done");

export function clubTotals(data: TournamentData): { A: number; B: number } {
  const totals = { A: 0, B: 0 };
  for (const m of doneMatches(data)) {
    totals.A += m.score_a;
    totals.B += m.score_b;
  }
  return totals;
}

/** Stats for every player with at least one done match. */
export function playerStats(data: TournamentData): PlayerStat[] {
  const side = new Map(data.clubs.map((c) => [c.id, c.side]));
  const lineups = new Map(data.lineups.map((l) => [l.id, l]));
  const players = new Map(data.players.map((p) => [p.id, p]));

  // `${round}:${side}:${slot}` → the two player ids in that pair
  const pairAt = new Map<string, string[]>();
  for (const p of data.pairs) {
    const l = lineups.get(p.lineup_id);
    if (l) pairAt.set(`${l.round_id}:${side.get(l.club_id)}:${p.slot}`, [p.player1_id, p.player2_id]);
  }

  const stats = new Map<string, PlayerStat>();
  for (const m of doneMatches(data)) {
    for (const [s, pf, pa] of [["A", m.score_a, m.score_b], ["B", m.score_b, m.score_a]] as const) {
      for (const id of pairAt.get(`${m.round_id}:${s}:${m.slot}`) ?? []) {
        const player = players.get(id);
        if (!player) continue;
        const st = stats.get(id) ?? { player, played: 0, wins: 0, losses: 0, pf: 0, pa: 0, diff: 0 };
        st.played++;
        if (pf > pa) st.wins++;
        else st.losses++;
        st.pf += pf;
        st.pa += pa;
        st.diff = st.pf - st.pa;
        stats.set(id, st);
      }
    }
  }
  return [...stats.values()];
}

/** A pair in a draft lineup; player order doesn't matter. */
export type DraftPair = Pick<LineupPair, "slot" | "player1_id" | "player2_id">;

/** Order-independent key for two players (lower id first, like the DB check). */
export function pairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

/** Slots in `pairs` whose two players already paired for this club in an earlier round. */
export function repeatPairs(data: TournamentData, roundId: string, clubId: string, pairs: DraftPair[]): Set<number> {
  const num = new Map(data.rounds.map((r) => [r.id, r.number]));
  const current = num.get(roundId) ?? 0;
  const earlier = new Set(
    data.lineups.filter((l) => l.club_id === clubId && (num.get(l.round_id) ?? Infinity) < current).map((l) => l.id),
  );
  const seen = new Set(data.pairs.filter((p) => earlier.has(p.lineup_id)).map((p) => pairKey(p.player1_id, p.player2_id)));
  return new Set(pairs.filter((p) => seen.has(pairKey(p.player1_id, p.player2_id))).map((p) => p.slot));
}

/** Error message for an invalid lineup of P pairs, or null if it can be saved. */
export function validateLineup(pairs: DraftPair[], P: number, clubPlayerIds: string[]): string | null {
  const slots = new Set(pairs.map((p) => p.slot));
  if (pairs.length !== P || slots.size !== P || [...slots].some((s) => !Number.isInteger(s) || s < 1 || s > P))
    return `Fill every slot 1–${P} exactly once.`;
  const ids = pairs.flatMap((p) => [p.player1_id, p.player2_id]);
  if (new Set(ids).size !== ids.length) return "A player can play only once per round.";
  if (ids.some((id) => !clubPlayerIds.includes(id))) return "Every player must be from your club.";
  return null;
}

/** Wins desc, then diff desc, then PF desc, then name. */
export function ranking(data: TournamentData): PlayerStat[] {
  return playerStats(data).sort(
    (x, y) => y.wins - x.wins || y.diff - x.diff || y.pf - x.pf || x.player.name.localeCompare(y.player.name),
  );
}
