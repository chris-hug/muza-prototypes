---
title: Search
source: src/components/app/search-results-view.tsx
related: [media-list-item, song-list-item, song-rail, card-rail, mobile-header, tabs, togglegroup]
usage:
  - Topbar / mobile header search → Explore results | /?page=Explore&q=coltrane
---

Search is the Explore page. Focusing the field opens `SearchPanel` — recent
searches, then plain-text suggestions as you type; Enter routes to
`?page=Explore&q=…&scope=…`, and `SearchResultsView` renders the same
URL-backed results on desktop and phone: a Top-result hero and one shelf per
content type on the All tab, a flat list of [Media List Item](media-list-item.md)
rows on a specific tab.

## Two components

```tsx
// Under the focused field — the host positions it (absolute under the
// desktop Topbar field, inline under the mobile search bar).
<SearchPanel query={q} onPick={run} />

// The Explore page body once `?q=` is set.
<SearchResultsView query={query} />
```

`useSearchNav()` (`use-search-nav.ts`) is the one place a typed query becomes
navigation: `submit(q)` writes `?page=Explore&q=…` and pushes the recent;
`scope` / `setScope` read and write `?scope=library` (the default, catalog,
drops the param). Because both live in the URL, every search field, the
results body and the mobile header agree, and a result is shareable.

## The panel — `SearchPanel`

`search-panel.tsx`. A `rounded-2xl border border-border bg-popover p-2
shadow-lg` surface. Self-sourcing: it reads `useRecentSearches()` and
`suggest(query)` from `search-catalog` and calls `onPick(query)` when a row
is chosen.

| Query | Renders |
|---|---|
| empty, recents exist | "Your recent searches" (`text-xsmall font-medium text-foreground`), then clock rows, each with a remove ✕ (`removeRecentSearch`) |
| typing, suggestions exist | search-icon rows, up to 8 — recents that contain the query first, then catalog titles |
| empty and no recents · typing and no suggestions | **`null`** — the host collapses the panel |

Rows are `rounded-lg px-3 py-2.5 text-base text-foreground hover:bg-muted
focus-visible:bg-muted`. The surface calls `preventDefault()` on `mousedown`
so clicking a row does not blur the input first — which would close the panel
before the click landed. Recents are localStorage-backed.

## The results — `SearchResultsView`

| Band | Desktop (from `sm`, 640) | Phone (below 640) |
|---|---|---|
| Heading | `Search for: <q>` — `text-2xlarge font-medium tracking-tight`, the prefix `text-muted-foreground font-normal` | none — the sticky search field shows the query |
| Scope | `ToggleGroup size="sm"`: Muza Catalog · My Library, right-aligned | none in the body |
| Category | `Tabs variant="line"`, `autoCenter={false}`, `border-b border-border` | `MobilePillTabs` — the scrollable pills the Library uses |
| Body | the All composition, or a flat `ul gap-1` of rows | the same |

The page shell is the standard `max-w-[1480px] min-[1920px]:max-w-[1716px]
mx-auto px-page`, `pt-3 sm:pt-6 pb-24`, `gap-3 sm:gap-5`.

**Category tabs list only types that have results** (All is always present).
An empty type — Labels with no match — is dropped so nobody clicks into
nothing; if the active tab empties as the query narrows, it falls back to All.
Tabs carry **no counts**: they churn per keystroke and clutter the strip.
Order: All · Songs · Artists · Albums · Playlists · Labels.

**Scope.** `My Library` keeps only results whose `libraryType` + `libraryId`
are in `useUserLibrary()`; labels have neither, so they never appear under
My Library.

**Empty:** `No {results | songs | …} found{ in your library} for “{q}”.` in
`text-small text-muted-foreground py-10`.

### A specific tab — a flat list

Every row is a `MediaListItem` (`SearchRow`): songs play, or open their album
when they have one; containers navigate; the ⋯ reuses `AlbumCardMenuItems` /
`PlaylistCardMenuItems`, which flip Save ⇄ Remove by library state, and
songs / artists get a small inline menu from the same pieces. A `label` row
renders like an artist — round avatar, the album count as `subtitle` — with
**no badge**, no `onOpen` and no menu: there is no label page yet.

### The All tab — shelves, not a list

The All tab is a Top-result hero followed by **one shelf per content type**,
so search reads as part of the same system as the Home rails. The rules,
enforced in `AllResults` / `GroupSection`:

- **Top result** — the single best-ranked match as an oversized hero
  (`SearchTopResult`: big cover, large title, content-type badge, Play for
  playable kinds) under an `h2 text-large font-medium` "Top result".
- **It is removed from its own type section.** Grouping starts from
  `visible.slice(1)`, so a type's shelf appears only when there are *other*
  hits of that type — more artists with a similar name — and a lone match
  never gets a one-item rail repeating the hero.
- **Section order is relevance-driven**: a type sits where its best-ranked
  hit falls; the Top result's type still leads when it has siblings.
- **Songs** — the shared [`SongRail`](song-rail.md) (3 rows per column,
  `compact` rows) when there are **≥ 6** songs — 6 is the first count that
  fills two full 3-row columns; fewer would leave a ragged column — and a
  plain vertical list of full rows at **≤ 5**.
- **Artists / Albums / Playlists** — a [`CardRail`](card-rail.md) of the
  matching cards at **≥ 2**, with `showAllOnlyWhenScrollable`; a **single
  inline card** at exactly 1, in a `w-[clamp(143px,42vw,220px)]` box under
  the plain section header — no rail chrome for one card.
- **Labels** — always a simple list.
- **Empty types are omitted.**
- **"Show all"** renders only when the shelf actually overflows → opens that
  type's tab. A shelf that already shows every hit gets none — it would reveal
  nothing. Card rails use `CardRail`'s `showAllOnlyWhenScrollable`; `SongRail`
  gates on its own overflow check.
- **Sparse query (≤ 2 results in total)** → no shelves: the hero and a short
  list.

`ListSection` mirrors the rail header — separator, `text-base font-medium`
title, optional ghost "Show all" — for the non-rail shelves (a ≤ 5 song list,
a single card, labels), so every shelf reads the same.

## Sizing

**Window** for the presentation swap — but see the open questions: the
heading, scope toggle and the line-tabs ⇄ pill-tabs swap are gated on
Tailwind `sm:` (640), not on the 768 presentation gate. Below the 608 chrome
gate the mobile header (`MobileAppHeader › ExploreHeader`) owns the field and
renders the **same** scope `ToggleGroup` full-width under it once a query is
active and the field is not focused (`mobile-app-header.tsx:306–318`), which
is why the body drops its own.

**Column** for the shelves. `AllResults` wraps the shelves in an
`@container`, so `CardRail`'s 560 swipe ⇄ grid step and `SongRail`'s 692 / 1164
column steps resolve against the search column exactly as they do on Home and
the artist page. Without that wrapper a rail never steps — see
[Card Rail](card-rail.md#it-queries-the-pages-container-not-its-own).

## Where it is used

- `Topbar` (desktop) and `MobileAppHeader › ExploreHeader` (phone) own the
  field and render `SearchPanel` on focus.
- The Explore page body renders `SearchResultsView` once `?q=` is set.
- Add music's typed search reuses the same pattern (pills + `MediaListItem`
  rows) but not these components.

## Open questions

- search-results-view.tsx:103, 122, 129 gate the heading, scope toggle and
  tab style on `sm:` (640) · [`responsive.md`](responsive.md) reserves `sm:`
  for in-page reflow and names 768 (`md:` / `useIsMobile()`) the one
  presentation gate; the chrome swaps at 608. Between 608 and 639 a window
  has the desktop `Topbar` (no scope switcher in the mobile header, which is
  gone) and a results body that hides its own scope toggle — no way to
  switch scope at all in that band.
- search-results-view.tsx:19–20 (header) says every specific-tab row "carries
  its own ContentTypeBadge" · `MediaListItem` renders no badge for any type
  (media-list-item.md), and DESIGN_SYSTEM's badge table lists search rows
  under **no badge**. The former DESIGN_SYSTEM "Search surface" section and
  the DS page also said a label row gets a "Label" badge; the source draws the
  round avatar and the album count only. Documented as the source.
- mobile-app-header.tsx:280–284 (comment) says "the scope + category
  controls live in the body, not here — the header is purely the search entry
  point" · the same component renders the scope `ToggleGroup` in the header
  (:306–318), and the body hides its own below 640. The comment is stale; the
  header is where a phone switches scope.
