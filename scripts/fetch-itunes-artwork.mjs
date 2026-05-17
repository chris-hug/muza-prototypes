#!/usr/bin/env node
/*
 * One-shot artwork resolver for the Library mock data.
 *
 * Reads the album seed list from `src/components/app/library-albums-view.tsx`,
 * queries the iTunes Search API for each (title + artist) pair, upgrades the
 * thumbnail URL to 600×600, and prints an updated TypeScript array literal
 * the maintainer pastes back into the source file.
 *
 * Run:  node scripts/fetch-itunes-artwork.mjs
 *
 * Notes:
 *   · iTunes Search API has no auth requirement but a ~20 req/minute soft
 *     ceiling — we throttle to 1 req every 350 ms to stay safe.
 *   · On a miss we keep the original picsum URL so the array still renders.
 *   · The script is idempotent: re-running it overwrites previously
 *     resolved URLs with fresh lookups (artwork sometimes changes).
 */

import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const SOURCE    = join(__dirname, "..", "src", "components", "app", "library-albums-view.tsx")

// ─── Pull the seed array out of the source file ─────────────────────────────
//
// The seed lives between the const declaration and its closing bracket.
// We parse the lines with a tiny ad-hoc regex — no need for a full TS
// parser since the format is hand-written and predictable.

const source = await readFile(SOURCE, "utf8")
const blockMatch = source.match(/const SAVED_ALBUMS:[\s\S]*?\[\s*([\s\S]*?)\s*\]\s*\n/)
if (!blockMatch) {
  console.error("Could not locate SAVED_ALBUMS array in", SOURCE)
  process.exit(1)
}
const block = blockMatch[1]

const rows = []
const rowRe = /\{\s*id:\s*"([^"]+)",[^}]*?cover:\s*([^,]+),\s*title:\s*"([^"]+)",\s*artist:\s*"([^"]+)"\s*\}/g
let m
while ((m = rowRe.exec(block)) !== null) {
  rows.push({ id: m[1], coverExpr: m[2].trim(), title: m[3], artist: m[4] })
}

if (rows.length === 0) {
  console.error("Parsed 0 rows — regex may be out of sync with file format.")
  process.exit(1)
}

console.error(`Parsed ${rows.length} rows. Querying iTunes…`)

// ─── Lookup each title + artist ────────────────────────────────────────────

async function lookup(title, artist) {
  const term = encodeURIComponent(`${title} ${artist}`)
  const url  = `https://itunes.apple.com/search?term=${term}&entity=album&limit=1`
  const res  = await fetch(url, { headers: { "User-Agent": "muza-prototype/1.0" } })
  if (!res.ok) return null
  const json = await res.json()
  const hit  = json.results?.[0]
  if (!hit?.artworkUrl100) return null
  // Upgrade the thumb to hi-res by swapping the dimension token in the path.
  return hit.artworkUrl100.replace(/\/\d+x\d+bb\./, "/600x600bb.")
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

const resolved = []
for (const row of rows) {
  const cover = await lookup(row.title, row.artist)
  if (cover) {
    console.error(`  ✓ ${row.title} — ${row.artist}`)
    resolved.push({ ...row, cover, missed: false })
  } else {
    console.error(`  ✗ ${row.title} — ${row.artist}  (keeping placeholder)`)
    resolved.push({ ...row, cover: null, missed: true })
  }
  await sleep(350)
}

// ─── Emit an updated TypeScript array literal ───────────────────────────────

const pad = (s, n) => s.padEnd(n)
const widest = {
  id:     Math.max(...resolved.map(r => r.id.length)),
  title:  Math.max(...resolved.map(r => r.title.length + 2)),
  artist: Math.max(...resolved.map(r => r.artist.length + 2)),
}

console.log("// Paste this back into SAVED_ALBUMS in library-albums-view.tsx\n")
console.log("const SAVED_ALBUMS: SavedAlbum[] = [")
for (const r of resolved) {
  const coverField = r.missed
    ? r.coverExpr                                // keep the picsum placeholder expression as-is
    : `"${r.cover}"`
  console.log(
    `  { id: ${pad(`"${r.id}",`, widest.id + 3)} ` +
    `cover: ${coverField}, ` +
    `title: ${pad(`"${r.title}",`, widest.title + 1)} ` +
    `artist: ${pad(`"${r.artist}"`, widest.artist)} },`,
  )
}
console.log("]")
console.error(`\nDone — ${resolved.filter(r => !r.missed).length}/${resolved.length} resolved.`)
