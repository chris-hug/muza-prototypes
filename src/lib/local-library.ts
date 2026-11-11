/*
 * Local library — music that lives on the listener's own machine or server,
 * played through the muza player (the way Roon or iTunes play a folder).
 *
 * This replaces "Save offline". muza will not keep streamed or bought music on
 * the device for offline play, whatever you own; the one thing that plays
 * without a connection is your own files. So the library has two SOURCES, the
 * muza catalog and Local, and the question this module answers is the one the
 * UI keeps asking: is this item local, where does it live, can it be reached
 * right now, and does muza have it too.
 *
 * Mock data. How a folder gets connected and how its tags are read is backend
 * work (Nevo's "how user connects local file" and "Metadata" tickets); the
 * shapes here are what the surfaces need from that work.
 */

import { useMemo, useSyncExternalStore } from "react"
import { useUserLibrary } from "@/lib/user-library"
import { slugify } from "@/lib/media-nav"

export interface LocalSource {
  id:     string
  /** A folder on this computer, a folder on a network drive, or single
   *  files added one by one ("Add files"). */
  kind:   "folder" | "server" | "files"
  /** What the listener calls it: the machine or the server. */
  name:   string
  /** Where on it — shown under the name and by SHOW_IN_FOLDER. */
  path:   string
  /** The source is connected right now. A drive or server that is off keeps
   *  its music in the library, greyed, with `unavailableReason` saying why;
   *  hiding it would read as the music being gone. */
  available: boolean
  unavailableReason?: string
  /** Tracks found by the last scan. */
  tracks: number
  /** When it was last scanned, or last reached when it is off — as words. */
  lastSeen: string
  /** A scan in progress: tracks read so far of the estimated total. */
  scanning?: { done: number; total: number }
}

export interface LocalTrack {
  id:       string
  title:    string
  duration: string
}

export interface LocalAlbum {
  /** `local-…`, so a local album can never collide with a catalog key. */
  id:       string
  title:    string
  artist:   string
  year?:    number
  /** Embedded artwork from the files; a placeholder when they carry none. */
  cover:    string
  /** File format as the files report it, shown in the meta line. */
  format:   "FLAC" | "ALAC" | "MP3" | "AAC"
  sourceId: string
  /** Folder inside the source. */
  folder:   string
  tracks:   LocalTrack[]
  /** The catalog album these files are, by its library id and its page key.
   *  Set only on a confident match (artist + title + track count, or an ISRC
   *  from the tags): a wrong "Also on muza" costs more than a missing one. */
  match?:   { libraryId: string; key: string }
}

/** The menu row that opens the files' folder, named the way the operating
 *  system names it: "Show in Finder" on a Mac, "Show in Explorer" on
 *  Windows (File Explorer; Spotify's desktop app says the same), "Show in
 *  folder" on other desktops. A generic label on a Mac reads as a web page
 *  pretending; the native word says the app really hands the folder over.
 *
 *  `null` on a phone or tablet: there the files are played from a computer
 *  or server elsewhere, and there is no file manager to hand them to, so
 *  the row is left out rather than offered and refused. Detected by the
 *  platform, not the window width — a narrow desktop window is still a Mac
 *  with a Finder. iPadOS reports itself as a Mac; touch points give it away.
 *  `typeof navigator` guards the SPA shell prerender at build time. */
type NavigatorUAData = Navigator & { userAgentData?: { platform?: string; mobile?: boolean } }
const NAV = typeof navigator === "undefined" ? undefined : (navigator as NavigatorUAData)
const PLATFORM = NAV ? (NAV.userAgentData?.platform ?? NAV.platform ?? "") : ""
const HANDHELD = !!NAV && (
  NAV.userAgentData?.mobile === true ||
  /android|iphone|ipad|ipod/i.test(NAV.userAgent) ||
  (/mac/i.test(PLATFORM) && NAV.maxTouchPoints > 1)
)
export const SHOW_IN_FOLDER: string | null =
  HANDHELD ? null :
  /mac/i.test(PLATFORM) ? "Show in Finder" :
  /win/i.test(PLATFORM) ? "Show in Explorer" :
  "Show in folder"

const SEED_SOURCES: LocalSource[] = [
  { id: "mac", kind: "folder", name: "This Mac", path: "~/Music/Jazz", available: true, tracks: 13, lastSeen: "Scanned 2 minutes ago" },
  { id: "recordings", kind: "folder", name: "This Mac", path: "~/Music/My recordings", available: true, tracks: 3, lastSeen: "Scanned yesterday" },
  {
    // A folder on a network drive: the production app adds folders, and a
    // server's share is a folder like any other — until the drive is off.
    id: "nas", kind: "server", name: "Home server", path: "/Volumes/Home server/Music", available: false,
    // Short: it stands after the badge in a card's last line.
    unavailableReason: "Not connected",
    tracks: 4, lastSeen: "Last reached 3 days ago",
  },
]

/** A folder the prototype's "Add folder" picks, as if from the system's
 *  picker: its album is in LOCAL_ALBUMS and appears once the folder is
 *  added — so adding a source visibly fills the library. */
export const PICKABLE_FOLDER: Omit<LocalSource, "available" | "tracks" | "lastSeen"> = {
  id: "downloads", kind: "folder", name: "This Mac", path: "~/Downloads/Bandcamp",
}

// ─── Sources store ───────────────────────────────────────────────────────────
// Settings › Local music adds, rescans, reconnects and removes sources, and
// every library surface follows at once: a removed source takes its albums
// out, a reconnected one brings its rows back to full strength. A module
// store rather than a context so the plain helpers below (localSource,
// localDetail) read the same state the hooks subscribe to.

interface LocalState {
  sources:  LocalSource[]
  /** "Show local files" — production's master switch. Off hides every local
   *  item from the library, search and player queues; the sources stay. */
  enabled:  boolean
  /** Match files with muza releases ("Also on muza", credits, artist). */
  matching: boolean
}
let state: LocalState = { sources: SEED_SOURCES, enabled: true, matching: true }
const listeners = new Set<() => void>()
const emit = (next: LocalState) => { state = next; listeners.forEach(l => l()) }
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
const patch = (id: string, p: Partial<LocalSource>) =>
  emit({ ...state, sources: state.sources.map(s => (s.id === id ? { ...s, ...p } : s)) })

/** Re-renders on any change to the sources or the matching switch. */
export function useLocalState(): LocalState {
  return useSyncExternalStore(subscribe, () => state, () => state)
}

/** Simulated scan: counts up to `total`, then settles. */
function scan(id: string, total: number) {
  let done = 0
  patch(id, { scanning: { done, total } })
  const tick = () => {
    done = Math.min(total, done + Math.max(1, Math.ceil(total / 8)))
    if (done >= total) { patch(id, { scanning: undefined, tracks: total, lastSeen: "Scanned just now" }); return }
    patch(id, { scanning: { done, total } })
    setTimeout(tick, 250)
  }
  setTimeout(tick, 250)
}

export const localSources = {
  get: (id: string) => state.sources.find(s => s.id === id),
  add(source: Omit<LocalSource, "available" | "tracks" | "lastSeen">) {
    if (state.sources.some(s => s.id === source.id)) return
    const total = LOCAL_ALBUMS.filter(a => a.sourceId === source.id).reduce((n, a) => n + a.tracks.length, 0) || 12
    emit({ ...state, sources: [...state.sources, { ...source, available: true, tracks: 0, lastSeen: "Scanning" }] })
    scan(source.id, total)
  },
  rescan(id: string) {
    const s = localSources.get(id)
    if (s?.available) scan(id, s.tracks || 12)
  },
  /** Try the source again. The prototype's server answers on the second
   *  try, so both outcomes can be seen. */
  reconnect(id: string): boolean {
    const s = localSources.get(id)
    if (!s) return false
    const attempts = (reconnectAttempts.get(id) ?? 0) + 1
    reconnectAttempts.set(id, attempts)
    if (attempts < 2) { patch(id, { lastSeen: "Still not reachable · tried just now" }); return false }
    patch(id, { available: true, unavailableReason: undefined, lastSeen: "Connected just now" })
    return true
  },
  remove(id: string) {
    emit({ ...state, sources: state.sources.filter(s => s.id !== id) })
  },
  /** Undo for remove: puts the source back where it was. */
  restore(source: LocalSource, index: number) {
    if (state.sources.some(s => s.id === source.id)) return
    const sources = [...state.sources]
    sources.splice(Math.min(index, sources.length), 0, source)
    emit({ ...state, sources })
  },
  setMatching(matching: boolean) { emit({ ...state, matching }) },
  setEnabled(enabled: boolean) { emit({ ...state, enabled }) },
}
const reconnectAttempts = new Map<string, number>()

/** The local albums whose source is still added (reachable or not). A
 *  removed source takes its albums out; "Show local files" off hides all. */
export function useLocalAlbums(): LocalAlbum[] {
  const { sources, enabled } = useLocalState()
  return useMemo(
    () => (enabled ? LOCAL_ALBUMS.filter(a => sources.some(s => s.id === a.sourceId)) : []),
    [sources, enabled],
  )
}

const PLACEHOLDER = (seed: string) => `https://picsum.photos/seed/${seed}/400/400`
const t = (album: string, rows: [string, string][]): LocalTrack[] =>
  rows.map(([title, duration], i) => ({ id: `${album}-${i + 1}`, title, duration }))

export const LOCAL_ALBUMS: LocalAlbum[] = [
  {
    // Bought on muza for listening as well: the "Owned on muza" case.
    id: "local-speak-no-evil", title: "Speak No Evil", artist: "Wayne Shorter", year: 1966,
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a8/ee/3c/a8ee3cc7-e694-f7e1-5208-2c67f9ae5ed5/13ULAIM49176.rgb.jpg/600x600bb.jpg",
    format: "FLAC", sourceId: "mac", folder: "Wayne Shorter/Speak No Evil (1966)",
    tracks: t("local-speak-no-evil", [["Witch Hunt", "8:08"], ["Fee-Fi-Fo-Fum", "5:53"], ["Dance Cadaverous", "6:45"], ["Speak No Evil", "8:23"], ["Infant Eyes", "6:52"], ["Wild Flower", "6:01"]]),
    match: { libraryId: "a02", key: "speak-no-evil" },
  },
  {
    // On muza, not bought: the "Also on muza" case.
    id: "local-cool-struttin", title: "Cool Struttin'", artist: "Sonny Clark", year: 1958,
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d6/a3/1d/d6a31d82-038d-a73f-5452-0380d8bd9bae/00724349532755.jpg/600x600bb.jpg",
    format: "MP3", sourceId: "mac", folder: "Sonny Clark/Cool Struttin'",
    tracks: t("local-cool-struttin", [["Cool Struttin'", "9:22"], ["Blue Minor", "10:19"], ["Sippin' at Bells", "8:18"], ["Deep Night", "9:32"]]),
    match: { libraryId: "a04", key: "cool-struttin" },
  },
  {
    // Not on muza: no link at all.
    id: "local-kitchen-tapes", title: "Kitchen Tapes, Vol. 1", artist: "The Basement Trio", year: 2019,
    cover: PLACEHOLDER("kitchen-tapes"),
    format: "ALAC", sourceId: "mac", folder: "The Basement Trio/Kitchen Tapes, Vol. 1",
    tracks: t("local-kitchen-tapes", [["Kettle", "4:12"], ["Second Take", "6:40"], ["Window Light", "5:05"]]),
  },
  {
    id: "local-rehearsals-2024", title: "Rehearsals 2024", artist: "You", year: 2024,
    cover: PLACEHOLDER("rehearsals-2024"),
    format: "AAC", sourceId: "recordings", folder: "Rehearsals 2024",
    tracks: t("local-rehearsals-2024", [["Warm-up", "3:01"], ["Blues in F", "7:44"], ["Ballad sketch", "4:30"]]),
  },
  {
    // In the folder Settings › "Add folder" picks: appears once it is added.
    id: "local-bandcamp-drafts", title: "Night Shift Demos", artist: "Laila Moreno Quartet", year: 2023,
    cover: PLACEHOLDER("night-shift-demos"),
    format: "FLAC", sourceId: "downloads", folder: "Laila Moreno Quartet/Night Shift Demos",
    tracks: t("local-bandcamp-drafts", [["Overture for Late Trains", "5:12"], ["Neon Saint", "6:48"], ["Last Bus Home", "4:57"]]),
  },
  {
    // On a source that is off: greyed, with the reason, still listed.
    id: "local-song-for-my-father", title: "Song for My Father", artist: "Horace Silver", year: 1965,
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/7f/d0/cb/7fd0cbcc-3e89-4010-5cac-e91f1bb42909/19UMGIM60341.rgb.jpg/600x600bb.jpg",
    format: "FLAC", sourceId: "nas", folder: "Horace Silver/Song for My Father",
    tracks: t("local-song-for-my-father", [["Song for My Father", "7:17"], ["The Natives Are Restless Tonight", "6:09"], ["Calcutta Cutie", "8:31"], ["Que Pasa", "7:46"]]),
    match: { libraryId: "a33", key: "song-for-my-father" },
  },
]

const BY_ID = Object.fromEntries(LOCAL_ALBUMS.map(a => [a.id, a]))

export function isLocalKey(key?: string | null): boolean {
  return !!key && key.startsWith("local-")
}

export function getLocalAlbum(key?: string | null): LocalAlbum | undefined {
  return key ? BY_ID[key] : undefined
}

export function localSource(album: LocalAlbum): LocalSource {
  return state.sources.find(s => s.id === album.sourceId)
    // Removed while something still shows it: treat it as unreachable.
    ?? { id: album.sourceId, kind: "folder", name: "Removed source", path: "", available: false, unavailableReason: "Removed", tracks: 0, lastSeen: "" }
}

/** What follows the "Local" badge: the format, or — where the source is
 *  off — the reason it cannot play. */
export function localDetail(album: LocalAlbum): string {
  const source = localSource(album)
  return source.available ? album.format : source.unavailableReason ?? "Not connected"
}

/** The same in words, for a meta slot that is plain text (list rows). */
export function localLabel(album: LocalAlbum): string {
  return `Local · ${localDetail(album)}`
}

/** The player's "Playing from" for a local album. The suffix is how the
 *  player tells a local source from a catalog one with the same title. */
export const LOCAL_FROM_SUFFIX = " · Local"
export const localPlayingFrom = (album: LocalAlbum) => `${album.title}${LOCAL_FROM_SUFFIX}`
export function localAlbumFromPlaying(playingFrom: string): LocalAlbum | undefined {
  if (!playingFrom.endsWith(LOCAL_FROM_SUFFIX)) return undefined
  const title = playingFrom.slice(0, -LOCAL_FROM_SUFFIX.length)
  return LOCAL_ALBUMS.find(a => a.title === title)
}

/** Song id for a local track — the same scheme the song rows use. */
export const localSongId = (album: LocalAlbum, track: LocalTrack) =>
  slugify(`${track.title}-${album.artist}`)

/** What muza has of a local album: nothing, the album to buy or stream
 *  ("also"), or the album you already bought ("owned"). */
export type LocalMatch = "none" | "also" | "owned"
export function useLocalMatch() {
  const library = useUserLibrary()
  const { matching } = useLocalState()
  return useMemo(
    () => (album: LocalAlbum): LocalMatch =>
      !matching || !album.match ? "none" : library.isPurchased(album.match.libraryId) ? "owned" : "also",
    [library, matching],
  )
}
