"use client"

/*
 * Song List Item in `trackNumber` mode — one album's own track list, as on
 * the album detail page. Every track shares the header's artist, album and
 * year, so none is passed: the meta line is omitted and the title sits as
 * a single centred line on the 60px row. The duration stays at every
 * width, because a row with no meta line has nothing else to shed.
 *
 * A call site, not a copy: the real `SongListItem` off the real catalog's
 * default album, with the flags the album page passes — `hideGoToAlbum`
 * (you are on it) and credits through `onInfo`. No `playing` is passed,
 * so each row keeps its own local toggle; in the app the global player
 * owns it.
 */

import { SongListItem } from "@/components/ui/song-list-item"
import { getAlbumDetail } from "@/lib/album-catalog"

const ALBUM  = getAlbumDetail()
const TRACKS = ALBUM.tracks.slice(0, 4)

export default function SongListItemTrackNumberExample() {
  return (
    <ul className="flex flex-col gap-1">
      {TRACKS.map((t, i) => (
        <li key={t.title}>
          <SongListItem
            trackNumber={i + 1}
            title={t.title}
            duration={t.duration}
            hideGoToAlbum
            onInfo={() => {}}
          />
        </li>
      ))}
    </ul>
  )
}
