---
title: Dialog
status: updated
source: src/components/ui/dialog.tsx
related: [drawer, toast, detail-more-button]
usage:
  - Library › + / create tile — New Playlist (full-screen form on phones) | /?page=Playlists
  - Playlist detail › … → Edit info (same form) | /?page=Playlist
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
<DialogContent className="md:max-w-[max(32rem,50vw)]">…</DialogContent>

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
  <DialogTitle className="md:text-large">Add to “Smoky Ballads”</DialogTitle>
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

Titles are `text-small` (19px), `md:text-large` where a dialog wants the
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
<DialogContent className="flex flex-col h-[calc(100svh-var(--kb,0px)-8px-env(safe-area-inset-top))] md:h-auto md:max-h-[85vh]">
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
gap on the scroll body (`-mb-2 md:-mb-5`) and the footer's `mt-2`, so the list
runs right up to the bar. A strip of empty sheet between a half-row and the
bar looks like a mistake; the bar's edge doing the cutting does not.

## Spacing

| Token | Phone | `md` (768) and up |
|---|---|---|
| Gutter (`p-…`) | 12px | 24px |
| Gap between bands | 8px | 20px |
| Header height | `min-h-8` (matches the ✕) | same |
| ✕ offset | `top-3` | `md:top-6` |

The gutter matches `--page-px` at phone width. A sheet spans the whole screen,
so a 24px gutter would cost 48px of a 320–375px width — enough to visibly
squeeze list rows. The footer's full-bleed negative margins must match the
gutter at **both** sizes (`-mx-3 md:-mx-6`) or the bar stops short of the edges.

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
  safe-area inset, and `md:hidden`.
- The confirming action is a full-width `size="lg"` (48px) button in
  `DialogFormActions`, the band below the body. The sheet already ends at
  `--kb`, so it sits directly on the keyboard. Never offered twice — bar
  **or** action row.
- `DialogFormBody` restores the gutter and a tighter `gap-3`: on a phone every
  gap competes with the keyboard for the same ~200px.
- **No field label** where the placeholder carries it — every line costs space
  above the keyboard. Keep an `aria-label`.
- **Desktop is untouched**: the bar is `md:hidden`, the body is `md:contents`
  (it dissolves into the modal's ordinary grid), and the usual
  `DialogHeader` / `DialogFooter` render. Gate the two with `useIsMobile()` so
  there is never more than one `DialogTitle` in the DOM.
- **Focus goes straight to the field**, phones included — and as a FUNCTION,
  `initialFocus={() => inputRef.current}`, not as the ref. Opened by touch the
  popup's default is to focus itself so the virtual keyboard stays down, which
  is right for a picker and wrong for a form whose one job is to be typed into;
  returning the field for every interaction type overrides that. Naming is the
  only thing this sheet asks for, so the keyboard coming up with it saves a tap
  — and because the sheet is anchored top and ends at `--kb`, nothing it shows
  is behind the keyboard. (It used to park focus on the bar to keep the
  keyboard down; the full-screen presentation is what made that caution
  unnecessary.)
- **iOS needs the keyboard opened inside the tap.** Focus alone is not enough:
  Safari raises the virtual keyboard only for a focus that happens during a
  user gesture, and the sheet's focus lands a frame or two later. So the
  control that STARTS the flow focuses a zero-sized stand-in input that is
  already in the document (`CreatePlaylistProvider`), and the keyboard then
  follows focus into the real field when the sheet mounts. The stand-in is
  transparent and `size-px` rather than `hidden`, because a `display: none`
  field cannot take focus; it is `tabIndex={-1}` and `aria-hidden`. Only
  primed on `(pointer: coarse)`.

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
top, `md:flex-row`) — one edge of chrome, not a pill hovering over a bar. A
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
| `dialogPositionClass` | bottom sheet on phones, centred modal from `md` (768) |
| `dialogPreviewPhoneClass` | the sheet shape for the static `DialogPreview` when `useIsMobile()` says phone — in the design-system frame that is the window chip, so a "375" frame shows the sheet, edge to edge, top corners only (`!` because the live `md:` classes still match on a desktop screen) |
| `dialogFormPositionClass` | the full-screen form presentation |
| `dialogHeaderClass` / `dialogHeaderStackClass` | the header column |
| `dialogTitleClass` | `text-small`, `font-medium` |
| `dialogListClass` | the scrolling list band |
| `dialogFooterClass` | full-bleed bar, sticky on phones |
| `dialogActionBarClass` / `dialogFormBodyClass` / `dialogFormActionsClass` | the form sheet's three bands |

`dialogHeaderSpacerClass` is **deprecated** — the header no longer centres its
title, so nothing has to be balanced against the ✕.

## Sizing

Reads the **window**, one step: **768** — `md:` in the class strings and
`useIsMobile()` in `DialogPreview`, the same gate. Below it every dialog is a
bottom sheet (`inset-x-0 bottom-[var(--kb,0px)] max-w-full`, capped at
`100svh − --kb − 8px`, scrolling internally); from 768 it is a centred modal
at `md:max-w-sm` (384px) unless the dialog sets its own `md:max-w-*`, and
`md:max-h-none` unless it caps itself. The width is never the column's: a
sheet spans the window and a modal floats over it.

One dialog measures a box of its own — the [paywall](paywall.md), whose body
goes two-column at 760px of *dialog* width because the dialog is `80vw`.

Inside the design-system frame the chip is the window: `DialogPreview` reads
it through `useIsMobile()` and takes the sheet shape (`dialogPreviewPhoneClass`)
at 320–584, so a "375" frame shows the sheet without a click, while a live
trigger opens the real, portaled sheet at the bottom of the browser.

## Behaviour

- **Modal** (Base UI default): focus is trapped, page scroll is locked,
  pointer interaction outside is disabled.
- **Closes** on the ✕, any `DialogClose`, a click on the backdrop and
  `Escape` (`disablePointerDismissal` is left at its default, `false`).
  `onOpenChange(false)` fires for all of them, so a caller resets its own
  state there.
- **Keyboard.** On iOS the sheet rises with `--kb`; `scroll-padding-bottom:
  8rem` keeps a focused field clear of the sticky footer. A `mobile="form"`
  sheet focuses its field on open (`initialFocus` as a function, overriding
  the touch default), because it is anchored top and nothing it shows is
  behind the keyboard; the flow's trigger primes the keyboard inside the tap.
- **Backdrop** is `bg-black/10` with a light blur — the page stays legible
  behind a picker; the [alert dialog](alertdialog.md) darkens it to `/40`.

## Motion

**Colour changes fade through `state-fade`** — `color, background-color, border-color, outline-color, opacity` on `cubic-bezier(0.2,0,0,1)`, 440ms in and 100ms out. The split needs no second mechanism: the transition that runs on the way in is the one declared on `:hover`, the one on the way out is the one on the element. Prose links inside a `DialogDescription` carry it too, through `*:[a]:state-fade`.

## Open questions

- DESIGN_SYSTEM.md "Forms go full-screen" · says "don't autofocus the field on phones — park `initialFocus` on the bar" · `create-playlist-dialog.tsx:150` passes `initialFocus={inputRef}` and this doc says focus goes straight to the field. The DESIGN_SYSTEM bullet predates the top-anchored form sheet.
- DESIGN_SYSTEM.md, same section · says the `DialogActionBar` carries "`leading` Cancel (ghost) · `DialogTitle` (`text-base font-medium`)" · `dialog.tsx`: the bar's title is `dialogTitleClass` (`text-small`) and dismissal is the ✕ in `trailing`; there is no Cancel (this doc, "Header").
- dialog.tsx `dialogChromeClass` is `p-3 md:p-6 gap-2 md:gap-5`. A dialog that passes `p-0 gap-0` to own its bands (Purchase, Paywall, Checkout, Credits) cancels only the phone half: tailwind-merge keeps `md:p-6 md:gap-5` (a variant is a separate key), and at ≥768 the media-query rule outranks bare `p-0`. If a desktop screen shows 24px of chrome padding around those dialogs' own `px-6` sections, the fix is `md:p-0 md:gap-0` at each call site — not verified here (no browser).
- `dialogPreviewPhoneClass` forces `!p-3 !gap-2` on every preview at a phone chip, including the `p-0 gap-0` previews above, so a 375 chip shows them with a 12px gutter the live sheet does not have.
