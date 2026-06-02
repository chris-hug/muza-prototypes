"use client"

/*
 * search-catalog — the data layer behind the global search.
 *
 * Aggregates a flat, searchable index from the catalogs that already
 * exist (no new mock data):
 *   · songs     ← the rich albums' track lists (album-catalog)
 *   · albums    ← SAVED_ALBUMS    (library-albums-view)
 *   · playlists ← SAVED_PLAYLISTS (library-playlists-view)
 *   · artists   ← SAVED_ARTISTS   (library-artists-view)
 *   · labels    ← the five specialist labels, counted from SAVED_ALBUMS
 *
 * `searchCatalog(query)` returns ranked, typed results; the view filters
 * by scope (Muza Catalog vs My Library) against the user-library store,
 * since this module stays pure. `suggest()` powers the as-you-type list,
 * and a tiny localStorage-backed store keeps recent searches.
 */

import { useSyncExternalStore } from "react"

// Import through the catalog modules (getAllAlbums / getAllPlaylists) and a
// pure data module (artist-data) — NEVER the library *view* modules. The
// views pull in media-list-table, which cycles with the catalogs; making a
// view the entry of that cycle triggers a TDZ ("Cannot access SAVED_… before
// initialization"). The catalogs already sit safely in the graph.
import { getRichAlbums, getAllAlbums } from "@/lib/album-catalog"
import { getAllPlaylists } from "@/lib/playlist-catalog"
import { SAVED_ARTISTS } from "@/lib/artist-data"
import { slugify } from "@/lib/media-nav"

export type SearchKind = "song" | "album" | "artist" | "playlist" | "label"

export interface SearchResult {
  /** Stable, unique key for React. */
  id:       string
  kind:     SearchKind
  title:    string
  cover?:   string
  /** Playlist 2×2 collage tiles. */
  covers?:  string[]
  /** Second line before the dot — artist (song/album) or owner (playlist). */
  subtitle?: string
  /** Second line after the dot — year, "12 Songs", "8 albums". */
  meta?:    string
  /** Numeric release year (song / album) — for SongListItem's meta line. */
  year?:    number
  duration?: string
  /** Slug for navigation (album / artist / playlist detail). */
  navKey?:  string
  /** User-library store coordinates (omitted for labels — not saveable). */
  libraryType?: "song" | "album" | "artist" | "playlist"
  libraryId?:   string
  /** Song playback fields (fed into the global player). */
  artist?:  string
  album?:   string
}

// ─── Label index ────────────────────────────────────────────────────────────
// SAVED_ALBUMS has no `label` field, so map the well-known catalog artists
// to their home label. Albums by unmapped artists simply don't count — the
// five labels always appear, with a representative cover + real-ish count.
const LABEL_OF_ARTIST: Record<string, string> = {
  "Herbie Hancock": "Blue Note", "Wayne Shorter": "Blue Note",
  "Sonny Clark": "Blue Note", "Eric Dolphy": "Blue Note", "Lee Morgan": "Blue Note",
  "John Coltrane": "Impulse!", "Pharoah Sanders": "Impulse!",
  "Charles Mingus": "Impulse!", "Alice Coltrane": "Impulse!",
  "Charlie Haden": "Strata-East", "Gil Scott-Heron": "Strata-East",
  "Pharoah": "Strata-East",
  "Oliver Jones": "Justin Time", "Diana Krall": "Justin Time",
  "Thelonious Monk": "Evidence", "Art Blakey": "Evidence",
}
const LABEL_NAMES = ["Blue Note", "Impulse!", "Strata-East", "Justin Time", "Evidence"]

interface LabelEntry { name: string; cover: string; count: number }

function buildLabels(): LabelEntry[] {
  const albums = getAllAlbums()
  return LABEL_NAMES.map(name => {
    const members = albums.filter(a => LABEL_OF_ARTIST[a.artist] === name)
    return {
      name,
      cover: members[0]?.cover ?? albums[0]?.cover ?? "",
      count: members.length,
    }
  })
}

// ─── Build the flat index once ────────────────────────────────────────────────
function buildIndex(): SearchResult[] {
  const out: SearchResult[] = []

  // Songs — from the rich albums' real track lists.
  for (const al of getRichAlbums()) {
    for (const t of al.tracks) {
      out.push({
        // Track ids repeat across albums (t1, t2…), so qualify with the
        // album slug to keep the React key globally unique.
        id:       `song-${slugify(al.title)}-${t.id}`,
        kind:     "song",
        title:    t.title,
        cover:    al.cover,
        subtitle: al.artist,
        meta:     String(al.year),
        year:     al.year,
        duration: t.duration,
        artist:   al.artist,
        album:    al.title,
        navKey:   slugify(al.title),
        libraryType: "song",
        libraryId:   slugify(`${t.title}-${al.artist}`),
      })
    }
  }

  // Albums.
  for (const a of getAllAlbums()) {
    out.push({
      id:       `album-${a.id}`,
      kind:     "album",
      title:    a.title,
      cover:    a.cover,
      subtitle: a.artist,
      meta:     a.year ? String(a.year) : undefined,
      year:     a.year,
      navKey:   slugify(a.title),
      libraryType: "album",
      libraryId:   a.id,
    })
  }

  // Artists.
  for (const ar of SAVED_ARTISTS) {
    out.push({
      id:    `artist-${ar.id}`,
      kind:  "artist",
      title: ar.name,
      cover: ar.image,
      navKey: slugify(ar.name),
      libraryType: "artist",
      libraryId:   slugify(ar.name),
    })
  }

  // Playlists.
  for (const p of getAllPlaylists()) {
    const owner = p.owned ? "You" : (p.owner ?? "—")
    out.push({
      id:       `playlist-${p.id}`,
      kind:     "playlist",
      title:    p.title,
      covers:   p.covers,
      cover:    p.covers?.[0],
      subtitle: owner,
      meta:     `${p.songCount} Songs`,
      navKey:   slugify(p.title),
      libraryType: "playlist",
      libraryId:   slugify(p.title),
    })
  }

  // Labels.
  for (const l of buildLabels()) {
    out.push({
      id:    `label-${slugify(l.name)}`,
      kind:  "label",
      title: l.name,
      cover: l.cover,
      meta:  `${l.count} ${l.count === 1 ? "album" : "albums"}`,
    })
  }

  return out
}

let INDEX: SearchResult[] | null = null
function index(): SearchResult[] { return (INDEX ??= buildIndex()) }

// Fields a result is matched against.
function haystack(r: SearchResult): string {
  return [r.title, r.subtitle, r.album, r.artist].filter(Boolean).join(" ").toLowerCase()
}

/**
 * Ranked search over the whole catalog. Title `startsWith` ranks above a
 * `startsWith` on any other field, which ranks above a loose `includes`.
 * The view applies the scope (catalog vs library) filter afterward.
 */
export function searchCatalog(query: string): SearchResult[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const scored: { r: SearchResult; score: number }[] = []
  for (const r of index()) {
    const title = r.title.toLowerCase()
    const hay = haystack(r)
    let score = -1
    if (title.startsWith(q)) score = 0
    else if (hay.split(/\s+/).some(w => w.startsWith(q))) score = 1
    else if (hay.includes(q)) score = 2
    if (score >= 0) scored.push({ r, score })
  }
  scored.sort((a, b) => a.score - b.score || a.r.title.localeCompare(b.r.title))
  return scored.map(s => s.r)
}

/** Plain-text autosuggestions — catalog titles + recent searches. */
export function suggest(query: string, limit = 8): string[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const seen = new Set<string>()
  const out: string[] = []
  const push = (s: string) => {
    const key = s.toLowerCase()
    if (key.includes(q) && !seen.has(key)) { seen.add(key); out.push(s) }
  }
  for (const s of readRecents()) push(s)
  for (const r of searchCatalog(q)) {
    push(r.title)
    if (out.length >= limit) break
  }
  return out.slice(0, limit)
}

// ─── Recent searches (localStorage-backed reactive store) ─────────────────────
const RECENTS_KEY = "muza:recent-searches"
const RECENTS_MAX = 8
const RECENTS_SEED = [
  "coltrane live village vanguard 1961",
  "miles davis in a silent way full album",
  "what's that song from whiplash soundtrack",
  "art blakey moanin remastered",
  "kamasi washington new release 2025",
  "charles mingus better git it in your soul live",
]

let recents: string[] | null = null
const listeners = new Set<() => void>()

function readRecents(): string[] {
  if (recents) return recents
  if (typeof window === "undefined") return (recents = RECENTS_SEED)
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY)
    recents = raw ? (JSON.parse(raw) as string[]) : RECENTS_SEED
  } catch {
    recents = RECENTS_SEED
  }
  return recents!
}

function writeRecents(next: string[]) {
  recents = next
  if (typeof window !== "undefined") {
    try { window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }
  listeners.forEach(fn => fn())
}

/** Record a submitted query — moves it to the top, de-duped, capped. */
export function pushRecentSearch(query: string) {
  const q = query.trim()
  if (!q) return
  const next = [q, ...readRecents().filter(s => s.toLowerCase() !== q.toLowerCase())].slice(0, RECENTS_MAX)
  writeRecents(next)
}

export function removeRecentSearch(query: string) {
  writeRecents(readRecents().filter(s => s !== query))
}

export function clearRecentSearches() { writeRecents([]) }

/** Reactive recent-search list for components. */
export function useRecentSearches(): string[] {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb) },
    readRecents,
    () => RECENTS_SEED,
  )
}
