---
title: Chips
source: src/components/ui/chip.tsx
related: [chip-input, badge, button, filter-menu, mobile-header, multi-select]
usage:
  - Shop › Products → Create listing (Release Type + artist chips) | /?page=Shop&shop-tab=products
---

A `Chip` is a pill you press to pick or filter — a genre, a release type, a
kind in a header bar — and a `ChipDismiss` is a pill that names something
already picked and lets you remove it: the active-filter strip in Studio and
Orders, the artist lists in the upload form. `ChipGroup` is the wrapping row
they sit in.

## Anatomy

Three exports over one cva, `chipVariants`:

| Part | Element | Defaults |
|---|---|---|
| `Chip` | `<button type="button" data-slot="chip">` | `variant="default"`, `size="sm"`; `selected` flips the variant; `count` appends a pill `Badge` |
| `ChipDismiss` | `<span data-slot="chip-dismiss">` holding the label and a ✕ `<button>` | `variant="secondary"`; `selected` flips to `selected`; always `sm` |
| `ChipGroup` | `<div data-slot="chip-group">` | `flex flex-wrap gap-1.5` |

Base classes: `group/chip inline-flex items-center gap-2 rounded-full border
pb-px font-normal whitespace-nowrap transition-[colors,box-shadow]
cursor-pointer select-none`, a 2px focus ring (`ring-2 ring-ring/50`),
`disabled:opacity-50`. `pb-px` is the optical nudge Button, Tabs and Badge
carry; `group/chip` is what lets the count badge style itself against the
chip's selected state.

### Variants

| `variant` | Fill / ink | Reached by |
|---|---|---|
| `default` | `border-border bg-background text-foreground hover:bg-muted` — the `outline` Button look | a `Chip` at rest |
| `selected` | `border-primary bg-primary text-primary-foreground` | `selected` with `activeStyle="fill"` (the default) |
| `selected-outline` | `border-foreground bg-muted text-foreground` | `selected` with `activeStyle="outline"` — a quiet active state for a form field's single choice (release type in Create listing) |
| `secondary` | `border-border bg-muted text-foreground hover:bg-muted` | a `ChipDismiss` at rest — muted because it states a fact rather than offering a choice; hover changes nothing |
| `ghost` | `border-transparent bg-transparent text-foreground hover:bg-muted` | a chip in a bar that is already chrome, where each chip should read as light nav |

`selected` on a `Chip` overrides `variant`; on a `ChipDismiss` it always
means the primary fill (no outline option). `data-selected` is set on a
selected `Chip` for the count badge; a `ChipDismiss` does not set it.

### Sizes

| `size` | Box | Use it for |
|---|---|---|
| `sm` (default) | `h-8 px-3 text-2xsmall` — Button `sm` | genre and tag filters, every `ChipDismiss` |
| `md` | `h-10 px-4 text-small` — Button `default` | a header filter chip: `MobilePillTabs`, and the count-bearing bar |

`md` is 40px for the same reason Button `default` is: a filter chip, a sort
button and a `Select` in one toolbar read as one row. `ChipDismiss` has no
`size` — it is always `sm`.

### The count

```tsx
<Chip size="md" count={12} selected={active}>Albums</Chip>
```

`count` renders `<Badge shape="pill" variant="count">` after the label — a
20px circle for one digit, wider for two — and the `count` variant owns both
of its colour states through `group-data-[selected]/chip:` (see
[badge](badge.md)). Nothing is patched at the call site.

### The ✕

`ChipDismiss` puts a `size-3.5` (14px) round button after the label with a
`size-2.5` (10px) `XIcon` inside, `pr-1.5` on the chip so the button sits
2px further in than the label's `px-3`. Its hover is `bg-foreground/10`
(or `bg-primary-foreground/20` when selected), its focus ring 1px. The click
is `stopPropagation`ed, so a chip inside a clickable row does not fire the
row. `aria-label` is `Remove ${children}` — pass a string child.

## Usage

```tsx
// Multi-select filter — selection is the caller's state.
<ChipGroup>
  {GENRES.map(g => (
    <Chip key={g} selected={picked.includes(g)} onClick={() => toggle(g)}>{g}</Chip>
  ))}
</ChipGroup>

// Single choice in a form, outline when active.
<Chip selected={type === t} activeStyle="outline" onClick={() => setType(t)}>{t}</Chip>

// Active-filter strip — one ChipDismiss per applied filter.
<ChipDismiss onDismiss={() => setStatusFilter("all")}>Public</ChipDismiss>
```

A `Chip` carries no selection state of its own; `selected` is a prop and
`onClick` is the whole API. That keeps "All" trivial — it is the chip whose
`selected` is `picked.length === 0`.

`MobilePillTabs` (`mobile-header.tsx:142`) is a `Chip size="md"` row with
`count` and a leading icon, in a horizontally scrolling strip with `gap-2`
and `shrink-0` on each chip so the row scrolls instead of wrapping.

## Sizing

Fixed, no steps. A chip is as wide as its label; a `ChipGroup` wraps
(`flex-wrap gap-1.5`) and reads none of the three measures. The one
width-aware use is not the chip's: `MobilePillTabs` bleeds the strip to the
header's 12px gutter (`-mx-3 px-3`) below the 768 presentation gate, so
pills scroll under the gutter rather than stopping short of it.

## Behaviour

- `Chip`: a real `<button>` — click, Space and Enter fire `onClick`; the
  focus ring shows on keyboard focus; `disabled` fades it and drops pointer
  events.
- `ChipDismiss`: only the ✕ is focusable. The label is a `span` with
  `truncate`.
- Hover states are pointer-only (Tailwind wraps `hover:` in
  `@media (hover: hover)`), so a tap leaves no sticky hover.

## The press

A Chip is a bespoke button, so it opts into the app's press by hand: `press-ripple relative [--press-fill:var(--press-on-muted)]`. The ripple grows from the point that was pressed and settles one step past the chip's hover.

**`relative` is load-bearing.** The ripple paints on the element's `::before` at `absolute; inset: 0`; on a statically positioned host that anchors to the nearest positioned ancestor instead and floods it — the sheet, the toolbar, the card. Every bespoke consumer of `press-ripple` has to say `relative`.

## Open questions

- DESIGN_SYSTEM.md's former Chips section (now this file) said "no secondary
  or ghost variants — those don't exist in Figma" and named the font
  `text-xxs` · the source has `secondary`, `selected-outline` and `ghost`
  (chip.tsx:48–60) and uses the `text-2xsmall` alias. The source is taken
  as the rule; whether Figma has caught up is not recorded.
- The same section said the dismiss "X icon (14px)" · 14px is the button
  (`size-3.5`); the glyph is 10px (`size-2.5`, chip.tsx:148, 155).
- chip.tsx:38 draws a `ring-2` focus ring and the ✕ a `ring-1`; Button
  drew `ring-3`. Both are `focus-ring` now — one 2px outline at 20% of
  `--ring` for every control — so the question is closed.
- chip.tsx:47–49 `secondary` has `hover:bg-muted` on a `bg-muted` fill — a
  hover that changes nothing. The header comment says `hover:bg-accent`.
- `ChipGroup` is `gap-1.5` (6px); `MobilePillTabs` lays the same chips out
  at `gap-2` (8px) without `ChipGroup`. Which gap is the rule is not
  recorded.
- The `ghost` + `count` bar was built for the Discography toolbar and
  replaced by `MultiSelect` when the kind list passed five entries; it is
  kept for the next inline single-select pill bar and has no call site today.
