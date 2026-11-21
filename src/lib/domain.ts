// Pure derived numbers. No IO here, so the server and tests can share it.
import type { Match, Player, TournamentData } from "./types";

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

/** Wins desc, then diff desc, then PF desc, then name. */
export function ranking(data: TournamentData): PlayerStat[] {
  return playerStats(data).sort(
    (x, y) => y.wins - x.wins || y.diff - x.diff || y.pf - x.pf || x.player.name.localeCompare(y.player.name),
  );
}
