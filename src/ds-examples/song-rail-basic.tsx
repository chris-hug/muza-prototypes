"use client"

/*
 * Song Rail — Top Songs as the artist page shows it: eight `compact` Song
 * List Items chunked three to a column, scrolling sideways. Enough rows to
 * overflow at every width, so "Show all" and the arrows appear (the arrows
 * from a 692px column, on a pointer device).
 *
 * This file is a CALL SITE, not a copy: it renders the real `SongRail` and
 * the real `SongListItem`, off the real catalog — the opening track of each
 * rich album. The rail is data-agnostic: it takes pre-rendered, keyed rows
 * and never touches them, so play, credits and navigation stay the host's.
 * No `playing` is passed, so each row keeps its own local toggle.
 *
 * Resize the frame with the chips: one column with a 24px peek below 692,
 * two from 692, three from 1164 — and inside a column the row measures its
 * own box, shedding meta by its 260 / 300 / 380 steps.
 */

import { SongRail } from "@/components/app/song-rail"
import { SongListItem } from "@/components/ui/song-list-item"
import { getRichAlbums } from "@/lib/album-catalog"

const SONGS = getRichAlbums().slice(0, 8).map(a => ({
  id:     a.id,
  cover:  a.cover,
  title:  a.tracks[0].title,
  artist: a.artist,
  album:  a.title,
  year:   a.year,
}))

export default function SongRailBasicExample() {
  return (
    <SongRail
      title="Top Songs"
      onShowAll={() => {}}
      rows={SONGS.map(s => (
        <SongListItem
          key={s.id}
          compact
          cover={s.cover}
          title={s.title}
          artist={s.artist}
          album={s.album}
          year={s.year}
          onArtistClick={() => {}}
          onAlbumClick={() => {}}
        />
      ))}
    />
  )
}
