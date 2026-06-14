# ClickUp tickets — Mobile, Discovery & Buying push (DRAFT for review)

Everything we touched across both undelivered cycles, as developer-ready
tickets in the **same format as your existing ones**
(ref [Toolbar (new)](https://app.clickup.com/t/86c9vgfhx)).
**Nothing is in ClickUp yet** — this markdown is for your review.

## Creation settings (to apply when you say go)
- **List:** `Component wire-up 03 — buying & mobile` *(new list to create, alongside "…02 - core ui"; confirm the exact name)* — space `90155818066`, folder `hidden`.
- **Status:** `not started` · **Priority:** `low` *(matching the example)*.
- **Assignee:** dev (e.g. Nevo) — confirm.
- **Custom fields:** Reviewer = Chris (others left empty: Review Date, Revision Notes, coding-status).
- **Name suffix:** `(new)` / `(updated)`.
- Components with no DS section of their own (Cover Card Menu, Topbar, Sidebar, Library Heart, Share Button) carry only the live-page link in **Used in** — no DS anchor.

## Conventions
- One ticket per component/dialog. Thin player parts are collapsed into a
  single **Player sub-components** ticket (your call). DS tokens and the
  responsiveness/container model are each one summary ticket; `src/lib/`
  logic is grouped into system tickets.
- Page views are **not** ticketed individually — covered by the
  Responsiveness, Save-to-library, Player, and Search tickets (which list
  the pages as examples).
- Per-ticket shape mirrors the example: **Resources** (DS + Source) ·
  **Used in** (live links) · **Summary** · **Use** · **Changed** (what's
  different this cycle) · **Rules**.

**Total: 45 tickets** (6 base · 9 cards/media · 4 player · 6 chrome ·
5 actions/status · 1 search · 7 dialogs · 2 summary · 5 system).

---

## 1 · Base components

### Button (updated)
> **Resources**
> DS: [Button](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#button)
> Source: [`src/components/ui/button.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/button.tsx)

**Used in:** every action surface (cards, dialogs, headers, bulk bar).
**Summary.** Pill button — base for most actions and several composite controls.
**Use.**
```tsx
import { Button } from "@/components/ui/button"
<Button variant="outline" size="icon-sm" onClick={fn}>…</Button>
```
**Changed.** New `icon-sm` size; optical-center recipe (`pb-px`); label sizes on semantic type aliases (no primitive `text-sm`).
**Rules.** Always `rounded-full`, label `font-medium`; sizes sm=32 / default=36 / lg=40; never bold.

### Badge (updated)
> **Resources**
> DS: [Badge](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#badge)
> Source: [`src/components/ui/badge.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/badge.tsx)

**Used in:** content-type labels on search results, card pricing/Owned, status pills.
**Summary.** Small label chip; base for Status / Order Status / Purchased / content-type variants.
**Use.**
```tsx
import { Badge, ContentTypeBadge } from "@/components/ui/badge"
<Badge variant="secondary">Album</Badge>
<ContentTypeBadge type="artist" />   {/* album | artist | playlist | song */}
```
**Changed.** Count-badge digit optical centering fixed; `ContentTypeBadge` added for search; sizes on semantic aliases (`text-2xsmall`).
**Rules.** `rounded-sm`, `font-normal`, never `rounded-full`/uppercase; always carries `border` (`border-transparent` to suppress); use `variant="secondary"` — never hand-roll colors.

### Dropdown Menu (updated)
> **Resources**
> DS: [Menu](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#menu)
> Source: [`src/components/ui/dropdown-menu.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/dropdown-menu.tsx)

**Used in:** every "⋯" / context menu (cards, detail pages).
**Summary.** Base popover menu behind every "⋯" / context menu.
**Use.**
```tsx
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
<DropdownMenu>
  <DropdownMenuTrigger>⋯</DropdownMenuTrigger>
  <DropdownMenuContent><DropdownMenuItem onClick={fn}>Share</DropdownMenuItem></DropdownMenuContent>
</DropdownMenu>
```
**Changed.** Item rhythm + icon slot aligned to spec; reused by the new Detail More Button and the card menus.
**Rules.** `bg-popover`, `rounded-xl`, item hover `bg-secondary`.

### Tabs (updated)
> **Resources**
> DS: [Tabs](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#tabs)
> Source: [`src/components/ui/tabs.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/tabs.tsx)

**Used in:** Library / detail / settings section switches.
**Summary.** Segmented tab control.
**Use.**
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
<Tabs defaultValue="overview">
  <TabsList><TabsTrigger value="overview">Overview</TabsTrigger></TabsList>
  <TabsContent value="overview">…</TabsContent>
</Tabs>
```
**Changed.** Optical-center recipe (`pb-px`); type sizes on semantic aliases; responsive behavior on mobile surfaces.

### Table (updated)
> **Resources**
> DS: [Table](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#table)
> Source: [`src/components/ui/table.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/table.tsx)

**Used in:** [Studio music](https://muza.imjustsittingherelookingatprettycolours.help/?page=Music), library list tables.
**Summary.** Base data table (+ List Table pattern for media rows).
**Use.**
```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
<Table><TableHeader><TableRow><TableHead>Title</TableHead></TableRow></TableHeader>
  <TableBody><TableRow><TableCell>…</TableCell></TableRow></TableBody></Table>
```
**Changed.** Cell + header text `text-small` → `text-xsmall` (17px); removed per-cell `text-small` overrides that defeated the base change.
**Rules.** All cell text `text-xsmall`; thumbnails `rounded-xs`.

### Filter Button (updated)
> **Resources**
> DS: [MultiSelect](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#multi-select)
> Source: [`src/components/ui/filter-button.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/filter-button.tsx)

**Used in:** [Studio music filters](https://muza.imjustsittingherelookingatprettycolours.help/?page=Music) (Status, Type, Artist, Label, Monetisation).
**Summary.** Shared filter trigger (label + chevron + count badge).
**Use.**
```tsx
import { filterTriggerCls, FilterChevron, FilterCount } from "@/components/ui/filter-button"
<button className={filterTriggerCls(active)}>Status <FilterCount count={n} /><FilterChevron /></button>
```
**Changed.** Shares the form-control base tokens; count-badge centering; active/inactive states.
**Rules.** `h-10`, `rounded-full`, `pt-[6px] pb-[10px]`; active = `border-foreground/40 bg-muted`.

---

## 2 · Cards & media tiles

### Album Card (updated)
> **Resources**
> DS: [Album Card](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#album-card)
> Source: [`src/components/ui/album-card.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/album-card.tsx)

**Used in:** [Home rails](https://muza.imjustsittingherelookingatprettycolours.help/?page=Home), [Library/Albums](https://muza.imjustsittingherelookingatprettycolours.help/?page=Albums), Artist · Top Albums, Album detail rail, search results.
**Summary.** Square cover + title + artist/year + monetisation row; a **nav surface** — cover/title open the detail page, Play/Heart are their own buttons.
**Use.**
```tsx
import { AlbumCard } from "@/components/ui/album-card"
<AlbumCard cover={url} title="A Love Supreme" artist="John Coltrane" year={1965}
  streamPrice="$2.99" downloadPrice="$4.99" purchased
  onTitleClick={openAlbum} onArtistClick={openArtist} onMore={openSheet} />
```
**Changed.** Title+meta unified to `text-xsmall` (17px); meta rows `font-light` + `tracking-[0.02em]` (title/meta contrast); cover → `CoverArt` (branded fallback); title↔meta gap opened to 4px; A/B text-variant prop removed (variant B permanent); monetisation row on the meta rhythm.
**Rules.** Title 2-line clamp; never bold; meta `text-muted-foreground`.

### Playlist Card (updated)
> **Resources**
> DS: [Playlist Card](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#playlist-card)
> Source: [`src/components/ui/playlist-card.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/playlist-card.tsx)

**Used in:** [Home](https://muza.imjustsittingherelookingatprettycolours.help/?page=Home), [Library/Playlists](https://muza.imjustsittingherelookingatprettycolours.help/?page=Playlists), Artist · Curated Playlists, Album detail rail.
**Summary.** 2×2 cover mosaic + title + owner/song-count.
**Use.**
```tsx
import { PlaylistCard } from "@/components/ui/playlist-card"
<PlaylistCard title="Blue Note Essentials" covers={[c1,c2,c3,c4]} songCount={24}
  owner="Sarah K" onTitleClick={openPlaylist} onPlay={openPlaylist} />
```
**Changed.** Same text pass as Album Card (17px, light meta, +tracking, 4px title↔meta gap); A/B variant prop removed.

### Artist Card (updated)
> **Resources**
> DS: [Artist Card](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#artist-card)
> Source: [`src/components/ui/artist-card.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/artist-card.tsx)

**Used in:** [Home](https://muza.imjustsittingherelookingatprettycolours.help/?page=Home), [Library/Artists](https://muza.imjustsittingherelookingatprettycolours.help/?page=Artists), Artist · Similar Artists, search results.
**Summary.** Circular portrait + name; tap → artist profile (no hover cluster, by design).
**Use.**
```tsx
import { ArtistCard } from "@/components/ui/artist-card"
<ArtistCard name="Sun Ra" image={portrait /* optional → branded placeholder if omitted */} onClick={openArtist} />
```
**Changed.** Name → `text-xsmall`; real portraits from the artist image DB; **branded placeholder** (muted circle + solid-secondary muza mark) when no portrait / on error; circle inset via padding (no oval thumbs).
**Rules.** Placeholder mark solid `text-secondary` (no alpha).

### Cover Art (new)
> **Resources**
> DS: [branded fallbacks (Album Card)](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#album-card)
> Source: [`src/components/ui/cover-art.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/cover-art.tsx)

**Used in:** Album Card, Cover Play Button, anywhere release artwork shows.
**Summary.** Square `<img>` with a **branded fallback** for missing/broken artwork (muted square + soft solid-secondary muza mark).
**Use.**
```tsx
import { CoverArt } from "@/components/ui/cover-art"
<CoverArt src={cover /* optional */} alt={title} className="rounded-xs" />
```
**Changed.** New shared component; `onError` flips to fallback so 404s are caught too.
**Rules.** `className` applies to both img and fallback box; fill `bg-muted`, mark `text-secondary`.

### Cover Play Button (updated)
> **Resources**
> DS: [Cover Play Button](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#cover-play-button)
> Source: [`src/components/ui/cover-play-button.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/cover-play-button.tsx)

**Used in:** Song List Item, Media List Item, every track/release row ([album detail](https://muza.imjustsittingherelookingatprettycolours.help/?page=Album&album=a-love-supreme)).
**Summary.** Cover-as-play-button — one stable DOM, four CSS-driven states.
**Use.**
```tsx
import { CoverPlayButton } from "@/components/ui/cover-play-button"
<CoverPlayButton src={cover} title="…" playing={isPlaying} onToggle={toggle} hoverGroup="row" />
```
**Changed.** Cover → `CoverArt` (branded fallback); hover-group wiring (`self`/`row`/`song`); 3D PlayingWave kept outside the clip to stay crisp.

### Cover Card Menu (updated)
> **Resources**
> Source: [`src/components/ui/cover-card-menu.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/cover-card-menu.tsx)

**Used in:** hover any card on [Home](https://muza.imjustsittingherelookingatprettycolours.help/?page=Home) (no DS section of its own).
**Summary.** The "⋯" menu shared by Album/Playlist cards (Share / Save / Add to playlist / Go to artist|album / Report / Info).
**Use.**
```tsx
import { AlbumCardMenu } from "@/components/ui/cover-card-menu"
// rendered inside the card's hover cluster; the card passes its on* handlers through
```
**Changed.** Context-aware row hiding (`hideGoToArtist|Album`, `inLibrary` → Remove); unified Share + copy-link; owned → Edit/Report.

### Media List Item (new)
> **Resources**
> DS: [Media List Item](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#media-list-item)
> Source: [`src/components/ui/media-list-item.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/media-list-item.tsx)

**Used in:** [Library list view](https://muza.imjustsittingherelookingatprettycolours.help/?page=Albums), detail-page lists, search results.
**Summary.** Horizontal row for an album/playlist/artist (cover + title + meta + actions) — the list-view counterpart to the cards.
**Use.**
```tsx
import { MediaListItem } from "@/components/ui/media-list-item"
<MediaListItem type="album" title="…" cover={url} subtitle="John Coltrane" meta="1965 · 7 tracks"
  playing={false} onOpen={open} onPlay={play} menuItems={…} />
```
**Changed.** Title+meta `text-xsmall`, meta `font-light` + tracking (card text contrast); action affordances; responsive density.

### Song List Item (updated)
> **Resources**
> DS: [Song List Item](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#song-list-item)
> Source: [`src/components/ui/song-list-item.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/song-list-item.tsx)

**Used in:** [album detail](https://muza.imjustsittingherelookingatprettycolours.help/?page=Album&album=a-love-supreme) track lists, playlist detail, queue, search results.
**Summary.** Track row: cover-play button + title + artist + duration.
**Use.**
```tsx
import { SongListItem } from "@/components/ui/song-list-item"
<SongListItem cover={url} trackNumber={1} title="Acknowledgement" artist="John Coltrane"
  duration="7:43" playing={false} onPlay={play} menuItems={…} />
```
**Changed.** Title+meta → `text-xsmall`; meta + duration `font-light` + `tracking-[0.02em]`; "no-artwork" branded fallback via CoverArt.

### Card Rail (updated)
> **Resources**
> DS: [Card Rail](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#card-rail)
> Source: [`src/components/app/card-rail.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/card-rail.tsx)

**Used in:** [Home rails](https://muza.imjustsittingherelookingatprettycolours.help/?page=Home), Album/Artist/Playlist detail rails.
**Summary.** Section shelf: separator + title + ◀▶ + "Show all", with a container-query stepped grid and a mobile swipeable-grid mode.
**Use.**
```tsx
import { CardRail } from "@/components/app/card-rail"
<CardRail title="New Albums" showAllLabel="All albums">
  {items.map(a => <li key={a.id}>{/* AlbumCard */}</li>)}
</CardRail>
```
**Changed.** Title on `text-base`; grid steps `304→2 … 1500→7`; mobile "peek"; every rail seeded ≥7 items; inter-rail spacing opened on Home; mobile `mobileGrid` hides the year via `data-card-year`.
**Rules.** Don't hand-tune the 7-col threshold below 1500. See the Responsiveness ticket for the full step map.

---

## 3 · Player

### Player Bar (updated)
> **Resources**
> DS: [Player Bar](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#player-bar)
> Source: [`src/components/ui/player-bar-b.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/player-bar-b.tsx)

**Used in:** the persistent player — desktop bottom bar + mobile mini-bar ([play a track](https://muza.imjustsittingherelookingatprettycolours.help/?page=Album&album=a-love-supreme)).
**Summary.** Always-on transport bar (artwork, title, transport, progress, volume) — single variant after the A/B cleanup.
**Use.** Rendered by `AppPlayer`; drive it via `usePlayer()` (`src/lib/player.tsx`).
**Changed.** Legacy A-variant (`player-bar.tsx`) deleted; background = zoomed Sun Ra cover + dark gradient overlay; **mobile progress-line fixes** — derived progress from the clock when no real media, `pathLength`-based dash (resize-safe), straight bottom line so the cap never hooks up at 0/100%.

### Player Overlay (updated)
> **Resources**
> DS: [Player Overlay](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#player-overlay)
> Source: [`src/components/ui/player-overlay.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/player-overlay.tsx)

**Used in:** the full-screen "now playing" view (mobile).
**Summary.** Full-screen player — artwork, scrubber, queue.
**Use.** Opened from the player bar / mobile shell; reads the player store.
**Changed.** Wired to the player store; responsive layout; queue reorder.

### Mobile Player Shell (new)
> **Resources**
> DS: [Player Overlay](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#player-overlay)
> Source: [`src/components/ui/mobile-player-shell.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/mobile-player-shell.tsx)

**Used in:** mobile app shell (stacks mini-bar over footer nav).
**Summary.** Mobile container stacking the mini-bar over the footer nav, expanding into the Player Overlay.
**Use.**
```tsx
import { MobilePlayerShell } from "@/components/ui/mobile-player-shell"
<MobilePlayerShell />
```
**Changed.** New mobile-only composition; coordinates mini-bar ↔ overlay.

### Player sub-components — Playing Wave · Transport Toggles · Waveform · Marquee Text (updated)
> **Resources**
> DS: [Player Bar](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#player-bar) · [Player Overlay](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#player-overlay)
> Source: [`playing-wave.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/playing-wave.tsx) · [`transport-toggles.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/transport-toggles.tsx) · [`waveform.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/waveform.tsx) · [`marquee-text.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/marquee-text.tsx)

**Used in:** inside the Player Bar / Overlay / active rows.
**Summary.** The small presentational parts of the player: the 3D "now playing" wave, the shuffle/repeat toggles, the scrubber waveform, and the overflow-aware marquee for long names.
**Use.**
```tsx
import { PlayingWave } from "@/components/ui/playing-wave"
<PlayingWave size={28} />
// TransportToggles + Waveform are bound to player-store state inside the bar/overlay;
// MarqueeText auto-scrolls only when its text overflows.
```
**Changed.**
- **Playing Wave** — kept outside any `overflow-hidden` clip ancestor so the `preserve-3d` dots stay crisp.
- **Transport Toggles** — wired to player-store state; semantic sizing.
- **Waveform** — progress + seek wiring; responsive width.
- **Marquee Text** — animates only when truncated; used in the bar + overlay.

---

## 4 · Chrome / page composition

### Media Header (new)
> **Resources**
> DS: [Media Header](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#media-header)
> Source: [`src/components/ui/media-header.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/media-header.tsx)

**Used in:** [album detail](https://muza.imjustsittingherelookingatprettycolours.help/?page=Album&album=a-love-supreme), [artist profile](https://muza.imjustsittingherelookingatprettycolours.help/?page=Artist&artist=sun-ra), playlist detail.
**Summary.** Hero header for a detail page (artwork/portrait, title, meta, primary actions, Save/Share/⋯, "show credits").
**Use.**
```tsx
import { MediaHeader } from "@/components/ui/media-header"
<MediaHeader variant="album" cover={url} title="A Love Supreme" owner="John Coltrane"
  year={1965} hasBuyingOption buyingPrice="$4.99" purchased downloadable onDownload={fn} />
```
**Changed.** New shared header; library Heart wiring; responsive two-column → stacked; artist hero uses the dual-cap height (Responsiveness ticket).

### Mobile Header (new)
> **Resources**
> DS: [Mobile Header](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#mobile-header)
> Source: [`src/components/ui/mobile-header.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/mobile-header.tsx)

**Used in:** mobile detail/list surfaces.
**Summary.** Compact in-page header for mobile (back, title, contextual actions).
**Use.**
```tsx
import { MobileHeader, MobileTitleRow, MobileIconButton } from "@/components/ui/mobile-header"
<MobileHeader><MobileTitleRow title="Albums" trailing={<MobileIconButton label="Search">…</MobileIconButton>} /></MobileHeader>
```

### Mobile App Header (new)
> **Resources**
> DS: [Mobile Header](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#mobile-header)
> Source: [`src/components/app/mobile-app-header.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/mobile-app-header.tsx)

**Used in:** [Home (resize narrow)](https://muza.imjustsittingherelookingatprettycolours.help/?page=Home) — replaces the desktop Topbar below ~768px.
**Summary.** Top-level app header on mobile (logo/search/cart/avatar).
**Use.** Rendered by the app shell below ~768px in place of `Topbar`.

### Topbar (updated)
> **Resources**
> Source: [`src/components/app/topbar.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/topbar.tsx)

**Used in:** [any page](https://muza.imjustsittingherelookingatprettycolours.help/?page=Home) (desktop) — no DS section of its own.
**Summary.** Desktop top bar (search + Studio + cart + avatar).
**Use.**
```tsx
import { Topbar, TopbarDefaultActions } from "@/components/app/topbar"
<Topbar actions={<TopbarDefaultActions />} />
```
**Changed.** Single `border-b` rule; search focus/filled states; responsive handoff to the mobile app header.

### Sidebar (updated)
> **Resources**
> Source: [`src/components/app/sidebar.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/sidebar.tsx)

**Used in:** [any page](https://muza.imjustsittingherelookingatprettycolours.help/?page=Home) (desktop) — no DS section of its own.
**Summary.** Desktop nav rail (expand/collapse, sections, playlists).
**Use.**
```tsx
import { Sidebar } from "@/components/app/sidebar"
<Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed} activeNav="Home" />
```
**Changed.** Responsive collapse; collapsed flyout; nav-state token rules.

### Footer Nav (new)
> **Resources**
> DS: [Footer Nav](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#footer-nav)
> Source: [`src/components/app/footer-nav.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/footer-nav.tsx)

**Used in:** [Home, resized < 608px](https://muza.imjustsittingherelookingatprettycolours.help/?page=Home) — replaces the sidebar on mobile.
**Summary.** Bottom tab bar for mobile navigation; sits under the player mini-bar. Drives the bottom-gutter requirement (Responsiveness ticket).
**Use.** Rendered by the app shell below 608px; takes the active-nav + navigate handlers.

---

## 5 · Actions, menus & status

### Detail More Button (new)
> **Resources**
> DS: [Detail Menu](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#detail-more-button)
> Source: [`src/components/ui/detail-more-button.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/detail-more-button.tsx)

**Used in:** [album detail ⋯](https://muza.imjustsittingherelookingatprettycolours.help/?page=Album&album=a-love-supreme), playlist/artist detail.
**Summary.** The "⋯" trigger — dropdown on desktop, **advanced bottom-sheet** on mobile — for detail-page actions.
**Use.**
```tsx
import { DetailMoreButton } from "@/components/ui/detail-more-button"
<DetailMoreButton title="A Love Supreme" cover={url} kind="album"
  libraryType="album" libraryId={id} libraryName="A Love Supreme"
  onAdd={fn} onEdit={fn} /* see source for the full action set */ />
```
**Changed.** New responsive menu/sheet; shared action set with the cards.

### Bulk Action Bar (updated)
> **Resources**
> DS: [Bulk Action Bar](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#bulk-action-bar)
> Source: [`src/components/ui/bulk-action-bar.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/bulk-action-bar.tsx)

**Used in:** all 5 library list views, multi-select ([Library/Albums](https://muza.imjustsittingherelookingatprettycolours.help/?page=Albums)).
**Summary.** Floating bar shown on multi-select (count + bulk actions).
**Use.**
```tsx
import { BulkActionBar, BulkActionButton } from "@/components/ui/bulk-action-bar"
<BulkActionBar count={n} onClear={clear} label="selected">
  <BulkActionButton onClick={fn}>Add to playlist</BulkActionButton>
</BulkActionBar>
```
**Changed.** Single reusable component replacing 5 bespoke bars; responsive.

### Library Heart Button (new)
> **Resources**
> Source: [`src/components/ui/library-heart-button.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/library-heart-button.tsx)

**Used in:** cards, Media Header, player, song rows ([Library](https://muza.imjustsittingherelookingatprettycolours.help/?page=Albums)) — no DS section of its own.
**Summary.** Store-bound save/remove control with a heart-fill animation + toast.
**Use.**
```tsx
import { LibraryHeartButton } from "@/components/ui/library-heart-button"
<LibraryHeartButton type="album" id={id} name={title} variant="outline" size="icon-sm" />
```
**Changed.** New animated button + keyframes; toggles the library store; stops propagation so it never navigates.

### Share Button (updated)
> **Resources**
> Source: [`src/components/ui/share-button.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/share-button.tsx)

**Used in:** card / detail menus ([album detail](https://muza.imjustsittingherelookingatprettycolours.help/?page=Album&album=a-love-supreme)) — no DS section of its own.
**Summary.** Unified share affordance (copy-link + native share).
**Use.**
```tsx
import { ShareButton, ShareMenuItems } from "@/components/ui/share-button"
<ShareButton url={shareHref} title="A Love Supreme" />
```
**Changed.** One icon + copy-link everywhere; baked per-item share href.

### Status Badge (new)
> **Resources**
> DS: [Status Badge](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#status-badge)
> Source: [`src/components/ui/status-badge.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/status-badge.tsx)

**Used in:** release visibility/state pills.
**Summary.** Semantic status pill atop Badge.
**Use.**
```tsx
import { StatusBadge } from "@/components/ui/status-badge"   // also re-exported from badge.tsx
<StatusBadge status="public" />   // see StatusBadgeStatus type for values
```
**Changed.** New variant atop Badge with the colors-via-variant rule.

---

## 6 · Search

### Search Panel (new)
> **Resources**
> DS: [Search](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#search)
> Source: [`src/components/ui/search-panel.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/ui/search-panel.tsx)

**Used in:** Topbar / mobile app-header search; [Explore](https://muza.imjustsittingherelookingatprettycolours.help/?page=Explore).
**Summary.** Search dropdown — recent searches + suggestions, opening into the results view.
**Use.**
```tsx
import { SearchPanel } from "@/components/ui/search-panel"
// mounted under the search input; reads the search data layer (see Search system ticket)
```
**Changed.** New panel; content-type badges on results.

---

## 7 · Dialogs

> All dialogs are controlled — render with `open` + `onOpenChange`.

### Paywall (new) ⭐ key element
> **Resources**
> DS: [Paywall](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#paywall)
> Source: [`src/components/app/subscription-dialogs.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/subscription-dialogs.tsx)

**Used in:** subscription gate (`SubscriptionPromptDialog`).
**Summary.** Subscription paywall — single responsive **split layout** (two-column and single-column/mobile), non-profit framing copy, "See how it works", logo + claim in the footer.
**Use.**
```tsx
import { SubscriptionPromptDialog } from "@/components/app/subscription-dialogs"
<SubscriptionPromptDialog open={open} onOpenChange={setOpen} />
```
**Changed.** Replaced the A/B comparison with one split layout; copy landed; min-height bump; responsive stack; processor = Square.
**Rules.** Headline on a semantic display alias; claim styled like the "See how it works" link; never bold beyond h1.

### Subscription Checkout (new)
> **Resources**
> DS: [Paywall → "Open checkout directly"](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#paywall)
> Source: [`src/components/app/subscription-dialogs.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/subscription-dialogs.tsx)

**Used in:** the choose-your-amount step (`SubscriptionCheckoutDialog`).
**Summary.** Choose-your-amount checkout — 3×2 equal-width amount pills, custom amount, "During alpha, $0 is a real option…", contact + payment.
**Use.**
```tsx
import { SubscriptionCheckoutDialog } from "@/components/app/subscription-dialogs"
<SubscriptionCheckoutDialog open={open} onOpenChange={setOpen} /* amount/tier — see source */ />
```
**Changed.** Cleaned the double-heading; pills; removed "Unlimited streaming"/"non-profit" clutter; **Square** universal payment form; static DS preview.

### Purchase Album Dialog (updated)
> **Resources**
> DS: [Purchase Album Dialog](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#purchase-album-dialog)
> Source: [`src/components/app/purchase-album-dialog.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/purchase-album-dialog.tsx)

**Used in:** [album detail → Buy](https://muza.imjustsittingherelookingatprettycolours.help/?page=Album&album=a-love-supreme).
**Summary.** Buy-album dialog (stream/download license).
**Use.**
```tsx
import { PurchaseAlbumDialog } from "@/components/app/purchase-album-dialog"
<PurchaseAlbumDialog open={open} onOpenChange={setOpen} /* album — see source */ />
```
**Changed.** Removed "Contribute to Muza" section + totals; sticky-header `border-b` restored; processor = Square.

### Cart Drawer (updated)
> **Resources**
> DS: [Drawer](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#drawer)
> Source: [`src/components/app/cart-drawer.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/cart-drawer.tsx)

**Used in:** [Shop](https://muza.imjustsittingherelookingatprettycolours.help/?page=Shop).
**Summary.** Slide-in cart for shop/merch items.
**Use.**
```tsx
import { CartDrawer } from "@/components/app/cart-drawer"
<CartDrawer open={open} onOpenChange={setOpen} />
```
**Changed.** Responsive; line items + totals; checkout handoff.

### Credits Dialog (updated)
> **Resources**
> DS: [Credits Dialog](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#credits-dialog)
> Source: [`src/components/app/credits-dialog.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/credits-dialog.tsx)

**Used in:** [album detail → Show credits](https://muza.imjustsittingherelookingatprettycolours.help/?page=Album&album=a-love-supreme), Media Header ⓘ, card/song menus (albums only).
**Summary.** "Show credits" dialog — release personnel.
**Use.** Opened via the shared credits context (`src/lib/credits-context.ts`): `showCredits(album)`.
**Changed.** Shared credits context; opened consistently everywhere.

### Edit Release Dialog (updated)
> **Resources**
> DS: [Dialog](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#dialog)
> Source: [`src/components/app/edit-release-dialog.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/edit-release-dialog.tsx)

**Used in:** [Studio music](https://muza.imjustsittingherelookingatprettycolours.help/?page=Music).
**Summary.** Owner-side edit dialog for an uploaded release.
**Use.**
```tsx
import { EditReleaseDialog } from "@/components/app/edit-release-dialog"
<EditReleaseDialog open={open} onOpenChange={setOpen} /* release — see source */ />
```
**Changed.** Form layout pass; responsive; reuses chip input / selects.

### Upload Music Dialog (updated)
> **Resources**
> DS: [Dialog](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#dialog)
> Source: [`src/components/app/upload-music-dialog.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/upload-music-dialog.tsx)

**Used in:** [Studio music](https://muza.imjustsittingherelookingatprettycolours.help/?page=Music).
**Summary.** Multi-step upload flow for new releases.
**Use.**
```tsx
import { UploadMusicDialog } from "@/components/app/upload-music-dialog"
<UploadMusicDialog open={open} onOpenChange={setOpen} />
```
**Changed.** Layout/responsive pass; chip input + selects; Square where paid.

---

## 8 · Summary tickets

### Design system — type scale, tokens & DS page (updated)
> **Resources**
> DS: [Typography](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#typography) · [Colors](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#colors)
> Source: [`app/app.css`](https://github.com/chris-hug/muza-prototypes/blob/main/app/app.css) · [`design-system.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/app/routes/design-system.tsx) · [`DESIGN_SYSTEM.md`](https://github.com/chris-hug/muza-prototypes/blob/main/DESIGN_SYSTEM.md) · [`scripts/release.mjs`](https://github.com/chris-hug/muza-prototypes/blob/main/scripts/release.mjs)

**Summary.** The unified type system + the DS kitchen-sink page tooling.
**Changed.**
- Type ramp bumped: `--text-xs` 16→17, `--text-sm` 18→19 (scale 15/17/19/21/24); `text-base` blessed as a sanctioned semantic alias.
- Display sizes `text-2xl…9xl` made **fluid** via `clamp()` (band 360→1280px).
- **Hard rule:** product code uses semantic aliases only — never primitives (`text-sm`) or arbitrary `text-[17px]`.
- Card "B" text treatment (17px title, light meta) adopted globally; tables → 17px.
- DS status system: New/Updated/Concept badges (frozen per release via `npm run release -- --clear`), per-section source links, dates auto-derived from git; "Source" button renamed **GitHub** (no `<>`).
- Branded-placeholder showcases added (artist/album/song fallbacks).
**Rules / acceptance.** No primitive type tokens in `src/`; display headings scale smoothly 360→1280; DS page renders every section with correct status badges + GitHub links.

### Responsiveness & container rules + bottom gutter (updated)
> **Resources**
> DS: [Responsive](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#responsive)
> Source: [`DESIGN_SYSTEM.md`](https://github.com/chris-hug/muza-prototypes/blob/main/DESIGN_SYSTEM.md) · [`home.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/app/routes/home.tsx) · [`responsive-diagram.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/responsive-diagram.tsx) · [`use-media-query.ts`](https://github.com/chris-hug/muza-prototypes/blob/main/src/lib/use-media-query.ts)

**Summary.** The whole responsive model — page growth tiers, container queries, pointer gating, and the new player bottom-gutter rule.
**Changed.**
- **Two-tier growth:** page wrapper `max-w-[1480px] min-[1920px]:max-w-[1716px]`; content area 1400 / 1636.
- **Stepped grids/rails:** `304→2 … 1164→6 … 1500→7`; mobile "peek" < 304.
- **Artist hero dual cap:** `max-h-[552px] min-[1920px]:max-h-[640px]` (page-width / hero-height / 7-col threshold stay in lockstep).
- **Pointer & breakpoint gating:** footer-nav at 608px, `isMobile` <768px, `--page-px` gutter tiers (40/24/12), 560px behaviour boundary.
- **Bottom gutter (NEW):** the shell's single scroll container carries `pb-32` (128px) on every page so content always clears the floating player; not per-page.

**Affected pages (examples — covered here, not separately ticketed):**
[Home](https://muza.imjustsittingherelookingatprettycolours.help/?page=Home),
[Album detail](https://muza.imjustsittingherelookingatprettycolours.help/?page=Album&album=a-love-supreme),
[Artist profile](https://muza.imjustsittingherelookingatprettycolours.help/?page=Artist&artist=sun-ra),
[Playlist detail](https://muza.imjustsittingherelookingatprettycolours.help/?page=Playlist&playlist=blue-note-essentials),
[Library × 5](https://muza.imjustsittingherelookingatprettycolours.help/?page=Library),
[Explore/Search](https://muza.imjustsittingherelookingatprettycolours.help/?page=Explore),
[Shop](https://muza.imjustsittingherelookingatprettycolours.help/?page=Shop),
[Studio music](https://muza.imjustsittingherelookingatprettycolours.help/?page=Music),
[Settings](https://muza.imjustsittingherelookingatprettycolours.help/?page=Settings),
[Orders](https://muza.imjustsittingherelookingatprettycolours.help/?page=Orders),
[Purchases](https://muza.imjustsittingherelookingatprettycolours.help/?page=Purchases),
[Wallet](https://muza.imjustsittingherelookingatprettycolours.help/?page=Wallet).
**Rules / acceptance.** No page hides content behind the player; grids step at the documented widths; hero crops past its ceiling; mobile switches to footer nav < 608px.

---

## 9 · System / feature tickets

### Save-to-library system (updated)
> **Resources**
> Source: [`user-library.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/lib/user-library.tsx) · [`use-library-sort.ts`](https://github.com/chris-hug/muza-prototypes/blob/main/src/lib/use-library-sort.ts) · [`use-library-view.ts`](https://github.com/chris-hug/muza-prototypes/blob/main/src/lib/use-library-view.ts) · [`use-library-toggle.ts`](https://github.com/chris-hug/muza-prototypes/blob/main/src/lib/use-library-toggle.ts)

**Used in:** [Library](https://muza.imjustsittingherelookingatprettycolours.help/?page=Library) and every Save affordance.
**Summary.** The library store + UI for Save/Remove across all content types and the 5 library views (grid/list toggle, sort).
**Use.** `const { isSaved, toggle } = useUserLibrary()` then drive `LibraryHeartButton`; views read the store + the sort/view/toggle hooks.
**Changed.** Store extended to all types; animated heart; views reflect store; purchased flag drives the Owned badge.

### Player store (updated)
> **Resources**
> Source: [`src/lib/player.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/lib/player.tsx) · [`app-player.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/app-player.tsx)

**Used in:** [play a track](https://muza.imjustsittingherelookingatprettycolours.help/?page=Album&album=a-love-supreme); the bar/overlay/rows.
**Summary.** Playback state — current track, play/pause, progress, queue (drag-reorder), shuffle/repeat.
**Use.** `const player = usePlayer(); player.play(track, contextTitle)`.
**Changed.** Progress derivation (clock vs media); queue ops; transport toggles; wired into cards/rows.

### Search data layer (new)
> **Resources**
> Source: [`search-catalog.ts`](https://github.com/chris-hug/muza-prototypes/blob/main/src/lib/search-catalog.ts) · [`use-search-nav.ts`](https://github.com/chris-hug/muza-prototypes/blob/main/src/lib/use-search-nav.ts)

**Used in:** [Explore](https://muza.imjustsittingherelookingatprettycolours.help/?page=Explore) + the Search Panel.
**Summary.** Search index + navigation powering the Search Panel and the Explore results view (recent searches, suggestions, results by type).

### Media navigation & detail actions (updated)
> **Resources**
> Source: [`media-nav.ts`](https://github.com/chris-hug/muza-prototypes/blob/main/src/lib/media-nav.ts) · [`detail-actions.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/lib/detail-actions.tsx) · [`use-share.ts`](https://github.com/chris-hug/muza-prototypes/blob/main/src/lib/use-share.ts) · [`credits-context.ts`](https://github.com/chris-hug/muza-prototypes/blob/main/src/lib/credits-context.ts)

**Used in:** [album detail actions](https://muza.imjustsittingherelookingatprettycolours.help/?page=Album&album=a-love-supreme); the glue cards/headers/menus call.
**Summary.** Shared open-album/playlist/artist navigation, the detail action set (share/save/add/report/credits), copy-link, and credits context. `const { openAlbum, openArtist, openPlaylist } = useMediaNav()`.
> Note: catalog **data** (album/playlist/artist DBs, portraits) is out of scope — it has its own database setup.

### Payments → Square (updated)
> **Resources**
> DS: [Paywall](https://muza.imjustsittingherelookingatprettycolours.help/?page=DesignSystem#paywall)
> Source: [`subscription-dialogs.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/subscription-dialogs.tsx) · [`purchase-album-dialog.tsx`](https://github.com/chris-hug/muza-prototypes/blob/main/src/components/app/purchase-album-dialog.tsx)

**Used in:** [album → Buy](https://muza.imjustsittingherelookingatprettycolours.help/?page=Album&album=a-love-supreme), subscription + checkout dialogs.
**Summary.** Replace the "Pay.com" processor with **Square** everywhere, including the payment-form copy ("processed by Square; card details never touch Muza's servers").
**Rules / acceptance.** No "Pay.com" string remains; all paid flows reference Square.
