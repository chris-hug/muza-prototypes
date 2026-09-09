---
title: Progress
source: src/components/ui/progress.tsx
related: [meter, spinner, top-progress-bar]
usage:
  - nothing — but the product needed it: Upload music hand-rolls the bar with an inline width (upload-music-dialog.tsx:1594), and four more files do the same
---

`Progress` is the bar for **work in flight** — an upload, a sync, a payment
step — where the app knows how far along it is. It is the only one of the
three indicators that fills with the brand blue; a measurement that is not
going anywhere is a [Meter](meter.md), and a wait with no known length is a
[Spinner](spinner.md).

## Anatomy

```tsx
<Progress value={42}>
  <ProgressLabel>Uploading “Blue Train”</ProgressLabel>
  <ProgressValue />
</Progress>
```

Five parts over `@base-ui/react/progress`, and the root mounts two of them
for you: `Progress` renders `children` and then its own `ProgressTrack` with a
`ProgressIndicator` inside (`progress.tsx:21–24`). A call site therefore
never writes the track — it adds a label and a value, or nothing.

| Part | Own classes | Why |
|---|---|---|
| `Progress` | `flex flex-wrap gap-3` | the label and the value sit on one line, the `w-full` track wraps under them — one flex container, no wrapper `div` |
| `ProgressTrack` | `relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-input` | 4px: the thinnest line that still reads as a track. `bg-input` is the same rest grey a field's border wears |
| `ProgressIndicator` | `h-full bg-primary transition-[width]` | the brand **fill** — `DESIGN_SYSTEM.md` names progress as one of the three places `bg-primary` is used as a solid fill (buttons, shuffle-active, progress). Width is set inline by base-ui as a percentage |
| `ProgressLabel` | `text-small font-medium` | the heaviest weight the system allows |
| `ProgressValue` | `ml-auto text-small text-muted-foreground tabular-nums` | pushed to the right edge; `tabular-nums` so "9%" → "10%" does not shift the digits |

`ProgressValue` prints base-ui's formatted value ("42%") when it has no
children; `format` on the root (an `Intl.NumberFormatOptions`) changes the
formatting for both the readout and `aria-valuetext`.

## Usage

```tsx
<Progress value={pct} aria-label="Upload progress" />
```

A bar with no label needs `aria-label` — base-ui wires `aria-labelledby` to
`ProgressLabel` only when there is one. `value` is the percentage of
`min`–`max` (0–100 by default). Nothing in the app renders a `Progress`
today; the upload dialog and the payment steps use a Spinner.

## Sizing

Fixed, no steps. The track is `w-full` and fills whatever column it is put
in; height is the track's `h-1`. To change it, put the class on
`ProgressTrack`, not on `Progress` — the root is the flex container around
label, value and track, so `className="h-2"` there sets the container's
height and leaves the 4px track as it was (`progress.tsx:17` vs `:32` — see
Open questions).

## Behaviour

Purely presentational: no pointer, no keyboard. The indicator's
`transition-[width]` eases every value change at the theme's default
duration, so a value that jumps 40 → 100 on completion slides rather than
snaps. base-ui exposes `data-progressing` / `data-complete` /
`data-indeterminate` on every part for state-keyed styling.

## Open questions

- The old design-system section called this "indeterminate work in flight",
  and the doc lead in the Meter source says the same thing in reverse
  (`meter.tsx:10–11`) · every demo value was determinate, and the wrapper has
  **no indeterminate rendering**: with `value={null}` base-ui sets no width on
  the indicator (`ProgressIndicator.js:33–35`), so the bar shows an empty
  track. "Determinate work in flight" is what it is; an indeterminate wait is
  the Spinner or the Top Progress Bar.
- The old section passed `className="h-2"` to `Progress` · that lands on the
  root's `flex flex-wrap` container, not on the `h-1` track (`progress.tsx:17`
  vs `:32`), so the bars rendered 4px tall regardless. Either the track
  should accept a size, or the doc should say "style the track".
- No call site in `src` or `app` renders `Progress`; the Meter, Spinner and
  Top Progress Bar docs each say when to prefer it. Decide whether it stays
  in the system or is marked as not used yet.
