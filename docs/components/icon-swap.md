---
title: Icon Swap
source: src/components/ui/icon-swap.tsx
related: [button, select-track, cover-play-button]
usage:
  - Album / playlist card › Play ↔ Pause | /?page=Home
  - Add music › album Add ↔ Added | /?page=Playlist
---

`IconSwap` turns one icon into another instead of replacing it. A control
already fades its fill and colour; the icon inside it used to snap, because
`a ? <X /> : <Y />` unmounts the old icon before the new one exists and leaves
nothing to transition between.

## Anatomy

Both icons stay mounted, stacked in one grid cell (`inline-grid`, each child
`grid-area: 1 / 1`), and the hidden one carries `data-state="out"`. One rule in
`app.css` (`[data-slot="icon-swap"]`) cross-fades them on three properties:

| Property | Out | In |
|---|---|---|
| `scale` | 0.25 | 1 |
| `opacity` | 0 | 1 |
| `filter` | `blur(4px)` | none |

200ms on `cubic-bezier(0.2, 0, 0, 1)`, the curve every state change uses. The
130ms of a press was too short to read as a change of mark.

## Behaviour

- **The blur is the point.** Without it two marks dissolve into each other;
  with it one mark becomes another.
- **Interruptible.** Both icons are always mounted, so a toggle hit twice
  reverses mid-flight instead of queueing.
- **Reduced motion** (`prefers-reduced-motion: reduce`) gets the plain swap.
- The hidden icon is `aria-hidden`; the control's own `aria-label` names the
  state, as before.

## Usage

```tsx
<Button aria-label={playing ? "Pause" : "Play"}>
  <IconSwap on={playing} onIcon={<PauseFilledAlt />} offIcon={<PlayFilledAlt />} />
</Button>
```

Used for Play ↔ Pause on album and playlist cards and search results,
Check ↔ Plus on Add music's album button, Lock ↔ Globe in the playlist editor,
and Copy ↔ Check / Pin ↔ PinOff in the design-system tools.

**Not for Select Track.** There the plus does not fade into a check, it becomes
one: two strokes that rotate and rescale ([select-track.md](select-track.md)).
That stronger effect stays its own. Nor for an icon that differs per row and
never changes in place, such as a wallet transaction's earning or withdraw
arrow: there is nothing to animate.
