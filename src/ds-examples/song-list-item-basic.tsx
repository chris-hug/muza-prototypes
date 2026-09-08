"use client"

/*
 * Song List Item in its default `cover` mode — the row used wherever songs
 * from different releases are listed together (a playlist, the Songs library,
 * Search › Songs).
 *
 * This file is a CALL SITE, not a copy: it imports and renders the real
 * `SongListItem`, off the real catalog — the opening track of each rich album.
 * It exists only so the design system can render the component AND show the
 * same file under `</>` — a snippet typed beside the demo is a second copy,
 * and drifts.
 *
 * No `playing` is passed, so each row keeps its own local toggle: tap a row
 * and it plays. In the app the global player owns `playing`, so only one row
 * shows the wave at a time. The ⋯ menu is the built-in `SongMenuItems`.
 *
 * Resize the frame with the chips above: the row is an `@container` and
 * sheds meta by its own width — year below 380px, duration below 300, album
 * below 260. The artist always stays.
 */

import { SongListItem } from "@/components/ui/song-list-item"
import { getRichAlbums } from "@/lib/album-catalog"

const SONGS = getRichAlbums().slice(0, 4).map(a => ({
  id:       a.id,
  cover:    a.cover,
  title:    a.tracks[0].title,
  artist:   a.artist,
  album:    a.title,
  year:     a.year,
  duration: a.tracks[0].duration,
}))

export default function SongListItemBasicExample() {
  return (
    <ul className="flex flex-col gap-1">
      {SONGS.map(s => (
        <li key={s.id}>
          <SongListItem
            cover={s.cover}
            title={s.title}
            artist={s.artist}
            album={s.album}
            year={s.year}
            duration={s.duration}
            onArtistClick={() => {}}
            onAlbumClick={() => {}}
          />
        </li>
      ))}
    </ul>
  )
}
