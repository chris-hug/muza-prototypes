#!/usr/bin/env node
/*
 * doc-rules — which rules in the owner pages have no contract line?
 *
 * `sync-system-doc` guarantees that a rule WITH a `contract:` line agrees with
 * the system file. It cannot notice a rule that never got one — somebody
 * writes "never do X" into a page, it is true, and DESIGN_SYSTEM.md never
 * hears about it.
 *
 * This is the nearest mechanical approximation: find the sentences in the
 * owner pages that read like obligations (NEVER, ALWAYS, must, mandatory, may
 * not) and report the ones no contract line covers.
 *
 * ADVISORY, NOT A GATE, and deliberately so. "Is this sentence a rule" is not
 * decidable, and the corpus proves it: about half of what this finds is a
 * prop note ("one of the two must be given"), a bit of prose that happens to
 * use the word ("a neutral ramp has to be eyeballed"), or a component detail
 * that genuinely belongs to its page rather than to the system. A check that
 * is wrong half the time must not be able to block a push — it would teach
 * everyone to pass `--no-verify`, and take the two honest gates down with it.
 *
 * So: run it when doing a doc pass, read the list, promote what deserves
 * promoting. Exit code is always 0.
 *
 *   node scripts/doc-rules.mjs
 */

import { readFileSync } from "node:fs"

const DOCS = "docs/components"

/* Only the pages that already own part of the contract. Elsewhere "this rule
   has no contract line" is not a meaningful complaint — most pages describe a
   component rather than legislate for the system. */
const OWNERS = [
  "colors", "typography", "responsive", "gesture", "detail-more-button",
  "song-list-item", "button", "dialog", "drawer", "keyboard", "menu",
]

const OBLIGATION = /\b(NEVER|ALWAYS|must|may not|mandatory|has to be)\b/

/* Sentences that match the pattern and are not system rules. Each one is a
   judgement, so each one is written down rather than filtered by a cleverer
   regex — the regex would take real rules with it. */
const NOT_A_RULE = [
  // Prose that happens to use the word.
  "neutral ramp has to be eyeballed",
  "un-premultiplying a 50% neutral",
  // A prop's own requirement, which belongs with the prop.
  "One of the two must be given",
  "must look like one takes the classes",
  // Already a system rule, in the hand-written strict-rules block: no page
  // owns it, so it cannot have a contract line.
  "snap-x snap-mandatory",
  // Real rules, but about one component's internals rather than the system.
  // They belong in their page and nowhere else.
  "bridge must forward every field via live getters",
  // A real cross-component rule with no block to live in: nothing generated
  // covers "component A must not be mounted inside component B". Worth a
  // block of its own if a second one ever turns up.
  "PlayingWave` must not be mounted inside a Button",
]

const stop = new Set(
  "the a an is are it its of to and or in on for with that this be as at by from than then so not no do does".split(" "),
)
const words = s => new Set(s.toLowerCase().match(/[a-z-]{4,}/g)?.filter(w => !stop.has(w)) ?? [])

/* Every contract line in the corpus, not just the page's own: `viewport-fit`
   is stated in dialog.md's prose and owned by keyboard.md's contract, which
   is correct — one account, wherever it lives. */
const allContracts = OWNERS.flatMap(id => {
  const t = readFileSync(`${DOCS}/${id}.md`, "utf8")
  const fm = t.slice(0, t.indexOf("\n---", 3))
  return [...fm.matchAll(/^\s+- (.*)$/gm)].map(m => words(m[1]))
})

let found = 0
for (const id of OWNERS) {
  const t = readFileSync(`${DOCS}/${id}.md`, "utf8")
  const body = t.slice(t.indexOf("\n---", 3) + 4).replace(/```[\s\S]*?```/g, "")

  const open = body
    .split(/(?<=[.!?])\s+/)
    .map(s => s.replace(/\s+/g, " ").trim())
    .filter(s => s.length < 400 && OBLIGATION.test(s))
    .filter(s => !NOT_A_RULE.some(x => s.includes(x)))
    .filter(s => {
      const k = words(s)
      // Three shared distinctive words is enough: these sentences are long and
      // a contract line is a compressed version of the same one.
      return !allContracts.some(c => [...k].filter(w => c.has(w)).length >= 3)
    })

  if (!open.length) continue
  found += open.length
  console.log(`\n${id}.md`)
  for (const s of open) console.log(`  · ${s.slice(0, 150)}${s.length > 150 ? "…" : ""}`)
}

console.log(
  found
    ? `\n${found} obligation${found === 1 ? "" : "s"} with no contract line.\n` +
      "Promote the ones that are system rules (add a tagged line to the page's\n" +
      "`contract:` and run `npm run sync-docs`); add the rest to NOT_A_RULE in\n" +
      "this file, with the judgement visible.\n"
    : "\ndoc-rules: every obligation in the owner pages has a contract line.\n",
)
