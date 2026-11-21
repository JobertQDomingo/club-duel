// Pure derived numbers. No IO here, so the server and tests can share it.
import type { LineupPair, Match, Player, TournamentData, TournamentView, Viewer } from "./types";

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
const doneMatches = (data: TournamentView) =>
  data.matches.filter((m): m is Match & { score_a: number; score_b: number } => m.status === "done");

export function clubTotals(data: TournamentView): { A: number; B: number } {
  const totals = { A: 0, B: 0 };
  for (const m of doneMatches(data)) {
    totals.A += m.score_a;
    totals.B += m.score_b;
  }
  return totals;
}

/** Stats for every player with at least one done match. */
export function playerStats(data: TournamentView): PlayerStat[] {
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
export function repeatPairs(data: TournamentView, roundId: string, clubId: string, pairs: DraftPair[]): Set<number> {
  const num = new Map(data.rounds.map((r) => [r.id, r.number]));
  const current = num.get(roundId) ?? 0;
  const earlier = new Set(
    data.lineups.filter((l) => l.club_id === clubId && (num.get(l.round_id) ?? Infinity) < current).map((l) => l.id),
  );
  const seen = new Set(data.pairs.filter((p) => earlier.has(p.lineup_id)).map((p) => pairKey(p.player1_id, p.player2_id)));
  return new Set(pairs.filter((p) => seen.has(pairKey(p.player1_id, p.player2_id))).map((p) => p.slot));
}

/** Error message for an invalid lineup of P pairs, or null if it can be saved. `partial` allows empty slots (a draft). */
export function validateLineup(pairs: DraftPair[], P: number, clubPlayerIds: string[], partial = false): string | null {
  const slots = new Set(pairs.map((p) => p.slot));
  if (slots.size !== pairs.length || (!partial && slots.size !== P) || [...slots].some((s) => !Number.isInteger(s) || s < 1 || s > P))
    return `Fill every slot 1–${P} exactly once.`;
  const ids = pairs.flatMap((p) => [p.player1_id, p.player2_id]);
  if (new Set(ids).size !== ids.length) return "A player can play only once per round.";
  if (ids.some((id) => !clubPlayerIds.includes(id))) return "Every player must be from your club.";
  return null;
}

/** Wins desc, then diff desc, then PF desc, then name. */
export function ranking(data: TournamentView): PlayerStat[] {
  return playerStats(data).sort(
    (x, y) => y.wins - x.wins || y.diff - x.diff || y.pf - x.pf || x.player.name.localeCompare(y.player.name),
  );
}

/** The two names of a club's pair in a round slot, or null when the view hides it (render face-down). */
export function pairNames(data: TournamentView, clubId: string, roundId: string, slot: number): [string, string] | null {
  const lineup = data.lineups.find((l) => l.round_id === roundId && l.club_id === clubId);
  const pair = lineup && data.pairs.find((p) => p.lineup_id === lineup.id && p.slot === slot);
  if (!pair) return null;
  const name = (id: string) => data.players.find((p) => p.id === id)?.name ?? "?";
  return [name(pair.player1_id), name(pair.player2_id)];
}

/** One line for the header: where the latest round stands. */
export function roundStatus(data: TournamentView): string {
  if (data.tournament.status === "ended") return "Tournament ended";
  const r = data.rounds.at(-1); // rounds are sorted by number
  if (!r) return "No round open yet";
  if (!r.locked_at) {
    const submitted = data.lineups.filter((l) => l.round_id === r.id && l.submitted_at).length;
    return `Round ${r.number} · ${submitted} of 2 lineups submitted`;
  }
  const done = data.matches.filter((m) => m.round_id === r.id && m.status === "done").length;
  return `Round ${r.number} · ${done} of ${r.pairs} matches done`;
}

/** Mirrors `open_round`: the latest round must be locked with every match done (or none exist yet). */
export function canOpenRound(data: TournamentView): boolean {
  if (data.tournament.status === "ended") return false;
  const r = data.rounds.at(-1);
  return !r || (!!r.locked_at && data.matches.every((m) => m.round_id !== r.id || m.status === "done"));
}

/**
 * The data one viewer may see. Non-admins lose captain tokens, other clubs' pairs
 * whose match isn't live/done yet (drafts included), and players they'd only learn of from those pairs.
 */
export function viewFor(data: TournamentData, viewer: Viewer): TournamentView {
  if (viewer.role === "admin") return data;
  const own = viewer.role === "captain" ? viewer.clubId : null;
  const lineups = new Map(data.lineups.map((l) => [l.id, l]));
  const revealed = new Set(data.matches.filter((m) => m.status !== "pending").map((m) => `${m.round_id}:${m.slot}`));
  const pairs = data.pairs.filter((p) => {
    const l = lineups.get(p.lineup_id);
    return l && (l.club_id === own || revealed.has(`${l.round_id}:${p.slot}`));
  });
  const known = new Set(pairs.flatMap((p) => [p.player1_id, p.player2_id]));
  return {
    ...data,
    clubs: data.clubs.map(({ id, tournament_id, side, name }) => ({ id, tournament_id, side, name })),
    players: data.players.filter((p) => p.club_id === own || known.has(p.id)),
    pairs,
  };
}

/** Every item sharing the highest score (empty in, empty out). */
const best = <T>(xs: T[], score: (x: T) => number) => {
  const max = Math.max(...xs.map(score));
  return xs.filter((x) => score(x) === max);
};

/** Results-page awards. Each is a list so ties keep everyone; player lists follow ranking order. */
export function awards(data: TournamentView) {
  const ranked = ranking(data);
  const side = new Map(data.clubs.map((c) => [c.id, c.side]));
  const top = ranked[0];
  const done = doneMatches(data);
  const margin = (m: (typeof done)[number]) => Math.abs(m.score_a - m.score_b);
  return {
    mvp: top ? ranked.filter((s) => s.wins === top.wins && s.diff === top.diff && s.pf === top.pf) : [],
    topScorer: {
      A: best(ranked.filter((s) => side.get(s.player.club_id) === "A"), (s) => s.pf),
      B: best(ranked.filter((s) => side.get(s.player.club_id) === "B"), (s) => s.pf),
    },
    iron: best(ranked, (s) => s.played),
    biggestWin: best(done, margin),
    closest: best(done, (m) => -margin(m)),
  };
}

/** Results tabulation: each round with a done match, its done matches by slot, the round score and running club totals. */
export function tabulation(data: TournamentView) {
  const done = doneMatches(data);
  let totalA = 0;
  let totalB = 0;
  return data.rounds.flatMap((round) => {
    const matches = done.filter((m) => m.round_id === round.id).sort((x, y) => x.slot - y.slot);
    if (!matches.length) return [];
    const A = matches.reduce((s, m) => s + m.score_a, 0);
    const B = matches.reduce((s, m) => s + m.score_b, 0);
    totalA += A;
    totalB += B;
    return [{ round, matches, A, B, totalA, totalB }];
  });
}

/** One player per line, "Name, M|F". Returns the players, or an error message naming the line. */
export function parseRoster(text: string): Pick<Player, "name" | "gender">[] | string {
  const players: Pick<Player, "name" | "gender">[] = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const m = /^\s*([^,]*?)\s*,\s*([mf])\s*$/i.exec(lines[i]);
    if (!m || !m[1]) return `Line ${i + 1}: use "Name, M" or "Name, F".`;
    players.push({ name: m[1], gender: m[2].toUpperCase() as Player["gender"] });
  }
  return players.length ? players : "Add at least one player.";
}

/** Match scores from form fields: whole numbers ≥ 0 that differ (the DB check needs a winner). */
export function parseScores(a: unknown, b: unknown): { a: number; b: number } | string {
  const [x, y] = [a, b].map((v) => (typeof v === "string" && /^\s*\d+\s*$/.test(v) ? Number(v) : NaN));
  if (Number.isNaN(x) || Number.isNaN(y)) return "Enter both scores as whole numbers (0 or more).";
  if (x === y) return "Scores can't be equal: a match needs a winner.";
  return { a: x, b: y };
}
