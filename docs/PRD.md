# PRD — Interclub Tournament Manager (Captain's Mode)

Web app for a two-club pickleball "Club Duel" run in Captain's Mode. It replaces paper lineup cards, court assignment, score sheets and tallying, and gives the audience a live view.

## 1. Tournament rules (as implemented)

- Two clubs (A and B). Each has one captain and N players (official format: 16 players, 10 men / 6 women; the real event has Club A = 16, Club B = 17, so rosters can differ in size). Gender is recorded **for display only**; there are no gender rules for pairs.
- Play happens in **rounds**. Each round has `P` doubles matches (`pairs_per_round`, default 7, set by the admin). Match *k* = Club A Pair *k* vs Club B Pair *k*.
- The number of rounds is **open-ended**: the admin opens rounds until they end the tournament.
- **Winner = highest cumulative points scored across all finished matches.** Match wins do not decide the winner.
- A match result is **one game with two scores** (e.g. 11–7). Any non-negative integers are allowed; **ties are not allowed**. The winner of the match is the higher score.
- **Repeat pairs:** two players who already paired in an earlier round *should not* pair again. The app **warns only** (captain and admin both see "These players already paired once"). It never blocks.
- **Same-round duplicates are blocked:** a player can appear in only one pair per round. Sitting out is allowed.
- **Club tie at the end:** the app shows "Tied". The admin can open another round as a tiebreaker. If they end the tournament anyway, the result is a **Draw**.

## 2. Roles

| Role | Access | Device |
|---|---|---|
| Admin | Supabase Auth login (email/password or Google). One admin per tournament (the creator). | Laptop |
| Captain | Unguessable token URL per club (`/c/{token}`). No account. Admin can regenerate the link. | Phone |
| Audience | Public read-only URL (`/t/{tournamentId}`). | Phone |

## 3. Flow

1. **Create.** Admin enters Club A name, Club B name, number of courts, pairs per round (default 7), and each club's players (name + gender), added one at a time: type the name, pick M or F, click Add (or press Enter); each listed player can be removed before creating. The app creates both captain links and the audience link.
2. **Roster edits.** Captains can rename their club and add, edit or remove their own players at any time. The admin can edit everything. **A player who has played a match cannot be removed**, only renamed. The same rule applies to courts.
3. **Open round.** Admin clicks "Open Round N". This is only possible when the previous round has no pending or live matches, and when each club has at least 2·P players (each player plays once per round, so a smaller club could never submit). The disabled button says why.
4. **Blind lineup.** Each captain fills Pair 1…P by picking 2 players per slot. They see repeat-pair warnings inline, and same-round duplicates are prevented. All slots must be filled to submit. A captain can **unsubmit** until the opponent submits. When both have submitted, the round is **locked** and only the admin can edit lineups after that.
5. **Rolling reveal.** Once the round is locked, the admin sees free courts and pending matches (the next match number is suggested), picks one, and clicks **Start** on a court. That match's pair cards flip to show names for everyone. Unstarted matches stay **face-down** for the audience and for the opposing captain.
6. **Match end.** Admin clicks **Match end** on a live court and enters the Club A and Club B scores. The court becomes free. Totals and rankings update live.
7. **Repeat** steps 5–6 until all P matches are done, then open the next round (step 3).
8. **End tournament.** Disabled while any match is live. A confirm dialog appears. The audience view then reveals the winning club (or Draw), the full tabulation, and the awards. After the end, no match can start and captains can no longer save or submit lineups; the admin can still correct scores, lineups and rosters.

The admin can edit anything at any time: club names, rosters, courts, pairs per round (applies to rounds opened afterwards), lineups (even of started matches), and finished scores. Every admin correction to a lineup or score is written to an **audit log** (who, when, old → new). Totals recompute from data and are never stored.

## 4. Screens

### Admin (laptop)
- **/admin**: list of my tournaments and a "New tournament" form.
- **/admin/t/[id]**: console with these sections:
  - Header: club totals, round status, End Tournament button, copy captain and audience links, regenerate captain link.
  - **Court board**: one tile per court (free / live with match #). Free court: pick a pending match, then Start. Live court: Match end, which opens score entry.
  - **Round panel**: both lineups side by side with submitted status and repeat-pair warnings. Edit lineup. Open next round.
  - **Rosters and courts**: CRUD (with the removal guard).
  - **Results**: all matches with scores (editable), audit log.
  - Live player ranking.

### Captain (phone): /c/[token]
- Club name (editable), roster (CRUD).
- **Draft**: current round slots 1…P. Tap a slot, then pick 2 players from the available list (players already used this round are disabled). A repeat pair shows a ⚠ badge. Submit / Unsubmit buttons. Opponent status shows only "submitted / not yet".
- Their own past lineups and results. Opponent pairs appear only once those matches have started.
- Live ranking and club totals.

### Audience (phone): /t/[id]
- Club totals (live), current round, matches as cards (face-down → revealed → final score), court status.
- Live player ranking.
- After the end: winner banner (or Draw), tabulation (per round: each match, pairs, scores, running club totals), awards.

## 5. Ranking and awards

**Player stats** (finished matches only): played, wins, losses, points for (their pair's score), points against, diff = PF − PA.

**Live ranking order**: wins desc, then diff desc, then PF desc, then name.

**Awards** (computed on the results page; on a tie, list everyone tied):
- **MVP**: top of the ranking order above (single overall award).
- **Top scorer per club**: highest PF within each club.
- **Iron player**: most matches played.
- **Biggest win**: match with the largest score margin.
- **Closest match**: match with the smallest score margin.

## 6. Out of scope (v1)
Live point-by-point scoring, referee links, co-admins, gender slot rules, score target validation, private audience links, TV layout, notifications, more than 2 clubs.
