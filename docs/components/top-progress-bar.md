---
title: Top Progress Bar
source: src/components/ui/top-progress-bar.tsx
related: [spinner, progress]
usage:
  - Every page navigation | /?page=Home
---

`TopProgressBar` is a 2px line along the very top of the window that appears
only when a navigation or fetch takes longer than 200ms, creeps toward the
right while it waits, then snaps full and fades when the load lands. It is
the quiet signal for the awkward middle band of waits — long enough to
notice, too short for a spinner — and it never blocks anything.

## Anatomy

```tsx
<TopProgressBar loading={isFetching} />
```

One prop drives it: `loading`. The parent flips it `true` around a fetch or
a route change and `false` when done; every piece of timing is inside the
component (`top-progress-bar.tsx:42–81`).

| Part | Classes | Why |
|---|---|---|
| Rail | `fixed top-0 left-0 right-0 z-50 h-[2px] pointer-events-none` | pinned to the **window**, not to the page shell — it must sit above the mobile header and the topbar alike, and never catch a click |
| Fill | `h-full bg-foreground transition-[width,opacity] ease-out` | ink, not brand blue: it is a system signal, not an action. Width is inline, `progress%` |
| Finishing | `duration-150 opacity-0` while snapping to 100, else `duration-300 opacity-100` | the fade is half the length of a growth step, so the end reads as "done", not as another step |

`delay` (default 200ms) is the show-after threshold; `className` lands on
the rail.

## The timing, in numbers

```text
t = 0          loading=true, nothing shown
t = delay      visible, width 15%
every 200ms    p ← p + (90 − p) × 0.08      (asymptote 90%: never full on its own)
   after 1s    ≈ 43%     after 3s ≈ 68%     after 6s ≈ 85%
loading=false  width 100%, fade over 150ms, unmount after 300ms
```

A load that finishes inside `delay` never shows the bar at all — the
timers are cleared on the `loading` flip (`:43–44`). That is the point:
most navigations in a prototype are sub-200ms, and a bar for each would be
noise.

## Usage

```tsx
const [loading, setLoading] = useState(false)
…
setLoading(true)
await fetchPage()
setLoading(false)
…
<TopProgressBar loading={loading} />
```

Mount it once, high in the tree (the app shell), and feed it the one boolean
that means "something the user asked for is on its way". For a wait inside a
dialog, or one longer than a few seconds, use a [Spinner](spinner.md) where
the user is looking.

## Sizing

Fixed, no steps. It spans the window (`left-0 right-0`) at every width and
does not read the column.

## Behaviour

`role="progressbar"` with `aria-valuenow` rounded from the width, so a
screen reader can read the percentage; `aria-label="Loading"`. No pointer,
no focus — `pointer-events-none` means it can never be the thing under a
tap.

The effect's dependency list is `[loading, delay]` on purpose and excludes
`visible` (`:78–81`): including it would re-run the effect on every tick
and restart the climb interval.

## Open questions

- `top-progress-bar.tsx:5` (and the old section comment) say the bar climbs
  "toward ~85%" · the increment is `(90 − p) × 0.08` (`:55`), so the asymptote
  is 90 and 85 is simply where it is after about six seconds. Harmless, but
  the number in the comment is not the number in the code.
- Nothing in the app mounts it. `design-system.tsx:90` explains that the
  back link is an SPA navigation "so the TopProgressBar can fire" — but no
  `TopProgressBar` is rendered on that route or in the shell, so the bar
  has never fired outside its own demo. Either wire it into the shell's
  page transitions or mark the section as not used yet.
- Its band is stated as 200ms–3s (`:11–12`) with the Spinner from 3s; the
  Spinner's own rule starts at 300ms. See [Spinner › Open questions](spinner.md).
