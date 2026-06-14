/*
 * playlist-catalog — full detail records for the prototype's playlist
 * pages, mirroring album-catalog. One rich, hand-authored playlist
 * (Late Night Improvisations); every other playlist the app knows about
 * (SAVED_PLAYLISTS) is synthesized into a coherent detail page from its
 * base data so any PlaylistCard anywhere can open a real-looking page.
 *
 * Keyed by title slug (the universal card key) with the library id as a
 * secondary lookup.
 */

import { SAVED_PLAYLISTS, type SavedPlaylist } from "@/components/app/library-playlists-view"
import { slugify as slug } from "@/lib/media-nav"
import { artistImage } from "@/lib/artist-data"

export interface PlaylistTrack {
  id:       string
  cover:    string
  title:    string
  artist:   string
  album:    string
  year:     number
  duration: string
}

export interface RailPlaylist {
  title:     string
  covers:    string[]
  owner?:    string
  songCount: number
}

export interface RailAlbum {
  title:  string
  artist: string
  cover:  string
  year:   number
}

export interface PlaylistPerson {
  name:  string
  /** Real portrait, or undefined → ArtistCard shows the branded placeholder. */
  image?: string
}

export interface PlaylistDetail {
  id:              string
  title:           string
  owner:           string
  ownerAvatar:     string
  cover:           string
  covers:          string[]
  /** "8 tracks · 1h 31m" style summary for the header meta line. */
  trackMeta:       string
  tracks:          PlaylistTrack[]
  /** Source albums the playlist's tracks are drawn from. */
  featuredAlbums:  RailAlbum[]
  featuredArtists: PlaylistPerson[]
  /** Other playlists with a similar vibe (catalog picks). */
  similarPlaylists: RailPlaylist[]
  /** The curator's own other playlists. */
  moreFrom:        RailPlaylist[]
}

// Real portraits from the curated artist DB / wider Wikipedia set.
// `portrait` → undefined for unknowns (ArtistCard shows the branded
// placeholder); `avatar` keeps a pravatar fallback for the small owner
// avatar where a circle must always fill.
const portrait = (name: string) => artistImage(name)
const avatar   = (name: string) => artistImage(name) ?? `https://i.pravatar.cc/400?u=${slug(name)}`

// ── Shared track pool ────────────────────────────────────────────────
// Synthesized playlists draw rows from this pool (real jazz tracks with
// real album art) so every playlist page is populated and coherent.
const TRACK_POOL: Omit<PlaylistTrack, "id">[] = [
  { cover: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/e5/24/aa/e524aacd-467b-66f3-8931-0fcd6750a4b9/08UMGIM07914.rgb.jpg/600x600bb.jpg", title: "Acknowledgement",        artist: "John Coltrane",   album: "A Love Supreme",  year: 1965, duration: "7:47" },
  { cover: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/6e/1a/13/6e1a134d-8f6f-d90f-b855-ea69436a2e8b/17UM1IM45370.rgb.jpg/600x600bb.jpg", title: "Moment's Notice",         artist: "John Coltrane",   album: "Blue Train",      year: 1958, duration: "9:08" },
  { cover: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/cb/85/94/cb85949f-5a43-58d5-c866-d9d0292354bd/06UMGIM01616.rgb.jpg/600x600bb.jpg", title: "Track A — Solo Dancer",   artist: "Charles Mingus",  album: "The Black Saint…", year: 1963, duration: "6:37" },
  { cover: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/01/36/a6/0136a666-36d2-caf1-efb1-da77a646d104/06UMGIM03764.rgb.jpg/600x600bb.jpg", title: "The Creator Has a Master Plan", artist: "Pharoah Sanders", album: "Karma", year: 1969, duration: "32:48" },
  { cover: "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/23/49/49/234949c3-db74-f0eb-30f5-d715526e459b/19UMGIM73745.rgb.jpg/600x600bb.jpg", title: "Maiden Voyage",           artist: "Herbie Hancock",  album: "Maiden Voyage",   year: 1965, duration: "7:55" },
  { cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a8/ee/3c/a8ee3cc7-e694-f7e1-5208-2c67f9ae5ed5/13ULAIM49176.rgb.jpg/600x600bb.jpg", title: "Witch Hunt",              artist: "Wayne Shorter",   album: "Speak No Evil",   year: 1966, duration: "8:08" },
  { cover: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d6/a3/1d/d6a31d82-038d-a73f-5452-0380d8bd9bae/00724349532755.jpg/600x600bb.jpg", title: "Cool Struttin'",          artist: "Sonny Clark",     album: "Cool Struttin'",  year: 1958, duration: "9:21" },
  { cover: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/d5/f1/41/d5f1417f-9c45-d013-392f-aa6c7c4b494c/13UABIM03210.rgb.jpg/600x600bb.jpg", title: "Hat and Beard",           artist: "Eric Dolphy",     album: "Out to Lunch",    year: 1964, duration: "8:24" },
  { cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/3b/30/51/3b305111-c28a-80ad-1f1d-6e89fb4fa2af/13ULAIM49306.rgb.jpg/600x600bb.jpg", title: "Cantaloupe Island",       artist: "Herbie Hancock",  album: "Empyrean Isles",  year: 1964, duration: "5:33" },
  { cover: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/01/36/a6/0136a666-36d2-caf1-efb1-da77a646d104/06UMGIM03764.rgb.jpg/600x600bb.jpg", title: "Colors",                  artist: "Pharoah Sanders", album: "Karma",           year: 1969, duration: "5:35" },
]

const hash = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

// "8 tracks · 1h 31m" — track count from the playlist record, duration
// estimated at ~6½ min/track so the figure feels plausible.
const fmtMeta = (songCount: number) => {
  const mins  = Math.round(songCount * 6.5)
  const h     = Math.floor(mins / 60)
  const m     = mins % 60
  const dur   = h > 0 ? `${h}h ${m}m` : `${m}m`
  return `${songCount} tracks · ${dur}`
}

const railOf = (p: SavedPlaylist): RailPlaylist => ({
  title: p.title, covers: p.covers, owner: p.owner, songCount: p.songCount,
})

// The distinct source albums the playlist's tracks come from.
const albumsFromTracks = (tracks: PlaylistTrack[]): RailAlbum[] => {
  const seen = new Set<string>()
  const out: RailAlbum[] = []
  for (const t of tracks) {
    if (seen.has(t.album)) continue
    seen.add(t.album)
    out.push({ title: t.album, artist: t.artist, cover: t.cover, year: t.year })
  }
  return out
}

// ── Rich record(s) ───────────────────────────────────────────────────
const LATE_NIGHT: PlaylistDetail = {
  id: "late-night-improvisations",
  title: "Late Night Improvisations",
  owner: "Jules",
  ownerAvatar: "https://picsum.photos/seed/jules/120/120",
  cover: TRACK_POOL[0].cover,
  covers: [TRACK_POOL[0].cover, TRACK_POOL[1].cover, TRACK_POOL[2].cover, TRACK_POOL[3].cover],
  trackMeta: "8 tracks · 1h 31m",
  tracks: TRACK_POOL.slice(0, 8).map((t, i) => ({ ...t, id: `t${i + 1}` })),
  featuredAlbums: albumsFromTracks(TRACK_POOL.map((t, i) => ({ ...t, id: `tp${i + 1}` }))),
  featuredArtists: [
    "John Coltrane", "Charles Mingus", "Pharoah Sanders", "Herbie Hancock",
    "Wayne Shorter", "Sonny Clark", "Eric Dolphy",
  ].map(name => ({ name, image: portrait(name) })),
  // Similar-vibe picks vs. the curator's own catalogue — two distinct
  // windows of the library so the rails don't repeat the same cards.
  similarPlaylists: SAVED_PLAYLISTS.slice(8, 16).map(railOf),
  moreFrom: SAVED_PLAYLISTS.slice(0, 8).map(railOf),
}

const RICH: PlaylistDetail[] = [LATE_NIGHT]
const RICH_BY_SLUG: Record<string, PlaylistDetail> = Object.fromEntries(RICH.map(p => [slug(p.title), p]))

// ── Base index ───────────────────────────────────────────────────────
const BASE_BY_SLUG: Record<string, SavedPlaylist> = Object.fromEntries(
  SAVED_PLAYLISTS.map(p => [slug(p.title), p]),
)
const BASE_BY_ID: Record<string, SavedPlaylist> = Object.fromEntries(
  SAVED_PLAYLISTS.map(p => [p.id, p]),
)

function synthDetail(base: SavedPlaylist): PlaylistDetail {
  const seed   = hash(base.title)
  const owner  = base.owner ?? "You"
  // Show up to 10 rows from the pool, offset by the seed so playlists
  // don't all open with the same first track.
  const n      = Math.min(base.songCount, TRACK_POOL.length, 10)
  const tracks: PlaylistTrack[] = Array.from({ length: n }, (_, i) => {
    const t = TRACK_POOL[(seed + i) % TRACK_POOL.length]
    return { ...t, id: `t${i + 1}` }
  })

  // Other playlists by the same curator, padded with the rest.
  const sameOwner = SAVED_PLAYLISTS.filter(p => p.owner === base.owner && base.owner && p.id !== base.id)
  const padding   = SAVED_PLAYLISTS.filter(p => p.id !== base.id && p.owner !== base.owner)
  const moreFrom: RailPlaylist[] = [...sameOwner, ...padding].slice(0, 8).map(railOf)
  const moreFromIds = new Set(moreFrom.map(p => p.title))

  // Similar playlists — a different window of the library so it doesn't
  // echo the "More from" rail. Seeded so it's stable per playlist.
  const rest = SAVED_PLAYLISTS.filter(p => p.id !== base.id && !moreFromIds.has(p.title))
  const start = seed % Math.max(1, rest.length - 8)
  const similarPlaylists: RailPlaylist[] = rest.slice(start, start + 8).map(railOf)

  // Featured rails draw from the FULL track pool (not just this playlist's
  // windowed tracks) so every playlist surfaces a full rail (≥7) regardless
  // of how many songs it has.
  const poolTracks      = TRACK_POOL.map((t, i) => ({ ...t, id: `tp${i + 1}` }))
  const featuredAlbums  = albumsFromTracks(poolTracks)
  const featuredArtists = Array.from(new Set(TRACK_POOL.map(t => t.artist)))
    .map(name => ({ name, image: portrait(name) }))

  return {
    id: base.id, title: base.title, owner, ownerAvatar: avatar(owner),
    cover: base.covers[0], covers: base.covers,
    trackMeta: fmtMeta(base.songCount), tracks,
    featuredAlbums, featuredArtists, similarPlaylists, moreFrom,
  }
}

// Extra base playlists registered at load time by other data modules
// (artist curated playlists, home rails) so their cards resolve.
const EXTRA_BY_SLUG: Record<string, SavedPlaylist> = {}
const EXTRA_BY_ID:   Record<string, SavedPlaylist> = {}

/** Register playlists so `?playlist=<slug|id>` resolves to them.
 *  Idempotent; never overrides a rich or library record. */
export function registerPlaylists(entries: SavedPlaylist[]): void {
  for (const p of entries) {
    const s = slug(p.title)
    if (!RICH_BY_SLUG[s] && !BASE_BY_SLUG[s] && !EXTRA_BY_SLUG[s]) EXTRA_BY_SLUG[s] = p
    if (!BASE_BY_ID[p.id] && !EXTRA_BY_ID[p.id]) EXTRA_BY_ID[p.id] = p
  }
}

function resolve(key?: string | null): PlaylistDetail | undefined {
  if (!key) return undefined
  return (
    RICH_BY_SLUG[key] ??
    (BASE_BY_ID[key]   && synthDetail(BASE_BY_ID[key])) ??
    (BASE_BY_SLUG[key] && synthDetail(BASE_BY_SLUG[key])) ??
    (EXTRA_BY_ID[key]   && synthDetail(EXTRA_BY_ID[key])) ??
    (EXTRA_BY_SLUG[key] && synthDetail(EXTRA_BY_SLUG[key])) ??
    undefined
  )
}

/** Default playlist shown when no `?playlist` key is given or unknown. */
export const DEFAULT_PLAYLIST_KEY = slug(LATE_NIGHT.title)

/** Every saved playlist — for search. Exposed from the catalog (not the
 *  view) so consumers don't import the library view module and create an
 *  import cycle. */
export function getAllPlaylists(): SavedPlaylist[] { return SAVED_PLAYLISTS }

/** Look up a full playlist detail by title slug or library id. Falls
 *  back to the default playlist when the key resolves to nothing. */
export function getPlaylistDetail(key?: string | null): PlaylistDetail {
  return resolve(key) ?? LATE_NIGHT
}

/** True when the key resolves to a real playlist page. */
export function hasPlaylistDetail(key?: string | null): boolean {
  return resolve(key) !== undefined
}
