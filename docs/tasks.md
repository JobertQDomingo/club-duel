# Tasks

Size: **S** ≈ under an hour of agent work, **M** ≈ one focused session. **[USER]** = needs you to click something (accounts, keys). **(browser)** = verify with Playwright MCP.
Docs: PRD = `docs/PRD.md`, DM = `docs/data-model.md`, ARCH = `docs/architecture.md`.

## M0 — Foundation

- [x] **T01 Scaffold app** (S). Depends: none.
  Read: ARCH §Stack.
  Do: `create-next-app` in the repo root (TS, Tailwind, ESLint, App Router, `src/`, alias `@/*`). Add `@supabase/supabase-js`, `@supabase/ssr`, and `vitest` with an `npm test` script. Replace the starter page with a one-line "Club Duel" placeholder.
  Done when: lint, test (one trivial test) and build pass.

- [x] **T02 Supabase project + clients** (S) [USER]. Depends: T01.
  Read: ARCH §Environment variables, §Request model.
  User: create a free Supabase project and paste the URL, anon key and service-role key into `.env.local`.
  Do: `.env.example` (names only). `src/lib/supabase/admin.ts` (service-role client, `import 'server-only'`), `server.ts` (SSR auth client from cookies), `browser.ts` (anon client for auth + realtime).
  Done when: a throwaway server check connects (`select 1` via rpc or a table count) and build passes.

- [x] **T03 Initial migration** (S) [USER]. Depends: T02.
  Read: DM, the SQL block only.
  Do: `supabase/migrations/0001_init.sql` from DM. User runs it in the Supabase SQL editor (or `npx supabase db push` if they prefer the CLI).
  Done when: all 9 tables exist with RLS enabled (user confirms, or check via a service-role query).

- [x] **T04 Domain types + loadTournament** (S). Depends: T03.
  Read: DM, the table list.
  Do: `src/lib/types.ts` (row types matching the SQL). `src/lib/db.ts` → `loadTournament(id)` returns `{tournament, clubs, players, courts, rounds, lineups, pairs, matches}` using parallel queries.
  Done when: build passes; a seed-free smoke call returns `null` for an unknown id.

## M1 — Core logic (pure, tested)

- [x] **T05 Totals + ranking** (M). Depends: T04.
  Read: PRD §5, DM §Derived data.
  Do: in `src/lib/domain.ts`, `clubTotals(data)`, `playerStats(data)`, `ranking(data)` (wins → diff → PF → name). Use done matches only.
  Done when: Vitest covers a 2-round fixture including a ranking tie.

- [x] **T06 Repeat pairs + lineup validation** (S). Depends: T05.
  Read: PRD §1, DM §Rules enforced where.
  Do: `pairKey(a,b)`, `repeatPairs(data, roundId, clubId, pairs)` → a set of slots that repeat an earlier round, and `validateLineup(pairs, P)` → error on a duplicate player, a missing slot, or a player from the wrong club.
  Done when: tests cover duplicate (blocked), repeat (flagged), and the normalized order of `a,b`.

- [x] **T07 Visibility filter + awards** (M). Depends: T05.
  Read: DM §Visibility filter, PRD §5 Awards.
  Do: `viewFor(data, {role:'admin'|'captain'|'audience', clubId?})` returns a JSON-safe view with hidden pairs removed (no ids or names of hidden players) and tokens stripped for non-admins. `awards(data)` returns lists, so ties keep everyone.
  Done when: a test asserts the audience/opponent JSON contains no hidden player name; award ties are tested.

## M2 — Design + admin

- [ ] **T08 Design direction** (M). Depends: T01.
  Read: PRD §2, §4.
  Do: run Impeccable to set the visual direction for 3 surfaces (admin laptop console, captain phone draft, audience phone). Output `DESIGN.md` + Tailwind theme tokens + base components (Button, Card, face-down PairCard, Badge for the ⚠ repeat warning).
  Done when: a `/dev/components` page shows the components (browser); `DESIGN.md` is committed.

- [ ] **T09 Admin auth** (M) [USER] (browser). Depends: T02.
  Read: ARCH §Request model (auth bullet).
  User: in Supabase Auth, enable email/password and add `http://localhost:3000/**` to the redirect URLs. Google is optional (needs a Google Cloud OAuth client), and can be deferred to T24.
  Do: `/login` (sign in / sign up), middleware or a layout guard protecting `/admin/**`, sign out, and a `requireAdmin(tournamentId)` helper.
  Done when: logged out → `/admin` redirects to `/login`; after login you land on `/admin`.

- [ ] **T10 Create tournament + list** (M) (browser). Depends: T04, T09.
  Read: PRD §3 step 1, §4 Admin `/admin`.
  Do: `/admin` lists my tournaments. The "New tournament" form takes the tournament name, the club A/B names, the number of courts, pairs per round, and each club's players (one per line, `Name, M|F`). A server action inserts everything. The detail page shows the captain links and the audience link with copy buttons.
  Done when: you create one with 16+16 players and 7 courts, and the links show.

- [ ] **T11 Live refresh plumbing** (S). Depends: T02.
  Read: ARCH §Request model (live updates).
  Do: `broadcastChanged(tournamentId)` (server, Realtime broadcast on `t:{id}`) and a client `<LiveRefresh tournamentId>` that subscribes and calls `router.refresh()` (debounced ~300ms).
  Done when: two browser tabs, an action in one refreshes the other (browser).

- [ ] **T12 Admin console shell** (M) (browser). Depends: T07, T10, T11.
  Read: PRD §4 Admin console.
  Do: `/admin/t/[id]` layout with a header (club totals, round status, links, regenerate captain link) and empty sections: Court board, Round panel, Rosters & courts, Results, Ranking. Renders from `viewFor(admin)`.
  Done when: the page renders the tournament created in T10 and totals show 0–0.

- [ ] **T13 Roster + court CRUD** (M) (browser). Depends: T12.
  Read: PRD §3 step 2, DM §Rules (removal guards).
  Do: server actions shared by admin and captain. Rename club; add/edit/remove a player; add/rename/remove a court; edit pairs per round (admin). Map FK restrict errors to "Already played — can't remove, rename instead". Guards: `requireAdmin` / `requireCaptain(token)` (captain = own club only).
  Done when: CRUD works; the removal guard message shows (test it after T17 for a played player).

## M3 — Rounds + blind lineup

- [ ] **T14 Round SQL functions** (M). Depends: T03.
  Read: DM §Rules enforced where.
  Do: `supabase/migrations/0002_round_fns.sql` with `open_round(tournament_id)`, `submit_lineup(lineup_id)` (row lock, sets `locked_at` and creates the match rows when both are in), `unsubmit_lineup(lineup_id)`. [USER] runs the migration.
  Done when: a script or test calls submit twice concurrently and gets exactly 1 lock and P matches.

- [ ] **T15 Captain page + draft** (M) (browser). Depends: T06, T08, T13, T14.
  Read: PRD §4 Captain.
  Do: `/c/[token]` with the club name, roster section (reuse T13), and draft for the current round: tap a slot, pick 2 available players, a ⚠ badge on repeat pairs, `saveLineup` (validated with `validateLineup`), Submit/Unsubmit, opponent status "submitted / not yet". Wrap it in `<LiveRefresh>`.
  Done when: a captain fills 7 slots, sees a repeat warning on a known repeat, submits, and unsubmits before the opponent.

- [ ] **T16 Admin round panel** (M) (browser). Depends: T12, T14, T15.
  Read: PRD §3 steps 3–4, §4 Round panel.
  Do: an "Open Round N" button (disabled until the previous round is done); both lineups side by side with submitted status and ⚠ warnings; admin lineup edit (allowed even after the lock), with each edit written to `audit_log`.
  Done when: the admin opens a round, sees both submit, and the round shows Locked.

## M4 — Courts + scoring

- [ ] **T17 Start match + court board** (M) (browser). Depends: T16.
  Read: PRD §3 step 5, DM §Rules (start match).
  Do: a `start_match(match_id, court_id)` SQL function (migration 0003, [USER] runs it). Court board: free courts show a pending-match picker (the lowest slot is the default) and Start; live courts show the match # and pairs.
  Done when: starting Match 3 on Court 1 reveals it; a second start on a busy court fails cleanly.

- [ ] **T18 Match end + score edit + audit view** (M) (browser). Depends: T17.
  Read: PRD §3 steps 6, edits paragraph.
  Do: a Match end dialog (two integers ≥ 0, not equal) sets `done`. In Results, edit a done match's score, with an audit entry for the old and new values. Show the audit log list.
  Done when: totals and ranking update after the end and after an edit; equal scores are rejected.

## M5 — Audience

- [ ] **T19 Audience page** (M) (browser). Depends: T07, T08, T11, T17.
  Read: PRD §4 Audience.
  Do: `/t/[id]` (public): club totals, current round, match cards (face-down → revealed → final score), court status, ranking. Mobile first. Uses `viewFor(audience)` only.
  Done when: in the browser, a pending match shows a face-down card, and the page source/RSC payload has no hidden names (search the response text).

- [ ] **T20 Ranking + totals on the captain page** (S) (browser). Depends: T15, T19.
  Do: reuse the audience ranking/totals components on `/c/[token]`, plus the captain's past results.
  Done when: the captain sees the live ranking and their past rounds.

## M6 — Finish

- [ ] **T21 End tournament + results** (M) (browser). Depends: T18, T19.
  Read: PRD §1 (tie), §3 step 8, §5.
  Do: an End Tournament button (disabled while a match is live, with a confirm dialog and a "currently tied" note). Results view on `/t/[id]` when ended: winner banner or Draw, a per-round tabulation with running totals, and awards from `awards()`.
  Done when: a full seeded run ends and shows the winner, tabulation and awards.

- [ ] **T22 Seed + demo script** (S). Depends: T14.
  Do: `npm run seed` creates a demo tournament (16+16 players, 7 courts) for a given admin email, optionally with 2 played rounds. Used for dry runs.
  Done when: running it twice gives two independent demo tournaments.

## M7 — Ship

- [ ] **T23 Deploy to Vercel** (S) [USER]. Depends: T21.
  User: import the GitHub repo in Vercel, add the 3 env vars, and add the Vercel URL to the Supabase Auth redirect URLs.
  Done when: the production URL works for login, captain and audience.

- [ ] **T24 Google login** (S) [USER]. Depends: T23. Optional.
  User: create a Google OAuth client and enable the Google provider in Supabase.
  Do: a "Continue with Google" button on `/login`.

- [ ] **T25 UX polish pass** (M) (browser). Depends: T21.
  Do: Impeccable critique/polish on the captain draft and the audience page at phone width; fix the top issues.

- [ ] **T26 Full dry run** (M) (browser). Depends: T22, T23.
  Do: with Playwright MCP on production, play 2 rounds end-to-end as admin + 2 captains + audience; log and fix bugs (split big fixes into new tasks at the bottom).
  Done when: no blocker bugs; the event checklist from ARCH §Free-tier caveats is noted in the README.

## Notes
<!-- Max 3 lines per task. Only what later tasks need. -->
- T01: Next 16.4 / React 19.3 / Tailwind 4 / Vitest 5 (no vitest config yet; add one with the `@/*` alias when a test first needs it). AGENTS.md is managed by `next dev`, keep it committed.
- T01: in Git Bash, run `npm test` from `cd "C:/Projects/..."` (capital C:). From `/c/...` Vitest loads twice and fails with "failed to find the current suite". PowerShell is fine.
- T02: keys are the new Supabase format: `NEXT_PUBLIC_SUPABASE_ANON_KEY` holds the publishable key (`sb_publishable_`), `SUPABASE_SERVICE_ROLE_KEY` the secret key (`sb_secret_`). Import clients from `@/lib/supabase/{admin,server,browser}`; `supabaseServer()` is async.
- T03: migrations are applied by pasting into the Supabase SQL editor (no CLI link). Verify with service role `select count` + anon insert → 42501.
- T04: `loadTournament(id)` (server-only) returns `TournamentData | null` (null for unknown or non-uuid id). Rows are unsorted except `rounds` (by number). Types in `@/lib/types`.
- T05: `clubTotals` returns `{A, B}` keyed by club side. `playerStats`/`ranking` include only players with ≥1 done match (`PlayerStat` has `player`, played, wins, losses, pf, pa, diff). Fixture in `domain.test.ts` is reusable for T06/T07.
- T06: `validateLineup(pairs, P, clubPlayerIds)` takes a 3rd arg (the club roster ids) for the wrong-club check, and requires all P slots, so it's the submit/full-save check. Returns an error string or null. `DraftPair` = `{slot, player1_id, player2_id}` in any order.
- T06: before inserting into `lineup_pairs`, sort each pair so player1_id < player2_id (DB check). `pairKey` uses the same JS string order.
- T07: `viewFor(data, viewer)` returns `TournamentView` (clubs without `captain_token` for non-admins). Domain fns accept `TournamentView`, so pages compute ranking/totals/awards from the view. Non-admin `players` = own club + players in visible pairs only (no full opponent roster).
- T07: lineup rows (incl. `submitted_at`) stay visible to everyone for the "submitted?" status; only `pairs` are filtered. `awards()` returns `{mvp, topScorer:{A,B}, iron, biggestWin, closest}` as lists.
