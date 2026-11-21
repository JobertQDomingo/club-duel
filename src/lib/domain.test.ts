import { describe, expect, test } from "vitest";
import { clubTotals, playerStats, ranking } from "./domain";
import type { LineupPair, Match, TournamentData } from "./types";

// 2 clubs × 4 players, 2 rounds × 2 slots. Round 2 slot 2 is live (must be ignored).
const names: Record<string, string> = {
  a1: "Cruz", a2: "Bea", a3: "Dan", a4: "Eli",
  b1: "Gus", b2: "Fay", b3: "Hal", b4: "Ana",
};
const pair = (lineup_id: string, slot: number, p1: string, p2: string): LineupPair => ({
  lineup_id, slot, player1_id: p1, player2_id: p2,
});
const match = (round_id: string, slot: number, status: Match["status"], a: number | null, b: number | null): Match => ({
  id: `${round_id}s${slot}`, round_id, slot, court_id: null, status,
  score_a: a, score_b: b, started_at: null, ended_at: null,
});

const data: TournamentData = {
  tournament: { id: "t", admin_id: "u", name: "T", pairs_per_round: 2, status: "active", created_at: "", ended_at: null },
  clubs: [
    { id: "cb", tournament_id: "t", side: "B", name: "Bravo", captain_token: "x" },
    { id: "ca", tournament_id: "t", side: "A", name: "Alpha", captain_token: "y" },
  ],
  players: Object.entries(names).map(([id, name]) => ({
    id, name, gender: "M", club_id: id.startsWith("a") ? "ca" : "cb",
  })),
  courts: [],
  rounds: [
    { id: "r1", tournament_id: "t", number: 1, pairs: 2, locked_at: "x" },
    { id: "r2", tournament_id: "t", number: 2, pairs: 2, locked_at: "x" },
  ],
  lineups: [
    { id: "l1a", round_id: "r1", club_id: "ca", submitted_at: "x" },
    { id: "l1b", round_id: "r1", club_id: "cb", submitted_at: "x" },
    { id: "l2a", round_id: "r2", club_id: "ca", submitted_at: "x" },
    { id: "l2b", round_id: "r2", club_id: "cb", submitted_at: "x" },
  ],
  pairs: [
    pair("l1a", 1, "a1", "a2"), pair("l1a", 2, "a3", "a4"),
    pair("l1b", 1, "b1", "b2"), pair("l1b", 2, "b3", "b4"),
    pair("l2a", 1, "a1", "a3"), pair("l2a", 2, "a2", "a4"),
    pair("l2b", 1, "b1", "b3"), pair("l2b", 2, "b2", "b4"),
  ],
  matches: [
    match("r1", 1, "done", 11, 5),
    match("r1", 2, "done", 5, 11),
    match("r2", 1, "done", 11, 9),
    match("r2", 2, "live", 3, 2),
  ],
};

describe("clubTotals", () => {
  test("sums done matches per side", () => {
    expect(clubTotals(data)).toEqual({ A: 27, B: 25 });
  });

  test("zero with no done matches", () => {
    expect(clubTotals({ ...data, matches: [] })).toEqual({ A: 0, B: 0 });
  });
});

describe("playerStats", () => {
  const byName = Object.fromEntries(playerStats(data).map((s) => [s.player.name, s]));

  test("counts done matches only", () => {
    expect(byName.Cruz).toMatchObject({ played: 2, wins: 2, losses: 0, pf: 22, pa: 14, diff: 8 });
    expect(byName.Bea).toMatchObject({ played: 1, wins: 1, losses: 0, pf: 11, pa: 5, diff: 6 });
    expect(byName.Hal).toMatchObject({ played: 2, wins: 1, losses: 1, pf: 20, pa: 16, diff: 4 });
    expect(byName.Gus).toMatchObject({ played: 2, wins: 0, losses: 2, pf: 14, pa: 22, diff: -8 });
  });

  test("leaves out players with no done match", () => {
    const r1Only = { ...data, matches: data.matches.filter((m) => m.round_id === "r1") };
    expect(playerStats(r1Only)).toHaveLength(8);
    expect(playerStats({ ...data, matches: [match("r1", 1, "done", 11, 5)] }).map((s) => s.player.id).sort())
      .toEqual(["a1", "a2", "b1", "b2"]);
  });
});

describe("ranking", () => {
  test("wins → diff → PF → name, ties broken by name", () => {
    // Ana/Bea tie on wins 1, diff 6, PF 11; Eli/Fay tie on wins 0, diff -6, PF 5.
    expect(ranking(data).map((s) => s.player.name))
      .toEqual(["Cruz", "Ana", "Bea", "Hal", "Dan", "Eli", "Fay", "Gus"]);
  });
});
