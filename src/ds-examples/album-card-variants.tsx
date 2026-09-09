"use client"

/*
 * Album Card — the three states the basic frame does not show: a long
 * title wrapping to its two-line clamp, a release the user uploaded
 * (`owned` — Edit replaces the heart, the menu swaps Save → Edit and
 * Report → Remove from library), and two covers that are missing, so the
 * branded `CoverArt` placeholder renders in the artwork square.
 *
 * A call site, not a copy: the real `AlbumCard` in the real `.grid-cards`
 * layout, off the real catalog. The long title is whichever library album
 * has the longest one, so the clamp is exercised by real data; the owned
 * card is the first rich album with the flag set by hand, since ownership
 * is a library-store fact the catalog does not carry.
 */

import { AlbumCard } from "@/components/ui/album-card"
import { getAllAlbums, getRichAlbums } from "@/lib/album-catalog"

const LONGEST = [...getAllAlbums()].sort((a, b) => b.title.length - a.title.length)[0]
const OWNED   = getRichAlbums()[0]

export default function AlbumCardVariantsExample() {
  return (
    <div className="@container">
      <ul className="grid-cards">
        <li>
          <AlbumCard cover={LONGEST.cover} title={LONGEST.title} artist={LONGEST.artist} year={LONGEST.year} />
        </li>
        <li>
          <AlbumCard cover={OWNED.cover} title={OWNED.title} artist={OWNED.artist} year={OWNED.year} owned onEdit={() => {}} />
        </li>
        <li>
          <AlbumCard cover="" title="Untitled Release" artist="Unknown Artist" year={2026} streamPrice="$1.99" />
        </li>
        <li>
          <AlbumCard cover="" title="Lost Tapes, Vol. 2" artist="Various Artists" purchased />
        </li>
      </ul>
    </div>
  )
}
