#!/usr/bin/env node
/*
 * doc-sweep — the coverage half of the Component Doc Pass, as a check.
 *
 * The pass has two failure modes. CONSISTENCY (the doc contradicts the code)
 * needs a reader. COVERAGE (the doc never mentions a behaviour the component
 * has) is mechanical, and mechanical things should not depend on somebody
 * remembering to look.
 *
 * So: for every component under `src/components/ui`, grep its source for the
 * shared utilities the design system defines, and check each one appears in
 * that component's `docs/components/<id>.md`. A token in the code and absent
 * from the doc is a gap — that is the whole rule.
 *
 * It catches the exact class of thing this project kept shipping: the cards
 * gained a long press and their docs went on saying a long press did nothing;
 * `menu.md` documented rows that have carried `state-fade` all along;
 * `dialog.md` described a grabber without naming the component that draws it.
 *
 * It cannot catch a doc that is confidently wrong about a number. Nothing
 * mechanical can. Read the thing.
 *
 *   node scripts/doc-sweep.mjs          → report, exit 1 if anything is open
 *   node scripts/doc-sweep.mjs --quiet  → exit code only
 */

import { readFileSync, existsSync, readdirSync } from "node:fs"
import { join, basename } from "node:path"

const UI = "src/components/ui"
const DOCS = "docs/components"

/* Where a component's doc is not named after its file. These are the four the
   catalogue names differently on purpose — the doc is named for the thing a
   reader looks up, not for the module. */
const ALIAS = {
  "alert-dialog": "alertdialog",
  alert: "alerts",
  chip: "chips",
  "date-picker": "datepicker",
  "dropdown-menu": "menu",
  "navigation-menu": "navigationmenu",
  "player-bar-b": "player-bar",
  sheet: "drawer",
}

/* Components that legitimately have no doc of their own: they are parts of
   another component's story, and splitting them would scatter it. Adding a
   name here is a decision — say why. */
const NO_DOC_NEEDED = new Set([
  "library-heart-button", // documented inside items.md with the row that owns it
  "media-icons", // an icon set, not a component
  "transport-icons", // ditto
])

/* Motion and state — the original sweep. */
const MOTION = [
  "state-fade", "state-fade-quick", "press-ripple", "card-sweep",
  "link-underline", "focus-ring", "invalid-ring", "art-edge",
  "page-enter", "useTick",
]

/* Touch and pointer — added after a touch pass shipped behaviour that no doc
   described. Same rule, different vocabulary. */
const TOUCH = [
  "touch-target", "data-pressing", "useLongPress", "useSheetDrag",
  "useCoarsePointer", "sheet-glass", "SheetGrabber", "disabled-solid",
  "touch-callout", "--kb", "data-kb", "--sheet-bar-h", "--sheet-band-h",
  "--sheet-drag-progress",
]

const TOKENS = [...MOTION, ...TOUCH]

/* The baseline: debt that predates this check.
 *
 * A gate that is red on the day it is written teaches everyone to ignore it,
 * so the components that were already undocumented are listed here and the
 * check goes green. That is the point of a baseline and also its danger — it
 * is a to-do list, not an exemption. Deleting a line and watching the sweep
 * stay green is how it shrinks; adding one needs a reason in the commit.
 */
const BASELINE = new Set([
  "cover-art", "cover-card-menu", "filter-button", "playlist-create-card",
  "radio-group", "textarea", "transport-toggles",   // no doc file at all
  "nav-row:state-fade", "table:state-fade", "table:focus-ring",
])

const quiet = process.argv.includes("--quiet")
const findings = []

for (const file of readdirSync(UI).filter(f => f.endsWith(".tsx"))) {
  const id = basename(file, ".tsx")
  if (NO_DOC_NEEDED.has(id)) continue

  const code = readFileSync(join(UI, file), "utf8")
  const docPath = join(DOCS, `${ALIAS[id] ?? id}.md`)

  if (!existsSync(docPath)) {
    // Only a finding if the component uses any of the shared vocabulary —
    // a component with none of it may simply not be in the catalogue yet.
    if (BASELINE.has(id)) continue
    if (TOKENS.some(t => code.includes(t))) findings.push({ id, missing: ["NO DOC"] })
    continue
  }

  const doc = readFileSync(docPath, "utf8")
  const missing = TOKENS.filter(
    t => code.includes(t) && !doc.includes(t) && !BASELINE.has(`${id}:${t}`),
  )
  if (missing.length) findings.push({ id, missing })
}

if (!quiet) {
  if (findings.length === 0) {
    console.log(
      `doc-sweep: clean — every shared utility in use is named in its component's doc.\n` +
      `           ${BASELINE.size} known gaps still baselined; see BASELINE in this file.`,
    )
  } else {
    console.log(`doc-sweep: ${findings.length} component${findings.length === 1 ? "" : "s"} with undocumented behaviour\n`)
    for (const { id, missing } of findings) {
      console.log(`  ${id.padEnd(24)} ${missing.join(" ")}`)
    }
    console.log(`
Each name above is in the component's source and absent from its doc.
That is a behaviour nobody is checking. Either write it, or — if the same
token turns up across several components — ask whether it belongs to them at
all. See COMPONENT_DOC_PASS.md.`)
  }
}

process.exit(findings.length === 0 ? 0 : 1)
