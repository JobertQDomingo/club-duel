# Club Duel

Pickleball inter-club Captain's Mode tournament app. Next.js (App Router, TS, Tailwind) on Vercel + Supabase (Postgres, Auth, Realtime Broadcast).

- Specs: `docs/PRD.md`, `docs/data-model.md`, `docs/architecture.md`. Read only the sections your task needs.
- Work is driven by `docs/PLAYBOOK.md` + `docs/tasks.md`. Start a session with `/next`.
- All DB access is server-side with the service-role key; the browser never reads tables. Hidden lineups must never reach audience/opponent payloads.
- Derived numbers (totals, ranking, awards, visibility) live in pure functions in `src/lib/domain.ts`, with Vitest tests.
- Atomic multi-step DB ops are Postgres functions in `supabase/migrations/`.
- Checks before commit: `npm run lint`, `npm test`, `npm run build`.
