---
title: Page Section
source: src/components/app/section.tsx
related: [items]
usage:
  - Shop › Orders → order detail | /?page=Shop&shop-tab=orders
  - Purchases → purchase detail | /?page=Purchases
---

The section primitive of a detail page — a heading, an optional action
beside it, and the content: flat by default, boxed only where a list of
rows wants a card around it. The buyer's purchase detail, the seller's
order detail and the refund flow are stacks of it.

## Anatomy

| Part | What it is | Tokens |
|---|---|---|
| Section | a bare `<section>` — no border, no fill, no padding of its own | — |
| Header row | rendered only when there is a `title` or an `action`: `flex items-center justify-between gap-3 mb-4` | — |
| Title | an `h2` | `text-large font-medium text-foreground` |
| Action | whatever is passed — typically an `outline` `Button` — right-aligned on the heading's line | — |
| Boxed body | with `boxed`, the children in a card | `bg-background border border-border rounded-xl px-5 py-4` |

**The heading sits outside the box.** A boxed section and a flat section
then share one hierarchy — page-section heading, then a block of content —
and a stack of flat sections never reads as a wall of identical chrome.
Flat is the default because separation between siblings comes from the
page's vertical rhythm (both detail pages stack their sections at
`gap-10`, 40px), not from borders.

`boxed` is reserved for content that is a list of products or data rows,
where the container reinforces the grouping. Today that is only
[Items](items.md).

## Usage

```tsx
<Section title="Fulfillment" action={<Button variant="outline">Mark as shipped</Button>}>
  …
</Section>

<Section title="Items" boxed>
  …
</Section>
```

The action slot is for the section's one **forward step** — "Mark as
shipped", "Request refund" — not a toolbar. A section with several
controls puts them in its body.

## Sizing

**Fixed, no steps.** The section fills its column; its only widths are the
page's. The header row is a single flex line, so a long title and a wide
action share it by truncation, not wrapping.

## Behaviour

None of its own — it is layout. The action's handler belongs to the page.

## Open questions

- section.tsx:4 says the primitive is shared by the two detail pages
  (purchase detail, order detail) · it is also the section chrome of the
  refund flow (refund-flow.tsx:32) — three consumers, not two
- section.tsx:11 says `boxed` is "currently only the Items section" · true,
  and the shop settings page draws its own boxed sections without this
  primitive (shop-settings-view.tsx:64, :185), so two boxed-section
  recipes coexist
