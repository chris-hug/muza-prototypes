"use client"

/*
 * LibrarySongsView — the user's saved songs (Library › Songs).
 *
 * Songs have no standalone catalog, so the library store keeps each
 * saved track's metadata when its heart is tapped (player bar / overlay,
 * any song row). This view simply renders `library.songs()` as cover
 * SongListItem rows — each row's heart is already store-backed, so
 * un-hearting a track removes it from this list.
 */

import { useMemo } from "react"

import { SongListItem } from "@/components/ui/song-list-item"
import { SongListTable } from "@/components/app/media-list-table"
import { ChipChoice } from "@/components/ui/chip"
import { SAVED_ALBUMS } from "@/components/app/library-albums-view"
import { useUserLibrary, type SavedSong } from "@/lib/user-library"
import { usePlayer } from "@/lib/player"
import { useFooterNav } from "@/lib/use-media-query"
import { useLibraryFilter, matchesLibraryQuery } from "@/lib/use-library-filter"
import { useLibraryStatus } from "@/lib/use-library-status"
import { LibrarySearchField } from "@/components/app/library-search-field"
import { useMediaNav, slugify } from "@/lib/media-nav"
import { hasAlbumDetail } from "@/lib/album-catalog"

const FROM = "Library · Songs"

// ─── Demo seed ────────────────────────────────────────────────────────────────
// A handful of saved songs so the page opens populated. Each track is a
// real cut from an album in the catalog, so it carries that album's actual
// cover (and the Album column links through). Ids are `slugify(title-artist)`
// — the SAME scheme every song heart uses — so a seeded track and the same
// track hearted from a row resolve to one entry.
const albumCover = (title: string) => SAVED_ALBUMS.find(a => a.title === title)?.cover ?? ""
export const SAVED_SONGS_SEED: SavedSong[] = [
  { title: "Maiden Voyage",                 artist: "Herbie Hancock",  album: "Maiden Voyage",             duration: "7:55" },
  { title: "Dolphin Dance",                 artist: "Herbie Hancock",  album: "Maiden Voyage",             duration: "9:18" },
  { title: "Witch Hunt",                    artist: "Wayne Shorter",   album: "Speak No Evil",             duration: "8:08" },
  { title: "Infant Eyes",                   artist: "Wayne Shorter",   album: "Speak No Evil",             duration: "6:51" },
  { title: "Blue Train",                    artist: "John Coltrane",   album: "Blue Train",                duration: "10:43" },
  { title: "Moment's Notice",               artist: "John Coltrane",   album: "Blue Train",                duration: "9:10" },
  { title: "Cool Struttin'",                artist: "Sonny Clark",     album: "Cool Struttin'",            duration: "9:21" },
  { title: "Cantaloupe Island",             artist: "Herbie Hancock",  album: "Empyrean Isles",            duration: "5:33" },
  { title: "One Finger Snap",               artist: "Herbie Hancock",  album: "Empyrean Isles",            duration: "7:23" },
  { title: "Hat and Beard",                 artist: "Eric Dolphy",     album: "Out to Lunch",              duration: "8:24" },
  { title: "A Love Supreme, Pt. 1",         artist: "John Coltrane",   album: "A Love Supreme",            duration: "7:43" },
  { title: "Resolution",                    artist: "John Coltrane",   album: "A Love Supreme",            duration: "7:20" },
  { title: "The Creator Has a Master Plan", artist: "Pharoah Sanders", album: "Karma",                     duration: "9:12" },
  { title: "Crescent",                      artist: "John Coltrane",   album: "Crescent",                  duration: "8:41" },
  { title: "Wise One",                      artist: "John Coltrane",   album: "Crescent",                  duration: "9:00" },
  { title: "Journey in Satchidananda",      artist: "Alice Coltrane",  album: "Journey in Satchidananda",  duration: "6:34" },
  { title: "Shiva-Loka",                    artist: "Alice Coltrane",  album: "Journey in Satchidananda",  duration: "6:32" },
  { title: "Solo Dancer",                   artist: "Charles Mingus",  album: "The Black Saint and the Sinner Lady", duration: "6:39" },
  { title: "Greensleeves",                  artist: "John Coltrane",   album: "Africa/Brass",              duration: "9:58" },
  { title: "Powerful Paul Robeson",         artist: "Clifford Jordan", album: "Glass Bead Game",           duration: "7:50" },
  { title: "Source",                        artist: "Nubya Garcia",    album: "Source",                    duration: "12:24" },
  { title: "Afro Blue",                     artist: "Robert Glasper",  album: "Black Radio",               duration: "7:18" },
].map(r => ({
  id: slugify(`${r.title}-${r.artist}`),
  title: r.title, artist: r.artist, album: r.album, duration: r.duration,
  cover: albumCover(r.album),
}))

/** Every song available offline: saved on its own, or through its album.
 *  One song once, whichever way it got there. */
export function useOfflineSongs(): SavedSong[] {
  const library = useUserLibrary()
  const albumIdByTitle = useMemo(
    () => new Map(SAVED_ALBUMS.map(a => [a.title, a.id])),
    [],
  )
  const viaAlbum = library.songs().filter(s => {
    const id = s.album ? albumIdByTitle.get(s.album) : undefined
    return !!id && library.isOffline("album", id)
  })
  return [...new Map([...library.offlineSongs(), ...viaAlbum].map(s => [s.id, s])).values()]
}

export function SongRows({ songs }: { songs: SavedSong[] }) {
  const player = usePlayer()
  const { openAlbum, openArtist } = useMediaNav()
  return (
    <ul className="flex flex-col gap-2">
      {songs.map(s => {
        const isThis = player.playing && player.playingFrom === FROM && player.track?.title === s.title
        return (
          <li key={s.id}>
            <SongListItem
              cover={s.cover}
              title={s.title}
              artist={s.artist}
              album={s.album}
              duration={s.duration}
              playing={isThis}
              onPlay={() => {
                if (player.playingFrom === FROM && player.track?.title === s.title) { player.toggle(); return }
                player.play(
                  { title: s.title, artist: s.artist ?? "", album: s.album ?? "", image: s.cover ?? "", totalTime: s.duration },
                  FROM,
                )
              }}
              onArtistClick={s.artist ? () => openArtist(slugify(s.artist!)) : undefined}
              onAlbumClick={s.album && hasAlbumDetail(slugify(s.album)) ? () => openAlbum(slugify(s.album!)) : undefined}
            />
          </li>
        )
      })}
    </ul>
  )
}

export function LibrarySongsView() {
  const library   = useUserLibrary()
  const footerNav = useFooterNav()
  const [query] = useLibraryFilter()
  // A song is offline if it was saved on its own or its ALBUM was. No "Owned"
  // tab: you don't buy a single track here.
  const [status, setStatus] = useLibraryStatus<"all" | "offline">("songs")
  const offlineSongs = useOfflineSongs()
  const allSongs = library.songs()
  const songs = (status === "offline" ? offlineSongs : allSongs)
    // In-library search — match title / artist / album.
    .filter(s => matchesLibraryQuery(query, s.title, s.artist, s.album))

  return (
    <div className="flex-1 overflow-auto">
      <div className="@container mx-auto max-w-[1480px] min-[1920px]:max-w-[1716px] px-page pt-8 pb-12">
        {/* Mobile already shows "Library" + active pill in the header. */}
        {!footerNav && (
          <>
            <h1 className="text-2xlarge font-medium text-foreground tracking-tight mb-4">Songs</h1>
            {/* Status chips (left) + in-library search (right). */}
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 mb-6">
              <ChipChoice
                aria-label="Filter songs"
                value={status}
                onChange={setStatus}
                options={[
                  { value: "all", label: "All" },
                  { value: "offline", label: "Offline" },
                ]}
              />
              <LibrarySearchField />
            </div>
          </>
        )}

        {songs.length === 0 ? (
          <p className="text-small text-muted-foreground max-w-md">
            {status === "offline" && !query
              ? "Nothing saved offline yet. Choose “Save offline” in any song’s or album’s menu and it’ll show up here."
              : allSongs.length === 0
              ? "No saved songs yet. Tap the heart on any track — in the player or a song list — and it'll show up here."
              : query
                ? `No songs match “${query}”.`
                : ""}
          </p>
        ) : footerNav ? (
          // Touch: stacked song rows (same component the detail pages use).
          <SongRows songs={songs} />
        ) : (
          // Desktop: the sortable list table (same chrome as Albums), with
          // an Album column.
          <SongListTable songs={songs} />
        )}
      </div>
    </div>
  )
}
