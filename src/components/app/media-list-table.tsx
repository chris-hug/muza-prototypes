"use client"

/*
 * Library list tables — the "list mode" alternative to the tile grids on
 * the Albums / Playlists library pages. Same "List Table" chrome as
 * Studio/Music + the artist discography: text-xsmall muted headers,
 * text-small body, single-line truncating cells, per-row hover block,
 * sortable headers, a leading cover thumb and a trailing kebab.
 *
 * Each table takes an already-filtered array + does its own sort. Rows
 * navigate to the detail page (cover + title); the kebab reuses the same
 * context menu as the tile cards.
 */

import { useMemo, useState } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal, Mic, Share, Link2, Check, LayoutGrid, List } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup } from "@/components/ui/toggle-group"
import { BulkActionBar, BulkActionButton } from "@/components/ui/bulk-action-bar"
import { TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AlbumCardMenuItems, PlaylistCardMenuItems } from "@/components/ui/cover-card-menu"
import { MediaListItem } from "@/components/ui/media-list-item"
import { CoverPlayButton } from "@/components/ui/cover-play-button"
import { PurchasedBadge } from "@/components/ui/purchased-badge"
import { useUserLibrary, type SavedSong } from "@/lib/user-library"
import { usePlayer } from "@/lib/player"
import { useMediaNav, slugify } from "@/lib/media-nav"
import { useShare } from "@/lib/use-share"
import { useLibrarySort, compareLibrary, LIBRARY_SORTS, type LibrarySort } from "@/lib/use-library-sort"
import { type LibraryView } from "@/lib/use-library-view"
import { getAlbumDetail, hasAlbumDetail } from "@/lib/album-catalog"
import type { SavedArtist } from "@/components/app/library-artists-view"

// ── Synthetic metadata helpers (prototype) ───────────────────────────
const hashStr = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
// Plausible jazz labels for albums the catalog has no real label for.
const LABEL_POOL = ["Blue Note", "Impulse!", "Verve", "Prestige", "Riverside", "Columbia", "ECM", "Strata-East"]
const labelFor = (key: string, title: string) =>
  getAlbumDetail(key).label ?? LABEL_POOL[hashStr(title) % LABEL_POOL.length]
// Deterministic "added to library" date — stable per title, spread over
// the last few years. Returns a sort key + display string.
function addedInfo(seed: string): { ts: number; text: string } {
  const h = hashStr(seed)
  const year = 2023 + (h % 3)
  const month = h % 12
  const day = 1 + ((h >> 4) % 28)
  return { ts: year * 10000 + month * 100 + day, text: `${MONTHS[month]} ${day}, ${year}` }
}

// ─── Shared bits ─────────────────────────────────────────────────────

function SortHeader({
  label, active, dir, onClick, className,
}: { label: string; active: boolean; dir: "asc" | "desc"; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("flex items-center gap-0.5 min-w-0 overflow-hidden cursor-pointer group/sort select-none", className)}
    >
      <span className={cn("text-xsmall font-normal truncate", active ? "text-foreground" : "text-muted-foreground")}>
        {label}
      </span>
      {active
        ? (dir === "asc"
            ? <ArrowUp className="size-3 shrink-0 text-foreground" />
            : <ArrowDown className="size-3 shrink-0 text-foreground" />)
        : <ArrowUpDown className="size-3 shrink-0 text-muted-foreground opacity-0 group-hover/sort:opacity-50 transition-opacity" />}
    </button>
  )
}

// Row chrome: no per-row border; a `bg-muted` block on hover (or when
// selected) with the first/last cells rounding their outer corners (tr
// can't clip radius).
const rowCls = (selected: boolean) => cn(
  "group/row border-b-0 hover:bg-transparent [&_td]:py-1.5",
  "[&>td]:group-hover/row:bg-muted [&>td:first-child]:group-hover/row:rounded-l-md [&>td:last-child]:group-hover/row:rounded-r-md",
  selected && "[&>td]:bg-muted [&>td:first-child]:rounded-l-md [&>td:last-child]:rounded-r-md",
)

const HEAD_CLS = "[&_tr]:border-b [&_tr]:border-border [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-background"

// ── Multi-select ─────────────────────────────────────────────────────

// Per-row checkbox cell — hidden until the row is hovered or selected
// (matches Studio/Music + Shop).
function SelectCell({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    // `px-0` so the centered checkbox lands at the true cell centre.
    // (TableCell's `[&:has([role=checkbox])]:pr-0` would otherwise zero
    // only the right padding and push it off-centre vs the header.)
    <TableCell className="px-0 w-10">
      <div className={cn(
        "flex items-center justify-center transition-opacity",
        checked ? "opacity-100" : "opacity-0 group-hover/row:opacity-100",
      )}>
        <Checkbox checked={checked} onCheckedChange={onToggle} onClick={e => e.stopPropagation()} className="after:hidden" />
      </div>
    </TableCell>
  )
}

function SelectAllHead({ allSelected, someSelected, onToggle }: {
  allSelected: boolean; someSelected: boolean; onToggle: () => void
}) {
  return (
    <TableHead resizable={false} className="px-0 w-10">
      {/* Same centering wrapper as the row cells so the column of
           checkboxes lines up vertically. */}
      <div className="flex items-center justify-center">
        <Checkbox checked={allSelected} indeterminate={!allSelected && someSelected} onCheckedChange={onToggle} className="after:hidden" />
      </div>
    </TableHead>
  )
}

const linkCell =
  "text-left hover:underline focus-visible:underline underline-offset-[3px] [text-decoration-thickness:1px] [text-decoration-skip-ink:auto] outline-none cursor-pointer"

// 48px square cover thumb that opens the detail page.
function CoverThumb({ src, alt, onClick }: { src: string; alt: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={alt} className="block size-12 shrink-0 rounded-xs overflow-hidden outline-none focus-visible:ring-3 focus-visible:ring-ring/50 cursor-pointer">
      <img src={src} alt="" draggable={false} className="size-full object-cover" />
    </button>
  )
}

// 2×2 composite thumb for playlists, opening the detail page.
function CompositeThumb({ covers, alt, onClick }: { covers: string[]; alt: string; onClick: () => void }) {
  const four = [0, 1, 2, 3].map(i => covers[i % Math.max(1, covers.length)])
  return (
    <button type="button" onClick={onClick} aria-label={alt} className="grid size-12 shrink-0 grid-cols-2 grid-rows-2 rounded-xs overflow-hidden outline-none focus-visible:ring-3 focus-visible:ring-ring/50 cursor-pointer">
      {four.map((src, i) => (
        <img key={i} src={src} alt="" draggable={false} className="size-full object-cover" />
      ))}
    </button>
  )
}

// ─── Albums ──────────────────────────────────────────────────────────

export interface AlbumRow {
  id:             string
  cover:          string
  title:          string
  artist:         string
  year?:          number
  streamPrice?:   string
  downloadPrice?: string
}

type AlbumSort =
  | "title-az" | "title-za" | "artist-az" | "artist-za"
  | "label-az" | "label-za" | "year-desc" | "year-asc"
  | "added-desc" | "added-asc"

export function AlbumListTable({ albums }: { albums: AlbumRow[] }) {
  const library = useUserLibrary()
  const { openAlbum, openArtist } = useMediaNav()
  const [sort, setSort] = useState<AlbumSort>("added-desc")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Decorate with synthetic label + added date once, then sort.
  const rows = useMemo(() => {
    const decorated = albums.map(a => {
      const key = slugify(a.title)
      return { ...a, key, label: labelFor(key, a.title), added: addedInfo(a.title) }
    })
    decorated.sort((a, b) => {
      switch (sort) {
        case "title-za":   return b.title.localeCompare(a.title)
        case "artist-az":  return a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title)
        case "artist-za":  return b.artist.localeCompare(a.artist) || a.title.localeCompare(b.title)
        case "label-az":   return a.label.localeCompare(b.label) || a.title.localeCompare(b.title)
        case "label-za":   return b.label.localeCompare(a.label) || a.title.localeCompare(b.title)
        case "year-desc":  return (b.year ?? 0) - (a.year ?? 0)
        case "year-asc":   return (a.year ?? 0) - (b.year ?? 0)
        case "added-asc":  return a.added.ts - b.added.ts
        case "added-desc": return b.added.ts - a.added.ts
        default:           return a.title.localeCompare(b.title)
      }
    })
    return decorated
  }, [albums, sort])

  const allSelected  = rows.length > 0 && rows.every(a => selectedIds.has(a.id))
  const someSelected = rows.some(a => selectedIds.has(a.id))
  const toggle = (id: string) => setSelectedIds(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
  const toggleAll = () => setSelectedIds(allSelected ? new Set() : new Set(rows.map(a => a.id)))
  const clear = () => setSelectedIds(new Set())

  return (
    <>
    <table className="w-full table-fixed">
      <colgroup>
        <col style={{ width: 40 }} />
        <col style={{ width: 64 }} />
        <col />
        <col />
        <col style={{ width: 150 }} />
        <col style={{ width: 72 }} />
        <col style={{ width: 132 }} />
        <col style={{ width: 96 }} />
        <col style={{ width: 56 }} />
      </colgroup>
      <thead className={HEAD_CLS}>
        <TableRow>
          <SelectAllHead allSelected={allSelected} someSelected={someSelected} onToggle={toggleAll} />
          <TableHead resizable={false} className="px-2" />
          <TableHead>
            <SortHeader label="Title" active={sort.startsWith("title")} dir={sort === "title-za" ? "desc" : "asc"}
              onClick={() => setSort(sort === "title-az" ? "title-za" : "title-az")} />
          </TableHead>
          <TableHead>
            <SortHeader label="Artist" active={sort.startsWith("artist")} dir={sort === "artist-za" ? "desc" : "asc"}
              onClick={() => setSort(sort === "artist-az" ? "artist-za" : "artist-az")} />
          </TableHead>
          <TableHead resizable={false}>
            <SortHeader label="Label" active={sort.startsWith("label")} dir={sort === "label-za" ? "desc" : "asc"}
              onClick={() => setSort(sort === "label-az" ? "label-za" : "label-az")} />
          </TableHead>
          <TableHead resizable={false}>
            <SortHeader label="Year" active={sort.startsWith("year")} dir={sort === "year-asc" ? "asc" : "desc"}
              onClick={() => setSort(sort === "year-desc" ? "year-asc" : "year-desc")} />
          </TableHead>
          <TableHead resizable={false}>
            <SortHeader label="Added" active={sort.startsWith("added")} dir={sort === "added-asc" ? "asc" : "desc"}
              onClick={() => setSort(sort === "added-desc" ? "added-asc" : "added-desc")} />
          </TableHead>
          <TableHead resizable={false} className="text-right">Price</TableHead>
          <TableHead resizable={false} className="px-2" />
        </TableRow>
      </thead>
      <TableBody>
        {rows.map(a => {
          const purchased = library.isPurchased(a.id)
          return (
            <TableRow key={a.id} className={rowCls(selectedIds.has(a.id))}>
              <SelectCell checked={selectedIds.has(a.id)} onToggle={() => toggle(a.id)} />
              <TableCell className="px-2">
                <CoverThumb src={a.cover} alt={a.title} onClick={() => openAlbum(a.key)} />
              </TableCell>
              <TableCell className="text-small text-foreground whitespace-nowrap truncate">
                <button type="button" onClick={() => openAlbum(a.key)} className={linkCell}>{a.title}</button>
              </TableCell>
              <TableCell className="text-small text-muted-foreground whitespace-nowrap truncate">
                <button type="button" onClick={() => openArtist(slugify(a.artist))} className={linkCell}>{a.artist}</button>
              </TableCell>
              <TableCell className="text-small text-muted-foreground whitespace-nowrap truncate">
                {a.label}
              </TableCell>
              <TableCell className="text-small text-muted-foreground tabular-nums whitespace-nowrap">
                {a.year ?? "—"}
              </TableCell>
              <TableCell className="text-small text-muted-foreground tabular-nums whitespace-nowrap">
                {a.added.text}
              </TableCell>
              <TableCell className="text-right text-small text-muted-foreground whitespace-nowrap tabular-nums">
                {purchased
                  ? <span className="inline-flex justify-end"><PurchasedBadge /></span>
                  : a.streamPrice ?? "Free"}
              </TableCell>
              <TableCell className="px-2">
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More options" />}>
                    <MoreHorizontal />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={6}>
                    <AlbumCardMenuItems
                      shareTitle={a.title}
                      shareUrl={`/?page=Album&album=${a.key}`}
                      onGoToArtist={() => openArtist(slugify(a.artist))}
                      hideGoToAlbum
                      inLibrary
                      onRemove={() => library.remove(a.id)}
                    />
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </table>
    <BulkActionBar count={selectedIds.size} onClear={clear}>
      <BulkActionButton onClick={() => { selectedIds.forEach(id => library.remove(id)); clear() }}>
        Remove from library
      </BulkActionButton>
    </BulkActionBar>
    </>
  )
}

// ─── Songs ───────────────────────────────────────────────────────────
// Same "List Table" chrome as Albums, with an Album column. Songs have no
// detail page, so the cover/title click PLAYS the track (global player)
// instead of navigating; artist + album cells link to their pages.

type SongSort =
  | "title-az" | "title-za" | "artist-az" | "artist-za"
  | "album-az" | "album-za" | "duration-asc" | "duration-desc"

const FROM_SONGS = "Library · Songs"
const durationSecs = (d?: string) => {
  if (!d) return 0
  const [m, s] = d.split(":").map(Number)
  return (m || 0) * 60 + (s || 0)
}

export function SongListTable({ songs }: { songs: SavedSong[] }) {
  const library = useUserLibrary()
  const player  = usePlayer()
  const { openAlbum, openArtist } = useMediaNav()
  const [sort, setSort] = useState<SongSort>("title-az")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const rows = useMemo(() => {
    const next = [...songs]
    next.sort((a, b) => {
      switch (sort) {
        case "title-za":      return b.title.localeCompare(a.title)
        case "artist-az":     return (a.artist ?? "").localeCompare(b.artist ?? "") || a.title.localeCompare(b.title)
        case "artist-za":     return (b.artist ?? "").localeCompare(a.artist ?? "") || a.title.localeCompare(b.title)
        case "album-az":      return (a.album ?? "").localeCompare(b.album ?? "") || a.title.localeCompare(b.title)
        case "album-za":      return (b.album ?? "").localeCompare(a.album ?? "") || a.title.localeCompare(b.title)
        case "duration-asc":  return durationSecs(a.duration) - durationSecs(b.duration)
        case "duration-desc": return durationSecs(b.duration) - durationSecs(a.duration)
        default:              return a.title.localeCompare(b.title)
      }
    })
    return next
  }, [songs, sort])

  const allSelected  = rows.length > 0 && rows.every(s => selectedIds.has(s.id))
  const someSelected = rows.some(s => selectedIds.has(s.id))
  const toggle = (id: string) => setSelectedIds(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
  const toggleAll = () => setSelectedIds(allSelected ? new Set() : new Set(rows.map(s => s.id)))
  const clear = () => setSelectedIds(new Set())

  const play = (s: SavedSong) => {
    if (player.playingFrom === FROM_SONGS && player.track?.title === s.title) { player.toggle(); return }
    player.play(
      { title: s.title, artist: s.artist ?? "", album: s.album ?? "", image: s.cover ?? "", totalTime: s.duration },
      FROM_SONGS,
    )
  }

  return (
    <>
    <table className="w-full table-fixed">
      <colgroup>
        <col style={{ width: 40 }} />
        <col style={{ width: 64 }} />
        <col />
        <col />
        <col />
        <col style={{ width: 80 }} />
        <col style={{ width: 56 }} />
      </colgroup>
      <thead className={HEAD_CLS}>
        <TableRow>
          <SelectAllHead allSelected={allSelected} someSelected={someSelected} onToggle={toggleAll} />
          <TableHead resizable={false} className="px-2" />
          <TableHead>
            <SortHeader label="Title" active={sort.startsWith("title")} dir={sort === "title-za" ? "desc" : "asc"}
              onClick={() => setSort(sort === "title-az" ? "title-za" : "title-az")} />
          </TableHead>
          <TableHead>
            <SortHeader label="Artist" active={sort.startsWith("artist")} dir={sort === "artist-za" ? "desc" : "asc"}
              onClick={() => setSort(sort === "artist-az" ? "artist-za" : "artist-az")} />
          </TableHead>
          <TableHead>
            <SortHeader label="Album" active={sort.startsWith("album")} dir={sort === "album-za" ? "desc" : "asc"}
              onClick={() => setSort(sort === "album-az" ? "album-za" : "album-az")} />
          </TableHead>
          <TableHead resizable={false} className="text-right">
            <SortHeader label="Time" active={sort.startsWith("duration")} dir={sort === "duration-asc" ? "asc" : "desc"}
              onClick={() => setSort(sort === "duration-desc" ? "duration-asc" : "duration-desc")} />
          </TableHead>
          <TableHead resizable={false} className="px-2" />
        </TableRow>
      </thead>
      <TableBody>
        {rows.map(s => {
          const linkAlbum = s.album && hasAlbumDetail(slugify(s.album))
          const isThis = player.playing && player.playingFrom === FROM_SONGS && player.track?.title === s.title
          return (
            <TableRow key={s.id} className={rowCls(selectedIds.has(s.id))}>
              <SelectCell checked={selectedIds.has(s.id)} onToggle={() => toggle(s.id)} />
              <TableCell className="px-2">
                {/* Cover doubles as the play/pause button — hover (anywhere
                     on the row) reveals Play; the active row shows the wave /
                     Pause. */}
                <CoverPlayButton
                  src={s.cover ?? ""}
                  title={s.title}
                  playing={isThis}
                  onToggle={() => play(s)}
                  hoverGroup="row"
                />
              </TableCell>
              <TableCell className="text-small text-foreground whitespace-nowrap truncate">
                <button type="button" onClick={() => play(s)} className={linkCell}>{s.title}</button>
              </TableCell>
              <TableCell className="text-small text-muted-foreground whitespace-nowrap truncate">
                {s.artist
                  ? <button type="button" onClick={() => openArtist(slugify(s.artist!))} className={linkCell}>{s.artist}</button>
                  : "—"}
              </TableCell>
              <TableCell className="text-small text-muted-foreground whitespace-nowrap truncate">
                {s.album
                  ? (linkAlbum
                      ? <button type="button" onClick={() => openAlbum(slugify(s.album!))} className={linkCell}>{s.album}</button>
                      : s.album)
                  : "—"}
              </TableCell>
              <TableCell className="text-right text-small text-muted-foreground tabular-nums whitespace-nowrap">
                {s.duration ?? "—"}
              </TableCell>
              <TableCell className="px-2">
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More options" />}>
                    <MoreHorizontal />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={6}>
                    {s.artist && <DropdownMenuItem onClick={() => openArtist(slugify(s.artist!))}><Mic />Go to artist</DropdownMenuItem>}
                    <DropdownMenuItem variant="destructive" onClick={() => library.removeItem("song", s.id)}>
                      Remove from library
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </table>
    <BulkActionBar count={selectedIds.size} onClear={clear}>
      <BulkActionButton onClick={() => { selectedIds.forEach(id => library.removeItem("song", id)); clear() }}>
        Remove from library
      </BulkActionButton>
    </BulkActionBar>
    </>
  )
}

// ── Mobile nav rows ──────────────────────────────────────────────────
// The phone alternative to the wide sortable tables: a stack of
// MediaListItem nav rows (tap → detail; kebab reuses the same menus).
// Single-row components are shared by the per-type lists AND the
// combined "All" list, so the menu wiring lives in one place.

export function MobileAlbumRow({ album: a }: { album: AlbumRow }) {
  const library = useUserLibrary()
  const { openAlbum, openArtist } = useMediaNav()
  const key = slugify(a.title)
  return (
    <MediaListItem
      type="album"
      cover={a.cover}
      title={a.title}
      subtitle={a.artist}
      meta={a.year ? String(a.year) : undefined}
      onOpen={() => openAlbum(key)}
      onSubtitleClick={() => openArtist(slugify(a.artist))}
      menuItems={
        <AlbumCardMenuItems
          shareTitle={a.title}
          shareUrl={`/?page=Album&album=${key}`}
          onGoToArtist={() => openArtist(slugify(a.artist))}
          hideGoToAlbum
          inLibrary
          onRemove={() => library.remove(a.id)}
        />
      }
    />
  )
}

export function MobilePlaylistRow({ playlist: p }: { playlist: PlaylistRow }) {
  const { openPlaylist, openArtist } = useMediaNav()
  const key = slugify(p.title)
  const owner = p.owned ? "You" : (p.owner ?? "—")
  return (
    <MediaListItem
      type="playlist"
      covers={p.covers}
      title={p.title}
      subtitle={owner}
      meta={`${p.songCount} Songs`}
      onOpen={() => openPlaylist(key)}
      onSubtitleClick={p.owned ? undefined : () => openArtist(slugify(owner))}
      menuItems={
        <PlaylistCardMenuItems
          owned={p.owned}
          inLibrary={!p.owned}
          shareTitle={p.title}
          shareUrl={`/?page=Playlist&playlist=${key}`}
          onGoToOwner={() => openArtist(slugify(owner))}
          hideGoToPlaylist
        />
      }
    />
  )
}

export function MobileArtistRow({ artist: ar }: { artist: SavedArtist }) {
  const { openArtist } = useMediaNav()
  const open = () => openArtist(slugify(ar.name))
  const { canNativeShare, copyLink, nativeShare } = useShare({ title: ar.name })
  return (
    <MediaListItem
      type="artist"
      cover={ar.image}
      title={ar.name}
      onOpen={open}
      menuItems={
        <>
          <DropdownMenuItem onClick={open}><Mic />Go to artist</DropdownMenuItem>
          {canNativeShare && <DropdownMenuItem onClick={nativeShare}><Share />Share…</DropdownMenuItem>}
          <DropdownMenuItem onClick={copyLink}><Link2 />Copy link</DropdownMenuItem>
        </>
      }
    />
  )
}

export function AlbumMobileList({ albums }: { albums: AlbumRow[] }) {
  return (
    <ul className="flex flex-col gap-1">
      {albums.map(a => <li key={a.id}><MobileAlbumRow album={a} /></li>)}
    </ul>
  )
}

export function ArtistMobileList({ artists }: { artists: SavedArtist[] }) {
  return (
    <ul className="flex flex-col gap-1">
      {artists.map(a => <li key={a.id}><MobileArtistRow artist={a} /></li>)}
    </ul>
  )
}

// One merged, sorted list of mixed library items. Shared by the "All"
// list AND the "All" grid so both render in the same order.
export type LibraryItem =
  | { kind: "album";    key: string; title: string; album: AlbumRow }
  | { kind: "playlist"; key: string; title: string; playlist: PlaylistRow }
  | { kind: "artist";   key: string; title: string; artist: SavedArtist }

export function mergeLibraryItems(
  albums: AlbumRow[], playlists: PlaylistRow[], artists: SavedArtist[], sort: LibrarySort,
): LibraryItem[] {
  const items: LibraryItem[] = [
    ...albums.map(a => ({ kind: "album" as const,    key: `al-${a.id}`, title: a.title, album: a })),
    ...playlists.map(p => ({ kind: "playlist" as const, key: `pl-${p.id}`, title: p.title, playlist: p })),
    ...artists.map(ar => ({ kind: "artist" as const,  key: `ar-${ar.id}`, title: ar.name, artist: ar })),
  ]
  return items.sort(compareLibrary(sort, it => it.title))
}

// Combined "All" list — albums + playlists + artists merged into one
// list, ordered by the shared library sort so no single type clumps.
export function LibraryAllMobileList({ albums, playlists, artists }: {
  albums: AlbumRow[]
  playlists: PlaylistRow[]
  artists: SavedArtist[]
}) {
  const [sort] = useLibrarySort()
  const items = mergeLibraryItems(albums, playlists, artists, sort)
  return (
    <ul className="flex flex-col gap-1">
      {items.map(it => (
        <li key={it.key}>
          {it.kind === "album"    && <MobileAlbumRow album={it.album} />}
          {it.kind === "playlist" && <MobilePlaylistRow playlist={it.playlist} />}
          {it.kind === "artist"   && <MobileArtistRow artist={it.artist} />}
        </li>
      ))}
    </ul>
  )
}

// Shared grid/list view switch for the library toolbars.
export function LibraryViewToggle({ value, onChange }: {
  value: LibraryView
  onChange: (v: LibraryView) => void
}) {
  return (
    <ToggleGroup
      size="sm"
      value={[value]}
      onValueChange={(v) => { if (v[0]) onChange(v[0] as LibraryView) }}
      aria-label="View mode"
    >
      <Toggle value="grid" aria-label="Tile view"><LayoutGrid className="size-3.5" /></Toggle>
      <Toggle value="list" aria-label="List view"><List className="size-3.5" /></Toggle>
    </ToggleGroup>
  )
}

// Sort control for the mobile library toolbars. Reads/writes the shared
// `useLibrarySort` choice, so it stays consistent across every library
// page (All / Albums / Playlists / Artists).
export function LibrarySortMenu() {
  const [sort, setSort] = useLibrarySort()
  const current = LIBRARY_SORTS.find(s => s.value === sort)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground" />}>
        <ArrowUpDown />
        <span className="text-foreground">{current?.label}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6}>
        {LIBRARY_SORTS.map(s => (
          <DropdownMenuItem key={s.value} onClick={() => setSort(s.value)}>
            {s.label}
            {s.value === sort && <Check className="ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Playlists ───────────────────────────────────────────────────────

export interface PlaylistRow {
  id:        string
  title:     string
  covers:    string[]
  songCount: number
  owner?:    string
  owned?:    boolean
}

type PlaylistSort = "title-az" | "title-za" | "owner-az" | "owner-za" | "songs-desc" | "songs-asc"

export function PlaylistListTable({ playlists }: { playlists: PlaylistRow[] }) {
  const { openPlaylist, openArtist } = useMediaNav()
  const [sort, setSort] = useState<PlaylistSort>("title-az")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const ownerOf = (p: PlaylistRow) => p.owned ? "You" : (p.owner ?? "—")

  const rows = useMemo(() => {
    const s = [...playlists]
    s.sort((a, b) => {
      switch (sort) {
        case "title-za":  return b.title.localeCompare(a.title)
        case "owner-az":  return ownerOf(a).localeCompare(ownerOf(b)) || a.title.localeCompare(b.title)
        case "owner-za":  return ownerOf(b).localeCompare(ownerOf(a)) || a.title.localeCompare(b.title)
        case "songs-desc": return b.songCount - a.songCount
        case "songs-asc":  return a.songCount - b.songCount
        default:           return a.title.localeCompare(b.title)
      }
    })
    return s
  }, [playlists, sort])

  const allSelected  = rows.length > 0 && rows.every(p => selectedIds.has(p.id))
  const someSelected = rows.some(p => selectedIds.has(p.id))
  const toggle = (id: string) => setSelectedIds(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
  const toggleAll = () => setSelectedIds(allSelected ? new Set() : new Set(rows.map(p => p.id)))
  const clear = () => setSelectedIds(new Set())

  return (
    <>
    <table className="w-full table-fixed">
      <colgroup>
        <col style={{ width: 40 }} />
        <col style={{ width: 64 }} />
        <col />
        <col />
        <col style={{ width: 96 }} />
        <col style={{ width: 56 }} />
      </colgroup>
      <thead className={HEAD_CLS}>
        <TableRow>
          <SelectAllHead allSelected={allSelected} someSelected={someSelected} onToggle={toggleAll} />
          <TableHead resizable={false} className="px-2" />
          <TableHead>
            <SortHeader label="Title" active={sort.startsWith("title")} dir={sort === "title-za" ? "desc" : "asc"}
              onClick={() => setSort(sort === "title-az" ? "title-za" : "title-az")} />
          </TableHead>
          <TableHead>
            <SortHeader label="Owner" active={sort.startsWith("owner")} dir={sort === "owner-za" ? "desc" : "asc"}
              onClick={() => setSort(sort === "owner-az" ? "owner-za" : "owner-az")} />
          </TableHead>
          <TableHead resizable={false} className="text-right">
            <SortHeader label="Songs" active={sort.startsWith("songs")} dir={sort === "songs-asc" ? "asc" : "desc"}
              onClick={() => setSort(sort === "songs-desc" ? "songs-asc" : "songs-desc")} className="justify-end ml-auto" />
          </TableHead>
          <TableHead resizable={false} className="px-2" />
        </TableRow>
      </thead>
      <TableBody>
        {rows.map(p => {
          const key = slugify(p.title)
          const owner = ownerOf(p)
          return (
            <TableRow key={p.id} className={rowCls(selectedIds.has(p.id))}>
              <SelectCell checked={selectedIds.has(p.id)} onToggle={() => toggle(p.id)} />
              <TableCell className="px-2">
                <CompositeThumb covers={p.covers} alt={p.title} onClick={() => openPlaylist(key)} />
              </TableCell>
              <TableCell className="text-small text-foreground whitespace-nowrap truncate">
                <button type="button" onClick={() => openPlaylist(key)} className={linkCell}>{p.title}</button>
              </TableCell>
              <TableCell className="text-small text-muted-foreground whitespace-nowrap truncate">
                {p.owned
                  ? owner
                  : <button type="button" onClick={() => openArtist(slugify(owner))} className={linkCell}>{owner}</button>}
              </TableCell>
              <TableCell className="text-right text-small text-muted-foreground tabular-nums whitespace-nowrap">
                {p.songCount}
              </TableCell>
              <TableCell className="px-2">
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More options" />}>
                    <MoreHorizontal />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={6}>
                    <PlaylistCardMenuItems
                      owned={p.owned}
                      inLibrary={!p.owned}
                      shareTitle={p.title}
                      shareUrl={`/?page=Playlist&playlist=${key}`}
                      onGoToOwner={() => openArtist(slugify(owner))}
                      hideGoToPlaylist
                    />
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </table>
    <BulkActionBar count={selectedIds.size} onClear={clear}>
      <BulkActionButton onClick={clear}>Remove from library</BulkActionButton>
    </BulkActionBar>
    </>
  )
}

// Mobile list — phone alternative to PlaylistListTable.
export function PlaylistMobileList({ playlists }: { playlists: PlaylistRow[] }) {
  return (
    <ul className="flex flex-col gap-1">
      {playlists.map(p => <li key={p.id}><MobilePlaylistRow playlist={p} /></li>)}
    </ul>
  )
}
