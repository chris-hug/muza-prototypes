---
title: List Table
source: src/components/ui/table.tsx
related: [table, song-list-item, cover-play-button, album-card, bulk-action-bar]
usage:
  - Artist › Discography (list view) | /?page=Artist
---

The List Table is the borderless, single-line list the Artist › Discography list view and the Library list tables share: a sticky sortable header, rows without hairlines that light up as one rounded block, a cover that plays, and a trailing "…" that opens the same menu the album's card does. It is a recipe over the `Table` primitives, not a component.

## Anatomy

Built from `TableHead` / `TableRow` / `TableCell` on a **bare `<table className="w-full table-fixed">`** — not the `<Table>` wrapper, because the wrapper is a scroll container and this header has to stick to the *page* scroll.

| Part | Rule | Why |
|---|---|---|
| `<colgroup>` | `64 · auto · auto · 112 · 80 · 128 · 56` (cover · title · band · recorded · tracks · type · menu) | `table-fixed` lays out from these, so two long titles cannot push the numbers about |
| `<thead>` | `[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-background`; rows `border-b border-border` | sticky on each `<th>`, not the `<thead>` — some engines ignore a sticky `thead` under `table-fixed` |
| Sort header | a `button`: label `text-xsmall font-normal`, `text-muted-foreground` at rest, `text-foreground` when active; `ArrowUp` / `ArrowDown` `size-3` for the direction; `ArrowUpDown` at `opacity-0`, `group-hover/sort:opacity-50` when inactive | the hint appears only on hover, so a five-column header does not carry five arrows |
| `TableRow` | `group/row border-b-0 hover:bg-transparent` + `[&>td]:group-hover/row:bg-muted [&>td:first-child]:…rounded-l-md [&>td:last-child]:…rounded-r-md`; `[&_td]:py-1.5` | no hairline; the hover fill is painted per cell because a `<tr>` does not clip `border-radius`, and only the end cells round |
| Playing row | the same `bg-muted` and rounding, at rest | the current item stays marked without hover |
| Cover cell | `px-2`; `CoverPlayButton` (`size-12`) with `hoverGroup="row"` | `py-1.5` around 48px = the `SongListItem` row height, so a release row and a Top Songs row share one rhythm; the cover shows the same play / wave / pause states |
| Title · Band | two `button`s: `hover:underline underline-offset-[3px] [text-decoration-thickness:1px]`; title `text-foreground`, band `text-muted-foreground`; both `whitespace-nowrap truncate` | two targets, two destinations |
| Recorded · Tracks | `text-muted-foreground tabular-nums whitespace-nowrap` | — |
| Type | `text-right`; `ContentTypeBadge` | the badge is the one place the row says *album / single / EP* |
| Menu | `px-2`; `Button variant="ghost" size="icon-sm"` "More options" → `DropdownMenuContent align="end" sideOffset={6}` holding `AlbumCardMenuItems` | one menu per media kind: the row's "…" *is* the card's "…" (`DESIGN_SYSTEM.md` "Media menus") |

## Usage

```tsx
<table className="w-full table-fixed">
  <colgroup>…</colgroup>
  <thead className="[&_tr]:border-b [&_tr]:border-border [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-background">
    <TableRow>
      <TableHead resizable={false} className="px-2" />
      <TableHead><SortHeader label="Title" … /></TableHead>
      …
    </TableRow>
  </thead>
  <TableBody>
    <TableRow className="group/row border-b-0 hover:bg-transparent [&>td]:group-hover/row:bg-muted [&>td:first-child]:group-hover/row:rounded-l-md [&>td:last-child]:group-hover/row:rounded-r-md [&_td]:py-1.5">
      <TableCell className="px-2"><CoverPlayButton … hoverGroup="row" /></TableCell>
      <TableCell className="text-foreground whitespace-nowrap truncate">…</TableCell>
      …
    </TableRow>
  </TableBody>
</table>
```

The whole recipe, sort state included, is the call site (`src/ds-examples/list-table-basic.tsx`). The Library tables add a leading checkbox column and an **Added** column with its own sort, and a create row at the top (the Studio upload-row pattern, `DESIGN_SYSTEM.md` "Library views"); ticking rows brings up the [`BulkActionBar`](bulk-action-bar.md).

## Sizing

Column-filling; no steps. `table-fixed` gives the fixed columns their 64 / 112 / 80 / 128 / 56 and splits the rest between title and band, which truncate. The fixed columns alone are 440px, wider than a 375 phone's 351px column — the row does not fold, it overflows. That is why the Library pages render `AlbumMobileList` / `PlaylistMobileList` (`MediaListItem` rows, `media-list-table.tsx:561, 820`) on phones instead of the table.

## Behaviour

- Click a header to sort; click the active header again to flip its direction. Sorting is local (`useMemo` over the rows).
- Click the cover to play or pause; the playing row holds its fill.
- Title and band are separate navigations; the "…" opens the album menu (Save in it reads the live library store).
- The header sticks at `top-0` of the page's scroll container; the artist page keeps its tab strip and this table in one scroller for exactly that reason (`artist-profile-view.tsx:264`).

## Open questions

- It is a pattern with **three copies and no component**: `artist-profile-view.tsx` (`SortableHeader`, `DiscographyView`), `media-list-table.tsx` (`SortHeader` + three tables) and the design-system call site each carry their own sort header and row class string. A `SortHeader` / row-class export from `table.tsx` would remove two.
- `media-list-table.tsx:7` and `artist-profile-view.tsx:635` say "text-small body"; the cells are `TableCell`'s `text-xsmall`, unoverridden.
- The `DiscographyView` header comment (`artist-profile-view.tsx:444`) still says the grid / list toggle is "visual only for now — always renders the grid"; the list branch exists (line 630).
