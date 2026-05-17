#!/usr/bin/env node
/*
 * Fetch artist portrait URLs from Wikipedia for the Library and Home
 * artist rails. For each name, query Wikipedia's REST `pageimages`
 * endpoint and grab the 400px-thumb URL. Misses fall back to the
 * existing pravatar placeholder so the array always renders.
 *
 * Run:  node scripts/fetch-wikipedia-artist-images.mjs
 *
 * Wikipedia API has no auth and a generous rate limit; we throttle
 * to ~3 req/s out of politeness.
 */

const artists = [
  // ── Home page weekly rail ───────────────────────────────────────
  "John Coltrane",
  "Alice Coltrane",
  "Pharoah Sanders",
  "Nubya Garcia",
  "Makaya McCraven",
  "Nala Sinephro",
  "Floating Points",
  "Shabaka Hutchings",
  "Yussef Dayes",
  "Robert Glasper",
  "Lady Blackbird",
  "Theon Cross",
  // ── Library view extras ─────────────────────────────────────────
  "Yusef Lateef",
  "Sun Ra",
  "Don Cherry",
  "Anthony Braxton",
  "Loraine James",
  "Djrum",
  "Thundercat",
  "Mal Waldron",
  "Ryo Fukui",
  // ── Album-page artists (so home + album cards match) ────────────
  "Herbie Hancock",
  "Wayne Shorter",
  "Sonny Clark",
  "Eric Dolphy",
  "Charles Mingus",
  "Gil Scott-Heron",
  "Clifford Jordan",
  "Stanley Cowell",
  "Diana Krall",
  "Oliver Jones",
  "Thelonious Monk",
  "Roland Kirk",
  "Lee Morgan",
  "Cannonball Adderley",
  "Horace Silver",
  "Joe Henderson",
  "Andrew Hill",
  "Duke Ellington",
  "Charles Tolliver",
  "Ranee Lee",
  "Oscar Peterson",
  "Cecil Taylor",
  "Andrew Cyrille",
  "Ornette Coleman",
  "Yussef Kamaal",
  "Sons of Kemet",
  "Shabaka and the Ancestors",
  "The Comet Is Coming",
  "D'Angelo",
  "Robert Glasper",
]

async function lookup(name) {
  // Use the REST page-summary endpoint — it returns a thumbnail for
  // most pages that the action API's `pageimages` quietly omits.
  const url =
    "https://en.wikipedia.org/api/rest_v1/page/summary/" +
    encodeURIComponent(name.replace(/ /g, "_"))
  const res = await fetch(url, { headers: { "User-Agent": "muza-prototype/1.0 (contact: chris@hug.group)" } })
  if (!res.ok) return null
  const json = await res.json()
  const src  = json?.thumbnail?.source ?? json?.originalimage?.source
  if (!src) return null
  // The summary thumbnail defaults to 200-320px. Upgrade to 400px
  // by editing the `/NNNpx-` segment in the URL when present.
  return src.replace(/\/\d+px-/, "/500px-")
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const out = []
for (const name of artists) {
  const url = await lookup(name)
  if (url) {
    console.error(`  ✓ ${name}`)
    out.push({ name, url })
  } else {
    console.error(`  ✗ ${name} (no Wikipedia image)`)
    out.push({ name, url: null })
  }
  await sleep(350)
}

console.log("// Paste into the relevant artist data files\n")
console.log("const WIKIPEDIA_PORTRAITS: Record<string, string> = {")
for (const { name, url } of out) {
  if (url) console.log(`  ${JSON.stringify(name)}: ${JSON.stringify(url)},`)
}
console.log("}")
console.error(`\nDone — ${out.filter(o => o.url).length}/${out.length} resolved.`)
