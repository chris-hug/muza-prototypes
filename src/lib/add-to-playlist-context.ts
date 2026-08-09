"use client"

/*
 * Add-to-playlist dialog context — lives in /lib so any component (incl.
 * /ui primitives like the song menus) can call `useAddToPlaylist()` without
 * importing the /app dialog. The AddToPlaylistProvider (in
 * app/add-to-playlist-dialog) supplies the real `open`; outside a provider
 * it's a no-op, so menus that bake it in never crash (e.g. the DS showcase).
 */

import { createContext, useContext } from "react"
import type { SavedSong } from "@/lib/user-library"

export interface AddToPlaylistContextValue {
  /** Open the "Add to playlist" dialog for a track. */
  open: (song: SavedSong) => void
}

export const AddToPlaylistContext = createContext<AddToPlaylistContextValue>({ open: () => {} })

export function useAddToPlaylist() {
  return useContext(AddToPlaylistContext)
}
