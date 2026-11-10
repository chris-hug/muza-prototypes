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
          // The artist page's landing state belongs to one visit.
          next.delete("artist-tab")
          next.delete("artist-kind")
          next.delete("artist-view")
          next.delete("list")
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
  // Resolved by `getArtistProfile`; a slug without a profile shows Sun Ra.
  const openArtist   = useCallback((key: string) => go("Artist", "artist", key), [go])

  // An album's "All albums": the artist's Discography, already narrowed to
  // that kind. Read once when the artist page mounts — after that the tab and
  // the filter are the page's own state.
  const openArtistDiscography = useCallback((key: string, kind: string) => {
    setParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.set("page", "Artist")
        next.delete("album")
        next.delete("playlist")
        next.set("artist", key)
        next.set("artist-tab", "discography")
        next.set("artist-kind", kind)
        next.delete("artist-view")
        next.delete("list")
        return next
      },
      { replace: true },
    )
  }, [setParams])

  return { openAlbum, openPlaylist, openArtist, openArtistDiscography }
}
