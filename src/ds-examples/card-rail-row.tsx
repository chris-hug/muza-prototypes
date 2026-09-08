"use client"

/*
 * Card Rail in its default ROW mode — the shelf used for every "New albums",
 * "Playlists of the week" and artist-profile row.
 *
 * Rendered by the design system AND shown under `</>` from this same file,
 * so the snippet is never a paraphrase of the demo beside it.
 *
 * Resize the frame with the chips above: below a 560px container the card
 * width has a 220px floor and the leftover is the peek; from 560 up it is an
 * exact N-per-row grid aligned to the Library views.
 */

import { CardRail } from "@/components/app/card-rail"
import { AlbumCard } from "@/components/ui/album-card"

const ALBUMS = [
  { id: "a1", title: "Promises",       artist: "Floating Points",     year: 2021, cover: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/8a/8d/6b/8a8d6b7c-0dd8-6f34-3d09-3d0b8b4e1a1f/196292018943.jpg/600x600bb.jpg" },
  { id: "a2", title: "Source",         artist: "Nubya Garcia",        year: 2020, cover: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/3a/2f/9e/3a2f9e77-3f3e-8c1a-3f8f-1b7b0b6a2e0a/191404118016.jpg/600x600bb.jpg" },
  { id: "a3", title: "In These Times", artist: "Makaya McCraven",     year: 2022, cover: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/8b/2d/2f/8b2d2f52-6f0e-6f31-1c2e-3f2b1e5b7b1e/198025000000.jpg/600x600bb.jpg" },
  { id: "a4", title: "Black Acid Soul", artist: "Lady Blackbird",     year: 2021, cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/d9/8f/37/d98f3727-0c84-108d-a74e-0bcbf43928c3/4050538709391.jpg/600x600bb.jpg" },
]

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
