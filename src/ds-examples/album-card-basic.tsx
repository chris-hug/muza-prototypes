"use client"

/*
 * Album Card in the Library grid — one card per monetisation state: free,
 * stream-only, stream + download, and owned.
 *
 * This file is a CALL SITE, not a copy: it imports and renders the real
 * `AlbumCard`, off the real catalog, inside the real `.grid-cards` layout the
 * Library › Albums view uses. It exists only so the design system can render
 * the component AND show the same file under `</>` — a snippet typed beside
 * the demo is a second copy, and drifts.
 *
 * Hover a cover for the action cluster (Play · heart · ⋯); tab into it for
 * the keyboard path. Tap the cover or the title to open the album, the
 * artist to open the artist. The catalog stores the stream price as
 * `buyingPrice`; the card calls it `streamPrice`.
 */

import { AlbumCard } from "@/components/ui/album-card"
import { getRichAlbums } from "@/lib/album-catalog"

const ALBUMS = getRichAlbums()
const album = (id: string) => ALBUMS.find(a => a.id === id)!

const FREE      = album("a01")   // Maiden Voyage — streams under the subscription
const STREAM    = album("a08")   // Karma — stream price only
const STREAM_DL = album("a07")   // A Love Supreme — stream + download tiers
const OWNED     = album("a04")   // Cool Struttin' — bought

export default function AlbumCardBasicExample() {
  return (
    <div className="@container">
      <ul className="grid-cards">
        <li>
          <AlbumCard cover={FREE.cover} title={FREE.title} artist={FREE.artist} year={FREE.year} />
        </li>
        <li>
          <AlbumCard
            cover={STREAM.cover} title={STREAM.title} artist={STREAM.artist} year={STREAM.year}
            streamPrice={STREAM.buyingPrice}
          />
        </li>
        <li>
          <AlbumCard
            cover={STREAM_DL.cover} title={STREAM_DL.title} artist={STREAM_DL.artist} year={STREAM_DL.year}
            streamPrice={STREAM_DL.buyingPrice} downloadPrice={STREAM_DL.downloadPrice}
          />
        </li>
        <li>
          <AlbumCard cover={OWNED.cover} title={OWNED.title} artist={OWNED.artist} year={OWNED.year} purchased />
        </li>
      </ul>
    </div>
  )
}
