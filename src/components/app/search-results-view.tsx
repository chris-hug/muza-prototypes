"use client"

/*
 * SearchResultsView — the results surface for the global search, shown on
 * the Explore page once a query is present (`?page=Explore&q=…`). Mirrors
 * the Figma results screen (file dbSHgvquI2o4TFie2iAJxv › 3975:484405):
 *
 *   Search for: <query>            [ Muza Catalog | My Library ]
 *   All · Songs · Artists · Albums · Playlists · Labels
 *   ─────────────────────────────────────────────────────────
 *   <MediaListItem rows — songs play, containers navigate>
 *
 * Every row reuses MediaListItem (the mixed-list nav/play row) so the list
 * is visually uniform and each type carries its own ContentTypeBadge. The
 * ⋯ menu reuses AlbumCardMenuItems / PlaylistCardMenuItems (which already
 * flip Save ⇄ Remove by library state); songs / artists get a small inline
 * menu built from the same shared pieces.
 */

import { useMemo, useState } from "react"
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

  // Under "All", the best-ranked match is promoted to a big "Top result"
  // card; the remaining matches stay as the normal list below it.
  const showTop = tab === "all" && visible.length > 0
  const topResult = showTop ? visible[0] : null
  const listItems = showTop ? visible.slice(1) : visible

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
          {TABS.map(t => (
            <TabsTrigger key={t.key} value={t.key}>{t.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="sm:hidden">
        <MobilePillTabs
          value={tab}
          onChange={v => setTab(v as TabKey)}
          tabs={TABS.map(t => ({ value: t.key, label: t.label }))}
        />
      </div>

      {/* Results. */}
      {visible.length === 0 ? (
        <p className="text-small text-muted-foreground py-10">
          No {tab === "all" ? "results" : labelFor(tab).toLowerCase()} found
          {scope === "library" ? " in your library" : ""} for “{query}”.
        </p>
      ) : (
        <div className="flex flex-col gap-4 sm:gap-6">
          {topResult && (
            <section className="flex flex-col gap-2 sm:gap-3">
              <h2 className="text-large font-medium text-foreground">Top result</h2>
              <SearchTopResult r={topResult} />
            </section>
          )}
          {listItems.length > 0 && (
            <section className="flex flex-col gap-2 sm:gap-3">
              {showTop && <h2 className="text-large font-medium text-foreground">More results</h2>}
              <ul className="flex flex-col gap-1">
                {listItems.map(r => (
                  <li key={r.id}><SearchRow r={r} /></li>
                ))}
              </ul>
            </section>
          )}
        </div>
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
        <h3 className="truncate text-large sm:text-xl font-medium leading-tight text-foreground">{r.title}</h3>
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
