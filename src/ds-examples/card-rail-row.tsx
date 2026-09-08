"use client"

/*
 * Card Rail in its default ROW mode — the shelf used for every "New albums",
 * "Playlists of the week" and artist-profile row.
 *
 * This file is a CALL SITE, not a copy: it imports and renders the real
 * `CardRail` and the real `AlbumCard`, off the real catalog. It exists only
 * so the design system can render the component AND show the same file under
 * `</>` — a snippet typed beside the demo is a second copy, and drifts.
 *
 * Resize the frame with the chips above: below a 560px container the card
 * width has a 220px floor and the leftover is the peek; from 560 up it is an
 * exact N-per-row grid aligned to the Library views.
 */

import { CardRail } from "@/components/app/card-rail"
import { AlbumCard } from "@/components/ui/album-card"
import { getRichAlbums } from "@/lib/album-catalog"

const ALBUMS = getRichAlbums().slice(0, 8)

export default function CardRailRowExample() {
  return (
    <CardRail title="New Albums" onShowAll={() => {}}>
      {ALBUMS.map(a => (
        <li key={a.id}>
          <AlbumCard cover={a.cover} title={a.title} artist={a.artist} year={a.year} />
        </li>
      ))}
    </CardRail>
  )
}
