#!/usr/bin/env node
/*
 * Release script — preps the design-system status map for a fresh push.
 *
 * Run BEFORE `git push`:
 *   npm run release                      # uses today's date
 *   npm run release -- 2026-06-01        # explicit date (YYYY-MM-DD)
 *   npm run release -- --clear           # also graduate badges
 *   npm run release -- 2026-06-01 --clear
 *
 * Default behavior (no --clear):
 *   1. Bumps `LAST_GIT_PUSH` in `app/routes/ds-status.ts`.
 *   2. For every `new` / `updated` entry: bumps `pushed` to the new
 *      date so the section header shows the badge AND the up-to-date
 *      "Pushed: <today>" stamp. Status persists past the push so
 *      collaborators can see what landed in the latest release.
 *
 * With --clear:
 *   1. Bumps `LAST_GIT_PUSH`.
 *   2. Strips every `new` / `updated` entry from the map — for when
 *      the previous cycle's badges have done their job and you're
 *      starting a fresh round.
 *
 * Concept entries are always left untouched (they didn't ship in
 * this cycle; their own pushed dates stay accurate).
 *
 * The script edits the file in place and prints a summary. Stage +
 * commit afterwards (the script intentionally doesn't auto-commit so
 * you can review the diff first).
 */

import { readFile, writeFile } from "node:fs/promises"
import { fileURLToPath }       from "node:url"
import { dirname, resolve }    from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const FILE      = resolve(__dirname, "..", "app", "routes", "ds-status.ts")

function todayISO() {
  const d = new Date()
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-")
}

const args      = process.argv.slice(2)
const clearFlag = args.includes("--clear")
const dateArg   = args.find(a => /^\d{4}-\d{2}-\d{2}$/.test(a))
const newDate   = dateArg ?? todayISO()
if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
  console.error(`✗ Invalid date: ${newDate}. Use YYYY-MM-DD.`)
  process.exit(1)
}

const source = await readFile(FILE, "utf8")

// ── 1. Bump LAST_GIT_PUSH ────────────────────────────────────────
const pushRegex  = /(export\s+const\s+LAST_GIT_PUSH\s*=\s*")(\d{4}-\d{2}-\d{2})(")/
const pushMatch  = source.match(pushRegex)
if (!pushMatch) {
  console.error("✗ Couldn't find LAST_GIT_PUSH declaration.")
  process.exit(1)
}
const prevPush = pushMatch[2]
let updated = source.replace(pushRegex, `$1${newDate}$3`)

// ── 2. Process new / updated entries ─────────────────────────────
// Matches lines like:  "Album Card": { status: "updated", date: "...", pushed: "..." },
const entryRegex = /^(\s*)"([^"]+)":\s*\{\s*status:\s*"(new|updated)"[^}]*\},?\s*\n/gm
const touched    = []

updated = updated.replace(entryRegex, (match, indent, title, status) => {
  touched.push({ title, status })
  if (clearFlag) {
    // Graduate — drop the line entirely.
    return ""
  }
  // Preserve badge but bump pushed date so the "Pushed: …" stamp
  // reflects this release. `date` stays as the original change date.
  // Pull the `date` value if present (otherwise reuse the push date).
  const dateMatch = match.match(/date:\s*"([^"]+)"/)
  const dateVal   = dateMatch?.[1] ?? newDate
  return `${indent}"${title}": { status: "${status}", date: "${dateVal}", pushed: "${newDate}" },\n`
})

// ── Persist ──────────────────────────────────────────────────────
await writeFile(FILE, updated, "utf8")

// ── Report ───────────────────────────────────────────────────────
console.log(`✓ LAST_GIT_PUSH:  ${prevPush}  →  ${newDate}`)
if (touched.length === 0) {
  console.log("✓ No new/updated entries to process.")
} else if (clearFlag) {
  console.log(`✓ Graduated ${touched.length} entr${touched.length === 1 ? "y" : "ies"} (badges removed):`)
  for (const { title, status } of touched) {
    console.log(`    · ${title}  (was ${status})`)
  }
} else {
  console.log(`✓ Bumped pushed date on ${touched.length} entr${touched.length === 1 ? "y" : "ies"} (badges kept):`)
  for (const { title, status } of touched) {
    console.log(`    · ${title}  (${status})`)
  }
  console.log("\n   Run with --clear next cycle to drop these badges entirely.")
}
console.log("\nNext steps:")
console.log("  git diff app/routes/ds-status.ts   # review the edit")
console.log("  git add app/routes/ds-status.ts")
console.log("  git commit -m \"cycle: <message>\"")
console.log("  git push")
