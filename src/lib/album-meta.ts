/*
 * album-meta — shared catalog metadata for the prototype.
 *
 * Title → { year, streamPrice, downloadPrice }. All AlbumCard
 * consumers across the app (Home rails, Library, Artist profile,
 * Album detail's "More from" rail, Playlist detail's track albums,
 * DS showcases) read from this map so the same album surfaces the
 * same year / price wherever it appears.
 *
 * In production this lookup is the catalog API. For the prototype
 * it's hand-curated.
 */

export interface AlbumMeta {
  year?:          number
  streamPrice?:   string
  downloadPrice?: string
}

const META: Record<string, AlbumMeta> = {
  // ── Library / classic catalog ──────────────────────────────────────
  "Maiden Voyage":              { year: 1965 },
  "Speak No Evil":              { year: 1966, streamPrice: "$2.99", downloadPrice: "$5.99" },
  "Blue Train":                 { year: 1958 },
  "Cool Struttin'":             { year: 1958, streamPrice: "$2.49", downloadPrice: "$4.99" },
  "Empyrean Isles":             { year: 1964, streamPrice: "$1.49" },
  "Out to Lunch":               { year: 1964 },
  "A Love Supreme":             { year: 1965, streamPrice: "$2.99", downloadPrice: "$4.99" },
  "Karma":                      { year: 1969, streamPrice: "$1.99" },
  "The Black Saint and the Sinner Lady": { year: 1963 },
  "Africa/Brass":               { year: 1961 },
  "Crescent":                   { year: 1964 },
  "Journey in Satchidananda":   { year: 1971 },
  "Winter in America":          { year: 1974, streamPrice: "$1.99", downloadPrice: "$3.99" },
  "Glass Bead Game":            { year: 1973, streamPrice: "$1.99", downloadPrice: "$3.99" },
  "Musa: Ancestral Streams":    { year: 1974 },
  "Izipho Zam":                 { year: 1973 },
  "Stepping Out":               { year: 1993 },
  "Just Friends":               { year: 1998, streamPrice: "$2.49", downloadPrice: "$3.99" },
  "Maple Groove":               { year: 1995 },
  "Live at Birdland":           { year: 1991 },
  "Solo Monk":                  { year: 1965 },
  "Rip, Rig and Panic":         { year: 1965 },
  "Volunteered Slavery":        { year: 1969 },
  "Scenery":                    { year: 1976 },

  // ── Discovery picks (Home rails) ───────────────────────────────────
  "Endlessness":                { year: 2024 },
  "Promises":                   { year: 2021, streamPrice: "$2.99", downloadPrice: "$5.99" },
  "Source":                     { year: 2020 },
  "In These Times":             { year: 2022, streamPrice: "$1.99" },
  "Black Acid Soul":            { year: 2021 },
  "Wisdom of Elders":           { year: 2016, streamPrice: "$2.49", downloadPrice: "$4.99" },
  "Space 1.8":                  { year: 2021 },
  "Black Focus":                { year: 2016 },
  "We Are Sent Here by History":              { year: 2020 },
  "Trust in the Lifeforce of the Deep Mystery": { year: 2019, streamPrice: "$2.49" },
  "Black Radio":                { year: 2012 },
  "Under Tangled Silence":      { year: 2025 },

  // ── More-from Coltrane (album-detail rail) ─────────────────────────
  "Giant Steps":                { year: 1960, streamPrice: "$2.49" },
  "My Favorite Things":         { year: 1961 },
  "Ascension":                  { year: 1966 },
  "Meditations":                { year: 1966 },
  "Live at the Village Vanguard": { year: 1962 },
  "Coltrane's Sound":           { year: 1964 },
}

/** Look up metadata by exact title. Returns an empty object when the
 *  catalog has nothing for this title — that's the "Free, no year"
 *  baseline, which the AlbumCard renders cleanly. */
export function albumMetaFor(title: string): AlbumMeta {
  return META[title] ?? {}
}

/* Title → SAVED_ALBUMS id so any surface can ask the per-user library
 * store whether an album is owned by title alone (without threading
 * SAVED_ALBUMS through every component). When a title isn't in this
 * map (discovery-only album, not in the user's catalog yet), the
 * AlbumCard's `purchased` prop just stays false. */
const TITLE_TO_LIBRARY_ID: Record<string, string> = {
  "Maiden Voyage":              "a01",
  "Speak No Evil":              "a02",
  "Blue Train":                 "a03",
  "Cool Struttin'":             "a04",
  "Empyrean Isles":             "a05",
  "Out to Lunch":               "a06",
  "A Love Supreme":             "a07",
  "Karma":                      "a08",
  "The Black Saint and the Sinner Lady": "a09",
  "Africa/Brass":               "a10",
  "Crescent":                   "a11",
  "Journey in Satchidananda":   "a12",
  "Winter in America":          "a13",
  "Glass Bead Game":            "a14",
  "Musa: Ancestral Streams":    "a15",
  "Izipho Zam":                 "a16",
  "Stepping Out":               "a17",
  "Just Friends":               "a18",
}

export function libraryIdForTitle(title: string): string | undefined {
  return TITLE_TO_LIBRARY_ID[title]
}
