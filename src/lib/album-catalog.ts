/*
 * album-catalog — full detail records for the prototype's album pages.
 *
 * `albumMeta` (album-meta.ts) holds the lightweight title → year/price
 * map every AlbumCard reads. This file is the heavier lookup the
 * AlbumDetailView needs: track listings, the recording personnel, and a
 * per-artist "more from" rail. Keyed by the SAVED_ALBUMS library id so a
 * card's id threads straight through to `?page=Album&album=<id>` and the
 * per-user library store (purchased / owned) keeps working.
 *
 * Only the jazz classics at the top of the library (a01–a08) have rich
 * records here; any other id falls back to the default album in
 * AlbumDetailView. Covers reuse the known-good mzstatic URLs from
 * SAVED_ALBUMS so artwork always resolves.
 */

import { SAVED_ALBUMS, type SavedAlbum } from "@/components/app/library-albums-view"
import { slugify as slug } from "@/lib/media-nav"

export interface AlbumTrack {
  id:       string
  title:    string
  duration: string
}

export interface RailAlbum {
  title: string
  year:  number
  cover: string
}

export interface AlbumPerson {
  name:  string
  image: string
  /** Instrument / contribution, e.g. "Tenor Saxophone". Shown in the
   *  credits dialog; omitted for the plain "Artists on this album" rail. */
  role?: string
}

export interface AlbumDetail {
  id:            string
  cover:         string
  title:         string
  artist:        string
  artistAvatar:  string
  year:          number
  format:        string
  /** Stream-unlock price (shown on the CTA). Omit = free under sub. */
  buyingPrice?:   string
  /** Download-license price (optional upsell tier). */
  downloadPrice?: string
  /** Release label + recording date — surfaced in the credits dialog. */
  label?:         string
  recordingDate?: string
  tracks:         AlbumTrack[]
  artistsOnAlbum: AlbumPerson[]
  moreFrom:       RailAlbum[]
}

// ── Credits (release metadata for the "Show credits" dialog) ─────────
export interface Credits {
  mainArtist:    string
  album:         string
  cover:         string
  label?:        string
  recordingDate?: string
  /** Role → contributor name(s). */
  performers:    { role: string; names: string[] }[]
}

// ── Helpers ──────────────────────────────────────────────────────────
const portrait = (name: string) => `https://picsum.photos/seed/${slug(name)}/400/400`
const avatar   = (name: string) => `https://picsum.photos/seed/${slug(name)}-av/120/120`

// Known-good covers (reused from SAVED_ALBUMS). The "more from" rails
// cycle through this pool so every entry shows real artwork even when
// the exact release art isn't in the prototype's asset set.
const COVERS = {
  maidenVoyage: "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/23/49/49/234949c3-db74-f0eb-30f5-d715526e459b/19UMGIM73745.rgb.jpg/600x600bb.jpg",
  speakNoEvil:  "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a8/ee/3c/a8ee3cc7-e694-f7e1-5208-2c67f9ae5ed5/13ULAIM49176.rgb.jpg/600x600bb.jpg",
  blueTrain:    "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/6e/1a/13/6e1a134d-8f6f-d90f-b855-ea69436a2e8b/17UM1IM45370.rgb.jpg/600x600bb.jpg",
  coolStruttin: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d6/a3/1d/d6a31d82-038d-a73f-5452-0380d8bd9bae/00724349532755.jpg/600x600bb.jpg",
  empyrean:     "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/3b/30/51/3b305111-c28a-80ad-1f1d-6e89fb4fa2af/13ULAIM49306.rgb.jpg/600x600bb.jpg",
  outToLunch:   "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/d5/f1/41/d5f1417f-9c45-d013-392f-aa6c7c4b494c/13UABIM03210.rgb.jpg/600x600bb.jpg",
  aLoveSupreme: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/e5/24/aa/e524aacd-467b-66f3-8931-0fcd6750a4b9/08UMGIM07914.rgb.jpg/600x600bb.jpg",
  karma:        "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/01/36/a6/0136a666-36d2-caf1-efb1-da77a646d104/06UMGIM03764.rgb.jpg/600x600bb.jpg",
} as const

const COVER_POOL = Object.values(COVERS)

// Build a "more from" rail from a list of [title, year] tuples, cycling
// covers from the pool (offset so neighbouring artists don't line up).
const rail = (offset: number, items: [string, number][]): RailAlbum[] =>
  items.map(([title, year], i) => ({
    title, year, cover: COVER_POOL[(offset + i) % COVER_POOL.length],
  }))

const people = (...names: string[]): AlbumPerson[] =>
  names.map(name => ({ name, image: portrait(name) }))

// Personnel with instruments — for albums with authored credits. Each
// tuple is [name, role].
const lineup = (...rows: [string, string][]): AlbumPerson[] =>
  rows.map(([name, role]) => ({ name, image: portrait(name), role }))

// ── Records ──────────────────────────────────────────────────────────
const ALBUMS: AlbumDetail[] = [
  {
    id: "a07", cover: COVERS.aLoveSupreme,
    title: "A Love Supreme", artist: "John Coltrane", artistAvatar: avatar("John Coltrane"),
    year: 1965, format: "Album", buyingPrice: "$2.99", downloadPrice: "$4.99",
    label: "Impulse!", recordingDate: "December 9, 1964",
    tracks: [
      { id: "t1", title: "Acknowledgement", duration: "7:47" },
      { id: "t2", title: "Resolution",      duration: "7:21" },
      { id: "t3", title: "Pursuance",       duration: "10:46" },
      { id: "t4", title: "Psalm",           duration: "7:08" },
    ],
    artistsOnAlbum: lineup(
      ["John Coltrane", "Tenor Saxophone"], ["McCoy Tyner", "Piano"],
      ["Jimmy Garrison", "Double Bass"], ["Elvin Jones", "Drums"],
    ),
    moreFrom: rail(0, [
      ["Giant Steps", 1960], ["My Favorite Things", 1961], ["Crescent", 1964],
      ["Ascension", 1966], ["Africa/Brass", 1961], ["Blue Train", 1958],
    ]),
  },
  {
    id: "a03", cover: COVERS.blueTrain,
    title: "Blue Train", artist: "John Coltrane", artistAvatar: avatar("John Coltrane"),
    year: 1958, format: "Album",
    label: "Blue Note", recordingDate: "September 15, 1957",
    tracks: [
      { id: "t1", title: "Blue Train",       duration: "10:43" },
      { id: "t2", title: "Moment's Notice",  duration: "9:10" },
      { id: "t3", title: "Locomotion",       duration: "7:14" },
      { id: "t4", title: "I'm Old Fashioned", duration: "7:58" },
      { id: "t5", title: "Lazy Bird",        duration: "7:07" },
    ],
    artistsOnAlbum: lineup(
      ["John Coltrane", "Tenor Saxophone"], ["Lee Morgan", "Trumpet"],
      ["Curtis Fuller", "Trombone"], ["Kenny Drew", "Piano"],
      ["Paul Chambers", "Double Bass"], ["Philly Joe Jones", "Drums"],
    ),
    moreFrom: rail(2, [
      ["Giant Steps", 1960], ["A Love Supreme", 1965], ["My Favorite Things", 1961],
      ["Crescent", 1964], ["Coltrane's Sound", 1964], ["Ascension", 1966],
    ]),
  },
  {
    id: "a01", cover: COVERS.maidenVoyage,
    title: "Maiden Voyage", artist: "Herbie Hancock", artistAvatar: avatar("Herbie Hancock"),
    year: 1965, format: "Album",
    label: "Blue Note", recordingDate: "March 17, 1965",
    tracks: [
      { id: "t1", title: "Maiden Voyage",            duration: "7:55" },
      { id: "t2", title: "The Eye of the Hurricane", duration: "6:01" },
      { id: "t3", title: "Little One",               duration: "8:44" },
      { id: "t4", title: "Survival of the Fittest",  duration: "10:09" },
      { id: "t5", title: "Dolphin Dance",            duration: "9:17" },
    ],
    artistsOnAlbum: lineup(
      ["Herbie Hancock", "Piano"], ["Freddie Hubbard", "Trumpet"],
      ["George Coleman", "Tenor Saxophone"], ["Ron Carter", "Double Bass"],
      ["Tony Williams", "Drums"],
    ),
    moreFrom: rail(4, [
      ["Empyrean Isles", 1964], ["Takin' Off", 1962], ["Speak Like a Child", 1968],
      ["The Prisoner", 1969], ["Inventions and Dimensions", 1963], ["My Point of View", 1963],
    ]),
  },
  {
    id: "a02", cover: COVERS.speakNoEvil,
    title: "Speak No Evil", artist: "Wayne Shorter", artistAvatar: avatar("Wayne Shorter"),
    year: 1966, format: "Album", buyingPrice: "$2.99", downloadPrice: "$5.99",
    label: "Blue Note", recordingDate: "December 24, 1964",
    tracks: [
      { id: "t1", title: "Witch Hunt",       duration: "8:08" },
      { id: "t2", title: "Fee-Fi-Fo-Fum",    duration: "5:54" },
      { id: "t3", title: "Dance Cadaverous", duration: "6:46" },
      { id: "t4", title: "Speak No Evil",    duration: "8:24" },
      { id: "t5", title: "Infant Eyes",      duration: "6:51" },
      { id: "t6", title: "Wild Flower",      duration: "6:00" },
    ],
    artistsOnAlbum: lineup(
      ["Wayne Shorter", "Tenor Saxophone"], ["Freddie Hubbard", "Trumpet"],
      ["Herbie Hancock", "Piano"], ["Ron Carter", "Double Bass"], ["Elvin Jones", "Drums"],
    ),
    moreFrom: rail(6, [
      ["JuJu", 1965], ["Adam's Apple", 1967], ["Night Dreamer", 1964],
      ["The All Seeing Eye", 1966], ["Schizophrenia", 1969], ["Etcetera", 1980],
    ]),
  },
  {
    id: "a06", cover: COVERS.outToLunch,
    title: "Out to Lunch", artist: "Eric Dolphy", artistAvatar: avatar("Eric Dolphy"),
    year: 1964, format: "Album",
    label: "Blue Note", recordingDate: "February 25, 1964",
    tracks: [
      { id: "t1", title: "Hat and Beard",                    duration: "8:24" },
      { id: "t2", title: "Something Sweet, Something Tender", duration: "6:02" },
      { id: "t3", title: "Gazzelloni",                       duration: "7:22" },
      { id: "t4", title: "Out to Lunch",                     duration: "12:06" },
      { id: "t5", title: "Straight Up and Down",             duration: "8:19" },
    ],
    artistsOnAlbum: lineup(
      ["Eric Dolphy", "Alto Saxophone, Flute, Bass Clarinet"], ["Freddie Hubbard", "Trumpet"],
      ["Bobby Hutcherson", "Vibraphone"], ["Richard Davis", "Double Bass"], ["Tony Williams", "Drums"],
    ),
    moreFrom: rail(1, [
      ["Out There", 1960], ["Far Cry", 1961], ["Outward Bound", 1960],
      ["Iron Man", 1963], ["Conversations", 1963], ["In Europe", 1964],
    ]),
  },
  {
    id: "a04", cover: COVERS.coolStruttin,
    title: "Cool Struttin'", artist: "Sonny Clark", artistAvatar: avatar("Sonny Clark"),
    year: 1958, format: "Album", buyingPrice: "$2.49", downloadPrice: "$4.99",
    label: "Blue Note", recordingDate: "January 5, 1958",
    tracks: [
      { id: "t1", title: "Cool Struttin'",   duration: "9:21" },
      { id: "t2", title: "Blue Minor",       duration: "10:26" },
      { id: "t3", title: "Sippin' at Bells", duration: "8:13" },
      { id: "t4", title: "Deep Night",       duration: "7:17" },
    ],
    artistsOnAlbum: lineup(
      ["Sonny Clark", "Piano"], ["Art Farmer", "Trumpet"], ["Jackie McLean", "Alto Saxophone"],
      ["Paul Chambers", "Double Bass"], ["Philly Joe Jones", "Drums"],
    ),
    moreFrom: rail(3, [
      ["Sonny Clark Trio", 1957], ["Leapin' and Lopin'", 1962], ["Dial S for Sonny", 1957],
      ["Sonny's Crib", 1957], ["My Conception", 1959], ["Standards", 1958],
    ]),
  },
  {
    id: "a05", cover: COVERS.empyrean,
    title: "Empyrean Isles", artist: "Herbie Hancock", artistAvatar: avatar("Herbie Hancock"),
    year: 1964, format: "Album", buyingPrice: "$1.49",
    label: "Blue Note", recordingDate: "June 17, 1964",
    tracks: [
      { id: "t1", title: "One Finger Snap",   duration: "7:23" },
      { id: "t2", title: "Oliloqui Valley",   duration: "8:28" },
      { id: "t3", title: "Cantaloupe Island", duration: "5:33" },
      { id: "t4", title: "The Egg",           duration: "14:00" },
    ],
    artistsOnAlbum: lineup(
      ["Herbie Hancock", "Piano"], ["Freddie Hubbard", "Cornet"],
      ["Ron Carter", "Double Bass"], ["Tony Williams", "Drums"],
    ),
    moreFrom: rail(5, [
      ["Maiden Voyage", 1965], ["Takin' Off", 1962], ["Speak Like a Child", 1968],
      ["The Prisoner", 1969], ["Inventions and Dimensions", 1963], ["My Point of View", 1963],
    ]),
  },
  {
    id: "a08", cover: COVERS.karma,
    title: "Karma", artist: "Pharoah Sanders", artistAvatar: avatar("Pharoah Sanders"),
    year: 1969, format: "Album", buyingPrice: "$1.99",
    label: "Impulse!", recordingDate: "February 14, 1969",
    tracks: [
      { id: "t1", title: "The Creator Has a Master Plan", duration: "32:48" },
      { id: "t2", title: "Colors",                        duration: "5:35" },
    ],
    artistsOnAlbum: lineup(
      ["Pharoah Sanders", "Tenor Saxophone"], ["Leon Thomas", "Vocals"],
      ["Julius Watkins", "French Horn"], ["James Spaulding", "Flute"],
      ["Lonnie Liston Smith", "Piano"], ["Reggie Workman", "Double Bass"],
    ),
    moreFrom: rail(7, [
      ["Tauhid", 1967], ["Jewels of Thought", 1969], ["Thembi", 1971],
      ["Black Unity", 1971], ["Deaf Dumb Blind", 1970], ["Izipho Zam", 1973],
    ]),
  },
]

const BY_ID:   Record<string, AlbumDetail> = Object.fromEntries(ALBUMS.map(a => [a.id, a]))
const BY_SLUG: Record<string, AlbumDetail> = Object.fromEntries(ALBUMS.map(a => [slug(a.title), a]))

/** The hand-authored rich albums (a01–a08) — used by search to surface
 *  real track-level results (every track carries its album's cover, artist
 *  and year). Synthesized albums have only generic placeholder tracks, so
 *  search draws songs from these. */
export function getRichAlbums(): AlbumDetail[] { return ALBUMS }

/** Every album in the library base catalog — for search. Exposed from the
 *  catalog (not the view) so consumers don't import the library view module
 *  and create an import cycle. */
export function getAllAlbums(): SavedAlbum[] { return SAVED_ALBUMS }

/** Default album shown when no `?album` key is given or it's unknown. */
export const DEFAULT_ALBUM_ID = "a07"

// ── Base index (every album in the user's library) ───────────────────
// The rich records above cover only a01–a08. For every other album the
// library knows about we synthesize a coherent detail page from its base
// data (correct header, a generated track list, a same-artist rail) so
// any card anywhere can open a real-looking page rather than a wrong
// fallback. SAVED_ALBUMS is the shared base catalog.
const BASE_BY_SLUG: Record<string, SavedAlbum> = Object.fromEntries(
  SAVED_ALBUMS.map(a => [slug(a.title), a]),
)
const BASE_BY_ID: Record<string, SavedAlbum> = Object.fromEntries(
  SAVED_ALBUMS.map(a => [a.id, a]),
)

// Placeholder ingredients for synthesized (non-rich) albums. Obviously
// generic on close inspection, but they keep the page populated.
const TRACK_TITLES = [
  "Blue Mode", "Soft Winds", "Midnight Voyage", "Equinox Drift", "Modal Sketch",
  "Inner Urge", "After the Rain", "Stolen Moments", "Crescent Moon", "Soul Eyes",
  "Lotus Blossom", "Far Horizon", "Quiet Storm", "The Gathering", "Sunrise Mood",
  "Nightfall", "Ascent", "Blue Bossa", "Peace Piece", "Reverie",
]
const TRACK_DURATIONS = ["5:12", "6:40", "7:25", "4:58", "8:15", "9:30", "5:47", "6:03", "10:21", "7:08"]
const SIDEMEN = [
  "Ron Carter", "Tony Williams", "Paul Chambers", "Elvin Jones", "McCoy Tyner",
  "Freddie Hubbard", "Jimmy Garrison", "Philly Joe Jones", "Art Blakey", "Hank Mobley",
]

const hash = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function synthDetail(base: SavedAlbum): AlbumDetail {
  const seed = hash(base.title)
  const n = 4 + (seed % 3) // 4–6 tracks
  const tracks: AlbumTrack[] = Array.from({ length: n }, (_, i) => ({
    id:       `t${i + 1}`,
    title:    TRACK_TITLES[(seed + i) % TRACK_TITLES.length],
    duration: TRACK_DURATIONS[(seed + i * 3) % TRACK_DURATIONS.length],
  }))

  // Same-artist rail, padded with other library albums so it always
  // scrolls. Excludes the album itself.
  const sameArtist = SAVED_ALBUMS.filter(a => a.artist === base.artist && a.id !== base.id)
  const padding    = SAVED_ALBUMS.filter(a => a.artist !== base.artist)
  const railSrc    = [...sameArtist, ...padding].slice(0, 8)
  const moreFrom: RailAlbum[] = railSrc.map(a => ({
    title: a.title, year: a.year ?? base.year ?? 1965, cover: a.cover,
  }))

  const crew = [base.artist, ...Array.from({ length: 3 }, (_, i) => SIDEMEN[(seed + i) % SIDEMEN.length])]
  const artistsOnAlbum = people(...crew)

  return {
    id: base.id, cover: base.cover, title: base.title, artist: base.artist,
    artistAvatar: avatar(base.artist), year: base.year ?? 1965, format: "Album",
    buyingPrice: base.streamPrice, downloadPrice: base.downloadPrice,
    tracks, artistsOnAlbum, moreFrom,
  }
}

// Resolve a key (library id OR title slug) to a detail record. Rich
// records win; otherwise synthesize from the base catalog.
// Extra base albums registered at load time by other data modules
// (artist discographies, home rails) so their cards resolve to a real
// synthesized page instead of the default fallback. Keeps cross-module
// data out of this file without an import cycle.
const EXTRA_BY_SLUG: Record<string, SavedAlbum> = {}
const EXTRA_BY_ID:   Record<string, SavedAlbum> = {}

/** Register albums so `?album=<slug|id>` resolves to them. Idempotent;
 *  never overrides a rich or library record. Call at module load. */
export function registerAlbums(entries: SavedAlbum[]): void {
  for (const a of entries) {
    const s = slug(a.title)
    if (!BY_SLUG[s] && !BASE_BY_SLUG[s] && !EXTRA_BY_SLUG[s]) EXTRA_BY_SLUG[s] = a
    if (!BY_ID[a.id] && !BASE_BY_ID[a.id] && !EXTRA_BY_ID[a.id]) EXTRA_BY_ID[a.id] = a
  }
}

function resolve(key?: string | null): AlbumDetail | undefined {
  if (!key) return undefined
  return (
    BY_ID[key] ?? BY_SLUG[key] ??
    (BASE_BY_ID[key]   && synthDetail(BASE_BY_ID[key])) ??
    (BASE_BY_SLUG[key] && synthDetail(BASE_BY_SLUG[key])) ??
    (EXTRA_BY_ID[key]   && synthDetail(EXTRA_BY_ID[key])) ??
    (EXTRA_BY_SLUG[key] && synthDetail(EXTRA_BY_SLUG[key])) ??
    undefined
  )
}

/** Look up a full album detail by library id or title slug. Falls back
 *  to the default album when the key resolves to nothing. */
export function getAlbumDetail(key?: string | null): AlbumDetail {
  return resolve(key) ?? BY_ID[DEFAULT_ALBUM_ID]
}

/** True when the key resolves to a real album page (rich or synthesized
 *  from the library) — i.e. navigating won't dump the user on the
 *  default fallback. Used to gate which rail cards are clickable. */
export function hasAlbumDetail(key?: string | null): boolean {
  return resolve(key) !== undefined
}

/** Build the release credits for the "Show credits" dialog from an album
 *  key (slug or id). The lead artist is shown first as "Main", followed
 *  by the per-instrument personnel. Falls back to the default album when
 *  the key is unknown. */
export function getCredits(key?: string | null): Credits {
  const a = getAlbumDetail(key)
  const performers: Credits["performers"] = [
    { role: "Main", names: [a.artist] },
    ...a.artistsOnAlbum.map(p => ({ role: p.role ?? "Performer", names: [p.name] })),
  ]
  return {
    mainArtist: a.artist,
    album: a.title,
    cover: a.cover,
    label: a.label,
    recordingDate: a.recordingDate ?? String(a.year),
    performers,
  }
}
