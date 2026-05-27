# Page tickets — May 2026 push

One ticket per new or substantially reshaped page shipped in the
May 2026 sessions. Copy a block straight into ClickUp / Linear.

**Format.** Each ticket leads with **Resources** (call-out blockquote
at the top) so a dev can jump straight from the ticket into the
prototype + source. Detailed implementation notes live as comments
inside the code already; this doc just orients you.

- **Resources** (blockquote, highlighted) — live prototype link + source file.
- **Uses** — design-system components composed in this page (right after Resources for fast cross-reference into `COMPONENT_TICKETS.md`).
- **Summary** — one sentence on what the page is and who it serves.
- **URL** — exact `?page=…` (and `&…-tab=` when applicable).
- **Composition** — shell wrap + scroll container.
- **Sections** — top-to-bottom content blocks.
- **Rules** — layout / chrome constraints lifted from the source.

Repo: <https://github.com/chris-hug/muza-prototypes>
Prototype: <https://imjustsittingherelookingatprettycolours.help>

Grouped by **Phase 1** (streaming, uploading, purchasing digital
music — day-one scope) and **Phase 2 / Shop** (physical merch,
product listings, order fulfillment — deferred).

---

## Layout patterns

Three responsive recipes cover every page in this doc. Tickets
reference these by name instead of restating the grid each time.


### Pattern A — **Card grid**
`grid-template-columns: repeat(auto-fill, minmax(192px, 1fr))` with
`gap-4`. Reflows freely from 1 column up to as many as fit; the
192px floor stops cards from ever overlapping or going under-size.
Used for every static card list — Library pages, Studio › Music
grid, Shop › Products grid, Artist › Products tab, Artist ›
Discography grid page.

> The user-facing Library grids (`library-albums-view`,
> `library-artists-view`, `library-playlists-view`) actually use
> Pattern B's **container-query stepped grid** (matching the rails
> on the same page) rather than the freeform `auto-fill` — keeps
> card sizes locked to the same column tracks as the rails. See
> [`DESIGN_SYSTEM.md` › Layout — page max-width tiers](DESIGN_SYSTEM.md#layout--page-max-width-tiers).


### Pattern B — **Container-query rail / grid**
Horizontally scrolling rail (CardRail) or stepped grid (Library
views). Card count steps off the container's OWN width via
`@container`, independent of viewport:
- 2 / 3 / 4 / 5 / 6 cards at 304 / 464 / 692 / 928 / 1164 px
- **7 cards at 1500 px** — tier-2 wide-screen step; activates once
  the page wrapper hits its tier-2 cap (see below).

Used on Home (the four discovery rails), Library views (Albums /
Artists / Playlists grids), Artist profile (Top Albums, Products,
Curated Playlists, Similar Artists). Wrap consumers in an
`@container` parent so the rail can read its width.


### Layout — page max-width tiers
Two content-growth tiers keep medium widths grid-aligned without
leaving white margins at very wide viewports. Every top-level page
wrapper uses:
```tsx
<div className="@container mx-auto max-w-[1480px] min-[1920px]:max-w-[1716px] px-10 …">
```
Full table, math, and rules in
[`FOUNDATION_TICKETS.md › Page layout — responsive container & growth tiers`](FOUNDATION_TICKETS.md#page-layout--responsive-container--growth-tiers).


### Pattern C — **Detail two-column**
Primary content column + sticky-on-desktop metadata column. Right
column collapses below the primary column on mobile. Used by Order
detail and Purchase detail.

Other responsive notes:
- AppShell sidebar auto-collapses below the mobile breakpoint via `useIsMobile`. User-toggle on top of that.
- Page crossfade: 250ms `pageFadeIn` keyframe on each `activeNav` change — handled by the route, individual pages don't need to do anything.

---

## Phase 1 — Core


### Home

> **Resources**
> - Live: <https://imjustsittingherelookingatprettycolours.help/>
> - Source: `HomeView` function in [`app/routes/home.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/app/routes/home.tsx)

**Uses.** `AnimatedLogo`, `Button`, `CardRail`, `AlbumCard`, `PlaylistCard`, `ArtistCard`.

**Summary.** Marketing-style landing page for logged-in users —
hero, call-to-action, then four discovery rails of cards.

**URL.** `/` (no `?page` param)

**Composition.**
- AppShell (sidebar + topbar).
- Scroll container — single column, `max-w-[1480px] min-[1920px]:max-w-[1716px] mx-auto (two-tier — see Layout patterns above)`.

**Sections.**
- Hero: wordmark + headline + AnimatedLogo trio.
- Body copy: two `text-[clamp(2rem,3vw,4rem)]` paragraphs.
- CTA: "Join muza now" `Button size="lg"` that navigates to Studio › Music.
- Four **Pattern B** (CardRail) rails: New Albums, Playlists of the week, Artists of the week, Albums of the week.

**Rules.**
- AnimatedLogo size is viewport-derived via `useViewportLogoSize` — don't hard-code.
- Body paragraphs use `text-[clamp(…)]` not Tailwind text-size classes — copy as-is when cloning the layout.

### Artist profile

> **Resources**
> - Live: <https://imjustsittingherelookingatprettycolours.help/?page=Artist>
> - Source: [`src/components/app/artist-profile-view.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/artist-profile-view.tsx)

**Uses.** `Tabs`, `CardRail`, `AlbumCard`, `ArtistCard`, `PlaylistCard`, `ProductCard`, `SongListItem`, `CoverPlayButton`, `MultiSelect`, `SingleSelect`, `ToggleGroup`, List Table pattern.

**Summary.** Single-artist page with three tabs (Overview /
Discography / Products). Universal entry for everything an artist
publishes — releases, songs, similar artists, products.

**URL.** `/?page=Artist`  (tabs are local React state, not URL-backed)

**Composition.**
- AppShell.
- Header strip with hero image + artist name + follow / share actions.
- `<Tabs>` switching between Overview / Discography / Products content.

**Sections.**
- **Overview**: Top Songs (list), then **Pattern B** rails for Top Albums, Products, Curated Playlists, Similar Artists.
- **Discography**: filter row (`MultiSelect`) + sort (`SingleSelect`) + grid/list toggle (`ToggleGroup`). Grid is **Pattern A** of `AlbumCard`s; list is the List Table pattern (sortable sticky headers, `CoverPlayButton` per row, kebab via `AlbumCardMenuItems`).
- **Products**: **Pattern A** of `ProductCard`s. **Phase 2** content — see its own ticket below; the Artist-profile shell itself is Phase 1.

**Rules.**
- Tab state is local — don't URL-back it; the Artist page is the unit.
- Discography list view uses the canonical List Table pattern; copy from `DiscographyView` rather than re-rolling table chrome.
- Similar Artists rail uses `ArtistCard`s; don't mix with `AlbumCard`s.

### Library › Albums

> **Resources**
> - Live: <https://imjustsittingherelookingatprettycolours.help/?page=Albums>
> - Source: [`src/components/app/library-albums-view.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/library-albums-view.tsx)

**Uses.** `AlbumCard`.

**Summary.** Grid of every album the user has saved.

**URL.** `/?page=Albums`

**Composition.** AppShell + scroll container.

**Sections.**
- Title strip (count + sort / filter when present).
- **Pattern A** grid of `AlbumCard`s.

**Rules.**
- Card text uses `leading-5` and `gap-0` for tight stacking.

### Library › Artists

> **Resources**
> - Live: <https://imjustsittingherelookingatprettycolours.help/?page=Artists>
> - Source: [`src/components/app/library-artists-view.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/library-artists-view.tsx)

**Uses.** `ArtistCard`.

**Summary.** Grid of every saved artist.

**URL.** `/?page=Artists`

**Composition.** AppShell + scroll container.

**Sections.**
- Title strip.
- **Pattern A** grid of `ArtistCard`s.

**Rules.**
- Don't reuse `AlbumCard`s here — circular silhouette is part of the visual language for "artist."

### Library › Playlists

> **Resources**
> - Live: <https://imjustsittingherelookingatprettycolours.help/?page=Playlists>
> - Source: [`src/components/app/library-playlists-view.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/library-playlists-view.tsx)

**Uses.** `PlaylistCard`, `PlaylistCreateCard`.

**Summary.** Grid of saved + owned playlists. First tile is the
"+ new playlist" `PlaylistCreateCard`.

**URL.** `/?page=Playlists`

**Composition.** AppShell + scroll container.

**Sections.**
- Title strip.
- **Pattern A** grid: `PlaylistCreateCard` first, then `PlaylistCard`s for saved + owned.

**Rules.**
- Owned-playlist cards drop the owner subtitle and use the Delete-not-Report kebab menu.
- `PlaylistCreateCard` must lead the grid — not sit at the end.

### Studio › Music (releases dashboard)

> **Resources**
> - Live: <https://imjustsittingherelookingatprettycolours.help/?page=Music>
> - Source: [`src/components/app/studio-music.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/studio-music.tsx)

**Uses.** `MultiSelect`, `SingleSelect`, `ToggleGroup`, `Toggle`, `Button`, `AlbumCard`, List Table pattern, `UploadMusicDialog`.

**Summary.** Seller-side view of every release the artist has
uploaded — filter / sort / grid-or-list toggle, then the list /
grid of releases. Entry point to the upload flow.

**URL.** `/?page=Music`

**Composition.**
- AppShell.
- Toolbar strip (filters, sort, grid/list `ToggleGroup`, "Upload" CTA).
- Scroll container with grid OR list of releases.

**Sections.**
- Toolbar: `MultiSelect` filter chips, `SingleSelect` sort, `ToggleGroup` grid/list toggle, `Button` "Upload music".
- Grid: **Pattern A** of `AlbumCard`s.
- List: List Table pattern (same as Discography list).

**Rules.**
- "Upload music" button opens the global `UploadMusicDialog` (not a route nav).
- Filter chips, sort, and grid/list state are local — don't URL-back them yet.

### Upload music dialog

> **Resources**
> - Live: <https://imjustsittingherelookingatprettycolours.help/?page=Music> → click "Upload music"
> - Source: [`src/components/app/upload-music-dialog.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/upload-music-dialog.tsx)

**Uses.** `Button`, `Input`, `Select`, `Chip`, `Progress`.

**Summary.** Modal flow for uploading a new release — drag-drop,
metadata, distribution choices. Can minimize to a persistent
progress toast so the user can navigate while it uploads.

**URL.** No URL — global dialog, opens over any view.

**Composition.**
- Modal absolute inside `<main>` (NOT a global portal — sidebar stays visible).
- Minimized state: floating progress toast top-right.

**Sections.**
- Drop zone / file picker.
- Release metadata form (title, artist, format, distribution choices).
- Progress bar during upload.

**Rules.**
- Dialog mounts at `absolute inset-0 z-50` inside the `<main>` — keeping the sidebar visible is intentional.
- Minimized toast lives at `fixed top-[86px] right-10 z-50` with the `Maximize2` icon to re-open.
- Progress state lives in the parent route component — the dialog reports up via `onProgressChange`.

### Purchases hub

> **Resources**
> - Live: <https://imjustsittingherelookingatprettycolours.help/?page=Purchases>
> - Source: [`src/components/app/purchases-view.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/purchases-view.tsx)

**Uses.** `ToggleGroup`, `CheckoutCard`, `OrderStatusBadge`.

**Summary.** Buyer-side hub for everything the user has bought —
digital downloads, vinyl pre-orders, anything in flight. Grouped by
checkout so a single payment containing multiple fulfillments reads
as one card.

**URL.** `/?page=Purchases`

**Composition.**
- AppShell.
- Toolbar with status filter.
- Scroll container with stacked `CheckoutCard`s.

**Sections.**
- Toolbar: `ToggleGroup` order-status filter (all / new / shipped / delivered / refunded / failed).
- List: stacked `CheckoutCard`s, each containing one or more fulfillment rows linking to `Purchase detail`.

**Rules.**
- Each `CheckoutCard` represents ONE charge — never split a checkout across cards.
- Payment-failure recovery CTA lives on the CheckoutCard header strip, not on sub-rows.
- Status filter is `ToggleGroup` (single-select), not `MultiSelect` — one-status-at-a-time is the intended UX.

### Purchase detail

> **Resources**
> - Live: <https://imjustsittingherelookingatprettycolours.help/?page=Purchases> → click any fulfillment
> - Source: [`src/components/app/purchase-detail-view.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/purchase-detail-view.tsx)

**Uses.** `PageSection`, `DetailItemsSection`, `OrderStatusBadge`, `Badge`, `Alert`, `Button`.

**Summary.** Buyer-side view of one fulfillment from a checkout —
header (date / total / status), line items, money breakdown,
shipping address, payment method.

**URL.** Not directly URL-addressable — reached by clicking a row inside Purchases hub.

**Composition.** AppShell + **Pattern C** (primary content column + sticky-on-desktop metadata column).

**Sections.**
- Header: order # + `OrderStatusBadge` (static) + date · seller · total line + inline alerts.
- Items + money breakdown (`DetailItemsSection mode="buyer"`).
- Timeline (vertical list of dotted events).
- Right column: Seller · Shipping address · Billing address · Payment.

**Rules.**
- Right column is intentionally flat (no card chrome). Don't wrap metadata sections in boxes.
- Items use `mode="buyer"` (format/type subtitle, no SKU, no tax line).
- Buyer-side: `OrderStatusBadge` is STATIC (no transition menu) — only sellers can change status.

### Wallet › Dashboard

> **Resources**
> - Live: <https://imjustsittingherelookingatprettycolours.help/?page=Wallet>
> - Source: [`src/components/app/wallet-view.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/wallet-view.tsx)

**Uses.** `Button`, `Tabs` (sub-tabs), transaction list pattern.

**Summary.** Wallet home — balance, recent transactions, top-up CTA.

**URL.** `/?page=Wallet`  (also `&wallet-tab=Dashboard`)

**Composition.** AppShell + Wallet sub-tab strip + scroll container.

**Sections.**
- Balance card.
- Top-up + Transfer CTAs.
- Recent transactions list.

**Rules.**
- Wallet is per-USER — same wallet pays for purchases AND receives sales payouts (when the user is also a seller). Don't fork wallet UI per role.

### Wallet › Transfer

> **Resources**
> - Live: <https://imjustsittingherelookingatprettycolours.help/?page=Wallet&wallet-tab=Transfer>
> - Source: [`src/components/app/transfer-view.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/transfer-view.tsx)

**Uses.** `Input`, `Select`, `Button`, `Form`.

**Summary.** Send funds — bank payout, in-app transfer to another
user, etc.

**URL.** `/?page=Wallet&wallet-tab=Transfer`

**Composition.** AppShell + Wallet sub-tab strip + form layout.

**Sections.**
- Recipient picker.
- Amount input.
- Method (bank / in-app).
- Confirm button.

**Rules.**
- Same sub-tab strip as Dashboard / Manage — don't fork the chrome.

### Wallet › Manage

> **Resources**
> - Live: <https://imjustsittingherelookingatprettycolours.help/?page=Wallet&wallet-tab=Manage>
> - Source: [`src/components/app/manage-v2.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/manage-v2.tsx)

**Uses.** `PageSection`, `Alert`, `Button`, `Input`.

**Summary.** Manage payout methods, bank accounts, KYC documents.

**URL.** `/?page=Wallet&wallet-tab=Manage`

**Composition.** AppShell + Wallet sub-tab strip + stacked sections.

**Sections.**
- Linked bank accounts.
- KYC status + documents.
- Payout schedule.

**Rules.**
- Same sub-tab strip as Dashboard / Transfer.
- KYC section uses `Alert` for state-driven messages (pending / approved / rejected).

### Design system docs

> **Resources**
> - Live: <https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem>
> - Source: [`app/routes/design-system.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/app/routes/design-system.tsx)
> ---

**Uses.** `Badge`, `Switch`, every primitive listed under `GROUPS`.

**Summary.** Full-bleed docs route — sidebar nav of every
component grouped by category, content area is a vertical scroll of
all sections. Lives outside AppShell.

**URL.** `/?page=DesignSystem`

**Composition.**
- Own full-bleed layout (its own sidebar; NO product topbar / app sidebar).
- Content area is a vertical scroll of `<Section>`s.
- "Phase 2" toggle hides Shop components from both the nav and the content.

**Sections.**
- Grouped sidebar nav: Foundations · Atoms · Inputs · Indicators · Containers · Cards & lists · Page composition · Overlays · Utility · Player.
- Content: one `<Section>` per component, top-to-bottom.

**Rules.**
- Section anchors: `idFor(label)` lowercases + dash-cases; manual `ID_OVERRIDES` for the few that don't follow the rule (`"Card Rail" → "card-rail"`, etc.).
- Scroll-spy uses an `IntersectionObserver` band of `-80px 0px -60% 0px` and tracks the set of currently-intersecting sections, picking the top-most.
- Phase 2 toggle hides content via `[data-hide-phase-2] [data-phase="2"] { display: none }` and filters the sidebar items list.


## Phase 2 — Shop


### Shop hub

> **Resources**
> - Live: <https://imjustsittingherelookingatprettycolours.help/?page=Shop>
> - Source: [`src/components/app/shop-view.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/shop-view.tsx)

**Uses.** `Tabs`, `TabsList`, `TabsTrigger`, `Badge`.

**Summary.** Seller-side Shop entry — three tabs (Products /
Orders / Settings) with sub-content per tab. Top-level seller home
for everything-not-music.

**URL.** `/?page=Shop&shop-tab={orders|products|settings}`

**Composition.**
- AppShell.
- Tabs strip (URL-backed via `shop-tab` query param).
- Tab content fills the remaining height.

**Sections.**
- Tabs: Orders (default when shop is live), Products, Settings.
- Each tab's content is its own ticket below.
- Orders tab carries a count badge when there's outstanding action (`actionRequired > 0`).

**Rules.**
- `shop-tab` IS URL-backed (unlike Artist profile tabs). Deep links to a tab must work.
- Default tab depends on shop-live state: `orders` when live, `settings` when not.
- Wire the count-badge on the Orders tab via `actionRequired` — don't hand-roll.

### Shop › Products (My Products + Create listing)

> **Resources**
> - Live: <https://imjustsittingherelookingatprettycolours.help/?page=Shop&shop-tab=products>
> - Source: [`src/components/app/shop-my-products.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/shop-my-products.tsx) + [`src/components/app/vinyl-create-listing.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/vinyl-create-listing.tsx)

**Uses.** `ProductCard`, `Chip`, `ChipGroup`, `ChipDismiss`, `Input`, `Combobox`, `Button`, `Toolbar`.

**Summary.** Seller-side product list with toolbar + grid; entry
point to the vinyl create-listing flow.

**URL.** `/?page=Shop&shop-tab=products`

**Composition.**
- Inside Shop hub.
- Toolbar (filters / sort / "Create listing" CTA).
- Scroll container with product grid OR list.

**Sections.**
- Toolbar: filter chips, sort `SingleSelect`, "Create listing" `Button`.
- **Pattern A** grid of `ProductCard`s.
- Create-listing flow: `VinylCreateListing` form modal (covers / title / Release Type chips / Main Artist + Featured Artist chips / price / inventory / variants).

**Rules.**
- Release Type chips use `<Chip activeStyle="outline">` — linked-release variant shows only the active chip.
- Main Artist row: primary artist is non-dismissable (`<span>` styled like a chip); additional collaborators use `<ChipDismiss>`.
- Featured Artists: all chips dismissable, row hidden until first chip added.

### Shop › Orders

> **Resources**
> - Live: <https://imjustsittingherelookingatprettycolours.help/?page=Shop&shop-tab=orders>
> - Source: [`src/components/app/orders-view.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/orders-view.tsx)

**Uses.** `OrderStatusBadge`, `Toolbar`, `Input`, `Table`, `Button`, `BulkActionDialog`.

**Summary.** Seller-side order list — table of every order with
status, customer, total, last action. Click row to drill into Order
detail.

**URL.** `/?page=Shop&shop-tab=orders`

**Composition.**
- Inside Shop hub.
- Toolbar.
- Scroll container with table.

**Sections.**
- Toolbar: order-status filter, search input, bulk-action affordances when rows selected.
- Table: sticky header, sortable columns, `OrderStatusBadge` per row (static — interactive variant only on detail page).

**Rules.**
- Status column uses static `OrderStatusBadge`. The interactive (transition-menu) version is reserved for the order detail header.
- Bulk actions open `BulkActionDialog` — don't inline action buttons in the table.

### Shop › Settings

> **Resources**
> - Live: <https://imjustsittingherelookingatprettycolours.help/?page=Shop&shop-tab=settings>
> - Source: [`src/components/app/shop-settings-view.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/shop-settings-view.tsx)

**Uses.** `PageSection`, `Input`, `Button`, `MultiSelect`, `ShippingZoneEditor`.

**Summary.** Seller-side shop configuration — shipping zones,
payout, store identity, tax.

**URL.** `/?page=Shop&shop-tab=settings`

**Composition.**
- Inside Shop hub.
- Stacked `PageSection`s in a scroll container.

**Sections.**
- Shop identity (name, handle, logo).
- Shipping zones (`ShippingZoneEditor`).
- Payout method (links to Wallet › Manage).
- Tax + compliance.

**Rules.**
- Shipping zones use `ShippingZoneEditor` with country `MultiSelect` (the one with map pins) — don't roll a parallel picker.
- Payout method here LINKS to Wallet › Manage; don't duplicate the form.

### Order detail

> **Resources**
> - Live: <https://imjustsittingherelookingatprettycolours.help/?page=Shop&shop-tab=orders> → click any row
> - Source: [`src/components/app/order-detail-view.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/order-detail-view.tsx)

**Uses.** `PageSection`, `DetailItemsSection`, `OrderStatusBadge`, `Badge`, `Alert`, `Button`, `Input`, `Select`, `Textarea`, `DropdownMenu`, `RefundFlow`.

**Summary.** Seller-side detail for one order — header (status as
an interactive transition menu), items + money breakdown,
fulfillment + tracking, refund flow, timeline, right-column
metadata.

**URL.** Not directly URL-addressable — reached by clicking a row inside Shop › Orders.

**Composition.** AppShell + **Pattern C** (primary content column + sticky-on-desktop metadata column, flat — no cards).

**Sections.**
- Header: order # + interactive `OrderStatusBadge` (forward-transition dropdown) + date · customer · total + inline pre-order / refund alerts.
- Items + money breakdown (`DetailItemsSection mode="seller"` — variant + SKU subtitle, discount, labelled tax).
- Fulfillment: single forward-action `Button` ("Mark as shipped" / "Mark as delivered"), carrier + tracking inputs in a 2-col grid, carrier-tracking link.
- Timeline: vertical list of dotted events with timestamps.
- Refund flow (collapsed by default — "Issue a refund" preview row with `Button`; expands inline via `RefundFlow` to per-line qty + reason + total + cancel / destructive-confirm).
- Right column (sticky on desktop, stacks on mobile): Customer / Shipping address / Billing address / Customer note / Internal note (textarea) / Payment.

**Rules.**
- Right column is intentionally flat. **Do not add card chrome there.**
- Headings: `font-medium` (never `font-semibold` except special cases).
- Optical-center recipes: Button/Tabs use `pb-px`; Input/SelectTrigger use `pt-[6px] pb-[10px]`.
- Status badge here is the INTERACTIVE variant (`onStatusChange` wired).
- Refund flow is contained — don't fork into its own route.

### Refund flow

> **Resources**
> - Live: <https://imjustsittingherelookingatprettycolours.help/?page=Shop&shop-tab=orders> → click row → "Issue a refund"
> - Source: [`src/components/app/refund-flow.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/refund-flow.tsx)

**Uses.** `PageSection`, `Button`, `Select`, `Textarea`, `QtyStepper`.

**Summary.** Inline-expanded section inside Order detail — per-line
qty pickers + reason + computed total + cancel / destructive-confirm
actions. Stays inside the order context; never a separate route.

**URL.** No URL — expanded inline inside Order detail.

**Composition.**
- Inside an Order detail `PageSection`.
- Collapsed by default — preview row with "Issue a refund" `Button`.
- Expanded: per-line qty stepper + reason `Select` + total summary + Cancel / Confirm-refund actions.

**Sections.**
- Preview row (collapsed state).
- Per-line refund pickers (`QtyStepper` + price preview per line).
- Reason `Select` + optional note `Textarea`.
- Total row.
- Action row: Cancel + Refund (`Button variant="destructive"`).

**Rules.**
- Destructive confirm uses the `destructive` variant — don't reuse `primary`.
- Don't allow refund qty to exceed remaining qty per line — wire validation to the items breakdown.
- Cancel snaps back to the collapsed preview row — does NOT navigate away.

### Artist › Products tab (buyer-side shop)

> **Resources**
> - Live: <https://imjustsittingherelookingatprettycolours.help/?page=Artist>
> - Source: products section inside [`src/components/app/artist-profile-view.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/artist-profile-view.tsx)

**Uses.** `ProductCard`, `CartDrawer`, `Button`.

**Summary.** Buyer-facing product surface inside an Artist profile —
the consumer counterpart to the seller's Shop › Products. Grid of
`ProductCard`s; click to add to cart.

**URL.** `/?page=Artist`  (Products tab — local state)

**Composition.** Inside Artist profile, third tab.

**Sections.**
- **Pattern A** grid of `ProductCard`s.

**Rules.**
- `ProductCard` is the only card variant used here — don't mix in `AlbumCard`s.
- "Add to cart" pill opens the global `CartDrawer` if it isn't already open; otherwise it updates count silently.
- Phase-2 gated: when shop features are disabled the entire tab is hidden by the sidebar `PHASE_2` filter.

