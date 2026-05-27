/*
 * Single source of truth for design-system section status badges.
 *
 * Both the sidebar (`design-system.tsx`) and the in-content section
 * header (`Section` in `home.tsx`) read from this map. Reset before
 * every push so badges only flag what genuinely changed this cycle —
 * stale "New" labels from old pushes dilute the signal otherwise.
 *
 * `date` is the YYYY-MM-DD when the status was set (added or last
 * updated). Rendered next to the badge so readers can see how recent
 * a change is at a glance. `LAST_GIT_PUSH` (below) is the page-level
 * "last shipped" timestamp.
 */

export type SectionStatus = "new" | "updated" | "concept"

export interface SectionStatusEntry {
  /** Optional status badge. Omit to mean "unchanged since last push" —
   *  the section just shows its `Pushed: …` timestamp with no badge. */
  status?: SectionStatus
  /** YYYY-MM-DD of the unshipped local change (only meaningful when
   *  `status` is `new` or `updated`). Rendered next to the badge. */
  date?:   string
  /** YYYY-MM-DD when this section's component was last included in a
   *  push to `main`. Defaults to `LAST_GIT_PUSH` for sections not in
   *  the map (they're presumed to have been part of the last push,
   *  unchanged since). Set to `null` for brand-new components that
   *  haven't shipped yet ("new" status). */
  pushed?: string | null
}

/** YYYY-MM-DD of the last push to the prototype's `main` branch.
 *  Bump per push. Surfaces in each section header as the default
 *  "Pushed: …" date, and at the top of the design-system page as
 *  the global "Last pushed" marker. */
export const LAST_GIT_PUSH = "2026-05-27"

/** Title → entry. Keys must match the sidebar `items` and section
 *  `title` props exactly. */
export const SECTION_STATUS: Record<string, SectionStatusEntry> = {
  // ── Most recent push: new ──────────────────────────────────────
  // Status persists past the push so collaborators see what landed
  // in the latest release. Graduate (delete the entry) once the
  // badges have done their job — typically when a new cycle starts
  // and the next round of changes is being flagged.
  "Chip Input":            { status: "new",     date: "2026-05-27", pushed: "2026-05-27" },
  "Media Header":          { status: "new",     date: "2026-05-27", pushed: "2026-05-27" },
  "Purchase Album Dialog": { status: "new",     date: "2026-05-27", pushed: "2026-05-27" },
  "User Avatar":           { status: "new",     date: "2026-05-27", pushed: "2026-05-27" },
  "Purchased Badge":       { status: "new",     date: "2026-05-27", pushed: "2026-05-27" },

  // ── Most recent push: updated ──────────────────────────────────
  "Song List Item":        { status: "updated", date: "2026-05-27", pushed: "2026-05-27" },
  "Card Rail":             { status: "updated", date: "2026-05-27", pushed: "2026-05-27" },
  "Album Card":            { status: "updated", date: "2026-05-27", pushed: "2026-05-27" },

  // ── Built but not yet consumed in a live app surface ──────────
  // Renders the "Not used yet" badge. Keeps the section visible so
  // devs can iterate, but signals it's design-system inventory, not
  // shipped UI. `pushed` is the date the component first shipped
  // (it's in production, just not consumed yet).
  //
  // `Purchased Badge` lives here because the live `AlbumCard` and
  // `MediaHeader` inline a plain check + "Owned" text pattern rather
  // than calling the component. Keep the component around in case
  // we want a richer pill treatment later, but don't claim it's in
  // active use.
  "Form":            { status: "concept", pushed: "2026-04-20" },
  "Pagination":      { status: "concept", pushed: "2026-04-20" },
  "Command":         { status: "concept", pushed: "2026-04-20" },
  "Accordion":       { status: "concept", pushed: "2026-05-17" },
  "ScrollArea":      { status: "concept", pushed: "2026-05-17" },
  "NavigationMenu":  { status: "concept", pushed: "2026-05-17" },
  "OTP Input":       { status: "concept", pushed: "2026-04-20" },
  "Popover":         { status: "concept", pushed: "2026-04-20" },
  "Collapsible":     { status: "concept", pushed: "2026-05-17" },
  "Meter":           { status: "concept", pushed: "2026-05-17" },
  "Skeleton":        { status: "concept", pushed: "2026-04-20" },
  "Toolbar":         { status: "concept", pushed: "2026-05-17" },
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
    "MultiSelect":       "multi-select",
    "SingleSelect":      "single-select",
    "User Avatar":       "user-avatar",
    "Purchased Badge":   "purchased-badge",
  }
  return overrides[label] ?? label.toLowerCase().replace(/\s+/g, "-")
}
