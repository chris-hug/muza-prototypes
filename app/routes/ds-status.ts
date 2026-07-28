/*
 * Single source of truth for design-system section status badges.
 *
 * Two kinds of metadata, kept deliberately separate:
 *
 *   1. STATUS badge (hand-rolled) — `new` / `updated` / `concept`.
 *      An editorial decision: "this is a meaningful change worth
 *      flagging." Lives in `SECTION_STATUS` below. Frozen across
 *      same-release pushes; graduate with `npm run release -- --clear`
 *      when starting a new cycle.
 *
 *   2. "Last changed" date (auto) — derived from git at build time
 *      (`__SECTION_LAST_CHANGED__`, injected by `vite.config.ts` =
 *      the date of the last commit that touched each section's backing
 *      file, per `ds-sources.ts`). Never hand-maintained; updates
 *      itself from history. Read via `sectionLastChanged(id)`.
 *
 * `LAST_GIT_PUSH` (the global "last pushed" marker) also auto-derives
 * from git — it's HEAD's commit date.
 */

import { SECTION_SOURCE } from "./ds-sources"

export type SectionStatus = "new" | "updated" | "concept"

export interface SectionStatusEntry {
  /** Hand-rolled badge. `new` / `updated` flag a meaningful change
   *  this cycle; `concept` = built but not wired into the app yet
   *  ("Not used yet"). Omit an entry entirely for stable components. */
  status: SectionStatus
}

/** YYYY-MM-DD of the last push to `main`. Auto-derived from git at
 *  build time (`__LAST_GIT_PUSH__` = HEAD's commit date). In CI the
 *  deployed build runs from the just-pushed commit, so this IS the
 *  push date — no hand-maintenance. Falls back to "" if git was
 *  unavailable at build (the DS header hides the label when empty). */
declare const __LAST_GIT_PUSH__: string
export const LAST_GIT_PUSH: string =
  typeof __LAST_GIT_PUSH__ !== "undefined" ? __LAST_GIT_PUSH__ : ""

/** Section id → "last changed" date (YYYY-MM-DD), auto-derived from
 *  git per `ds-sources.ts`. Injected at build time. */
declare const __SECTION_LAST_CHANGED__: Record<string, string>
const SECTION_LAST_CHANGED: Record<string, string> =
  typeof __SECTION_LAST_CHANGED__ !== "undefined" ? __SECTION_LAST_CHANGED__ : {}

/** When did this section's component last change? Auto from git, or
 *  null if the section has no mapped source file / git was missing. */
export function sectionLastChanged(id: string): string | null {
  return SECTION_LAST_CHANGED[id] ?? null
}

/** GitHub "blob" base (origin remote + branch), injected at build. */
declare const __REPO_BLOB_BASE__: string
const REPO_BLOB_BASE: string =
  typeof __REPO_BLOB_BASE__ !== "undefined" ? __REPO_BLOB_BASE__ : ""

/** Deep link to this section's component source on GitHub, or null if
 *  the section has no mapped file / the repo base couldn't be derived
 *  at build. */
export function sectionSourceUrl(id: string): string | null {
  const file = SECTION_SOURCE[id]
  if (!file || !REPO_BLOB_BASE) return null
  return `${REPO_BLOB_BASE}/${file}`
}

/** Title → status entry. Keys must match the sidebar `items` and
 *  section `title` props exactly. Only sections with a badge live
 *  here; everything else just shows its auto "changed" date. */
export const SECTION_STATUS: Record<string, SectionStatusEntry> = {
  // Badges cleared. Add `new` / `updated` (or `concept` for "Not used
  // yet") entries here to flag a cycle's work; graduate with
  // `npm run release -- --clear`. (Phase 2 badges are a separate list —
  // see `PHASE_2` in design-system.tsx — and are NOT affected here.)
}

/** Same map keyed by Section `id` (post-`idFor` lowercasing) so the
 *  in-content header can look up by id without needing the title
 *  string. Built once at module load. */
export const SECTION_STATUS_BY_ID: Record<string, SectionStatusEntry> = Object.fromEntries(
  Object.entries(SECTION_STATUS).map(([title, entry]) => [
    titleToId(title),
    entry,
  ]),
)

/** Render a YYYY-MM-DD as `27 May 26` (date · short month · 2-digit
 *  year). Compact form fits inline next to a badge without crowding
 *  the row. */
export function formatStatusDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("en-GB", {
    day:   "numeric",
    month: "short",
    year:  "2-digit",
  })
}

/** Mirrors the `idFor` helper in `design-system.tsx`. Kept duplicated
 *  here (rather than imported) to avoid circular deps — this module
 *  is intentionally leaf-level. */
function titleToId(label: string): string {
  const overrides: Record<string, string> = {
    "Checkbox & Radio": "checkbox",
    "Card Rail":         "card-rail",
    "Song Rail":         "song-rail",
    "MultiSelect":       "multi-select",
    "SingleSelect":      "single-select",
    "User Avatar":       "user-avatar",
    "Purchased Badge":   "purchased-badge",
  }
  return overrides[label] ?? label.toLowerCase().replace(/\s+/g, "-")
}
