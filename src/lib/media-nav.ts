"use client"

/*
 * useMediaNav — one place for "open this album / playlist" navigation.
 *
 * Every AlbumCard / PlaylistCard across the app (home rails, library
 * grids, detail-page rails, artist profile) routes through this so the
 * behaviour stays identical everywhere: set `?page=…` + the media key,
 * `replace: true` so card taps don't stack history entries.
 *
 * The key is the title slug (`slugify`) — titles are the one field
 * every card carries, so a slug resolves consistently no matter which
 * surface the card lives on. The detail views resolve that slug (or a
 * library id) back to a catalog record.
 */

import { useCallback } from "react"
import { useSearchParams } from "react-router"

/** URL-safe key from a human title. Stable for a given string. */
export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

export function useMediaNav() {
  const [, setParams] = useSearchParams()

  const go = useCallback(
    (page: string, key: string, value: string) => {
      setParams(
        prev => {
          const next = new URLSearchParams(prev)
          next.set("page", page)
          // Clear the other media keys so URLs don't accumulate stale
          // ids when hopping between an album, playlist and artist.
          for (const k of ["album", "playlist", "artist"]) {
            if (k !== key) next.delete(k)
          }
          next.set(key, value)
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const openAlbum    = useCallback((key: string) => go("Album", "album", key), [go])
  const openPlaylist = useCallback((key: string) => go("Playlist", "playlist", key), [go])
  // The artist profile is currently a single hard-coded page; we still
  // pass an `artist` slug so deep-linking can be wired later without
  // touching every call site.
  const openArtist   = useCallback((key: string) => go("Artist", "artist", key), [go])

  return { openAlbum, openPlaylist, openArtist }
}
