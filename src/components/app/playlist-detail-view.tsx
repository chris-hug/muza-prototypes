"use client"

/*
 * PlaylistDetailView — full-page playlist surface. Composes the
 * shared `MediaHeader` (`variant="playlist"`) + a list of
 * `SongListItem`s in `cover` mode (every track is from a different
 * album, so the per-row cover thumb earns its space here, unlike
 * `AlbumDetailView` which uses the `trackNumber` mode).
 *
 * No buying option (playlists aren't purchased — they're collections
 * of tracks owned individually). No `format` field. Owner is the
 * user who curated the playlist.
 *
 * Mock data lives inline for the prototype; real wiring would take
 * a playlist ID via URL param + look it up.
 */

import { ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MediaHeader } from "@/components/ui/media-header"
import { SongListItem } from "@/components/ui/song-list-item"
import { AlbumCard } from "@/components/ui/album-card"
import { ArtistCard } from "@/components/ui/artist-card"
import { CardRail } from "@/components/app/card-rail"
import { AlbumCardMenuItems } from "@/components/ui/cover-card-menu"

interface PlaylistDetailViewProps {
  onBack?: () => void
}

// Demo playlist — "Late Night Improvisations". User-curated mix of
// jazz tracks. Cover is the 2×2 composite of the first four tracks'
// album covers (the standard playlist-cover treatment everywhere
// in the app — playlists never show a single image).
const PLAYLIST = {
  // `cover` stays as a fallback for hosts that don't render the
  // composite; `covers` is the canonical 4-image array for the
  // MediaHeader (composite mode kicks in when ≥4 are provided).
  cover: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/e5/24/aa/e524aacd-467b-66f3-8931-0fcd6750a4b9/08UMGIM07914.rgb.jpg/600x600bb.jpg",
  covers: [
    "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/e5/24/aa/e524aacd-467b-66f3-8931-0fcd6750a4b9/08UMGIM07914.rgb.jpg/600x600bb.jpg",
    "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/6e/1a/13/6e1a134d-8f6f-d90f-b855-ea69436a2e8b/17UM1IM45370.rgb.jpg/600x600bb.jpg",
    "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/cb/85/94/cb85949f-5a43-58d5-c866-d9d0292354bd/06UMGIM01616.rgb.jpg/600x600bb.jpg",
    "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/01/36/a6/0136a666-36d2-caf1-efb1-da77a646d104/06UMGIM03764.rgb.jpg/600x600bb.jpg",
  ] as const,
  title: "Late Night Improvisations",
  owner: "Jules",
  ownerAvatar: "https://picsum.photos/seed/jules/120/120",
  tracks: [
    { id: "t1", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/e5/24/aa/e524aacd-467b-66f3-8931-0fcd6750a4b9/08UMGIM07914.rgb.jpg/600x600bb.jpg", title: "Acknowledgement",     artist: "John Coltrane",  album: "A Love Supreme",          year: 1965, duration: "7:47" },
    { id: "t2", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/6e/1a/13/6e1a134d-8f6f-d90f-b855-ea69436a2e8b/17UM1IM45370.rgb.jpg/600x600bb.jpg", title: "Moment's Notice",      artist: "John Coltrane",  album: "Blue Train",              year: 1958, duration: "9:08" },
    { id: "t3", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/cb/85/94/cb85949f-5a43-58d5-c866-d9d0292354bd/06UMGIM01616.rgb.jpg/600x600bb.jpg", title: "Track A — Solo Dancer", artist: "Charles Mingus", album: "The Black Saint…",        year: 1963, duration: "6:37" },
    { id: "t4", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/01/36/a6/0136a666-36d2-caf1-efb1-da77a646d104/06UMGIM03764.rgb.jpg/600x600bb.jpg", title: "The Creator Has a Master Plan", artist: "Pharoah Sanders", album: "Karma",                year: 1969, duration: "32:48" },
    { id: "t5", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/23/49/49/234949c3-db74-f0eb-30f5-d715526e459b/19UMGIM73745.rgb.jpg/600x600bb.jpg", title: "Maiden Voyage",         artist: "Herbie Hancock", album: "Maiden Voyage",           year: 1965, duration: "7:55" },
    { id: "t6", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a8/ee/3c/a8ee3cc7-e694-f7e1-5208-2c67f9ae5ed5/13ULAIM49176.rgb.jpg/600x600bb.jpg", title: "Speak No Evil",         artist: "Wayne Shorter",  album: "Speak No Evil",           year: 1966, duration: "8:21" },
    { id: "t7", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d6/a3/1d/d6a31d82-038d-a73f-5452-0380d8bd9bae/00724349532755.jpg/600x600bb.jpg", title: "Sonny's Crib",          artist: "Sonny Clark",    album: "Cool Struttin'",          year: 1958, duration: "10:46" },
    { id: "t8", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/d5/f1/41/d5f1417f-9c45-d013-392f-aa6c7c4b494c/13UABIM03210.rgb.jpg/600x600bb.jpg", title: "Hat and Beard",         artist: "Eric Dolphy",    album: "Out to Lunch",            year: 1964, duration: "8:24" },
  ],
} as const

// "More from this curator" — other lists by the same user.
const MORE_FROM_CURATOR = [
  { id: "c1", title: "Hard Bop Hustle",            year: 2025, cover: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/6e/1a/13/6e1a134d-8f6f-d90f-b855-ea69436a2e8b/17UM1IM45370.rgb.jpg/600x600bb.jpg" },
  { id: "c2", title: "Spiritual Jazz Essentials",  year: 2025, cover: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/01/36/a6/0136a666-36d2-caf1-efb1-da77a646d104/06UMGIM03764.rgb.jpg/600x600bb.jpg" },
  { id: "c3", title: "Modal Jazz Meditations",     year: 2024, cover: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/e5/24/aa/e524aacd-467b-66f3-8931-0fcd6750a4b9/08UMGIM07914.rgb.jpg/600x600bb.jpg" },
  { id: "c4", title: "Free Jazz Frontiers",        year: 2024, cover: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/d5/f1/41/d5f1417f-9c45-d013-392f-aa6c7c4b494c/13UABIM03210.rgb.jpg/600x600bb.jpg" },
  { id: "c5", title: "Post-Bop Heroes",            year: 2024, cover: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/cb/85/94/cb85949f-5a43-58d5-c866-d9d0292354bd/06UMGIM01616.rgb.jpg/600x600bb.jpg" },
  { id: "c6", title: "Saxophone Greats",           year: 2023, cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a8/ee/3c/a8ee3cc7-e694-f7e1-5208-2c67f9ae5ed5/13ULAIM49176.rgb.jpg/600x600bb.jpg" },
  { id: "c7", title: "Coltrane Years on Impulse!", year: 2023, cover: "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/23/49/49/234949c3-db74-f0eb-30f5-d715526e459b/19UMGIM73745.rgb.jpg/600x600bb.jpg" },
  { id: "c8", title: "Late Night Improvisations",  year: 2023, cover: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d6/a3/1d/d6a31d82-038d-a73f-5452-0380d8bd9bae/00724349532755.jpg/600x600bb.jpg" },
  { id: "c9", title: "Vibes for Stargazing",       year: 2022, cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/3b/30/51/3b305111-c28a-80ad-1f1d-6e89fb4fa2af/13ULAIM49306.rgb.jpg/600x600bb.jpg" },
  { id: "c10", title: "Heartfelt Harmonies",       year: 2022, cover: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d6/a3/1d/d6a31d82-038d-a73f-5452-0380d8bd9bae/00724349532755.jpg/600x600bb.jpg" },
] as const

// Featured artists across the playlist's tracks.
const FEATURED_ARTISTS = [
  { id: "a1", name: "John Coltrane",   image: "https://picsum.photos/seed/coltrane/400/400" },
  { id: "a2", name: "Charles Mingus",  image: "https://picsum.photos/seed/mingus/400/400" },
  { id: "a3", name: "Pharoah Sanders", image: "https://picsum.photos/seed/pharoah/400/400" },
  { id: "a4", name: "Herbie Hancock",  image: "https://picsum.photos/seed/hancock/400/400" },
  { id: "a5", name: "Wayne Shorter",   image: "https://picsum.photos/seed/shorter/400/400" },
  { id: "a6", name: "Sonny Clark",     image: "https://picsum.photos/seed/clark/400/400" },
  { id: "a7", name: "Eric Dolphy",     image: "https://picsum.photos/seed/dolphy/400/400" },
] as const

// "12 tracks · 1h 28m" style — sum the track times in the demo.
// In production this comes from the playlist record.
const TRACK_META = "8 tracks · 1h 31m"

export function PlaylistDetailView({ onBack }: PlaylistDetailViewProps) {
  return (
    <div className="@container relative w-full px-10 pt-6 pb-24 max-w-[1528px] mx-auto flex flex-col gap-10">
      {/* Back chevron — same gutter pattern as AlbumDetailView. */}
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

      {/* Header — `playlist` variant: no format, no buying option,
           owner field is the curator user name. */}
      <MediaHeader
        variant="playlist"
        cover={PLAYLIST.cover}
        covers={PLAYLIST.covers}
        title={PLAYLIST.title}
        owner={PLAYLIST.owner}
        ownerAvatar={PLAYLIST.ownerAvatar}
        year={TRACK_META}
      />

      {/* Track list — `cover` mode (tracks span many albums, so
           per-row covers earn their space). */}
      <ul className="flex flex-col gap-2">
        {PLAYLIST.tracks.map(t => (
          <li key={t.id}>
            <SongListItem
              cover={t.cover}
              title={t.title}
              artist={t.artist}
              album={t.album}
              year={t.year}
              duration={t.duration}
              menuItems={<AlbumCardMenuItems />}
            />
          </li>
        ))}
      </ul>

      <CardRail title={`More from ${PLAYLIST.owner}`} showAllLabel="All playlists">
        {MORE_FROM_CURATOR.map(p => (
          <li key={p.id}>
            <AlbumCard cover={p.cover} title={p.title} artist={PLAYLIST.owner} year={p.year} />
          </li>
        ))}
      </CardRail>

      <CardRail title="Featured Artists" showAllLabel="All artists">
        {FEATURED_ARTISTS.map(a => (
          <li key={a.id}>
            <ArtistCard name={a.name} image={a.image} />
          </li>
        ))}
      </CardRail>
    </div>
  )
}
