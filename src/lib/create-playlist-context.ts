"use client"

/*
 * Create-playlist flow context — lives in /lib so any component (the mobile
 * Library header "+", the grid tile, the list row) can start the flow without
 * importing the /app dialogs. `CreatePlaylistProvider` (in
 * app/create-playlist-dialog) supplies the real `open`; outside a provider
 * it's a no-op.
 */

import { createContext, useContext } from "react"

export interface CreatePlaylistContextValue {
  /** Open the "New Playlist" sheet (which chains into "Add music"). */
  open: () => void
}

export const CreatePlaylistContext = createContext<CreatePlaylistContextValue>({ open: () => {} })

export function useCreatePlaylist() {
  return useContext(CreatePlaylistContext)
}
