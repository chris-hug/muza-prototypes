---
title: Player Bar
source: src/components/ui/player-bar-b.tsx
related: [player-overlay, footer-nav, song-list-item, responsive]
usage:
  - The player, on every listening page | /?page=Home
---

The persistent transport. From 640px of its own width it is the 80px glass
pill — the spinning disc, title and artist · album, transport, waveform and
volume; below that it is the 56px mini pill that opens the
[Player Overlay](player-overlay.md). `AppPlayer` mounts it once, bound to
the player store, and renders nothing until a track has been played.

## Anatomy

The root is the glass: `rounded-full border border-border bg-background/75
backdrop-blur-md` with a four-layer soft shadow, `overflow-visible` so the
disc can overhang it.

### Desktop — the 80px bar (bar ≥ 640)

| Part | What it is | Tokens |
|---|---|---|
| Current track | the left section, `w-[max(15rem, calc(24cqw + 5rem))]` — floors at 240px, then 24% of the bar plus 80px, uncapped, so a wide screen gives the title more room. A **solid** pill (`bg-background`, inset 11px on the right) plus a fixed SVG lens on its right edge makes the protruding notch from Figma | — |
| Disc | 96px, spindle 30, `absolute -left-[8px] -top-[8px]` — overhangs the pill by 8px; spins at one turn per 5s while playing, and **pauses in place** (the animation is always mounted, only its play-state toggles), so a pause never snaps it back to 0° | `ring-1 ring-black/10 shadow-md` |
| Text | title as a `MarqueeText`; artist · album beneath, each a link when its handler is passed | `text-small text-foreground` · `text-xsmall text-muted-foreground`, links `hover:text-foreground hover:underline` |
| Heart | a `LibraryHeartButton` for the song, `ghost` `icon`, glyph `size-5` | — |
| Right section | `flex-1`, `rounded-r-full`, `px-3 gap-3` → `px-5 gap-6` from 688; `min-w` 392 → 448 (688) → 524 (800), content-driven | — |
| Transport | `ShuffleToggle` (40×32, glyph 18) · Previous (30px) · **Play** (`size-12`, glyph 42, `hover:scale-110`) · Next · `RepeatToggle` — Shuffle and Repeat sit *inside* the transport row, outside the skip buttons, not in a far-right cluster | `text-foreground`, `hover:opacity-70 active:scale-90` |
| Waveform | `flex-1 min-w-[120px]`, 40px tall with a 72px hover line; timestamps either side, `hidden` until 800 | `text-2xsmall text-foreground tabular-nums` |
| Volume | a 32px `ghost` glyph that, on hover, grows **upward** into a pill holding a 75px vertical `Slider` | open: `ring-1 ring-inset ring-border bg-background shadow-sm` |

### Mobile — the 56px mini pill (bar < 640)

| Part | What it is | Tokens |
|---|---|---|
| Pill | `h-[56px] rounded-full`, **solid** — no glass (Figma 20673:8274); `role="button"` with `aria-label="Expand player"` when `onExpand` is passed, Enter / Space included | `bg-background` |
| Disc | 68px, spindle 23, `-left-[4px] -top-[7px]`; the text starts at `pl-[72px]` to clear it | — |
| Controls | Play / Pause and Next, glyphs 24px, `stopPropagation` so a tap on them never expands the bar | — |
| Progress arc | an SVG stroke along the pill's **flat bottom** only — between the cap tangents, 2px in, 4px wide, round caps — never climbing the rounded ends, which read as a stray hook near the end of a track. Dash math is normalised with `pathLength={1}` so a resize mid-track cannot desync it | `stroke: var(--muza-blue-200)` |

## Props

| Prop | What it does |
|---|---|
| `track` | `{ title, artist, album, image, url? }` — with a `url` the waveform decodes and drives its own time; without one it paints the played portion from the clock props |
| `currentTime` · `totalTime` | "m:ss" strings — the timestamps, and the fallback progress |
| `progress` | 0–1 from outside (the store's simulated clock); overrides the waveform's own time for the mobile arc |
| `bound` · `shuffle` | `{ playing, onToggle }` / `{ active, onToggle }` — bind play and shuffle to the store. Omitted, both are local state |
| `onSeek` | scrub on the waveform, in seconds |
| `onArtistClick` · `onAlbumClick` | make the subtitle's halves links |
| `onExpand` | mobile only: a tap on the pill outside its buttons |

## Usage

```tsx
// Desktop — AppPlayer, from 608 up: spans main minus the page gutter.
<div className="absolute inset-x-0 bottom-5 z-30 px-page pointer-events-none">
  <PlayerBar track={barTrack} currentTime={currentTime} totalTime={track.totalTime}
    progress={progress} bound={bound} shuffle={shuffleBound} onSeek={onSeek}
    onArtistClick={…} onAlbumClick={…} className="pointer-events-auto w-full" />
</div>

// Phone — AppPlayer, below 608: flush on top of the tab bar.
<div className="absolute inset-x-3 bottom-[calc(56px+max(10px,env(safe-area-inset-bottom)))] z-40">
  <PlayerBar … onExpand={() => setOverlayOpen(true)} />
</div>
```

The mobile slot's `bottom` is the [Footer Nav](footer-nav.md)'s height —
`8 + 48` plus the same safe-area pad — so the pill rests on the bar with
no gap; `z-40` puts the disc **on** the bar (`z-30`) instead of clipping
behind it. The heart needs a `UserLibraryProvider` above.

## Sizing

The bar measures its **own box** — the root is a `@container` — with three
steps:

```text
< 640   mini pill    56px, disc · text · play · next, progress arc
≥ 640   desktop      80px glass bar, transport + waveform + volume
≥ 688   roomier      right section px-3 → px-5, gap-3 → gap-6
≥ 800   timestamps   current / total appear beside the waveform
```

Why a box and not the window: the bar's width is `main − 2 × gutter`, which
is **not** the column — 640 is reached at a 740px window with the icon
rail (`740 − 52 − 48`) — and with the playlist editor docked at a 768px
window the bar has **294px** and must be the mini pill inside desktop
chrome. One window, two widths, so only the bar's own box can say which
(see [Responsive](responsive.md) › Box).

The steps are content arithmetic. The left section floors at 240 and the
right section's `min-w` is what its controls need, and the two sums are
the bar's absolute minimum in each tier, so nothing ever overflows:

```text
640:  240 + 392 = 632  ≤ 640
688:  240 + 448 = 688
800:  240 + 524 = 764  ≤ 800
```

The chips in the frame are the bar's width, named `bar`: 351 is the mini
pill at a 375 window (`inset-x-3`), then 640 · 688 · 800. The frame adds
the demo's 12px surround and the bar's own 1px border on each side, because
a container query reads the **content** box — a chip marked 640 must hand
the query 640, not 614.

## Behaviour

- **Play** toggles `bound.onToggle` when bound, local state otherwise; the
  disc, the glyph and `aria-pressed` follow.
- **Seek** on the waveform calls `onSeek(seconds)` and, unbound, starts
  playback.
- **Shuffle** through `shuffle.onToggle` when bound (so it flips together
  with the [Media Header](media-header.md)'s Shuffle); the shared pop /
  halo animation runs on every toggle-on. **Repeat** and **volume** are
  local only.
- On the mini pill a tap anywhere outside the two buttons calls
  `onExpand`; the buttons stop propagation.
- Hover states are pointer-only, as everywhere.

## Open questions

- DESIGN_SYSTEM.md › "Player components" heads its bar section
  "PlayerBar (`src/components/ui/player-bar.tsx`) and PlayerBar-B" · that
  file no longer exists; the only bar is `player-bar-b.tsx`, which
  `AppPlayer` imports *as* `PlayerBar` (app-player.tsx:17, ds-sources.ts:108)
- DESIGN_SYSTEM.md › "Player components" cites
  `src/components/ui/shuffle-toggle.tsx` for `ShuffleToggle` · it lives in
  `transport-toggles.tsx` (player-bar-b.tsx:12)
- DESIGN_SYSTEM.md › "Bottom gutter — player clearance" says the mobile
  stack is "~112px" · footer nav 66 + pill 56 = 122, before the safe area
- responsive.md:266 says each box component **names** its container ·
  the bar's root is a bare `@container` (player-bar-b.tsx:339). It is safe
  — the queries are on its own descendants, so the nearest container is
  always this root — but it is the one of the four that breaks the rule
- Previous and Next have no handlers (player-bar-b.tsx:422, :437, :517) —
  the store exposes none, so the buttons are inert on every surface
- the progress arc is stroked with `var(--muza-blue-200)`, a palette
  primitive (player-bar-b.tsx:184), while the waveform's played colour is
  the semantic `--waveform-progress` (app.css) that flips to blue-50 in
  dark mode — the two "played" marks on the same pill can disagree in dark
