# Architecture

## Stack (all free tier)

| Piece | Choice |
|---|---|
| App | Next.js (App Router, TypeScript), Tailwind |
| Hosting | Vercel Hobby |
| DB | Supabase Postgres (free) |
| Admin auth | Supabase Auth (email/password + Google) via `@supabase/ssr` |
| Live updates | Supabase Realtime **Broadcast** |

## Request model

```
Browser ──(server actions / route handlers)──▶ Next.js server ──(service role)──▶ Postgres
   ▲                                                │
   └──── Realtime broadcast "changed" on t:{id} ◀───┘ (sent after every mutation)
```

- **All reads and writes go through the Next.js server** using the Supabase service-role key, which stays server-only and never reaches the browser. RLS is enabled with no policies, so the anon key cannot read tables directly. This matters because hidden lineups must not leak, and table-level RLS for "reveal per match" would be fiddly.
- **Auth per request:**
  - Admin: Supabase session cookie → `user.id` must equal `tournaments.admin_id`.
  - Captain: `captain_token` from the URL → club row. A captain can mutate only their own club, roster, and the current round's lineup.
  - Audience: tournament id only, read-only, filtered.
- **Live updates:** after any mutation the server sends a Realtime broadcast `{type:'changed'}` on channel `t:{tournamentId}`. Clients subscribe with the anon key and **refetch** their filtered view (`router.refresh()` or a fetch to `/api/t/[id]/view`). No data travels over the broadcast, so nothing can leak.
- **Atomic multi-step ops** (`submit_lineup`, `unsubmit_lineup`, `start_match`, `open_round`) are Postgres functions called via `rpc`, so race conditions (both captains submitting at once, two courts starting the same match) are handled by the DB.

## Routes

| Route | Who | Purpose |
|---|---|---|
| `/login` | admin | Supabase Auth |
| `/admin` | admin | My tournaments, create |
| `/admin/t/[id]` | admin | Console |
| `/c/[token]` | captain | Roster + draft |
| `/t/[id]` | public | Audience + results |

## Security notes
- Captain token: 48 hex chars (`gen_random_bytes(24)`). "Regenerate link" replaces it.
- Validate every input on the server: ids belong to the same tournament, slot within 1..P, scores are non-negative integers and not equal, and names are trimmed and length-limited.
- `SUPABASE_SERVICE_ROLE_KEY` is only in Vercel env vars, never `NEXT_PUBLIC_*`.

## Free-tier caveats
- **Supabase pauses a free project after ~7 days of no activity.** Open the app (or resume it in the dashboard) the day before an event.
- Vercel Hobby is for non-commercial use, which fits a friendly club event.
- Load is tiny (a few dozen viewers), well within both free tiers.

## Environment variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # used only for auth + realtime subscribe
SUPABASE_SERVICE_ROLE_KEY=         # server only
```
