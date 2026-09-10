#!/usr/bin/env node
/*
 * conformance — does the CODE obey the contract the docs state?
 *
 * The other three checks all point the same way: `doc-sweep` asks whether the
 * docs mention what the code does, `sync-docs` asks whether two documents
 * agree, `doc-rules` asks whether a page's rules reached the system file. Not
 * one of them asks the question that matters most — **is the app actually
 * built the way the contract says.**
 *
 * A rule that nothing enforces is a wish. These are the contract lines that
 * can be checked against source text; each one names the line it enforces.
 *
 * What this cannot check: anything that only exists once the app runs — that a
 * target really measures 44px, that a sheet's corner really renders at 28, that
 * the backdrop really tracks the drag. Those need a browser at 375px, which is
 * still a person's job.
 *
 *   node scripts/conformance.mjs
 */

import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"

const ROOTS = ["src", "app"]

const RULES = [
  {
    id: "token/no-hex",
    contract: "[token] Never a hardcoded hex — colors.md",
    why: "A literal cannot follow the pointer when dark mode reassigns it, and it is invisible to the theme editor.",
    test: /(?:bg|text|border|fill|stroke|ring|shadow)-\[#[0-9a-fA-F]{3,8}\]/g,
  },
  {
    id: "token/no-tailwind-grey",
    contract: "[token] Never gray-*, slate-*, zinc-*, stone-* — colors.md",
    why: "Muza's neutral is warm and olive-tinted; Tailwind's are cool. One borrowed class reads as a different product.",
    test: /\b(?:bg|text|border|ring|fill|divide)-(?:gray|slate|zinc|stone)-\d{2,3}\b/g,
  },
  {
    id: "type/no-primitives",
    contract: "[type] Name the semantic alias, never the primitive — typography.md",
    why: "The alias is where a decision lives; a primitive at a call site opts out of every later change to the scale.",
    test: /\btext-(?:xs|sm|lg|xl|2xl|3xl|4xl|5xl)\b/g,
    // The design-system page renders the scale itself, so it must name the
    // primitives it is documenting. Same for the example files it renders.
    skip: p => p.includes("ds-examples") || p.endsWith("routes/home.tsx") ||
               p.includes("components/ds/"),
  },
  {
    /* Static shape of a WCAG 2.4.7 failure. It exists because the mobile
       header's Search button had `outline-none` and nothing to replace it —
       18px of paint, no ring, and nobody noticed until a keyboard walked the
       page. `focus-ring` is the utility; `link-underline` counts too, because
       for a text button the underline IS the indicator. */
    id: "a11y/focus-indicator",
    contract: "A control that removes the outline must replace it — WCAG 2.4.7",
    why: "`outline-none` with no focus treatment leaves a keyboard user with no way to see where they are.",
    scan(code) {
      const hits = []
      for (const m of code.matchAll(/<(button|input|a)\b[^>]*?>/gs)) {
        const cm = m[0].match(/className=(?:"([^"]*)"|\{cn\(([^)]*?)\)\})/s)
        const cls = (cm?.[1] ?? cm?.[2] ?? "")
        if (cls.includes("outline-none") && !/focus-ring|focus-visible:|link-underline|focus:/.test(cls)) {
          hits.push(`<${m[1]} outline-none>`)
        }
      }
      return hits
    },
  },
  {
    id: "sheet/svh-not-dvh",
    contract: "[sheet] Cap sheet heights with svh, never vh or dvh — keyboard.md",
    why: "On iOS dvh reports the height with the browser chrome collapsed, so the top of the surface sits above the visible area while the URL bar is expanded.",
    test: /\b(?:h|min-h|max-h)-(?:\[?\d*\.?\d*)?dvh\b/g,
  },
  /* These two enforce rules the SYSTEM FILE owns outright — the strict touch
     rules have no component page behind them, so nothing generates them and
     nothing was watching them either. Hand-written contract deserves the same
     enforcement as projected contract. */
  {
    id: "touch/snap-mandatory",
    contract: "Rails snap `mandatory`, not `proximity` — DESIGN_SYSTEM.md § Touch",
    why: "`proximity` only snaps when the rail happens to stop near an edge, so a hard swipe leaves a card sliced down the middle.",
    test: /\bsnap-proximity\b/g,
  },
  {
    id: "touch/pan-both-axes",
    contract: "`touch-action: pan-x` does not mean vertical falls through — DESIGN_SYSTEM.md § Touch",
    why: "pan-x forbids vertical panning for every touch starting on the element, so a finger on a rail cannot scroll the page at all. List both axes and let the browser pick.",
    test: /\btouch-pan-x\b(?![^"'`]*\btouch-pan-y\b)/g,
  },
  {
    id: "sheet/corner-not-at-call-site",
    contract: "[sheet] A bottom sheet's corner is owned by SIDE_CLASSES.bottom — drawer.md",
    why: "Five call sites wrote it once already, which is how one ends up at the old value after a refactor.",
    test: /rounded-t-\[28px\]/g,
    skip: p => p.endsWith("ui/sheet.tsx") || p.endsWith("ui/dialog.tsx") ||
               p.endsWith("ui/alert-dialog.tsx") || p.endsWith("ui/dropdown-menu.tsx") ||
               p.endsWith("ui/detail-more-button.tsx"),
  },
]

/* Accepted violations, each with the reason it is accepted and what would
   settle it. A baseline is a to-do list; an entry without a plan is an
   exemption pretending to be one. */
const BASELINE = {
  "src/components/app/artist-profile-view.tsx": {
    rule: "a11y/focus-indicator",
    note: "False positive, kept visible rather than silenced by a cleverer regex: the button carries " +
          "`outline-none` and its child <span> carries `link-underline`, which IS the focus indicator " +
          "for a text button. Static analysis cannot see a ring that lives on a child.",
  },
  "src/components/app/manage-v2.tsx": {
    rule: "token/no-hex",
    note: "Visa's own navy (#1a1f71) and card blue (#005eb8). A third party's brand colour is " +
          "not a design decision this system gets to make, so it cannot become a semantic token — " +
          "it must not follow the theme, which is the whole point of the rule it breaks.",
  },
  "src/components/app/manage-view.tsx": {
    rule: "token/no-hex",
    note: "Same Visa colours as manage-v2.tsx — and the same two files carry the same logo twice, " +
          "which is its own finding.",
  },
  "src/components/ui/badge.tsx": {
    rule: "token/no-hex",
    note: "14 hex values across three variants — success / new / updated — borrowed from the avatar palette. " +
          "They hand-write their own `dark:` variants, which is precisely the workaround the rule " +
          "exists to prevent. Only the design-system page and its examples use them: `new` and `updated` " +
          "flag DS sections, and `success` has no call site at all. Needs tokens defining, or an explicit " +
          "decision that DS chrome is exempt — either way a design call, not a rename.",
  },
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) yield* walk(p)
    else if (/\.tsx?$/.test(p)) yield p
  }
}

const findings = []
const baselined = []

for (const root of ROOTS) {
  for (const file of walk(root)) {
    const rel = relative(".", file)
    const src = readFileSync(file, "utf8")
    // Comments explain the rules, and quoting a violation is not committing one.
    const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")

    for (const rule of RULES) {
      if (rule.skip?.(rel)) continue
      const hits = rule.scan ? rule.scan(code) : [...code.matchAll(rule.test)].map(m => m[0])
      if (!hits.length) continue
      const based = BASELINE[rel]?.rule === rule.id
      ;(based ? baselined : findings).push({ rel, rule, hits: [...new Set(hits)] })
    }
  }
}

if (findings.length) {
  console.log(`conformance: ${findings.length} violation${findings.length === 1 ? "" : "s"} of the documented contract\n`)
  for (const { rel, rule, hits } of findings) {
    console.log(`  ${rel}`)
    console.log(`    ${rule.id} — ${rule.contract}`)
    console.log(`    ${rule.why}`)
    console.log(`    found: ${hits.slice(0, 6).join("  ")}${hits.length > 6 ? ` … +${hits.length - 6}` : ""}\n`)
  }
} else {
  console.log("conformance: the code obeys every contract line this can check.")
}

if (baselined.length) {
  console.log(`Baselined (${baselined.length}):`)
  for (const { rel } of baselined) console.log(`  ${rel} — ${BASELINE[rel].note}`)
}

console.log(
  "\nNot checked here: anything that only exists at runtime — a target that really\n" +
  "measures 44px, a corner that really renders at 28, a backdrop that really tracks\n" +
  "the drag. Those need a browser at 375px.",
)

process.exit(findings.length ? 1 : 0)
