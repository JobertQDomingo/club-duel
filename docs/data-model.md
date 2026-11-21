# Data model — Supabase Postgres

Totals, rankings and awards are **derived by queries/views**, never stored.

```sql
create extension if not exists pgcrypto;

create table tournaments (
  id              uuid primary key default gen_random_uuid(),   -- also the public audience id
  admin_id        uuid not null references auth.users(id),
  name            text not null,
  pairs_per_round int  not null default 7 check (pairs_per_round > 0),
  status          text not null default 'setup' check (status in ('setup','active','ended')),
  created_at      timestamptz not null default now(),
  ended_at        timestamptz
);

create table clubs (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  side          char(1) not null check (side in ('A','B')),
  name          text not null,
  captain_token text not null unique default encode(gen_random_bytes(24),'hex'),
  unique (tournament_id, side)
);

create table players (
  id      uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  name    text not null,
  gender  char(1) not null check (gender in ('M','F'))
);

create table courts (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  name          text not null              -- "Court 1"
);

create table rounds (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  number        int  not null,
  pairs         int  not null,             -- snapshot of pairs_per_round when opened
  locked_at     timestamptz,               -- set when both lineups submitted
  unique (tournament_id, number)
);

create table lineups (
  id           uuid primary key default gen_random_uuid(),
  round_id     uuid not null references rounds(id) on delete cascade,
  club_id      uuid not null references clubs(id) on delete cascade,
  submitted_at timestamptz,
  unique (round_id, club_id)
);

create table lineup_pairs (
  lineup_id  uuid not null references lineups(id) on delete cascade,
  slot       int  not null,
  player1_id uuid not null references players(id) on delete restrict,
  player2_id uuid not null references players(id) on delete restrict,
  primary key (lineup_id, slot),
  check (player1_id < player2_id)          -- normalized: makes repeat-pair lookup a plain equality
);

create table matches (
  id         uuid primary key default gen_random_uuid(),
  round_id   uuid not null references rounds(id) on delete cascade,
  slot       int  not null,                -- Match k = A pair k vs B pair k
  court_id   uuid references courts(id) on delete restrict,
  status     text not null default 'pending' check (status in ('pending','live','done')),
  score_a    int check (score_a >= 0),
  score_b    int check (score_b >= 0),
  started_at timestamptz,
  ended_at   timestamptz,
  unique (round_id, slot),
  check (status <> 'done' or (score_a is not null and score_b is not null and score_a <> score_b))
);
-- one live match per court
create unique index one_live_per_court on matches(court_id) where status = 'live';

create table audit_log (
  id            bigint generated always as identity primary key,
  tournament_id uuid not null references tournaments(id) on delete cascade,
  actor         text not null,             -- 'admin' | 'captain:A' | 'captain:B'
  action        text not null,             -- 'score.edit', 'lineup.edit', ...
  before        jsonb,
  after         jsonb,
  created_at    timestamptz not null default now()
);

-- All access goes through the Next.js server (service role). Deny direct client access.
alter table tournaments  enable row level security;
alter table clubs        enable row level security;
alter table players      enable row level security;
alter table courts       enable row level security;
alter table rounds       enable row level security;
alter table lineups      enable row level security;
alter table lineup_pairs enable row level security;
alter table matches      enable row level security;
alter table audit_log    enable row level security;
```

## Rules enforced where

| Rule | Where |
|---|---|
| Player only once per round | `submit_lineup` / `save_lineup` checks that the 2·P player ids are distinct (server). Hard block. |
| Repeat pair across rounds | Query, warning only: `lineup_pairs` from lineups in earlier rounds of the same tournament with the same `(player1_id, player2_id)`. |
| Can't remove a player who played | FK `on delete restrict` from `lineup_pairs` (lineups exist only in opened rounds). Server maps the FK error to a friendly message. |
| Can't remove a court that hosted a match | FK `on delete restrict` from `matches.court_id`. |
| Lock when both submitted | `submit_lineup(lineup_id)` Postgres function: sets `submitted_at`, then `select ... for update` on the round. If both lineups are submitted, sets `locked_at` and inserts `matches` rows 1..P. Atomic, so simultaneous submits are safe. |
| Unsubmit only before lock | `unsubmit_lineup`: allowed only if `rounds.locked_at is null`. |
| Start match | Requires the round to be locked, the match `pending`, and the court free (unique partial index). |
| Open next round | Requires the previous round to have all matches `done` and tournament status not `ended`. Creates the round and 2 empty lineups. Sets tournament `active`. |
| End tournament | Requires no `live` matches. Sets `status='ended'`, `ended_at`. Pending matches of an unfinished round are ignored in totals. |

## Derived data (TypeScript, `src/lib/domain.ts`)

A tournament is small (~32 players, a few dozen matches), so the server loads **all rows of one tournament** in one go (`loadTournament(id)`) and pure TS functions compute everything below. No SQL views. Unit-tested with Vitest.

- **Player results**: for each done match, each of the 4 players gets PF = their side's score and PA = the other side's score.
- **Club totals**: `sum(score_a)`, `sum(score_b)` over done matches per tournament.
- **Ranking**: group `player_results` by player: played = count, wins = `count(*) filter (where pf > pa)`, PF, PA, diff. Order: wins, diff, PF, name.
- **Awards**: from the ranking (MVP, top PF per club, max played) and from matches (`abs(score_a-score_b)` max / min).

## Visibility filter (server-side, per viewer)

| Data | Admin | Own captain | Opponent captain | Audience |
|---|---|---|---|---|
| Lineup before lock | all | own | "submitted?" only | nothing |
| Pair names of a `pending` match | yes | own side | hidden | hidden |
| Pair names of a `live`/`done` match | yes | yes | yes | yes |
| Captain tokens, audit log | yes | no | no | no |
