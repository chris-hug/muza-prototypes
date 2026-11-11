"use client"

/*
 * Playlist additions — songs the listener put into a playlist through "Add
 * to playlist", shown at the end of that playlist's track list.
 *
 * The playlist catalog is static mock data, so the dialog used to confirm
 * with a toast and add nothing. Local tracks made that a real gap: the
 * production app says your files play "in your playlists", and a playlist
 * is the one place a local track sits between catalog tracks, so it has to
 * show there, marked "Local". This keeps the additions for the session.
 *
 * Seeded with one local track in "Blue Note Essentials" so a mixed playlist
 * is visible without adding one first.
 */

import { useSyncExternalStore } from "react"
import { slugify } from "@/lib/media-nav"
import type { SavedSong } from "@/lib/user-library"

/** A song as "Add to playlist" receives it. `local` names the track in the
 *  listener's own files (see local-library). */
export type PlaylistSong = SavedSong & { local?: { albumId: string; trackId: string } }

let additions: Record<string, PlaylistSong[]> = {
  "blue-note-essentials": [{
    id: "blue-minor-sonny-clark", title: "Blue Minor", artist: "Sonny Clark",
    album: "Cool Struttin'", duration: "10:19",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d6/a3/1d/d6a31d82-038d-a73f-5452-0380d8bd9bae/00724349532755.jpg/600x600bb.jpg",
    local: { albumId: "local-cool-struttin", trackId: "local-cool-struttin-2" },
  }],
}
const listeners = new Set<() => void>()
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }

export const playlistAdditions = {
  /** Add to the playlist with this title; a song already in it is not
   *  added twice. */
  add(playlistTitle: string, song: PlaylistSong) {
    const key = slugify(playlistTitle)
    const list = additions[key] ?? []
    if (list.some(s => s.id === song.id)) return
    additions = { ...additions, [key]: [...list, song] }
    listeners.forEach(l => l())
  },
}

export function usePlaylistAdditions(playlistTitle: string): PlaylistSong[] {
  const all = useSyncExternalStore(subscribe, () => additions, () => additions)
  return all[slugify(playlistTitle)] ?? EMPTY
}
const EMPTY: PlaylistSong[] = []
