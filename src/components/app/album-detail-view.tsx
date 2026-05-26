"use client"

/*
 * AlbumDetailView — full-page album detail surface. Composes the
 * shared `MediaHeader` + a list of `SongListItem`s in `trackNumber`
 * mode + a "More from this artist" rail at the bottom.
 *
 * Figma source: file dbSHgvquI2o4TFie2iAJxv › node 2840:112964
 * (Album Detail view — default — responsive ≥ 1280).
 *
 * Mock data lives inline for the prototype; real wiring would take
 * an album ID via URL param + look it up.
 */

import { useState } from "react"
import { ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MediaHeader } from "@/components/ui/media-header"
import { SongListItem } from "@/components/ui/song-list-item"
import { AlbumCard } from "@/components/ui/album-card"
import { ArtistCard } from "@/components/ui/artist-card"
import { PlaylistCard } from "@/components/ui/playlist-card"
import { CardRail } from "@/components/app/card-rail"
import { AlbumCardMenuItems } from "@/components/ui/cover-card-menu"
import { PurchaseAlbumDialog } from "@/components/app/purchase-album-dialog"

interface AlbumDetailViewProps {
  /** Back handler — wired to `navigate("Home")` (or wherever) by
   *  the route shell. */
  onBack?: () => void
}

// Demo album — A Love Supreme (John Coltrane, 1965). Covers reuse
// known-working URLs from `LibraryAlbumsView` so the prototype
// always shows real artwork (random made-up mzstatic IDs would 404).
const ALBUM = {
  cover:        "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/e5/24/aa/e524aacd-467b-66f3-8931-0fcd6750a4b9/08UMGIM07914.rgb.jpg/600x600bb.jpg",
  title:        "A Love Supreme",
  artist:       "John Coltrane",
  artistAvatar: "https://picsum.photos/seed/coltrane-avatar/120/120",
  year:         1965,
  format:       "Album",
  // Buyer-side tiers — the artist set both on upload (see
  // upload-music-dialog.tsx, Monetisation step). The header CTA
  // surfaces the cheaper one ("Unlock All Songs – $2.99"); the
  // purchase dialog lets the buyer pick which tier to pay for.
  buyingPrice:   "$2.99", // stream-unlock price (cheaper, shown on CTA)
  downloadPrice: "$4.99", // download-license price (optional tier)
  tracks: [
    { id: "1", title: "Acknowledgement", duration: "7:47" },
    { id: "2", title: "Resolution",      duration: "7:21" },
    { id: "3", title: "Pursuance",       duration: "10:46" },
    { id: "4", title: "Psalm",           duration: "7:08" },
  ],
} as const

// "More from this artist" — known-working Coltrane / contemporaries
// covers from the saved-albums fixture in `LibraryAlbumsView`. 10
// items so the rail is definitely scrollable at any container width.
const MORE_FROM_ARTIST = [
  { id: "m1",  title: "Blue Train",                              year: 1958, cover: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/6e/1a/13/6e1a134d-8f6f-d90f-b855-ea69436a2e8b/17UM1IM45370.rgb.jpg/600x600bb.jpg" },
  { id: "m2",  title: "Giant Steps",                             year: 1960, cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a8/ee/3c/a8ee3cc7-e694-f7e1-5208-2c67f9ae5ed5/13ULAIM49176.rgb.jpg/600x600bb.jpg" },
  { id: "m3",  title: "My Favorite Things",                      year: 1961, cover: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d6/a3/1d/d6a31d82-038d-a73f-5452-0380d8bd9bae/00724349532755.jpg/600x600bb.jpg" },
  { id: "m4",  title: "Ascension",                               year: 1966, cover: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/d5/f1/41/d5f1417f-9c45-d013-392f-aa6c7c4b494c/13UABIM03210.rgb.jpg/600x600bb.jpg" },
  { id: "m5",  title: "Karma",                                   year: 1969, cover: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/01/36/a6/0136a666-36d2-caf1-efb1-da77a646d104/06UMGIM03764.rgb.jpg/600x600bb.jpg" },
  { id: "m6",  title: "The Black Saint and the Sinner Lady",     year: 1963, cover: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/cb/85/94/cb85949f-5a43-58d5-c866-d9d0292354bd/06UMGIM01616.rgb.jpg/600x600bb.jpg" },
  { id: "m7",  title: "Maiden Voyage",                           year: 1965, cover: "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/23/49/49/234949c3-db74-f0eb-30f5-d715526e459b/19UMGIM73745.rgb.jpg/600x600bb.jpg" },
  { id: "m8",  title: "Speak No Evil",                           year: 1966, cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a8/ee/3c/a8ee3cc7-e694-f7e1-5208-2c67f9ae5ed5/13ULAIM49176.rgb.jpg/600x600bb.jpg" },
  { id: "m9",  title: "Empyrean Isles",                          year: 1964, cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/3b/30/51/3b305111-c28a-80ad-1f1d-6e89fb4fa2af/13ULAIM49306.rgb.jpg/600x600bb.jpg" },
  { id: "m10", title: "Out to Lunch",                            year: 1964, cover: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/d5/f1/41/d5f1417f-9c45-d013-392f-aa6c7c4b494c/13UABIM03210.rgb.jpg/600x600bb.jpg" },
] as const

// "Playlists with John Coltrane" — curated lists that include the
// album's primary artist. Composite covers driven by 4 album thumbs
// each so PlaylistCard can render its 2×2 grid. 9 items so the rail
// always exceeds the visible column count.
const PL_COVER_POOL = [
  "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/e5/24/aa/e524aacd-467b-66f3-8931-0fcd6750a4b9/08UMGIM07914.rgb.jpg/600x600bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/23/49/49/234949c3-db74-f0eb-30f5-d715526e459b/19UMGIM73745.rgb.jpg/600x600bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/01/36/a6/0136a666-36d2-caf1-efb1-da77a646d104/06UMGIM03764.rgb.jpg/600x600bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/6e/1a/13/6e1a134d-8f6f-d90f-b855-ea69436a2e8b/17UM1IM45370.rgb.jpg/600x600bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/cb/85/94/cb85949f-5a43-58d5-c866-d9d0292354bd/06UMGIM01616.rgb.jpg/600x600bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a8/ee/3c/a8ee3cc7-e694-f7e1-5208-2c67f9ae5ed5/13ULAIM49176.rgb.jpg/600x600bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d6/a3/1d/d6a31d82-038d-a73f-5452-0380d8bd9bae/00724349532755.jpg/600x600bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/3b/30/51/3b305111-c28a-80ad-1f1d-6e89fb4fa2af/13ULAIM49306.rgb.jpg/600x600bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/d5/f1/41/d5f1417f-9c45-d013-392f-aa6c7c4b494c/13UABIM03210.rgb.jpg/600x600bb.jpg",
] as const

// Pick four cover URLs from the pool starting at offset `i` so each
// playlist gets a unique-looking composite without hand-typing 36
// strings.
const pickCovers = (i: number): readonly string[] => [
  PL_COVER_POOL[i % PL_COVER_POOL.length],
  PL_COVER_POOL[(i + 1) % PL_COVER_POOL.length],
  PL_COVER_POOL[(i + 2) % PL_COVER_POOL.length],
  PL_COVER_POOL[(i + 3) % PL_COVER_POOL.length],
]

const PLAYLISTS_WITH_ARTIST = [
  { id: "p1", title: "Modal Jazz Meditations",   songCount: 42, owner: "Muza Editorial", covers: pickCovers(0) },
  { id: "p2", title: "Coltrane Years on Impulse!", songCount: 28, owner: "Muza Editorial", covers: pickCovers(1) },
  { id: "p3", title: "Late Night Improvisations",  songCount: 35, owner: "Jules",          covers: pickCovers(2) },
  { id: "p4", title: "Hard Bop Hustle",             songCount: 50, owner: "Mira",           covers: pickCovers(3) },
  { id: "p5", title: "Spiritual Jazz Essentials",   songCount: 31, owner: "Muza Editorial", covers: pickCovers(4) },
  { id: "p6", title: "Sheets of Sound",             songCount: 24, owner: "Alex",           covers: pickCovers(5) },
  { id: "p7", title: "Saxophone Greats",            songCount: 60, owner: "Muza Editorial", covers: pickCovers(0) },
  { id: "p8", title: "Free Jazz Frontiers",         songCount: 22, owner: "Noa",            covers: pickCovers(2) },
  { id: "p9", title: "Post-Bop Heroes",             songCount: 38, owner: "Muza Editorial", covers: pickCovers(4) },
] as const

// "Artists on this Album" — the recording quartet. Coltrane (lead) +
// the classic rhythm section. Picsum portraits as stand-ins for
// proper artist photography; real wiring would link to each artist's
// profile page.
const ARTISTS_ON_ALBUM = [
  { id: "art1", name: "John Coltrane",   image: "https://picsum.photos/seed/coltrane/400/400"  },
  { id: "art2", name: "McCoy Tyner",     image: "https://picsum.photos/seed/mccoy-tyner/400/400" },
  { id: "art3", name: "Jimmy Garrison",  image: "https://picsum.photos/seed/jimmy-garrison/400/400" },
  { id: "art4", name: "Elvin Jones",     image: "https://picsum.photos/seed/elvin-jones/400/400" },
] as const

export function AlbumDetailView({ onBack }: AlbumDetailViewProps) {
  // Purchase dialog open state — the MediaHeader's `onBuy` flips
  // this true; `PurchaseAlbumDialog` flips it back via
  // `onOpenChange` (Cancel / Close / post-success auto-close).
  const [buyOpen, setBuyOpen] = useState(false)
  return (
    <div className="@container relative w-full px-10 pt-6 pb-24 max-w-[1528px] mx-auto flex flex-col gap-10">
      {/* Back chevron — sits in the page gutter to the LEFT of the
           content. `ghost` variant (no border, no backdrop-blur) so
           the 32px button reads as a quiet glyph in the tight 40px
           gutter rather than a chunky pill competing with the cover
           edge. Hover surfaces the bg-accent wash on demand. Top
           aligned with the cover/title baseline so the button reads
           as paired with the title row. */}
      {onBack && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Back"
          onClick={onBack}
          className="absolute top-10 left-1"
        >
          <ChevronLeft />
        </Button>
      )}

      {/* Header (300px tall) — the new component. */}
      <MediaHeader
        variant="album"
        cover={ALBUM.cover}
        title={ALBUM.title}
        owner={ALBUM.artist}
        ownerAvatar={ALBUM.artistAvatar}
        format={ALBUM.format}
        year={ALBUM.year}
        hasBuyingOption
        buyingPrice={ALBUM.buyingPrice}
        onBuy={() => setBuyOpen(true)}
      />

      {/* Mounted alongside the header so it can be opened by the
           "Unlock All Songs" CTA. Real wiring would replace the
           mocked checkout in the dialog with a checkout call. */}
      <PurchaseAlbumDialog
        open={buyOpen}
        onOpenChange={setBuyOpen}
        album={{
          cover:  ALBUM.cover,
          title:  ALBUM.title,
          artist: ALBUM.artist,
          year:   ALBUM.year,
          format: ALBUM.format,
        }}
        streamPrice={ALBUM.buyingPrice}
        downloadPrice={ALBUM.downloadPrice}
      />

      {/* Track list — SongListItem in trackNumber mode. 8px gap
           matches the Figma's 8px row gap (66 − 58 = 8). */}
      <ul className="flex flex-col gap-2">
        {ALBUM.tracks.map((t, i) => (
          <li key={t.id}>
            <SongListItem
              trackNumber={i + 1}
              title={t.title}
              artist={ALBUM.artist}
              album={ALBUM.title}
              year={ALBUM.year}
              duration={t.duration}
              menuItems={<AlbumCardMenuItems />}
            />
          </li>
        ))}
      </ul>

      {/* "More from this artist" rail */}
      <CardRail title={`More from ${ALBUM.artist}`} showAllLabel="All albums">
        {MORE_FROM_ARTIST.map(a => (
          <li key={a.id}>
            <AlbumCard cover={a.cover} title={a.title} artist={ALBUM.artist} year={a.year} />
          </li>
        ))}
      </CardRail>

      {/* Playlists that feature this artist */}
      <CardRail title={`Playlists with ${ALBUM.artist}`} showAllLabel="All playlists">
        {PLAYLISTS_WITH_ARTIST.map(p => (
          <li key={p.id}>
            <PlaylistCard
              title={p.title}
              covers={p.covers}
              songCount={p.songCount}
              owner={p.owner}
            />
          </li>
        ))}
      </CardRail>

      {/* Artists who played on the recording — `showAllLabel={null}`
           because the rail already lists every musician on the album
           (no "more" to show). `CardRail` also hides ◀ ▶ when the
           content fits, so when the row of 4 doesn't overflow there
           are no nav affordances at all. */}
      <CardRail title="Artists on this Album" showAllLabel={null}>
        {ARTISTS_ON_ALBUM.map(a => (
          <li key={a.id}>
            <ArtistCard name={a.name} image={a.image} />
          </li>
        ))}
      </CardRail>
    </div>
  )
}
