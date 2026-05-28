#!/usr/bin/env node
/*
 * Release helper for the design-system status map.
 *
 * `LAST_GIT_PUSH` is NO LONGER managed here — it auto-derives from
 * git at build time (see `vite.config.ts` → `__LAST_GIT_PUSH__`). So
 * a normal "push as same release" needs NO script run at all: just
 * commit + push. The deployed build stamps the page with HEAD's
 * commit date automatically, and every `New` / `Updated` badge stays
 * frozen exactly as authored.
 *
 * This script does ONE thing: graduate badges when you start a NEW
 * release cycle.
 *
 *   npm run release -- --clear     # drop every New/Updated entry
 *
 * Graduating strips the `new` / `updated` entries from the map so the
 * badges disappear — they've done their job, and the next cycle's
 * changes start flagging fresh. `concept` ("Not used yet") entries are
 * always left untouched.
 *
 * The script edits `ds-status.ts` in place and prints a summary. Stage
 * + commit afterwards (it intentionally doesn't auto-commit so you can
 * review the diff first).
 */

import { readFile, writeFile } from "node:fs/promises"
import { fileURLToPath }       from "node:url"
import { dirname, resolve }    from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const FILE      = resolve(__dirname, "..", "app", "routes", "ds-status.ts")

const args      = process.argv.slice(2)
const clearFlag = args.includes("--clear")

if (!clearFlag) {
  console.log(`
ℹ  Nothing to do.

   "Last pushed" auto-derives from git now, and New/Updated badges
   stay frozen within a release. To push as the SAME release, just:

       git add … && git commit && git push

   To START A NEW RELEASE (graduate the current badges), run:

       npm run release -- --clear
`)
  process.exit(0)
}

const source = await readFile(FILE, "utf8")

// Strip every `new` / `updated` entry. Matches lines like:
//   "Album Card": { status: "updated", date: "...", pushed: "..." },
const entryRegex = /^(\s*)"([^"]+)":\s*\{\s*status:\s*"(new|updated)"[^}]*\},?\s*\n/gm
const graduated  = []

const updated = source.replace(entryRegex, (_match, _indent, title, status) => {
  graduated.push({ title, status })
  return ""
})

if (graduated.length === 0) {
  console.log("✓ No New/Updated entries to graduate — already a clean slate.")
  process.exit(0)
}

await writeFile(FILE, updated, "utf8")

console.log(`✓ Graduated ${graduated.length} entr${graduated.length === 1 ? "y" : "ies"} (badges removed):`)
for (const { title, status } of graduated) {
  console.log(`    · ${title}  (was ${status})`)
}
console.log(`
Next steps:
  git diff app/routes/ds-status.ts   # review the edit
  git add app/routes/ds-status.ts
  git commit -m "release: graduate <cycle> badges"
  git push
`)
