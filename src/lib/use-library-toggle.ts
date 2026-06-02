"use client"

/*
 * useLibraryToggle — one place that flips a (type, id) in the user's
 * library AND fires the matching toast (with an Undo action). Every
 * "add to library" affordance routes through this so the feedback is
 * identical everywhere.
 */

import { useCallback } from "react"
import { useUserLibrary, type LibraryItemType, type SavedSong } from "@/lib/user-library"
import { useToast } from "@/components/ui/toast"

const TYPE_LABEL: Record<LibraryItemType, string> = {
  album:    "Album",
  playlist: "Playlist",
  artist:   "Artist",
  song:     "Song",
}

export function useLibraryToggle() {
  const library = useUserLibrary()
  const { add: toast } = useToast()

  /** Flip membership and toast. `name` (e.g. the track / album title) is
   *  shown in the toast body. For songs, pass `song` metadata so the Songs
   *  page can render the added row. Returns the new state. */
  return useCallback(
    (type: LibraryItemType, id: string, name?: string, song?: SavedSong): boolean => {
      const nowIn = library.toggle(type, id, song)
      toast({
        type:  nowIn ? "success" : "default",
        title: nowIn ? "Saved to Library" : "Removed from Library",
        description: name ? `${name} · ${TYPE_LABEL[type]}` : TYPE_LABEL[type],
        // Undo just flips it straight back.
        data: { actionLabel: "Undo", onAction: () => library.toggle(type, id, song) },
      })
      return nowIn
    },
    [library, toast],
  )
}
