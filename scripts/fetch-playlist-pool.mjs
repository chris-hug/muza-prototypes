#!/usr/bin/env node
/*
 * Resolve a wider pool of real album covers for the playlist
 * composite mock data. Queries iTunes Search API for each
 * (title + artist) pair and prints an updated POOL array literal
 * the maintainer pastes into `library-playlists-view.tsx`.
 *
 * Re-runnable; misses are silently dropped (no placeholders here
 * since the pool is just visual variety, not seeded by id).
 *
 * Run:  node scripts/fetch-playlist-pool.mjs
 */

const seeds = [
  ["Scenery",                "Ryo Fukui"],
  ["Space Is the Place",     "Sun Ra"],
  ["Ascension",              "John Coltrane"],
  ["A Love Supreme",         "John Coltrane"],
  ["Pharoah",                "Pharoah Sanders"],
  ["Karma",                  "Pharoah Sanders"],
  ["The Quest",              "Mal Waldron"],
  ["Apocalypse",             "Thundercat"],
  ["Drunk",                  "Thundercat"],
  ["Source",                 "Nubya Garcia"],
  ["Promises",               "Floating Points"],
  ["Chet Baker Re:Imagined", "Various Artists"],
  ["Fyah",                   "Theon Cross"],
  ["In These Times",         "Makaya McCraven"],
  ["Universal Beings",       "Makaya McCraven"],
  ["Under Tangled Silence",  "Djrum"],
  ["Black Radio",            "Robert Glasper"],
  ["Black Radio III",        "Robert Glasper"],
  ["Kind of Blue",           "Miles Davis"],
  ["Bitches Brew",           "Miles Davis"],
  ["Mingus Ah Um",           "Charles Mingus"],
  ["Speak No Evil",          "Wayne Shorter"],
  ["Maiden Voyage",          "Herbie Hancock"],
  ["Head Hunters",           "Herbie Hancock"],
  ["Time Out",               "Dave Brubeck"],
  ["Giant Steps",            "John Coltrane"],
  ["Blue Train",             "John Coltrane"],
  ["My Favorite Things",     "John Coltrane"],
  ["Moanin'",                "Art Blakey"],
  ["The Shape of Jazz to Come","Ornette Coleman"],
  ["Free Jazz",              "Ornette Coleman"],
  ["Out to Lunch",           "Eric Dolphy"],
]

async function lookup(title, artist) {
  const term = encodeURIComponent(`${title} ${artist}`)
  const url  = `https://itunes.apple.com/search?term=${term}&entity=album&limit=1`
  const res  = await fetch(url, { headers: { "User-Agent": "muza-prototype/1.0" } })
  if (!res.ok) return null
  const json = await res.json()
  const hit  = json.results?.[0]
  if (!hit?.artworkUrl100) return null
  return hit.artworkUrl100.replace(/\/\d+x\d+bb\./, "/200x200bb.")
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

const resolved = []
for (const [title, artist] of seeds) {
  const url = await lookup(title, artist)
  if (url) {
    console.error(`  ✓ ${title} — ${artist}`)
    // Strip the leading host + thumb prefix so we can paste back as
    // the COVER("…") form used in the source file.
    const m = url.match(/^https:\/\/is1-ssl\.mzstatic\.com\/image\/thumb\/(.+)\/200x200bb\.jpg$/)
    if (m) resolved.push(m[1])
  } else {
    console.error(`  ✗ ${title} — ${artist}  (skipped)`)
  }
  await sleep(350)
}

console.log("// Paste into the POOL array in library-playlists-view.tsx\n")
console.log("const POOL: string[] = [")
for (const path of resolved) {
  console.log(`  COVER("${path}"),`)
}
console.log("]")
console.error(`\nDone — ${resolved.length}/${seeds.length} resolved.`)
