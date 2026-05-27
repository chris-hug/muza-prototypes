#!/usr/bin/env node
/*
 * Release script — preps the design-system status map for a fresh push.
 *
 * Run BEFORE `git push`:
 *   node scripts/release.mjs            # uses today's date
 *   node scripts/release.mjs 2026-06-01 # explicit date (YYYY-MM-DD)
 *
 * What it does:
 *   1. Bumps `LAST_GIT_PUSH` in `app/routes/ds-status.ts` to today
 *      (or the passed date).
 *   2. Strips every entry from `SECTION_STATUS` whose `status` is
 *      "new" or "updated" — their cycle is over once shipped, so the
 *      badges shouldn't survive the push.
 *
 * Concept entries are left untouched (they didn't ship with this
 * push; their pushed date stays as-is).
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

const arg     = process.argv[2]
const newDate = arg ?? todayISO()
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

// ── 2. Strip new / updated entries ───────────────────────────────
// Matches lines like:  "Album Card": { status: "updated", date: "...", pushed: "..." },
// Captures the title and the status, lets us count + drop them.
const entryRegex = /^\s*"([^"]+)":\s*\{\s*status:\s*"(new|updated)"[^}]*\},?\s*\n/gm
const dropped    = []
updated = updated.replace(entryRegex, (_match, title, status) => {
  dropped.push({ title, status })
  return ""
})

// ── Persist ──────────────────────────────────────────────────────
await writeFile(FILE, updated, "utf8")

// ── Report ───────────────────────────────────────────────────────
console.log(`✓ LAST_GIT_PUSH:  ${prevPush}  →  ${newDate}`)
if (dropped.length === 0) {
  console.log("✓ No new/updated entries to clear.")
} else {
  console.log(`✓ Cleared ${dropped.length} cycle entr${dropped.length === 1 ? "y" : "ies"}:`)
  for (const { title, status } of dropped) {
    console.log(`    · ${title}  (was ${status})`)
  }
}
console.log("\nNext steps:")
console.log("  git diff app/routes/ds-status.ts   # review the edit")
console.log("  git add app/routes/ds-status.ts")
console.log("  git commit -m \"cycle: <message>\"")
console.log("  git push")
