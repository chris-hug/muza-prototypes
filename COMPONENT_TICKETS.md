# Component tickets — May 2026 push

One ticket per new or updated component shipped in the May 2026
sessions. Copy a block straight into Linear / Jira.

**Format.** Every block follows the same shape so devs can skim:

- **Summary** — one sentence on what it is and the problem it solves.
- **Behavior** — the rules / quirks a dev needs to honour when wiring it up.
- **Used in** — clickable links to the live prototype pages where you can see it in context.
- **Resources** — design-system anchor + source file.

Repo: <https://github.com/chris-hug/muza-prototypes>
Prototype: <https://imjustsittingherelookingatprettycolours.help>
Design system route (local or hosted): `/?page=DesignSystem`

Grouped by **Core** (streaming, uploading, purchasing digital music
— day-one scope) and **Phase 2 / Shop** (physical merch, product
listings, order fulfillment — deferred).

---

## Core

### Toggle  ·  *new*

**Summary.** A pressable on/off button — the atomic primitive
behind `ToggleGroup`. Use standalone for single "press to toggle X"
controls.

**Behavior.**
- Two visual states (pressed / unpressed) with the same sizes as
  `Button` (`sm` · default · `lg`).
- Inside a `ToggleGroup` the size is inherited from the group —
  don't set it twice.
- Built on base-ui's `Toggle` primitive, so the `pressed` /
  `onPressedChange` API matches.

**Used in:**
- Currently only consumed as a `ToggleGroup` child (see ToggleGroup below). No standalone usage in product surfaces yet.

**Resources.**
- DS: [Toggle](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#toggle)
- Source: [`src/components/ui/toggle.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/toggle.tsx)

### ToggleGroup  ·  *new*

**Summary.** Segmented control — a pill-shaped track holding 2–4
`Toggle` children. Use it for view-mode pickers and other "which
one of these is on" decisions.

**Behavior.**
- Two modes: single-select (one pressed at a time, like radio) and
  multi-select (any combination).
- Same height + chrome as `TabsList sm` so it can sit next to tabs
  without optical clash.
- Children must be `Toggle` components — don't drop arbitrary
  buttons in.

**Used in:**
- [Topbar — theme switcher](https://imjustsittingherelookingatprettycolours.help/) (any page)
- [Artist › Discography — grid/list toggle](https://imjustsittingherelookingatprettycolours.help/?page=Artist)
- [Purchases — order-status filter](https://imjustsittingherelookingatprettycolours.help/?page=Purchases)

**Resources.**
- DS: [ToggleGroup](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#togglegroup)
- Source: [`src/components/ui/toggle-group.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/toggle-group.tsx)

### Toolbar  ·  *new*

**Summary.** Horizontal grouped button bar with roving focus —
arrow keys move between items, only one tab stop for the whole bar.
Reach for it when you have ≥3 related controls that should feel
like one unit (rich-text controls, table actions, canvas tools).

**Behavior.**
- Wrap button-like children (`Button`, `Toggle`, `ToggleGroup`,
  separators). Arrow keys traverse; `Tab` exits the toolbar.
- One visible focus ring at a time — leans on base-ui `Toolbar` for
  the semantics, so don't reinvent the keyboard handling.
- Use `Separator` between logically-grouped clusters.

**Used in:**
- _Not used in product surfaces yet — design-system primitive only._

**Resources.**
- DS: [Toolbar](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#toolbar)
- Source: [`src/components/ui/toolbar.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/toolbar.tsx)

### Meter  ·  *new*

**Summary.** Determinate value-within-a-range indicator. Use it for
"how much of X is used" (storage, password strength, profile
completion). Not the same as `Progress`, which is task-bound /
indeterminate.

**Behavior.**
- Requires `min`, `max`, `value`. Optional label and value text
  render in semantic slots so screen readers announce both.
- Colour bands (low / medium / high) opt-in — the bar stays neutral
  by default.

**Used in:**
- _Not used in product surfaces yet — design-system primitive only._

**Resources.**
- DS: [Meter](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#meter)
- Source: [`src/components/ui/meter.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/meter.tsx)

### ScrollArea  ·  *new*

**Summary.** Themed scrollable container with custom scrollbars
that match the design system and behave consistently on Mac /
Windows / touch. Use it any time native scrollbars look wrong (long
menus, sidebar lists, modal bodies).

**Behavior.**
- Scrollbars auto-hide; reveal on hover / scroll.
- Set an explicit `max-height` (or let the parent constrain
  height) — the child must be taller than the viewport for the
  scrollbar to appear.

**Used in:**
- _Not used in product surfaces yet — design-system primitive only._

**Resources.**
- DS: [ScrollArea](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#scrollarea)
- Source: [`src/components/ui/scroll-area.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/scroll-area.tsx)

### Collapsible  ·  *new*

**Summary.** The lowest-level disclosure primitive — one panel
under one trigger. Reach for it when only a single section needs to
open / close; if you need ≥2 with shared semantics, use `Accordion`.

**Behavior.**
- `Collapsible` is the API base; the trigger element is whatever
  you pass as `CollapsibleTrigger`.
- `Accordion` is built on top of this — don't re-implement the
  open/close state yourself.

**Used in:**
- _Not used in product surfaces yet — design-system primitive only._

**Resources.**
- DS: [Collapsible](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#collapsible)
- Source: [`src/components/ui/collapsible.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/collapsible.tsx)

### Accordion  ·  *new*

**Summary.** Vertical stack of `Collapsible` panels with shared
single-open (or multi-open) semantics. Use for FAQ lists, settings
groups, anything that benefits from progressive disclosure of
parallel content.

**Behavior.**
- `type="single"` (default) closes the previous panel when a new
  one opens; `type="multiple"` lets several stay open.
- `collapsible` prop allows the open panel to close on second
  click (off by default in single mode).

**Used in:**
- _Not used in product surfaces yet — design-system primitive only._

**Resources.**
- DS: [Accordion](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#accordion)
- Source: [`src/components/ui/accordion.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/accordion.tsx)

### NavigationMenu  ·  *new*

**Summary.** Horizontal nav with hover / focus-anchored popups —
the right primitive when you need a mega-menu or category tree
hanging off a top-level item. Use plain `<nav>` + links if you only
need flat navigation.

**Behavior.**
- Sliding the cursor between triggers keeps the popup open, no
  click required — same UX as macOS menu bars.
- Built on base-ui `NavigationMenu` so the keyboard semantics
  (Home, End, Esc) come for free.

**Used in:**
- _Not used in product surfaces yet — design-system primitive only._

**Resources.**
- DS: [NavigationMenu](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#navigationmenu)
- Source: [`src/components/ui/navigation-menu.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/navigation-menu.tsx)

### Badge  ·  *updated*

**Summary.** Compact status / category label. Three exports: `Badge`
(primitive), `ContentTypeBadge` (album / single / EP), `StatusBadge`
(generic status colour map). Unified this push so all badges share
one height regardless of variant.

**Behavior.**
- All variants now render at `h-[26px]` — don't override unless
  you have a specific reason (counts have a dedicated `pill` shape).
- Variants: `secondary` (default), `outline`, `primary` (brand
  fill — "Selected" / active), `success` (mint `#00D5A3` — "New"
  attention pill), `destructive`.
- Shape variants: square (default, `h-[26px]`) and `pill`
  (`h-5 min-w-5` round count badge — nest inside `Chip` via the
  `count` prop, don't hand-render).

**Used in:**
- [Artist › Discography — Type column](https://imjustsittingherelookingatprettycolours.help/?page=Artist)
- [Studio › Music — Type column](https://imjustsittingherelookingatprettycolours.help/?page=Music)
- [Shop › Orders → order detail — status row](https://imjustsittingherelookingatprettycolours.help/?page=Shop&shop-tab=orders)

**Resources.**
- DS: [Badges](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#badges)
- Source: [`src/components/ui/badge.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/badge.tsx)

### Chip  ·  *updated*

**Summary.** Interactive filter / tag pill. Use it for filter rows,
genre tags, anything dismissible. Distinct from `Badge` (Chip is
interactive; Badge is a label).

**Behavior.**
- Sizes: `sm` (`h-8 px-3 text-2xsmall`) and `md` (`h-10 px-4
  text-small`).
- Variants: default (outline), `ghost` (transparent until hover —
  use when the chip sits in dense filter rows).
- `count` prop auto-renders a `Badge shape="pill"` inside the
  chip — don't compose the badge manually.
- Selected state swaps the inner badge to `bg-background` via the
  `group/chip` modifier; pass `selected` rather than re-styling.

**Used in:**
- [Shop › Products — Create listing flow](https://imjustsittingherelookingatprettycolours.help/?page=Shop&shop-tab=products): "Release Type" picker (Single / EP / Album / Compilation) and dismissable artist / collaborator chips in the Main Artist + Featured Artist fields.

**Resources.**
- DS: [Chips](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#chips)
- Source: [`src/components/ui/chip.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/chip.tsx)

### MultiSelect  ·  *updated*  *(renamed from `FilterMenu`)*

**Summary.** Multi-select dropdown — outline pill trigger that
opens a menu of options with **left-side checkboxes**. The "filter
by N categories" workhorse.

**Behavior.**
- Left-checkbox convention is the visual signal that this is
  multi-select (vs `SingleSelect`'s right ✓). Don't swap them.
- Trigger badge shows the active count when ≥1 option is selected.
- Menu stays open while you toggle; closes on outside-click.
- Searchable for long option lists; "Clear all" row at the bottom.

**Used in:**
- [Studio › Music — filters](https://imjustsittingherelookingatprettycolours.help/?page=Music)
- [Artist › Discography — filters](https://imjustsittingherelookingatprettycolours.help/?page=Artist)

**Resources.**
- DS: [MultiSelect](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#multi-select)
- Source: [`src/components/ui/multi-select.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/multi-select.tsx)

### SingleSelect  ·  *new*  *(formerly `SortButton` / `Picker`)*

**Summary.** Single-select dropdown — outline pill trigger that
opens a menu with **right-side ✓** marking the current option. The
toolbar workhorse for sort / view-density / layout pickers.

**Behavior.**
- Right-✓ convention is the visual signal that this is
  single-select. Don't swap with `MultiSelect`'s left-checkboxes.
- Distinct from the form-field `Select`, which lives inside forms
  and renders a field-style trigger. `SingleSelect` is for
  toolbar / inline use.
- Picking an option replaces the current value and closes the menu.

**Used in:**
- [Artist › Discography — sort](https://imjustsittingherelookingatprettycolours.help/?page=Artist)

**Resources.**
- DS: [SingleSelect](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#single-select)
- Source: [`src/components/ui/single-select.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/single-select.tsx)

### AlbumCard  ·  *new*

**Summary.** Universal album / release tile — square cover + title
+ artist/year subtitle, with hover-revealed Add / More / Play
cluster on the cover. Use anywhere a release needs to be
representable as a single tile.

**Behavior.**
- Cover plays on tap; long-press opens the action menu on touch.
  On desktop, hover surfaces Add (or Edit, for owned) · ⋯ · Play.
- Title and artist text are independent click targets (album page
  vs artist page). Don't nest them in one link.
- Owned-album variant swaps Add→Edit and Report→Remove in the menu
  — pass `owned` rather than re-wiring the children.

**Used in:**
- [Library › Albums](https://imjustsittingherelookingatprettycolours.help/?page=Albums)
- [Artist › Top Albums](https://imjustsittingherelookingatprettycolours.help/?page=Artist)
- [Artist › Discography (grid view)](https://imjustsittingherelookingatprettycolours.help/?page=Artist)
- [Home › New Albums + Albums of the week rails](https://imjustsittingherelookingatprettycolours.help/)

**Resources.**
- DS: [AlbumCard](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#album-card)
- Source: [`src/components/ui/album-card.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/album-card.tsx)

### ArtistCard  ·  *new*

**Summary.** Circular avatar + name tile. Use for artist grids and
rails. No hover overlay — the whole tile navigates to the artist
profile.

**Behavior.**
- The avatar image is inset to ~80% of the card width so the
  circle never visually dominates when sharing a row with square
  `AlbumCard`s.
- No play / menu actions on hover — keep it light.

**Used in:**
- [Library › Artists](https://imjustsittingherelookingatprettycolours.help/?page=Artists)
- [Artist › Similar Artists](https://imjustsittingherelookingatprettycolours.help/?page=Artist)
- [Home › Artists of the week rail](https://imjustsittingherelookingatprettycolours.help/)

**Resources.**
- DS: [ArtistCard](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#artist-card)
- Source: [`src/components/ui/artist-card.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/artist-card.tsx)

### PlaylistCard  ·  *new*

**Summary.** Square 2×2 composite cover (or custom artwork) +
title + song-count / owner subtitle. Same interaction model as
`AlbumCard`. Has a sibling `PlaylistCreateCard` for the "+ new
playlist" tile — pair them in grids.

**Behavior.**
- Owned-playlist variant drops the owner subtitle and swaps menu
  items (Save→Edit, Report→Delete). Pass `owned`.
- Composite covers expect exactly 4 image URLs; fewer → uses
  single-image fallback automatically.

**Used in:**
- [Library › Playlists](https://imjustsittingherelookingatprettycolours.help/?page=Playlists)
- [Artist › Curated Playlists](https://imjustsittingherelookingatprettycolours.help/?page=Artist)
- [Home › Playlists of the week rail](https://imjustsittingherelookingatprettycolours.help/)

**Resources.**
- DS: [PlaylistCard](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#playlist-card)
- Source: [`src/components/ui/playlist-card.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/playlist-card.tsx)

### SongListItem  ·  *new*

**Summary.** Single row in any song list — Top Songs on Artist,
playlist detail, search results. The cover thumb itself acts as
the play button.

**Behavior.**
- Idle hover shows ▶ on the thumb; playing state swaps to the
  3D-carousel wave animation with Pause-on-hover.
- Title / album / artist are independent hover-underline click
  targets — don't wrap the whole row in one link.
- Right cluster: `+` always visible; `info` + `⋯` revealed on
  hover; duration sits last.
- Pass `menuItems` to turn the kebab into a real `DropdownMenu`;
  omit to hide the kebab entirely.

**Used in:**
- [Artist › Top Songs](https://imjustsittingherelookingatprettycolours.help/?page=Artist)

**Resources.**
- DS: [SongListItem](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#song-list-item)
- Source: [`src/components/ui/song-list-item.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/song-list-item.tsx)

### CardRail  ·  *new*  *(renamed from `HomeRow`)*

**Summary.** Section divider (separator + title + ◀ ▶ + optional
"Show all") followed by a horizontally-scrolling rail of cards.
Use for every "browse by category" rail on Home and Artist.

**Behavior.**
- Visible card count steps at the same container widths as the
  Library grids (2 / 3 / 4 / 5 / 6 cards at 304 / 464 / 692 / 928
  / 1164 px). Don't hand-tune breakpoints; rely on the container
  queries baked in.
- Touch-pan-x for swipe; arrow buttons scroll one page at a time.
- Scrollbar hidden — paging is the only intended affordance.

**Used in:**
- [Home — New Albums / Playlists of the week / Artists of the week / Albums of the week](https://imjustsittingherelookingatprettycolours.help/)
- [Artist profile rails (Top Albums, Products, Curated Playlists, Similar Artists)](https://imjustsittingherelookingatprettycolours.help/?page=Artist)

**Resources.**
- DS: [CardRail](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#card-rail)
- Source: [`src/components/app/card-rail.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/card-rail.tsx)

### PageSection  ·  *new*

**Summary.** Detail-page primitive: heading + action slot +
flat-or-boxed body. Use it for every section on Order detail,
Purchase detail, Wallet, Settings — anywhere the page is a stack
of labelled chunks.

**Behavior.**
- Heading sits **outside** the box so boxed and unboxed sections
  share the same hierarchy.
- `boxed` wraps children in a bordered card — reserve for product
  / data lists. Default (unboxed) is for metadata stacks (the
  right column on Order detail is intentionally flat).
- Action slot is right-aligned at heading height — drop a `Button`
  or `SingleSelect` in.

**Used in:**
- [Shop › Orders → click a row → order detail](https://imjustsittingherelookingatprettycolours.help/?page=Shop&shop-tab=orders)
- [Purchases → click a fulfillment → purchase detail](https://imjustsittingherelookingatprettycolours.help/?page=Purchases)
- Refund flow (expanded inside order detail)

**Resources.**
- DS: [PageSection](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#page-section)
- Source: [`src/components/app/section.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/section.tsx)

### List Table (pattern)  ·  *new*

**Summary.** Borderless table layout that powers the Artist ›
Discography list view. Not a packaged component yet — lift to
`src/components/ui/list-table.tsx` when a second consumer appears.

**Behavior.**
- Single-line rows; no zebra; per-cell `bg-muted` hover with
  first / last cells rounding the outside corners.
- Cover cell is a play button with overlay + active-row wave
  animation (re-uses `SongListItem`'s `PlayingWave`).
- Sortable column headers (label + arrow); `<th>`s are sticky so
  the header pins to the top of the page scroll.
- Rightmost cell holds a kebab menu sharing `AlbumCardMenuItems`
  so right-click and kebab match.

**Used in:**
- [Artist › Discography (list view)](https://imjustsittingherelookingatprettycolours.help/?page=Artist)

**Resources.**
- DS: [List Table](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#list-table)
- Source: pattern lives in [`artist-profile-view.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/artist-profile-view.tsx) (`DiscographyView` function).

---

## Phase 2 / Shop

### ProductCard  ·  *new*  *(renamed from `ProductCardSmall`)*

**Summary.** Compact product tile (image · title · price ·
full-width "Add to cart" pill). Use for every product surface on
the buyer side — Artist › Shop and any product rail.

**Behavior.**
- Title clamps at two lines with reserved min-height so cards in
  a row stay flush regardless of title length.
- Full-width secondary "Add to cart" pill at the foot — don't
  swap for an icon button; the explicit label is doing work.

**Used in:**
- [Artist › Products tab + Artist › Products rail (Overview)](https://imjustsittingherelookingatprettycolours.help/?page=Artist)

**Resources.**
- DS: [ProductCard](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#product-card)
- Source: [`src/components/ui/product-card.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/product-card.tsx)

### CheckoutCard  ·  *new*

**Summary.** Buyer-side receipt for one checkout — date header +
per-shop fulfillment rows. Use on the Purchases hub to group
every shipment that shared a single payment.

**Behavior.**
- Wraps every shipment under one shared date + total header —
  "one charge, N fulfillments".
- Each fulfillment row links to its detail page.
- A payment-failure on any sub-row promotes a single recovery
  CTA up to the header strip so the user doesn't have to hunt.

**Used in:**
- [Purchases hub](https://imjustsittingherelookingatprettycolours.help/?page=Purchases)

**Resources.**
- DS: [CheckoutCard](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#checkout-card)
- Source: exported from [`purchases-view.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/purchases-view.tsx) (`CheckoutCard` + `CHECKOUTS` fixture).

### Items  ·  *new*  *(`DetailItemsSection`)*

**Summary.** Shared product-list + money-breakdown card that drives
both the buyer purchase-detail page and the seller order-detail
page. Branch on `mode="buyer"` vs `mode="seller"` rather than
forking the component.

**Behavior.**
- Buyer mode: format / type subtitle, no SKU, no tax line.
- Seller mode: variant + SKU subtitle, discount, labelled tax line.
- Each line collapses to a single price at qty=1 and expands to
  muted "unit × qty" + line total at qty > 1.

**Used in:**
- [Shop › Orders → click a row → order detail](https://imjustsittingherelookingatprettycolours.help/?page=Shop&shop-tab=orders)
- [Purchases → click a fulfillment → purchase detail](https://imjustsittingherelookingatprettycolours.help/?page=Purchases)

**Resources.**
- DS: [Items](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#items)
- Source: [`src/components/app/items-section.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/items-section.tsx)

### Order lifecycle status badges  ·  *new*

**Summary.** Colour-coded status pills for orders (`OrderStatusBadge`
— payment_failed / new / shipped / delivered / refunded / cancelled).
The seller-side state machine made visible.

**Behavior.**
- As a static badge: renders the status row in orders /
  purchases lists.
- With an `onStatusChange` handler: the badge becomes a
  `DropdownMenu` of **allowed forward transitions only** — the
  state machine prevents illegal moves (e.g. can't go back from
  delivered to new).
- Don't render arbitrary statuses; the colour map is fixed.

**Used in:**
- [Shop › Orders — list rows](https://imjustsittingherelookingatprettycolours.help/?page=Shop&shop-tab=orders)
- [Shop › Orders → click a row → order detail header (interactive — opens transition menu)](https://imjustsittingherelookingatprettycolours.help/?page=Shop&shop-tab=orders)
- [Purchases hub — list rows](https://imjustsittingherelookingatprettycolours.help/?page=Purchases)
- [Purchases → click a fulfillment → purchase detail header](https://imjustsittingherelookingatprettycolours.help/?page=Purchases)

**Resources.**
- DS: [Badges › Order lifecycle status](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#badges)
- Source: exported from [`orders-view.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/orders-view.tsx) (`OrderStatusBadge`).
