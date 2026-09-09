---
title: Responsive
status: updated
source: src/lib/use-media-query.ts
related: [dialog, card-rail, mobile-header]
---

Muza has **its own breakpoints**, and they are not Tailwind's. The generic
scale (`sm` 640, `md` 768, `lg` 1024, `xl` 1280) is still used inside class
names, but almost nothing about the page layout changes at those widths. One
of them is load-bearing: **`md:` (768) is `useIsMobile()` in CSS**, and it is
the only Tailwind screen allowed to switch a presentation (dialog ⇄ sheet,
toast placement, the docked editor). `sm:` and `lg:` reflow in-page content
only. The widths where something actually changes are these five — and two of
them are *calculated*, not chosen.

## The ladder

| Name | px | What changes at this width | Defined in |
|---|---|---|---|
| **Phone** | 375 | Nothing switches here — it is the reference phone (iPhone 12 mini / SE class), the narrowest width this app is tested at | — |
| **Phone wide** | 584 | Page gutter `--page-px` 12 → 24px | `app.css` |
| **Tablet** | 608 | **Chrome gate.** Sidebar replaces the footer tab bar; `Topbar` replaces `MobileAppHeader`; anything lifted over the tab bar (`BulkActionBar`) drops. Kept separate from 768 on purpose — see `DESIGN_SYSTEM.md`, gating rules | `FOOTER_NAV_BELOW` |
| **Tablet wide** | 768 | **Presentation gate.** `useIsMobile()` and Tailwind `md:` flip — components swap outright (dropdown ⇄ bottom sheet, inline toggle ⇄ header toggle). Also where the docked playlist editor starts to exist | `useIsMobile()`, `DRAWER_FROM` |
| **Desktop** | 1069 | Sidebar expands from the icon rail; page gutter 24 → 40px | `SIDEBAR_COLLAPSE_BELOW` |

The names describe **width bands, not devices**. A 1024px tablet held sideways
is "Desktop" here, and that is correct: what matters is how much room the
layout has, never what the hardware is called.

## Two of them are arithmetic

`608` and `1069` are not taste. They are the viewport widths at which a
*container* threshold is reached, so they must be recomputed if anything in
that chain moves — which is why they are exported constants and not literals:

```text
Tablet   608 = 560 (MediaHeader stacks)     + 2 × 24 (gutter in that band)
Desktop 1069 = 780 (MediaHeader full)  + 208 (sidebar) + 80 (px-10 × 2) + 1 (border)
```

Both live in [`use-media-query.ts`](src/lib/use-media-query.ts) as
`FOOTER_NAV_BELOW` and `SIDEBAR_COLLAPSE_BELOW`, with the arithmetic in the
comment above each. Never write `608` or `1069` into a component.

**Read `608` carefully.** It is the last viewport at which a *sidebarless*
page still has a container under 560 — it is **not** the width where the
container reaches 560. At 608 the 52px icon rail appears in the same instant,
so the container goes `559 → 508`: it gets **narrower as the page gets
wider**. The MediaHeader stays stacked and rails stay in swipe-peek until
viewport **660**, where `660 − 52 − 48 = 560`.

This is the general shape, not a one-off: the container is **not monotonic**
in the viewport. Wherever chrome appears, it takes more than the extra pixel
gives back. `ResponsiveLab` counts those widths at runtime rather than listing
them here, so the count cannot go stale.

## The content width is not a function of the window

`containerAt()` used to read `viewport − sidebar − 2 × gutter`. That is wrong
twice over, and both corrections matter:

**The page wrapper is capped.** Every page shell carries
`max-w-[1480px] min-[1920px]:max-w-[1716px]`. From a 1688px window up the
column stops growing and the extra pixels become margin — the old formula was
231px too generous at 1919.

**The docked playlist editor takes its width off the column.** It is a flex
sibling of `<main>` (`hidden md:flex`, `w-[30%] min-w-[374px] max-w-[550px]`,
draggable within `[374, min(900, 60% of the window)]`), so with it open:

```text
768px window  → 52 rail + 2×24 gutter + 374 editor → 294px content
1440px window, editor dragged to 864              → 288px content
```

A 768px window with the editor docked gives less content than a 320px phone.
That is the designed state, not an edge case — the editor exists so you can
browse and drag tracks in. Anything that assumes content follows from the
window will be wrong there.

The **sidebar is resizable too** (208–291px when expanded), so it is a third
input the formula cannot assume.

`containerAt(viewport, { sidebar, drawer })` takes what is actually on
screen; `drawerAt()` and `contentCapAt()` give the defaults.

## The other ladder: container columns

Card grids and rails do not step on viewport width at all — they step on
their own **container** width, so a rail inside a narrow column behaves like
a rail on a narrow phone:

```text
304 → 2 columns · 464 → 3 · 692 → 4 · 928 → 5 · 1164 → 6 · 1500 → 7
```

Plus two container thresholds inside components: **560** (MediaHeader stacks,
rails switch to swipe-peek) and **780** (MediaHeader shows its full action
cluster).

Those numbers are not arbitrary either. The card ladder comes from the
**cover**, which must stay between 143 and 220px wide with a 16px gap — each
step is where the current column count would push a cover past 220:

```text
2 × 220 + 1 × 16 = 456  → 464 (3 columns)
3 × 220 + 2 × 16 = 692  → 692 (4)
4 × 220 + 3 × 16 = 928  → 928 (5)
5 × 220 + 4 × 16 = 1164 → 1164 (6)
```

The first step follows the opposite rule — `2 × 143 + 16 = 302 → 304`, "two
covers just fit".

The last step is the one deliberate exception. The rule would put it at
`6 × 220 + 5 × 16 = 1400`; the ladder says **1500**, set above that cap on
purpose so a six-card row never collapses into seven smaller ones the moment
it reaches full width. Between 1400 and 1500 six covers therefore sit at their
220px cap with 100px of slack — that slack is the point, not an oversight.
(`DESIGN_SYSTEM.md`, "Grids step from 6 → 7 cards".)

## The third measuring point

`breakpoints.ts` used to say there were two measurements. There are three, and
the third is what makes the design system's two chip scales look like a
contradiction when they are not:

1. **Window** — decides the chrome. Nothing above the page can be measured, so
   this one is irreducible.
2. **The page column** — what is left. Card grids, rails, `MediaHeader`,
   search and every library/detail view measure this.
3. **A component's own box** — exactly one component does this:
   [`SongListItem`](song-list-item.md), because a `SongRail` puts it in a cell
   far narrower than the column, and because the docked editor narrows the
   column with no rail involved. Its steps (260 / 300 / 380) are its own and
   live with the component, not here: they come from where a line of text
   stops fitting, not from where a cover stops fitting.

`MediaHeader`'s meta line is a fourth *technically*, but it is a
component-internal detail rather than a placement: the fixed 268px cover and
its gaps make that line `column − 300` in the horizontal tier, wherever the
header sits.

Two things that looked like this regime were removed after an audit showed
they could never fire: `MediaListItem`'s 240px step (narrowest real width 296)
and `MediaHeader`'s 240px type-chip step (narrowest meta width 260).

**Name your container.** `PlayerOverlay` carried a `@min-[380px]` step with no
container ancestor at all: in the app it never matched, and on the
design-system page it always did, because the nearest container there is the
page's own 1400px wrapper — so the phone frames showed a lyric size no phone
renders. An unnamed query silently binds to whatever ancestor happens to be
closest.

The base declaration under a container-query ladder must be a **real layout**,
not the ladder's bottom step — it is what renders in engines without container
queries, and what a 320px phone gets. `.grid-cards` learned this the hard way:
its base was `repeat(1, minmax(143px, 220px))`, which on a 296px-wide viewport
produced one stretched column with a field of empty space beside it.

### The stage: `ResponsiveLab`

The Responsive section is one stage, then one table — the IRIS studio's layout
pattern. It lives in
[`responsive-lab.tsx`](src/components/ds/responsive-lab.tsx) and replaced four
things that each carried their own copy of the ladder: a static three-tier
diagram, a separate column ladder, a schematic lab on an abstract pixel scale,
and a printed breakpoint table.

**The stage is not a diagram.** A frame is set to the chosen viewport width in
*real* pixels and contains the real page chrome at its real size, with the real
`CardRail` and real `AlbumCard`s inside the content column. Pick 375 and the
rail cuts its last card, because it is the rail deciding that — its
`@min-[560px]` container queries measure the content column, and that column
really is 351px wide.

Consequences worth knowing before changing it:

- **The stage scrolls sideways** when the frame is wider than the page. It does
  not scale down: a card drawn at 60% is a card at a size the app never
  renders, which is exactly the mistake the schematic version made.
- **The chrome is computed, not live.** `useIsMobile()` / `useFooterNav()` read
  the real window, so a real `Sidebar` dropped into the frame would show the
  browser's state inside a box claiming to be 375px. The sidebar is drawn from
  `sidebarAt()` / `gutterAt()` — pure functions of the chosen width — and it is
  deliberately muted, because it is the thing taking space away, not the
  subject. Component-level swaps gated on those hooks cannot be shown here; the
  table names the widths where they happen.
- **The arithmetic appears once**, in the sentence under the frame, in the
  order the page computes it.
- **The first chip is `Free`** and it is the default: no fixed width, the frame
  fills whatever room the section has, and the chip whose band the measured
  width falls into lights up. This is the honest version of "follow the
  window" — a frame that literally followed `window.innerWidth` would always be
  wider than the space it has, being the whole window drawn inside a fraction
  of that same window.
- **An `Editor docked` toggle**, because the docked playlist editor is the one
  fact that breaks "content follows from the window", and nothing else on the
  page can show it. Switch it on at 768 and the content drops to 294px — a
  tablet-width window rendering narrower than a phone.
- **The wrapper's cap is modelled**, so past a 1688px window the frame shows
  the extra pixels becoming margin instead of content.

Below the stage, one table carries the whole ladder: name, window, sidebar,
gutter, content, content *with the editor docked*, cards, what changes, and the
constant it is defined in. Every row is computed from `breakpoints.ts` —
including the `−187 vs 1068px` marks, which appear only where the content
actually loses width.

### The design system's frame moves the CONTAINER, not the viewport

Its **default** chips are the page column's ladder — 304 · 464 · 692 · 928 ·
1164 · 1500 — plus two widths that are not column steps: **560**, where the
MediaHeader stacks and rails switch to swipe-peek, and a **Phone** reference
at 351 (what a 375px phone leaves after its 12px gutter). They are labelled
`content` beside the chips, because the Responsive section's own frame is
picked in **window** widths and two unlabelled ladders on one page read as a
contradiction rather than as two different measurements.

They cannot simulate the window ladder: `useIsMobile()` and `useFooterNav()`
read the real window, so sidebar ⇄ tab bar and component-level swaps only
happen when the browser itself is resized. Chips named for those widths would
promise a change the frame cannot produce.

A component with steps of its own passes `widths` and gets chips that mean
something for it — `SongListItem` does, labelled `row`. Before that, three of
its four documented steps were below the default ladder's first chip and so
could not be demonstrated at all. When passing row-level widths, remember the
frame sets the OUTER width while a container query reads the CONTENT box.

### Measuring a container query

A container query measures the container's **content box**. Padding on the
`@container` element therefore shrinks what everything inside it reads: the
design system's demo frame carried `p-6` on its stage, so at the 584 step a
rail saw 536 and stayed in its below-560 layout while the chip said 584. Put
the padding on a child, and keep the `@container` at the width it claims.

## Gutter

`--page-px` is one knob, applied with the `px-page` utility — never `px-10`:

| Viewport | Gutter |
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
- To **swap a component**, gate on width (`useIsMobile()`), never on hover: the
  headless preview reports `hover: hover` at phone width, and hybrid
  touch-laptops do too — a hover-gated sheet would simply never appear.
