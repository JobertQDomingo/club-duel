---
name: Club Duel
description: The venue draw sheet, marked up live in two club markers.
colors:
  wall: "#d6e4da"
  sheet: "#ffffff"
  ink: "#16181d"
  ink-soft: "#4a5058"
  club-a: "#1f5bd8"
  club-b: "#d7322b"
  live: "#f2dc4a"
  tape: "#e6d3a0"
  warn: "#f08a24"
typography:
  display-total:
    fontFamily: "Barlow Semi Condensed, Barlow, sans-serif"
    fontSize: "4.5rem"
    fontWeight: 800
    lineHeight: 0.9
  headline:
    fontFamily: "Barlow Semi Condensed, Barlow, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 1.1
  title:
    fontFamily: "Barlow Semi Condensed, Barlow, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.375
    fontFeature: "tnum"
  label:
    fontFamily: "Barlow Semi Condensed, Barlow, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0.025em"
rounded:
  none: "0px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.wall}"
  button-ghost:
    textColor: "{colors.ink}"
    height: "44px"
  card:
    backgroundColor: "{colors.sheet}"
    rounded: "{rounded.none}"
    padding: "16px"
  badge-warn:
    backgroundColor: "{colors.warn}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "2px 8px"
  badge-live:
    backgroundColor: "{colors.live}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "2px 8px"
  badge-plain:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "2px 8px"
---

# Design System: Club Duel

## Overview

**Creative North Star: "The Venue Draw Sheet"**

The duel looks like the printed draw sheet a director tapes to the venue wall and marks up live in two club markers. Sage-painted wall, white sheet panels with square corners, print-black hairlines, and two marker colours that fill whole regions. State is a mark in a fixed cell (filled or hollow, highlighter for live), and pending pairs sit under masking tape. Figures carry the page: club totals are the largest thing on any screen.

Light only: indoor venue, and the user ruled out a dark theme. Not cute, not corporate: no grey SaaS score card with one blue accent, no mascots or rounded friendliness.

**Key Characteristics:**
- Club colour owns regions, never a thin accent.
- Scale contrast ranks information: monumental totals, uppercase condensed heads, plain body.
- Square sheets, ink hairlines, no radius.
- Tape is the only thing with a shadow.
- Motion only in two signature moves: race bars growing and tape peeling.

## Colors

Painted wall, white paper, print ink, two markers, a highlighter, and tape.

### Primary
- **Print Ink**: text, hairline rules, primary button fill, focus ring, race midline. The structural colour of the sheet.

### Secondary
- **Club A Marker Blue**: Club A's totals field, race bar, and pair labels. White text on it.
- **Club B Marker Red**: Club B's totals field, race bar, and pair labels. White text on it.

### Tertiary
- **Highlighter Yellow**: live state only (live badge, text selection). Ink text on it.
- **Caution Orange**: the repeat-pair warning badge only. Ink text on it.
- **Masking Tape**: covers face-down pairs. Nothing else.

### Neutral
- **Painted Wall Sage**: page ground and secondary-button hover.
- **Sheet White**: every panel (card) and the race strip track.
- **Soft Ink**: supporting copy and ghost-button hover.

### Named Rules
**The Whole Field Rule.** A club colour fills a region (totals band, race bar) or labels that club's own content. It is never a generic accent, link colour, or decoration.

**The One Meaning Rule.** Yellow means live, orange means repeat-pair warning, tape means hidden. Do not reuse them for anything else.

## Typography

**Display Font:** Barlow Semi Condensed (700/800 loaded), with Barlow and sans-serif fallback
**Body Font:** Barlow (400/600 loaded), with system-ui fallback

**Character:** A condensed uppercase sign-painter head over a plain, sturdy body. All numerals are tabular (set on `body`).

### Hierarchy
- **Display-total** (800, line-height 0.9): `clamp(3.5rem, 20vw, 4.5rem)` below `sm`, so a 3-digit total fits half of a 320px phone; 6rem from `sm`. Club totals in the score race only.
- **Headline** (800, 2.25rem, uppercase): page title.
- **Title** (700, 1.5rem, leading-none, uppercase): card titles, sitting on an ink rule.
- **Body** (400, 1rem, leading-snug): player names and copy; prose capped at `max-w-prose`.
- **Label** (700, 0.875rem, uppercase, 0.025em tracking): badges, pair labels ("Club A · Pair 4"; "Pair 4" on phones), club names over totals. Buttons use the same treatment at 1rem; the lead line uses it at 1rem without tracking.

### Named Rules
**The Figures Carry the Page Rule.** The club totals are always the largest type on screen. Nothing else uses display-total.

**The Uppercase Is for Heads Rule.** Condensed uppercase is for titles, labels, buttons, and badges. Names and sentences stay in Barlow sentence case.

## Layout

Sheets (cards) on a wall: pages are a ground of wall colour holding sheet panels with a 16px gap; never nest cards. Inside a sheet, structure comes from ink hairlines (card title rule, `border-y` around pair rows, `divide-x/y` between cells), not from boxes or fills. The score race is a two-column grid, A left, B right (right-aligned); a match row is `1fr auto 1fr` with "vs" in an ink-ruled centre cell, B side right-aligned. Rhythm: 8px between controls, 12px under a card title, 16px card padding and grid gap, 24px between page blocks. Tap targets are at least 44px tall. Phone first; lists collapse to one column and stack with horizontal dividers.

Match rows (audience, results tabulation) are built as ruled rows: pair A | match number with score, LIVE, or Pending | pair B, and the live row carries a 25% highlighter wash.

### Responsive
Breakpoints are Tailwind's `sm` (640px) and `lg` (1024px), plus one container query (`@sm`, 384px) for roster rows. Checked at 320, 375, 390, 768 and 1280 with no sideways scroll.
- **Every grid gets a base column template** (`grid-cols-1 sm:… lg:…`). Without one, the implicit track is `auto` and grows to its widest child (a link field, a roster row), which scrolls the phone sideways. Fieldsets in grids or flex rows get `min-w-0` (their default min width is min-content).
- **Admin console:** one column below `lg`; Links and Court board go to three columns at `lg` (court board two at `sm`); Round lineups, Results | Ranking, and Rosters & courts are two columns at `lg` (courts sit under Club A).
- **Roster and new-player rows** (`RosterEditor`, `RosterInput`): when the row is under 384px wide, the name field takes its own full line and the gender select, Save/Add and Remove wrap below it. Wider rows stay on one line.
- **Long names** wrap and never clip: names in pair cards, match rows and results use `wrap-break-word hyphens-auto`, and score cells use `whitespace-nowrap` so "W 21–19" and "2–0" never split. The club names over the totals take up to two lines (`line-clamp-2`), with the totals aligned to the bottom edge.
- **Dialogs** are `calc(100% - 2rem)` wide, capped at 28rem, so a phone keeps a 16px gutter.

## Elevation & Depth

Flat. Depth exists only where the sheet metaphor has a physical object stuck on top.

### Shadow Vocabulary
- **Tape lift** (`box-shadow: 0 2px 4px rgb(22 24 29 / 0.18)`): masking tape over a face-down pair. The only shadow in the system.

### Named Rules
**The Only Tape Lifts Rule.** No shadows on cards, buttons, badges, or dialogs. If something needs to stand out, use scale, a club field, or ink weight.

## Shapes

Square everywhere (0 radius): sheets, buttons, badges, bars. Borders are 1px ink. The single round form is the state mark inside a badge (10px circle, 2px ink stroke; filled = done/submitted, hollow = not yet). Tape strips sit slightly askew (-1deg rotation).

## Components

### Buttons
Solid, square, uppercase. One primary per view.
- **Shape:** square, min height 44px, 16px horizontal padding; Label type at 1rem.
- **Primary:** print-ink fill, white text; hover lightens to 85% ink.
- **Secondary:** white with a 1px ink border; hover fills with wall sage.
- **Ghost:** underlined ink text, no padding or border; hover turns soft ink. For low-stakes actions (copy link, reset).
- **Disabled:** white, 30% ink border, 40% ink text, not-allowed cursor.
- **Focus:** global 2px ink outline, 2px offset.

### Chips (Badges)
- **Style:** square, Label type, 2px 8px padding. Tones: `warn` (orange, with inline SVG warning triangle, default copy "Already paired once"), `live` (highlighter), `plain` (white, 1px ink border).
- **State:** optional `mark` draws the fixed state cell, filled or hollow.

### Cards / Containers
- **Corner Style:** square.
- **Background:** sheet white on wall sage.
- **Shadow Strategy:** none.
- **Border:** none on the panel; an optional title sits on a 1px ink bottom rule with an action right-aligned.
- **Internal Padding:** 16px. Never nest.

### Form fields
- **Inputs, selects:** square, min height 44px, 1px ink border, sheet white, body type. Label above in Label type (uppercase, bold). Readonly link fields use mono type. Name inputs (tournament, club, player, court) set `maxLength={MAX_NAME}` (60, from `@/lib/domain`, same cap as the server). Per-row inputs carry their own label ("Rename Ana Cruz"), not a repeated generic one.
- **Errors:** `<FormError>` (`@/components/ActionResult`): a `role="alert"` paragraph with a 4px ink left rule, semibold (Barlow 600 is loaded). Every form uses it. No error colour token yet.

### CopyLink
Label, then a readonly URL field (selects all on focus) beside a Secondary "Copy" button that reads "Copied" for 2s. Captain links are labelled "(keep private)".

### RosterInput
Per club: name field + gender select (blank "Gender" placeholder, so it's chosen each time) + Secondary "Add", disabled until both are set. Enter adds instead of submitting the form; focus returns to the name. Under 384px wide, the name takes its own line and gender + Add sit below it. Added players list below as a numbered, hairline-divided list with a Ghost "Remove" per row; the legend shows the count.

### PairCard (signature)
One club's pair in a match. Label line in the club's marker colour, then two names in body type; repeat pairs add the warn badge. Below `sm` the label reads "Pair 4" and "Club A · " is screen-reader only, so the label stays on one line above the tape (colour and side carry the club). Padding is 8px below `sm`, 12px from `sm`. Long names wrap and hyphenate; the card's `overflow-hidden` (for the tape) would clip them otherwise. B side is right-aligned. `names: null` is face-down: it renders the tape strip and a screen-reader "Hidden until the match starts", and **no names reach the DOM**. When names arrive on a card that mounted face-down, the tape peels (600ms, expo-out, 150ms delay: slide and rotate off).

### ScoreRace (signature)
Full-bleed totals band split into a Club A blue field and a Club B red field, each with club name (Label, up to two lines) and total (Display-total, bottom-aligned so both totals line up) in white. Below, a 14px white track holds two marker bars meeting at an ink midline that overhangs by 3px; the split shows the lead (1.5% per point, capped at 10/90), and bars animate width over 700ms expo-out. Lead line underneath ("Riverside PC lead by 8" or "Tied"), announced politely to screen readers.

## Do's and Don'ts

### Do:
- **Do** let club colours fill whole regions (totals fields, race bars) and label only that club's content.
- **Do** separate content with 1px print-ink hairlines inside white sheets.
- **Do** keep numerals tabular and make the club totals the largest type on screen.
- **Do** pass `names={null}` for any pair the viewer may not see; face-down renders tape only.
- **Do** keep motion to the race bars and the tape peel, with the global reduced-motion override intact.
- **Do** keep tap targets at least 44px.

### Don't:
- **Don't** add a dark theme; the product is light only.
- **Don't** put a shadow on anything but tape.
- **Don't** round corners on sheets, buttons, or badges.
- **Don't** use yellow, orange, or tape colour for anything except live, repeat warning, and hidden.
- **Don't** fall back to a grey SaaS score card with one blue accent, or to cute mascot-style friendliness.
- **Don't** nest cards.
