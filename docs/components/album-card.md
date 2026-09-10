---
title: Album Card
source: src/components/ui/album-card.tsx
related: [card-rail, responsive, detail-more-button, button, gesture]
usage:
  - Library › Albums | /?page=Albums
  - Artist › Top Albums | /?page=Artist
  - Artist › Discography (grid) | /?page=Artist
  - Home › New Albums rail | /
---

An `AlbumCard` is a square cover over two lines of text — title, then
artist · year — with an optional third line for the album's monetisation
state. It is a **navigation surface**: the cover and the title open the album,
the artist opens the artist. Playing and saving are their own buttons in a
hover cluster on the cover; they never navigate.

## Usage

```tsx
// The Library grid — `.grid-cards` on the <ul>, one card per <li>.
<div className="@container">
  <ul className="grid-cards">
    <li><AlbumCard cover={a.cover} title={a.title} artist={a.artist} year={a.year} /></li>
    …
  </ul>
</div>

// A paid release: stream price alone, or stream + download.
<AlbumCard … streamPrice="$1.99" />
<AlbumCard … streamPrice="$2.99" downloadPrice="$4.99" />

// Bought: the price gives way to "Owned".
<AlbumCard … purchased />

// Uploaded by this user: the hover cluster shows Edit instead of the heart.
<AlbumCard … owned onEdit={…} />
```

The card has **no width of its own** — `w-full min-w-0` — so the parent
decides: a `.grid-cards` track (`minmax(143px, 220px)`, see
[Responsive](responsive.md#the-column-ladder)) or a
[Card Rail](card-rail.md) `<li>`. Drop it in without a sized parent and it
fills whatever it is in.

| Prop | What it does |
|---|---|
| `cover` `title` `artist` | required; an empty `cover` renders the branded placeholder |
| `year` | rendered after the artist behind a `·`; tagged `data-card-year` so a dense rail can hide it |
| `streamPrice` / `downloadPrice` | the third line for a paid release; `downloadPrice` only means something next to `streamPrice` |
| `purchased` | bought — the third line reads "Owned" and wins over any price |
| `owned` | uploaded by this user — Edit replaces the heart, the menu swaps Add → Edit and Report → Remove from library |
| `inLibrary` | already saved — drops the heart and the menu's "Save to library", surfaces "Remove from library" |
| `onMore` | **legacy** — the card raises its own sheet on a long press now; a host that passes this still gets called |
| `onTitleClick` / `onArtistClick` | override the text destinations; the title falls back to opening the album |
| `onAdd` `onEdit` `onAddToPlaylist` `onGoToArtist` `onGoToAlbum` `onRemove` `onReport` `onShowInfo` | the "…" menu's rows; a row only renders when its handler exists |
| `hideGoToArtist` / `hideGoToAlbum` | drop a nav row on the page it would lead to |
| `onPlay` | **declared but unused** — the card plays itself (see below) |

Used by Library › Albums, the artist page's Top Albums rail and Discography
grid, and the Home rails.

## The card is a nav surface; Play and Save are buttons

| Target | Action |
|---|---|
| cover — tap / click | open the album detail (`openAlbum(slugify(title))`) |
| cover — long press (450–500ms, 8px tolerance) | the album's own `DetailMenuSheetBody` sheet |
| title | open the album (or `onTitleClick`) |
| artist | `onArtistClick` |
| Play (hover) | play the album's **first track**, context = the album — never navigates |
| Heart (hover) | `LibraryHeartButton`: toggles the library store, fills when saved, its label flips between "Save to library" and "Remove from library" |
| ⋯ (hover) | the shared album menu |

Play is **self-contained**: the card resolves its own detail record
(`getAlbumDetail(key).tracks[0]`) and hands that to the player. The legacy
`onPlay` prop — which hosts historically wired to navigation — is
deliberately not called, so a host cannot turn the Play button back into a
link. `onAdd` still feeds the menu.

Every action button sits inside a wrapper that stops `pointerdown`,
`pointerup` **and** `click` (`album-card.tsx:189–192`), and each button stops
its own click again. The cover's tap is a real `click` (next section), so a
click that bubbled out of the cluster would open the page on top of the
action; the pointer events are stopped too so pressing a button never starts
the cover's long-press timer.

The library key is `libraryIdForTitle(title) ?? slugify(title)`: the
catalog id (`a02`) where the album is in the catalog, the slug where it is
not. That is the same key the detail page and its heart use — a card writing
to a different key than its page is why hearts silently desync. On mount the
card also registers itself in the catalog (`registerAlbums`, idempotent, never
overrides a richer record) so a card synthesised from a bare title still opens
a real detail page.

## The tap is the browser's `click`, never a synthesised one

`useLongPress` (`src/lib/use-long-press.ts`) drives the cover. It starts a
**500ms** timer on `pointerdown`, cancels it if the pointer moves more than
**8px** or lifts, and fires `onLongPress` when it runs out. For the tap it
does nothing at all: it listens for the browser's own `click` and forwards it.

The reason is what the browser knows and the component cannot: whether the
touch turned into a scroll, whether the page was still gliding, whether the
finger left the element. The browser withholds the click in all of those
cases. An earlier version fired on `pointerup` behind the same 8px guard — a
crude re-implementation of one small part of that rule — and the symptom was
a light flick to scroll a page of large covers opening an album, because
from the element's point of view the finger went down and came up.

The one case the browser cannot know about is the click it sends **after a
completed long press**. The hook swallows exactly that one (`preventDefault`
+ `stopPropagation`) so a press that opened the menu does not also navigate.

## The cover carries no `touch-action`

```tsx
<div {...coverGestures} className="relative aspect-square w-full overflow-hidden cursor-pointer select-none">
```

No `touch-none`, on purpose. A cover is most of a card's area, so a swipe
along a rail almost always starts on artwork; `touch-action: none` there told
the browser not to pan for those gestures and the rail simply refused to
scroll. The rail owns the axis rule (`touch-pan-x touch-pan-y`, see
[Card Rail](card-rail.md#scrolling-snap-is-mandatory-and-both-touch-axes-are-listed));
the cover leaves it alone. The long press survives this because it is a timer,
not a gesture recogniser — handing the pan to the browser does not cancel it,
the 8px move does.

## The hover cluster is pointer-only

```tsx
<div className="… opacity-0 transition-opacity group-hover/album:opacity-100 group-focus-within/album:opacity-100">
```

Tailwind v4 wraps every `hover:` / `group-hover:` utility in
`@media (hover: hover)` and this project does not override that variant
(`app.css` defines only `3xl` and `dark`), so the cluster never fades in on a
touch screen and there is no sticky hover after a tap. `group-focus-within`
is the keyboard path: tabbing onto any of the three buttons reveals the whole
cluster.

Touch gets the same actions another way: **a long press on the cover raises
`DetailMenuSheetBody`** — the same sheet the album detail page and the list
rows raise. Not the ⋯ menu rendered as a sheet: a phone should get one menu
shape per entity, wherever it was reached from, and the kebab keeps the
anchored dropdown, which is the right shape for a mouse.

The card raises that sheet **itself**. It used to call an `onMore` prop, and
no host in the app passed one — so until the touch pass, holding an album card
did nothing at all. `onMore` is still called when a host passes it, but
nothing needs to.

Three things the press has to get right, each a bug first:

- **The hold is visible from the first frame.** `data-pressing` becomes
  `scale: 0.98` and a slight darkening (`app.css`, coarse pointers only), so
  the wait reads as the card being taken rather than a tap that did not
  register — otherwise people lift and try again, which is a tap, which opens
  the album.
- **A drag past 8px cancels the hold and swallows the click.** The browser
  suppresses a click after a *scroll*, but a short drag — the start of a rail
  swipe — is not a scroll as far as it is concerned, so the card opened the
  album the finger was swiping past. Reported as *"the cards are too sensitive
  to taps"*.
- **iOS's own image menu is declined globally** (`-webkit-touch-callout:
  none`), or Share / Save to Photos / Copy Subject arrives on top of ours. It
  has to be in force before the finger lands, so it cannot come from the
  handler.

See [Gesture](gesture.md) for the shared numbers.

The ⋯ button's own menu is a `DropdownMenu`, which below a **768px** viewport
(`useIsMobile`) presents as a bottom sheet rather than a popover — a window
gate (768, presentation), not a hover gate, because the headless preview
reports `hover: hover` at phone width and hybrid laptops do too.

Behind the cluster a gradient fades in on the same triggers:
`from-black/45 via-black/10 to-transparent`, bottom to top,
`pointer-events-none`. It is always black — not a theme token — because the
buttons over it are always the same light-on-dark glass, in either theme.
The `/45` cap is deliberately soft so the artwork stays readable under it.

## Cover buttons: `border-0` because Button clips its background

```tsx
const COVER_BTN    = "border-0 bg-neutral-100/50 text-neutral-900 backdrop-blur-xs hover:bg-neutral-100"
const COVER_BTN_SM = `${COVER_BTN} size-6 [&_svg]:size-3`    // heart / Edit — 24px, 12px glyph
const COVER_BTN_LG = `${COVER_BTN} size-10 [&_svg]:size-4`   // Play — 40px, 16px glyph
```

The three are `Button variant="outline"`. Button's base carries `border` and
`bg-clip-padding`, and the outline variant paints a `border-border` ring over
a `bg-background/20` glass fill. `bg-clip-padding` stops the fill at the
inside edge of the border, so on artwork the 1px ring is drawn in the border
colour with nothing behind it — a hairline "ghost edge" around every button
where the photo shows through. Removing the border (`border-0`) removes the
ring; there is nothing left for the clip to expose, and the translucent fill
is the whole circle.

The fill is a fixed `neutral-100/50` with `neutral-900` glyphs rather than
`background` / `foreground` tokens, for the same reason the gradient is
black: the buttons sit on artwork, not on the page surface, and must read the
same in both themes.

The two sizes override Button's own: `icon-sm` is 32px, here `size-6` makes it
24 — the `after:-inset-1` hit area that `icon-sm` brings along still applies,
so the 24px heart is a 32px target. Play keeps `icon`'s 40px. The ⋯ trigger is
a styled native `<button>` with the same look (`cover-card-menu.tsx:44–49`),
kept out of `Button` to avoid a nested-button edge case in the menu
primitive; it is 24px with no hit extension.

## The text block

```tsx
// title
"text-xsmall leading-[18px] font-normal text-foreground line-clamp-2"
// artist · year, price, Owned
"text-xsmall leading-[18px] font-light tracking-[0.02em] text-muted-foreground"
```

Title and meta share one size — `text-xsmall`, 17px, on an 18px line. The
**weight** separates them, not the size: the title is `font-normal`, the meta
rows `font-light` with `0.02em` of tracking to open the thin Light strokes.
Both the card and its text stack use a single `gap-1` (4px), so cover → title
→ meta → price sit on one even rhythm.

- The title clamps at **two lines**, so a long release name wraps instead of
  truncating mid-word and the card's height stays predictable. The artist
  truncates on one line.
- Title and artist carry `link-underline`: the line wipes in from the left
  over 140ms and sits 3px under the baseline, derived from the element's own
  `line-height` and font metrics rather than a fixed number. Both also keep
  `pb-[6px] -mb-[6px]`: the clamp and the truncation are `overflow: hidden`,
  which would cut the line; the padding gives it room and the negative margin hands the
  space back so the rhythm does not change.
- The year is wrapped in `<span data-card-year>`. A dense layout hides it
  from CSS rather than by prop — Card Rail's `mobileGrid` uses
  `@max-[559px]:[&_[data-card-year]]:hidden` because its two-row phone grid
  makes cards too narrow for artist and year on one line. It returns on the
  single row from 560 up.

## The third line: only when there is something to say

| State | Renders |
|---|---|
| free (streams under the subscription) | nothing — the absence of a price is the signal |
| `streamPrice` | `$1.99` |
| `streamPrice` + `downloadPrice` | `$2.99 · $4.99 ⤓` — the download tier gets a 12px download glyph, the separator is at 30% opacity |
| `purchased` | `✓ Owned` via `PurchasedBadge`, in `text-foreground` |

`purchased` wins over any price. Prices are `tabular-nums`. Both the price
line and "Owned" are line boxes on the meta row's exact metrics (size, weight,
tracking, 18px leading) rather than a centred fixed-height box, so the
artist → status gap equals the title → artist gap. `purchased` (bought) and
`owned` (uploaded by this user) are independent flags.

## Missing artwork

The cover is `CoverArt`: a square `<img>` that swaps to a `bg-muted` box with
a solid-`secondary` muza mark when `src` is empty or fails to load — the same
placeholder the artist circle and song rows use, so an empty state reads as
intentional. The card passes it no classes, so the cover has **no radius**.

## Spacing

| Part | Value |
|---|---|
| Cover | `aspect-square`, full card width, no radius |
| Cover → text, title → meta, meta → price | `gap-1` (4px) |
| Cluster inset | `p-1.5` (6px) from the cover's edges |
| Cluster buttons | 24px, `gap-1.5` between them; Play 40px, right-aligned |
| Text | 17px / 18px line |

## Open questions

- claims "Cover area: tap to play, long-press to call `onMore`" (`album-card.tsx:73`) · source: the tap opens the detail page (`album-card.tsx:150–152`, `goAlbum` at `:134`); playing is the Play button only.
- claims the kebab stops `pointerup` "which is where useLongPress fires its tap → onPlay" (`cover-card-menu.tsx:122–125`) · source: `useLongPress` fires on the browser's `click`, not `pointerup` (`use-long-press.ts:69–79`), and the cover's tap opens rather than plays (`album-card.tsx:151`).
- claims the hover cluster is "Hidden on touch" (`album-card.tsx:181–183`) · source hides it with `opacity-0` only (`album-card.tsx:193`) — no `pointer-events-none`, no `[@media(hover:none)]:hidden` — so the invisible Play / heart / ⋯ still receive taps on a touch screen, and the wrapper's `stopPropagation` (`:189–192`) then also swallows tap-to-open over that strip of the cover.
- ~~claims "long-press → bottom sheet", "parent renders Sheet" · no host passes `onMore`, so a long press does nothing anywhere~~ · **answered by the touch pass**: the card raises `DetailMenuSheetBody` itself, so it no longer depends on a host wiring a prop.
- claims card titles are a `font-medium` exception to the sub-18px rule (`DESIGN_SYSTEM.md:414`, `:418`) · source title is `font-normal` (`album-card.tsx:258`), as `DESIGN_SYSTEM.md:399` itself says.
- claims `purchased` "Surfaces the 'Owned' pill" (`album-card.tsx:60–61`) · source: `PurchasedBadge` is glyph + label with no pill chrome, the pill was tried and dropped (`purchased-badge.tsx:7–10`).
- claims the 17px step is `text-xs` (`DESIGN_SYSTEM.md:397`) · source uses the semantic alias `text-xsmall` (`album-card.tsx:116–117`, `app.css:251`), which is the rule elsewhere in the system.
