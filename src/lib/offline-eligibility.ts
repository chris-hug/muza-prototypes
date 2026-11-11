"use client"

/*
 * useOfflineEligibility — what may be saved offline. Offline is for music that
 * is yours: an album you bought (either tier) or uploaded, a song from an album
 * you bought, and in a playlist only the songs you own.
 *
 * The product decision (Assif, Nov 2026): offline listening is being built for
 * owned music. Offline for streamed music is a separate piece of work: a
 * streaming service that lets you keep streamed tracks on the device needs
 * protection for them that muza does not have, and it is not needed until the
 * streaming catalogue itself is. The prototype used to offer "Save offline" on
 * anything you could play, which promised the second thing.
 *
 * A song has no purchase of its own in the store, so it is owned through its
 * album, looked up by title (`libraryIdForTitle`). Callers still show "Remove
 * from offline" on anything already saved, whatever this says, so an item can
 * always be taken off the device.
 */

import { useMemo } from "react"
import { useUserLibrary } from "@/lib/user-library"
import { libraryIdForTitle } from "@/lib/album-meta"
import { getPlaylistDetail, hasPlaylistDetail } from "@/lib/playlist-catalog"

export function useOfflineEligibility() {
  const library = useUserLibrary()
  return useMemo(() => {
    const ownsAlbumTitled = (title?: string) => {
      const id = title ? libraryIdForTitle(title) : undefined
      return !!id && library.isPurchased(id)
    }
    return {
      /** An album you bought, or one you uploaded (`uploaded`). */
      album: (id: string, uploaded = false) => uploaded || library.isPurchased(id),
      /** A song, through the album it is on. */
      song: (albumTitle?: string) => ownsAlbumTitled(albumTitle),
      /** How many of a playlist's songs you own; 0 means no offline row. */
      playlistOwnedCount: (key: string) =>
        hasPlaylistDetail(key)
          ? getPlaylistDetail(key).tracks.filter(t => ownsAlbumTitled(t.album)).length
          : 0,
    }
  }, [library])
}
