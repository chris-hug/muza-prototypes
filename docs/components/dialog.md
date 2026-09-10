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
- Titles are left-aligned in `DialogHeader`. A centred title reads as a screen
  header but breaks the one vertical edge the sheet otherwise holds, and it
  shifts as the title grows.
- **On a phone a sheet with a back control uses the BAR instead**
  (`DialogActionBar`: back · title · ✕ on one line, title centred on the bar
  so it can't drift). `AddMusicDialog` renders the bar below 768 and the
  header above it, gated by `useIsMobile` so only one `DialogTitle` is ever
  mounted, and passes `showCloseButton={!isMobile}` so the corner ✕ doesn't
  double up with the bar's. Two reasons it wins there: the controls already
  occupied a line of their own above the title, which is pure cost at a
  keyboard height, and a sheet that chains into a form sheet should not change
  the shape of its head halfway through the flow.
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

Ending exactly at the keyboard is not enough, though: iOS draws its accessory
bar as a floating pill with transparent margins around it, so the page shows
through those margins as a strip of blurred backdrop between the sheet and the
bar. Both presentations continue their surface down behind the keyboard, by
different means:

- the **form sheet** keeps `bottom: 0` and holds the keyboard off with
  `padding-bottom: var(--kb)`. Content lands in the same place; the surface
  carries on underneath.
- the **bottom sheet** can't do that — the popup is also the scroll box, and
  its footer positions against the padding edge — so it gets a **keyboard
  skirt**: `[data-slot="dialog-keyboard-skirt"]`, a `fixed inset-x-0 bottom-0
  h-[var(--kb,0px)] bg-popover` sibling rendered just under the popup. Zero
  height, and so invisible, whenever there is no keyboard.

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
    <Button size="lg" className="w-full">Create</Button>
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
  safe-area inset, and `md:hidden`. 40px tall, which is its two 32px controls
  and a hair above them — every pixel here is one the content underneath does
  not get.
- **Its glass is the SHEET's, not the page's** (`.sheet-glass`). The page's
  `.frosted-glass` mixes `--background` and carries a sheen and a grain, and
  over a `--popover` sheet that reads as a band across the top: a different
  colour, faintly textured, exactly as wide as the bar. `.sheet-glass` is 72%
  of `--popover` and a 12px blur — over the sheet's own surface that resolves
  to the surface, so the bar is invisible at rest and shows itself only by
  blurring what scrolls under it. `AddMusicDialog` makes the bar `absolute` so
  the list runs full height beneath it, which is what there is to blur. Pass
  **`plain`** for a bar with nothing behind it at all (unlayered CSS, so a
  utility class cannot override either one).
- The confirming action is a full-width `size="lg"` (48px) button in
  `DialogFormActions`, the band below the body. The sheet pads itself off the
  keyboard, so the action sits directly on it. Never offered twice — bar
  **or** action row.
- **The sheet is ONE surface, action included**, down to the keyboard. The
  band was tried the other way — popup transparent (`max-md:bg-transparent`),
  bands painting, the pill floating over the page with a `shadow-lg` — on the
  reasoning that a lone control reads as an object rather than as a bar, the
  rule the find screen's lone search field follows in `AddMusicDialog`. It does
  not carry over: that field floats over the sheet's own rows, while here, with
  the keyboard up, there is no page left to float over — only a ~60px strip of
  blurred backdrop between the form and its button, which reads as a seam.
  Two things came back with the surface: the pill needs no lift, and
  `disabled:opacity-50` works again, because it has something to fade against.
  (Over the page it didn't: the artwork showed straight through the pill, and
  the disabled colours had to be mixed by hand.)
- **The pill names the verb only** — "Create", not "Create playlist". The
  title two bands above already says what is being made, and there is no
  second action to distinguish it from. The desktop footer keeps the long
  label, where it stands next to Cancel.
- `DialogFormBody` restores the gutter and a tighter `gap-3`: on a phone every
  gap competes with the keyboard for the same ~200px.
- **With the keyboard up it is not ~200px, it is ~170px.** Measured on an
  iPhone in Brave: 495px of layout viewport, 169px visible above the keyboard
  and its accessory bar. The bar (48) and the action band (72) would
  leave the 48px field 49px, and the field was clipped. So while
  `data-kb="open"` is set on the root — by `useKeyboardInset`, since no media
  query can see this squeeze — the three bands drop their padding: the bar to
  `min-height: 2.5rem`, the body to 8px (4px at the bottom, the band below
  carries the rest), the action band to 8px top and bottom. Only padding gives
  way; every control keeps its size.
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
  — and because the sheet is anchored top and pads itself off `--kb`, nothing it shows
  is behind the keyboard. (It used to park focus on the bar to keep the
  keyboard down; the full-screen presentation is what made that caution
  unnecessary.)
- **The confirming action refuses focus** (`onPointerDown` → `preventDefault`).
  A tap on a button moves focus to it, which closes the keyboard, which lets
  the sheet grow back to full height — and the button travels down out from
  under the finger before the click resolves, so the first tap does nothing
  and only the second lands. Keeping focus in the field keeps the keyboard,
  the height and the button where they were; the click still fires. Only the
  action needs this: the rows in a sheet are not focusable, so tapping one
  never moves focus, and a control anchored to the TOP of a sheet does not
  travel when the height changes.
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

## Picking is not committing

Two sheets in the product are "pick things from a list": Add-music (tracks into
a playlist) and Add-to-playlist (a track into playlists). They use **the same
row** — `MediaListItem` with a `SelectTrackButton` on the right — because a row
that COMMITS on tap while looking like a row that picks is a difference nobody
reads in advance.

So a tap toggles, the bar's trailing slot carries the commit (`Add 4`, `Done`)
and is dismissal until there is something to commit, and closing with picks in
hand asks first. One song can go into several playlists in one visit, which is
the point: the alternative is reopening the same sheet from the same "…" three
times to file a track in three places.

## A sheet you can flick away is one you can flick away by accident

A bottom sheet holding work confirms before it closes. `AddMusicDialog`
intercepts `onOpenChange(false)` while anything is picked and raises an
[alert dialog](alertdialog.md) — "Discard 4 tracks?" · *Keep picking* /
*Discard* — with the sheet still mounted behind it, so cancelling returns to
the same screen, query and selection.

What makes the drag feel like a drag, all of it learned by it not feeling like
one: the sheet re-bases on the point where the gesture CROSSED the slop, so it
does not jump 6px the moment it starts; it writes one transform per frame,
because pointer moves outrun the paint and a write per event stutters against
itself; it refuses the browser's scroll through a non-passive `touchmove` for
the duration, since `touch-action` is read when a gesture starts and comes too
late once a finger is already moving; and the release velocity comes from 120ms
of samples rather than the last two, which routinely read as zero (same
timestamp) or as a flick (2px apart).

The gesture and the confirmation have to agree about this: `useSheetDrag`
carries the sheet out of frame before it asks the dialog to close, so when the
close is refused it puts the sheet back (`data-open` still set a frame later =
refused). Without that, answering "Keep picking" left a backdrop over an empty
screen with the sheet parked below the bottom edge.

It guards **every** exit, not just the gesture: the ✕, the backdrop and Escape
lose exactly as much as a pull-down does. That is the platform rule — iOS
bounces the swipe on a modal with unsaved input and asks; Material asks too —
and it is why the `mobile="form"` sheet takes the other half of the same rule
and refuses the gesture outright (`useSheetDrag` is off there): a form sheet's
content is a half-typed field, and there is nothing to confirm against yet.

## Search inside a sheet is a screen, not a field

Focusing the search input switches the sheet to a **find screen**
(`AddMusicDialog`): the browse chrome steps aside and a back control appears
at the head of the bar. Three bands, and only the middle one moves — the same
shape as the form sheet, for the same reason.

- With **nothing to recall** — the first search of a new playlist — the empty
  state fills the space and is centred in it, rather than a line of grey text
  under the bar with a field at the far bottom, which reads as a sheet that
  failed to load. With a keyboard up it drops to the headline alone
  (`[data-kb="open"] [data-slot="find-empty"] > p + p`): ~60px is one line, and
  two would sit half behind the field.
- With no query it shows **the invitation and nothing else** — no recent
  searches. With a keyboard up this band is ~60px, one row: a history list
  there is a heading, a Clear and one stale query sitting exactly where the
  results are about to appear. The app's own search keeps its history
  (`SearchPanel`); a sheet you opened to add a track does not need one, and
  the store that backed this one is gone with it.
- The **title does not change**. What you're filling is the same job either
  way, and swapping in "Find" would drop the only context on screen.
- Move the **footer**, never the field: re-parenting the input remounts it and
  throws away the focus that opened the screen.
- **The popup cannot scroll, and is pinned to prove it.** `overflow-hidden`
  stops a finger, not the engine: focusing a field near the bottom makes the
  browser scroll the nearest scrollable ancestor to reveal the caret, and an
  `overflow: hidden` box still qualifies. Since the bands are positioned
  against the popup, all of them went up with it — a blank sheet with a field
  at the bottom, which is what the keyboard did to Add-music. `DialogContent`
  listens for `scroll` on the popup and puts it back to 0; there is no event
  to decline, so scrolling it back is the answer.
- **The popup does not scroll — the list does** (`overflow-hidden` on the
  content, `flex-1 min-h-0 overflow-y-auto` on the list). This is not a detail:
  the browser scrolls a focused field into view inside whatever box can
  scroll, so a scrolling popup carried the TITLE off the top when the keyboard
  opened, and scrolling the results then carried the FIELD off the bottom.
  With the popup fixed, both bands can be **absolute** and neither moves.
- **Both bands overlay the list, and the list runs full height under them**
  (`-my-3` over the sheet's padding, then `pt-[var(--sheet-bar-h)]` and
  `pb-[var(--sheet-band-h)]` — the two heights live in `app.css` next to the
  paddings they are made of, and shrink under `data-kb="open"`). Rows scroll
  *behind* the glass bar and *behind* the floating field, which is what makes
  a short list read as a list rather than as three stacked boxes. Anything
  that stops the rows short — a solid band, a band in the flow — cuts the
  results off instead.

**The find screen's band carries no surface** — `border-t-0 bg-transparent`,
with `bg-popover shadow-lg` on the FIELD instead. A field is an input, not a
bar; the surface belongs to the thing you type in, so the rows can pass under
it. It also sits as close to the keyboard as the padding allows (`max(4px, …)`
under `data-kb="open"`): the accessory bar is the next thing below it, and a
gap between the two reads as a stray band.

**On the find screen the confirming action moves into the BAR** — `Add 4` in
the trailing slot, where the ✕ sits the rest of the time (‹ is the way back
from Find, and the ✕ returns as soon as the picks are in). The band there
floats over the results, so a second control in it costs a row of a list that
is two rows tall with the keyboard up, while the bar is already on screen and
costs nothing. It also settles what a button under the field kept suggesting —
"show me these results" — so no gating on a submitted query is needed any more.

**One band on the browse screen.** The search field and the confirming action
share the footer
(`flex-col` so the field sits on top, `md:flex-row`) — one edge of chrome, not
a pill hovering over a bar. Spotify and TIDAL avoid the question entirely: a
bottom field means no bottom confirm, because each row commits on tap.

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
