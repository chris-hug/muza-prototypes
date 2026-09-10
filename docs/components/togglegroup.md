---
title: ToggleGroup
source: src/components/ui/toggle-group.tsx
related: [toggle, tabs, toolbar, search, mobile-header]
usage:
  - Topbar theme switcher | /
  - Artist › Discography grid/list toggle | /?page=Artist
---

`ToggleGroup` is the segmented control: a `bg-muted` pill track holding two
or more `Toggle` segments, one of which is pressed. It is the grid ⇄ list
switch on every library toolbar and the Artist discography, the Muza Catalog
⇄ My Library scope switch on Search, and the light ⇄ dark picker in
Settings.

## Anatomy

```tsx
<ToggleGroup size="sm" value={[view]} onValueChange={v => { if (v[0]) setView(v[0]) }} aria-label="View mode">
  <Toggle value="grid" aria-label="Tile view"><LayoutGrid className="size-3.5" /></Toggle>
  <Toggle value="list" aria-label="List view"><List className="size-3.5" /></Toggle>
</ToggleGroup>
```

The group is Base UI's `ToggleGroup` with
`group/toggle-group inline-flex w-fit items-center rounded-full bg-muted
text-muted-foreground gap-0 p-1` and a `data-size` attribute. The segments
are plain `Toggle`s; the group's `data-size` is what sizes them (see
[toggle](toggle.md) — inside a group the toggle's own `size` is ignored).
`gap-0` because the pressed segment's `bg-background` pill is the only thing
that should separate segments; a gap would show the track between them.

**The track and the pill are the TabsList recipe.** `bg-muted` track,
`p-1`, a `bg-background` + `shadow-sm` pill for the active item — the same
chrome as `TabsList` `variant="default"`, so a view switch and a tab strip in
one toolbar read as one family. The difference is semantic: Tabs switch
*content panels*, a ToggleGroup switches a *setting*.

## Sizes — TabsList's ladder

| `size` | Track | Segment (from `data-size`) |
|---|---|---|
| `sm` (default) | `h-[40px]` | `px-3 text-2xsmall font-normal` |
| `default` | `h-12` 48px | `px-6 text-small font-normal` |
| `lg` | `h-[52px]` | `px-8 text-small font-medium` |

These mirror `TabsList` sm / default / lg exactly (`tabs.tsx:67–69`,
`160–162`). The app uses only `sm`: 40px is the height of Button `default`,
Chip `md`, Select and the filter trigger, so the switch sits level with the
sort button beside it. `default` and `lg` exist for parity with Tabs and
have no call site.

An icon-only segment squares itself with `aspect-square px-0` (Settings'
theme picker); without it the `px-3` makes a 14px glyph sit in a 38×32 pill.

## Usage

```tsx
// Single-select (the default). `value` is an ARRAY, and pressing the active
// segment again yields [] — so every call site guards v[0].
<ToggleGroup value={[scope]} onValueChange={v => { if (v[0]) setScope(v[0] as Scope) }} aria-label="Search scope">
  <Toggle value="catalog">Muza Catalog</Toggle>
  <Toggle value="library">My Library</Toggle>
</ToggleGroup>

// Multi-select — any combination.
<ToggleGroup multiple defaultValue={["bold"]}>…</ToggleGroup>

// Full width — the mobile search header stretches it; `flex-1` on each
// segment shares the width.
<ToggleGroup size="sm" className="w-full" …>
```

**Guard `v[0]`.** Base UI hands `onValueChange` the whole array, and in
single-select mode a click on the pressed segment deselects it, so the array
can be empty. A settings-style control has no "nothing selected" state; the
guard keeps the last value (`purchases-view.tsx:700` falls back to `"all"`
instead). Every call site in the app does one or the other.

Give the group an `aria-label` ("View mode", "Search scope", "Theme") and
each icon-only segment its own.

## Sizing

Fixed, no steps. The group is `w-fit` and reads none of the three measures.
One call site overrides that: the mobile search header
(`mobile-app-header.tsx:315`) passes `className="w-full"` below the 768
presentation gate, and the segments' `flex-1` splits the header's width in
two. The desktop Search page keeps it `shrink-0` beside the heading.

## Behaviour

- Click / tap presses a segment; `onValueChange(values)` fires with the new
  array.
- Arrow keys move focus between segments (Base UI's composite roving
  tabindex); Space / Enter press the focused one.
- `multiple` switches to any-combination; the app has no such call site yet.
  It also turns the travelling pill off — see below.

## Motion — the pill travels

Single-select groups draw **one** pill and slide it between segments, the
same move [Tabs](tabs.md) made for its underline and for the same reason:
each Toggle used to draw its own `bg-background` and cross-fade it, so the
mark never moved — it switched off under one segment and on under the next,
and the eye lost the thread between them.

| | |
|---|---|
| Element | one `span[data-slot=toggle-group-indicator]`, `absolute top-1 bottom-1`, `z-0` behind the labels (which carry `relative z-10`) |
| Position | `translate-x-[var(--pressed-left)]` · `w-[var(--pressed-width)]` |
| Transition | `translate, width, opacity` · **180ms** · `ease-out` — the same three numbers Tabs uses |
| Fill | `bg-background shadow-sm`, moved off the Toggle; the item keeps only `text-foreground` |

Two things differ from Tabs, both forced:

- **It measures itself.** `@base-ui/react/tabs` ships an `Indicator` part that
  publishes the two variables; `@base-ui/react/toggle-group` ships only the
  root. So the pressed child is measured here (`offsetLeft` / `offsetWidth`
  against the `relative` root), with a `MutationObserver` on `data-pressed`
  and a `ResizeObserver` on the group and its items — text reflow, a font
  landing, or the group being squeezed by its column all move the target.
- **`multiple` opts out.** Several segments are pressed at once there and one
  travelling pill cannot describe that, so each keeps its own fill. The group
  sets `data-travel="true"` only in single-select, and `toggle.tsx` reads it
  to decide whether to suppress its own `bg-background` / `shadow-sm`.

The pill does not slide in on mount: the transition is enabled one commit
after the first measurement, so it appears where it belongs. With nothing
pressed (`value` can be `[]`) it fades out rather than collapsing to zero
width.

## Open questions

- home.tsx `togglegroup` section lists "Topbar theme switcher" (`/`) as a
  usage · no ToggleGroup is mounted in `topbar.tsx`; the picker is in
  `settings-view.tsx:344`. The link is stale.
- toggle-group.tsx:11 says the container has the "same chrome and dimensions
  as TabsList sm" · `TabsList` also carries its own `gap`/padding rules per
  variant (`tabs.tsx`); only the `default` variant's heights are copied here,
  and a `line` variant has no ToggleGroup equivalent. Whether the two should
  share one cva is not recorded.
- The three sizes exist "for parity with Tabs"; only `sm` has a call site.
  Whether `default` / `lg` stay is not recorded.
