---
title: Nav Row
source: src/components/ui/nav-row.tsx
related: [menu, media-list-item, drawer]
usage:
  - Add music sheet → browse entry points | /?page=Playlists
---

`NavRow` is a tappable list row that drills somewhere — an optional leading
glyph, a label, an optional trailing value and a chevron — the list-view
counterpart of a menu item, meant for browse entry points and settings
groups. Nothing in the prototype renders it today: the Add-music sheet it was
built for replaced its rows with tabs.

## Anatomy

```tsx
<NavRow icon={<Clock />} label="Recently added" value="24" onClick={…} />
```

One `<button type="button">`, four slots:

| Slot | Renders | Classes |
|---|---|---|
| row | the button | `flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors` |
| `icon` | a `span` around whatever you pass | `text-muted-foreground`; the row forces `[&_svg]:size-4 [&_svg]:shrink-0`, so pass `<Mic />` bare |
| `label` | `span` | `flex-1 min-w-0 truncate text-small text-foreground` — the one slot that grows, and the one that truncates |
| `value` | `span`, only when given | `shrink-0 text-xsmall text-muted-foreground` |
| chevron | `ChevronRight`, always | `text-muted-foreground`, 16px like the icon |

States: `hover:bg-muted`, `active:bg-muted`, `focus-visible:bg-muted` — the
focus state is the fill, not a ring, the same treatment as the sheet rows in
`DropdownMenu`. There is no disabled or selected state; a row is a link, not
a choice.

```text
py-2                     8 + 8 = 16px
text-small line          19px × 1.5 (preflight default, no leading-* in the row) = 28.5px
row height               ≈ 44.5px
```

The rows are deliberately tighter than a media row (`MediaListItem` carries a
48px cover): they are chrome that leads to content, and on a phone every
pixel they take is a pixel the track list underneath does not get.

## Usage

```tsx
<div className="flex flex-col">
  <NavRow icon={<Mic />}       label="Artists"   onClick={() => go("artists")} />
  <NavRow icon={<Disc3 />}     label="Albums"    onClick={() => go("albums")} />
  <NavRow icon={<ListMusic />} label="Playlists" onClick={() => go("playlists")} />
  <NavRow icon={<Clock />}     label="Recently added" value="24" onClick={…} />
</div>
```

Rows stack with no gap and no dividers; the `rounded-lg` hover fill is what
separates them. A row with no icon simply starts at the label — the slot
collapses rather than reserving 16px, so do not mix iconed and icon-less rows
in one list if the labels should align.

## Sizing

Fills its box (`w-full`) and is otherwise fixed — no window, column or box
steps. Only the label reflows, by truncating.

## Behaviour

- A real `<button>`: Tab reaches it, Enter and Space fire `onClick`, the
  focus fill shows only for keyboard focus (`focus-visible`).
- Hover is pointer-only (Tailwind v4 wraps `hover:` in `@media (hover:
  hover)`), and `active:` gives touch its pressed fill.
- It is not an anchor: no `href`, so no middle-click, no open-in-new-tab, no
  visited state. Fine for a sheet that navigates in place; a row that leads to
  a real route wants a `render` prop it does not have yet.

## Open questions

- `nav-row.tsx:15–16` says the row is "40px tall" · with `py-2` and a
  `text-small` label at the 1.5 default line-height it measures ≈ 44.5px
  (`app.css` defines no line-height for `--text-small`; preflight sets
  `html { line-height: 1.5 }`). The header's "44px+ tap target" holds; the
  "40px" does not.
- The section's `usage` link says "Add music sheet → browse entry points"
  (`home.tsx:3029`) · `add-music-dialog.tsx:20–21` records that the
  Artists / Albums / Songs / Playlists nav rows were replaced by tabs, and no
  file under `src/` imports `NavRow` (grep). The link is stale and the
  component is unused — it belongs with the `concept` sections, or it goes.
- DESIGN_SYSTEM.md:784 says Add-music search renders "containers as nav
  rows" · `add-music-dialog.tsx:243, 445` renders them as `MediaListItem` with
  a `ChevronRight` in `trailing`, not as `NavRow`.
