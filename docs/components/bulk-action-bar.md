---
title: Bulk Action Bar
source: src/components/ui/bulk-action-bar.tsx
related: [table, list-table, button, footer-nav]
usage:
  - Studio › Music (select rows) | /?page=Music
  - Shop › Orders / Products | /?page=Orders
  - Library › Albums / Playlists (list view) | /?page=Albums
---

`BulkActionBar` is the dark floating pill that appears when a list or table has rows ticked — "12 selected", a divider, one or more actions, ✕ — pinned to the bottom of the content area so it is in reach however far the list has scrolled.

## Anatomy

| Part | Wears | Why |
|---|---|---|
| Pill (`BulkActionBarContent`) | `flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-4 py-3 rounded-2xl bg-foreground border border-foreground shadow-xl` | inverted — `foreground` as the surface — so it is the one dark object over a light page and cannot be read as content |
| Count | `text-small font-medium text-background tabular-nums pr-2 whitespace-nowrap` — `{count} {label}`, `label` defaults to "selected" | the number must not wrap away from its noun |
| Divider | `w-px h-5 bg-background/20` | — |
| `BulkActionButton` | `Button size="sm" variant="secondary"` + `bg-background/15 hover:bg-background/25 text-background border-transparent` | a light translucent chip on the dark pill; any number, most important first |
| Clear | `button` `ml-1 text-background/50 hover:text-background`, `X size-4`, `aria-label="Clear selection"` | — |

An action may carry a glyph (`size-4`) and an inline count in `text-background/60 tabular-nums`: Orders shows "Mark shipped (5)" when 5 of the 8 selected are eligible, and hides an action whose count is 0 rather than greying it out (`orders-view.tsx:1131–1147`).

## Two exports

```tsx
// The live bar — portals, positions, unmounts at 0.
<BulkActionBar count={selected.size} onClear={() => setSelected(new Set())}>
  <BulkActionButton onClick={publish}>Make public</BulkActionButton>
  <BulkActionButton onClick={unpublish}>Make private</BulkActionButton>
</BulkActionBar>

// The pill alone — for a preview. The live bar renders exactly this.
<BulkActionBarContent count={12} onClear={…}>…</BulkActionBarContent>
```

`BulkActionBar` returns `null` at `count === 0`, so a call site renders it unconditionally next to its table. It **portals into `#app-content`** — the shell's `<main>`, a fixed-height, non-scrolling box beside the sidebar — and pins there as `absolute inset-x-3 z-40`. That is what keeps it at the bottom of the *visible* content, centred over the content and clear of the sidebar, however far the table underneath scrolls; rendered inline inside a tall table it would sit below the fold. Without an `#app-content` in the document it renders in place.

The pill sits in a **full-width, click-through row** (`flex justify-center pointer-events-none`; the pill itself `pointer-events-auto max-w-full`), not at `left-1/2` with a translate: an absolute element centred that way has only the right half of the box to shrink-to-fit in, and on a phone that folded it into a 137px column.

It enters with `animate-in fade-in slide-in-from-bottom-2 duration-200`; there is no exit animation, it unmounts.

## Sizing

Reads the **window** at the **608 chrome gate**, and its own content.

- **Lift.** `bottom-6` (24px) by default; `bottom-24` (96px) when `useFooterNav()` is true — below 608 the footer tab bar and the mini player are on screen and the pill has to clear them. This is the chrome gate, deliberately *not* the 768 presentation gate: between 608 and 767 there is no tab bar, the desktop player bar is on screen, and `bottom-6` already sits over it (`DESIGN_SYSTEM.md`, "Responsive & pointer": *anything lifted over the tab bar gates here, never on `md`*).
- **Wrap.** The pill is `flex-wrap`: on a 375px phone the count, two actions and ✕ measure 405px, so the actions drop to a second line (`gap-y-2`) instead of the pill running off the left edge. `max-w-full` keeps it inside the row's 12px insets.

In the design-system frame the window chip is the window (`WindowWidthContext`), so at 320 / 375 the pill in the frame wraps as it does on a phone. The **lift is not visible there**: the frame renders `BulkActionBarContent`, because the live bar would portal out of the frame into the page's own `#app-content`.

## Behaviour

- Appears when the selection set becomes non-empty, leaves when it empties.
- Actions run on the current selection and normally clear it (`selectedIds.forEach(…); setSelectedIds(new Set())` — Studio, Products, the Library tables); Orders hands the action to a confirmation step (`setBulkAction`) instead of mutating on click.
- ✕ clears the selection. Escape is not bound.
- Used by Studio › Music, Shop › Products, Shop › Orders, and the Library album / playlist / song list tables.

## Open questions

- The row is `inset-x-3` (12px) at every window; the page gutter is 24px from 584 and 40px from 1069. Harmless while the pill is centred, but a wide pill at 584–1068 can come 12px closer to the column edge than anything else on the page.
- `BulkActionButton` restyles `variant="secondary"` with four overrides rather than being a `Button` variant; the Buttons section has no "on dark" variant to point at.
