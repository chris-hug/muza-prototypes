"use client"

/*
 * SearchResultsView — the results surface for the global search, shown on
 * the Explore page once a query is present (`?page=Explore&q=…`).
 *
 *   Search for: <query>            [ Muza Catalog | My Library ]
 *   All · Songs · Artists · Albums · …   ← only types with results
 *   ─────────────────────────────────────────────────────────
 *   All  → Top result hero + one shelf per type (see AllResults)
 *   type → a flat vertical list of MediaListItem rows
 *
 * Two distinct layouts:
 *   · The **All** tab is a composition of shelves — a "Top result" hero
 *     then, per content type, a CardRail / song column-rail / list. The
 *     full ruleset (thresholds, ordering, de-dupe, overflow-gated "Show
 *     all") lives on `AllResults` below and in DESIGN_SYSTEM.md ›
 *     "Search results — All composition". This is NOT a mixed list.
 *   · A **specific tab** is the simple case: a flat vertical list where
 *     every row reuses `MediaListItem` (uniform, carries its own
 *     ContentTypeBadge). The ⋯ menu reuses AlbumCardMenuItems /
 *     PlaylistCardMenuItems (which flip Save ⇄ Remove by library state);
 *     songs / artists get a small inline menu from the same pieces.
 *
 * Category tabs only list types that actually have results (All always
 * shown); the active tab falls back to All if it empties as the query
 * narrows.
 */

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Mic, Heart, ListPlus, Info, Trash2 } from "lucide-react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MobilePillTabs } from "@/components/ui/mobile-header"
import { ToggleGroup } from "@/components/ui/toggle-group"
import { Toggle } from "@/components/ui/toggle"
import { Button } from "@/components/ui/button"
import { ContentTypeBadge, type ContentType } from "@/components/ui/badge"
import { MediaListItem } from "@/components/ui/media-list-item"
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { AlbumCardMenuItems, PlaylistCardMenuItems } from "@/components/ui/cover-card-menu"
import { ShareMenuItems } from "@/components/ui/share-button"
import { PlayFilledAlt, PauseFilledAlt } from "@/components/ui/transport-icons"
import { CardRail } from "@/components/app/card-rail"
import { Separator } from "@/components/ui/separator"
import { SongRail as SongRailShell } from "./song-rail"
import { SongListItem } from "@/components/ui/song-list-item"
import { AlbumCard } from "@/components/ui/album-card"
import { ArtistCard } from "@/components/ui/artist-card"
import { PlaylistCard } from "@/components/ui/playlist-card"

import { useMediaNav, slugify } from "@/lib/media-nav"
import { useSearchNav } from "@/lib/use-search-nav"
import { usePlayer } from "@/lib/player"
import { useUserLibrary } from "@/lib/user-library"
import { useLibraryToggle } from "@/lib/use-library-toggle"
import { useCredits } from "@/lib/credits-context"
import { getAlbumDetail } from "@/lib/album-catalog"
import { getPlaylistDetail } from "@/lib/playlist-catalog"
import { searchCatalog, type SearchResult, type SearchKind } from "@/lib/search-catalog"

type Scope = "catalog" | "library"
type TabKey = "all" | SearchKind

const TABS: { key: TabKey; label: string }[] = [
  { key: "all",      label: "All" },
  { key: "song",     label: "Songs" },
  { key: "artist",   label: "Artists" },
  { key: "album",    label: "Albums" },
  { key: "playlist", label: "Playlists" },
  { key: "label",    label: "Labels" },
]

export function SearchResultsView({ query }: { query: string }) {
  // Scope is URL-backed (shared with the mobile header's switcher).
  const { scope, setScope } = useSearchNav()
  const [tab, setTab] = useState<TabKey>("all")
  const library = useUserLibrary()

  const all = useMemo(() => searchCatalog(query), [query])

  // Scope: "My Library" keeps only saved items (labels aren't saveable, so
  // they never appear under My Library).
  const scoped = scope === "library"
    ? all.filter(r => r.libraryType && r.libraryId && library.inLibrary(r.libraryType, r.libraryId))
    : all

  const visible = tab === "all" ? scoped : scoped.filter(r => r.kind === tab)

  // Only offer category tabs that actually have results (All is always shown),
  // so users never click into an empty tab (e.g. Labels with no matches). If
  // the active tab empties out after the query narrows, fall back to All.
  const tabCounts = scoped.reduce((c, r) => { c[r.kind] = (c[r.kind] ?? 0) + 1; return c }, {} as Record<SearchKind, number>)
  const visibleTabs = TABS.filter(t => t.key === "all" || (tabCounts[t.key as SearchKind] ?? 0) > 0)
  useEffect(() => {
    if (tab !== "all" && !scoped.some(r => r.kind === tab)) setTab("all")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, query, scope])

  return (
    <div className="max-w-[1480px] min-[1920px]:max-w-[1716px] mx-auto px-page pt-3 sm:pt-6 pb-24 flex flex-col gap-3 sm:gap-5">
      {/* Heading + scope toggle — DESKTOP only. On mobile the sticky search
          header owns both: the query shows in the field, and the scope
          switcher is a full-width segmented control under it. */}
      <div className="hidden sm:flex sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xlarge font-medium tracking-tight text-foreground min-w-0">
          <span className="text-muted-foreground font-normal">Search for: </span>
          <span className="break-words">{query}</span>
        </h1>
        <ToggleGroup
          size="sm"
          value={[scope]}
          onValueChange={v => { if (v[0]) setScope(v[0] as Scope) }}
          aria-label="Search scope"
          className="shrink-0"
        >
          <Toggle value="catalog">Muza Catalog</Toggle>
          <Toggle value="library">My Library</Toggle>
        </ToggleGroup>
      </div>

      {/* Category filter — underlined tabs on desktop; on mobile the same
          scrollable pill buttons the Library uses (MobilePillTabs). */}
      <Tabs value={tab} onValueChange={v => setTab(v as TabKey)} className="hidden sm:block min-w-0">
        <TabsList variant="line" autoCenter={false} className="w-full justify-start border-b border-border">
          {visibleTabs.map(t => (
            <TabsTrigger key={t.key} value={t.key}>{t.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="sm:hidden">
        <MobilePillTabs
          value={tab}
          onChange={v => setTab(v as TabKey)}
          tabs={visibleTabs.map(t => ({ value: t.key, label: t.label }))}
        />
      </div>

      {/* Results. The "All" tab is a relevance-ordered set of shelves
          (Top result + per-type sections); a specific tab is a flat list. */}
      {visible.length === 0 ? (
        <p className="text-small text-muted-foreground py-10">
          No {tab === "all" ? "results" : labelFor(tab).toLowerCase()} found
          {scope === "library" ? " in your library" : ""} for “{query}”.
        </p>
      ) : tab === "all" ? (
        <AllResults visible={visible} onShowAll={setTab} />
      ) : (
        <ul className="flex flex-col gap-1">
          {visible.map(r => (
            <li key={r.id}><SearchRow r={r} /></li>
          ))}
        </ul>
      )}
    </div>
  )
}

function labelFor(tab: TabKey): string {
  return TABS.find(t => t.key === tab)?.label ?? "Results"
}

// ─── Top result — the promoted, oversized hero card ──────────────────────────
function SearchTopResult({ r }: { r: SearchResult }) {
  const { openAlbum, openArtist, openPlaylist } = useMediaNav()
  const player = usePlayer()

  const isArtist   = r.kind === "artist"
  const isLabel    = r.kind === "label"
  const isPlaylist = r.kind === "playlist"
  const playable   = r.kind === "song" || r.kind === "album" || r.kind === "playlist"

  const open = () => {
    // Songs open their release (album); containers open their own page.
    if ((r.kind === "album" || r.kind === "song") && r.navKey) openAlbum(r.navKey)
    else if (r.kind === "playlist" && r.navKey) openPlaylist(r.navKey)
    else if (r.kind === "artist" && r.navKey) openArtist(r.navKey)
  }

  // Is THIS top result the current player source? (song match, or a
  // container whose context name matches "playing from".)
  const playingThis =
    player.playing && (
      (r.kind === "song" && player.track?.title === r.title && player.playingFrom === r.album) ||
      (r.kind === "album" && player.playingFrom === r.title) ||
      (r.kind === "playlist" && player.playingFrom === r.title)
    )

  // Start playback from the top result: a song plays itself; an album /
  // playlist plays its first track (context = its title).
  const play = () => {
    if (playingThis) { player.toggle(); return }
    if (r.kind === "song") {
      player.play({ title: r.title, artist: r.artist ?? "", album: r.album ?? "", image: r.cover ?? "", totalTime: r.duration }, r.album ?? "")
    } else if (r.kind === "album" && r.navKey) {
      const al = getAlbumDetail(r.navKey); const t = al.tracks[0]
      if (t) player.play({ title: t.title, artist: al.artist, album: al.title, image: al.cover, totalTime: t.duration }, al.title)
    } else if (r.kind === "playlist" && r.navKey) {
      const pl = getPlaylistDetail(r.navKey); const t = pl.tracks[0]
      if (t) player.play({ title: t.title, artist: t.artist, album: t.album, image: t.cover, totalTime: t.duration }, pl.title)
    }
  }

  // Whole-card activation: open the destination (a song opens its release);
  // the explicit Play button handles playback.
  const onCard = () => open()

  const badgeType = (isLabel ? "label" : isArtist ? "artist" : isPlaylist ? "playlist" : r.kind === "album" ? "album" : "song") as ContentType
  const sub = [r.subtitle, r.meta].filter(Boolean).join(" · ")

  return (
    <div
      onClick={onCard}
      className="group/top relative flex items-center gap-5 rounded-2xl border border-border bg-card p-4 sm:p-5 cursor-pointer transition-colors hover:bg-muted"
    >
      <TopCover r={r} />

      <div className="min-w-0 flex-1 flex flex-col gap-2">
        <h3 className="truncate text-large sm:text-xlarge font-medium leading-tight text-foreground">{r.title}</h3>
        <div className="flex items-center gap-2 min-w-0">
          <ContentTypeBadge type={badgeType} />
          {sub && <span className="truncate text-small text-muted-foreground">{sub}</span>}
        </div>
      </div>

      {/* Play (song / album / playlist) — primary circle, lifts on hover.
          Artists / labels just open on card click (no inline play). */}
      {playable && (
        <Button
          variant="default"
          size="icon-lg"
          onClick={e => { e.stopPropagation(); play() }}
          aria-label={playingThis ? `Pause ${r.title}` : `Play ${r.title}`}
          className="shrink-0 sm:size-14 shadow-md transition-[transform,opacity] sm:opacity-0 sm:translate-y-1 sm:group-hover/top:opacity-100 sm:group-hover/top:translate-y-0 [&_svg]:size-5"
        >
          {playingThis ? <PauseFilledAlt /> : <PlayFilledAlt />}
        </Button>
      )}
    </div>
  )
}

// Oversized cover for the top card — square (album/song), 2×2 collage
// (playlist), circle (artist/label).
function TopCover({ r }: { r: SearchResult }) {
  const size = "size-20 sm:size-28 shrink-0"
  if (r.kind === "artist" || r.kind === "label") {
    return <img src={r.cover} alt="" draggable={false} className={`${size} rounded-full object-cover bg-secondary`} />
  }
  if (r.kind === "playlist" && r.covers && r.covers.length >= 4) {
    return (
      <div className={`${size} grid grid-cols-2 grid-rows-2 overflow-hidden rounded-xs`}>
        {r.covers.slice(0, 4).map((src, i) => (
          <img key={i} src={src} alt="" draggable={false} className="size-full object-cover" />
        ))}
      </div>
    )
  }
  return <img src={r.cover ?? r.covers?.[0]} alt="" draggable={false} className={`${size} rounded-xs object-cover bg-secondary`} />
}

// ─── One result row ──────────────────────────────────────────────────────────
function SearchRow({ r }: { r: SearchResult }) {
  const { openAlbum, openArtist, openPlaylist } = useMediaNav()
  const player = usePlayer()
  const library = useUserLibrary()
  const toggleLibrary = useLibraryToggle()
  const credits = useCredits()

  const inLibrary = !!(r.libraryType && r.libraryId && library.inLibrary(r.libraryType, r.libraryId))
  const toggleSave = () => { if (r.libraryType && r.libraryId) toggleLibrary(r.libraryType, r.libraryId, r.title) }

  // ── Song — plays into the global player (context = its album). ──────────
  if (r.kind === "song") {
    const playing = player.playing && player.track?.title === r.title && player.playingFrom === r.album
    return (
      <MediaListItem
        type="song"
        cover={r.cover}
        title={r.title}
        subtitle={r.subtitle}
        meta={r.meta}
        playing={playing}
        // Row body → open the song's release; cover button → play.
        onOpen={r.navKey ? () => openAlbum(r.navKey!) : undefined}
        onPlay={() => {
          if (playing) { player.toggle(); return }
          player.play({ title: r.title, artist: r.artist ?? "", album: r.album ?? "", image: r.cover ?? "", totalTime: r.duration }, r.album ?? "")
        }}
        onSubtitleClick={r.artist ? () => openArtist(slugify(r.artist!)) : undefined}
        menuItems={
          <>
            <ShareMenuItems title={r.title} text={r.artist ? `${r.title} — ${r.artist}` : r.title} />
            <DropdownMenuItem onClick={toggleSave}>
              <Heart className={inLibrary ? "fill-current" : undefined} />
              {inLibrary ? "Remove from library" : "Save to library"}
            </DropdownMenuItem>
            <DropdownMenuItem><ListPlus />Add to playlist</DropdownMenuItem>
            <DropdownMenuSeparator />
            {r.artist && <DropdownMenuItem onClick={() => openArtist(slugify(r.artist!))}><Mic />Go to artist</DropdownMenuItem>}
            <DropdownMenuItem onClick={() => r.album && credits.open(slugify(r.album))}><Info />Show credits</DropdownMenuItem>
          </>
        }
      />
    )
  }

  // ── Album. ──────────────────────────────────────────────────────────────
  if (r.kind === "album") {
    return (
      <MediaListItem
        type="album"
        cover={r.cover}
        title={r.title}
        subtitle={r.subtitle}
        meta={r.meta}
        onOpen={() => r.navKey && openAlbum(r.navKey)}
        onSubtitleClick={r.subtitle ? () => openArtist(slugify(r.subtitle!)) : undefined}
        menuItems={
          <AlbumCardMenuItems
            shareTitle={r.title}
            shareUrl={`/?page=Album&album=${r.navKey}`}
            inLibrary={inLibrary}
            onAdd={toggleSave}
            onRemove={toggleSave}
            onGoToArtist={() => r.subtitle && openArtist(slugify(r.subtitle))}
            hideGoToAlbum
          />
        }
      />
    )
  }

  // ── Playlist. ─────────────────────────────────────────────────────────────
  if (r.kind === "playlist") {
    const owned = r.subtitle === "You"
    return (
      <MediaListItem
        type="playlist"
        covers={r.covers}
        cover={r.cover}
        title={r.title}
        subtitle={r.subtitle}
        meta={r.meta}
        onOpen={() => r.navKey && openPlaylist(r.navKey)}
        onSubtitleClick={owned ? undefined : () => r.subtitle && openArtist(slugify(r.subtitle))}
        menuItems={
          <PlaylistCardMenuItems
            owned={owned}
            inLibrary={inLibrary}
            onAdd={toggleSave}
            onRemove={toggleSave}
            shareTitle={r.title}
            shareUrl={`/?page=Playlist&playlist=${r.navKey}`}
            onGoToOwner={() => r.subtitle && openArtist(slugify(r.subtitle))}
            hideGoToPlaylist
          />
        }
      />
    )
  }

  // ── Artist. ───────────────────────────────────────────────────────────────
  if (r.kind === "artist") {
    const open = () => r.navKey && openArtist(r.navKey)
    return (
      <MediaListItem
        type="artist"
        cover={r.cover}
        title={r.title}
        onOpen={open}
        menuItems={
          <>
            <DropdownMenuItem onClick={open}><Mic />Go to artist</DropdownMenuItem>
            <ShareMenuItems title={r.title} />
            <DropdownMenuSeparator />
            <DropdownMenuItem variant={inLibrary ? "destructive" : "default"} onClick={toggleSave}>
              {inLibrary ? <Trash2 /> : <Heart />}
              {inLibrary ? "Remove from library" : "Save to library"}
            </DropdownMenuItem>
          </>
        }
      />
    )
  }

  // ── Label — name + album count, no detail page yet (no menu). ─────────────
  return (
    <MediaListItem
      type="label"
      cover={r.cover}
      title={r.title}
      subtitle={r.meta}
    />
  )
}

// ─── "All" tab — relevance-ordered shelves ───────────────────────────────────
// Replaces the old flat list. Top result hero, then one section per content
// type ordered by where its best-ranked hit falls. Songs become a column-rail
// (the Artist › Top Songs pattern) at ≥6, else a simple vertical list; artwork
// types become CardRails at ≥2, else a single inline card; labels stay a list.
// Composition rules are documented in DESIGN_SYSTEM.md ›
// "Search results — All composition".

const SECTION_TITLE: Record<SearchKind, string> = {
  song: "Songs", artist: "Artists", album: "Albums", playlist: "Playlists", label: "Labels",
}

function AllResults({ visible, onShowAll }: { visible: SearchResult[]; onShowAll: (k: SearchKind) => void }) {
  const top = visible[0]

  // Very sparse query (≤2 total): a hero + a tiny list reads better than
  // shelves carrying one item each.
  if (visible.length <= 2) {
    return (
      <div className="flex flex-col gap-4 sm:gap-6">
        <section className="flex flex-col gap-2 sm:gap-3">
          <h2 className="text-large font-medium text-foreground">Top result</h2>
          <SearchTopResult r={top} />
        </section>
        {visible.length > 1 && (
          <ul className="flex flex-col gap-1">
            {visible.slice(1).map(r => <li key={r.id}><SearchRow r={r} /></li>)}
          </ul>
        )}
      </div>
    )
  }

  // Group by kind from everything EXCEPT the Top result, so the Top result's
  // own type section only appears when there are OTHER hits of that type (e.g.
  // more artists with similar names) — a lone match never gets a redundant
  // one-item rail repeating the hero. The Top result's type still leads when
  // it does have siblings.
  const byKind = new Map<SearchKind, SearchResult[]>()
  const seen: SearchKind[] = []
  for (const r of visible.slice(1)) {
    if (!byKind.has(r.kind)) { byKind.set(r.kind, []); seen.push(r.kind) }
    byKind.get(r.kind)!.push(r)
  }
  const order = byKind.has(top.kind) ? [top.kind, ...seen.filter(k => k !== top.kind)] : seen

  return (
    <div className="@container flex flex-col gap-4 sm:gap-6">
      <section className="flex flex-col gap-2 sm:gap-3">
        <h2 className="text-large font-medium text-foreground">Top result</h2>
        <SearchTopResult r={top} />
      </section>
      {order.map(kind => (
        <GroupSection key={kind} kind={kind} items={byKind.get(kind)!} onShowAll={() => onShowAll(kind)} />
      ))}
    </div>
  )
}

function GroupSection({ kind, items, onShowAll }: { kind: SearchKind; items: SearchResult[]; onShowAll: () => void }) {
  const title = SECTION_TITLE[kind]

  // Songs: column-rail at ≥6 (fills ≥2 full 3-row columns), simple list ≤5.
  if (kind === "song") {
    return items.length >= 6
      ? <SongRail title={title} songs={items} onShowAll={onShowAll} />
      : (
        <ListSection title={title}>
          <ul className="flex flex-col gap-1">
            {items.map(r => <li key={r.id}><SearchSongRow r={r} /></li>)}
          </ul>
        </ListSection>
      )
  }

  // Artwork types: CardRail at ≥2, a single inline card at exactly 1.
  if (kind === "artist" || kind === "album" || kind === "playlist") {
    if (items.length >= 2) {
      return (
        <CardRail title={title} onShowAll={onShowAll} showAllOnlyWhenScrollable>
          {items.map(r => <li key={r.id}><ResultCard r={r} /></li>)}
        </CardRail>
      )
    }
    return (
      <ListSection title={title}>
        <div className="w-[clamp(143px,42vw,220px)]"><ResultCard r={items[0]} /></div>
      </ListSection>
    )
  }

  // Labels: no card / no detail page — a simple list.
  return (
    <ListSection title={title}>
      <ul className="flex flex-col gap-1">
        {items.map(r => <li key={r.id}><SearchRow r={r} /></li>)}
      </ul>
    </ListSection>
  )
}

// Section shell mirroring the CardRail header (separator + title + optional
// "Show all"), for the non-rail sections (song list, single card, labels).
function ListSection({ title, onShowAll, children }: { title: string; onShowAll?: () => void; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 min-w-0">
      <div className="flex flex-col gap-2 pt-6">
        <Separator />
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-medium text-foreground truncate min-w-0">{title}</h2>
          {onShowAll && <Button variant="ghost" size="sm" onClick={onShowAll}>Show all</Button>}
        </div>
      </div>
      {children}
    </section>
  )
}

// Songs as a horizontally-paged grid of 3-row columns — the same shape as the
// Artist page's Top Songs (1 col <692 with peek, 2 ≥692, 3 ≥1164). Used at ≥6.
// Search › Songs = the shared `SongRail` shell fed search-result rows.
// Only builds the rows; the rail (columns, chevrons, peek, Show-all/overflow)
// lives in `song-rail.tsx`.
function SongRail({ title, songs, onShowAll }: { title: string; songs: SearchResult[]; onShowAll: () => void }) {
  const rows = songs.map(r => <SearchSongRow key={r.id} r={r} compact />)
  return <SongRailShell title={title} rows={rows} onShowAll={onShowAll} />
}

// A single search-result card (artist / album / playlist) for the shelves.
function ResultCard({ r }: { r: SearchResult }) {
  const { openAlbum, openArtist, openPlaylist } = useMediaNav()
  if (r.kind === "artist") {
    return <ArtistCard name={r.title} image={r.cover} onClick={() => r.navKey && openArtist(r.navKey)} />
  }
  if (r.kind === "album") {
    return (
      <AlbumCard
        cover={r.cover ?? ""}
        title={r.title}
        artist={r.subtitle ?? ""}
        year={r.year}
        onTitleClick={() => r.navKey && openAlbum(r.navKey)}
        onArtistClick={() => r.subtitle && openArtist(slugify(r.subtitle))}
      />
    )
  }
  if (r.kind === "playlist") {
    const owned = r.subtitle === "You"
    return (
      <PlaylistCard
        title={r.title}
        covers={r.covers ?? []}
        songCount={parseInt(r.meta ?? "", 10) || 0}
        owner={owned ? undefined : r.subtitle}
        owned={owned}
        onTitleClick={() => r.navKey && openPlaylist(r.navKey)}
        onPlay={() => r.navKey && openPlaylist(r.navKey)}
      />
    )
  }
  return null
}

// One song row for the "All" shelves — SongListItem wired to player + library
// + credits (compact inside the column-rail, full in the ≤5 list).
function SearchSongRow({ r, compact }: { r: SearchResult; compact?: boolean }) {
  const { openAlbum, openArtist } = useMediaNav()
  const player = usePlayer()
  const library = useUserLibrary()
  const toggleLibrary = useLibraryToggle()
  const credits = useCredits()

  const inLibrary = !!(r.libraryType && r.libraryId && library.inLibrary(r.libraryType, r.libraryId))
  const toggleSave = () => { if (r.libraryType && r.libraryId) toggleLibrary(r.libraryType, r.libraryId, r.title) }
  const playing = player.playing && player.track?.title === r.title && player.playingFrom === r.album

  return (
    <SongListItem
      compact={compact}
      cover={r.cover}
      title={r.title}
      artist={r.artist}
      album={r.album}
      year={r.year}
      duration={r.duration}
      playing={playing}
      onPlay={() => {
        if (playing) { player.toggle(); return }
        player.play({ title: r.title, artist: r.artist ?? "", album: r.album ?? "", image: r.cover ?? "", totalTime: r.duration }, r.album ?? "")
      }}
      onArtistClick={r.artist ? () => openArtist(slugify(r.artist!)) : undefined}
      onAlbumClick={r.navKey ? () => openAlbum(r.navKey!) : undefined}
      menuItems={
        <>
          <ShareMenuItems title={r.title} text={r.artist ? `${r.title} — ${r.artist}` : r.title} />
          <DropdownMenuItem onClick={toggleSave}>
            <Heart className={inLibrary ? "fill-current" : undefined} />
            {inLibrary ? "Remove from library" : "Save to library"}
          </DropdownMenuItem>
          <DropdownMenuItem><ListPlus />Add to playlist</DropdownMenuItem>
          <DropdownMenuSeparator />
          {r.artist && <DropdownMenuItem onClick={() => openArtist(slugify(r.artist!))}><Mic />Go to artist</DropdownMenuItem>}
          <DropdownMenuItem onClick={() => r.album && credits.open(slugify(r.album))}><Info />Show credits</DropdownMenuItem>
        </>
      }
    />
  )
}
