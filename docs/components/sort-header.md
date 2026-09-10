---
title: Sort Header
source: src/components/ui/table.tsx
related: [table, list-table, items]
usage:
  - Library → Songs · Albums · Playlists tables | /?page=Songs
  - Studio → Music | /?page=Music
  - Shop → Products | /?page=Shop&shop-tab=products
  - Orders | /?page=Orders
  - Artist → Discography | /?page=Artist
---

`SortHeader` is the label inside a sortable `TableHead`: the column's name, an
arrow that says which way it is sorted, and — while a column is not the one
being sorted — a hint that it could be. It lives in `table.tsx` because that
is what it is, a part of a table header rather than a component that happens
to be used in one.

## The arrow is the whole design

Three states, one row height:

| State | What is drawn |
|---|---|
| Sorted, ascending | `ArrowUp` at `size-3` in `text-foreground`, label in `text-foreground` |
| Sorted, descending | `ArrowDown`, same treatment |
| Not sorted | `ArrowUpDown` in `text-muted-foreground`, `opacity-0` rising to `opacity-50` on `group-hover/sort` |

A column that is not sorted still has to say that it *could* be, which is what
the double arrow does under the pointer. The sorted column shows a single
arrow at full contrast, and its direction is the answer to "which way".

**Nothing moves and nothing reserves space.** The glyph is always in the
layout and only its opacity changes, so pointing at a header cannot reflow the
row — a header that shifts under the cursor is a header you have to aim at
twice.

## Anatomy

```tsx
<TableHead>
  <SortHeader
    label="Recorded"
    active={key === "year"}
    dir={dir}
    onClick={() => sortBy("year")}
  />
</TableHead>
```

One `<button type="button">`:

| Part | Classes |
|---|---|
| Button | `group/sort flex items-center gap-0.5 min-w-0 overflow-hidden select-none cursor-pointer`, `state-fade outline-none rounded-sm focus-ring` |
| Label | `text-xsmall font-normal truncate`, `text-foreground` when active, else `text-muted-foreground` |
| Arrow | `size-3 shrink-0`; the hint adds `opacity-0 group-hover/sort:opacity-50 transition-opacity` |

`min-w-0 overflow-hidden` plus `truncate` are what let a narrow column keep
its arrow: the label gives way, the direction does not.

## Props

| Prop | What it does |
|---|---|
| `label` | the column name |
| `active` | is this the column being sorted |
| `dir` | `"asc" \| "desc" \| null` — ignored while `active` is false |
| `onClick` | the whole interaction: sort by me, or turn me around if I am already the one |
| `className` · `style` | for the call site's own width / shrink rules |

## It was six copies

Songs, Orders, Studio Music, Shop Products, the artist page's discography and
the design-system's own list-table example each carried this markup, byte for
byte the same. Two of them had drifted apart in small ways, and none of them
had a focus ring — a sortable column was unreachable by keyboard everywhere in
the app until this was pulled into one component.

Two call sites keep a thin local wrapper (`orders-view.tsx`,
`shop-my-products.tsx`) because they pass a sort KEY and compare it rather
than a boolean. That is a prop-shape difference, not a second component.

## Open questions

- Sorting is announced only visually. `aria-sort` on the `<th>` is the
  standard way to say it, and nothing sets it — the button says "Recorded" and
  not "Recorded, sorted descending".
- The component decides nothing about the data: `onClick` is a bare callback
  and every table implements its own toggle. A shared `useSort` would remove
  five copies of "same key → flip, new key → asc", which is the same argument
  that produced this component.
