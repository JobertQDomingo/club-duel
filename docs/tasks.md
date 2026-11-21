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

- [x] **T08 Design direction** (M). Depends: T01.
  Read: PRD §2, §4.
  Do: run Impeccable to set the visual direction for 3 surfaces (admin laptop console, captain phone draft, audience phone). Output `DESIGN.md` + Tailwind theme tokens + base components (Button, Card, face-down PairCard, Badge for the ⚠ repeat warning).
  Done when: a `/dev/components` page shows the components (browser); `DESIGN.md` is committed.

- [x] **T09 Admin auth** (M) [USER] (browser). Depends: T02.
  Read: ARCH §Request model (auth bullet).
  User: in Supabase Auth, enable email/password and add `http://localhost:3000/**` to the redirect URLs. Google is optional (needs a Google Cloud OAuth client), and can be deferred to T24.
  Do: `/login` (sign in / sign up), middleware or a layout guard protecting `/admin/**`, sign out, and a `requireAdmin(tournamentId)` helper.
  Done when: logged out → `/admin` redirects to `/login`; after login you land on `/admin`.

- [x] **T10 Create tournament + list** (M) (browser). Depends: T04, T09.
  Read: PRD §3 step 1, §4 Admin `/admin`.
  Do: `/admin` lists my tournaments. The "New tournament" form takes the tournament name, the club A/B names, the number of courts, pairs per round, and each club's players (type a name, pick M/F, Add to a list with Remove; submitted as `Name, M|F` lines). A server action inserts everything. The detail page shows the captain links and the audience link with copy buttons.
  Done when: you create one with 16+16 players and 7 courts, and the links show.

- [x] **T11 Live refresh plumbing** (S). Depends: T02.
  Read: ARCH §Request model (live updates).
  Do: `broadcastChanged(tournamentId)` (server, Realtime broadcast on `t:{id}`) and a client `<LiveRefresh tournamentId>` that subscribes and calls `router.refresh()` (debounced ~300ms).
  Done when: two browser tabs, an action in one refreshes the other (browser).

- [x] **T12 Admin console shell** (M) (browser). Depends: T07, T10, T11.
  Read: PRD §4 Admin console.
  Do: `/admin/t/[id]` layout with a header (club totals, round status, links, regenerate captain link) and empty sections: Court board, Round panel, Rosters & courts, Results, Ranking. Renders from `viewFor(admin)`.
  Done when: the page renders the tournament created in T10 and totals show 0–0.

- [x] **T13 Roster + court CRUD** (M) (browser). Depends: T12.
  Read: PRD §3 step 2, DM §Rules (removal guards).
  Do: server actions shared by admin and captain. Rename club; add/edit/remove a player; add/rename/remove a court; edit pairs per round (admin). Map FK restrict errors to "Already played — can't remove, rename instead". Guards: `requireAdmin` / `requireCaptain(token)` (captain = own club only).
  Done when: CRUD works; the removal guard message shows (test it after T17 for a played player).

## M3 — Rounds + blind lineup

- [x] **T14 Round SQL functions** (M). Depends: T03.
  Read: DM §Rules enforced where.
  Do: `supabase/migrations/0002_round_fns.sql` with `open_round(tournament_id)`, `submit_lineup(lineup_id)` (row lock, sets `locked_at` and creates the match rows when both are in), `unsubmit_lineup(lineup_id)`. [USER] runs the migration.
  Done when: a script or test calls submit twice concurrently and gets exactly 1 lock and P matches.

- [x] **T15 Captain page + draft** (M) (browser). Depends: T06, T08, T13, T14.
  Read: PRD §4 Captain.
  Do: `/c/[token]` with the club name, roster section (reuse T13), and draft for the current round: tap a slot, pick 2 available players, a ⚠ badge on repeat pairs, `saveLineup` (validated with `validateLineup`), Submit/Unsubmit, opponent status "submitted / not yet". Wrap it in `<LiveRefresh>`.
  Done when: a captain fills 7 slots, sees a repeat warning on a known repeat, submits, and unsubmits before the opponent.

- [x] **T16 Admin round panel** (M) (browser). Depends: T12, T14, T15.
  Read: PRD §3 steps 3–4, §4 Round panel.
  Do: an "Open Round N" button (disabled until the previous round is done); both lineups side by side with submitted status and ⚠ warnings; admin lineup edit (allowed even after the lock), with each edit written to `audit_log`.
  Done when: the admin opens a round, sees both submit, and the round shows Locked.

## M4 — Courts + scoring

- [x] **T17 Start match + court board** (M) (browser). Depends: T16.
  Read: PRD §3 step 5, DM §Rules (start match).
  Do: a `start_match(match_id, court_id)` SQL function (migration 0003, [USER] runs it). Court board: free courts show a pending-match picker (the lowest slot is the default) and Start; live courts show the match # and pairs.
  Done when: starting Match 3 on Court 1 reveals it; a second start on a busy court fails cleanly.

- [x] **T18 Match end + score edit + audit view** (M) (browser). Depends: T17.
  Read: PRD §3 steps 6, edits paragraph.
  Do: a Match end dialog (two integers ≥ 0, not equal) sets `done`. In Results, edit a done match's score, with an audit entry for the old and new values. Show the audit log list.
  Done when: totals and ranking update after the end and after an edit; equal scores are rejected.

## M5 — Audience

- [x] **T19 Audience page** (M) (browser). Depends: T07, T08, T11, T17.
  Read: PRD §4 Audience.
  Do: `/t/[id]` (public): club totals, current round, match cards (face-down → revealed → final score), court status, ranking. Mobile first. Uses `viewFor(audience)` only.
  Done when: in the browser, a pending match shows a face-down card, and the page source/RSC payload has no hidden names (search the response text).

- [x] **T20 Ranking + totals on the captain page** (S) (browser). Depends: T15, T19.
  Do: reuse the audience ranking/totals components on `/c/[token]`, plus the captain's past results.
  Done when: the captain sees the live ranking and their past rounds.

## M6 — Finish

- [x] **T21 End tournament + results** (M) (browser). Depends: T18, T19.
  Read: PRD §1 (tie), §3 step 8, §5.
  Do: an End Tournament button (disabled while a match is live, with a confirm dialog and a "currently tied" note). Results view on `/t/[id]` when ended: winner banner or Draw, a per-round tabulation with running totals, and awards from `awards()`.
  Done when: a full seeded run ends and shows the winner, tabulation and awards.

- [x] **A1 Code audit + review fixes** (M). Ponytail audit of the repo and review of T19–T21 (2026-11-21, before T22).
  Fixed: (1) a round with more pairs than a club can fill could never be submitted, leaving the admin stuck → Open Round is refused with the reason (`rosterShortfall`); (2) after End tournament the court board still offered Start and an open round could still be drafted/submitted → both refused; (3) names had no length limit (spec said they did) → 60 chars, `parseName`; (4) captain roster scoping had no test → `roster-actions.test.ts`; (5) three copies of the post-write helper → `changed()` in `@/lib/realtime`; (6) placeholder smoke test deleted.
  Left as-is (decisions with `shortcut:` comments): `endTournament` live-check race, two-call audit writes, audit-log times in server timezone (see T23).

- [x] **A2 Impeccable UI audit + mobile fixes** (M) (browser). Same day. Score 14/20 → 19/20 (responsive 1 → 4).
  Fixed: admin console and New-tournament form scrolled sideways on phones (grids without a base column template); 3-digit totals overflowed the score race at 320px; long names were clipped in pair cards (tape `overflow-hidden`) and overflowed results cells; ranking numbers split across lines; roster name inputs were 50–75px wide; Barlow 600 was used but not loaded; back link under 44px; dialogs touched the screen edges; repeated generic row labels; duplicate error paragraphs → `FormError`. Rules recorded in `DESIGN.md` §Layout › Responsive.
  Not fixed (P3): captain results grid is dense at 320px; "· M" in the lineup picker can wrap; no real-device/iOS Safari or screen-reader pass (Chromium emulation only).

- [x] **T22 Seed + demo script** (S). Depends: T14.
  Do: `npm run seed` creates a demo tournament (Club A 16 + Club B 17 players, 4 courts — the real event's setup; counts stay args, not constants) for a given admin email, optionally with 2 played rounds. Used for dry runs.
  Done when: running it twice gives two independent demo tournaments.

## M7 — Ship

- [ ] **T23 Deploy to Vercel** (S) [USER]. Depends: T21.
  User: import the GitHub repo in Vercel, add the 3 env vars, and add the Vercel URL to the Supabase Auth redirect URLs.
  Done when: the production URL works for login, captain and audience.
  Check: audit-log times render in the server timezone (UTC on Vercel; `shortcut:` in the admin page). If the venue needs local time, format them on the client.

- [ ] **T24 Google login** (S) [USER]. Depends: T23. Optional.
  User: create a Google OAuth client and enable the Google provider in Supabase.
  Do: a "Continue with Google" button on `/login`.

- [ ] **T25 UX polish pass** (M) (browser). Depends: T21.
  Do: Impeccable critique/polish on the captain draft and the audience page at phone width; fix the top issues.
  Partly covered by A2 (phone layout, overflow, tap targets). Still to do: the critique/polish pass (hierarchy, copy), and a check on a real phone.

- [ ] **T26 Full dry run** (M) (browser). Depends: T22, T23.
  Do: with Playwright MCP on production, play 2 rounds end-to-end as admin + 2 captains + audience, using a 16 + 17 roster (uneven sizes, so one club benches more players per round) and 4 courts (fewer courts than pairs per round, so matches queue for a free court); log and fix bugs (split big fixes into new tasks at the bottom).
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
- T06: before inserting into `lineup_pairs`, sort each pair so player1_id < player2_id (DB check).
- T07: `viewFor(data, viewer)` returns `TournamentView` (clubs without `captain_token` for non-admins). Domain fns accept `TournamentView`, so pages compute ranking/totals/awards from the view. Non-admin `players` = own club + players in visible pairs only (no full opponent roster).
- T07: lineup rows (incl. `submitted_at`) stay visible to everyone for the "submitted?" status; only `pairs` are filtered. `awards()` returns `{mvp, topScorer:{A,B}, iron, biggestWin, closest}` as lists.
- T08: read `DESIGN.md` before UI work. Tokens are Tailwind v4 `@theme` in `globals.css` (`bg-wall`, `bg-sheet`, `text-ink`, `bg-club-a/b`, `bg-live`, `bg-tape`, `bg-warn`, `font-display`). Components in `@/components/ui/{Button,Card,Badge,PairCard,ScoreRace}`.
- T08: `PairCard names={null}` = face-down (no names in DOM); it peels its tape when names arrive on a mounted card, so keep stable React keys across `router.refresh()`. `ScoreRace` takes `{a:{name,total}, b:{name,total}}` (feed it `clubTotals`).
- T08: for T12/T19, the review suggested a ruled match row (# | pair A | score/LIVE/Pending | pair B) and an "N of M matches done" line beside the lead. No error colour token yet: add one when the first form error ships.
- T09: guard with `requireUser()` / `requireAdmin(tournamentId)` from `@/lib/auth` (404 for a tournament you don't own). `src/proxy.ts` (Next 16's middleware) refreshes the session and redirects `/admin/**` → `/login`. Session-reading pages need `export const instant = false` (cacheComponents is on); `/admin/layout.tsx` already sets it.
- T09: Supabase still has "Confirm email" ON and rejects unknown email domains, so mark test users confirmed with `auth.admin.updateUserById(id, {email_confirm:true})`. `vitest.config.mts` has the `@/*` alias; `auth.test.ts` shows how to mock `server-only`, `next/navigation` and the Supabase clients.
- T10: every session-reading page needs its own `export const instant = false`; the layout's doesn't cover the page. Create is plain inserts with a compensating `delete` of the tournament on failure (cascade), not an SQL function.
- T10: `CopyLink` (`@/components/ui/CopyLink`) for the T12 header links; origin from `headers()` (host + x-forwarded-proto). `RosterInput` (`src/app/admin/RosterInput.tsx`) is name + gender + Add, posting a hidden `players{A|B}` that `parseRoster` validates; reuse it for T13 roster add.
- T10: if `next dev` throws "Jest worker encountered 2 child process exceptions", restart it; it's a dev-server crash, not app code.
- T11: after each successful write, end the action with `changed(tournamentId)` from `@/lib/realtime` (A1: wraps `broadcastChanged` — REST `httpSend`, logs instead of throwing — plus `refresh()`). Mount `<LiveRefresh tournamentId>` (`@/components/LiveRefresh`) on any page that shows tournament data; `/admin/t/[id]` already has it.
- T11: if a stale `next dev` holds :3000 and is crashed, `npx next start -p 3001` after `npm run build` works for browser checks (localhost cookies are shared across ports).
- T12: `/admin/t/[id]` sections are `Card`s with placeholder lines (Court board, Round panel, Results, Ranking, Rosters & courts); replace the placeholder in place. Ranking is already a real table from `ranking(view)` (inline in the page; extract it for T19/T20).
- T12: `roundStatus(view)` in `domain.ts` gives the header line (latest round = `rounds.at(-1)`). Admin page actions live in `src/app/admin/t/[id]/actions.ts`; they end with `changed(id)` (imported as `done`).
- T13: `<RosterEditor caller club players>` (`@/components/RosterEditor`) is the shared club-name + roster editor; the captain page passes `caller={{ token }}`. Actions in `@/lib/roster-actions` scope by caller (`requireCaptain(token)` in `@/lib/auth` → own club only). Courts + pairs are admin-only in `admin/t/[id]/actions.ts`.
- T13: forms use `useResult()` / `<FormError>` (`@/components/ActionResult`): actions return an error string or undefined. A `<select defaultValue>` doesn't update on form reset, so key rows on their values to remount after save.
- T13: removal guard verified with a temporary lineup pair (FK 23503 → "Already played — can't remove, rename instead."). Stale `next start` servers may hold :3000/:3001; TaskStop leaves the node child alive, so kill it by port.
- T14: `db.rpc('open_round',{p_tournament_id})` → new round id; `submit_lineup`/`unsubmit_lineup` take `{p_lineup_id}`; submit returns true when it locked the round. Errors are plain `raise exception` messages (show `error.message`). Service role only (revoked from anon).
- T14: deleting a tournament with lineup pairs fails (players' restrict FK fires before the cascade); delete its `rounds` first. `node --env-file=.env.local scripts/check-round-fns.mjs` re-checks the round fns against the live DB.
- T15: captain lineup actions are in `@/lib/lineup-actions` (`saveSlot(token, slot, [id,id]|null)` upserts one slot after `validateLineup(..., partial=true)`; `submitLineup`/`unsubmitLineup` call the T14 RPCs). They act on the latest round only and refuse once submitted/locked; T16's admin edit needs its own action + audit_log.
- T15: `/c/[token]` = club band + `Draft` (`src/app/c/[token]/Draft.tsx`, slot list + picker, the 2nd pick saves) + `RosterEditor`. Repeat flags come from `repeatPairs` over saved pairs, so ⚠ shows after the save. T20 adds ranking/totals/past rounds below the draft.
- T15: LiveRefresh misses broadcasts sent in the ~1s before its channel joins (seen when clicking right after another tab loads); fine in practice. Wrap a `<fieldset>` with `min-w-0` in flex layouts, or it overflows at phone width.
- T16: `<LineupSlots>` (`@/components/LineupSlots`) is the shared slot list + picker (captain `Draft` and admin panel); pass `save(slot, ids|null)` — a server action bound in the page works. `canOpenRound(view)` mirrors `open_round`.
- T16: `adminSaveSlot(tournamentId, lineupId, slot, ids)` in `@/lib/lineup-actions` edits the latest round (also locked; clearing refused once locked) and writes `audit_log` `lineup.edit` with `{round, club_id, slot, pair}` before/after. Not atomic (shortcut comment); T18 score edits can copy the shape.
- T16: the live DB has a "T16 check 16v17" tournament (16+17 players, round 1 locked) usable for T17. The browser may hold another admin's session; sign out first.
- T17: `startMatch(tournamentId, courtId, form)` in `admin/t/[id]/actions.ts` → `start_match` RPC (0003; errors "Court is busy" / "Match N has already started"). Court board tiles are inline in the admin page; `StartMatch.tsx` is the free-court picker. Add "Match end" to the live tile in T18.
- T17: `check-round-fns.mjs` now also covers start_match. The "T16 check 16v17" tournament has Match 3 live on Court 1 and Match 1 on Court 2 (ready for T18).
- T17: stale servers hold :3000–:3002 and killing them was denied; `npx next start -p 3005` worked.
- T18: `endMatch` / `editScore(tournamentId, matchId, form)` in `admin/t/[id]/actions.ts` use `parseScores` (domain); edit writes `score.edit` `{round, slot, score_a, score_b}`. `<ScoreForm>` / `<EndMatch>` (native `<dialog>`) in `admin/t/[id]/ScoreForm.tsx`.
- T18: `loadAuditLog(id)` in `@/lib/db` is admin-only (kept out of `TournamentData`/`viewFor`). Audit times are formatted in the server's timezone (shortcut comment in the admin page).
- T18: "T16 check 16v17" now has Match 3 done (11–13, edited once) and Match 1 live on Court 2.
- T19: `/t/[id]` (`src/app/t/[id]/page.tsx`) is public (proxy doesn't match it). Reuse `<Ranking view>` (`@/components/Ranking`) and `pairNames(view, clubId, roundId, slot)` (domain; null = face-down) for T20/T21.
- T19: leak check = fetch `/t/[id]` plain + with `RSC: 1` header and search for hidden players' names/ids (none found on "T16 check 16v17").
- T20: `/c/[token]` shows ScoreRace, a Results card (locked rounds, newest first, W/L from the captain's side, opponent pair "Hidden" until started) and `<Ranking>`. A `curl -H 'RSC: 1'` alone returns empty here; the leak check uses the HTML (it carries the inline flight payload).
- T21: `endTournament` (admin actions) checks for live matches then sets `ended` (two calls, shortcut comment; no migration). `EndTournament.tsx` sits beside OpenRound; both hide once ended. Score edits still work after the end.
- T21: `tabulation(view)` (domain) = rounds with done matches + round score + running totals. `/t/[id]` swaps the round/courts cards for `Results.tsx` (banner, tabulation, awards) when ended.
- T21: "T16 check 16v17" is now ended (Alpha 26–20). Use T22's seed for fresh runs.
- A1: validate names with `parseName(form.get('name'))` (null = empty or > `MAX_NAME` 60). `OpenRound` takes `blocked: string | null` (the reason), not a boolean. T22's seed must give each club ≥ 2·P players or Open Round refuses.
- A1: `roster-actions.test.ts` shows how to mock the Supabase query chain (a recorded thenable); reuse it for other action tests.
- A2: every grid needs a base `grid-cols-1` (an implicit `auto` track scrolls phones sideways); a fieldset in a grid/flex row needs `min-w-0`. Input + buttons rows: `@container` on the row, `min-w-0 flex-1 basis-full @sm:basis-0` on the input. Name inputs get `maxLength={MAX_NAME}`; form errors only via `<FormError>`.
- A2: a crashed `next dev` on :3000 blocks a second dev server in this folder (Next 16 lock); use `next build && next start -p 30xx`. If the Playwright MCP profile is locked, drive Playwright from a script with `channel: 'chrome'`.
- T22: `npm run seed -- <admin email> [--a 16] [--b 17] [--courts 4] [--pairs 7] [--rounds N]` (`scripts/seed.mjs`). Prints admin/captain/audience paths. `--rounds` plays full rounds via the real RPCs (rotating pairs, no repeats, random 11–x scores); a round is left unopened.
- T22: the email must belong to an existing auth user (`t16-check@example.com` is the test admin). The live DB now has two "Demo 2026-11-21 08:10" tournaments (one blank, one with 2 rounds played).
- Post-A2: `pastPartners(view, roundId, clubId)` (player → partner → rounds) drives the picker's orange past-partner mark (`LineupSlots` `partners` prop, captain + admin); `repeatPairs` is built on it (`pairKey` removed). `PlayerStat.games` holds each done game (round, slot, partner, opponents, pf, pa) behind the stats; `<Ranking>` names open a native-popover stat sheet from it.
