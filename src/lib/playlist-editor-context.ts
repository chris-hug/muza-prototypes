"use client"

/*
 * Playlist-editor drawer context.
 *
 * The drawer is mounted ONCE at the app-shell level (a flex sibling of
 * <main>), so it survives navigation: open it from a playlist, then browse to
 * Home / Search / any album and keep dragging tracks into it.
 *
 * Lives in /lib so any component (a playlist's Edit button, a song row that
 * wants to know whether a drop target exists) can reach it without importing
 * the drawer itself.
 */

import { createContext, useContext } from "react"
import type { SavedSong } from "@/lib/user-library"

export interface PlaylistEditorTarget {
  /** Title slug — identifies the playlist being edited. */
  key:    string
  title:  string
  covers?: string[]
  /** Private playlists show the lock badge instead of "Public". */
  isPrivate?: boolean
}

export interface PlaylistEditorContextValue {
  /** The playlist currently being edited, or null when the drawer is closed. */
  target: PlaylistEditorTarget | null
  /** Tracks dropped in this session (prototype: not persisted). */
  tracks: SavedSong[]
  open:  (target: PlaylistEditorTarget) => void
  close: () => void
  /** Append a dropped track (ignores duplicates). */
  addTrack: (song: SavedSong) => void
  removeTrack: (id: string) => void
}

export const PlaylistEditorContext = createContext<PlaylistEditorContextValue>({
  target: null,
  tracks: [],
  open:  () => {},
  close: () => {},
  addTrack: () => {},
  removeTrack: () => {},
})

export function usePlaylistEditor() {
  return useContext(PlaylistEditorContext)
}

/** MIME type used to carry a song through an HTML5 drag. */
export const SONG_DRAG_TYPE = "application/x-muza-song"
