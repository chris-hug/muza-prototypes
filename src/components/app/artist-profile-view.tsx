"use client"

/*
 * ArtistProfileView — the artist landing page.
 *
 * Figma source: file dbSHgvquI2o4TFie2iAJxv › node 8971:98256.
 *
 * Layout (top → bottom):
 *   1. Full-bleed hero — backdrop photo + dark gradient overlay,
 *      back-arrow, name (huge), short bio with "read more", plus a
 *      row of action buttons (Play, Artist radio, Share, More).
 *   2. Sticky tab strip — Overview / Discography / Products.
 *   3. Content sections (in order):
 *        · Top Songs        (2-column SongListItem grid)
 *        · Top Albums       (CardRail of AlbumCards)
 *        · Products         (CardRail of ProductCards)
 *        · Curated Playlists (CardRail of PlaylistCards)
 *        · Similar Artists   (CardRail of ArtistCards)
 *
 * Section header pattern matches the rest of the home: separator
 * line + title-left + ◀ ▶ + "Show all" right. CardRail already
 * delivers that exact treatment; we only render a manually-styled
 * header for the Top Songs section because its body is a grid, not
 * a horizontal scroll rail.
 */

import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router"
import { ArrowUp, ArrowUpDown, LayoutGrid, List, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { useMediaQuery, useFooterNav } from "@/lib/use-media-query"
import { ContentTypeBadge, contentTypeConfig } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MultiSelect } from "@/components/ui/multi-select"
import { Separator } from "@/components/ui/separator"
import { SingleSelect } from "@/components/ui/single-select"
import { TableBody, TableCell, TableHead, TableRow, SortHeader } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlbumCardMenuItems } from "@/components/ui/cover-card-menu"
import { useUserLibrary } from "@/lib/user-library"
import { ArtistHero } from "./artist-hero"
import { SongRail } from "./song-rail"
import { artistImage } from "@/lib/artist-data"
import { railArtist, railPlaylist } from "@/lib/rail-list"
import { getArtistProfile, type ArtistProfile, type ArtistRelease, type ArtistSong, type ReleaseKind } from "@/lib/artist-catalog"
import { albumMetaFor, libraryIdForTitle } from "@/lib/album-meta"
import { hasAlbumDetail } from "@/lib/album-catalog"
import { hasPlaylistDetail } from "@/lib/playlist-catalog"
import { useMediaNav, slugify } from "@/lib/media-nav"
import { usePlayer } from "@/lib/player"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup } from "@/components/ui/toggle-group"
import { Toggle } from "@/components/ui/toggle"
import { AlbumCard } from "@/components/ui/album-card"
import { ArtistCard } from "@/components/ui/artist-card"
import { PlaylistCard } from "@/components/ui/playlist-card"
import { ProductCard } from "@/components/ui/product-card"
import { SongListItem } from "@/components/ui/song-list-item"
import { CoverPlayButton } from "@/components/ui/cover-play-button"
import { CardRail } from "@/components/app/card-rail"
import { ArtistLocalSection } from "@/components/app/artist-local-section"
import { usePublishDetailHeader } from "@/lib/detail-actions"

// ─── View ───────────────────────────────────────────────────────────────────

/* Keyed by artist: hopping from one artist to another stays on the same
   route, and the tab, the filter and the scroll position belong to the page
   you left. */
export function ArtistProfileView() {
  const [params] = useSearchParams()
  const profile = getArtistProfile(params.get("artist"))
  return <ArtistProfilePage key={profile.name} profile={profile} />
}

function ArtistProfilePage({ profile }: { profile: ArtistProfile }) {
  const ARTIST = profile
  const TOP_SONGS = profile.topSongs
  const TOP_ALBUMS = profile.topAlbums
  const DISCOGRAPHY = profile.discography
  const PRODUCTS = profile.products
  const CURATED_PLAYLISTS = profile.playlists
  const SIMILAR_ARTISTS = profile.similar
  const { openAlbum, openPlaylist, openArtist } = useMediaNav()
  // `artist-tab` / `artist-kind` / `artist-view`: the tab, filter and layout
  // live in the URL as well as in state, so the back chevron returns to this
  // page as you left it, and an album's "All albums" can open it filtered.
  // Read on mount only.
  const [params, setParams] = useSearchParams()
  // The route shell only resets the scroll when `page` changes, and an
  // artist-to-artist hop keeps it. Same reset the album page does.
  const rootRef = useRef<HTMLDivElement>(null)
  const scrollToTop = () => {
    let el = rootRef.current?.parentElement
    while (el) {
      const oy = getComputedStyle(el).overflowY
      if (oy === "auto" || oy === "scroll") { el.scrollTop = 0; break }
      el = el.parentElement
    }
  }
  useEffect(scrollToTop, [])
  // What the Discography opens filtered to: set by "All albums" here or on an
  // album page, cleared as soon as the tabs are used by hand.
  const [discographyKind, setDiscographyKind] = useState(params.get("artist-kind"))
  // A rail's "Show all" sits far down the Overview; the tab it opens starts
  // at the top, so the page has to go there with it.
  const syncTab = (next: string, kind: string | null) => setParams(prev => {
    const url = new URLSearchParams(prev)
    if (next === "overview") url.delete("artist-tab"); else url.set("artist-tab", next)
    if (kind) url.set("artist-kind", kind); else url.delete("artist-kind")
    return url
  }, { replace: true })
  const openTab = (next: string, kind: string | null = null) => {
    setDiscographyKind(kind)
    setTab(next)
    syncTab(next, kind)
    scrollToTop()
  }
  const [tab, setTab] = useState(params.get("artist-tab") ?? "overview")
  const library = useUserLibrary()
  const player = usePlayer()
  // This artist is the active player source AND playing → hero Play
  // button shows Pause.
  const isThisArtistPlaying = player.playing && player.playingFrom === ARTIST.name
  // Artist library key — the hero heart and the mobile "…" menu both bind
  // to the shared store by this id, so they stay in sync (and persist).
  const artistId = slugify(ARTIST.name)

  // Publish the title + cover + menu for the floating mobile chrome. On
  // mobile the hero's Share + Add-to-library buttons collapse into the
  // header's "…" (top-right, mirroring the back top-left); this config
  // drives that menu. The chrome samples `coverSrc` to flip the back icon
  // light/dark to stay legible over the hero photo.
  usePublishDetailHeader({
    title: ARTIST.name,
    coverSrc: ARTIST.cover,
    menu: {
      kind: "artist",
      title: ARTIST.name,
      // No subtitle — the "Artist" content-type badge already labels it, so a
      // "Artist" subtitle would just repeat.
      cover: ARTIST.cover,
      // Save action binds to the global user-library store (same as the
      // hero heart) so the two stay in sync and Save flips to Remove.
      libraryType: "artist",
      libraryId: artistId,
      libraryName: ARTIST.name } })

  // No `overflow-auto` here — the outer layout already owns the page
  // scroll. A second scroll container would break sticky positioning
  // for descendants like the Discography table head.
  return (
    <div ref={rootRef} className="flex-1">
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      {/* `dark` flips the design tokens locally for everything inside
           the hero — text-foreground = light, bg-background = dark,
           border-border = dark border, etc. — so the standard
           Button outline variant (border-border + bg-background/20 +
           backdrop-blur) renders correctly on the dark photo backdrop
           without any per-button colour overrides. */}
      <ArtistHero
        name={ARTIST.name}
        cover={ARTIST.cover}
        avatar={artistImage(ARTIST.name)}
        bio={ARTIST.bio}
        artistId={artistId}
        isPlaying={isThisArtistPlaying}
        onPlayToggle={() => {
          if (player.playingFrom === ARTIST.name && player.track) { player.toggle(); return }
          const s = TOP_SONGS[0]
          player.play(
            { title: s.title, artist: ARTIST.name, album: s.album, image: s.cover, totalTime: s.duration, artistAvatar: ARTIST.cover },
            ARTIST.name,
          )
        }}
      />

      {/* ── Tab strip ──────────────────────────────────────────────────
           Full-bleed muted band so the tabs sit visually attached to
           the hero. Inside it the TabsList re-aligns to the same
           centered max-w container the rest of the page uses, so the
           underline indicator + text columns line up with every
           section header below. Variant="line" gives the underline
           treatment per the design-system spec. */}
      {/* Figma spec (node 8971:98259): muted band, pt-4 only, three
           equal-width triggers (flex-1), one continuous line across the
           strip with the active third marked.
           
           That line used to be built per trigger — every tab carried its own
           `border-b`, `border-border` when idle and `border-foreground` when
           active — and the result was a mark that could not travel. Three
           separate borders have nothing to interpolate between: the old third
           crossfaded to grey while the new third crossfaded to white, which
           the eye reads as the mark going out here and coming on over there.
           Base UI's `Indicator` was rendering underneath the whole time and
           doing exactly the right thing, invisibly, because a foreground
           border was already sitting on top of it.
           
           So: the hairline belongs to the LIST (one `border-b`), and the
           bright mark is the Indicator alone, sliding the 441px between
           thirds. */}
      <div className="w-full bg-muted">
        <div className="@container w-full pt-4">
          <Tabs value={tab} onValueChange={v => { setDiscographyKind(null); setTab(v); syncTab(v, null) }}>
            {/* h-9 matches the triggers' own height — the `line` variant
                 scrolls (overflow-x-auto), which forces overflow-y to clip;
                 a shorter list would cut off the triggers' bottom borders
                 (the active underline). */}
            <TabsList variant="line" className="w-full gap-0 h-9">
              <TabsTrigger
                value="overview"
                className="flex-1 h-9 items-start px-0 pt-0 pb-0 after:hidden"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="discography"
                className="flex-1 h-9 items-start px-0 pt-0 pb-0 after:hidden"
              >
                Discography
              </TabsTrigger>
              <TabsTrigger
                value="products"
                className="flex-1 h-9 items-start px-0 pt-0 pb-0 after:hidden"
              >
                Shop
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Page-content wrapper. `@container` is set per-tab below
           rather than on this outer div because container-type breaks
           position: sticky for descendants (the discography list view
           needs a sticky table head against the page scroll). */}
      <div className="mx-auto max-w-[1480px] min-[1920px]:max-w-[1716px] w-full px-page">
        {tab === "overview" && (
          <div className="@container">
          <>
            <TopSongsRow songs={TOP_SONGS} artistName={ARTIST.name} artistCover={ARTIST.cover} />

            <CardRail title="Top Albums" showAllLabel="All albums" onShowAll={() => openTab("discography", "album")}>
              {TOP_ALBUMS.map(a => {
                const meta  = albumMetaFor(a.title)
                const libId = libraryIdForTitle(a.title)
                const key   = slugify(a.title)
                const linkable = hasAlbumDetail(key)
                return (
                  <li key={a.id}>
                    <AlbumCard
                      cover={a.cover}
                      title={a.title}
                      artist={a.artist}
                      year={meta.year ?? a.year}
                      streamPrice={meta.streamPrice}
                      downloadPrice={meta.downloadPrice}
                      purchased={libId ? library.isPurchased(libId) : false}
                      onTitleClick={linkable ? () => openAlbum(key) : undefined}
                      onPlay={linkable ? () => openAlbum(key) : undefined}
                      hideGoToArtist
                    />
                  </li>
                )
              })}
            </CardRail>

            <CardRail title="Products" showAllLabel="All products" onShowAll={() => openTab("products")}>
              {PRODUCTS.map(p => (
                <li key={p.id}>
                  <ProductCard cover={p.cover} title={p.title} price={p.price} />
                </li>
              ))}
            </CardRail>

            <CardRail title="Curated Playlists" showAllLabel="All playlists" list={{ subtitle: ARTIST.name, items: CURATED_PLAYLISTS.map(railPlaylist) }}>
              {CURATED_PLAYLISTS.map(p => {
                const key = slugify(p.title)
                const linkable = hasPlaylistDetail(key)
                return (
                  <li key={p.id}>
                    <PlaylistCard
                      title={p.title}
                      covers={p.covers}
                      songCount={p.songCount}
                      owner={p.owner}
                      owned={p.owned}
                      onTitleClick={linkable ? () => openPlaylist(key) : undefined}
                      onPlay={linkable ? () => openPlaylist(key) : undefined}
                    />
                  </li>
                )
              })}
            </CardRail>

            <CardRail title="Similar Artists" showAllLabel="All artists" list={{ subtitle: ARTIST.name, items: SIMILAR_ARTISTS.map(railArtist) }}>
              {SIMILAR_ARTISTS.map(a => (
                <li key={a.id}><ArtistCard name={a.name} image={a.image} onClick={() => openArtist(slugify(a.name))} /></li>
              ))}
            </CardRail>
          </>
          </div>
        )}

        {tab === "discography" && (
          <DiscographyView releases={DISCOGRAPHY} artistName={ARTIST.name} initialKind={discographyKind} />
        )}

        {tab === "products" && (
          <section className="flex flex-col gap-4">
            {/* Same header band as Discography — pt-8 + separator so
                 the grid sits at the matching vertical offset under
                 the tab strip. */}
            <div className="flex flex-col gap-2 pt-8">
              <Separator />
            </div>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(192px,1fr))] gap-x-4 gap-y-6">
              {PRODUCTS.map(p => (
                <li key={p.id}>
                  <ProductCard cover={p.cover} title={p.title} price={p.price} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="pb-24" />
      </div>

      {/* The listener's own files of this artist — theirs, not the
           artist's, so after the page's content and in a band of their
           own across the full width (artist-local-section). */}
      {tab === "overview" && <ArtistLocalSection artistName={ARTIST.name} />}
    </div>
  )
}

// ─── DiscographyView ────────────────────────────────────────────────────────
//
// Figma source: file dbSHgvquI2o4TFie2iAJxv › node 7510:237267.
//
// Toolbar (two rows):
//   1. Filter chip bar — All Releases (active by default) followed by
//      a chip per `ReleaseKind`. Each chip carries a small count badge
//      and only the kinds with content are rendered.
//   2. Left: sort dropdown (Recording date / Title / Type) opens a
//      menu. Right: grid/list view toggle (visual only for now —
//      always renders the grid).
//
// Body: AlbumCard grid sized like the Library/Albums grid so the
// rhythm matches the rest of the app.

type SortKey =
  | "year-desc"  | "year-asc"
  | "title-az"   | "title-za"
  | "tracks-desc" | "tracks-asc"

const KIND_LABEL: Record<ReleaseKind, string> = {
  album:       "Albums",
  "single": "Singles",
  ep:          "EPs",
  remix:       "Remixes",
  secondary:   "Secondary Role" }


// Mirrors the Studio/Music sortable-header pattern: muted label by
// default, foreground when active, with an ArrowUp/Down icon for the
// current direction (faint ArrowUpDown hint shown on hover when not
// active).
/* The catalogued `SortHeader` from `ui/table`, wrapped only to keep this
   file's prop names. */
function SortableHeader({
  label, isActive, dir, onClick }: { label: string; isActive: boolean; dir: "asc" | "desc" | null; onClick: () => void }) {
  return <SortHeader label={label} active={isActive} dir={dir} onClick={onClick} />
}

function DiscographyView({
  releases, artistName, initialKind }: { releases: ArtistRelease[]; artistName: string; initialKind?: string | null }) {
  const library = useUserLibrary()
  const { openAlbum } = useMediaNav()
  // Multi-select kind filter. Empty set means "no filter applied"
  // (i.e. show all releases) — keeps the menu's `Clear all` row in
  // sync with the visible-everything default.
  const [filter, setFilter] = useState<Set<ReleaseKind>>(() => {
    const wanted = (initialKind ?? "").split(",")
    return new Set((["album", "single", "ep", "remix", "secondary"] as const).filter(k => wanted.includes(k)))
  })
  const [params, setParams] = useSearchParams()
  const syncParam = (key: string, value: string | null) => setParams(prev => {
    const url = new URLSearchParams(prev)
    if (value) url.set(key, value); else url.delete(key)
    return url
  }, { replace: true })
  const [sort, setSort]     = useState<SortKey>("year-desc")
  const [view, setView]     = useState<"grid" | "list">(params.get("artist-view") === "list" ? "list" : "grid")
  /* Which columns the list view can afford. The table needs ~440px for all
     six; a phone gives it 351. Measured against the COLUMN the table sits in
     via `sm`/`lg` — in-page reflow, which is what those steps are for
     (`docs/components/responsive.md`); chrome breakpoints are a different
     ladder and must not be borrowed here. */
  const showRecorded = useMediaQuery("(min-width: 480px)")
  const showType     = useMediaQuery("(min-width: 640px)")
  const showTracks   = useMediaQuery("(min-width: 900px)")
  const showBand     = useMediaQuery("(min-width: 1024px)")
  // Mock playback — single release at a time. Matches SongListItem's
  // local-toggle behaviour. Real wiring would lift this to a global
  // player store.
  const [playingId, setPlayingId] = useState<string | null>(null)
  const togglePlay = (id: string) =>
    setPlayingId(prev => (prev === id ? null : id))

  // Counts per kind for the chip badges. "All Releases" shows the total.
  const counts = useMemo(() => {
    const out: Record<ReleaseKind, number> = {
      album: 0, "single": 0, ep: 0, remix: 0, secondary: 0 }
    for (const r of releases) out[r.kind] += 1
    return out
  }, [releases])

  // Filter + sort pipeline. Kept as a single memo so re-renders only
  // recompute the visible grid when one of the controls changes.
  const visible = useMemo(() => {
    const filtered = filter.size === 0
      ? releases
      : releases.filter(r => filter.has(r.kind))
    const sorted = [...filtered].sort((a, b) => {
      if (sort === "year-desc")   return b.year - a.year
      if (sort === "year-asc")    return a.year - b.year
      if (sort === "tracks-desc") return b.tracks - a.tracks
      if (sort === "tracks-asc")  return a.tracks - b.tracks
      if (sort === "title-za")    return b.title.localeCompare(a.title)
      return a.title.localeCompare(b.title)
    })
    return sorted
  }, [releases, filter, sort])

  // Only render chips for kinds that actually have entries.
  const kindEntries = (Object.keys(KIND_LABEL) as ReleaseKind[])
    .filter(k => counts[k] > 0)

  return (
    <section className="flex flex-col gap-4">
      {/* Header band — matches CardRail / TopSongsRow rhythm: pt-6 +
           separator + gap-2 to the row of controls below. That way
           Discography's first row sits at the same vertical offset
           below the tab strip as Overview's first section header. */}
      {/* One-row toolbar — separator on top, then [Filter] [Sort]
           on the left and the [Grid/List toggle] on the right. The
           SingleSelect (the sort one) is hidden on list view because the table header
           itself carries sortable controls there (same pattern as
           Studio/Music). */}
      <div className="flex flex-col gap-2 pt-8">
        <Separator />
        {/* Wraps on narrow screens. The trigger buttons are `shrink-0` (all
             Buttons are), so on a 360px phone the filter + sort pair — 240px
             and 202px — overflowed the 336px row and ran off the right edge,
             which iOS then let you pan to. Wrapping keeps every control at
             full size and just moves it to the next line. */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <MultiSelect
              label="All releases"
              selected={filter as Set<string>}
              onChange={next => {
                setFilter(next as Set<ReleaseKind>)
                syncParam("artist-kind", [...next].join(",") || null)
              }}
              options={kindEntries.map(k => ({
                value: k,
                label: (
                  <span className="inline-flex items-center gap-2 min-w-0">
                    <span className="truncate">{KIND_LABEL[k]}</span>
                    <Badge shape="pill" variant="secondary">{counts[k]}</Badge>
                  </span>
                ) }))}
            />
            {view === "grid" && (
              <SingleSelect
                value={sort}
                onChange={setSort}
                label="Recording date"
                options={[
                  { value: "year-desc", label: "Recording date (newest)" },
                  { value: "year-asc",  label: "Recording date (oldest)" },
                  { value: "title-az",  label: "Title (A–Z)" },
                ]}
              />
            )}
          </div>

        <ToggleGroup
          value={[view]}
          onValueChange={vals => {
            const next = vals[0] as "grid" | "list" | undefined
            if (next) { setView(next); syncParam("artist-view", next === "list" ? "list" : null) }
          }}
        >
          <Toggle value="grid" aria-label="Grid view">
            <LayoutGrid strokeWidth={1.5} />
          </Toggle>
          <Toggle value="list" aria-label="List view">
            <List strokeWidth={1.5} />
          </Toggle>
        </ToggleGroup>
        </div>
      </div>

      {view === "grid" ? (
        // Releases grid — same auto-fill template as Library/Albums so
        // card widths stay flush with the rest of the app.
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(192px,1fr))] gap-x-4 gap-y-6 pt-2">
          {visible.map(r => {
            const meta  = albumMetaFor(r.title)
            const libId = libraryIdForTitle(r.title)
            const key   = slugify(r.title)
            const linkable = hasAlbumDetail(key)
            return (
              <li key={r.id}>
                <AlbumCard
                  cover={r.cover}
                  title={r.title}
                  artist={artistName}
                  year={meta.year ?? r.year}
                  streamPrice={meta.streamPrice}
                  downloadPrice={meta.downloadPrice}
                  purchased={libId ? library.isPurchased(libId) : false}
                  onTitleClick={linkable ? () => openAlbum(key) : undefined}
                  onPlay={linkable ? () => openAlbum(key) : undefined}
                  hideGoToArtist
                />
              </li>
            )
          })}
        </ul>
      ) : (
        // List view — table with the columns the user asked for:
        // image · title · band · recorded · tracks · type.
        // Same `<TableHead>`/`<TableCell>` primitives used by
        // Studio/Music + Orders so visual rhythm carries through.
        // Single-line list table — mirrors Studio/Music chrome:
        // text-xsmall muted headers, text-small body, truncate
        // (no wrapping), border-b rows. Last column (Type) is
        // right-aligned.
        <div className="pt-2">
          <table className="w-full table-fixed">
            {/* PROGRESSIVE DISCLOSURE, in the colgroup as well as the cells.
                A six-column table needs ~440px; the column it sits in is 351px
                on a phone, so the page scrolled sideways instead — the one
                thing a table must not do here, since the scroller is the
                PAGE's and taking it sideways loses the reader's place.

                Hidden with a media query in JS rather than `sm:hidden` on the
                cells: `table-fixed` gives every `<col>` its width whether or
                not its cells render, so a CSS-hidden column still reserves its
                112px. The columns have to not EXIST. Which ones survive is the
                usual order of value — the record, then when it was made, then
                what it is; band and track count are the first to go. */}
            <colgroup>
              <col style={{ width: 64 }} />
              <col />
              {showBand && <col />}
              {showRecorded && <col style={{ width: 112 }} />}
              {showTracks && <col style={{ width: 80 }} />}
              {showType && <col style={{ width: 128 }} />}
              <col style={{ width: 56 }} />
            </colgroup>
            {/* sticky on each <th> (rather than the <thead>) because
                 some browsers/table-fixed combos don't honour sticky
                 on thead. */}
            <thead className="[&_tr]:border-b [&_tr]:border-border [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-background">
              <TableRow>
                <TableHead resizable={false} className="px-2" />
                <TableHead>
                  <SortableHeader
                    label="Title"
                    isActive={sort === "title-az" || sort === "title-za"}
                    dir={sort === "title-az" ? "asc" : sort === "title-za" ? "desc" : null}
                    onClick={() =>
                      setSort(sort === "title-az" ? "title-za" : "title-az")
                    }
                  />
                </TableHead>
                {showBand && <TableHead>Band</TableHead>}
                {showRecorded && (
                <TableHead resizable={false}>
                  <SortableHeader
                    label="Recorded"
                    isActive={sort === "year-desc" || sort === "year-asc"}
                    dir={sort === "year-desc" ? "desc" : sort === "year-asc" ? "asc" : null}
                    onClick={() =>
                      setSort(sort === "year-desc" ? "year-asc" : "year-desc")
                    }
                  />
                </TableHead>
                )}
                {showTracks && (
                <TableHead resizable={false}>
                  <SortableHeader
                    label="Tracks"
                    isActive={sort === "tracks-desc" || sort === "tracks-asc"}
                    dir={sort === "tracks-desc" ? "desc" : sort === "tracks-asc" ? "asc" : null}
                    onClick={() =>
                      setSort(sort === "tracks-desc" ? "tracks-asc" : "tracks-desc")
                    }
                  />
                </TableHead>
                )}
                {showType && <TableHead resizable={false} className="text-right">Type</TableHead>}
                <TableHead resizable={false} className="px-2" />
              </TableRow>
            </thead>
            <TableBody>
              {visible.map(r => {
                const playing = playingId === r.id
                return (
                // - py-1.5 + size-12 cover match SongListItem so a row
                //   in the table reads the same height as a Top Songs
                //   item.
                // - No border between rows; instead a `bg-muted` hover
                //   block applied per-cell so first/last cells can
                //   round their outside corners (tr doesn't clip
                //   border-radius).
                // - Cover renders the same play/wave/pause overlay
                //   states SongListItem uses, so the affordance reads
                //   the same in both list views.
                // - Active (playing) row stays bg-muted at rest so the
                //   current item is marked even without hover.
                <TableRow
                  key={r.id}
                  className={cn(
                    "group/row border-b-0 hover:bg-transparent",
                    "[&>td]:group-hover/row:bg-muted [&>td:first-child]:group-hover/row:rounded-l-md [&>td:last-child]:group-hover/row:rounded-r-md",
                    "[&_td]:py-1.5",
                    playing && "[&>td]:bg-muted [&>td:first-child]:rounded-l-md [&>td:last-child]:rounded-r-md",
                  )}
                >
                  <TableCell className="px-2">
                    <CoverPlayButton
                      src={r.cover}
                      title={r.title}
                      playing={playing}
                      onToggle={() => togglePlay(r.id)}
                      hoverGroup="row"
                    />
                  </TableCell>
                  <TableCell className="text-foreground truncate">
                    <button
                      type="button"
                      onClick={() => openAlbum(slugify(r.title))}
                      className="block w-full min-w-0 text-left outline-none cursor-pointer"
                    >
                      <span className="block truncate link-underline">{r.title}</span>
                      {/* What the dropped columns were carrying, folded into
                          the row that survives. Disclosure, not deletion: the
                          year and the kind are why you scan a discography, and
                          losing them with the column would make the narrow
                          table a worse list rather than a smaller one. */}
                      {!showRecorded && (
                        <span className="block truncate text-xsmall text-muted-foreground tabular-nums">
                          {[r.year, contentTypeConfig[r.type].label].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </button>
                  </TableCell>
                  {showBand && (
                    <TableCell className="text-muted-foreground whitespace-nowrap truncate">
                      {/* Text, not a link: this table is already the
                          artist's page, so there is nowhere to go. */}
                      {r.band ?? artistName}
                    </TableCell>
                  )}
                  {showRecorded && (
                    <TableCell className="text-muted-foreground tabular-nums whitespace-nowrap">
                      {r.year}
                    </TableCell>
                  )}
                  {showTracks && (
                    <TableCell className="text-muted-foreground tabular-nums whitespace-nowrap">
                      {r.tracks}
                    </TableCell>
                  )}
                  {showType && (
                    <TableCell className="text-right">
                      <ContentTypeBadge type={r.type} />
                    </TableCell>
                  )}
                  <TableCell className="px-2">
                    {/* Falafel/kebab menu — same items as the cover
                         card's "More options" menu, behind a plain
                         ghost icon-button trigger that fits a table
                         row. */}
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More options" />}>
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" sideOffset={6}>
                        <AlbumCardMenuItems />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                )
              })}
            </TableBody>
          </table>
        </div>
      )}
    </section>
  )
}

// ─── Top Songs ──────────────────────────────────────────────────────────────
//
// Artist › Top Songs = the shared `SongRail` shell fed artist-wired rows.
// The rows are built once (player / credits / album nav) and used twice: as
// compact rows in the rail, and as full rows on the "Show all" page.

function useTopSongRows(songs: ArtistSong[], compact: boolean, artistName: string, artistCover: string) {
  const { openAlbum } = useMediaNav()
  const player = usePlayer()

  return songs.map(s => (
                  <SongListItem
                    key={s.id}
                    compact={compact}
                    cover={s.cover}
                    title={s.title}
                    album={s.album}
                    year={s.year}
                    duration={s.duration}
                    playing={player.playing && player.playingFrom === artistName && player.track?.title === s.title}
                    onPlay={() => {
                      if (player.playingFrom === artistName && player.track?.title === s.title) { player.toggle(); return }
                      player.play(
                        { title: s.title, artist: artistName, album: s.album, image: s.cover, totalTime: s.duration, artistAvatar: artistCover },
                        artistName,
                      )
                    }}
                    onAlbumClick={hasAlbumDetail(slugify(s.album)) ? () => openAlbum(slugify(s.album)) : undefined}
                    // Artist's own Top Songs → no "Go to artist" (you're here).
                    // The shared song menu (Save / Add to playlist / Go to album
                    // / Credits / Report) builds from the row's handlers.
                    hideGoToArtist
                  />
  ))
}

// "Show all" opens the full list on its own page (`?page=ArtistSongs`), the
// way staging does it: a title, a back chevron to the artist, every song as
// a full row. It was omitted here at first, on the theory that an artist's
// top ten needs no second view — but on a phone the rail shows three songs
// at a time and swiping is the only way to the rest, which is a poor way to
// scan ten. Staging shipped the button first; the prototype follows.
function TopSongsRow({ songs, artistName, artistCover }: { songs: ArtistSong[]; artistName: string; artistCover: string }) {
  const [, setParams] = useSearchParams()
  const rows = useTopSongRows(songs, true, artistName, artistCover)
  const showAll = () => setParams(prev => {
    const next = new URLSearchParams(prev)
    next.set("page", "ArtistSongs")
    return next
  }, { replace: true })
  return <SongRail title="Top Songs" rows={rows} onShowAll={showAll} />
}

/** The "Show all" page for Artist › Top Songs. On phones the title and the
 *  back chevron are the generic mobile header's; on desktop the Topbar
 *  carries the back, so the page prints its own title. */
export function ArtistTopSongsView() {
  const footerNav = useFooterNav()
  const [params] = useSearchParams()
  const profile = getArtistProfile(params.get("artist"))
  const rows = useTopSongRows(profile.topSongs, false, profile.name, profile.cover)
  return (
    <div className="@container mx-auto max-w-[1480px] min-[1920px]:max-w-[1716px] w-full px-page pt-8 pb-12">
      {!footerNav && (
        <div className="mb-6">
          <h1 className="text-2xlarge font-medium text-foreground tracking-tight">Top Songs</h1>
          <p className="text-small text-muted-foreground">{profile.name}</p>
        </div>
      )}
      <ul className="flex flex-col gap-2">
        {rows.map(r => <li key={(r as React.ReactElement).key}>{r}</li>)}
      </ul>
    </div>
  )
}
