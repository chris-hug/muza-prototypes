---
title: Separator
source: src/components/ui/separator.tsx
related: [card-rail, song-rail, artist-header]
usage:
  - Artist profile — between sections | /?page=Artist
  - Card rail — between shelves | /?page=Home
  - Wallet › Manage | /?page=Wallet
---

`Separator` is the one-pixel hairline in `border-border` that divides
stacked content — the rule above a rail's title, between a hero and its
body, between groups in a drawer — or, turned vertical, splits counts in a
single line. It is a line with a role, not a styled `div`.

## Anatomy

One element over `@base-ui/react/separator`, which renders
`role="separator"` with `aria-orientation` (`Separator.js:31`):

```tsx
"shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch"
```

| Orientation | Geometry | Needs from its parent |
|---|---|---|
| `horizontal` (default) | `h-px w-full` | a block or column flex parent — it takes the full width |
| `vertical` | `w-px self-stretch` | a **row flex parent with a height** (`flex h-6 items-center`) — `self-stretch` has nothing to stretch to otherwise, and the line is 0px tall |

`shrink-0` keeps a flex parent from squeezing the one pixel away when the
row is tight. The colour is `bg-border`, the same token every rule in the
app uses, so a separator and a `border-b` on the next element are
indistinguishable — which is the intent.

## Usage

```tsx
<CardRail>                     // card-rail.tsx:164, song-rail.tsx:67
  <Separator />
  <header>…</header>
```

The rails, the artist hero (`artist-hero.tsx:157`), the Studio pages, the
transfer form and the cart drawer (`cart-drawer.tsx:236`, with `mt-2`) all
use it as the rule that opens a section. Spacing belongs to the parent's
`gap` or to `className` on the separator (`mt-2`); the line itself has no
margin.

Do not reach for it between list rows — a `divide-y divide-border` on the
list is one declaration for all of them, and is what `Accordion` does.

## Sizing

Fixed, no steps. `w-full` follows the column; it reads nothing itself.

## Behaviour

None. `role="separator"` is exposed to assistive tech as a divider; it is
not focusable and has no pointer behaviour. Pass `orientation="vertical"`
and base-ui sets `aria-orientation` to match.

## Open questions

- None found: the source, the old page demo and the app call sites agree.
