---
title: Select Track
source: src/components/ui/select-track-button.tsx
related: [media-list-item, checkbox, song-list-item]
usage:
  - Add music → track rows | /?page=Playlists
---

`SelectTrackButton` is the pick affordance on a selectable track row, in
place of a checkbox. A checkbox states a fact; this states the action ("add")
and then confirms it — one plus whose two strokes rotate into a check — and
once a track is in, its filled surface fades away so a long list reads as a
column of marks, not a stack of pills.

## Anatomy

```tsx
<SelectTrackButton selected={on} />
```

A `span` with two nested spans — no button, no icon component:

| Part | Classes | Note |
|---|---|---|
| surface | `pointer-events-none relative grid size-10 shrink-0 place-items-center rounded-full transition-colors duration-150 ease-out` | 40px, `aria-hidden` |
| unpicked | `bg-secondary text-foreground` | the plate says "tappable"; no border — the mark carries the state, not chrome |
| picked | `bg-transparent text-primary-text` | the plate fades out in 120–150ms and only the check stays |
| mark box | `relative block`, 12 × 12px inline | centred in the surface |
| two bars | `absolute left-0 right-0 rounded-full bg-current`, 1.25px tall | each centred by half its own weight so a sub-pixel stroke sits true |

**One mark, rearranged** — not two icons cross-fading. The vertical bar
becomes the check's long arm, the horizontal bar the short one:

```text
vertical    rotate(-90deg)   →  translate(25% − 1.2px, −1.2px) rotate(−45deg)
horizontal  rotate(180deg)   →  translate(−25%, 1.2px) rotate(45deg) scaleX(.43)
```

The 1.2px offset is 0.1 × the bar length and is what lets the two arms meet
at a vertex instead of crossing. Strokes are 1.25px on purpose — lighter than
the 2px Lucide set — because at 12px a 2px bar reads as a chunky glyph and
1.25px as a drawn mark.

**Timing** is the same in rhythm, different in curve:

```text
→ check   150ms hold, then 150ms ease-out
→ plus    150ms hold, then 300ms cubic-bezier(.75, −.6, .14, 1.59)   (overshoot — undo reads as a spring)
```

The hold is deliberate on both sides: the reference delayed only the return,
which made adding feel snappier than removing.

## Usage

```tsx
<MediaListItem
  type="song" cover={s.cover} title={s.title} subtitle={s.artist} meta={s.album}
  onOpen={() => toggle(s)}
  className={cn(on && "bg-muted", flashed && "muza-row-added")}
  trailing={<SelectTrackButton selected={on} />}
/>
```

That is the Add-music row (`add-music-dialog.tsx:198–216`). The **row** is
the click target — `onOpen` toggles the pick — and the mark is display only:
`pointer-events-none`, unfocusable, `aria-hidden`. The picked row also takes
`bg-muted`, and on the moment of adding `.muza-row-added` sweeps a soft shade
left to right across it (260ms, `background-position` only — an earlier
`translateX` nudge read as the whole row shifting).

## Sizing

Fixed, no steps: a 40px surface with a 12px mark, at every window.

## Behaviour

- `selected` is the only input; the component holds no state and fires no
  events. Toggle it from the row.
- Because the mark is `aria-hidden`, the row must carry the accessible state
  (the Add-music row does not today — see below).
- Hover does nothing: there is no `hover:` rule, and the plate is the whole
  affordance.

## Open questions

- The header comment (`select-track-button.tsx:14–15`) says "becoming a
  check — 150ms ease-out, **no delay**" · the class list sets
  `[transition-delay:150ms]` in both directions (`:51–53`) and the inline
  comment beside it (`:48–50`) calls the symmetric hold deliberate.
  DESIGN_SYSTEM.md followed the code; the header is stale.
- The Add-music row exposes no `aria-pressed` / `aria-checked` and the mark is
  `aria-hidden` (`add-music-dialog.tsx:198–216`), so a screen reader hears a
  song row and nothing about whether it is picked.
- The design-system section (`home.tsx:3171–3183`) showed the mark beside a
  separate "Toggle" button because the mark itself is not clickable; the
  frame now renders real `MediaListItem` rows, so the row is what you tap.
