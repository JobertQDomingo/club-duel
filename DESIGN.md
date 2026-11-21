---
name: Club Duel
description: A sports-scores app for one inter-club duel. Scoreboard on top, tabs below, every section one tap away.
colors:
  page: "#f3f5f8"
  card: "#ffffff"
  line: "#e5e7eb"
  ink: "#111827"
  ink-soft: "#565e6c"
  club-a: "#1d4ed8"
  club-b: "#dc2626"
  live: "#16a34a"
  live-ink: "#166534"
  live-bg: "#dcfce7"
  warn: "#d97706"
  warn-ink: "#92400e"
  warn-bg: "#fef3c7"
typography:
  display-total:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.025em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  score:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.33
    letterSpacing: "-0.025em"
    fontFeature: "tnum"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  button:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.25
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.25
rounded:
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card}"
    typography: "{typography.button}"
    rounded: "{rounded.xl}"
    padding: "0 16px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.xl}"
    padding: "0 16px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.page}"
  button-ghost:
    textColor: "{colors.ink-soft}"
    typography: "{typography.button}"
    rounded: "{rounded.xl}"
    padding: "0 12px"
    height: "44px"
  card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.2xl}"
    padding: "16px"
  field:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "0 12px"
    height: "44px"
  tab:
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.xl}"
    padding: "0 20px"
    height: "44px"
  tab-active:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
  badge-live:
    backgroundColor: "{colors.live-bg}"
    textColor: "{colors.live-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-warn:
    backgroundColor: "{colors.warn-bg}"
    textColor: "{colors.warn-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-plain:
    textColor: "{colors.ink-soft}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  crest-a:
    backgroundColor: "{colors.club-a}"
    textColor: "{colors.card}"
    rounded: "{rounded.full}"
    size: "36px"
  crest-b:
    backgroundColor: "{colors.club-b}"
    textColor: "{colors.card}"
    rounded: "{rounded.full}"
    size: "36px"
  dialog:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.2xl}"
    padding: "20px"
    width: "min(28rem, calc(100% - 2rem))"
---

# Design System: Club Duel

## Overview

**Creative North Star: "The Match Centre"**

Club Duel reads like the match page of a mainstream sports-scores app (the Apple Sports, FotMob and Sofascore family, and the EA FC / 2K companion apps): a white scoreboard card at the top with crests, club names and the two totals, a race bar that shows the lead, and a sticky segmented control under it. Each role (admin, captain, audience) gets one page, and its sections are tabs rather than a stack of panels. Nothing is dressed up as a theme. The polish comes from canon details done well: tabular totals that count up, a dimmed trailing score, green only for live, card backs for hidden pairs.

The ground is a cool light grey with white cards on 1px hairlines and 16px corners. It is light because the app is used inside a bright indoor venue. Density is medium. Rows are at least 44px tall, and lists run edge to edge inside their card, so a phone shows a lot without feeling cramped. Colour is rationed so each colour has one meaning. The two club colours label that club's things, green means a match is on, and amber means you should look twice.

**Key Characteristics:**
- Scoreboard card first, sticky segmented tabs second, one page per role.
- Cool grey ground, white 16px-radius cards on 1px hairlines; flat at rest.
- One meaning per colour: club blue/red, live green, caution amber. Errors stay neutral.
- Inter throughout. The totals are the heaviest and largest type, and the only figures that animate.
- Hidden pairs are striped card backs with a lock. Their names never reach the DOM.

## Colors

A neutral sports-app frame (cool grey, white, near-black ink) carrying two club colours and two status colours.

### Primary
- **Scoreboard Ink** (ink): text, the primary button fill, the race-bar centre tick, the focus ring, and the "W" chip in a captain's own results. It is the app's structural colour; there is no separate brand accent.

### Secondary
- **Club A Blue** (club-a): Club A's crest, its share of the race bar, its pair labels ("Pair 3"), the colour of a winning Club A score, the captain header band, the winner banner, award winner fields, the winning pair cell in award match rows, and the small club dot in the ranking and lineup headers.
- **Club B Red** (club-b): the same roles for Club B.

### Tertiary
- **Live Green** (live, with live-ink text on live-bg): match in progress, and nothing else. It appears as the pulsing dot (in the Live badge and on a tab), the pill fill, the 60% wash on a live match row, and the live court tile and match-strip tile (live-bg fill with a 30% live border).
- **Caution Amber** (warn, with warn-ink text on warn-bg): mainly the repeat-pair warning. It covers the warning badge with its triangle icon, the past-partner fill in the player picker (warn-bg with a 40% warn border) and the "Round 1" badge on that button. The one other use is the tie caution in the End tournament dialog.

### Neutral
- **Venue Grey** (page): the page ground, the sticky tab bar's backing, hover and expanded row fills, the open picker tray, the readonly link field, and the inline info notes.
- **Card White** (card): cards, dialogs, popovers, the active tab, and tiles.
- **Hairline** (line): card borders, row dividers, the race-bar track, and field borders at rest.
- **Soft Ink** (ink-soft): labels, metadata ("Match 3", "Round 2 · Match 1"), empty states, the trailing total, inactive tabs, and ghost buttons.
- **Ink tints**: 6% ink is the fill for the tab strip, the plain badge, the loser chip and the error note. 5% ink is the ghost hover fill, and 25% ink is the hover border on fields and secondary buttons. Selection is a pale blue (#dbe4ff) and the scrollbar thumb is #c3c8d0.

### Named Rules
**The One Meaning Rule.** Green means live. Amber means caution, which is mainly the repeat pair. Blue and red mean "this club's". Do not reuse any of them as decoration, a link colour, or a generic accent.

**The Neutral Error Rule.** There is no error colour. A form error is a 6% ink note with a circled "!" icon and semibold text, announced as an alert. Red belongs to Club B, so red text would read as "Club B".

**The Winner Takes Its Colour Rule.** In neutral views (audience, admin, tabulation), a finished match score is set in the winning club's colour. In a captain's own view the result is a W/L chip instead: ink fill for W, 6% ink for L.

## Typography

**Display Font:** Inter (next/font, `--font-inter`), with system-ui and sans-serif fallback
**Body Font:** Inter
**Label/Mono Font:** Inter for labels. The system monospace face is used only for the readonly captain and audience URLs.

**Character:** One sturdy neo-grotesque used in a scores-app way. Weight and size create the hierarchy (800 for figures, 700 for headings, 600 for labels and buttons, 400 for names and copy), and headings carry slightly tight tracking.

### Hierarchy
- **Display-total** (800, 2.5rem; 3.5rem once the scoreboard card is at least 48rem wide, line-height 1, tight tracking, tabular): the two club totals in the scoreboard. Nothing else is this heavy and this large.
- **Headline** (700–800, 1.875rem, tight): page titles ("My tournaments", the login wordmark) and the winner banner ("Riverside PC win"). The tournament name in the scoreboard is a smaller headline (1.25rem, 1.5rem from 640px).
- **Title** (700, 1.125rem, leading-tight, tight): card titles, court names, section headings on the ground ("Courts", "Round 2 matches").
- **Score** (800, 1.5rem, tabular, tight): finished scores in match rows. Results and the match strip use 1.25rem / 1.125rem at 700–800, and award match rows use 1.875rem.
- **Body** (400, 1rem, 1.5): copy and names. Names in pair cards and the picker are 0.9375rem leading-snug. Prose is capped at `max-w-prose`.
- **Button** (600, 0.9375rem): buttons. Tabs use 0.8125rem on phones and 0.875rem from 640px.
- **Label** (600, 0.75rem, sentence case): pair labels, badges, metadata labels ("Match 3"), table headers, round/match captions.

### Named Rules
**The Figures Lead Rule.** The scoreboard totals are always the heaviest, largest type on the page. Other scores step down (1.5rem and below).

**The Tabular Where It Counts Rule.** `tabular-nums` applies only to scores, totals, stats, the ranking table, stat sheets, the score inputs and audit timestamps, never to the whole body. Negative numbers use the true minus sign (U+2212), never a hyphen.

**The No Kicker Rule.** No eyebrow or kicker line above a heading. Context goes in the heading itself or in a pill beside it. For example, the captain header is the club name with a "Captain" pill, not "CAPTAIN" over the name. Small metadata labels belong above a row or value, never above a page or card title.

## Layout

Phone first, and a single column until the content earns more. Every role page follows the same order inside a centred container (audience `max-w-3xl`, captain `max-w-xl`, admin `max-w-6xl`, admin home `max-w-4xl`, login `max-w-md`): the scoreboard card, the sticky segmented tabs, then the active tab's content. Blocks are spaced 12px apart on the page and 16px apart inside a tab panel, with a 16px page gutter.

- **Tabs, not stacks.** A role page's sections are tabs: admin has Courts, Lineups, Results, Ranking and Setup; the captain has Lineup, Results, Ranking and Roster; the audience has Live (or Results once the tournament has ended) and Ranking. Inactive panels stay mounted and hidden.
- **Flush lists inside cards.** Row lists that carry their own padding, hover fills or a live wash run edge to edge: the list pulls out by the card padding (-16px, -20px from 640px), rows pad back in by the same amount, and the list is ruled with `border-y` plus dividers. When it is the last thing in the card it drops its bottom border so the card's edge closes it. Examples are lineup slots, audience match rows, roster and court rows, tabulation rows, and the court card's pair row. Plain text lists (finished matches, audit log, captain results, admin home) use dividers inset within the padding, with the first and last rows trimmed.
- **Tiles sit on the ground.** Tile grids (court cards on the Courts tab, the round match strip, audience court tiles) sit directly on the page ground under a Title heading, never inside a card. Cards are never nested.
- **Match row.** `1fr auto 1fr`: Club A's pair on the left, a centre cell with "Match N" and the score, the Live pill or "Pending", and Club B's pair right-aligned.
- **Rhythm.** Controls are 8px apart. There are 12px under a card title, 16px of card padding (20px from 640px; 24px on the scoreboard), and a 16px grid gap. Tile grids use an 8px gap.
- **Tap targets** are at least 44px tall. Lineup slots and list links are at least 56px.

### Responsive
Breakpoints are Tailwind's `sm` (640px), `lg` (1024px) and `xl` (1280px), plus container queries: the scoreboard (`@3xl`, 48rem), court cards and roster rows (`@sm`, 24rem) and award winner fields (`@3xs`, 16rem). It is checked at 320px with no sideways scroll.
- **Every grid gets a base column template** (`grid-cols-1 sm:… lg:…`). An implicit `auto` track grows to its widest child (a link field, a roster row) and scrolls the phone sideways. Grid and flex children that hold text get `min-w-0`.
- **Admin:** court cards are 1, 2 and then 4 columns (sm, xl). The match strip is 2, 4 and then 7 columns. Lineups, rosters and courts are 2 columns at `lg`, and Results / Audit log split 3:2 at `lg`.
- **Audience:** court tiles are 2 columns, then 4 from 640px.
- **Tabs:** full-width segments on phones that scroll sideways when they overflow, with the active tab slid to the middle of the strip (the page itself never scrolls). From 640px the strip shrinks to fit its content.
- **Roster and new-player rows:** below 24rem of row width the name field takes its own line, and gender, Save and Remove wrap beneath it.
- **Long names** (up to `MAX_NAME`, 60 characters) wrap in full and never clip or truncate, except the secondary club line in the ranking. Names in flex, grid or table cells use `wrap-anywhere` (it lowers min-content, so even a single 35-letter word breaks instead of widening the row); block text uses `wrap-break-word hyphens-auto`; pair columns carry `min-w-0`. Scores and W–L cells are `whitespace-nowrap`, so "21–19" never splits. Badges wrap only between words (`wrap-break-word`), so a club name in a badge wraps and a short label never splits mid-word.
- **Audience match rows:** from `sm`, pair A | match info | pair B, with the middle column capped at 10rem so a long court name wraps there. Below `sm`, the match info takes its own line above the two pairs, so each pair gets half the row.
- **Pair labels** read "Pair 4" on phones. "Club A · " is screen-reader only below 640px.
- **Dialogs and popovers** are `calc(100% - 2rem)` wide, capped at 28rem, so a phone keeps a 16px gutter.

## Elevation & Depth

The interface is flat at rest. Cards are separated from the grey ground by tone and a 1px hairline, not by a shadow. Shadows mark only two things: the selected segment lifting off the tab strip, and modal layers floating over a dimmed page.

### Shadow Vocabulary
- **Segment lift** (`box-shadow: 0 1px 3px rgb(17 24 39 / 0.12)`): the active tab in the segmented control.
- **Overlay** (`box-shadow: 0 12px 40px rgb(17 24 39 / 0.22)`, backdrop 40% ink): the End match and End tournament dialogs and the ranking stat-sheet popover.

### Named Rules
**The Hairline Not Shadow Rule.** Cards, tiles, buttons, badges and fields never cast a shadow. To make something stand out, use a status fill (live-bg), a club colour, or weight and size.

## Shapes

The corners are soft and consistent. Containers are 16px (cards, the scoreboard, dialogs, popovers, the tab strip, the winner banner). Controls and tiles are 12px (buttons, fields, tabs, court and match tiles, picker buttons, award winner fields, inline notes). Small fills are 8px (card backs, the W/L chip, the Edit toggle). Fully round shapes are pills and circles: badges, crests, status and club dots, the race-bar track, and its centre tick. Borders are always 1px, in hairline grey at rest and 25–30% ink on hover. A badge's state mark is an 8px circle with a 1.5px current-colour stroke: filled means done or submitted, hollow means not yet or free.

## Components

### Buttons
Solid, rounded, and quiet apart from the one primary per view.
- **Shape:** 12px radius, at least 44px tall, 600 weight at 0.9375rem, with an 8px gap for an optional icon.
- **Primary:** ink fill with white text, 16px horizontal padding. Hover deepens to 85% ink. Used for Start match, Submit lineup and Save new players.
- **Secondary:** white with a hairline border. Hover gives a 25% ink border and a grey fill. Used for Copy, Save, End match and End tournament.
- **Ghost:** soft-ink text with 12px padding. Hover gives a 5% ink fill with ink text. Used for Sign out, Remove, Close, Cancel and Clear pair.
- **Disabled:** 40% opacity and a not-allowed cursor.
- **Focus:** global 2px ink outline at a 2px offset.

### Chips (Badges)
- **Style:** pill, Label type, 2px × 10px padding, `max-w-full`, wraps between words only.
- **Tones:** `live` (live-bg / live-ink, with a pulsing green dot), `warn` (warn-bg / warn-ink, with an amber triangle icon, default copy "Already paired once"), and `plain` (6% ink / soft ink: "Free", "Locked", "Submitted", "Not yet").
- **State:** an optional `mark` adds the filled or hollow state circle.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** card white on venue grey.
- **Shadow Strategy:** none (see Elevation).
- **Border:** 1px hairline.
- **Internal Padding:** 16px, 20px from 640px. The optional title is a Title-type heading with an action right-aligned and 12px below it. Never nest cards.

### Inputs / Fields
- **Style:** one shared look for text inputs and selects. 44px tall, 12px radius, hairline border, card white, 12px padding, 1rem ink text, soft-ink placeholder. The label sits above in 0.875rem/600. Name inputs set `maxLength` to `MAX_NAME` (60). Per-row inputs carry their own label ("Rename Ana Cruz").
- **Focus:** the global ink outline. Hover is a 25% ink border.
- **Error:** `FormError`, a neutral 6% ink note with a circled "!" icon, semibold, `role="alert"`. Every form uses it.
- **Score inputs:** the field at 1.125rem/600, tabular.

### Navigation
- **Tabs (signature):** a sticky segmented control under the scoreboard, in a 6% ink strip with 16px corners and a 4px inset. Segments are 44px tall with 12px corners. Inactive segments are soft ink, and the active one is a white segment with ink text and the segment-lift shadow. A tab can carry the live dot (with "(live)" for screen readers). The active tab lives in the URL hash, updated with `replaceState` so Back leaves the page, and kept in sync across `hashchange`. Arrow keys, Home and End move between tabs. Panels fade up (240ms, expo-out) when switched.
- **Admin bar:** a white top bar with a hairline bottom border holding the "Club Duel Admin" wordmark (800/500 weights) and a ghost Sign out. A soft-ink back link with a chevron sits above the scoreboard.

### ScoreRace (signature scoreboard)
A white card and a container-query component. Below 48rem of card width it stacks two rows (crest, club name, total). Club names always show in full, wrapping as needed. At 48rem and above (wide enough for long club names) it becomes a face-off: crest, club, total, a faint en dash, total, club, crest. Crests are 36px circles (48px in the face-off) holding the club monogram (first letters of the first two words) in white on the club colour. The trailing total is dimmed to soft ink. Totals tween from the old value to the new one over 700ms with an expo-out curve, and change instantly under reduced motion. Under the totals, a 10px rounded race bar splits blue and red at 50% plus 1.5% per point of lead, capped at 10/90, with a 2px ink centre tick that overhangs the bar. The bar width transitions over 700ms expo-out. Below the bar sit the lead line ("Club B lead by 2" or "Tied", announced politely) and the round status in soft ink. The whole bar has an image label stating the lead and both totals.

### PairCard
One club's pair inside a match row or court card. It shows a Label line in the club's colour ("Club A · Pair 3", or "Pair 3" on phones), then two names, plus a warn badge for a repeat pair. Club B is right-aligned. `names: null` renders a card back: a 44px tile with 8px corners, striped at 135° in 6% and 12% of the club colour, with a lock icon and the word "Hidden". Screen readers hear "Hidden until the match starts", and **no names reach the DOM**. When names arrive on a card that mounted face-down, the back turns away (240ms ease-in) and the names turn in (320ms expo-out, 240ms delay).

### Lineup picker (LineupSlots)
A flush, ruled list of slots, each at least 56px tall: the "Pair N" label in the club colour, then the names or "Tap to pick 2 players". Opening a slot shows a grey tray with "Pick 2 players · 1 of 2" and a two-column grid of 44px player buttons with 12px corners. A picked player is ink-filled. A player taken by another slot is disabled and reads "In pair N". After the first pick, that player's earlier partners get the amber fill and a "Round 1" badge, under a line reading "Already paired … You can still pick them." They stay pickable. The second pick saves.

### Tiles
Court cards (Courts tab) are full cards on the ground. The title row holds the court name and a Live · Match N or Free badge, then the flush pair row (side by side once the card is 24rem wide, stacked A over B in a narrower card such as the 4-column desktop grid), then End match or a match select with a primary Start match. Match-strip and audience court tiles are 12px hairline tiles with a soft-ink label and a status, and turn live-bg with a 30% live border while live.

### Ranking table and stat sheet
The table is tabular-nums, with soft-ink Label headers and divided rows. The player cell takes the leftover width (`w-full max-w-0`). Each name is a full-cell, 44px button: the name with a dotted underline, then a club dot and the club name truncated to one line beneath it. It opens a native `popover` stat sheet styled like the dialogs: the name and club on a hairline, one ruled row per game ("W 11–6" and the signed margin), then a W–L / PF / PA / Diff list that spells out each sum, and a secondary Close.

### Results (ended)
A winner banner fills a 16px-corner field with the winning club's colour (ink for a Draw), with the 1.875rem/800 headline and a tabular "Final · …" line. Below it come the tabulation card (flush match rows per round, then the round and running totals) and the Awards card. Each award winner sits on their club's colour field (12px corners, names at 1.875rem / 1.5rem / 1.125rem depending on how many there are). Award match rows fill the winning pair's cell with its club colour.

### Dialogs
A native `<dialog>` or `popover` with a 16px radius, 20px padding, the overlay shadow and a 40% ink backdrop. The heading is 1.25rem/700, and Cancel or Close is a ghost or secondary button aligned left.

## Do's and Don'ts

### Do:
- **Do** open every role page with the scoreboard card, then the sticky tabs; add a new section as a tab, not a stacked panel.
- **Do** keep cards white with 16px corners on a 1px hairline over the grey ground, and run row lists flush to the card edge (-mx-4 sm:-mx-5, rows px-4 sm:px-5).
- **Do** put tile grids (courts, match strips) on the page ground under a Title heading.
- **Do** set a finished score in the winning club's colour in neutral views, and dim the trailing total in the scoreboard.
- **Do** use `tabular-nums` on scores, totals, stats and tables only, and U+2212 for negatives.
- **Do** pass `names={null}` for any pair the viewer may not see; the card back renders and no names reach the DOM.
- **Do** keep motion to the total count-up, race-bar growth, card flip, live-dot pulse and tab fade, all on `--ease-out-expo`, with the global reduced-motion override intact.
- **Do** keep tap targets at least 44px and give every grid a `grid-cols-1` base template.

### Don't:
- **Don't** nest cards, or put a tile grid inside a card.
- **Don't** use green for anything but live, amber for anything but caution, or club blue/red for anything but that club's content.
- **Don't** add an error colour; errors are the neutral ink note with an icon.
- **Don't** put a shadow on cards, tiles, buttons, badges or fields; only the active tab and overlays lift.
- **Don't** put a kicker or eyebrow above a heading; put context in the heading or a pill beside it.
- **Don't** apply `tabular-nums` to the whole body.
