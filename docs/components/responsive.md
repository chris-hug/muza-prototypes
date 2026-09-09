---
title: Responsive
status: updated
source: src/lib/breakpoints.ts
related: [dialog, card-rail, song-list-item, mobile-header, toast]
usage:
  - not a component — the width rules every section is measured against
summary:
  - **Window** — the browser. Decides the **chrome** and how a thing is **presented**. Two gates: **608** chrome (tab bar ⇄ icon rail, mobile header, mini player) and **768** presentation (`useIsMobile` and `md:`, the same gate in TS and CSS — sheets ⇄ dialogs, toasts, the docked editor).
  - **Column** — what the window leaves after chrome, cap and editor. Decides **how many fit**: card steps, rail peek, MediaHeader tier. Written `@min-[N]` / `@max-[N]`.
  - **Box** — a component's own width. Only where the same window can hand it two widths (a song row in a list vs a rail cell), and then the container is **named**.
  - **Pointer, not width**, for touch: hover is pointer-only, and a component swaps on the window — never on hover.
---

Muza measures width in **three ways, and only three**. Every number in the
app belongs to one of them, and the mistake this page exists to prevent is
reading a number from one as if it were from another.

| Measure | What it is | Read by | May decide |
|---|---|---|---|
| **window** | the browser viewport | `useFooterNav()`, `useIsMobile()`, `useSidebarAutoCollapsed()`, `@media`, Tailwind `md:` | the page **chrome** and how a thing is **presented**: sidebar / icon rail / tab bar, the gutter, dialog-as-sheet, dropdown-as-sheet, the docked editor, where a toast sits |
| **column** | the page content area — what the window leaves after chrome, cap and editor | `@container` on the page shell: `.grid-cards`, `@min-[N]:` in rails and headers | **how many fit**: card columns, rail peek, MediaHeader tier |
| **box** | a component's own width, when the same window can hand it two different widths | a **named** `@container/<name>` on the component itself | internal reflow only: which meta field drops, which player tier |

**The rule, in one sentence:** the window decides the chrome and how a thing
is presented; the column decides how many fit; a component may measure its own
box only if the same window can hand it two different widths — and then it
must name the box.

The words "breakpoint" and "viewport" are not used for any of these. Tailwind
calls its screen tokens breakpoints, and that is the one place the word
belongs; "viewport" stays for the browser's own terms (`viewport-fit`, the
visual viewport under a keyboard). Code identifiers keep their names —
`VIEWPORTS`, `containerAt()`, `@container` — this page says what they mean.

## Window: two gates, each with a job

| Name | px | Gate | What changes | Defined in |
|---|---|---|---|---|
| **Phone** | 375 | — | Nothing switches — the reference phone (iPhone 12 mini / SE class), the narrowest width the app is tested at | — |
| **Phone wide** | 584 | gutter only | `--page-px` 12 → 24px. A spacing step, not a mode | `app.css` |
| **Tablet** | 608 | **chrome** | Icon rail replaces the tab bar; `Topbar` replaces `MobileAppHeader`; the mini player becomes the desktop bar; anything lifted over the tab bar (`BulkActionBar`) drops | `FOOTER_NAV_BELOW` |
| **Tablet wide** | 768 | **presentation** | `useIsMobile()` and Tailwind `md:` flip together: dialogs, alert dialogs and toasts leave their sheet / bottom-bar form, dropdowns stop presenting as sheets, the docked playlist editor starts to exist | `useIsMobile()`, `DRAWER_FROM`, `md:` |
| **Desktop** | 1069 | chrome | Sidebar expands from the icon rail; gutter 24 → 40px | `SIDEBAR_COLLAPSE_BELOW` |
| **Wide** | 1920 | cap | The page wrapper's ceiling rises from 1480 to 1716px | `CONTENT_CAP_WIDE_FROM` |

The names describe **width bands, not devices**. A 1024px tablet held sideways
is "Desktop" here, and that is correct: what matters is the room the layout
has, never what the hardware is called.

**Why 608 and 768 are not one gate.** They could be, and one number fewer
would be tidier — but with the tab bar kept up to 767 the MediaHeader would go
horizontal (its column reaches 560 at 608 without a sidebar) underneath the
mobile detail bar, which is built for the centred, stacked cover; and the mini
player slot would receive the 80px desktop bar from a 664px window, because
the bar's own box passes 640 there. Folding them means touching both; until
then, 608 is chrome and 768 is presentation, and each is named for it.

**Tailwind's screens, stated.** `md:` (768) is `useIsMobile()` in CSS and is
the only screen token that may switch a presentation. `sm:` (640) and `lg:`
(1024) may reflow **in-page content** — a settings form going two-column, a
report table hiding a column — and nothing else. Before this rule the dialog
family recentred at `sm` while the hook still said phone: between 640 and 767
the create-playlist form rendered its phone branch with every action hidden
by `sm:hidden`. `xl` and `2xl` gate nothing.

**What "presentation" covers below 768.** Every `Dialog` and `AlertDialog` is
a bottom sheet (the base default of `DialogContent`, no opt-in; a form whose
primary action must survive the keyboard goes full-screen via
`mobile="form"` — see [`dialog.md`](dialog.md)); `DropdownMenu` presents as a
sheet; the rich "…" menu is `DetailMoreButton`'s sheet; the toast is a bottom
bar; the docked playlist editor does not exist. Panels that open under the
sticky header (search suggestions) are `absolute`, out of flow, so they
overlay rather than push content.

### Two of them are arithmetic

```text
Tablet   608 = 560 (MediaHeader stacks)  + 2 × 24 (gutter in that band)
Desktop 1069 = 780 (MediaHeader full)    + 208 (sidebar) + 80 (px-10 × 2) + 1 (border)
```

Both live in [`use-media-query.ts`](src/lib/use-media-query.ts) as
`FOOTER_NAV_BELOW` and `SIDEBAR_COLLAPSE_BELOW`. Never write `608` or `1069`
into a component.

**Read 608 carefully.** It is the last window at which a *sidebarless* page
still has a column under 560 — not the width where the column reaches 560. At
608 the 52px icon rail appears in the same instant, so the column goes
`559 → 508`: it gets **narrower as the page gets wider**. The MediaHeader stays
stacked and rails stay in swipe mode until window **660**, where
`660 − 52 − 48 = 560`.

**Read 1069 with the sidebar's floor in mind.** The derivation uses the
sidebar's 208px minimum. It can be dragged to 291 (`MAX_W` in `sidebar.tsx`),
and then the header's full tier needs a 1152px window; between 1069 and 1151 a
widened sidebar leaves the header in its intermediate tier. Accepted: deriving
from 291 would delay the expanded sidebar by 83px on every laptop.

## Column: not a function of the window

`containerAt()` used to read `viewport − sidebar − 2 × gutter`. That is wrong
twice over:

**The page wrapper is capped.** Every page shell carries
`max-w-[1480px] min-[1920px]:max-w-[1716px]`. From a 1688px window up the
column stops growing and the extra pixels become margin — the old formula was
231px too generous at 1919.

**The docked playlist editor takes its width off the column.** It is a flex
sibling of `<main>` (`hidden md:flex`, `w-[30%] min-w-[374px] max-w-[550px]`,
draggable within `[374, min(900, 60% of the window)]`), so with it open:

```text
768px window  → 52 rail + 2×24 gutter + 374 editor → 294px column
1440px window, editor dragged to 864              → 288px column
```

A 768px window with the editor docked gives less column than a 320px phone.
That is the designed state, not an edge case.

`containerAt(viewport, { sidebar, drawer })` takes what is actually on screen;
`drawerAt()` and `contentCapAt()` give the defaults. The column is
**non-monotonic** in the window at three widths — 584 (559 → 536), 608
(559 → 508) and 1069 (968 → 781) — wherever chrome appears, it takes more than
the extra pixel gives back. `ResponsiveLab` marks those rows at runtime.

### The column ladder

Card grids and rails step on the **column**, so a rail inside a narrow column
behaves like a rail on a narrow phone:

```text
304 → 2 columns · 464 → 3 · 692 → 4 · 928 → 5 · 1164 → 6 · 1500 → 7
```

Plus two column steps inside components: **560** (MediaHeader stacks, rails
switch to swipe mode) and **780** (MediaHeader shows its full action cluster).

The ladder comes from the **cover**, which stays between 143 and 220px wide
with a 16px gap — each step is where the current column count would push a
cover past 220:

```text
2 × 220 + 1 × 16 = 456  → 464 (3 columns)
3 × 220 + 2 × 16 = 692  → 692 (4)
4 × 220 + 3 × 16 = 928  → 928 (5)
5 × 220 + 4 × 16 = 1164 → 1164 (6)
```

Two steps are declared, not derived. The **first** is "two covers just fit":
`2 × 143 + 16 = 302`, written **304** — a 2px rounding with no visible effect,
because the auto-fill base under the ladder already yields two columns at
302. The **last** is the one deliberate exception: the rule would put it at
`6 × 220 + 5 × 16 = 1400`, the ladder says **1500**, set above the tier-1 cap
(1480 − 80 = 1400) on purpose so a six-card row never collapses into seven
smaller ones the moment it reaches full width. Between 1400 and 1500 six
covers sit at their 220px cap with 100px of slack — that slack is the point.
Seven columns therefore first appear at a **1920px window** (column 1632);
below that the cap holds the column at 1400.

Where each column count first appears with the default chrome, swept over
every window from 320 to 2560:

```text
2 → 320 (296)   3 → 488 (464)   4 → 792 (692)
5 → 1028 (928)  6 → 1452 (1164) 7 → 1920 (1632)
```

## Box: the components that measure themselves

A box step is allowed only where the window does not determine the
component's width. Four components qualify, and each names its container so
the query can never bind to an ancestor by accident — `PlayerOverlay` once
carried an unnamed `@min-[380px]` with no container of its own: in the app it
never matched, on the design-system page it always did (the page wrapper is a
1400px container), so the phone frames showed a lyric size no phone renders.

| Component | Box | Steps | Why the window cannot say |
|---|---|---|---|
| [`SongListItem`](song-list-item.md) | `@container/row` | 260 · 300 · 380 | at a 1069px window the same row is 765px in a list and 363px in a `SongRail` cell; beside the docked editor the column itself is 294px |
| `PlayerBar` | its own root | 640 · 688 · 800 | the bar is `main − 2 × gutter`, not the column: 640 is reached at a 740px window with the rail — and with the editor docked at 768 the bar's box is 294px, which is why the compact ⇄ desktop switch must stay a box step and not a window gate |
| `PlayerOverlay` | `@container/overlay` | 380 | mounted in a sheet and on the design-system page |
| Paywall content | `@container` inside a `max-w-[980px]` dialog | 760 | the dialog is `80vw`, so 760 is reached at a 950px window |

`MediaHeader`'s meta line is a fifth *technically*: the fixed 268px cover and
its gaps make that line `column − 300` in the horizontal tier, and its year
drops below 320 (`@max-[320px]/meta`).

Two things that looked like box steps were removed after an audit showed they
could never fire: `MediaListItem`'s 240px step (narrowest real width 296) and
`MediaHeader`'s 240px type-chip step (narrowest meta width 260).

**Folding box steps into the column ladder is not worth it.** Rounding
`SongListItem`'s 260 up to 304 drops the album line on every phone list (a
320px phone's column is 296); rounding 380 up to 464 drops the year on every
phone.

## Writing a step: `@max-[N]` means "below N"

Tailwind v4 compiles `@max-[560px]` to `@container (width < 560px)` and
`max-md:` to `@media (width < 48rem)` — **exclusive**. So the pair for a step
at 560 is `@min-[560px]` / `@max-[560px]`, never `@max-[559px]`: that left
the 559px column (a 607px window) matching neither side of CardRail. The same
holds for `max-md:` against `useIsMobile()` (`max-width: 767px`, inclusive) —
they agree; `max-[767px]` (`< 767`) did not.

The base declaration under a container-query ladder must be a **real
layout**, not the ladder's bottom step — it is what renders in engines
without container queries, and what a 320px phone gets. `.grid-cards` learned
this the hard way: its base was `repeat(1, minmax(143px, 220px))`, which on a
296px column produced one stretched column with a field of empty space
beside it.

## Where a number lives twice

Tailwind cannot read a TypeScript constant, so a class literal is a **forced**
copy. Everything else should be one import.

| Number | Copies | Forced? | Kept in sync by |
|---|---|---|---|
| 304 … 1500 | `app.css` `.grid-cards`, `card-rail.tsx`, `song-rail.tsx` (692 / 1164), `COLUMN_STEPS` | class copies forced | comments — and the design-system page, which renders the real components against `COLUMN_STEPS` |
| 560 · 780 | `media-header.tsx`, `card-rail.tsx`, `song-rail.tsx`; `STACK` / `MEDIA_HEADER_STACK`, `SIDEBAR_FULL_HEADER` | class copies forced; the second TypeScript copy is not | comments |
| 12 / 24 / 40 · 584 · 1069 | `app.css` media queries; `gutterAt()` | forced (CSS custom property) | comments |
| 143 / 220 | `.grid-cards`, rails, cards | not forced — no token yet | nothing |
| 1480 / 1716 / 1920 | 17 class copies of the wrapper cap | not forced — one utility would do | grep |
| 208 / 52 / 374 … | `sidebar.tsx`, `playlist-edit-drawer.tsx`, `breakpoints.ts`, `use-media-query.ts` | not forced | nothing |

Where a comment says "must match", nothing executable checks it yet; a test
that reads the class literals out of the files and compares them to the
constants is the cheapest thing that would.

## The design system's stage

### `ResponsiveLab` — a real page at a chosen width

The Responsive section is one stage, then one table. It lives in
[`responsive-lab.tsx`](src/components/ds/responsive-lab.tsx) and replaced
four things that each carried their own copy of the ladder.

**The stage is not a diagram.** A frame is set to the chosen window width in
*real* pixels and contains the real page chrome at its real size, with the
real `CardRail` and real `AlbumCard`s inside the column. Pick 375 and the rail
cuts its last card, because it is the rail deciding that — its `@min-[560px]`
container queries measure the column, and that column really is 351px wide.

- **The stage scrolls sideways** when the frame is wider than the page. It does
  not scale down: a card drawn at 60% is a card at a size the app never
  renders.
- **The chrome is drawn, not live.** The sidebar comes from `sidebarAt()` /
  `gutterAt()` — pure functions of the chosen width — and is deliberately
  muted, because it is the thing taking space away, not the subject.
- **Inside the frame, the chip is the window.** `WindowWidthContext`
  (`use-media-query.ts`) makes `useIsMobile()`, `useFooterNav()` and
  `useSidebarAutoCollapsed()` read the chip instead of the browser, so a
  component gated on them presents as it would at that window — a "375" frame
  opens sheets, not dropdowns. Only the gates are overridden: the sheet is
  still portaled to the real window and appears at the bottom of the browser,
  full width. The presentation is the phone's, the geometry is yours.
- **The arithmetic appears once**, in the sentence under the frame, in the
  order the page computes it.
- **The first chip is `Free`** and it is the default: no fixed width, the frame
  fills whatever room the section has, and the chip whose band the measured
  width falls into lights up.
- **An `Editor docked` toggle**, because the docked editor is the one fact
  that breaks "column follows from the window". Switch it on at 768 and the
  column drops to 294px.
- **The wrapper's cap is modelled**, so past a 1688px window the frame shows
  the extra pixels becoming margin instead of column.

Below the stage, one table carries the whole ladder: name, window, sidebar,
gutter, column, column *with the editor docked*, cards, what changes, and the
constant it is defined in. Every row is computed from `breakpoints.ts`. The
active width is a **selected row** and wears the table's own token for it
(`data-[state=selected]:bg-muted`); clicking a row picks that width, and the
chip above follows.

### `Example` — every component's frame, picked in window widths

Every component demo carries the **same window ladder** as chips
(320 · 375 · 584 · 608 · 768 · 1069 · 1440 · 1512 · 1920). The frame is still
a container — it sets itself to what that window *leaves*, and the readout
prints both (`1069 → 781px`), with the chrome drawn around the stage so the
counter-intuitive steps are legible (584 leaves 536; 608 leaves 508, because
the icon rail arrives).

This replaced a second ladder of raw column steps (304 · 464 · 692 · 928 ·
1164 · 1500). Nothing was lost: stepping through the nine windows still yields
column counts 2·2·3·3·3·4·5·6·7, at widths that actually occur.

A **box** component is the exception and passes `widths` — `SongListItem`
does, labelled `row`. Not because its steps are unreachable from a window
(sweeping every width finds them), but because a window does not *determine*
that row's width: one number in, two answers out. `PlayerBar` and
`PlayerOverlay` belong in the same group.

**A window chip is the window inside the frame** — the same `WindowWidthContext`
as the stage — so `DetailMoreButton` at "375" opens its bottom sheet and a
`Dialog` trigger opens a sheet; "Free" and a box chip pass the real window
through.

**Beside a drawn gutter the stage has no horizontal padding** — the hatched
gutter *is* the page's padding, and a second `px-6` inside the column would
inset every component 24px further than the app ever does. Only the page's
vertical rhythm remains; without chrome ("Free", a box chip) the frame keeps
its own `p-6`.

**A chrome-level demo bleeds.** A bottom sheet spans the window and covers
the tab bar, so an `Example` whose demo is a sheet below the presentation gate
passes `bleed={w => w < 768}`: at those chips the frame draws no gutters, no
tab bar and no stage padding, and the sheet touches the frame's edges. The
Detail Menu (`DetailMenuSurface`) and the Dialog previews do this;
`DialogPreview` itself reads the chip and takes the sheet shape.

**Chrome is drawn only for a window chip.** A component that is centred or has
an intrinsic width — a dialog, a card, a badge — gets no ladder at all: a 208px
sidebar drawn beside a 400px card implies a relation that does not exist.

### Measuring a container query

A container query measures the container's **content box**. Padding on the
`@container` element therefore shrinks what everything inside it reads: the
demo frame once carried `p-6` on its stage, so at the 584 step a rail saw 536
and stayed in its below-560 layout while the chip said 584. Put the padding on
a child, and keep the `@container` at the width it claims. The same applies
to `SongListItem`'s `row` chips: the frame sets the OUTER width while the
query reads the CONTENT box, so its `framePx` adds the row's own padding back.

## Gutter

`--page-px` is one knob, applied with the `px-page` utility — never `px-10`:

| Window | Gutter |
|---|---|
| ≥ 1069 | 40px |
| 584–1068 | 24px |
| < 584 | 12px |

A bottom sheet uses the same 12px at phone width. It spans the whole screen,
so a 24px gutter would cost 48px of a 320–375px width — enough to visibly
squeeze list rows.

## Pointer, not width

Hover is pointer-only: every `hover:` / `group-hover:` utility is auto-wrapped
in `@media (hover: hover)` by Tailwind v4, so hover states never fire on touch
and there is no sticky-hover after a tap.

- To merely **show/hide** a control by pointer:
  `[@media(hover:none)]:!hidden` / `[@media(hover:hover)]:!hidden`. The `!` is
  required — Tailwind v4 sorts pointer/hover variants *before* base
  `flex`/`hidden`, so without it the base wins and the gate is a silent no-op.
- To **swap a component**, gate on the window (`useIsMobile()`), never on
  hover: the headless preview reports `hover: hover` at phone width, and hybrid
  touch-laptops do too — a hover-gated sheet would simply never appear.

## Touch

- **Cards** use `useLongPress`: tap = primary action, long-press = bottom
  sheet. The tap is the browser's **real** `click`, never one synthesised on
  `pointerup` — only the browser knows a touch became a scroll and withholds
  the click.
- **Rails** use `touch-pan-x touch-pan-y` — both axes. `pan-x` alone forbids
  vertical panning for any touch that starts in the rail, so scrolling the
  page with a finger on a card did nothing. Plus `overscroll-x-contain` (no
  body rubber-band) and `snap-x snap-mandatory`: a flick keeps its momentum
  and always comes to rest on a card boundary; `proximity` left cards sliced
  down the middle after a hard swipe.
