"use client"

/*
 * List Table — the borderless, single-line list behind Artist › Discography
 * (list view) and the library list tables. There is no `<ListTable>`
 * component: it is the `Table` head/cell primitives on a bare `<table>`
 * plus a handful of row rules, and this file IS that recipe — sticky
 * sortable headers, a per-cell hover block with rounded ends, a cover that
 * plays, and a trailing kebab that opens the album's own menu.
 *
 * Rows come off the real catalog. The menu's Save row reads the live
 * library store, so this needs the `UserLibraryProvider` the app shell
 * mounts (the design-system page mounts its own).
 */

import { useMemo, useState } from "react"
import { MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ContentTypeBadge } from "@/components/ui/badge"
import { CoverPlayButton } from "@/components/ui/cover-play-button"
import { AlbumCardMenuItems } from "@/components/ui/cover-card-menu"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { TableBody, TableCell, TableHead, TableRow, SortHeader } from "@/components/ui/table"
import { MediaListItem } from "@/components/ui/media-list-item"
import { useFooterNav } from "@/lib/use-media-query"
import { getRichAlbums } from "@/lib/album-catalog"

const ROWS = getRichAlbums().slice(0, 5)

type Sort = "year-desc" | "year-asc" | "title-az" | "title-za" | "tracks-desc" | "tracks-asc"


const LINK = "text-left link-underline outline-none cursor-pointer"

export default function ListTableBasicExample() {
  const footerNav = useFooterNav()
  const [sort, setSort] = useState<Sort>("year-desc")
  const [playingId, setPlayingId] = useState<string | null>(null)
  const sorted = useMemo(() => [...ROWS].sort((a, b) => {
    if (sort === "year-desc")   return b.year - a.year
    if (sort === "year-asc")    return a.year - b.year
    if (sort === "tracks-desc") return b.tracks.length - a.tracks.length
    if (sort === "tracks-asc")  return a.tracks.length - b.tracks.length
    if (sort === "title-za")    return b.title.localeCompare(a.title)
    return a.title.localeCompare(b.title)
  }), [sort])

  /*
   * Below the chrome gate the app does not narrow this table — it does not
   * SHOW a table. `library-albums-view.tsx` swaps `AlbumListTable` for
   * `AlbumMobileList`, and Artist › Discography does the same, because seven
   * columns cannot be made to work in a 296px column: cover, title, artist,
   * recorded, tracks, type and a kebab.
   *
   * The demo has to make that swap too, or the frame shows a phone rendering
   * the app has never produced. `useFooterNav()` reads the frame's own window
   * chip here (`WindowWidthContext`), so picking 320 above genuinely lands in
   * the mobile branch.
   */
  if (footerNav) {
    return (
      <ul className="flex flex-col gap-1">
        {sorted.map(r => (
          <li key={r.id}>
            <MediaListItem
              type="album"
              cover={r.cover}
              title={r.title}
              subtitle={r.artist}
              meta={r.year ? String(r.year) : undefined}
              menuItems={<AlbumCardMenuItems shareTitle={r.title} hideGoToAlbum />}
            />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <table className="w-full table-fixed">
      <colgroup>
        <col style={{ width: 64 }} />
        <col />
        <col />
        <col style={{ width: 112 }} />
        <col style={{ width: 80 }} />
        <col style={{ width: 128 }} />
        <col style={{ width: 56 }} />
      </colgroup>
      {/* Sticky on each <th>, not the <thead>: with `table-fixed` some
          engines ignore a sticky thead. */}
      <thead className="[&_tr]:border-b [&_tr]:border-border [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-background">
        <TableRow>
          <TableHead resizable={false} className="px-2" />
          <TableHead>
            <SortHeader
              label="Title"
              active={sort.startsWith("title")}
              dir={sort === "title-az" ? "asc" : sort === "title-za" ? "desc" : null}
              onClick={() => setSort(sort === "title-az" ? "title-za" : "title-az")}
            />
          </TableHead>
          <TableHead>Artist</TableHead>
          <TableHead resizable={false}>
            <SortHeader
              label="Recorded"
              active={sort.startsWith("year")}
              dir={sort === "year-desc" ? "desc" : sort === "year-asc" ? "asc" : null}
              onClick={() => setSort(sort === "year-desc" ? "year-asc" : "year-desc")}
            />
          </TableHead>
          <TableHead resizable={false}>
            <SortHeader
              label="Tracks"
              active={sort.startsWith("tracks")}
              dir={sort === "tracks-desc" ? "desc" : sort === "tracks-asc" ? "asc" : null}
              onClick={() => setSort(sort === "tracks-desc" ? "tracks-asc" : "tracks-desc")}
            />
          </TableHead>
          <TableHead resizable={false} className="text-right">Type</TableHead>
          <TableHead resizable={false} className="px-2" />
        </TableRow>
      </thead>
      <TableBody>
        {sorted.map(r => {
          const playing = playingId === r.id
          return (
            <TableRow
              key={r.id}
              className={cn(
                // No hairline between rows. The hover block is painted per
                // cell so the first and last can round the outside corners —
                // a <tr> does not clip border-radius.
                "group/row border-b-0 hover:bg-transparent",
                "[&>td]:group-hover/row:bg-muted [&>td:first-child]:group-hover/row:rounded-l-md [&>td:last-child]:group-hover/row:rounded-r-md",
                // py-1.5 around the 48px cover = the SongListItem row height.
                "[&_td]:py-1.5",
                // The playing row keeps the block at rest.
                playing && "[&>td]:bg-muted [&>td:first-child]:rounded-l-md [&>td:last-child]:rounded-r-md",
              )}
            >
              <TableCell className="px-2">
                <CoverPlayButton
                  src={r.cover}
                  title={r.title}
                  playing={playing}
                  onToggle={() => setPlayingId(prev => prev === r.id ? null : r.id)}
                  hoverGroup="row"
                />
              </TableCell>
              <TableCell className="text-foreground whitespace-nowrap truncate">
                <button type="button" className={LINK}>{r.title}</button>
              </TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap truncate">
                <button type="button" className={LINK}>{r.artist}</button>
              </TableCell>
              <TableCell className="text-muted-foreground tabular-nums whitespace-nowrap">{r.year}</TableCell>
              <TableCell className="text-muted-foreground tabular-nums whitespace-nowrap">{r.tracks.length}</TableCell>
              <TableCell className="text-right"><ContentTypeBadge type="album" /></TableCell>
              <TableCell className="px-2">
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More options" />}>
                    <MoreHorizontal />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={6}>
                    <AlbumCardMenuItems shareTitle={r.title} />
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </table>
  )
}
