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
import { SAVED_ALBUMS, useLocalAlbumRows } from "@/components/app/library-albums-view"
import { SAVED_PLAYLISTS } from "@/components/app/library-playlists-view"
import { SAVED_ARTISTS } from "@/components/app/library-artists-view"
import { useUserLibrary } from "@/lib/user-library"
import { useMediaNav, slugify } from "@/lib/media-nav"
import { useLibraryView } from "@/lib/use-library-view"
import { useLibrarySort } from "@/lib/use-library-sort"
import { useLibraryStatus } from "@/lib/use-library-status"

export function LibraryAllView() {
  const library = useUserLibrary()
  const [view, setView, viewOptions] = useLibraryView()
  // Local is the row's one cross-type filter: the listener's own files,
  // whatever kind. Today that is albums only (a folder of tracks reads as an
  // album; loose files and local playlists come with the connect flow).
  // Without the filter, local albums sit in the collection with the catalog,
  // each marked — one library, narrowed by source.
  const [status] = useLibraryStatus<"all" | "local">("library")
  const localOnly = status === "local"
  const localAlbumRows = useLocalAlbumRows()
  const albums = localOnly ? localAlbumRows : [...SAVED_ALBUMS.filter(a => library.isAdded(a.id)), ...localAlbumRows]
  const playlists = localOnly ? [] : SAVED_PLAYLISTS
  const artists = localOnly ? [] : SAVED_ARTISTS
  const empty = localOnly && albums.length === 0

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-[1480px] px-page pt-4 pb-12">
        <div className="flex items-center justify-between gap-4 mb-4">
          <LibrarySortMenu />
          <LibraryViewToggle value={view} onChange={setView} options={viewOptions} />
        </div>
        {empty ? (
          <p className="text-small text-muted-foreground max-w-md">
            No local music yet. Connect a folder on this computer or a server, and muza plays your own files here.
          </p>
        ) : view === "grid" ? (
          <LibraryAllGrid albums={albums} playlists={playlists} artists={artists} />
        ) : (
          <LibraryAllMobileList albums={albums} playlists={playlists} artists={artists} />
        )}
      </div>
    </div>
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
                local={it.album.local}
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
