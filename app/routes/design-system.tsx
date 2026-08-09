"use client"

/*
 * Muza design system — dedicated route with its own minimal shell.
 * Left sidebar carries the grouped section nav (synced to the
 * `?section=…` URL param so deep links are shareable); main area
 * renders the existing `ExploreView` kitchen sink with its inline
 * chip-nav suppressed.
 *
 * Top of the sidebar holds a "← Back to prototype" link so the docs
 * never trap the user away from the product.
 */

import { useEffect, useState } from "react"
import { useSearchParams } from "react-router"
import { ArrowLeft, Search, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { ExploreView } from "./home"

// Section groupings. The label has to match the section id used in
// home.tsx (lowercase + whitespace → dashes), which the `idFor`
// helper takes care of.
// Group order + within-group order match the actual section order
// in `ExploreView` so the scroll-spy and click-to-scroll behave
// predictably (no "click later item, jump earlier in the doc").
// `Checkbox & Radio` matches the section title — label "Checkbox"
// alone would silently still resolve to the same id but reads
// inaccurately.
const GROUPS: ReadonlyArray<{ title: string; items: ReadonlyArray<string> }> = [
  { title: "Foundations",      items: ["Responsive", "Colors", "Typography"] },
  { title: "Atoms",            items: ["Button", "Toggle", "ToggleGroup", "Toolbar", "Badge", "Status Badge", "Order Status Badge", "Purchased Badge", "Chips"] },
  { title: "Inputs",           items: ["Input", "Chip Input", "NumberField", "Select", "MultiSelect", "SingleSelect", "Combobox", "Menu", "Detail Menu", "Nav Row", "NavigationMenu", "DatePicker", "Checkbox & Radio", "Radio Card", "Switch", "Slider"] },
  { title: "Indicators",       items: ["Progress", "Meter", "Spinner", "Top Progress Bar", "Separator", "Avatar", "User Avatar"] },
  { title: "Containers",       items: ["Tabs", "Tooltip", "ScrollArea", "Collapsible", "Accordion"] },
  { title: "Cards & lists",    items: ["Album Card", "Artist Card", "Playlist Card", "Cover Play Button", "Song List Item", "Media List Item", "Search", "Card Rail", "Song Rail", "Product Card", "Checkout Card"] },
  { title: "Page composition", items: ["Media Header", "Artist Header", "Mobile Header", "Footer Nav", "Page Section", "Items"] },
  { title: "Overlays",         items: ["Alerts", "AlertDialog", "Dialog", "Purchase Album Dialog", "Paywall", "Login", "Credits Dialog", "Drawer", "Toast"] },
  { title: "Utility",          items: ["Skeleton", "Popover", "Table", "List Table", "Bulk Action Bar", "Pagination", "Command", "OTP Input", "Form"] },
  { title: "Player",           items: ["Player Bar", "Player Overlay"] },
]

// A handful of section ids don't follow the dasherise-the-label
// convention. Map them explicitly so the sidebar click + scroll-spy
// resolve to real anchors.
const ID_OVERRIDES: Record<string, string> = {
  "Detail Menu":      "detail-more-button",
  "Checkbox & Radio": "checkbox",
  "Card Rail":        "card-rail",
  "MultiSelect":      "multi-select",
  "SingleSelect":     "single-select",
  "User Avatar":      "user-avatar",
  "Purchased Badge":  "purchased-badge",
}
const idFor = (label: string) =>
  ID_OVERRIDES[label] ?? label.toLowerCase().replace(/\s+/g, "-")

// Sidebar status markers mirror the `status` prop on each <Section>
// in `home.tsx`. Keep this map and the prop in lockstep; drop both
// on the next session/cycle once the highlighted items aren't "new"
// anymore.
// Shop / Products components — Phase 2 of the build. Devs working
// on day-one features can mentally skip these.
const PHASE_2 = new Set<string>([
  "Product Card",
  "Checkout Card",
  "Items",
  "Order Status Badge",
])

// Sidebar badges. Sourced from the shared `SECTION_STATUS` map so the
// sidebar and the in-content section header always render the same
// label — no two places to keep in sync. The sidebar only surfaces
// "new" / "updated" (not "concept") because "Not used yet" reads
// fine inside a section header but adds noise as a nav-list chip.
import { SECTION_STATUS } from "./ds-status"
const STATUS: Record<string, "new" | "updated"> = Object.fromEntries(
  Object.entries(SECTION_STATUS)
    .filter(([, entry]) => entry.status === "new" || entry.status === "updated")
    .map(([title, entry]) => [title, entry.status])
) as Record<string, "new" | "updated">


export default function DesignSystem() {
  const [, setParams] = useSearchParams()
  // SPA-internal back navigation — a plain `<a href>` would trigger
  // a full document reload (white screen while the JS bundle
  // re-parses) and the TopProgressBar couldn't fire because React
  // isn't running during that gap.
  const goBackToPrototype = () => {
    setParams(prev => {
      const next = new URLSearchParams(prev)
      next.delete("page")
      return next
    }, { replace: true })
  }
  const [activeId, setActiveId] = useState<string>(() =>
    typeof window === "undefined" ? "colors" : (new URL(window.location.href).hash.slice(1) || "colors")
  )
  // Show / hide Phase 2 (Shop) components in both the sidebar nav
  // and the content. Defaults to ON so docs are complete; flip OFF
  // when working purely on day-one features.
  const [showPhase2, setShowPhase2] = useState(true)
  // Component search — filters the sidebar nav by label (case-insensitive
  // substring). Enter jumps to the first match.
  const [query, setQuery] = useState("")
  const q = query.trim().toLowerCase()
  const matches = (item: string) =>
    (showPhase2 || !PHASE_2.has(item)) && (!q || item.toLowerCase().includes(q))
  const firstMatchId = () => {
    for (const g of GROUPS) for (const item of g.items) if (matches(item)) return idFor(item)
    return null
  }

  // Sync scroll → active sidebar item via IntersectionObserver. Each
  // <Section> gets `scroll-mt-6` (set inside home.tsx) so anchored
  // scrolls don't tuck under the topbar.
  //
  // We track *all* currently-intersecting sections in a Set across
  // callbacks. The observer only fires for sections whose state
  // changed — so if Spinner is already in the band and Separator
  // enters it, only Separator's entry arrives. Picking the topmost
  // from just that callback would wrongly mark Separator active
  // even though Spinner is still above it. Maintaining the Set lets
  // us sort the full set of visible sections each time.
  useEffect(() => {
    const ids = GROUPS.flatMap(g => g.items.map(idFor))
    const els = ids.map(id => document.getElementById(id)).filter((x): x is HTMLElement => !!x)
    if (els.length === 0) return
    const intersecting = new Set<string>()
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) intersecting.add(e.target.id)
          else intersecting.delete(e.target.id)
        }
        if (intersecting.size === 0) return
        const top = [...intersecting]
          .map(id => document.getElementById(id))
          .filter((x): x is HTMLElement => !!x)
          .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0]
        if (top) setActiveId(top.id)
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: [0, 1] },
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  const goto = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: "smooth", block: "start" })
    history.replaceState(null, "", `#${id}`)
    setActiveId(id)
  }

  return (
    <div className="flex h-svh w-full">
      {/* Sidebar */}
      <aside className="shrink-0 w-64 border-r border-border bg-background flex flex-col">
        {/* Top — back link, title, component search, phase-2 toggle.
            Borderless / minimal; the nav below carries its own spacing. */}
        <div className="shrink-0 px-4 pt-6 pb-4 flex flex-col gap-4 border-b border-border">
          <button
            type="button"
            onClick={goBackToPrototype}
            className="inline-flex items-center gap-1.5 text-xsmall font-normal text-muted-foreground hover:text-foreground transition-colors w-fit cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            Back to prototype
          </button>
          <h2 className="text-small font-medium text-foreground">Design system</h2>

          {/* Component search — filters the nav (Enter jumps to first match). */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { const id = firstMatchId(); if (id) goto(id) } }}
              placeholder="Search components"
              aria-label="Search components"
              className="pl-10 pr-9"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
            <span className="text-xsmall font-normal text-muted-foreground">Show Phase 2</span>
            <Switch checked={showPhase2} onCheckedChange={setShowPhase2} />
          </label>
        </div>

        {/* Grouped section nav. */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {!GROUPS.some(g => g.items.some(matches)) && (
            <p className="px-3 py-4 text-xsmall text-muted-foreground">No components match “{query}”.</p>
          )}
          {GROUPS.map(group => {
            const visibleItems = group.items.filter(matches)
            if (visibleItems.length === 0) return null
            return (
            <div key={group.title} className="mb-4 last:mb-0">
              <p className="text-2xsmall font-normal text-muted-foreground px-3 pt-3 pb-1">
                {group.title}
              </p>
              <ul className="flex flex-col">
                {visibleItems.map(item => {
                  const id = idFor(item)
                  const isActive = activeId === id
                  const status = STATUS[item]
                  return (
                    <li key={item}>
                      <button
                        type="button"
                        onClick={() => goto(id)}
                        className={
                          "w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xsmall font-normal text-foreground transition-colors " +
                          (isActive
                            ? "bg-secondary"
                            : "hover:bg-muted")
                        }
                      >
                        <span className="truncate">{item}</span>
                        {PHASE_2.has(item)    && <Badge variant="secondary" className="ml-auto">Phase 2</Badge>}
                        {status === "new"     && <Badge variant="new" className="ml-auto">New</Badge>}
                        {status === "updated" && <Badge variant="updated" className="ml-auto">Updated</Badge>}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
            )
          })}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0 overflow-auto" data-hide-phase-2={!showPhase2 || undefined}>
        {!showPhase2 && (
          // Tailwind doesn't have a parent-attribute selector helper
          // baked in, so a tiny inline style sheet hides sections
          // tagged `data-phase="2"` when the toggle is off.
          <style>{`[data-hide-phase-2] [data-phase="2"] { display: none; }`}</style>
        )}
        <ExploreView showQuickNav={false} />
      </main>
    </div>
  )
}
