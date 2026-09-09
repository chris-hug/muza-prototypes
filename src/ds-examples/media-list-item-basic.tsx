"use client"

/*
 * Media List Item — one mixed list: an album, a playlist, a song, an artist
 * and a label together, as on a search tab or the library's list mode.
 *
 * This file is a CALL SITE, not a copy: it renders the real `MediaListItem`
 * off the real catalogs. The rows are nav rows — `onOpen` would route in the
 * app and is a no-op here; the song's cover is the one playable surface, and
 * the label has no page yet, so it gets no `onOpen` and no menu, as search
 * renders it. The ⋯ menus are the shared card menus.
 */

import { MediaListItem } from "@/components/ui/media-list-item"
import { AlbumCardMenuItems, PlaylistCardMenuItems } from "@/components/ui/cover-card-menu"
import { getRichAlbums } from "@/lib/album-catalog"
import { getAllPlaylists } from "@/lib/playlist-catalog"
import { SAVED_ARTISTS } from "@/lib/artist-data"

const ALBUMS   = getRichAlbums()
const ALBUM    = ALBUMS[0]
const SONG     = ALBUM.tracks[0]
const PLAYLIST = getAllPlaylists().find(p => p.id === "p13")!
const ARTIST   = SAVED_ARTISTS[0]
const LABEL    = ALBUM.label ?? "Impulse!"
const LABEL_N  = ALBUMS.filter(a => a.label === LABEL).length

export default function MediaListItemBasicExample() {
  return (
    <ul className="flex flex-col gap-1">
      <li>
        <MediaListItem type="album" cover={ALBUM.cover} title={ALBUM.title} subtitle={ALBUM.artist} meta={String(ALBUM.year)}
          onOpen={() => {}} menuItems={<AlbumCardMenuItems shareTitle={ALBUM.title} />} />
      </li>
      <li>
        <MediaListItem type="playlist" covers={PLAYLIST.covers} title={PLAYLIST.title} subtitle={PLAYLIST.owner} meta={`${PLAYLIST.songCount} Songs`}
          onOpen={() => {}} menuItems={<PlaylistCardMenuItems shareTitle={PLAYLIST.title} />} />
      </li>
      <li>
        <MediaListItem type="song" cover={ALBUM.cover} title={SONG.title} subtitle={ALBUM.artist} meta={String(ALBUM.year)}
          onOpen={() => {}} onPlay={() => {}} menuItems={<AlbumCardMenuItems shareTitle={ALBUM.title} />} />
      </li>
      <li>
        <MediaListItem type="artist" cover={ARTIST.image} title={ARTIST.name} onOpen={() => {}} />
      </li>
      <li>
        <MediaListItem type="label" cover={ALBUM.cover} title={LABEL} subtitle={`${LABEL_N} ${LABEL_N === 1 ? "album" : "albums"}`} />
      </li>
    </ul>
  )
}
