---
title: Meter
source: src/components/ui/meter.tsx
related: [progress, spinner]
usage:
  - nothing yet — no view shows a bounded quantity
---

`Meter` shows a **static, bounded measurement** — storage used, password
strength, how full a capacity is — a value between two limits that is not on
its way anywhere. Work in flight is a [Progress](progress.md) bar, which is
why the two look alike but fill in different inks.

## Anatomy

```tsx
<Meter value={12}>
  <div className="flex items-baseline gap-3">
    <MeterLabel>Storage used</MeterLabel>
    <MeterValue>{() => "12 GB / 100 GB"}</MeterValue>
  </div>
  <MeterTrack>
    <MeterIndicator />
  </MeterTrack>
</Meter>
```

Five thin wrappers over `@base-ui/react/meter`. Unlike `Progress`, the root
mounts nothing on its own — the call site places the track, so the label row
can be laid out however the surface needs.

| Part | Own classes | Why |
|---|---|---|
| `Meter` | `flex flex-col gap-1.5` | label row above track, 6px apart |
| `MeterLabel` | `text-xsmall text-muted-foreground` | a caption, not a heading — the number is the point |
| `MeterValue` | `text-xsmall text-foreground tabular-nums ml-auto` | the readout, right-aligned, in ink; `tabular-nums` keeps "9 GB" and "10 GB" the same width |
| `MeterTrack` | `relative h-1.5 w-full overflow-hidden rounded-full bg-input` | 6px — a step thicker than Progress's 4px, because a meter is read at rest and needs to be findable without motion |
| `MeterIndicator` | `h-full bg-foreground transition-[width]` | **foreground, not primary**: a measurement is information, and the brand blue is reserved for action and for work the app is doing (`DESIGN_SYSTEM.md` › primary fill) |

`MeterValue` takes a **render function** `(formattedValue, value) => node`
(base-ui types `children` that way, `MeterValue.d.ts:13`), so the readout can
say "Strong" or "12 GB / 100 GB" while `aria-valuenow` still carries the
number. Leave it empty for the plain percentage.

## Usage

```tsx
<Meter value={strength} max={4} aria-label="Password strength">
  <MeterTrack><MeterIndicator /></MeterTrack>
</Meter>
```

`min` / `max` default to 0 / 100. With no `MeterLabel`, give the root an
`aria-label`. Nothing in the app renders a `Meter` today.

## Sizing

Fixed, no steps. The track is `w-full`; the label and value are one
`text-xsmall` line. It reads nothing about the window or the column.

## Behaviour

None — no pointer, no keyboard, no state. `transition-[width]` on the
indicator eases a changed value (a password meter climbing as you type).

## Open questions

- `meter.tsx:8–13` (the header) says "audio level peaks at rest" is a use ·
  nothing in the player renders a Meter; the waveform is its own component.
- No call site in `src` or `app` uses `Meter`; both indicators the doc
  distinguishes it from (Progress, Spinner) are also unused or barely used.
  Whether Meter earns its place in the system, or is a shadcn leftover, is
  undecided.
