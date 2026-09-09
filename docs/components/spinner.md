---
title: Spinner
source: src/components/ui/spinner.tsx
related: [top-progress-bar, progress, button, dialog]
usage:
  - Purchase album — while the payment settles | /?page=Album
  - Subscription dialogs | /?page=Settings
---

`Spinner` is the indicator for a wait the app **cannot measure** — a payment
being processed, a search resolving — placed beside or in place of the thing
being waited for. It draws in `currentColor`, so it sits inside any `Button`
variant or any text without a colour prop.

## Anatomy

One `<span role="status">` around an SVG: a full circle at 25% opacity for
the ring and a quarter arc at full opacity, both `stroke="currentColor"` at
`strokeWidth="3"` on a 24-unit viewBox, turned by Tailwind's `animate-spin`
(`spinner.tsx:26–37`). The ring is what makes the arc readable as "part of a
circle" at 16px; the arc alone reads as a stray mark.

| `size` | Class | Where |
|---|---|---|
| `sm` | `size-4` (16px) | inline beside text, inside a `Button` |
| `md` (default) | `size-6` (24px) | in a content area |
| `lg` | `size-10` (40px) | a full section or dialog body while it works |

`label` is the accessible name (`aria-label`, default "Loading"); the SVG is
`aria-hidden`. `className` lands on the span — use it for margin, or for a
colour (`text-muted-foreground`) the spinner should not inherit from its
parent.

## Usage

```tsx
// The purchase dialog while Square processes the card
<div className="flex flex-col items-center gap-4 py-10">
  <Spinner size="lg" label="Processing payment" />
  <p className="text-small text-muted-foreground">Processing payment…</p>
</div>
```

The two call sites in the app are exactly this shape:
`purchase-album-dialog.tsx:352` and `subscription-dialogs.tsx:506`, each a
`lg` spinner over a one-line sentence, replacing the dialog body for the
duration. Pair the spinner with words — the label is for the screen reader,
the sentence is for everyone else.

**Not for page navigation.** The page crossfade already covers a route
change; a spinner on top of it is a second signal for one event. Below
~300ms show nothing at all — a spinner that flashes reads as a glitch.

## Sizing

Fixed, no steps: three named sizes, none of which reads the window.

## Behaviour

Motion only: `animate-spin` is a 1s linear rotation. `role="status"` is a
polite live region, so a screen reader announces the label when the spinner
mounts and says nothing while it turns. It carries no state — mounting it
is "loading", unmounting it is "done".

## Open questions

- The old design-system section's comment described the Spinner as "the muza
  brand animation (`PlayingWave`) — the same dot carousel as the now-playing
  indicator" · the source is a plain rotating arc (`spinner.tsx:4–9`,
  `:26–37`) and imports nothing from the player. Either the comment predates
  a redesign, or the intent to reuse the brand mark was never built.
- Thresholds overlap: the old section said "use for genuinely slow surfaces
  (≥300ms)", while `top-progress-bar.tsx:11–12` claims the 200ms–3s band for
  itself and hands anything longer to the Spinner. Between 300ms and 3s both
  rules apply. The working split in the app is by *kind*, not duration: the
  bar for navigation and fetches, the spinner for a step inside a dialog.
