---
title: Slider
source: src/components/ui/slider.tsx
related: [progress, meter, player-bar]
usage:
  - nothing yet — the player's scrubber is its own control
---

`Slider` is the draggable value control — in the app, the vertical volume
slider that unfolds above the desktop player bar's speaker icon. A 6px
`input` track, a `primary` fill and a 12px `primary` thumb that grows a soft
ring under the pointer.

## Anatomy

```tsx
<Slider value={[volume]} onValueChange={v => setVolume(Array.isArray(v) ? v[0] : v)} min={0} max={100} />
```

Four base-ui parts, each with a `data-slot`:

| Part | Classes | Note |
|---|---|---|
| `slider` (Root) | `data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full` | `thumbAlignment="edge"` — the thumb stops flush with the track ends instead of overhanging them |
| `slider-control` | `relative flex w-full touch-none items-center select-none`, vertical: `flex-col h-full min-h-40 w-auto`, `data-disabled:opacity-50` | `touch-none` so a drag never becomes a scroll |
| `slider-track` | `relative grow overflow-hidden rounded-full bg-input`, `h-1.5` horizontal / `w-1.5` vertical | 6px |
| `slider-range` (Indicator) | `bg-primary`, `h-full` / `w-full` | the filled part |
| `slider-thumb` | `size-3 rounded-full bg-primary ring-primary/30`, `hover:ring-3 focus-visible:ring-3 active:ring-3`, `after:absolute after:-inset-2` | 12px, a 28px hit area, a 3px `primary/30` halo while touched |

```text
thumb            12px
after: -inset-2  12 + 2 × 8 = 28px hit area
track            6px (h-1.5)
vertical floor   160px (min-h-40) unless overridden
```

The thumb count comes from the value: the wrapper renders one `Thumb` per
entry in `value` / `defaultValue`, so `value={[20, 80]}` is a range slider
with two thumbs. With **neither** prop it renders two — see Open questions.

## Usage

```tsx
// Horizontal, controlled — fills its column.
const [level, setLevel] = useState(62)
<Slider value={[level]} onValueChange={v => setLevel(Array.isArray(v) ? v[0] : v)} max={100} step={1} aria-label="Volume" />

// Vertical, 75px — the player bar's volume pill (player-bar-b.tsx:225–233).
<Slider orientation="vertical" value={[volume]} onValueChange={…} min={0} max={100}
  aria-label="Volume level"
  className="h-[75px]! min-h-0! [&_[data-slot=slider-control]]:min-h-0!" />
```

`onValueChange` is typed `number | number[]` (`SliderRoot.d.ts:152`), so the
`Array.isArray` guard is the way to read a single value — not a cast. A
slider with no visible label needs `aria-label`; the player bar passes one.

## Sizing

Horizontal: fills its box (`w-full`), 12px tall at the thumb, 6px at the
track — no steps. Vertical: `h-full` with a 160px floor that the player bar
overrides down to 75px with `!` utilities, because the pill it lives in is
fixed-height. Nothing here reads the window.

## Behaviour

- Pointer: press anywhere on the control to jump, drag to slide; the halo
  shows on hover, focus and while pressed.
- Keyboard: arrows step by `step`, PageUp / PageDown by a larger step, Home /
  End to the ends (base-ui).
- `disabled` fades the whole control to 50%.

## Open questions

- DESIGN_SYSTEM.md:598 lists "slider track" as a use of the `muted` token ·
  the track is `bg-input` (`slider.tsx:36`). One of them is wrong; the
  `Switch` off-track is `bg-input` too, so the source is at least consistent
  with its neighbour.
- With neither `value` nor `defaultValue`, `_values` falls back to
  `[min, max]` and two thumbs render (`slider.tsx:15–21`), while base-ui's
  own default value is the single number `min` (`SliderRoot.js:108`) — a
  range slider drawn over a single value. Always pass one of the two.
- The only app call site is vertical (`player-bar-b.tsx:225–233`) and fights
  the `min-h-40` floor with `h-[75px]! min-h-0!`; nothing renders the
  horizontal form, so the design-system frame is its only reviewer. Either
  the floor should be a prop or the vertical default should be smaller.
- The thumb carries `disabled:pointer-events-none disabled:opacity-50`
  (`slider.tsx:46`) · base-ui renders the thumb as a `div` with
  `data-disabled`, not a `:disabled` element, so those two classes never
  match; the control's `data-disabled:opacity-50` is what actually dims it.
- The design-system section (`home.tsx:3235`) read `onValueChange`'s argument
  through `[...(v as number[])]` — a cast around a value that can be a plain
  number. The frame now uses the player bar's `Array.isArray` guard.
