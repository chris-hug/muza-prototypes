#!/usr/bin/env node
/*
 * sync-system-doc — DESIGN_SYSTEM.md's contract lines are GENERATED from the
 * component docs, not written twice.
 *
 * The problem this replaces: the system file states an obligation ("both
 * gestures read one module", "cap sheet heights with svh") and a component
 * doc explains it at length. Two prose accounts of one fact, kept in step by
 * hand — which lasted about an hour the first time, and the drift is silent
 * because both copies pass every grep.
 *
 * So the obligation is written ONCE, in the page that owns the subject, as a
 * `contract:` list in its frontmatter. This script collects those lines and
 * writes them into the marked block in DESIGN_SYSTEM.md, each with a link
 * back. The system file keeps everything it alone knows — the strict rules,
 * the prose around the block — and stops paraphrasing what the pages say.
 *
 * Frontmatter, in `docs/components/<id>.md`:
 *
 *   contract:
 *     - **The gate is the POINTER, not the window.** …
 *     - **One module owns both gestures' numbers.** …
 *
 * Order in the generated block follows ORDER below, so it reads as an
 * argument rather than as a directory listing.
 *
 *   node scripts/sync-system-doc.mjs           → rewrite the block
 *   node scripts/sync-system-doc.mjs --check   → exit 1 if it is out of date
 */

import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const DOCS = "docs/components"
const SYSTEM = "DESIGN_SYSTEM.md"
const BEGIN = "<!-- BEGIN GENERATED: touch-contract -->"
const END = "<!-- END GENERATED: touch-contract -->"

/* The pages that own a piece of the touch contract, in reading order:
   what decides, then what a gesture owes, then what a surface owes. */
const ORDER = [
  "responsive",
  "gesture",
  "detail-more-button",
  "song-list-item",
  "button",
  "dialog",
  "drawer",
  "keyboard",
]

/* Pull a block list out of the tiny frontmatter subset the docs use — the
   same shape `component-docs.ts` reads, so there is one format to learn. */
function contractOf(id) {
  const text = readFileSync(join(DOCS, `${id}.md`), "utf8")
  const fm = text.startsWith("---") ? text.slice(3, text.indexOf("\n---", 3)) : ""
  const lines = fm.split("\n")
  const start = lines.findIndex(l => l.trim() === "contract:")
  if (start === -1) return []

  const out = []
  for (const line of lines.slice(start + 1)) {
    if (/^\S/.test(line)) break // next top-level key
    const m = line.match(/^\s+-\s+(.*)$/)
    if (m) out.push(m[1].trim())
    else if (out.length && line.trim()) out[out.length - 1] += " " + line.trim() // wrapped
  }
  return out
}

const body = ORDER.flatMap(id =>
  contractOf(id).map(rule => `${rule} → [${id}.md](${DOCS}/${id}.md)`),
).join("\n\n")

const generated = [
  BEGIN,
  "<!-- Written by scripts/sync-system-doc.mjs from the `contract:` frontmatter",
  "     of the pages listed below. Do not edit between these markers — edit the",
  "     page that owns the rule and re-run `npm run sync-docs`. -->",
  "",
  body,
  "",
  END,
].join("\n")

const system = readFileSync(SYSTEM, "utf8")
const a = system.indexOf(BEGIN)
const b = system.indexOf(END)
if (a === -1 || b === -1) {
  console.error(`sync-system-doc: markers not found in ${SYSTEM}`)
  process.exit(2)
}

const next = system.slice(0, a) + generated + system.slice(b + END.length)

if (process.argv.includes("--check")) {
  if (next === system) {
    console.log("sync-system-doc: DESIGN_SYSTEM.md is in step with the component docs.")
    process.exit(0)
  }
  console.error(
    "sync-system-doc: DESIGN_SYSTEM.md's generated block is out of date.\n" +
    "A `contract:` line changed in a component doc and the system file still\n" +
    "carries the old wording. Run `npm run sync-docs` and commit the result.",
  )
  process.exit(1)
}

writeFileSync(SYSTEM, next)
const count = body ? body.split("\n\n").length : 0
console.log(`sync-system-doc: wrote ${count} contract lines from ${ORDER.length} pages.`)
