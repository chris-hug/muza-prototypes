"use client"

/*
 * Table — the bordered data table: a header row, hairline-separated body
 * rows that tint on hover, and a footer that sums. The rows are the real
 * catalog's albums, and every part is the real `Table` primitive. The
 * `<Table>` wrapper is a horizontal scroll container, so at a 320 window
 * chip the columns keep their width and the table scrolls inside its
 * column instead of squeezing.
 */

import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { getRichAlbums } from "@/lib/album-catalog"

const ALBUMS = getRichAlbums().slice(0, 5)
const TOTAL_TRACKS = ALBUMS.reduce((n, a) => n + a.tracks.length, 0)

export default function TableBasicExample() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8" resizable={false}>#</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Artist</TableHead>
          <TableHead>Label</TableHead>
          <TableHead className="text-right">Year</TableHead>
          <TableHead className="text-right" resizable={false}>Tracks</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ALBUMS.map((a, i) => (
          <TableRow key={a.id}>
            <TableCell className="text-muted-foreground tabular-nums">{i + 1}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2.5">
                {/* `rounded-xs` (2px) — the image-container radius. */}
                <img src={a.cover} alt="" className="size-8 rounded-xs object-cover shrink-0" />
                <span className="whitespace-nowrap">{a.title}</span>
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground whitespace-nowrap">{a.artist}</TableCell>
            <TableCell>{a.label && <Badge variant="secondary">{a.label}</Badge>}</TableCell>
            <TableCell className="text-right text-muted-foreground tabular-nums">{a.year}</TableCell>
            <TableCell className="text-right text-muted-foreground tabular-nums">{a.tracks.length}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={5}>Total</TableCell>
          <TableCell className="text-right tabular-nums">{TOTAL_TRACKS}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
