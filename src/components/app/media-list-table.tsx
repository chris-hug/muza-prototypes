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

import { useMemo, useState, type ReactNode } from "react"
import { ArrowUpDown, MoreHorizontal, Mic, Share, Link2, Check, LayoutGrid, List, Plus, Table2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup } from "@/components/ui/toggle-group"
import { BulkActionBar, BulkActionButton } from "@/components/ui/bulk-action-bar"
import { TableBody, TableCell, TableHead, TableRow, SortHeader } from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlbumCardMenuItems, PlaylistCardMenuItems } from "@/components/ui/cover-card-menu"
import { MediaListItem } from "@/components/ui/media-list-item"
import { SongMenuItems } from "@/components/ui/song-list-item"
import { CoverPlayButton } from "@/components/ui/cover-play-button"
import { PurchasedBadge } from "@/components/ui/purchased-badge"
import { LocalBadge } from "@/components/ui/local-badge"
import { DetailMenuItems } from "@/components/ui/detail-more-button"
import { useLocalActions } from "@/lib/use-local-actions"
import { localPlayingFrom, type LocalAlbum, type LocalTrack } from "@/lib/local-library"
import { LocalSongMenuItems } from "@/components/app/local-song-rows"
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

/* `SortHeader` now comes from `ui/table` — this file used to carry its own
   copy, as did four other views. */

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
  "text-left link-underline outline-none cursor-pointer"

// 48px square cover thumb that opens the detail page.
function CoverThumb({ src, alt, onClick }: { src: string; alt: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={alt} className="block size-12 shrink-0 rounded-xs overflow-hidden outline-none focus-ring cursor-pointer art-edge">
      <img src={src} alt="" draggable={false} className="size-full object-cover" />
    </button>
  )
}

// 2×2 composite thumb for playlists, opening the detail page.
function CompositeThumb({ covers, alt, onClick }: { covers: string[]; alt: string; onClick: () => void }) {
  const four = [0, 1, 2, 3].map(i => covers[i % Math.max(1, covers.length)])
  return (
    <button type="button" onClick={onClick} aria-label={alt} className="grid size-12 shrink-0 grid-cols-2 grid-rows-2 rounded-xs overflow-hidden outline-none focus-ring cursor-pointer art-edge">
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
  /** Set when the album is the listener's own files, not a catalog release
   *  (see local-library). The row then opens the local page, fills the
   *  Source column, and carries the local menu. */
  local?:         LocalAlbum
}

type AlbumSort =
  | "title-az" | "title-za" | "artist-az" | "artist-za"
  | "label-az" | "label-za" | "year-desc" | "year-asc"
  | "added-desc" | "added-asc"

export function AlbumListTable({ albums }: { albums: AlbumRow[] }) {
  const library = useUserLibrary()
  const { openAlbum, openArtist } = useMediaNav()
  const localActions = useLocalActions()
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

  // The columns follow what the rows are. Label and Price describe a
  // release on muza, so they exist only while a catalog row does; a local
  // row leaves them empty (a "Local" badge under "Price" read as a price).
  // Source exists only while a local row does: the "Local" badge, where the
  // files live and their format, and "muza" for a catalog row — an empty
  // cell would read as unknown, when the source is known. The badge is on
  // every local row, mixed or not: the same label the cards and lists
  // carry, so a local item looks the same in every view.
  const hasCatalog = rows.some(a => !a.local)
  const hasLocal   = rows.some(a => a.local)
  // Label gives way to Source when both would show: at a 1280 window the two
  // fixed columns left Title and Artist ~50px each ("The B…", "Char…"). With
  // local rows in the table, where an album comes from is the question the
  // table answers; the label is on the album page. Owned (catalog only)
  // keeps it.
  const showLabel  = hasCatalog && !hasLocal

  return (
    <>
    <table className="w-full table-fixed">
      <colgroup>
        <col style={{ width: 40 }} />
        <col style={{ width: 64 }} />
        <col />
        <col />
        {showLabel && <col style={{ width: 150 }} />}
        <col style={{ width: 72 }} />
        <col style={{ width: 132 }} />
        {hasLocal && <col style={{ width: 210 }} />}
        {hasCatalog && <col style={{ width: 96 }} />}
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
          {showLabel && <TableHead resizable={false}>
            <SortHeader label="Label" active={sort.startsWith("label")} dir={sort === "label-za" ? "desc" : "asc"}
              onClick={() => setSort(sort === "label-az" ? "label-za" : "label-az")} />
          </TableHead>}
          <TableHead resizable={false}>
            <SortHeader label="Year" active={sort.startsWith("year")} dir={sort === "year-asc" ? "asc" : "desc"}
              onClick={() => setSort(sort === "year-desc" ? "year-asc" : "year-desc")} />
          </TableHead>
          <TableHead resizable={false}>
            <SortHeader label="Added" active={sort.startsWith("added")} dir={sort === "added-asc" ? "asc" : "desc"}
              onClick={() => setSort(sort === "added-desc" ? "added-asc" : "added-desc")} />
          </TableHead>
          {hasLocal && <TableHead resizable={false}>Source</TableHead>}
          {hasCatalog && <TableHead resizable={false} className="text-right">Price</TableHead>}
          <TableHead resizable={false} className="px-2" />
        </TableRow>
      </thead>
      <TableBody>
        {rows.map(a => {
          const purchased = library.isPurchased(a.id)
          if (a.local) {
            // Local files: where they live and their format in Source, no
            // label and no price (the tags rarely carry a label; there is
            // nothing to buy), and the artist links only when the files
            // matched a catalog release.
            const l = localActions(a.local)
            return (
              <TableRow key={a.id} className={cn(rowCls(selectedIds.has(a.id)), !l.available && "opacity-60")}>
                <SelectCell checked={selectedIds.has(a.id)} onToggle={() => toggle(a.id)} />
                <TableCell className="px-2">
                  <CoverThumb src={a.cover} alt={a.title} onClick={l.open} />
                </TableCell>
                <TableCell className="text-foreground whitespace-nowrap truncate">
                  <button type="button" onClick={l.open} className={linkCell}>{a.title}</button>
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap truncate">
                  {l.onGoToArtist
                    ? <button type="button" onClick={l.onGoToArtist} className={linkCell}>{a.artist}</button>
                    : a.artist}
                </TableCell>
                {showLabel && <TableCell />}
                <TableCell className="text-muted-foreground tabular-nums whitespace-nowrap">{a.year ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground tabular-nums whitespace-nowrap">{a.added.text}</TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap truncate">
                  <span className="inline-flex items-center gap-1.5 max-w-full min-w-0">
                    <LocalBadge className="shrink-0" />
                    <span className="truncate">{l.source.name} · {l.detail}</span>
                  </span>
                </TableCell>
                {hasCatalog && <TableCell />}
                <TableCell className="px-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More options" />}>
                      <MoreHorizontal />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={6}>
                      <DetailMenuItems kind="album" title={a.title} {...l.menu} />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          }
          return (
            <TableRow key={a.id} className={rowCls(selectedIds.has(a.id))}>
              <SelectCell checked={selectedIds.has(a.id)} onToggle={() => toggle(a.id)} />
              <TableCell className="px-2">
                <CoverThumb src={a.cover} alt={a.title} onClick={() => openAlbum(a.key)} />
              </TableCell>
              <TableCell className="text-foreground whitespace-nowrap truncate">
                <button type="button" onClick={() => openAlbum(a.key)} className={linkCell}>{a.title}</button>
              </TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap truncate">
                <button type="button" onClick={() => openArtist(slugify(a.artist))} className={linkCell}>{a.artist}</button>
              </TableCell>
              {showLabel && <TableCell className="text-muted-foreground whitespace-nowrap truncate">
                {a.label}
              </TableCell>}
              <TableCell className="text-muted-foreground tabular-nums whitespace-nowrap">
                {a.year ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground tabular-nums whitespace-nowrap">
                {a.added.text}
              </TableCell>
              {hasLocal && <TableCell className="text-muted-foreground whitespace-nowrap">muza</TableCell>}
              <TableCell className="text-right text-muted-foreground whitespace-nowrap tabular-nums">
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

/** A song row. `local` is set for a track from the listener's own files:
 *  it plays from its local album, fills the Source column and carries the
 *  local song menu (see the Albums table for the column rule). */
export type SongRow = SavedSong & {
  local?: { album: LocalAlbum; track: LocalTrack }
  /** The song's album is bought: "Owned" under the title. The table has no
   *  Price column for it to sit in, as the Albums table does — a track is
   *  not sold on its own — so it marks the title, as the list row does. */
  owned?: boolean
}

export function SongListTable({ songs }: { songs: SongRow[] }) {
  const library = useUserLibrary()
  const player  = usePlayer()
  const { openAlbum, openArtist } = useMediaNav()
  const localActions = useLocalActions()
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

  // Same column rule as the Albums table: Source only while a local row
  // exists, with the "Local" badge on every local row.
  const hasLocal = rows.some(s => s.local)

  const play = (s: SongRow) => {
    if (s.local) {
      const from = localPlayingFrom(s.local.album)
      if (player.playingFrom === from && player.track?.title === s.title) { player.toggle(); return }
      localActions(s.local.album).play(s.local.track)
      return
    }
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
        {hasLocal && <col style={{ width: 210 }} />}
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
          {hasLocal && <TableHead resizable={false}>Source</TableHead>}
          <TableHead resizable={false} className="text-right">
            <SortHeader label="Time" active={sort.startsWith("duration")} dir={sort === "duration-asc" ? "asc" : "desc"}
              onClick={() => setSort(sort === "duration-desc" ? "duration-asc" : "duration-desc")} />
          </TableHead>
          <TableHead resizable={false} className="px-2" />
        </TableRow>
      </thead>
      <TableBody>
        {rows.map(s => {
          const l = s.local ? localActions(s.local.album) : undefined
          const linkAlbum = !l && s.album && hasAlbumDetail(slugify(s.album))
          const onAlbum   = l ? l.open : linkAlbum ? () => openAlbum(slugify(s.album!)) : undefined
          const onArtist  = l ? l.onGoToArtist : s.artist ? () => openArtist(slugify(s.artist!)) : undefined
          const from      = s.local ? localPlayingFrom(s.local.album) : FROM_SONGS
          const isThis = player.playing && player.playingFrom === from && player.track?.title === s.title
          return (
            <TableRow key={s.id} className={cn(rowCls(selectedIds.has(s.id)), l && !l.available && "opacity-60")}>
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
              <TableCell className="text-foreground whitespace-nowrap truncate">
                {s.owned ? (
                  // Under the title, not beside it: beside, the badge moved
                  // with each title's length and the column read ragged.
                  <span className="flex flex-col items-start gap-0.5 max-w-full min-w-0">
                    <button type="button" onClick={() => play(s)} className={cn(linkCell, "truncate min-w-0")}>{s.title}</button>
                    <PurchasedBadge />
                  </span>
                ) : (
                  <button type="button" onClick={() => play(s)} className={linkCell}>{s.title}</button>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap truncate">
                {s.artist
                  ? (onArtist ? <button type="button" onClick={onArtist} className={linkCell}>{s.artist}</button> : s.artist)
                  : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap truncate">
                {s.album
                  ? (onAlbum
                      ? <button type="button" onClick={onAlbum} className={linkCell}>{s.album}</button>
                      : s.album)
                  : "—"}
              </TableCell>
              {hasLocal && (
                <TableCell className="text-muted-foreground whitespace-nowrap truncate">
                  {l ? (
                    <span className="inline-flex items-center gap-1.5 max-w-full min-w-0">
                      <LocalBadge className="shrink-0" />
                      <span className="truncate">{l.source.name} · {l.detail}</span>
                    </span>
                  ) : "muza"}
                </TableCell>
              )}
              <TableCell className="text-right text-muted-foreground tabular-nums whitespace-nowrap">
                {s.duration ?? "—"}
              </TableCell>
              <TableCell className="px-2">
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More options" />}>
                    <MoreHorizontal />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={6}>
                    {/* The shared song menu — same items as every SongListItem
                        row. Keyed by (title, artist) = s.id, so Save/Remove
                        targets this exact row. */}
                    {s.local ? (
                      <LocalSongMenuItems album={s.local.album} track={s.local.track} />
                    ) : (
                      <SongMenuItems
                        title={s.title}
                        artist={s.artist}
                        album={s.album}
                        cover={s.cover}
                        duration={s.duration}
                        onArtistClick={onArtist}
                        onAlbumClick={onAlbum}
                      />
                    )}
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

export function MobileAlbumRow({ album: a, showType }: { album: AlbumRow; showType?: boolean }) {
  const library = useUserLibrary()
  const { openAlbum, openArtist } = useMediaNav()
  const localActions = useLocalActions()
  const key = slugify(a.title)
  if (a.local) {
    const l = localActions(a.local)
    return (
      <MediaListItem
        type="album"
        showType={showType}
        cover={a.cover}
        title={a.title}
        subtitle={a.artist}
        // The "Local" badge leads the line, the format (or why it cannot
        // play) follows the artist, as on the card.
        badge="Local"
        meta={l.detail}
        onOpen={l.open}
        onSubtitleClick={l.onGoToArtist}
        className={l.available ? undefined : "opacity-60"}
        menuItems={<DetailMenuItems kind="album" title={a.title} {...l.menu} />}
      />
    )
  }
  return (
    <MediaListItem
      type="album"
      showType={showType}
      cover={a.cover}
      title={a.title}
      subtitle={a.artist}
      meta={a.year ? String(a.year) : undefined}
      badge={library.isPurchased(a.id) ? "Owned" : undefined}
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

export function MobilePlaylistRow({ playlist: p, showType }: { playlist: PlaylistRow; showType?: boolean }) {
  const { openPlaylist, openArtist } = useMediaNav()
  const key = slugify(p.title)
  const owner = p.owned ? "You" : (p.owner ?? "—")
  return (
    <MediaListItem
      type="playlist"
      showType={showType}
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

export function MobileArtistRow({ artist: ar, showType }: { artist: SavedArtist; showType?: boolean }) {
  const { openArtist } = useMediaNav()
  const open = () => openArtist(slugify(ar.name))
  const { canNativeShare, copyLink, nativeShare } = useShare({ title: ar.name })
  return (
    <MediaListItem
      type="artist"
      showType={showType}
      cover={ar.image}
      title={ar.name}
      onOpen={open}
      menuItems={
        <>
          <DropdownMenuItem onClick={open}><Mic />Go to artist</DropdownMenuItem>
          <DropdownMenuItem onClick={canNativeShare ? nativeShare : copyLink}>
            {canNativeShare ? <Share /> : <Link2 />}
            {canNativeShare ? "Share…" : "Copy link"}
          </DropdownMenuItem>
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
          {it.kind === "album"    && <MobileAlbumRow album={it.album} showType />}
          {it.kind === "playlist" && <MobilePlaylistRow playlist={it.playlist} showType />}
          {it.kind === "artist"   && <MobileArtistRow artist={it.artist} showType />}
        </li>
      ))}
    </ul>
  )
}

// Shared grid/list view switch for the library toolbars.
// The view switch every library page uses. `options` is what that page
// offers (the third value of `useLibraryView`), so one control draws two
// or three segments in the same order everywhere: cards, list, table.
const VIEW_OPTIONS: Record<LibraryView, { label: string; icon: ReactNode }> = {
  grid:  { label: "Card view",  icon: <LayoutGrid className="size-3.5" /> },
  list:  { label: "List view",  icon: <List className="size-3.5" /> },
  table: { label: "Table view", icon: <Table2 className="size-3.5" /> },
}

export function LibraryViewToggle({ value, onChange, options = ["grid", "table"] }: {
  value: LibraryView
  onChange: (v: LibraryView) => void
  options?: LibraryView[]
}) {
  if (options.length < 2) return null
  return (
    <ToggleGroup
      size="sm"
      value={[value]}
      onValueChange={(v) => { if (v[0]) onChange(v[0] as LibraryView) }}
      aria-label="View mode"
    >
      {(["grid", "list", "table"] as const).filter(v => options.includes(v)).map(v => (
        <Toggle key={v} value={v} aria-label={VIEW_OPTIONS[v].label}>{VIEW_OPTIONS[v].icon}</Toggle>
      ))}
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

type PlaylistSort =
  | "title-az" | "title-za" | "owner-az" | "owner-za"
  | "songs-desc" | "songs-asc" | "added-desc" | "added-asc"

export function PlaylistListTable({ playlists, onCreate }: { playlists: PlaylistRow[]; onCreate?: () => void }) {
  const { openPlaylist, openArtist } = useMediaNav()
  // Recently-added first by default (mirrors the Albums table) — the new
  // "Added" column is sortable both ways.
  const [sort, setSort] = useState<PlaylistSort>("added-desc")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const ownerOf = (p: PlaylistRow) => p.owned ? "You" : (p.owner ?? "—")

  const rows = useMemo(() => {
    // Stable synthetic "added to library" date per title (same helper the
    // Albums table uses), decorated once then sorted.
    const decorated = playlists.map(p => ({ ...p, added: addedInfo(p.title) }))
    decorated.sort((a, b) => {
      switch (sort) {
        case "title-za":   return b.title.localeCompare(a.title)
        case "owner-az":   return ownerOf(a).localeCompare(ownerOf(b)) || a.title.localeCompare(b.title)
        case "owner-za":   return ownerOf(b).localeCompare(ownerOf(a)) || a.title.localeCompare(b.title)
        case "songs-desc": return b.songCount - a.songCount
        case "songs-asc":  return a.songCount - b.songCount
        case "added-asc":  return a.added.ts - b.added.ts
        case "added-desc": return b.added.ts - a.added.ts
        default:           return a.title.localeCompare(b.title)
      }
    })
    return decorated
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
        <col style={{ width: 140 }} />
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
            <SortHeader label="Owner" active={sort.startsWith("owner")} dir={sort === "owner-za" ? "desc" : "asc"}
              onClick={() => setSort(sort === "owner-az" ? "owner-za" : "owner-az")} />
          </TableHead>
          <TableHead resizable={false}>
            <SortHeader label="Added" active={sort.startsWith("added")} dir={sort === "added-asc" ? "asc" : "desc"}
              onClick={() => setSort(sort === "added-desc" ? "added-asc" : "added-desc")} />
          </TableHead>
          <TableHead resizable={false} className="text-right">
            <SortHeader label="Songs" active={sort.startsWith("songs")} dir={sort === "songs-asc" ? "asc" : "desc"}
              onClick={() => setSort(sort === "songs-desc" ? "songs-asc" : "songs-desc")} className="justify-end ml-auto" />
          </TableHead>
          <TableHead resizable={false} className="px-2" />
        </TableRow>
      </thead>
      <TableBody>
        {/* Create-playlist row — mirrors the Studio › My Music "Upload"
            row: empty select/cover cells so the icon + label line up under
            Title, then a spanning cell. Always first, above the sorted rows. */}
        {onCreate && (
          <tr
            onClick={onCreate}
            className="border-b border-border hover:bg-muted transition-colors cursor-pointer group"
            style={{ height: 56 }}
          >
            <td className="w-10 px-2 py-0" />
            <td className="px-2 py-0" />
            <td colSpan={5} className="px-4 py-0">
              <div className="flex items-center gap-2.5">
                <Plus className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span className="text-small font-normal text-muted-foreground group-hover:text-foreground transition-colors">Create New Playlist</span>
              </div>
            </td>
          </tr>
        )}
        {rows.map(p => {
          const key = slugify(p.title)
          const owner = ownerOf(p)
          return (
            <TableRow key={p.id} className={rowCls(selectedIds.has(p.id))}>
              <SelectCell checked={selectedIds.has(p.id)} onToggle={() => toggle(p.id)} />
              <TableCell className="px-2">
                <CompositeThumb covers={p.covers} alt={p.title} onClick={() => openPlaylist(key)} />
              </TableCell>
              <TableCell className="text-foreground whitespace-nowrap truncate">
                <button type="button" onClick={() => openPlaylist(key)} className={linkCell}>{p.title}</button>
              </TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap truncate">
                {p.owned
                  ? owner
                  : <button type="button" onClick={() => openArtist(slugify(owner))} className={linkCell}>{owner}</button>}
              </TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap">
                {p.added.text}
              </TableCell>
              <TableCell className="text-right text-muted-foreground tabular-nums whitespace-nowrap">
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
