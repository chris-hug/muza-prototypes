---
title: Cover Play Button
source: src/components/ui/cover-play-button.tsx
related: [song-list-item, media-list-item, list-table, spinner]
usage:
  - Song List Item | /?page=DesignSystem#song-list-item
  - Artist › Discography (list view) | /?page=Artist
  - Design system › List Table | /?page=DesignSystem#list-table
---

`CoverPlayButton` is the square cover that is also the play button, in every
row that carries a track: the leading slot of a [Song List Item](song-list-item.md),
of a song-type [Media List Item](media-list-item.md), and of the discography
list table. Four states — idle, hover → Play, playing → the wave, playing +
hover → Pause — fall out of one stable DOM crossfaded in CSS, so no state
change swaps children or flickers.

## Anatomy

| Part | Classes | Why |
|---|---|---|
| Button | `group/cpb relative shrink-0 rounded-xs shadow-sm focus-ring outline-none cursor-pointer` + `sizeClassName` (default `size-12`, 48px); `data-playing` while playing | `data-playing` on the button lets every layer read the playing state with `group-data-[playing]/cpb:` |
| Clipped layer | `absolute inset-0 overflow-hidden rounded-xs` | rounds the cover; everything inside is flat 2D so clipping is harmless |
| Cover | `CoverArt src={src}` | the branded fallback for a missing or failed image |
| Wash | `absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-150` | always black, not a token — it must stay dark on artwork in both themes |
| Play / Pause | `PlayFilledAlt` / `PauseFilledAlt` · `absolute size-4 text-white opacity-0 transition-opacity duration-150` | both always mounted; opacity picks |
| Wave | a second `absolute inset-0` wrapper **outside** the clip, `text-white opacity-0 transition-opacity duration-150`, holding `<PlayingWave size={28} />` | an `overflow: hidden` ancestor is a grouping context that flattens and rasterises a `preserve-3d` subtree, which blurred the dots permanently; unclipped it renders crisp, and at 28px it sits well inside the cover anyway |

The opacity classes live in a literal `CLASSES` map — one entry per
`hoverGroup` — because Tailwind's JIT has to see every class string at build
time; templating them would silently emit nothing.

## States

| `playing` | hovered | Shows |
|---|---|---|
| no | no | cover only |
| no | yes | wash + Play |
| yes | no | wash + wave |
| yes | yes | wash + Pause |

In selector terms: the wash is visible when *playing or hover*, Play when
*hover and not playing*, the wave when *playing and not hover*, Pause when
*playing and hover*. The `aria-label` flips between `Play {title}` and
`Pause {title}`.

## `hoverGroup` — whose hover the overlay listens to

| Value | Hover source | Where |
|---|---|---|
| `self` (default) | the button itself (`group/cpb`) | standalone — the list table, the design-system frame |
| `song` | the enclosing `group/song` | [Song List Item](song-list-item.md) |
| `row` | the enclosing `group/row` | [Media List Item](media-list-item.md) |

Binding to the row means the Play affordance appears as soon as the pointer is
anywhere on the 60px row, not only over the 48px thumb — the thumb is the
smallest target on the row, and the row is the thing being hovered.

| Prop | What it does |
|---|---|
| `src` `title` | cover URL (empty → the branded placeholder) and the name for the label |
| `playing` | required, controlled — the host owns it (the global player in the app) |
| `onToggle` | click handler; should flip `playing` |
| `hoverGroup` | `self` · `row` · `song` |
| `sizeClassName` | a size class, default `size-12`; `size-10`, `size-14` … |

## Usage

```tsx
// Inside a row — the row is `group/song`, the button follows its hover.
<CoverPlayButton src={t.cover} title={t.title} playing={isCurrent && player.playing}
  onToggle={() => (isCurrent ? player.toggle() : player.play(t))} hoverGroup="song" />

// Standalone — hovers itself.
<CoverPlayButton src={cover} title="Space Is the Place" playing={playing} onToggle={() => setPlaying(p => !p)} />
```

## Sizing

Fixed, no steps. `sizeClassName` sets the box (48px by default, the size
every row's leading slot uses); the wave is a fixed 28px whatever the box —
tuned for 48, where it is the "canonical" size `PlayingWave` is drawn at.

## Behaviour

- **Click → `onToggle`.** The button never plays on its own; the host flips
  `playing`. Inside a row the row's own click guard (`closest("button, a")`)
  keeps the two from double-firing.
- **Hover is pointer-only.** Every `group-hover` here is wrapped in
  `@media (hover: hover)` by Tailwind v4. On a touch screen the wash and the
  wave therefore appear **only while playing**; Play and Pause never show, and
  a tap toggles as it does everywhere.
- **Keyboard:** a native `<button>` — Tab, Enter, Space, `ring-ring/50`.

## `PlayingWave` — the animation on its own

The wave is `PlayingWave` (`playing-wave.tsx`): four dots 90° apart on a
`preserve-3d` stage, the stage rotating about Y on an **8s linear loop**
(`muzaCarousel`) inside a wrapper with a **3.5s ease-in-out** vertical float
(`muzaCarouselFloat`) — motion through depth rather than a flat spinner, the
same figure as the home page's `AnimatedLogo`. It is used bare where a
now-playing mark is wanted outside a cover: the player bar, a sidebar row.

```tsx
<PlayingWave size={28} className="text-foreground" />
```

- **Canonical size 28px**, the list-item leading slot. At 28 the ratios are
  exact: perspective 25px (25/28 of the box), orbit radius 8px (8/28), dot
  diameter 42% of the wrapper. Other sizes scale these proportionally, each
  rounded to an **integer** pixel — em-based values once produced
  `0.89em × 28 = 24.92px`, which the browser anti-aliased differently every
  frame and smeared in motion.
- **Supersampled 2×.** A composited perspective layer is rasterised once and
  then magnified by the perspective (the front dot ~1.47×), so at 1× the dots
  sample up and soften. The scene renders at twice the requested size and is
  scaled down on its own wrapper, separate from the float's `transform`.
- **Static hosts only.** `preserve-3d` + `perspective` promote it to its own
  compositing layer, which Chromium resamples whenever an ancestor animates
  opacity or transform. Inside `CoverPlayButton`'s static wrapper it is crisp;
  inside a host that animates its own opacity (a `Button`'s
  `disabled:opacity-50`) it smears.
- **Keyframes are anchored.** Tailwind v4 tree-shakes `@keyframes` it cannot
  see referenced; these are referenced only from arbitrary-value classes, so
  `app.css` ships dummy `.muza-anchor-*` rules to keep them in the build.
  Renaming the keyframes means renaming the anchors.

## Open questions

- home.tsx's former Cover Play Button prose said "don't reuse it as a loading
  spinner" · the Spinner section renders `PlayingWave` as the "actively
  working" indicator on purpose (home.tsx, `<Section id="spinner">` comment:
  "the brand mark stays consistent; meaning comes from context"). The two
  rules contradict; the Spinner section's is the shipped one.
- The same prose said the wash "only appears on mouse devices" · source shows
  the wash whenever `playing` (cover-play-button.tsx:64, 70, 76), pointer or
  not; only the *hover* half is pointer-gated. Documented as the source.
- `PlayingWave` is fixed at 28px inside the button (cover-play-button.tsx:149)
  while `sizeClassName` can make the box 40 or 56px; at `size-10` the wave is
  70% of the cover, at `size-14` half. No host passes a non-default size
  today.
