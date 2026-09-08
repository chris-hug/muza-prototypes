"use client"

/*
 * Card Rail with `mobileGrid` — the denser shelf for long lists.
 *
 * A call site, not a copy: it renders the real `CardRail` and `AlbumCard`
 * off the real catalog. Below a 560px container the cards lay out as a
 * two-row, column-major grid you swipe across; from 560 up it collapses to
 * the ordinary single row, so desktop is unchanged.
 *
 * Opt-in on purpose: pass the boolean only for a shelf long enough to earn
 * it (12+ entries) and only when an editor asked for it. Set the frame to
 * Phone above to see the two rows.
 */

import { CardRail } from "@/components/app/card-rail"
import { AlbumCard } from "@/components/ui/album-card"
import { getAllAlbums } from "@/lib/album-catalog"

// `getAllAlbums` rather than the rich catalog: this variant only earns its
// keep on a long shelf, and the demo should be long enough to show that.
const ALBUMS = getAllAlbums().slice(0, 12)

export default function CardRailGridExample() {
  return (
    <CardRail title="Swipeable Grid Section" mobileGrid onShowAll={() => {}}>
      {ALBUMS.map(a => (
        <li key={a.id}>
          <AlbumCard cover={a.cover} title={a.title} artist={a.artist} year={a.year} />
        </li>
      ))}
    </CardRail>
  )
}
