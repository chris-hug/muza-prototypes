"use client"

/*
 * LibraryAllView — the combined "All" tab of the mobile library. One
 * mixed collection (albums + playlists + artists) shown as either a
 * grid of cards or a list of MediaListItem rows, ordered by the shared
 * library sort. The frosted MobileAppHeader carries the "Library" title
 * + filter pills, so this view is just a toolbar (sort + view switch)
 * and the collection.
 *
 * Mobile-only by intent: reached via the footer-nav "Library" tab and
 * the "All" pill (`?page=Library`).
 */

import {
  LibraryAllMobileList, LibrarySortMenu, LibraryViewToggle, MobileAlbumRow, MobilePlaylistRow, mergeLibraryItems,
} from "@/components/app/media-list-table"
import { AlbumCard } from "@/components/ui/album-card"
import { PlaylistCard } from "@/components/ui/playlist-card"
import { ArtistCard } from "@/components/ui/artist-card"
import { SAVED_ALBUMS } from "@/components/app/library-albums-view"
import { SAVED_PLAYLISTS } from "@/components/app/library-playlists-view"
import { SAVED_ARTISTS } from "@/components/app/library-artists-view"
import { useUserLibrary, type SavedSong } from "@/lib/user-library"
import { useMediaNav, slugify } from "@/lib/media-nav"
import { useLibraryView } from "@/lib/use-library-view"
import { useLibrarySort, addedTs } from "@/lib/use-library-sort"
import { useLibraryStatus } from "@/lib/use-library-status"
import { MixedSongRow } from "@/components/app/library-songs-view"

export function LibraryAllView() {
  const library = useUserLibrary()
  const [view, setView] = useLibraryView()
  // Offline is the row's one cross-type filter: everything saved for this
  // device, whatever kind it is, and artists have nothing to save.
  const [status] = useLibraryStatus<"all" | "offline">("library")
  const offline = status === "offline"
  // Only songs saved on their own. What came with an album or a playlist is
  // already that row; listing it again doubled the album (and only the album:
  // a playlist's songs never appeared here). Songs › Offline still has them.
  const offlineSongs = library.offlineSongs()
  const albums = SAVED_ALBUMS.filter(a => offline ? library.isOffline("album", a.id) : library.isAdded(a.id))
  const playlists = offline ? SAVED_PLAYLISTS.filter(p => library.isOffline("playlist", slugify(p.title))) : SAVED_PLAYLISTS
  const artists = offline ? [] : SAVED_ARTISTS
  const empty = offline && albums.length === 0 && playlists.length === 0 && offlineSongs.length === 0

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-[1480px] px-page pt-4 pb-12">
        <div className="flex items-center justify-between gap-4 mb-4">
          <LibrarySortMenu />
          {/* Offline has one form, so nothing to switch between. */}
          {!offline && <LibraryViewToggle value={view} onChange={setView} />}
        </div>
        {empty ? (
          <p className="text-small text-muted-foreground max-w-md">
            Nothing saved offline yet. Choose “Save offline” on music you own, an album, a song or a playlist, and it’ll show up here.
          </p>
        ) : offline ? (
          <OfflineList albums={albums} playlists={playlists} songs={offlineSongs} />
        ) : view === "grid" ? (
          <LibraryAllGrid albums={albums} playlists={playlists} artists={artists} />
        ) : (
          <LibraryAllMobileList albums={albums} playlists={playlists} artists={artists} />
        )}
      </div>
    </div>
  )
}

// Offline is the one view holding songs next to albums and playlists, and
// songs have no card. Cards above rows made two surfaces out of one list, so
// every type is the same row, sorted together, and the badge names the type.
function OfflineList({ albums, playlists, songs }: {
  albums: typeof SAVED_ALBUMS
  playlists: typeof SAVED_PLAYLISTS
  songs: SavedSong[]
}) {
  const library = useUserLibrary()
  const [sort] = useLibrarySort()
  // "Recently added" means saved for this device, not added to the library.
  // A new save is always newer than the synthetic date the seed falls back on.
  const savedAt = (type: "album" | "playlist" | "song", id: string, title: string) =>
    library.offlineSavedAt(type, id) ?? addedTs(title)
  const items = [
    ...albums.map(a => ({ key: `al-${a.id}`, title: a.title, at: savedAt("album", a.id, a.title), row: <MobileAlbumRow album={a} showType /> })),
    ...playlists.map(p => ({ key: `pl-${p.id}`, title: p.title, at: savedAt("playlist", slugify(p.title), p.title), row: <MobilePlaylistRow playlist={p} showType /> })),
    ...songs.map(s => ({ key: `so-${s.id}`, title: s.title, at: savedAt("song", s.id, s.title), row: <MixedSongRow song={s} /> })),
  ].sort((a, b) =>
    sort === "title-az" ? a.title.localeCompare(b.title)
    : sort === "added-asc" ? a.at - b.at
    : b.at - a.at,
  )
  return (
    <ul className="flex flex-col gap-1">
      {items.map(it => <li key={it.key}>{it.row}</li>)}
    </ul>
  )
}

// Combined grid — the same merged/sorted items as the list, rendered as
// the type-appropriate card (album / playlist / artist).
function LibraryAllGrid({ albums, playlists, artists }: {
  albums: typeof SAVED_ALBUMS
  playlists: typeof SAVED_PLAYLISTS
  artists: typeof SAVED_ARTISTS
}) {
  const library = useUserLibrary()
  const { openAlbum, openPlaylist, openArtist } = useMediaNav()
  const [sort] = useLibrarySort()
  const items = mergeLibraryItems(albums, playlists, artists, sort)

  return (
    <div className="@container">
      <ul className="grid-cards">
        {items.map(it => (
          <li key={it.key}>
            {it.kind === "album" && (
              <AlbumCard
                cover={it.album.cover}
                title={it.album.title}
                artist={it.album.artist}
                year={it.album.year}
                streamPrice={it.album.streamPrice}
                downloadPrice={it.album.downloadPrice}
                purchased={library.isPurchased(it.album.id)}
                inLibrary
                onRemove={() => library.remove(it.album.id)}
                onTitleClick={() => openAlbum(slugify(it.album.title))}
                onPlay={() => openAlbum(slugify(it.album.title))}
                className="w-full"
              />
            )}
            {it.kind === "playlist" && (
              <PlaylistCard
                title={it.playlist.title}
                covers={it.playlist.covers}
                songCount={it.playlist.songCount}
                owner={it.playlist.owner}
                owned={it.playlist.owned}
                inLibrary={!it.playlist.owned}
                onTitleClick={() => openPlaylist(slugify(it.playlist.title))}
                onPlay={() => openPlaylist(slugify(it.playlist.title))}
                className="w-full"
              />
            )}
            {it.kind === "artist" && (
              <ArtistCard
                name={it.artist.name}
                image={it.artist.image}
                onClick={() => openArtist(slugify(it.artist.name))}
                className="w-full"
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
