---
title: Toolbar
source: src/components/ui/toolbar.tsx
related: [button, toggle, togglegroup, separator]
usage:
  - nothing yet — no view has adopted the wrapper
---

`Toolbar` is a horizontal strip of related controls — buttons, groups,
hairline separators — that the keyboard treats as one stop: Tab lands on
it once and the arrow keys move between its buttons. Built for an editor
toolbar, a table-row action strip, a transport row; nothing in the app
mounts one yet.

## Anatomy

```tsx
<Toolbar aria-label="Formatting">
  <ToolbarGroup>
    <ToolbarButton>Bold</ToolbarButton>
    <ToolbarButton>Italic</ToolbarButton>
  </ToolbarGroup>
  <ToolbarSeparator />
  <ToolbarButton>Settings</ToolbarButton>
</Toolbar>
```

Four thin wrappers over `@base-ui/react/toolbar`:

| Part | Base UI | Classes |
|---|---|---|
| `Toolbar` | `Toolbar.Root` | `inline-flex items-center gap-1 rounded-full border border-border bg-background p-1` — a bordered pill track |
| `ToolbarButton` | `Toolbar.Button` | `h-8 px-3 rounded-full text-small font-normal text-foreground hover:bg-muted`, the Button focus ring (`ring-3 ring-ring/50`), `disabled:opacity-50` |
| `ToolbarGroup` | `Toolbar.Group` | `inline-flex items-center gap-0.5` — tighter than the track's `gap-1`, so a group reads as one cluster |
| `ToolbarSeparator` | `Toolbar.Separator` | `mx-1 h-5 w-px bg-border` — a 20px hairline in a 32px row |

The track is `bg-background` with a border, not `bg-muted` like a
`ToggleGroup`: a toolbar's buttons are momentary actions with a `hover:bg-muted`
fill, and a muted track would swallow that hover. The `p-1` inset plus the
32px button gives a 42px strip (32 + 2 × 4 + 2 × 1 border).

`ToolbarButton` is not a `Button`: it has no variant and no press nudge, and
its text is `text-small` (19px) where Button `sm` at the same 32px height is
`text-2xsmall` (15px) — see the open questions. A `Toggle` or a real
`Button` can be dropped into the strip via Base UI's `render` prop when a
control needs those looks.

## Sizing

Fixed, no steps. The strip is `inline-flex` and reads none of the three
measures; it is as wide as its buttons.

## Behaviour

- One tab stop; ← / → move between buttons (Base UI's roving focus, with
  `loopFocus` on by default); Home / End jump to the ends.
- `orientation="vertical"` flips the arrow keys; the classes here assume
  horizontal.
- Buttons do nothing on their own — wire `onClick` per button.

## Open questions

- Toolbar has no call site in the app (only the design-system page) and the
  section carries no `concept` status; whether it is a kept primitive or a
  leftover is not recorded.
- toolbar.tsx:36 sets `text-small font-normal` in an `h-8` button · Button
  `sm` — the same height — is `text-2xsmall font-normal` (button.tsx:52), so
  a ToolbarButton is 4px larger in type than the button it sits beside.
  Which is intended is not recorded.
- ToolbarButton carries no `pb-px`; every other pill control (Button, Tabs,
  Chip, Badge) does. Its label sits 1px lower than a Button's at the same
  height.

## Narrow widths — it scrolls, it does not shed

The pill is `max-w-full overflow-x-auto` with `[&>*]:shrink-0`, and its
scrollbar is hidden.

A toolbar holds whatever a caller puts in it, so unlike `Pagination` or
`SongListItem` it cannot know which label should go first when the room runs
out — any priority order would be a guess about someone else's content. Six
labelled buttons are about 430px and overflowed a 296px column; scrolling is
the only answer that needs no assumption.

`shrink-0` on the children matters as much as the scrolling: without it the
buttons squash into unreadable slivers instead of scrolling. Wrapping was the
other option and was rejected — it breaks the pill shape the toolbar is.
