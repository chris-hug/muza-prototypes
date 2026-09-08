---
title: Dialog
status: updated
source: src/components/ui/dialog.tsx
related: [drawer, toast, detail-more-button]
---

**Every** `Dialog` and `AlertDialog` is a bottom sheet on mobile and a centred
modal on desktop — there is no per-dialog opt-in. It is baked into the base
`DialogContent` / `AlertDialogContent`, so an individual dialog sets only its
desktop width and must **not** re-declare the positioning.

On a phone there are two presentations: the default **bottom sheet**, and a
**full-screen** one for a dialog whose primary action must survive typing.

## The two presentations

```tsx
// Pickers, lists, confirms — the default. No opt-in needed.
<DialogContent className="sm:max-w-[max(32rem,50vw)]">…</DialogContent>

// A form whose primary action must survive the keyboard.
<DialogContent mobile="form">…</DialogContent>
```

A bottom sheet cannot hold a form once the keyboard is up: on a 12 mini in
Brave the keyboard plus accessory bar leave about 200px, and title + field +
toggle + footer need about 240.

```text
viewport (with browser chrome)   ~629px
keyboard + accessory bar         ~420px
usable                           ~209px
needed by a form sheet           ~240px
```

Lifting the sheet, capping it, or hiding content while typing only relocates
the overlap. The form presentation anchors to the top and fills the screen,
which removes the budget instead of negotiating with it.

## Header — one structure everywhere

`DialogHeader` is a column: an optional `leading` control on its own line,
then the title stack. Everything starts on the sheet's gutter line — the same
left edge as the rows, the field and the footer below it.

```tsx
<DialogHeader leading={<Button variant="ghost" size="icon-sm" aria-label="Back"><ChevronLeft /></Button>}>
  <DialogTitle className="sm:text-large">Add to “Smoky Ballads”</DialogTitle>
</DialogHeader>
```

- A back control takes its **own line** rather than sitting beside the title.
  Inline it would indent the title by its own width and nothing underneath
  would line up.
- Titles are left-aligned, **phones included**. A centred title reads as a
  screen header but breaks the one vertical edge the sheet otherwise holds,
  and it shifts as the title grows.
- The header carries the control's optical offset itself (`-ml-2`): an icon
  button is 32px around a 16px glyph, so its box hangs 8px left for the glyph
  to land on the line.
- **One back control per sheet.** A drilled-in screen does not add its own —
  it fills the header's `leading` slot. Two identical controls on screen is
  the failure this replaced.
- Dismissal is always the **✕ at the top right**, `mobile="form"` included.
  Its bar carries no Cancel.

Titles are `text-small` (19px), `sm:text-large` where a dialog wants the
larger desktop title — never a bare `text-large`. 21px crowded the line the
✕ shares.

## The keyboard is part of the layout

iOS does not shrink the layout viewport when the on-screen keyboard opens — it
shrinks the *visual* viewport — so a `fixed; bottom: 0` sheet sits **behind**
the keyboard. Every sheet therefore sits at `bottom: var(--kb, 0px)` and is
capped against what that leaves.

`scroll-padding` keeps the browser's own "scroll the focused field into view"
honest: `scroll-padding-bottom: 8rem` on a bottom sheet so a field never lands
under the sticky footer, `scroll-padding-top: 4rem` on a form sheet so it never
lands under the action bar.

`--kb` is published by [`useKeyboardInset`](src/lib/use-keyboard-inset.ts),
mounted once in the app shell. Chrome and Android are handled declaratively by
`interactive-widget=resizes-content` in the viewport meta, so `--kb` stays 0
there.

**`svh`, never `dvh`.** On iOS the *dynamic* viewport unit reports the height
with the browser chrome collapsed, so while the URL bar is expanded a sheet
sized to `100dvh` is taller than the screen and its top — title, tabs, ✕ —
sits above the visible area. `100svh` is the small (chrome-visible) viewport
and always fits. Subtract `env(safe-area-inset-top)` too on a sheet that fills
the height.

**`viewport-fit=cover` is mandatory** in the viewport meta. Without it every
`env(safe-area-inset-*)` in the app resolves to 0 and every safe-area pad —
mobile header, footer nav, player shell, dialog footers, toasts — is silently
a no-op.

## Sizing the bands

A sheet's scroll body is a **flex child**, never a `vh` cap.

```tsx
<DialogContent className="flex flex-col h-[calc(100svh-var(--kb,0px)-8px-env(safe-area-inset-top))] sm:h-auto sm:max-h-[85vh]">
  <DialogHeader className="shrink-0">…</DialogHeader>
  <div className={dialogListClass}>…</div>
  <DialogFooter>…</DialogFooter>
</DialogContent>
```

`min-h-0` is what lets the list shrink — a flex item defaults to
`min-height: auto`, so without it the list keeps its content height, overruns
the sheet, and the sticky footer slices the last rows. A viewport-relative cap
cannot know what the other bands cost and gets this wrong at some size.

Two traps inside that rule:

- **`padding-bottom` is a floor on a flex item's height.** `min-h-0` cannot
  shrink a box below its own padding. To clear a floating band, append a
  **spacer element** at the end of the scroll content instead.
- A picker sheet should be **full height, not content height** (`h-…`, not
  just `max-h-…`): more rows is strictly better, and a sheet that resizes as
  you switch tabs reads as jumping.

**Let the footer's edge cut the content.** No fade, no gap: cancel the sheet's
gap on the scroll body (`-mb-2 sm:-mb-5`) and the footer's `mt-2`, so the list
runs right up to the bar. A strip of empty sheet between a half-row and the
bar looks like a mistake; the bar's edge doing the cutting does not.

## Spacing

| Token | Phone | `sm` and up |
|---|---|---|
| Gutter (`p-…`) | 12px | 24px |
| Gap between bands | 8px | 20px |
| Header height | `min-h-8` (matches the ✕) | same |
| ✕ offset | `top-3` | `sm:top-6` |

The gutter matches `--page-px` at phone width. A sheet spans the whole screen,
so a 24px gutter would cost 48px of a 320–375px width — enough to visibly
squeeze list rows. The footer's full-bleed negative margins must match the
gutter at **both** sizes (`-mx-3 sm:-mx-6`) or the bar stops short of the edges.

## Lists inside a sheet

```tsx
<div className={cn(dialogListClass, "gap-2")}>…</div>
```

`dialogListClass` is `flex flex-col min-w-0 flex-1 min-h-0 overflow-y-auto -mx-2` — and no matching
`px-2`. `MediaListItem` brings its own `pl-2`, so a symmetric padding would
push every cover 8px past the gutter and out of line with the title, the field
and the footer. Letting the rows' hover surface bleed into the gutter is the
point of the negative margin.

## The form sheet's three bands

Only the middle one scrolls.

```tsx
<DialogContent mobile="form">
  <DialogActionBar trailing={<DialogClose …><X /></DialogClose>}>
    <DialogTitle>New Playlist</DialogTitle>
  </DialogActionBar>
  <DialogFormBody>…fields…</DialogFormBody>
  <DialogFormActions>
    <Button size="lg" className="w-full">Create playlist</Button>
  </DialogFormActions>
</DialogContent>
```

- The popup itself is `overflow-hidden`. If it scrolled, a sticky action row
  would float **over** the body instead of the body ending above it — it
  covered the privacy toggle.
- `DialogActionBar` (`sticky top-0 shrink-0`) carries dismissal only, and no
  rule underneath: the sheet is one surface, and a hairline right under the
  title reads as a header that isn't there. Same **frosted glass** as
  `MobileHeader` — it *is* a mobile header, for a modal — with the top
  safe-area inset, and `sm:hidden`.
- The confirming action is a full-width `size="lg"` (48px) button in
  `DialogFormActions`, the band below the body. The sheet already ends at
  `--kb`, so it sits directly on the keyboard. Never offered twice — bar
  **or** action row.
- `DialogFormBody` restores the gutter and a tighter `gap-3`: on a phone every
  gap competes with the keyboard for the same ~200px.
- **No field label** where the placeholder carries it — every line costs space
  above the keyboard. Keep an `aria-label`.
- **Desktop is untouched**: the bar is `sm:hidden`, the body is `sm:contents`
  (it dissolves into the modal's ordinary grid), and the usual
  `DialogHeader` / `DialogFooter` render. Gate the two with `useIsMobile()` so
  there is never more than one `DialogTitle` in the DOM.
- **Focus goes straight to the field**, phones included
  (`initialFocus={inputRef}`). Naming is the only thing this sheet asks for,
  so the keyboard coming up with it saves a tap — and because the sheet is
  anchored top and ends at `--kb`, nothing it shows is behind the keyboard.
  (It used to park focus on the bar to keep the keyboard down; the
  full-screen presentation is what made that caution unnecessary.)

Used by **Create playlist / Edit info** (`CreatePlaylistDialog`). Pickers and
lists stay bottom sheets.

## Search inside a sheet is a screen, not a field

Focusing the search input switches the sheet to a **find screen**
(`AddMusicDialog`): the browse chrome steps aside, a back control appears in
the header's `leading` slot, and the bottom band leaves the flow to sit over
the results.

- With no query it shows **recent searches**
  ([`useRecentSearches`](src/lib/use-recent-searches.ts) — `localStorage`,
  committed queries only, newest first, capped at 8), or a heading naming the
  scope when there are none.
- The **title does not change**. What you're filling is the same job either
  way, and swapping in "Find" would drop the only context on screen.
- Move the **footer**, never the field: re-parenting the input remounts it and
  throws away the focus that opened the screen.

**One band, and it only floats while it holds one control.** The search field
and the confirming action share the footer (`flex-col` so the field sits on
top, `sm:flex-row`) — one edge of chrome, not a pill hovering over a bar. A
lone field may float: transparent band, its own `bg-popover` and shadow, 16px
inset rather than the sheet's 12px gutter. Add a second control and the band
goes **opaque with a border** — two stacked floating controls read as two
competing primary actions, and a field is an input, not an action. Spotify and
TIDAL avoid the question entirely: a bottom field means no bottom confirm,
because each row commits on tap.

Pinning a full-bleed footer with `absolute` needs `mx-0 mb-0` — negative
margins **add** to the insets of an absolutely positioned box, so the band
would otherwise hang 12px outside the sheet on every side.

## Exported class constants

| Constant | What it is |
|---|---|
| `dialogChromeClass` | surface, gutter, gap, radius |
| `dialogPositionClass` | bottom sheet on phones, centred modal from `sm` |
| `dialogFormPositionClass` | the full-screen form presentation |
| `dialogHeaderClass` / `dialogHeaderStackClass` | the header column |
| `dialogTitleClass` | `text-small`, `font-medium` |
| `dialogListClass` | the scrolling list band |
| `dialogFooterClass` | full-bleed bar, sticky on phones |
| `dialogActionBarClass` / `dialogFormBodyClass` / `dialogFormActionsClass` | the form sheet's three bands |

`dialogHeaderSpacerClass` is **deprecated** — the header no longer centres its
title, so nothing has to be balanced against the ✕.
