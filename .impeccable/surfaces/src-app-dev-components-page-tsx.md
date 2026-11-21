---
version: 1
slug: "src-app-dev-components-page-tsx"
primary_target: "src/app/dev/components/page.tsx"
related_targets: ["src/components/ui","src/app/globals.css","src/app/admin/t/[id]/page.tsx","src/app/c/[token]/page.tsx","src/app/t/[id]/page.tsx"]
---

Scope: Club Duel visual system and the three role pages: admin console (laptop), captain draft (phone), audience live view (phone); /dev/components shows the base system. Mode: Operate.
Job: read club totals and match state at a glance; captains build a blind lineup; admin runs courts fast. Each role page is one page whose sections are tabs (user request): Admin Courts · Lineups · Results · Ranking · Setup; Captain Lineup · Results · Ranking · Roster; Audience Live · Ranking (Live becomes Results after the end). Scoreboard stays above the tabs.
Constraints: indoor venue, light theme; hidden pairs never rendered (face-down card carries no names). Kept from the old system by user choice: the score race bars and the face-down reveal (now a card flip).
Benchmarks the user named: Apple Sports, FotMob / Sofascore, EA FC / NBA 2K companion apps.
Memorable moment: the scoreboard header with the race bar.

## Direction contract

THESIS: Club Duel as a polished sports-scores app: a match-header scoreboard on top, segmented tabs under it, every section one tap away on one page. It refuses the stacked wall of panels and any themed costume.

OWN-WORLD: Cool light ground #F3F5F8, white cards with 16px radius on 1px #E5E7EB hairlines, ink #111827, soft ink #565E6C. Club A blue #1D4ED8 and Club B red #DC2626 as crest monograms, race bars and pair labels. Live is green (pill plus pulsing dot), repeat warning is amber, a hidden pair is a club-tinted card back with a lock. Inter throughout; totals 800 tabular at the top of the scale.

STORY: A spectator sees who leads and by how much, then the Live tab says which match is on which court, with pending pairs as sealed card backs. A captain builds the lineup in the Lineup tab and sees the amber repeat warning before submitting. The admin runs courts from the Courts tab without scrolling past stacked panels.

FIRST VIEWPORT: Laptop admin: back link and tournament name; white scoreboard card with crest and club name left, "112 – 104" centred at about 56px, club right; race bar under it, lead line and round status. Sticky segmented tabs. Courts tab: court cards in a row, live chip, both pairs, End match; free courts get a match select and primary Start; the round's match strip below. Phone: same header, tabs scroll sideways.

FORM: Category standard (canon), chosen by the user over the dealt hand. seed:12e7d3bcfe15e3c6. Signature motion: totals count up and race bars grow when a score lands; a face-down pair card flips when its match starts; the live dot pulses. Reduced motion respected.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
