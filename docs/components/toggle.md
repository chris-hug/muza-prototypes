---
title: Toggle
source: src/components/ui/toggle.tsx
related: [togglegroup, button, tabs, toolbar]
usage:
  - Library — grid ⇄ list | /?page=Albums
  - Mobile header — view switch | /?page=Home
  - Settings — segmented options | /?page=Settings
---

`Toggle` is a two-state button — pressed or not — for a setting that is
on or off: a view mode, a theme, a formatting flag. On its own it wears
Button `sm`'s metrics; inside a `ToggleGroup` it becomes a segment of the
group and takes its size from there.

## Anatomy and states

One element, Base UI's `Toggle`, with `data-slot="toggle"`. The pressed
state is Base UI's `data-pressed` attribute; there is no `variant`.

| State | Classes | What you see |
|---|---|---|
| Unpressed | `text-muted-foreground`, no fill | grey label on nothing |
| Hover | `hover:text-foreground` | the label darkens; no fill appears |
| Pressed | `data-pressed:bg-background data-pressed:text-foreground data-pressed:shadow-sm` | a lifted white / dark pill — the look of the theme picker in Settings |
| Focus (keyboard) | `focus-ring` | the same 2px outline at 20% of `--ring` Button draws |
| Disabled | `disabled:pointer-events-none disabled:opacity-50` | 50%, no hover — the one disabled opacity in the app |

The pressed pill is `bg-background`, not `bg-primary`: a toggle is meant to
sit on a `bg-muted` track (the group), where a background-coloured pill reads
as "raised" against the track. Standalone, on a `bg-background` page, the
pressed state is therefore only the shadow and the darker label — see the
open questions.

Glyphs follow Button's rule: `[&_svg:not([class*='size-'])]:size-4`, so a
bare Lucide icon is 16px and a call site that wants smaller says so with a
`size-*` class (the library view switch passes `size-3.5`, the theme picker
`size-[14px]`). `gap-1.5` between glyph and label.

## Sizes — two ladders, one component

```tsx
<Toggle size="sm">…</Toggle>        // standalone: h-8  px-3      text-2xsmall font-normal
<Toggle size="default">…</Toggle>   // standalone: h-10 px-[18px] text-small   font-medium
<Toggle size="lg">…</Toggle>        // standalone: h-12 px-10     text-small   font-medium
```

Standalone, `size` (default `sm`) applies the **Button** recipe for that size
— the same height, padding, type and weight — so a Toggle drops into a row of
small buttons without a seam.

Inside a `ToggleGroup` the `size` prop is ignored. The group carries
`data-size`, and the toggle's `group-data-[size=…]/toggle-group:` classes win
over the standalone ones (they are more specific selectors, not later
classes): `h-full flex-1`, then `px-3 text-2xsmall font-normal` for `sm`,
`px-6 text-small font-normal` for `default`, `px-8 text-small font-medium`
for `lg`. That is the **TabsList** ladder, not Button's — a segmented group is
a Tabs-shaped control, and its segments should match a `TabsTrigger` in the
same toolbar. `flex-1` is what lets a full-width group (the mobile search
scope) share its width evenly between segments.

## Usage

```tsx
<Toggle defaultPressed>Pressed</Toggle>
<Toggle pressed={on} onPressedChange={setOn}>Shuffle</Toggle>
<Toggle aria-label="Light mode" className="aspect-square px-0"><Sun className="size-[14px]" /></Toggle>
```

An icon-only toggle needs an `aria-label` and squares itself with
`aspect-square px-0` — the padding would otherwise make a 14px glyph sit in
a 38×32 pill. Nothing in the app mounts a standalone Toggle today; every one
is inside a `ToggleGroup` (see [togglegroup](togglegroup.md)).

## Sizing

Fixed, no steps. A Toggle reads none of the three measures; its width is
its label plus padding, or `flex-1` of its group.

## Behaviour

- Pointer: click flips `pressed`; Base UI fires `onPressedChange`.
- Keyboard: Space and Enter flip it; focus shows the ring.
- Inside a group, arrow keys move between segments (Base UI's composite
  roving focus) and the group's `onValueChange` fires instead.

## Open questions

- toggle.tsx:10 says standalone metrics "match Button sm" · Button's base
  carries `pb-px` (the optical nudge) and `gap-2`; Toggle has no `pb-px` and
  `gap-1.5` (toggle.tsx:36), so a Toggle beside a Button `sm` sits its label
  1px lower and packs its glyph 2px tighter.
- toggle.tsx:26 standalone `default` is `px-[18px] font-medium` (Button's),
  while the grouped `default` is `px-6 font-normal` (TabsList's,
  toggle.tsx:51) — the same `size="default"` word means two paddings and two
  weights depending on where the Toggle sits. Intended, per the header
  comment, but nowhere stated for the reader.
- toggle.tsx:15 describes the pressed pill as the "topbar's theme picker" ·
  no ToggleGroup is mounted in `topbar.tsx`; the theme picker lives in
  `settings-view.tsx:344`. The page's "Used in › Topbar theme switcher" link
  (home.tsx, `togglegroup` section) points at `/`, where there is none.
- Standalone, the pressed state is `bg-background` on a `bg-background` page
  — only `shadow-sm` and the darker label distinguish it. Whether a
  standalone Toggle should carry its own track colour is not recorded; the
  app avoids the question by never mounting one outside a group.
