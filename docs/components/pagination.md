---
title: Pagination
source: src/components/ui/pagination.tsx
related: [button, table]
usage:
  - nothing yet — every long list in the product scrolls or lazy-loads
---

`Pagination` is the page-number row for a long back-office list — Previous, a window of numbered links with the current page outlined, an ellipsis for the pages skipped, Next — built from `Button`'s own variants so a page link and a toolbar button share one shape.

## Anatomy

| Part | Element | Wears |
|---|---|---|
| `Pagination` | `<nav role="navigation" aria-label="pagination">` `mx-auto flex w-full justify-center` | — |
| `PaginationContent` | `<ul>` `flex flex-row items-center gap-1` | — |
| `PaginationItem` | `<li>` | — |
| `PaginationLink` | `<a>` in `buttonVariants` — `outline` when `isActive`, `ghost` otherwise; `size="icon"` (40px square) by default; `aria-current="page"` when active | the Button tokens |
| `PaginationPrevious` / `PaginationNext` | `PaginationLink size="default"` (40px tall, `text-small font-medium`) with `gap-1 pl-2.5` / `pr-2.5`, a `ChevronLeft` / `ChevronRight` `size-4` and the word; `aria-label="Go to previous page"` / `"Go to next page"` | the Button tokens |
| `PaginationEllipsis` | `<span aria-hidden>` `flex size-9 items-center justify-center`, `MoreHorizontal size-4`, sr-only "More pages" | — |

The current page is the only outlined item; every other link is a ghost, so the row reads as one quiet strip with one marked position. There is no `disabled` prop: a call site with no previous page omits the item.

## Usage

```tsx
<Pagination>
  <PaginationContent>
    <PaginationItem><PaginationPrevious href="?page=1" /></PaginationItem>
    <PaginationItem><PaginationLink href="?page=1">1</PaginationLink></PaginationItem>
    <PaginationItem><PaginationLink href="?page=2" isActive>2</PaginationLink></PaginationItem>
    <PaginationItem><PaginationLink href="?page=3">3</PaginationLink></PaginationItem>
    <PaginationItem><PaginationEllipsis /></PaginationItem>
    <PaginationItem><PaginationLink href="?page=8">8</PaginationLink></PaginationItem>
    <PaginationItem><PaginationNext href="?page=3" /></PaginationItem>
  </PaginationContent>
</Pagination>
```

The links are anchors: give them a real `href`, or an `onClick` that calls the app's navigation. `href="#"` is a placeholder.

## Sizing

Fixed, no steps. The `<ul>` is `flex-row` with no wrap, so the row is as wide as its items: Previous and Next at about 105px each, five 40px links, a 36px ellipsis and six 4px gaps come to roughly 470px — wider than a 375 phone's 351px column, and it does not fold. On a narrow column keep the link window to three, or drop the words from Previous / Next.

## Behaviour

Plain links — the browser's own focus ring, Enter, middle-click. Nothing is stateful; the caller decides which link `isActive`.

## Open questions

- Not rendered anywhere in the prototype; every list pages by scrolling. The design-system section is its only call site.
- The ellipsis is `size-9` (36px) beside `size-10` (40px) links — the one item in the row a step short of the others.

## Narrow widths — the words go, the chevrons stay

The row is a named `@container/pagination` with one step, at **380px**, where
"Previous" and "Next" drop to their chevrons and the controls become the same
36px squares the number links already are.

The number is arithmetic, not taste. Spelled out the row needs roughly

```
"Previous" 95 + "Next" 75 + 5 links/ellipsis × 36 + 6 gaps × 4 ≈ 374
```

which overflowed a 296px content column — a 320px phone — and pushed the page
numbers off the edge. Without the words the same row is ~250 and fits, and the
chevrons still say which way each control goes. `aria-label` carries the name
either way, so nothing changes for a screen reader.

It measures its **own box** rather than the page column because a paginated
table is not always the page column: it sits in back-office lists that can be
beside the docked editor or inside a narrower panel.
