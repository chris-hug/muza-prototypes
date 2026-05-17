# Component tickets — May 2026 push

Source-of-truth descriptions for every new or updated component
shipped in the May 2026 sessions. Copy each block straight into a
ticket. Grouped by **Core** (streaming, uploading, purchasing
digital music — day-one scope) and **Phase 2 / Shop** (physical
merch, product listings, order fulfillment — deferred).

Repo: <https://github.com/chris-hug/muza-prototypes>
Design system route (local): `/?page=DesignSystem`

---

## Core

### Toggle  ·  *new*

**What it is.** Pressable toggle button built on base-ui's `Toggle`
primitive. Standalone single-button toggle, can also be composed
inside a `ToggleGroup`.

**What it does.** Two-state on/off with the same dimensions as
`Button` (sm / default / lg). Inside a `ToggleGroup` inherits the
group's size automatically.

- Design system: [/?page=DesignSystem#toggle](/?page=DesignSystem#toggle)
- GitHub: <https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/toggle.tsx>

### ToggleGroup  ·  *new*

**What it is.** Segmented control container — pill-shaped track
holding multiple `Toggle` children.

**What it does.** Single-select (one pressed at a time) or
multi-select (any combination). Same chrome and heights as
`TabsList sm`.

**Used in:**
- Topbar theme switcher
- Artist › Discography grid/list toggle

- Design system: [/?page=DesignSystem#togglegroup](/?page=DesignSystem#togglegroup)
- GitHub: <https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/toggle-group.tsx>

### Toolbar  ·  *new*

**What it is.** Horizontal grouped button bar with roving focus
and arrow-key navigation (base-ui `Toolbar`).

**What it does.** Wraps button-like children (e.g. rich-text
controls — Bold / Italic / Underline / Link / Code / Settings)
with shared focus semantics. Single tab stop; arrows move between
items.

- Design system: [/?page=DesignSystem#toolbar](/?page=DesignSystem#toolbar)
- GitHub: <https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/toolbar.tsx>

### Meter  ·  *new*

**What it is.** Determinate progress indicator (base-ui `Meter`).

**What it does.** Shows a value within a min/max range — e.g.
storage used, password strength, profile completion. Distinct from
`Progress`, which represents indeterminate or task-bound work.

- Design system: [/?page=DesignSystem#meter](/?page=DesignSystem#meter)
- GitHub: <https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/meter.tsx>

### ScrollArea  ·  *new*

**What it is.** Themed scrollable container (base-ui `ScrollArea`).

**What it does.** Styled scrollbars that match the design system,
auto-hide when not in use, work consistently across browsers /
platforms.

- Design system: [/?page=DesignSystem#scrollarea](/?page=DesignSystem#scrollarea)
- GitHub: <https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/scroll-area.tsx>

### Collapsible  ·  *new*

**What it is.** Show/hide one panel under a trigger (base-ui
`Collapsible`).

**What it does.** Single open/closed disclosure — the lowest-level
primitive that `Accordion` is built on. Use directly when only one
section needs to expand.

- Design system: [/?page=DesignSystem#collapsible](/?page=DesignSystem#collapsible)
- GitHub: <https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/collapsible.tsx>

### Accordion  ·  *new*

**What it is.** Multiple `Collapsible` panels with shared
single-open semantics (base-ui `Accordion`).

**What it does.** Vertical stack of headings, only one panel
expanded at a time (or `multiple` to allow several). Used for FAQ
lists, settings groups, anything that benefits from progressive
disclosure.

- Design system: [/?page=DesignSystem#accordion](/?page=DesignSystem#accordion)
- GitHub: <https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/accordion.tsx>

### NavigationMenu  ·  *new*

**What it is.** Horizontal nav with hover/focus-anchored popups
(base-ui `NavigationMenu`).

**What it does.** Top-level navigation patterns that need rich
popups (mega-menu, category trees). Sliding between triggers keeps
the popup open without a click.

- Design system: [/?page=DesignSystem#navigationmenu](/?page=DesignSystem#navigationmenu)
- GitHub: <https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/navigation-menu.tsx>

### Badge  ·  *updated*

**What it is.** Compact label primitive (`Badge`,
`ContentTypeBadge`, `StatusBadge`).

**What it does.** Status / category tags. All variants now share a
unified `h-[26px]` height. New variants this push: `primary` (brand
fill, "Selected" / active), `success` (mint `#00D5A3`, used for
"New" attention pills), and a `pill` shape variant for round count
badges that nest inside chips.

**Used in:**
- Order detail status
- Studio › Music type column
- Artist › Discography type column

- Design system: [/?page=DesignSystem#badges](/?page=DesignSystem#badges)
- GitHub: <https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/badge.tsx>

### Chip  ·  *updated*

**What it is.** Interactive filter / tag pill.

**What it does.** Toggleable pill (filter chips, genre tags,
dismissible chips). New this push: `size` (`sm` / `md`), `ghost`
variant (transparent until hover), and `count` prop that auto-renders
a `Badge shape="pill"` for inline counts.

**Used in:**
- Vinyl listing — genre tags

- Design system: [/?page=DesignSystem#chips](/?page=DesignSystem#chips)
- GitHub: <https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/chip.tsx>

### MultiSelect  ·  *updated*  *(renamed from `FilterMenu`)*

**What it is.** Multi-select dropdown button — outline pill that
opens a menu of options with **left-side checkboxes**.

**What it does.** Multi-select on a list/grid (e.g. filtering by N
categories). Ticking an option adds it to the selection; the menu
stays open while you toggle. A count badge in the trigger reflects
how many are currently active. Searchable for long option lists;
"Clear all" row at the bottom.

**Used in:**
- Studio › Music filters
- Artist › Discography

- Design system: [/?page=DesignSystem#multi-select](/?page=DesignSystem#multi-select)
- GitHub: <https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/multi-select.tsx>

### SingleSelect  ·  *new*  *(formerly `SortButton` / `Picker`)*

**What it is.** Single-select dropdown button — outline pill that
opens a menu with **right-side ✓** marking the current option.

**What it does.** "Pick one of N" trigger sitting in a toolbar
(sort, view density, layout mode, card size). Picking another
option replaces the current value. Distinct from the form-field
`Select`, which lives inside forms.

**Used in:**
- Artist › Discography (sort)

- Design system: [/?page=DesignSystem#single-select](/?page=DesignSystem#single-select)
- GitHub: <https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/single-select.tsx>

### AlbumCard  ·  *new*

**What it is.** Square cover + title + artist/year subtitle, with
hover-revealed Add / More / Play cluster.

**What it does.** Universal album / release tile across browse,
library and artist surfaces. Tap cover to play, long-press for
the action menu (touch); on desktop hover surfaces Add/Edit + ⋯ +
Play. Owned albums swap Add for Edit and the menu carries Remove
instead of Report. Title and artist text are independent click
targets.

**Used in:**
- Library › Albums
- Artist › Top Albums
- Artist › Discography (grid view)
- Home › New Albums rail

- Design system: [/?page=DesignSystem#album-card](/?page=DesignSystem#album-card)
- GitHub: <https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/album-card.tsx>

### ArtistCard  ·  *new*

**What it is.** Circular avatar + name tile.

**What it does.** Universal artist tile. No hover overlay — tapping
navigates to the artist profile. Image is inset to ~80% so the
circle never visually dominates when sharing a row with
square AlbumCards.

**Used in:**
- Library › Artists
- Artist › Similar Artists

- Design system: [/?page=DesignSystem#artist-card](/?page=DesignSystem#artist-card)
- GitHub: <https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/artist-card.tsx>

### PlaylistCard  ·  *new*

**What it is.** Square 2×2 composite cover (or custom artwork) +
title + song-count / owner subtitle. Has a sibling
`PlaylistCreateCard` for the "+ new playlist" tile.

**What it does.** Same interaction model as AlbumCard. Owned
playlists drop the owner name and swap menu items (Save → Edit,
Report → Delete).

**Used in:**
- Library › Playlists
- Artist › Curated Playlists

- Design system: [/?page=DesignSystem#playlist-card](/?page=DesignSystem#playlist-card)
- GitHub: <https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/playlist-card.tsx>

### SongListItem  ·  *new*

**What it is.** Single row in any song list (Top Songs on Artist,
playlist detail, search results).

**What it does.** Cover thumb acts as the play button — idle hover
shows ▶, playing state swaps to the 3D-carousel wave animation
with Pause-on-hover. Title / album / artist are independent
hover-underline click targets. Right cluster: `+` always visible,
`info` + `⋯` revealed on hover, then duration. Pass `menuItems`
to turn the kebab into a real DropdownMenu.

**Used in:**
- Artist › Top Songs

- Design system: [/?page=DesignSystem#song-list-item](/?page=DesignSystem#song-list-item)
- GitHub: <https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/song-list-item.tsx>

### CardRail  ·  *new*  *(renamed from `HomeRow`)*

**What it is.** Section divider (separator + title + ◀ ▶ + optional
"Show all") followed by a horizontally-scrolling rail of cards.

**What it does.** Visible card count steps at the same container
widths as the Library grids (2/3/4/5/6 cards at 304/464/692/928/1164
px). Touch-pan-x for swipe, arrow buttons scroll one page at a
time. Scrollbar hidden.

**Used in:**
- Home › New Albums / Playlists / Artists rails
- Artist profile rails (Top Albums, Products, Curated Playlists, Similar Artists)

- Design system: [/?page=DesignSystem#card-rail](/?page=DesignSystem#card-rail)
- GitHub: <https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/card-rail.tsx>

### PageSection  ·  *new*

**What it is.** Detail-page primitive: heading + action slot +
flat-or-boxed body.

**What it does.** Shared section primitive used by the
buyer-side purchase detail and the seller-side order detail.
Heading sits OUT of the box so boxed and unboxed sections share
the same hierarchy. `boxed` wraps children in a bordered card
(reserved for product / data lists).

**Used in:**
- Order detail
- Purchase detail

- Design system: [/?page=DesignSystem#page-section](/?page=DesignSystem#page-section)
- GitHub: <https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/section.tsx>

### List Table (pattern)  ·  *new*

**What it is.** Borderless table layout pattern that powers the
Artist › Discography list view.

**What it does.** Single-line rows, no zebra borders, per-cell
`bg-muted` hover with first/last cells rounding the outside
corners. Cover cell is a play button with overlay + active
(playing) wave animation. Sortable column headers (label + arrow);
sticky `<th>`s so the header pins to the top of the page scroll.
Rightmost cell holds a kebab menu sharing `AlbumCardMenuItems`.

**Used in:**
- Artist › Discography (list view)

- Design system: [/?page=DesignSystem#list-table](/?page=DesignSystem#list-table)
- GitHub: Pattern lives in [`artist-profile-view.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/artist-profile-view.tsx) (DiscographyView function) — promote to a shared component when a second consumer appears.

---

## Phase 2 / Shop

### ProductCard  ·  *new*  *(renamed from `ProductCardSmall`)*

**What it is.** Compact product tile (image · title · price · "Add
to cart" pill).

**What it does.** Used on Artist › Shop and any product rail.
Title clamps at two lines with reserved min-height so cards in a
row stay flush regardless of title length. Full-width secondary
"Add to cart" pill at the foot.

**Used in (Phase 2):**
- Artist › Shop tab
- Artist › Products rail

- Design system: [/?page=DesignSystem#product-card](/?page=DesignSystem#product-card)
- GitHub: <https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/product-card.tsx>

### CheckoutCard  ·  *new*

**What it is.** Buyer-side receipt for one checkout (date header +
per-shop fulfillment rows).

**What it does.** Wraps every shipment in the same payment ("one
charge, N fulfillments") under a shared date + total header. Each
fulfillment row links to its detail page. A payment-failure on any
sub-row promotes a single recovery CTA up to the header strip so
the user doesn't have to hunt for it.

**Used in (Phase 2):**
- Purchases hub

- Design system: [/?page=DesignSystem#checkout-card](/?page=DesignSystem#checkout-card)
- GitHub: Exported from [`purchases-view.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/purchases-view.tsx) (`CheckoutCard` + `CHECKOUTS` fixture).

### Items  ·  *new*  *(`DetailItemsSection`)*

**What it is.** Shared product-list + money-breakdown card.

**What it does.** Drives both the buyer purchase-detail page
(format/type subtitle, no SKU, no tax) and the seller order-detail
page (variant + SKU, discount, labelled tax). Each line collapses
to a single price at qty=1 and expands to muted "unit × qty" + line
total at qty > 1.

**Used in (Phase 2):**
- Order detail
- Purchase detail

- Design system: [/?page=DesignSystem#items](/?page=DesignSystem#items)
- GitHub: <https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/items-section.tsx>

### Order lifecycle status badges  ·  *new*

**What it is.** Colour-coded status pills for orders
(`OrderStatusBadge` — payment_failed / new / shipped / delivered /
refunded / cancelled).

**What it does.** Render a status row in the orders / purchases
list. With an `onStatusChange` handler the badge becomes a
DropdownMenu of allowed forward transitions (seller-side state
machine).

**Used in (Phase 2):**
- Studio › Orders
- Purchases hub
- Purchase / Order detail header

- Design system: [/?page=DesignSystem#badges](/?page=DesignSystem#badges) (section "Order lifecycle status")
- GitHub: Exported from [`orders-view.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/orders-view.tsx) (`OrderStatusBadge`).
