---
title: Table
source: src/components/ui/table.tsx
related: [list-table, bulk-action-bar, badge, pagination]
usage:
  - Studio › Music releases | /?page=Music
---

`Table` is the bordered data table for the Studio and Shop back-office views — releases, orders, products, the wallet, reports: a muted header row, hairline-separated rows that tint on hover, columns you can drag wider, and an optional footer for totals.

## Anatomy

| Part | Element | Wears |
|---|---|---|
| `Table` | `div[data-slot=table-wrapper]` `relative w-full overflow-auto` → `<table>` `w-full caption-bottom` | `text-xsmall` |
| `TableHeader` | `<thead>` — its rows `border-b border-border`, hover stays transparent | — |
| `TableBody` | `<tbody>` — the last row loses its border | — |
| `TableFooter` | `<tfoot>` | `border-t border-border bg-muted/50 font-medium` |
| `TableRow` | `<tr>` | `border-b border-border hover:bg-muted data-[state=selected]:bg-muted` |
| `TableHead` | `<th>` `h-11 px-4 text-left align-middle` | `text-xsmall font-normal text-muted-foreground hover:bg-muted` |
| `TableCell` | `<td>` `p-4 align-middle` | `text-xsmall`; `pr-0` when it holds a checkbox |
| `TableCaption` | `<caption>` `mt-4` | `text-xsmall text-muted-foreground` |

Type is `text-xsmall` throughout — headers, cells, caption — with `font-normal` headers in `text-muted-foreground`; `font-medium` is reserved for the footer's totals. The header row is 44px (`h-11`); a body row is its content plus 32px of padding. A row's `hover:bg-muted` is the same fill a selected row gets (`data-[state=selected]`), so hover previews selection.

### Column resize

Every `TableHead` is resizable by default (`resizable={false}` to opt out, `minWidth` to raise the 60px floor). The handle is a 12px hit area on the right edge (`w-3 cursor-col-resize`) whose hairline (`bg-border`) shows only on `group-hover/th`. Dragging writes `width` / `min-width` inline on the `<th>`:

- with a resizable neighbour to the right, the neighbour gives up what this column takes, floored at its own `data-min-width` — the table's total width does not change;
- with none, growth is capped at `wrapper − other columns`, so the table never outgrows its scroll wrapper.

It listens to `mousedown` / `mousemove` only — no touch resize.

## Usage

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead className="w-8" resizable={false}>#</TableHead>
      <TableHead>Title</TableHead>
      <TableHead className="text-right" resizable={false}>Tracks</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {albums.map((a, i) => (
      <TableRow key={a.id}>
        <TableCell className="text-muted-foreground tabular-nums">{i + 1}</TableCell>
        <TableCell>{a.title}</TableCell>
        <TableCell className="text-right tabular-nums">{a.tracks.length}</TableCell>
      </TableRow>
    ))}
  </TableBody>
  <TableFooter>
    <TableRow>
      <TableCell colSpan={2}>Total</TableCell>
      <TableCell className="text-right tabular-nums">{total}</TableCell>
    </TableRow>
  </TableFooter>
</Table>
```

Numbers are `tabular-nums` and right-aligned. A cover in a cell is `size-8 rounded-xs` (the image-container radius). A category — label, genre — is a `Badge variant="secondary"`.

**When the header must stick, skip the `<Table>` wrapper.** It is `overflow-auto`, a scroll container, and `position: sticky` inside it pins to the wrapper, not the page. Studio › Music, the artist Discography and the library list tables render a bare `<table className="w-full">` with `TableHead` / `TableRow` / `TableCell` and put `sticky top-0 z-10 bg-background` on the header themselves — see [`list-table.md`](list-table.md). Report and Wallet, whose headers do not stick, use the wrapper.

## Sizing

Column-filling; no steps of its own. The table is `w-full` of its column with content-sized columns; when they outgrow the column the wrapper scrolls sideways rather than wrapping cells — at a 320 window chip the frame's table keeps its widths and scrolls. Hiding a column is in-page reflow and may use `sm:`: Wallet renders its table `hidden sm:table` beside a card list, Report hides secondary columns with `sm:hidden`. That is the one thing `sm:` is for (`responsive.md`: `sm` / `lg` reflow in-page content, never chrome).

## Behaviour

- Hover tints a body row; a header row does not tint as a row, only per `<th>`.
- Selection is the caller's: set `data-state="selected"` on the row. A leading checkbox column is the Studio / Orders convention, with the live [`BulkActionBar`](bulk-action-bar.md) appearing once anything is ticked.
- Resize as above, mouse only.

## Open questions

- `media-list-table.tsx:7` and `artist-profile-view.tsx:635` describe the list tables as "text-xsmall muted headers, text-small body"; `TableCell` is `text-xsmall` and neither file overrides it, so the body is `text-xsmall` too.

## Sortable columns

The label inside a sortable `TableHead` is its own component,
[`SortHeader`](sort-header.md) — exported from this same file, because a sort
header is a table part rather than something that merely appears in one. Six
views had written it out by hand before it was pulled together.
