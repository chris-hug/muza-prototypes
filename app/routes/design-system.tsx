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
import { ArrowLeft } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
  { title: "Foundations",      items: ["Colors", "Typography"] },
  { title: "Atoms",            items: ["Button", "Toggle", "ToggleGroup", "Toolbar", "Badges", "Chips"] },
  { title: "Inputs",           items: ["Input", "NumberField", "Select", "MultiSelect", "SingleSelect", "Combobox", "Menu", "NavigationMenu", "DatePicker", "Checkbox & Radio", "Radio Card", "Switch", "Slider"] },
  { title: "Indicators",       items: ["Progress", "Meter", "Separator", "Avatar"] },
  { title: "Containers",       items: ["Tabs", "Tooltip", "ScrollArea", "Collapsible", "Accordion"] },
  { title: "Cards & lists",    items: ["Album Card", "Artist Card", "Playlist Card", "Song List Item", "Card Rail", "Product Card", "Checkout Card"] },
  { title: "Page composition", items: ["Page Section", "Items"] },
  { title: "Overlays",         items: ["Alerts", "AlertDialog", "Dialog", "Drawer", "Toast"] },
  { title: "Utility",          items: ["Skeleton", "Popover", "Table", "List Table", "Pagination", "Command", "OTP Input", "Form"] },
  { title: "Player",           items: ["Player Bar", "Player Overlay"] },
]

// A handful of section ids don't follow the dasherise-the-label
// convention. Map them explicitly so the sidebar click + scroll-spy
// resolve to real anchors.
const ID_OVERRIDES: Record<string, string> = {
  "Checkbox & Radio": "checkbox",
  "Card Rail":        "card-rail",
  "MultiSelect":      "multi-select",
  "SingleSelect":     "single-select",
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
])

const STATUS: Record<string, "new" | "updated"> = {
  // ── New components introduced in the last push ─────────────────
  Toggle:           "new",
  ToggleGroup:      "new",
  Toolbar:          "new",
  Meter:            "new",
  ScrollArea:       "new",
  Collapsible:      "new",
  Accordion:        "new",
  NavigationMenu:   "new",
  "Album Card":     "new",
  "Artist Card":    "new",
  "Playlist Card":  "new",
  "Song List Item": "new",
  "Card Rail":      "new",
  "Product Card":   "new",
  "Checkout Card":  "new",
  SingleSelect:     "new",
  MultiSelect:      "updated",
  "List Table":     "new",
  "Page Section":   "new",
  Items:            "new",
  // ── Updated — existing components that got new variants / props ─
  Badges:           "updated",
  Chips:            "updated",
}

export default function DesignSystem() {
  const [activeId, setActiveId] = useState<string>(() =>
    typeof window === "undefined" ? "colors" : (new URL(window.location.href).hash.slice(1) || "colors")
  )
  // Show / hide Phase 2 (Shop) components in both the sidebar nav
  // and the content. Defaults to ON so docs are complete; flip OFF
  // when working purely on day-one features.
  const [showPhase2, setShowPhase2] = useState(true)

  // Sync scroll → URL hash via IntersectionObserver. Each <Section>
  // gets `scroll-mt-6` (set inside home.tsx) so anchored scrolls
  // don't tuck under the topbar.
  useEffect(() => {
    const ids = GROUPS.flatMap(g => g.items.map(idFor))
    const els = ids.map(id => document.getElementById(id)).filter((x): x is HTMLElement => !!x)
    if (els.length === 0) return
    const io = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting)
        if (visible.length === 0) return
        const top = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        setActiveId(top.target.id)
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
        {/* Top — wordmark + back-to-prototype link. */}
        <div className="shrink-0 px-5 pt-6 pb-4 flex flex-col gap-3 border-b border-border">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-xsmall font-normal text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeft className="size-3.5" />
            Back to prototype
          </a>
          <div>
            <h2 className="text-small font-medium text-foreground">Design system</h2>
            <p className="text-xsmall text-muted-foreground mt-0.5">Components & patterns</p>
          </div>
          {/* Phase 2 visibility — toggle hides shop/products
              components from both the sidebar nav and the content
              so day-one work isn't visually crowded. */}
          <label className="flex items-center justify-between gap-3 pt-1 cursor-pointer select-none">
            <span className="text-xsmall font-normal text-muted-foreground">Show Phase 2</span>
            <Switch checked={showPhase2} onCheckedChange={setShowPhase2} />
          </label>
        </div>

        {/* Grouped section nav. */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {GROUPS.map(group => {
            const visibleItems = group.items.filter(item => showPhase2 || !PHASE_2.has(item))
            if (visibleItems.length === 0) return null
            return (
            <div key={group.title} className="mb-4 last:mb-0">
              <p className="text-2xsmall font-medium uppercase tracking-wider text-muted-foreground px-3 pt-3 pb-1">
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
                          "w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xsmall font-normal transition-colors " +
                          (isActive
                            ? "bg-secondary text-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground")
                        }
                      >
                        <span className="truncate">{item}</span>
                        {PHASE_2.has(item)    && <Badge variant="secondary" className="ml-auto">Phase 2</Badge>}
                        {status === "new"     && <Badge variant="success" className="ml-auto">New</Badge>}
                        {status === "updated" && <Badge variant="outline" className="ml-auto">Updated</Badge>}
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
