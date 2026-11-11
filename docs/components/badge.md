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
| `new` / `updated` | pale tint + dark ink in light mode, flipped in dark (the `user-avatar` palette's Mint and Honey). Mint is exported as `BADGE_MINT` and is the one green for every "good" state: a sale, an order Delivered, a full match in the upload dialog. Tailwind's `green-*` was a second green with no place in the palette | the design-system page's section flags — `Section` in `home.tsx` |
| `count` | `bg-accent text-foreground`; `group-data-[selected]/chip:bg-background/20 …:text-primary-foreground` | the number inside a `Chip` — see [chips](chips.md) |
| `inverse` | `bg-foreground text-background font-medium tabular-nums` | a count that asks for attention on its own: new orders on a tab, the cart, active filters. With `pill` it is a true 18×18 circle (`pb-0 px-0.5`, measured: the numeral within 0.03px of centre). It replaced three hand-built pills that sat 0.78px low |
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
| `square-xs` | `rounded-[4px] border-0 h-[18px] px-1.5 text-2xsmall leading-[18px] gap-0.5 [&>svg]:size-2.5`, no `pb-px` | a one-word label inside a text line, so it does not push the line box: **Owned** and **Local** (see [Purchased Badge](purchased-badge.md)). With `secondary` the fill is `bg-accent` (the count's), with `outline` the 1px border comes back |
| `pill` | `rounded-full justify-center h-[18px] min-w-[18px] px-1 pb-px text-2xsmall border-transparent` | every count: inside a Chip (either size), a filter button, the cart, a Shop tab, the Discography kind filter |

`square` is a **fixed 26px**, not padding-derived, so a badge with a glyph
(`ContentTypeBadge`) and one without are the same height. `pill` is `px-1`,
not `px-1.5`: a single digit then lands inside `min-w-[18px]` and the pill is
a true circle — at `px-1.5` a "3" measured 22.8×20 on the old 20px pill, a
slight oval that read as a mis-centred number. Two digits widen it on their
own.

**One count size.** There were two, `pill` (20px, 17px numeral) for a 40px
Chip and `pill-sm` (18px, 15px) for a 32px one. In the product only the small
one was reached — the 40px chip with a count lived on the design-system page
alone — and the large one's one call site was a menu row where 17px put the
number a size above its label. A count is a footnote to its label; 15px is the
floor for anything read as language. So `pill` is now the 18px one, and
`pill-sm` is gone.

**`square-xs` owns its line height** (`leading-[18px]`, its own height).
Without it the badge inherited whatever line it sat in, and the same "Local"
badge drew its word half a pixel apart under a card (`leading-[18px]`) and in
the album page's meta line (`leading-none`) — measured 4.4 / 3.8 against
4.9 / 3.3 from the ink to the edges. It drops `pb-px`: on "Owned" (cap and
ascender, no descender) the nudge put the ink 3.6 / 4.6, without it 4.1 / 4.1.

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
| Single-type library rows / `MediaListItem` | no | the view is single-type |
| Library at rest and Library › Local, list rows (`MediaListItem showType`) | yes | types share one list; nothing else names them |
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
- `primary` and `success` have no call site outside `badge.tsx`.
  Whether they stay is not recorded.
