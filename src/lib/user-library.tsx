"use client"

/*
 * UserLibraryProvider — shared, app-level state for "what's in this
 * user's library". Lets surfaces across the prototype (detail pages,
 * library grids, the player, song rows, cards) read the same source of
 * truth without prop-drilling.
 *
 * Two layers of state:
 *
 *   1. ALBUMS — richer, because albums can be *purchased*. Keyed by
 *      `albumId` with `added` / `purchased` / `tier` flags.
 *   2. PLAYLIST / ARTIST / SONG — a plain "saved" set per type. No money
 *      semantics; you've either added it or you haven't.
 *
 * A unified `(type, id)` API (`inLibrary` / `toggle` / `addItem` /
 * `removeItem`) routes albums to layer 1 and everything else to layer 2,
 * so generic surfaces (the animated heart button, card menus) don't have
 * to special-case albums.
 *
 * State persists to localStorage so adds survive a reload.
 *
 * Wire by mounting `<UserLibraryProvider>` once at the app shell.
 */

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from "react"

export type LibraryItemType = "album" | "playlist" | "artist" | "song"

/** What can be saved for playing without a connection. An artist cannot:
 *  there is no finite set of tracks to save. */
export type OfflineItemType = "album" | "playlist" | "song"

interface LibraryEntry {
  added:     boolean
  purchased: boolean
  /** Tier picked at checkout — affects what actions are available
   *  later (download is only meaningful when tier === "download"). */
  tier?:     "stream" | "download"
}

/** Saved song — songs have no standalone catalog, so the library stores
 *  the row's own metadata when you add it, enough to render the Songs
 *  page from the store alone. */
export interface SavedSong {
  id:        string
  title:     string
  artist?:   string
  album?:    string
  cover?:    string
  duration?: string
}

/** Saved sets for the non-album types. Playlists / artists render from
 *  their own catalogs, so a membership flag is enough; songs carry their
 *  metadata (see above). */
interface SavedSets {
  playlist: Record<string, true>
  artist:   Record<string, true>
  song:     Record<string, SavedSong>
}

const EMPTY_SAVED: SavedSets = { playlist: {}, artist: {}, song: {} }

/** Saved offline, per type. Deliberately NOT part of `LibraryEntry`: offline
 *  is about this device and works on anything you can play, whether or not
 *  you bought it or even saved it to your library. The file purchase
 *  (`tier: "download"`) is a different thing again, a licence to keep files. */
export interface OfflineSets {
  album:    Record<string, true>
  playlist: Record<string, true>
  /** Songs carry their metadata, like `saved.song`: a song can be offline
   *  without being in the library, and then nothing else could render it. */
  song:     Record<string, SavedSong>
}
const EMPTY_OFFLINE: OfflineSets = { album: {}, playlist: {}, song: {} }

interface PersistShape {
  albums: Record<string, LibraryEntry>
  saved:  SavedSets
  offline: OfflineSets
  /** The demo's offline seed has been applied; see `offlineSeed`. */
  offlineSeeded?: boolean
  /** When each item was saved offline, keyed `type:id`. Apart from the sets
   *  so what is already stored keeps working; an item without a time sorts
   *  by its synthetic added date instead. */
  offlineAt?: Record<string, number>
}

interface UserLibraryContextValue {
  // ── Album-specific (purchase-aware) ──────────────────────────────
  entryFor: (albumId: string) => LibraryEntry | undefined
  isAdded:     (albumId: string) => boolean
  isPurchased: (albumId: string) => boolean
  /** Free add — listener taps the + on an album they don't own. */
  add:     (albumId: string) => void
  /** Money exchanged — auto-adds to library and marks purchased. */
  purchase: (albumId: string, tier: "stream" | "download") => void
  /** Upgrade an already-purchased stream-tier entry to download. */
  upgradeToDownload: (albumId: string) => void
  remove:  (albumId: string) => void

  // ── Unified (all content types) ──────────────────────────────────
  /** Is this item in the library? */
  inLibrary: (type: LibraryItemType, id: string) => boolean
  /** Save to library (no-op if already there). For songs, pass the row's
   *  metadata so the Songs page can render it. */
  addItem:   (type: LibraryItemType, id: string, song?: SavedSong) => void
  /** Remove from library. */
  removeItem:(type: LibraryItemType, id: string) => void
  /** Flip membership. Returns the NEW state (`true` = now in library). */
  toggle:    (type: LibraryItemType, id: string, song?: SavedSong) => boolean
  /** All saved songs (most-recently-added first). */
  songs:     () => SavedSong[]

  // ── Offline (this device) ────────────────────────────────────────
  isOffline:     (type: OfflineItemType, id: string) => boolean
  /** When it was saved offline; undefined for the demo seed. */
  offlineSavedAt: (type: OfflineItemType, id: string) => number | undefined
  /** Flip offline. Returns the NEW state (`true` = now saved offline). */
  toggleOffline: (type: OfflineItemType, id: string, song?: SavedSong) => boolean
  /** Songs saved offline on their own (not via their album). */
  offlineSongs:  () => SavedSong[]
}

const UserLibraryContext = createContext<UserLibraryContextValue | null>(null)

// v2: songs went from a boolean membership set to metadata objects, so
// v1 persisted data is incompatible — a fresh key discards it cleanly.
const STORAGE_KEY = "muza.library.v2"

/** Read persisted state from localStorage (browser only). */
function loadPersisted(): PersistShape | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PersistShape>
    return {
      albums: parsed.albums ?? {},
      saved:  { ...EMPTY_SAVED, ...(parsed.saved ?? {}) },
      offline: { ...EMPTY_OFFLINE, ...(parsed.offline ?? {}) },
      offlineSeeded: parsed.offlineSeeded,
      offlineAt: parsed.offlineAt,
    }
  } catch {
    return null
  }
}

export function UserLibraryProvider({
  /** Optional album seed — surfaces that demo content (the library grid)
   *  can pre-populate so the prototype doesn't open empty. Applied only
   *  when there's nothing persisted yet. */
  seed,
  /** Optional seed for the non-album saved sets (playlist / artist /
   *  song), so those library grids also open populated. */
  savedSeed,
  /** Optional seed for the offline sets, so Library › Offline has something
   *  to show. Unlike the seeds above it is also merged into a library that
   *  is already stored, once: every existing visitor has one, and offline
   *  would stay empty for all of them. The flag keeps what you remove gone. */
  offlineSeed,
  /** `false` keeps this provider in memory: it neither reads nor writes
   *  the visitor's stored library. For a page that shows fixed states. */
  persist = true,
  children,
}: {
  seed?:      Record<string, LibraryEntry>
  savedSeed?: Partial<SavedSets>
  offlineSeed?: OfflineSets
  persist?:   boolean
  children:   ReactNode
}) {
  // Lazy init: prefer persisted state; fall back to the demo seed.
  const [albums, setAlbums] = useState<Record<string, LibraryEntry>>(
    () => (persist ? loadPersisted()?.albums : undefined) ?? seed ?? {},
  )
  const [saved, setSaved] = useState<SavedSets>(
    () => (persist ? loadPersisted()?.saved : undefined) ?? { ...EMPTY_SAVED, ...savedSeed },
  )
  const [offline, setOffline] = useState<OfflineSets>(() => {
    const stored = persist ? loadPersisted() : null
    const base = stored?.offline ?? EMPTY_OFFLINE
    if (stored?.offlineSeeded || !offlineSeed) return base
    return {
      album:    { ...offlineSeed.album,    ...base.album },
      playlist: { ...offlineSeed.playlist, ...base.playlist },
      song:     { ...offlineSeed.song,     ...base.song },
    }
  })

  const [offlineAt, setOfflineAt] = useState<Record<string, number>>(
    () => (persist ? loadPersisted()?.offlineAt : undefined) ?? {},
  )

  // Persist on any change.
  useEffect(() => {
    if (typeof window === "undefined" || !persist) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ albums, saved, offline, offlineSeeded: true, offlineAt }))
    } catch { /* quota / private mode — ignore */ }
  }, [albums, saved, offline, offlineAt, persist])

  // ── Album mutators ───────────────────────────────────────────────
  const add = useCallback((albumId: string) => {
    setAlbums(prev => ({
      ...prev,
      [albumId]: { ...prev[albumId], added: true, purchased: prev[albumId]?.purchased ?? false },
    }))
  }, [])

  const purchase = useCallback((albumId: string, tier: "stream" | "download") => {
    setAlbums(prev => ({ ...prev, [albumId]: { added: true, purchased: true, tier } }))
  }, [])

  const upgradeToDownload = useCallback((albumId: string) => {
    setAlbums(prev => {
      const existing = prev[albumId]
      if (!existing) return prev
      return { ...prev, [albumId]: { ...existing, tier: "download" } }
    })
  }, [])

  const remove = useCallback((albumId: string) => {
    setAlbums(prev => {
      const next = { ...prev }
      delete next[albumId]
      return next
    })
  }, [])

  // ── Saved-set mutators ───────────────────────────────────────────
  // Playlists / artists: a simple membership flag.
  const addSimple = useCallback((type: "playlist" | "artist", id: string) => {
    setSaved(prev => ({ ...prev, [type]: { ...prev[type], [id]: true } }))
  }, [])
  const removeSimple = useCallback((type: "playlist" | "artist", id: string) => {
    setSaved(prev => {
      const nextType = { ...prev[type] }
      delete nextType[id]
      return { ...prev, [type]: nextType }
    })
  }, [])
  // Songs: store the row's metadata so the Songs page can render it.
  const addSong = useCallback((song: SavedSong) => {
    setSaved(prev => ({ ...prev, song: { ...prev.song, [song.id]: song } }))
  }, [])
  const removeSong = useCallback((id: string) => {
    setSaved(prev => {
      const nextSong = { ...prev.song }
      delete nextSong[id]
      return { ...prev, song: nextSong }
    })
  }, [])

  const value = useMemo<UserLibraryContextValue>(() => {
    const inLibrary = (type: LibraryItemType, id: string) =>
      type === "album" ? Boolean(albums[id]?.added) : Boolean(saved[type][id])

    const addItem = (type: LibraryItemType, id: string, song?: SavedSong) => {
      if (type === "album") add(id)
      else if (type === "song") addSong(song ?? { id, title: id })
      else addSimple(type, id)
    }

    const removeItem = (type: LibraryItemType, id: string) => {
      if (type === "album") remove(id)
      else if (type === "song") removeSong(id)
      else removeSimple(type, id)
    }

    const toggle = (type: LibraryItemType, id: string, song?: SavedSong) => {
      const next = !inLibrary(type, id)
      if (next) addItem(type, id, song)
      else removeItem(type, id)
      return next
    }

    return {
      entryFor:    (id) => albums[id],
      isAdded:     (id) => Boolean(albums[id]?.added),
      isPurchased: (id) => Boolean(albums[id]?.purchased),
      add, purchase, upgradeToDownload, remove,
      inLibrary, addItem, removeItem, toggle,
      // Guard against malformed persisted entries (e.g. a pre-metadata
      // boolean leaking in) so consumers always get real song objects.
      songs: () => Object.values(saved.song).filter((s): s is SavedSong => Boolean(s && typeof s === "object" && (s as SavedSong).title)),
      isOffline: (type, id) => Boolean(offline[type][id]),
      offlineSavedAt: (type, id) => offlineAt[`${type}:${id}`],
      toggleOffline: (type, id, song) => {
        const next = !offline[type][id]
        setOfflineAt(prev => {
          const { [`${type}:${id}`]: _gone, ...rest } = prev
          return next ? { ...rest, [`${type}:${id}`]: Date.now() } : rest
        })
        setOffline(prev => {
          const nextType: Record<string, true | SavedSong> = { ...prev[type] }
          if (next) nextType[id] = type === "song" ? (song ?? { id, title: id }) : true
          else delete nextType[id]
          return { ...prev, [type]: nextType }
        })
        return next
      },
      offlineSongs: () => Object.values(offline.song).filter((s): s is SavedSong => Boolean(s && typeof s === "object" && s.title)),
    }
  }, [albums, saved, offline, offlineAt, add, purchase, upgradeToDownload, remove, addSimple, removeSimple, addSong, removeSong])

  return (
    <UserLibraryContext.Provider value={value}>
      {children}
    </UserLibraryContext.Provider>
  )
}

export function useUserLibrary(): UserLibraryContextValue {
  const v = useContext(UserLibraryContext)
  if (!v) throw new Error("useUserLibrary must be used inside <UserLibraryProvider>")
  return v
}
