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

import { useState, useMemo } from "react"

import { SongListItem } from "@/components/ui/song-list-item"
import { SongListTable } from "@/components/app/media-list-table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SAVED_ALBUMS } from "@/components/app/library-albums-view"
import { useUserLibrary, type SavedSong } from "@/lib/user-library"
import { usePlayer } from "@/lib/player"
import { useFooterNav } from "@/lib/use-media-query"
import { useLibraryFilter, matchesLibraryQuery } from "@/lib/use-library-filter"
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

export function LibrarySongsView() {
  const library   = useUserLibrary()
  const player    = usePlayer()
  const footerNav = useFooterNav()
  const { openAlbum, openArtist } = useMediaNav()
  const [query] = useLibraryFilter()
  // Songs have no status of their own — "Downloaded" derives from the song's
  // ALBUM being downloaded (tier "download"). No "Owned" tab: you don't buy a
  // single track here. Desktop-only, like the Albums status tabs.
  const [status, setStatus] = useState<"all" | "downloaded">("all")
  const albumIdByTitle = useMemo(
    () => new Map(SAVED_ALBUMS.map(a => [a.title, a.id])),
    [],
  )
  const isDownloaded = (s: SavedSong) => {
    const id = s.album ? albumIdByTitle.get(s.album) : undefined
    return !!id && library.entryFor(id)?.tier === "download"
  }
  const allSongs = library.songs()
  const songs = allSongs
    // In-library search — match title / artist / album.
    .filter(s => matchesLibraryQuery(query, s.title, s.artist, s.album))
    .filter(s => status === "all" || isDownloaded(s))

  return (
    <div className="flex-1 overflow-auto">
      <div className="@container mx-auto max-w-[1480px] min-[1920px]:max-w-[1716px] px-page pt-8 pb-12">
        {/* Mobile already shows "Library" + active pill in the header. */}
        {!footerNav && (
          <>
            <h1 className="text-2xlarge font-medium text-foreground tracking-tight mb-4">Songs</h1>
            {/* Status tabs (left) + in-library search (right). */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <Tabs value={status} onValueChange={v => setStatus(v as "all" | "downloaded")}>
                <TabsList variant="line" autoCenter={false}>
                  <TabsTrigger value="all">All songs</TabsTrigger>
                  <TabsTrigger value="downloaded">Downloaded</TabsTrigger>
                </TabsList>
              </Tabs>
              <LibrarySearchField />
            </div>
          </>
        )}

        {songs.length === 0 ? (
          <p className="text-small text-muted-foreground max-w-md">
            {allSongs.length === 0
              ? "No saved songs yet. Tap the heart on any track — in the player or a song list — and it'll show up here."
              : query
                ? `No songs match “${query}”.`
                : "No downloaded songs yet — download an album to keep its tracks offline."}
          </p>
        ) : footerNav ? (
          // Touch: stacked song rows (same component the detail pages use).
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
        ) : (
          // Desktop: the sortable list table (same chrome as Albums), with
          // an Album column.
          <SongListTable songs={songs} />
        )}
      </div>
    </div>
  )
}
