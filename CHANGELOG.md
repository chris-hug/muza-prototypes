# Changelog

Session-based changelog for the Muza prototype. Newest entries on top.
Each entry covers a single working session — file paths are relative to
the repo root, semantic groupings reflect the major themes.

---

## 2026-05 — Dedicated `/design-system` route + component-naming pass

### New surface

**`/design-system`** route (`app/routes/design-system.tsx`)
- Pulled the kitchen sink out of `?page=Explore` into its own route
  with a sticky left sidebar grouped by category (Foundations /
  Atoms / Inputs / Indicators / Containers / Cards & lists / Page
  composition / Overlays / Utility / Player).
- Back-to-prototype link at the top; scroll-spy keeps the active
  section highlighted in the nav.
- **Phase 2 toggle** in the sidebar hides Shop / Products
  components (Product Card, Checkout Card, Items, Order lifecycle
  status badges) so day-one work isn't visually crowded.
- Prototype's Explore tab now shows a placeholder pointing at the
  new route.
- Topbar carries a "Design system" text link in the right cluster
  so it's reachable from every prototype page.

### Component renames (naming clarity)

To eliminate semantic mismatches between docs labels and component
exports:

- `SortButton` → `Picker` → `SingleSelect` (file `single-select.tsx`)
- `FilterMenu` → `MultiSelect` (file `multi-select.tsx`)
- `HomeRow` → `CardRail` (file `card-rail.tsx`)
- `ProductCardSmall` → `ProductCard` (file `product-card.tsx`)

The Picker → SingleSelect / FilterMenu → MultiSelect pair now
names by *what they are* (single-select dropdown button vs
multi-select dropdown button) rather than the *use case* (sort /
filter). MultiSelect renders left-side checkboxes (multi-select
convention); SingleSelect renders right-side ✓ (single-select).

### Design-system primitives

**Badge** — added `primary` and `success` variants. `success` uses
the saturated mint `#00D5A3` for "New" labels; reads as a strong
attention signal without competing with brand-primary blue.

**Section** (kitchen sink) — added `status` (`new` / `updated` /
`concept`), `phase` (`2`), and `usage` props. Renders status pills
inline with the title and a "Used in: a · b · c" line under it so
a reader can jump straight from the docs into the living context.

**FormMessage** styling aligned to `Input`'s `data-slot="input-hint"`
(text-2xsmall + leading-snug) so validation errors read identical
whether the field is wired through react-hook-form or used
standalone.

### Docs additions

- **Checkout Card** showcase (the order/purchase row card from the
  buyer-side Purchases hub). `CheckoutCard` exported from
  `purchases-view.tsx`.
- **Country combobox** demo now uses leading MapPin icons per item,
  mirroring the Shop › Settings › Shipping zones region selector.
- "Used in" + status / Phase 2 markers applied to every section
  that's new or updated in this push.

---

## 2026-05 — Artist profile, Discography, design-system unification

### New flows

**Artist profile page** (`src/components/app/artist-profile-view.tsx`)
- Full-bleed hero (real Sun Ra photo backdrop, dark token flip),
  back-arrow, name + bio with read-more, action cluster
  (Play, Artist radio, Share, More).
- Full-width muted tab band (Overview / Discography / Shop) with the
  Figma underline treatment: three equal triggers, per-trigger
  `border-b` doubling as the baseline + active indicator.
- Hero content shares the same `max-w-[1528px] mx-auto px-10`
  container as the rest of the page so the title aligns to the
  section headers below.
- Tab-conditional content swap: Overview (Top Songs + horizontal
  rails), Discography (filter + sort + grid/list view), Shop
  (product grid).
- Wired into Library/Artists — clicking Sun Ra opens the profile.

**Discography view** (inside `artist-profile-view.tsx`)
- Toolbar: multi-select `FilterMenu` ("All releases" with per-option
  count badges), `SortButton` (grid view only — hidden in list view
  because column headers carry sort), grid/list `ToggleGroup`.
- Grid view: `AlbumCard` auto-fill grid with the same template as
  Library/Albums; each card shows year in the subtitle line.
- List view: borderless `<table>` with sticky `<th>` headers,
  per-cell rounded hover, cover-as-play button (overlay + playing
  wave), sortable Title/Recorded/Tracks columns, right-aligned
  `ContentTypeBadge` Type column, kebab column with the same
  `AlbumCardMenuItems` the cover card uses.
- 32 real Sun Ra releases (albums, singles, EPs, remixes, secondary
  role) with real iTunes Search API artwork. `kind` is the filter
  bucket; `type` is the actual format (single/album/ep) — independent
  so a remix can still be a Single.

### New / refactored components

**`src/components/ui/sort-button.tsx`** (new)
- Secondary outline pill that opens a `DropdownMenu` of sort options
  via `render={<Button>}`. Kitchen-sink section under Menu.

**`src/components/ui/song-list-item.tsx`** (extended)
- Exported `PlayingWave` (3D-carousel animation) for reuse.
- New `year` prop renders after album with a `·` separator.
- New `menuItems` slot turns the kebab into a real `DropdownMenu`
  trigger instead of a bare `onMore` callback.

**`src/components/ui/album-card.tsx`** (extended)
- New `year` prop renders on the subtitle line as `artist · year`.

**`src/components/ui/product-card-small.tsx`** (extended)
- Title is now a button with `hover:underline` + `min-h-10` so all
  cards in a row sit flush regardless of whether the title wraps.

**`src/components/ui/cover-card-menu.tsx`** (refactored)
- Extracted `AlbumCardMenuItems` (items-only sub-component) so the
  same menu can sit behind different triggers (cover overlay, table
  row kebab, song row kebab…).

**`src/components/ui/chip.tsx`** (extended)
- New `size: sm | md` variant (h-8 / h-10) so chips can sit in a
  toolbar next to a default Button.
- New `variant: ghost` for header filter bars (transparent at rest,
  `bg-muted` on hover).
- New `count` prop renders a pill `Badge` inside the chip with
  `bg-accent` default + `bg-background` when the chip is selected.

**`src/components/ui/badge.tsx`** (extended)
- New `shape: square | pill` variant. All badges (Badge,
  ContentTypeBadge, StatusBadge) now share the same h-[26px] height.

**`src/components/app/home-row.tsx`** (extended)
- `showAllLabel` prop (default "Show all") + only renders when
  non-empty. Header cluster reordered to `[label] [outline ◀ ▶]`.

### Design-system unification

- All main page containers reduced to `max-w-[1528px] mx-auto px-10`
  (down from `px-16`) across Home, Explore, Library/*, Studio,
  Shop/*, Orders, Manage, Wallet, Transfer, Report, Purchase /
  Order detail, Vinyl listing flow, and the Artist profile.
- `Card` component + Cards kitchen-sink section deleted entirely
  (never used outside the demo).

### Kitchen sink additions

`app/routes/home.tsx`
- **Sort Button** showcase (auto-label + fixed-label variants).
- **Song List Item** showcase placed right after Playlist Card, with
  the new `menuItems` slot wired to `AlbumCardMenuItems`.
- **Product Card** showcase using the same responsive grid pattern
  as PlaylistCard (`repeat(N, minmax(143px, 220px))`).
- **List Table** showcase mirroring Discography list view:
  borderless rows, hover-bg with rounded corners, sortable headers,
  sticky thead, cover-as-play, kebab → `AlbumCardMenuItems`.
- **Chips** section gained a "ghost + count badge" demo.

### Bug fixes / polish

- `position: sticky` now works on the Discography table head — root
  `flex-1 overflow-auto` removed from `artist-profile-view.tsx`
  (outer layout owns the page scroll; nested scroll containers
  break sticky), and `@container` moved off the shared content
  wrapper onto each tab that actually needs container queries
  (`container-type: inline-size` also breaks sticky descendants).
- Animation polish on `PlayingWave` (final bezier
  `cubic-bezier(0.2, 0.5, 0.5, 0.9)`, 8s cycle).

---

## 2026-05 — Buyer + seller commerce build-out

### New flows

**Buyer Purchases hub**
- `src/components/app/purchases-view.tsx` — order history grouped by
  checkout (one checkout = one payment moment, contains N per-shop
  fulfillments). Filter pills via `ToggleGroup`, search, sort,
  clear-filters affordance in the empty state. Boots into a first-time-
  buyer empty state for demo purposes; flip the local `showList` flag
  to false before ship.
- `src/components/app/purchase-detail-view.tsx` — per-fulfillment
  detail page with status badge, derived line prices, shipment +
  estimated-delivery block, status-derived timeline, inline refund-
  request flow, sticky right-column metadata (Seller, Shipping
  address, Payment). Refund requests fire a toast AND push an event
  into the timeline.

**Seller Shop hub**
- `src/components/app/shop-view.tsx` — Studio → Shop container with
  internal `Products / Orders / Settings` tabs. Auto-routes first-time
  visitors (shop not live yet) to the Settings tab; returning sellers
  with live shops default-land on Orders. Sub-tab persisted in URL as
  `?page=Shop&shop-tab=settings` for deep-linking.
- `src/components/app/shop-settings-view.tsx` — single-scroll settings
  page (Shop profile, Shipping, Communication, Notifications, Legal).
  First-visit onboarding banner with 4-item checklist that
  scroll-to-section. Once required items pass, banner collapses to a
  "Shop is live" status row.
- `src/components/app/order-detail-view.tsx` — flat-section order
  detail (no box chrome except for Items). Status badge is the
  transition trigger; the kebab/⋯ actions column on rows is gone.
- `src/components/app/refund-flow.tsx` — shared collapsed→expanded
  refund flow. `mode: "request" | "issue"` toggles buyer-side
  (no total preview, reason required) vs seller-side (live total +
  shipping toggle, reason optional).
- `src/components/app/items-section.tsx` — shared Items card
  (product list + money breakdown). Same component on both detail
  pages; consumer maps their data shape onto `ItemLine[]` +
  `ItemsBreakdown`.
- `src/components/app/receipt-preview.tsx` — Muza-issued receipt block
  for the order-confirmation email. Marketplace-facilitator model:
  Muza is merchant of record, receipt in Muza's legal name, sequential
  `M-RCT-YYYY-NNNNN` number per order. Visible inside the Compose &
  send dialog so the seller previews exactly what the buyer gets.
- `src/components/app/bulk-action-dialog.tsx` — generic eligibility-
  aware bulk action dialog. Used by Orders bulk bar (Mark shipped /
  delivered / Cancel / Retry capture).
- `src/components/app/shipping-zone-editor.tsx` — reusable zone editor
  used in shop Settings + per-listing override.
- `src/components/app/cart-drawer.tsx` — checkout drawer with cart,
  shipping address dialog (structured fields: country / postal /
  city / street / number / apt), promo codes, currency picker,
  wallet coverage.

**Library**
- `src/components/app/library-albums-view.tsx` — saved albums grid
- `src/components/app/library-artists-view.tsx` — saved artists grid
- `src/components/app/library-playlists-view.tsx` — saved + own playlists
  with `<PlaylistCreateCard>` as the first tile; mix of owned and
  others' playlists per Figma 8956:97666
- iTunes-resolved real album covers via `scripts/fetch-itunes-artwork.mjs`

### Cross-cutting infrastructure

- `src/lib/cart.tsx` — cart state, currency, wallet shortfall,
  destination-based tax, structured `ShippingAddress` type.
- `src/lib/countries.ts` — full ISO 3166-1 alpha-2 country list +
  `countryName(code)` helper. Used by tax lookup + Combobox typeahead.
- `src/lib/order-emails.ts` — per-order email templates + log,
  branched copy for `order_cancelled` from `payment_failed` source.
- `src/lib/platform.ts` — `MUZA_LEGAL` constants (Muza Arts and Music
  INC., a New York State 501(c)(3) non-profit corporation), receipt
  number derivation.
- `src/lib/shop-settings.tsx` — shared shop-session state context
  (`ShopSettingsProvider`). Holds: profile, zones, templates, notifs,
  legal acknowledgment, editing state, **live order statuses** +
  `actionRequiredCount`. Both Shop hub and Products tab read from
  here so the Orders tab badge decrements live when an order flips out
  of `new`.
- `src/lib/use-media-query.ts` — `useIsMobile()` for responsive
  detail-page layouts.

### Information architecture changes

- **Studio sidebar trimmed** from `Pages / Music / Analytics / · /
  Products / Orders / Wallet` to `Pages / Music / Analytics / Shop`.
  Commerce surfaces now live inside the Shop hub's internal tabs.
- **Wallet moved** out of Studio into the avatar dropdown — it's
  per-user (buyer top-ups + seller payouts both flow through it),
  not per-shop.
- **Library / Albums and Library / Artists** now render real views
  using `<AlbumCard>` / `<ArtistCard>`. Songs + Playlists still
  placeholder.
- **Create-listing flow** takes over the chrome (tabs hidden) when
  editing a product — prevents tab-switching mid-form. Back arrow in
  the form's top-left exits to the previous tab.

### Policy decisions encoded in code

- **Marketplace-facilitator model**: Muza is the merchant of record
  for sales through Muza. Receipts are issued in Muza's legal name
  with Muza's sequential receipt number; sellers handle their own
  income tax via downloadable sales reports (Phase 2). Documented in
  `receipt-preview.tsx`. Sellers acknowledge this once in Shop →
  Settings → Legal (checkbox + audit timestamp).
- **Publishing gate**: products only flip to `public` once the shop is
  "live" (profile + legal ack + tax residency + ≥1 shipping zone).
  Enforced at three layers: `setProductStatus` in `shop-my-products.tsx`,
  the `PublishButton` in `vinyl-create-listing.tsx`, and a permanent
  "Shop not live yet" alert above the Products toolbar.
- **Status badge as transition affordance**: replaced the ⋯ kebab on
  order rows. Cancel removed from routine forward transitions in
  `ALLOWED_TRANSITIONS` — lives only in the per-order detail page,
  the bulk actions panel, and the failed-payment "needs attention"
  row. Failed-payment Cancel eligibility extended to include
  `payment_failed` orders (after retries are exhausted).
- **Receipt vs invoice**: the system emits a **receipt** (from Muza),
  not a tax-compliant **invoice** (from the seller). Sellers who
  issue their own invoices do so externally; Muza neither blocks nor
  generates them. Phase-2 hook: per-order "Attach your own invoice"
  affordance.

### Shared building blocks

- `src/components/ui/album-card.tsx`, `src/components/ui/artist-card.tsx`,
  `src/components/ui/playlist-card.tsx`,
  `src/components/ui/playlist-create-card.tsx` — Library / Explore /
  search-result tiles. Match the Figma "Record Cover" component
  (file `L9yw4Yaec9YtAXGxP8q4fu`, node `19272:1528`) including hover
  overlay (Add/Edit + More + Play). `owned` variant swaps Add for
  Edit (✏️).
- `src/components/ui/cover-action-button.tsx` — small round overlay
  button used by AlbumCard + PlaylistCard hover state.
- `src/components/app/section.tsx` — page-section primitive (heading +
  content, optional `boxed`). Shared by buyer + seller detail pages.
- `src/components/app/country-picker` — REMOVED (replaced by inline
  `<Combobox>` with `items` + `filter`; same primitive, no domain
  wrapper).

### Design system additions

Net-new primitives:
- `src/components/ui/accordion.tsx`
- `src/components/ui/collapsible.tsx`
- `src/components/ui/meter.tsx`
- `src/components/ui/navigation-menu.tsx`
- `src/components/ui/qty-stepper.tsx`
- `src/components/ui/scroll-area.tsx`
- `src/components/ui/sheet.tsx` (refactored from Dialog-based to
  base-ui Drawer primitive)
- `src/components/ui/toggle.tsx`, `toggle-group.tsx`
- `src/components/ui/toolbar.tsx`

Removed (replaced by `toast.tsx`):
- `src/components/ui/sonner.tsx`
- `src/components/ui/toaster.tsx`

Modified: `alert`, `button`, `chip`, `combobox`, `context-menu`,
`dialog`, `input`, `input-otp`, `progress`, `select`, `switch`,
`tabs`, `textarea`, `player-bar`, `player-bar-b`.

Key fixes:
- `Alert` — `AlertAction` now vertically centers on the alert body
  (was `top-2 right-2`, floated above multi-line descriptions).
- `Combobox` — clarified that filtering only happens with `items` +
  function-child pattern; JSX-children form is non-filtering.
- `Select` — `SelectItem`'s inner `ItemText` now has `items-center`
  so leading icons optically center with the label.

### Tooling

- `scripts/fetch-itunes-artwork.mjs` — one-shot resolver that reads
  `SAVED_ALBUMS` from the source file, queries iTunes Search API,
  upgrades thumbnails to 600×600, prints an updated TypeScript array
  literal. Misses keep their picsum placeholder. Re-runnable.

### Kitchen sink

New TOC entries with actual component imports (not hand-rolled
copies):
- Page Section
- Items
- Album Card
- Artist Card
- Playlist Card

### Known follow-ups

- Hover state on AlbumCard buttons needs real handlers wired
- LibraryPlaylistsView (currently placeholder; PlaylistCard ready)
- Real artist photos via Wikipedia thumbnail API (script TBD)
- Pre-existing TypeScript errors in `studio-music.tsx`,
  `shop-my-products.tsx`, `orders-view.tsx` around `asChild` prop
  passing — unrelated to this session, queued for a primitive-level
  fix.

---
