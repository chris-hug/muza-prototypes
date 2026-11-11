"use client"

/*
 * Local tracks as song rows — the album page of a local album and Library ›
 * Songs › Local both list them.
 *
 * The rows are ordinary SongListItems with `local`: no heart (a file on disk is
 * in the library already) and the local song menu below instead of the catalog
 * one. A source that is off greys the rows and refuses to play, with the reason
 * in a toast, rather than hiding them.
 */

import { ExternalLink, FolderOpen, Info, Mic, RefreshCw } from "lucide-react"
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { AddMusicIcon } from "@/components/ui/media-icons"
import { SongListItem } from "@/components/ui/song-list-item"
import { useAddToPlaylist } from "@/lib/add-to-playlist-context"
import { usePlayer } from "@/lib/player"
import { useLocalActions } from "@/lib/use-local-actions"
import { cn } from "@/lib/utils"
import {
  localPlayingFrom, localSongId, SHOW_IN_FOLDER,
  type LocalAlbum, type LocalTrack,
} from "@/lib/local-library"

/** The song menu's local column: Add to playlist (a playlist may mix your
 *  files with the catalog), Open on muza and Show credits when matched, Show in
 *  Finder / Explorer, and Go to artist when matched. No Share, Save or Report. */
export function LocalSongMenuItems({ album, track }: { album: LocalAlbum; track: LocalTrack }) {
  const l = useLocalActions()(album)
  const addToPlaylist = useAddToPlaylist()
  const song = {
    id: localSongId(album, track), title: track.title, artist: album.artist, album: album.title,
    cover: album.cover, duration: track.duration,
    // So the playlist shows it as the local track it is, marked "Local".
    local: { albumId: album.id, trackId: track.id },
  }
  return (
    <>
      {l.onReconnect && <><DropdownMenuItem onClick={l.onReconnect}><RefreshCw />Reconnect…</DropdownMenuItem><DropdownMenuSeparator /></>}
      <DropdownMenuItem onClick={() => addToPlaylist.open(song)}><AddMusicIcon />Add to playlist</DropdownMenuItem>
      {l.onOpenOnMuza && <DropdownMenuItem onClick={l.onOpenOnMuza}><ExternalLink />Open on muza</DropdownMenuItem>}
      {l.onShowCredits && <DropdownMenuItem onClick={l.onShowCredits}><Info />Show credits</DropdownMenuItem>}
      {(l.onShowInFolder || l.onGoToArtist) && <DropdownMenuSeparator />}
      {l.onShowInFolder && <DropdownMenuItem onClick={l.onShowInFolder}><FolderOpen />{SHOW_IN_FOLDER}</DropdownMenuItem>}
      {l.onGoToArtist && <DropdownMenuItem onClick={l.onGoToArtist}><Mic />Go to artist</DropdownMenuItem>}
    </>
  )
}

/** One local track as a song row — used by LocalSongRows and by lists that
 *  mix local tracks with saved catalog songs (Library › Songs › All). */
export function LocalSongRow({ album, track, trackNumber, labelled = false }: {
  album: LocalAlbum
  track: LocalTrack
  /** Album page: the number, and no cover / artist / album (the header
   *  already says them). */
  trackNumber?: number
  /** The "Local" badge — Library › Songs. Not on the album page, whose
   *  header already says it once for every track. */
  labelled?: boolean
}) {
  const player = usePlayer()
  const l = useLocalActions()(album)
  const numbered = trackNumber != null
  const isThis = player.playingFrom === localPlayingFrom(album) && player.track?.title === track.title
  return (
    <SongListItem
      local
      badge={labelled ? "Local" : undefined}
      trackNumber={trackNumber}
      cover={numbered ? undefined : album.cover}
      title={track.title}
      artist={numbered ? undefined : album.artist}
      album={numbered ? undefined : album.title}
      duration={track.duration}
      playing={isThis && player.playing}
      onPlay={() => (isThis ? player.toggle() : l.play(track))}
      onArtistClick={numbered ? undefined : l.onGoToArtist}
      onAlbumClick={numbered ? undefined : l.open}
      onInfo={l.onShowCredits}
      menuItems={<LocalSongMenuItems album={album} track={track} />}
      className={cn(!l.available && "opacity-60")}
    />
  )
}

export function LocalSongRows({ albums, numbered = false, labelled = false }: {
  albums: LocalAlbum[]
  labelled?: boolean
  /** Album page: track numbers, and no artist / album on each row (the
   *  header already says them). Songs list: cover and both names. */
  numbered?: boolean
}) {
  return (
    <ul className="flex flex-col gap-2">
      {albums.flatMap(album => album.tracks.map((track, i) => (
        <li key={track.id}>
          <LocalSongRow album={album} track={track} trackNumber={numbered ? i + 1 : undefined} labelled={labelled} />
        </li>
      )))}
    </ul>
  )
}
