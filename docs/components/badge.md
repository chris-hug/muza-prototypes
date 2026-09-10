---
title: Badge
source: src/components/ui/badge.tsx
related: [status-badge, order-status-badge, purchased-badge, chips, colors]
usage:
  - Studio › Music type column | /?page=Music
  - Artist › Discography type | /?page=Artist
---

`Badge` is the small, non-interactive label — a type, a status, a count, a
flag — and `ContentTypeBadge` is its most common use: the "Album" / "Single"
/ "Playlist" mark on a row or a sheet header. Both are 26px tall, `rounded-sm`,
`text-2xsmall font-normal`, never uppercase.

## Anatomy

A `<span data-slot="badge">` styled by `badgeVariants` (cva), two axes:
`variant` (colour) and `shape` (box).

Base classes, every variant: `inline-flex w-fit shrink-0 items-center gap-1
border border-transparent font-normal leading-none whitespace-nowrap
transition-colors`, glyph slot `[&>svg]:size-3` (12px). The border is
**always present** and transparent where unused, so a bordered and a
borderless badge are the same height and a row of mixed badges aligns.

### Variants

| `variant` | Fill / ink | Use it for |
|---|---|---|
| `secondary` (default) | `bg-muted text-foreground border-border` | a content-type label; the Phase 2 flag on the design-system page |
| `outline` | `bg-background/50 backdrop-blur-[8px] border-border text-muted-foreground` — glass | a status label over artwork; "Not used yet" on the design-system page |
| `primary` | `bg-primary text-primary-foreground border-primary` | active pill chrome; loud — no call site today |
| `success` | a saturated mint fill with dark ink | "Beta" / "Recommended"; no call site today |
| `new` / `updated` | pale tint + dark ink in light mode, flipped in dark (the `user-avatar` palette's Mint and Honey) | the design-system page's section flags — `Section` in `home.tsx` |
| `count` | `bg-accent text-foreground`; `group-data-[selected]/chip:bg-background/20 …:text-primary-foreground` | the number inside a `Chip` — see [chips](chips.md) |
| `destructive` | `bg-destructive text-white` | an error flag |

**`count` owns both of its states.** It sits one step above a chip's
resting fill (`bg-accent` over `bg-background` / `bg-muted`) so it stays
legible on the chip's hover, and flips to a translucent light pill while the
parent chip is selected, via the chip's `group/chip` + `data-selected`. Call
sites used to patch those colours in with `className`; the variant exists so
they never have to.

**`success`, `new` and `updated` are the three hex-literal variants in the
app.** They are exempt from the semantic-token rule on purpose — they are
palette colours (`src/lib/avatar.ts`), not theme roles — and they are the
reason a caller should reach for `secondary` / `outline` first: they are
loud, and there is no token to retheme them with.

### Shapes

| `shape` | Box | Use it for |
|---|---|---|
| `square` (default) | `rounded-sm h-[26px] px-[6px] pb-px text-2xsmall` | every label badge |
| `square-xs` | `rounded-[1px] border-0 h-[18px] px-1 pb-px gap-0.5 [&>svg]:size-2.5` | a badge inside a text line, so it does not push the line box; no call site today |
| `pill` | `rounded-full justify-center h-5 min-w-5 px-1 pb-px text-xsmall border-transparent` | the `count` inside a `md` Chip |
| `pill-sm` | the same, at `h-[18px] min-w-[18px] text-2xsmall` | the `count` inside a `sm` Chip — 20/17 there put the number a type size above its own label |

`square` is a **fixed 26px**, not padding-derived, so a badge with a glyph
(`ContentTypeBadge`) and one without are the same height. `pill` is `px-1`,
not `px-1.5`: a single digit then lands inside `min-w-5` and the pill is a
true 20×20 circle — at `px-1.5` a "3" measured 22.8×20, a slight oval that
read as a mis-centred number. Two digits widen it on their own.

`pb-px` on every shape is the optical nudge Button, Tabs and Chip carry:
Founders Grotesk sits low in a flex-centred box, and one pixel of bottom
padding puts the ink on centre (measured within 0.15px).

## `ContentTypeBadge`

```tsx
<ContentTypeBadge type="album" />   // song · album · single · ep · artist · playlist · label
```

Its own span (`data-slot="content-type-badge"`), not a `Badge` call, but the
same box: `rounded-sm border border-border bg-muted text-foreground h-[26px]
px-[6px] pb-px text-2xsmall font-normal leading-none`, a 12px Lucide glyph
before the label. The glyph is fixed per type — `Music2` song, `Disc3` album
/ single / EP, `Mic` artist, `ListMusic` playlist, `Building2` label (the
same glyph as the "Go to label" menu action, so the mark and the action
match). The label is derived from `type`; a caller never passes text.

### Where a content-type badge belongs

A badge that repeats what the surrounding UI already states is noise.
`ContentTypeBadge` is allowed **only** where the type is not otherwise
obvious:

| Surface | Badge? | Why |
|---|---|---|
| Search results (rows, cards) | no | the category tabs already name the type |
| Library list rows / `MediaListItem` | no | the view is single-type |
| Mobile "…" sheet header (`DetailMoreButton`) | yes | the sheet is context-free once open — album, playlist and artist |
| Artist discography rows | yes | Album / Single / EP is a real distinction inside one list |
| Studio | yes | mixed-type inventory |

Never pair a badge with a subtitle that says the same word ("Artist" under a
name plus an "Artist" badge).

## Usage

```tsx
<Badge>Phase 2 · Shop</Badge>                       // secondary · square
<Badge variant="outline">Not used yet</Badge>
<Badge variant="new">New</Badge>
<Badge shape="pill" variant="count">{n}</Badge>     // inside a Chip — Chip does this for you via `count`
<ContentTypeBadge type={release.type} />
```

Do not build a badge from a `span` with your own colours, and do not patch a
`Badge`'s colours through `className` — if a state is missing, add a variant.
`OrderStatusBadge` is the one component that passes colour classes in, and it
does so from a single config table (see [order-status-badge](order-status-badge.md)).

## Sizing

Fixed, no steps. A badge is `w-fit shrink-0` and reads none of the three
measures; `whitespace-nowrap` means it never wraps, so a row that runs out
of width must truncate something else.

## Behaviour

None — a `Badge` is a `span`. The interactive badges are their own
components: [`StatusBadge`](status-badge.md) (a menu trigger) and
[`OrderStatusBadge`](order-status-badge.md) (a dropdown trigger when given a
handler).

## Open questions

- badge.tsx:18 "Specs: rounded-sm · pt-[4px] pb-[6px] px-[6px]" · the
  `square` shape is `h-[26px] px-[6px] pb-px` (badge.tsx:83) — the fixed
  height replaced the padding recipe, and the header was not updated.
- badge.tsx:80–82 says `square` matches `StatusBadge` "exactly" · StatusBadge
  keeps the padding recipe `pt-[4px] pb-[6px]` with `leading-none` 15px
  text and a 1px border (status-badge.tsx:39–42), which is 27px, one taller
  than the 26px badge beside it in the Studio row.
- badge.tsx:128 says `ContentTypeBadge` is "always bg-accent" · the class is
  `bg-muted` (badge.tsx:155).
- DESIGN_SYSTEM.md's former Badges section (now this file) listed
  `rounded-[2px]`, `px-1.5`, `text-xxs font-medium`, a `default (neutral-950)`
  variant, and `ContentTypeBadge` as `bg-secondary text-secondary-foreground`
  · the source has `rounded-sm` (8px at the 12px base radius), `px-[6px]`,
  `font-normal`, no `default` variant, and `bg-muted text-foreground`. The
  source is taken as the rule here.
- `primary`, `success` and `square-xs` have no call site outside `badge.tsx`.
  Whether they stay is not recorded.
