# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Admin (tournament director):** one person on a laptop at the venue. Opens rounds, starts matches on courts, records scores, fixes mistakes. Works fast between games while people wait.
- **Captains (one per club):** on a phone, no account (token link). Build a blind lineup of P pairs per round, watch for repeat-pair warnings, submit before the opponent sees anything.
- **Audience (players and spectators):** on a phone, public link. Glance at club totals, which match is on which court, and the live ranking.

## Product Purpose

Runs a two-club pickleball "Club Duel" in Captain's Mode. It replaces paper lineup cards, court assignment, score sheets and hand tallying, and gives everyone a live view. Success: an event runs end to end with no paper, no tallying disputes, and no lineup leaks.

## Positioning

The blind lineup is the core mechanic: pairs stay face-down to the opponent and the audience until the admin starts that match on a court, then flip. The winner is the club with the most cumulative points, not match wins.

## Operating Context

- Indoor venue, normal lighting. Event-day use, between and during games.
- Built for the user's own interclub duels (one-off events, may be borrowed by other clubs). Not a multi-club SaaS.
- Official format: 16 players per club (10 men / 6 women), 7 doubles matches per round, open-ended rounds. Gender is display-only.

## Capabilities and Constraints

- Rules, flow and screens: `docs/PRD.md`. Data model: `docs/data-model.md`. Architecture: `docs/architecture.md`.
- Next.js App Router + Tailwind v4 + Supabase. Live updates via Realtime broadcast → page refresh.
- Hidden lineups must never reach audience or opponent payloads.
- Repeat pairs warn only (⚠ "These players already paired once"); same-round duplicates are blocked.
- Club tie at end shows "Tied"; ending anyway is a Draw.

## Brand Commitments

None binding. Working name "Club Duel" (not declared final). No logos or club colours supplied; club names are entered per tournament.

## Evidence on Hand

No real event data, photos or testimonials. Do not fabricate club names, results or players outside clearly fake demo/seed data.

## Product Principles

1. Never leak a hidden lineup; face-down means face-down everywhere.
2. Points decide the duel; totals are always visible and always derived.
3. Warn, don't block, unless a rule truly forbids it (same-round duplicates).
4. The admin is never stuck: anything can be corrected, and every correction is audited.
