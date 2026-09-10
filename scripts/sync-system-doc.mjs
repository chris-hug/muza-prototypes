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
/* Every block the system file generates, and the pages that feed it, in
   reading order — what decides, then what a thing owes. A page may feed more
   than one block: `responsive.md` owns both the width gates and the pointer
   gate, and tags each line accordingly. */
const BLOCKS = {
  color: ["colors"],
  token: ["colors"],
  menu: ["detail-more-button"],
  sheet: ["dialog", "keyboard", "menu", "drawer"],
  type: ["typography"],
  width: ["responsive"],
  touch: [
    "responsive", "gesture", "detail-more-button", "song-list-item",
    "button", "dialog", "drawer", "keyboard",
  ],
}

/* Pull a block list out of the tiny frontmatter subset the docs use — the
   same shape `component-docs.ts` reads, so there is one format to learn.
   Each line is tagged with the block it belongs to: `[touch] **The gate…**`. */
/* The docs quote a frontmatter line whenever it contains a colon, which most
   of these do. Strip the wrapper and unescape, so a rule reads the same
   whether or not YAML made the author quote it. */
function unquote(v) {
  return v.startsWith('"') && v.endsWith('"')
    ? v.slice(1, -1).replace(/\\"/g, '"')
    : v
}

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
    if (m) out.push(unquote(m[1].trim()))
    else if (out.length && line.trim()) out[out.length - 1] += " " + line.trim() // wrapped
  }
  return out
}

let next = readFileSync(SYSTEM, "utf8")
const counts = {}

for (const [block, pages] of Object.entries(BLOCKS)) {
  const BEGIN = `<!-- BEGIN GENERATED: ${block}-contract -->`
  const END = `<!-- END GENERATED: ${block}-contract -->`

  const body = pages.flatMap(id =>
    contractOf(id)
      .filter(r => r.startsWith(`[${block}]`))
      .map(r => `${r.slice(block.length + 2).trim()} → [${id}.md](${DOCS}/${id}.md)`),
  ).join("\n\n")
  counts[block] = body ? body.split("\n\n").length : 0

  const generated = [
    BEGIN,
    "<!-- Written by scripts/sync-system-doc.mjs from the `contract:` frontmatter",
    "     of the pages that own these rules. Do not edit between these markers —",
    "     edit the owning page and re-run `npm run sync-docs`. -->",
    "",
    body,
    "",
    END,
  ].join("\n")

  const a = next.indexOf(BEGIN)
  const b = next.indexOf(END)
  if (a === -1 || b === -1) {
    console.error(`sync-system-doc: ${block} markers not found in ${SYSTEM}`)
    process.exit(2)
  }
  next = next.slice(0, a) + generated + next.slice(b + END.length)
}

const system = readFileSync(SYSTEM, "utf8")

if (process.argv.includes("--check")) {
  if (next === system) {
    console.log("sync-system-doc: DESIGN_SYSTEM.md is in step with the component docs.")
    process.exit(0)
  }
  console.error(
    "sync-system-doc: DESIGN_SYSTEM.md's generated blocks are out of date.\n" +
    "A `contract:` line changed in a component doc and the system file still\n" +
    "carries the old wording. Run `npm run sync-docs` and commit the result.",
  )
  process.exit(1)
}

writeFileSync(SYSTEM, next)
console.log(
  "sync-system-doc: " +
  Object.entries(counts).map(([b, n]) => `${b} ${n}`).join(" · ") +
  " contract lines written.",
)
