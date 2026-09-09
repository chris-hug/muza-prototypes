# Briefing — unify the width system

**For:** Fable, read-only analysis and proposal. **Do not change any file.**
**Repo:** `/Users/christianschreiber/Documents/Vibe Codes/muza vibes/muza`

---

## The goal

Muza expresses width in too many vocabularies. Today a reader of the code or
the design system meets **breakpoints**, **viewports**, **container widths**,
**column steps**, **row steps**, **dialog caps** and **Tailwind's own
`sm`/`md`/`lg`/`xl`** — with no stated rule for which applies where, and with
the same number sometimes meaning two different things.

We want **one system**: one vocabulary, one place per number, and a rule a
newcomer can state in a sentence. Where genuine plurality is unavoidable, we
want it *named and justified*, not merely tolerated.

Your job is to establish what that system should be — not to implement it.

---

## What is already settled (verified; do not redo, but spot-check anything you
rely on)

Recent work established and fixed the following. Treat it as the starting
state, and flag anything you find to be wrong.

**Two measurements are irreducible.**

1. **Window** — decides the page chrome: sidebar `208` (user-resizable to
   `291`) / icon rail `52` / none, and the page gutter `40 / 24 / 40`… (see
   `gutterAt`). Read from the real browser by `useIsMobile()` /
   `useFooterNav()`; nothing on a page can fake it.
2. **The box a component sits in** — a CSS container query. This is what card
   grids, rails and headers measure.

**The content width is NOT a function of the window.** `containerAt()` now
takes `{ sidebar, drawer }` because two things break the old
`viewport − sidebar − 2 × gutter`:

- the page wrapper is capped (`max-w-[1480px]`, `min-[1920px]:max-w-[1716px]`),
  so from a 1688px window up the extra pixels become margin;
- the **docked playlist editor** is a flex sibling of `<main>`
  (`hidden md:flex`, `w-[30%] min-w-[374px] max-w-[550px]`, draggable within
  `[374, min(900, 60vw)]`). At a 768px window it leaves **294px** of content —
  less than a 320px phone.

**A third measuring point exists, and exactly one component needs it.**
`SongListItem` measures its own box (`@container/row`, steps 260 / 300 / 380),
because a `SongRail` cell is far narrower than the page column and because the
docked editor narrows the column with no rail involved. Crucially: the row's
width is **not determined by the window** — at a 1069px window the same
component is 765px wide in a list and 363px in a rail cell. (Its steps *are*
reachable from window widths — 260 at a 348px window in a rail cell, 300 at
340 in a list, 380 at 420 — so "unreachable" is the wrong argument; "not
determined" is the right one.)

`MediaHeader`'s meta line is a fourth, technically: the fixed 268px cover and
its gaps make it `column − 300` in the horizontal tier. It is a
component-internal detail rather than a placement.

**Removed after audit** (never fired in any placement): `MediaListItem`'s 240px
step and its container; `MediaHeader`'s 240px type-chip step. **Fixed:**
`PlayerOverlay` carried a `@min-[380px]` step with no container ancestor, so it
never matched in the app and *always* matched on the design-system page (whose
wrapper is a 1400px container) — the phone frames showed a lyric size no phone
renders. All container queries in these components are now **named**.

**The design system now uses one ladder.** Every `Example` frame is picked in
window widths (320 · 375 · 584 · 608 · 768 · 1069 · 1440 · 1512 · 1920), the
stage is set to what that window *leaves*, and the page chrome is drawn around
it so the counter-intuitive step is legible (584 → 536px of content;
608 → 508, because the icon rail arrives). `SongListItem` is the one labelled
exception, with `row` chips. It replaced a second ladder of raw container steps
(304 · 464 · 692 · 928 · 1164 · 1500) — dropped because stepping through the
nine windows still yields column counts 2·2·3·3·3·4·5·6·7, so nothing was lost.

Single source of truth: `src/lib/breakpoints.ts`.

---

## What we want from you

### 1. The inventory — every width family, named

Sweep `src/` and `app/` and enumerate **every** family of width numbers,
including ones not listed above. At minimum, examine:

- the page ladder in `use-media-query.ts` (`FOOTER_NAV_BELOW`,
  `SIDEBAR_COLLAPSE_BELOW`) and `breakpoints.ts`;
- the card column ladder in `app/app.css`, `card-rail.tsx`, `song-rail.tsx`;
- component-internal steps: `media-header.tsx`, `song-list-item.tsx`,
  `player-bar-b.tsx` (640 / 688 / 800), `player-overlay.tsx`,
  `subscription-dialogs.tsx` (760);
- **dialog and sheet widths** — `dialog.tsx`'s `sm:max-w-sm` (384) and every
  override in the app (`sm:max-w-[max(32rem,50vw)]`, `!max-w-[980px]`,
  `sm:max-w-xl`, …). This family has never been audited and may be the largest
  remaining inconsistency;
- Tailwind's own `sm` / `md` / `lg` / `xl` wherever they gate layout rather
  than mere spacing. `sm` is 640, which sits *between* our 608 and 768 — say
  whether that ever produces a contradiction in practice.

For each: what constrains the number (a cover size? a line of text? a reading
measure? taste?), where it is written, how many times, and whether the copies
agree.

### 2. The rule

Propose the smallest set of concepts that covers everything you found, and the
one-sentence rule that picks between them. Say explicitly which existing terms
should be **retired**. We suspect the words "breakpoint" and "viewport" are
doing inconsistent work — check whether that is true and recommend a single
vocabulary. Note that Tailwind's own token names stay as they are: we work
inside that system and do not rename shadcn/Tailwind concepts.

### 3. What can actually be unified

For each family, say whether it can be folded into another, and at what cost.
Be concrete about the cost — "260 rounded to 304 means the album drops 44px
earlier on every phone" is useful; "some visual change" is not.

Two specific questions:

- **Derive the column ladder?** The steps follow `N × 220 + (N−1) × 16` — the
  width at which N covers would exceed their 220px cap — exactly for 464, 692,
  928, 1164. The first step (304) follows the opposite rule
  (`2 × 143 + 16`), and the last (1500) is a deliberate exception documented in
  `DESIGN_SYSTEM.md` ("above tier-1's 1400 cap so the 6-card layout never
  collapses into 7 smaller cards"). Should `COLUMN_STEPS` be *computed* from
  the cover min/max and gap, with the two exceptions declared, instead of
  listed as data?
- **The dialog family** — is there a ladder there at all, or a pile of one-offs
  that should become named sizes?

### 4. Where a number still lives twice

Tailwind cannot read a TypeScript constant, so some duplication is forced. Map
every place a number is duplicated, and mark each as *forced* (a class name) or
*accidental*. For the forced ones, say what keeps them in sync today and
whether that is enough.

### 5. What the design system should show

Given your proposed system, say what the `Example` frame's chips should be, and
whether the drawn chrome should appear on every demo — including centred ones
(dialogs, cards, badges) where a sidebar drawn beside a 400px card may be more
confusing than helpful. Recommend per-category behaviour.

---

## Method

- **Verify every class name, number and prop against the source.** Comments in
  this repo have repeatedly been found wrong — several were corrected this
  week. Where a comment, doc or ticket disagrees with the code, report the
  mismatch explicitly rather than repeating it.
- Show arithmetic for any width you claim. Sweep widths programmatically where
  a claim is about reachability; do not reason from a handful of examples.
- Distinguish what the code does from what someone intended.
- If something cannot be determined statically, say so plainly.
- Design-system demo frames in `app/routes/home.tsx` and `src/ds-examples/`
  are **not** app placements — treat them separately and say so.

## Constraints any proposal must respect

- Semantic type aliases only (`text-2xsmall` … `text-large`); never `text-sm`
  or arbitrary `text-[17px]`.
- `font-medium` is the heaviest weight (h1 excepted). Never uppercase.
- Semantic colour tokens only; never hex.
- React Router 7 SPA, Vite, Tailwind v4, Base UI primitives.
- Do not rename Tailwind/shadcn token names — we work inside that system.

## Output

1. The inventory table: family | what constrains it | where written | copies |
   do they agree?
2. The proposed system: concepts, vocabulary, the one-sentence rule, terms to
   retire.
3. Per family: fold / keep / rename — with the concrete cost of folding.
4. Duplication map: forced vs accidental.
5. Design-system recommendation.
6. A ranked list of what to change first, with the cheapest high-value items
   at the top, and anything you judge **not** worth doing.
7. Every mismatch found along the way.

Be concise in prose, complete in coverage. No code changes.
