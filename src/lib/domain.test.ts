import { describe, expect, test } from "vitest";
import { awards, clubTotals, pairKey, parseRoster, playerStats, ranking, repeatPairs, validateLineup, viewFor } from "./domain";
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

describe("pairKey", () => {
  test("same key regardless of order", () => {
    expect(pairKey("b1", "a1")).toBe(pairKey("a1", "b1"));
    expect(pairKey("a1", "b1")).not.toBe(pairKey("a1", "b2"));
  });
});

describe("repeatPairs", () => {
  // Round 3 draft for club A: slot 1 repeats r1 (a2,a1 reversed), slot 2 repeats r2, slot 3 is new.
  const r3 = { ...data, rounds: [...data.rounds, { id: "r3", tournament_id: "t", number: 3, pairs: 3, locked_at: null }] };
  const draft = [
    { slot: 1, player1_id: "a2", player2_id: "a1" },
    { slot: 2, player1_id: "a3", player2_id: "a1" },
    { slot: 3, player1_id: "a3", player2_id: "a2" },
  ];

  test("flags slots that repeat an earlier round, in any order", () => {
    expect(repeatPairs(r3, "r3", "ca", draft)).toEqual(new Set([1, 2]));
  });

  test("ignores the same and later rounds", () => {
    // In round 1, nothing is earlier; a1+a3 (round 2) is later.
    expect(repeatPairs(r3, "r1", "ca", draft)).toEqual(new Set());
  });
});

describe("validateLineup", () => {
  const club = ["a1", "a2", "a3", "a4"];
  const ok = [
    { slot: 1, player1_id: "a1", player2_id: "a2" },
    { slot: 2, player1_id: "a3", player2_id: "a4" },
  ];

  test("accepts a full lineup with distinct club players", () => {
    expect(validateLineup(ok, 2, club)).toBeNull();
  });

  test("blocks a player used twice in the round", () => {
    expect(validateLineup([ok[0], { slot: 2, player1_id: "a3", player2_id: "a1" }], 2, club)).toMatch(/once/);
    expect(validateLineup([ok[0], { slot: 2, player1_id: "a3", player2_id: "a3" }], 2, club)).toMatch(/once/);
  });

  test("blocks a missing, duplicated or out-of-range slot", () => {
    expect(validateLineup([ok[0]], 2, club)).toMatch(/slot/i);
    expect(validateLineup([ok[0], { ...ok[1], slot: 1 }], 2, club)).toMatch(/slot/i);
    expect(validateLineup([ok[0], { ...ok[1], slot: 3 }], 2, club)).toMatch(/slot/i);
  });

  test("blocks a player from the other club", () => {
    expect(validateLineup([ok[0], { slot: 2, player1_id: "a3", player2_id: "b1" }], 2, club)).toMatch(/club/);
  });
});

describe("ranking", () => {
  test("wins → diff → PF → name, ties broken by name", () => {
    // Ana/Bea tie on wins 1, diff 6, PF 11; Eli/Fay tie on wins 0, diff -6, PF 5.
    expect(ranking(data).map((s) => s.player.name))
      .toEqual(["Cruz", "Ana", "Bea", "Hal", "Dan", "Eli", "Fay", "Gus"]);
  });
});

describe("viewFor", () => {
  // Round 3 is locked with slot 1 pending (hidden); round 4 has only club A's unlocked draft.
  const secret: Record<string, string> = { a5: "Zed", a6: "Yan", a7: "Xia", a8: "Wes", b5: "Vic", b6: "Uma" };
  const full: TournamentData = {
    ...data,
    players: [
      ...data.players,
      ...Object.entries(secret).map(([id, name]) => ({ id, name, gender: "F" as const, club_id: id.startsWith("a") ? "ca" : "cb" })),
    ],
    rounds: [
      ...data.rounds,
      { id: "r3", tournament_id: "t", number: 3, pairs: 1, locked_at: "x" },
      { id: "r4", tournament_id: "t", number: 4, pairs: 1, locked_at: null },
    ],
    lineups: [
      ...data.lineups,
      { id: "l3a", round_id: "r3", club_id: "ca", submitted_at: "x" },
      { id: "l3b", round_id: "r3", club_id: "cb", submitted_at: "x" },
      { id: "l4a", round_id: "r4", club_id: "ca", submitted_at: null },
    ],
    pairs: [...data.pairs, pair("l3a", 1, "a5", "a6"), pair("l3b", 1, "b5", "b6"), pair("l4a", 1, "a7", "a8")],
    matches: [...data.matches, match("r3", 1, "pending", null, null)],
  };
  const leaks = (v: unknown, ids: string[]) =>
    ids.filter((id) => JSON.stringify(v).includes(id) || JSON.stringify(v).includes(secret[id]));

  test("admin sees everything, tokens included", () => {
    expect(viewFor(full, { role: "admin" })).toEqual(full);
  });

  test("audience gets no hidden player ids or names, and no tokens", () => {
    const v = viewFor(full, { role: "audience" });
    expect(leaks(v, Object.keys(secret))).toEqual([]);
    expect(JSON.stringify(v)).not.toContain("captain_token");
    // Live and done pairs stay visible, so ranking is unchanged.
    expect(v.pairs).toHaveLength(data.pairs.length);
    expect(ranking(v)).toEqual(ranking(full));
  });

  test("opponent captain sees own hidden pairs but not the other club's", () => {
    const v = viewFor(full, { role: "captain", clubId: "cb" });
    expect(leaks(v, ["a5", "a6", "a7", "a8"])).toEqual([]);
    expect(leaks(v, ["b5", "b6"])).toEqual(["b5", "b6"]);
    expect(JSON.stringify(v)).not.toContain("captain_token");
    // "Submitted?" stays visible for the opponent's lineups.
    expect(v.lineups.find((l) => l.id === "l4a")?.submitted_at).toBeNull();
  });

  test("own captain sees their draft and pending pairs", () => {
    const v = viewFor(full, { role: "captain", clubId: "ca" });
    expect(leaks(v, ["a5", "a6", "a7", "a8"])).toEqual(["a5", "a6", "a7", "a8"]);
    expect(leaks(v, ["b5", "b6"])).toEqual([]);
  });
});

describe("awards", () => {
  const name = (xs: { player: { name: string } }[]) => xs.map((s) => s.player.name);

  test("each award from done matches, ties keep everyone", () => {
    const a = awards(data);
    expect(name(a.mvp)).toEqual(["Cruz"]);
    expect(name(a.topScorer.A)).toEqual(["Cruz"]);
    expect(name(a.topScorer.B)).toEqual(["Hal"]);
    expect(name(a.iron)).toEqual(["Cruz", "Hal", "Dan", "Gus"]);
    expect(a.biggestWin.map((m) => m.id)).toEqual(["r1s1", "r1s2"]);
    expect(a.closest.map((m) => m.id)).toEqual(["r2s1"]);
  });

  test("MVP tie on wins, diff and PF lists all tied players", () => {
    const r1 = { ...data, matches: data.matches.filter((m) => m.round_id === "r1") };
    expect(name(awards(r1).mvp)).toEqual(["Ana", "Bea", "Cruz", "Hal"]);
  });

  test("empty lists with no done matches", () => {
    expect(awards({ ...data, matches: [] })).toEqual({ mvp: [], topScorer: { A: [], B: [] }, iron: [], biggestWin: [], closest: [] });
  });
});

describe("parseRoster", () => {
  test("parses Name, M|F lines, trimming and skipping blanks", () => {
    expect(parseRoster(" Ana Cruz , f\n\nBen, M \r\n")).toEqual([
      { name: "Ana Cruz", gender: "F" },
      { name: "Ben", gender: "M" },
    ]);
  });
  test("names the bad line", () => {
    expect(parseRoster("Ana, F\nBen")).toBe('Line 2: use "Name, M" or "Name, F".');
    expect(parseRoster("Ana, X")).toBe('Line 1: use "Name, M" or "Name, F".');
    expect(parseRoster(", M")).toBe('Line 1: use "Name, M" or "Name, F".');
  });
  test("needs at least one player", () => {
    expect(parseRoster(" \n")).toBe("Add at least one player.");
  });
});
