---
version: 1
slug: "src-app-dev-components-page-tsx"
primary_target: "src/app/dev/components/page.tsx"
related_targets: ["src/components/ui","src/app/globals.css"]
---

Scope: Club Duel base visual system, shown on /dev/components; inherited by admin console (laptop), captain draft (phone), audience live view (phone). Mode: Operate.
Job: read club totals and match state at a glance; captains build a blind lineup; admin runs courts fast.
Constraints: indoor venue; never dark by default; not cute, not corporate; hidden pairs never rendered (face-down card carries no names).
Memorable moment: the score race.

## Direction contract

THESIS: The duel runs like the printed draw sheet the director tapes to the venue wall and marks up live in two club markers. It refuses the grey SaaS scores card with one blue accent.

OWN-WORLD: Painted-wall sage ground #D6E4DA; white sheet panels with no radius; print-black #16181D hairline rules; Club A marker blue #1F5BD8 and Club B marker red #D7322B as whole fields; highlighter yellow #F2DC4A marks live; masking tape #E6D3A0 covers face-down pairs and is the only thing with a shadow. Barlow Semi Condensed uppercase heads and monumental tabular totals; Barlow body. Raises: club colour owns regions (zoo map); scale contrast ranks (Crouwel); state is a mark in a fixed cell, filled/hollow (timetable); elevation only for face-down (acetate); figures carry the page (variable specimen).

STORY: A spectator sees who leads and by how much, which match is live on which court, and that pending pairs are sealed. A captain sees ⚠ on a repeat pair before submitting.

FIRST VIEWPORT: Phone: header line (Club Duel · Round N, status). Full-bleed totals band split A blue / B red, totals ~76px. Race strip under it: two marker bars meeting at a black midline, lead line below. Then match rows: number, pair A, score or LIVE (highlighter) or Pending, pair B; pending pairs are tape strips. Primary action (admin/captain) is a solid print-black button.

FORM: Venue draw sheet, position 6 of my ordered list (assigned). seed:d1d17be69574d862. Signature interaction: the race strip bars grow (width transition) when totals change; a tape strip peels (rotate+slide out) when a pair is revealed. Motion only there, respects reduced motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
