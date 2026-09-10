---
title: Player Overlay
source: src/components/ui/player-overlay.tsx
related: [player-bar, footer-nav, tabs, song-list-item, responsive]
usage:
  - The player, expanded (mobile) | /?page=Home
---

The full-screen "Now listening" sheet on phones — cover, title and artist,
waveform, transport and the Lyrics / Now listening / Up next tabs — that
slides up when the mini [Player Bar](player-bar.md) is tapped. It sizes
itself to the height it is given so every element stays on screen without
scrolling, from a 568px-tall SE to a 956px Pro Max.

## Anatomy — top to bottom

| Part | What it is | Tokens |
|---|---|---|
| Backdrop | the cover, full-bleed, `blur(32px) scale-110`, under the same `.frosted-glass` the tab bar and the mobile header use, so the overlay reads as one continuous glass with the rest of the chrome | `bg-background` under it all |
| Drag handle | a `ghost` `Button`, `w-full py-4 h-auto rounded-none`, holding a `h-1 w-8 rounded-full` pill; tap → `onClose` | `bg-foreground/80` |
| Playing from | "Playing from:" and the source as a `MarqueeText` — a link when `onPlayingFromClick` is passed | `text-xsmall leading-none font-normal`, `text-muted-foreground` / `text-foreground` |
| Cover | a square, `rounded-xs shadow-md art-edge`, sized 140–440px by the budget below | `art-edge` is the 1px inset outline every piece of artwork carries — black at 10% in light, white at 10% in dark — so a pale cover still has an edge against the blurred version of itself behind it |
| Title row | `h2` with a `MarqueeText`, a `LibraryHeartButton` for the song and a "…" button, both `outline` `icon` | `text-large font-medium leading-tight text-foreground` |
| Artist row | avatar `size-6 min-w-6 rounded-full ring-1 ring-border` + name; a link when `onArtistClick` is passed | `text-xsmall font-medium text-muted-foreground` |
| Waveform row | `mt-3`, timestamps either side, the `Waveform` 40–160px tall; marked `data-swipe-ignore` because it owns its own horizontal drag (seek) | `text-2xsmall leading-none text-muted-foreground tabular-nums` |
| Secondary icons | Info · Share · Radio, `ghost` `icon-sm`, glyphs `size-5` at stroke 1.5, `gap-8`, centred in a `flex-1` region with `py-2` so they never touch a neighbour | — |
| Transport | Shuffle · Previous · **Play** · Next · Repeat, `gap-3`, sizes interpolated by height (below); **`shrink-0`, not `flex-1`** — pinned just above the tabs so the controls sit in the same place on every tab | `ghost`, `hover:bg-transparent` |
| Tabs | `Tabs variant="pill"` — Lyrics · Now listening · Up next; `pt-5 pb-6`, the triggers `font-normal!` because the pill variant's own `font-medium` has equal specificity and wins by source order without it | — |

**Up next** replaces the middle: the current track as a `QueueRow` with a
progress fill (`bg-background/85` to the played fraction, on a slightly
larger row `ring-1 ring-inset ring-border/40`), then the queue, reorderable
by its grip — pointer events, `touch-none` on the grip so a vertical drag
reorders instead of scrolling, one slot per full row height crossed. The
order is local; the list re-seeds only when the queue's *contents* change,
because the parent rebuilds the array every tick and syncing on identity
would wipe a reorder each second. **Lyrics** shows the same row without the
fill, then the lines — the active one derived from progress and scrolled
to centre, the rest at 60% — with a stanza break as an empty line (`h-3`).
Both scroll regions carry a top and bottom mask so rows dissolve into the
chrome instead of hard-cutting above the pinned transport.

## Usage

```tsx
// AppPlayer, below 608 — slid up over the footer nav and the mini bar.
<div className={cn(
  "absolute inset-0 z-50 transition-[transform,visibility] duration-300 ease-out",
  open ? "translate-y-0 visible" : "translate-y-full invisible pointer-events-none",
)} aria-hidden={!open}>
  <PlayerOverlay track={barTrack} playingFrom={playingFrom || track.album}
    currentTime={currentTime} totalTime={track.totalTime} artistAvatar={track.artistAvatar}
    bound={bound} shuffle={shuffleBound} onSeek={onSeek}
    onArtistClick={…} onPlayingFromClick={…}
    queue={queue} onPlayQueueTrack={…} onClose={() => setOpen(false)} />
</div>
```

**Closed, it must be `invisible`, not merely translated off-screen.** The
glass's `backdrop-filter` ignores the wrapper's `translate` and would keep
painting a full-screen blur over the tab bar and the mini pill — hiding
the tabs and swallowing taps. `visibility: hidden` stops it; transitioning
`visibility` keeps the slide-out animation visible. `queue` is the rest of
the source you are playing from — the playlist's or album's other tracks,
else your saved songs — wrapped past the current track so it cycles. Both
`bound` and `shuffle` bind to the store as on the bar; omitted, they are
local.

## Sizing

Two measures, neither the window.

**Height, by budget.** A `ResizeObserver` on the root reads its height `H`
and width `W` and solves:

```text
FIXED     378   drag ~36 + playing-from ~50 + gap 8 + title block ~76
                + icons floor 48 + transport floor 80 + tabs ~80
available H − 378
cover     clamp(140, min(available − 40, W − 32), 440)
waveform  clamp(40, available − cover, 160)
t         (H − 568) / (956 − 568), clamped 0–1
```

`t` drives the transport: Play 48 → 64 (glyph 36 → 48), skips 20 → 28,
Shuffle / Repeat 48 → 64 wide × 40 → 56 tall (glyph 20 → 28) — promoted to
the footprint of a first-class transport control rather than a secondary
one. The two `flex-1` regions (icons, and the swappable content) absorb
whatever is left after the cover and waveform hit their caps. `MAX_COVER`
is 440 so the cover fills a Pro Max's width less `px-4`; on smaller phones
the width cap wins first.

**Width, by its own box.** The root is `@container/overlay`, and its one
step is the lyric line: `text-large`, `text-xlarge` from **380**. The
container is *named* because the step once bound to whatever container
was nearest: in the app that was nothing, so it never fired; on the
design-system page it was the ~1400px page wrapper, so it always fired and
the phone frames showed a lyric size no phone renders.

In the frame the chips are the overlay's width, named `overlay`: 320 · 375
· 380 · 440, with the height following at a phone's proportions (9 : 19.5).
That makes the 320 frame taller than a real SE (693 against 568), so the
smallest device's transport sizes are not what the frame shows; the width
step is exact.

## Behaviour

- **Swipe** sideways to change tab: a mostly horizontal flick of at least
  56px (`|dx| ≥ 1.4 · |dy|`), in the tabs' visual order, ignored when it
  starts on the waveform. The content remounts keyed by tab so the
  directional slide (`animate-tab-next` / `-prev`) replays on every change,
  tap or swipe.
- **Play / Pause** on the transport or the queue's now-playing row; **seek**
  on the waveform (unbound, starts playback); **Shuffle** through the
  store when bound; **Repeat** is local.
- **Up next**: tap a row → `onPlayQueueTrack(track)`, which the app answers
  by playing it in the same source context so the queue simply advances.
- The drag handle's tap calls `onClose`. The overlay never scrolls as a
  whole; only the queue and the lyrics do.

## It is its own container, and the container is NAMED

The overlay declares `@container/overlay` on its root, and the lyric lines
step up a size at 380px through `@min-[380px]/overlay:`.

The name is the fix, not a tidiness preference. An **unnamed** container query
resolves against the nearest container ancestor — and there was none in the
app, so the step silently never fired on a real phone. On the design-system
page the nearest ancestor was the page's own ~1400px wrapper, so it fired
**always**: the 375px frames showed 30px lyrics no phone would ever render.
One query, wrong in both directions, for opposite reasons. Naming the
container pins it to this element wherever the overlay is mounted.

## Motion and state

| What | How |
|---|---|
| Tab change | the content is keyed by `tab`, so it remounts and `animate-tab-next` / `animate-tab-prev` replays — a 190ms `cubic-bezier(.2,.7,.3,1)` slide of 14px plus a fade, direction from the tabs' visual order |
| "Playing from" | the wrapping button carries `link-underline-group`, the `MarqueeText` inside it `link-underline`, so hovering the button wipes the underline in from the left. A `group-hover:` variant cannot do this — it compiles into the text's own `:hover` |
| Artist and title links | `state-fade` plus `hover:text-foreground` / `hover:opacity-80` — the shared 440ms-in / 100ms-out colour fade |
| Keyboard focus | `focus-ring`, the 2px outline at 20% of `--ring` |
| Transport | press is opacity, never geometry: `hover:opacity-70 active:opacity-40` on a shared `transportBtn`, whose transition names `scale` explicitly because Tailwind v4 compiles `scale-*` to its own property and a list saying `transform` animates nothing |
| The three `hover:bg-transparent` transport buttons | also `[--hover-fill:transparent]` — they are `Button variant="ghost"`, and the variant's own `--hover-fill` would otherwise grow the accent surface they deliberately do not want |

## Open questions

- DESIGN_SYSTEM.md › "Player components" › PlayerOverlay describes the
  header as `text-xxs` + `text-xs font-medium`, both muted · source is
  `text-xsmall` for both, the source line `font-normal text-foreground`
  (player-overlay.tsx:582, :591)
- the same section says the backdrop is tinted `bg-background/40
  dark:bg-background/70` · source lays `.frosted-glass` over the blurred
  cover (player-overlay.tsx:499)
- the same section says the title row holds "two `Button variant="outline"
  size="icon"` (Plus, MoreVertical)" · source: a `LibraryHeartButton` and
  MoreVertical (player-overlay.tsx:628–638); and "Artist badge — `Button
  variant="ghost" size="sm"`" · source is a plain button or `div` with the
  `size-6` avatar (player-overlay.tsx:644–672)
- the same section says the transport row is `flex-1` · source is
  `shrink-0`, on purpose, and the comment at player-overlay.tsx:724–728
  explains why it must not move between tabs
- the same section names `src/components/ui/shuffle-toggle.tsx` · the
  toggles live in `transport-toggles.tsx` (player-overlay.tsx:10)
- player-overlay.tsx:490 says the glass is "backdrop blur + saturate" ·
  app.css deliberately has **no** `saturate()` — the minifier collapsed it
  into an invalid empty call that voided the whole property (app.css:289)
- player-overlay.tsx:510 says the handle dismisses on "tap or swipe down" ·
  only `onClick` is wired; there is no vertical gesture on the sheet
- Info, Radio, "…", Previous and Next carry no handlers
  (player-overlay.tsx:636, :705, :715, :739, :757)
