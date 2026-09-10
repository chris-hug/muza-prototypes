"use client"

/*
 * Muza design system — dedicated route with its own minimal shell.
 * Left sidebar carries the grouped section nav (synced to the
 * `?section=…` URL param so deep links are shareable); main area
 * renders the existing `ExploreView` kitchen sink with its inline
 * chip-nav suppressed.
 *
 * Top of the sidebar holds an icon-only back button so the docs never trap
 * the user away from the product, and the light/dark switch beside it — the
 * app's real theme, since every section here is a claim about how something
 * looks and half of those are only checkable in the other mode.
 */

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router"
import { ArrowLeft, Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RampController } from "@/components/ds/ramp-controller"
import { Button } from "@/components/ui/button"
import { ThemeSwitch } from "@/components/ds/theme-switch"
import { useResizableWidth } from "@/lib/use-resizable-width"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { ExploreView, SectionFilter } from "./home"

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
  { title: "Inputs",           items: ["Input", "Chip Input", "File Field", "NumberField", "Select", "MultiSelect", "SingleSelect", "Combobox", "Menu", "Detail Menu", "Nav Row", "NavigationMenu", "DatePicker", "Checkbox & Radio", "Select Track", "Radio Card", "Switch", "Slider"] },
  { title: "Indicators",       items: ["Progress", "Meter", "Spinner", "Top Progress Bar", "Stepper", "Separator", "Avatar", "User Avatar"] },
  { title: "Containers",       items: ["Tabs", "Tooltip", "Collapsible", "Accordion"] },
  { title: "Cards & lists",    items: ["Album Card", "Artist Card", "Playlist Card", "Cover Play Button", "Song List Item", "Media List Item", "Search", "Card Rail", "Song Rail", "Product Card", "Checkout Card"] },
  { title: "Page composition", items: ["Media Header", "Artist Header", "Mobile Header", "Footer Nav", "Page Section", "Items"] },
  { title: "Overlays",         items: ["Alerts", "AlertDialog", "Dialog", "Purchase Album Dialog", "Paywall", "Login", "Credits Dialog", "Drawer", "Toast"] },
  { title: "Utility",          items: ["Skeleton", "Popover", "Table", "Sort Header", "List Table", "Bulk Action Bar", "Pagination", "Command", "OTP Input", "Form"] },
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


/* ── Components tab ───────────────────────────────────────────────────────
 * The kitchen sink and its nav, unchanged in substance: grouped list, search,
 * scroll-spy, phase-2 toggle. What it lost is its chrome — the back button and
 * the light switch moved up into the prototyper's header, where they belong to
 * the window rather than to one of its tabs. */
function ComponentsTab() {
  const navRef  = useRef<HTMLElement>(null)
  const mainRef = useRef<HTMLElement>(null)
/*
 * Search aliases — what a section is CALLED in the sidebar is not always what
 * you would type looking for it.
 *
 * The case that prompted this: the sheet is filed under "Drawer" (the base-ui
 * primitive it is built on) while the component you import is `Sheet`, so
 * typing the name of the thing found nothing. Rather than renaming the section
 * and breaking its doc, its anchor and every link into it, the search learns
 * the other words for it.
 *
 * Keep these to real synonyms and to the CODE name — this is a search box, not
 * a tag system.
 */
const ALIASES: Record<string, string[]> = {
  /* Three different things in this app are a bottom sheet, and none of
     them is called one in the sidebar. */
  Drawer:            ["sheet", "bottom sheet", "modal"],
  "Detail Menu":     ["sheet", "bottom sheet", "more", "overflow", "..."],
  Menu:              ["sheet", "bottom sheet", "dropdown", "context menu"],
  Dialog:            ["modal"],
  AlertDialog:       ["confirm", "destructive"],
  "Song List Item":  ["row", "track"],
  "Media List Item": ["row"],
  Toast:             ["snackbar", "notification"],
  Combobox:          ["autocomplete", "typeahead"],
  MultiSelect:       ["tags", "chips"],
  Chips:             ["tag", "filter"],
  Meter:             ["gauge"],
  Spinner:           ["loader", "loading"],
  Skeleton:          ["placeholder", "loading"],
  Popover:           ["tooltip", "flyout"],
  "Cover Play Button": ["artwork", "thumb"],
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
    (showPhase2 || !PHASE_2.has(item)) &&
    (!q || item.toLowerCase().includes(q) || (ALIASES[item] ?? []).some(a => a.includes(q)))
  const firstMatchId = () => {
    for (const g of GROUPS) for (const item of g.items) if (matches(item)) return idFor(item)
    return null
  }

  // Sync scroll → active sidebar item. Each <Section> gets `scroll-mt-6`
  // (set inside home.tsx) so anchored scrolls don't tuck under the topbar.
  //
  // This reads rects on scroll rather than using an IntersectionObserver,
  // and the reason is the page itself: a section here is several Examples
  // tall, routinely taller than any band an observer could sensibly watch.
  // So two sections overlap the band for most of a scroll, and an observer
  // can only answer which of them ENTERED first — never which one you are
  // reading. That showed as a highlight one section behind the page: with
  // Tabs at the top of the screen the sidebar still said User Avatar,
  // because User Avatar's tail had not cleared the band yet.
  //
  // The reading line answers it directly: the active section is the LAST
  // one whose top has passed it.
  //
  // Deliberately NOT coalesced through requestAnimationFrame. The browser
  // already caps scroll events at one per frame, so rAF batches nothing that
  // was not batched — it only defers the read by a frame and adds a second
  // way to stall. Reading ~78 rects is one forced layout, once a frame.
  //
  // `visibilitychange` is listened to for the case rAF would have made
  // permanent: a tab throttled to a couple of frames a second drops most of
  // its scroll events, so whatever it last managed to compute is stale by
  // the time the reader looks. Recomputing on the way back fixes it.
  useEffect(() => {
    const scroller = mainRef.current
    if (!scroller) return
    const ids = GROUPS.flatMap(g => g.items.map(idFor))

    const recalc = () => {
      // The line sits just under the topbar — a section counts as "the one
      // being read" from the moment its heading reaches it.
      const line = scroller.getBoundingClientRect().top + 96
      // The deepest heading that has passed the line — "deepest" by rect,
      // not by list position, so this does not quietly depend on GROUPS
      // being in the same order as the sections in `ExploreView`.
      let current: string | null = null
      let best = -Infinity
      for (const id of ids) {
        const top = document.getElementById(id)?.getBoundingClientRect().top
        if (top == null || top > line || top <= best) continue
        best = top
        current = id
      }
      // Above the first heading, the first section is the honest answer.
      setActiveId(current ?? ids[0])
    }

    recalc()
    scroller.addEventListener("scroll", recalc, { passive: true })
    window.addEventListener("resize", recalc)
    // A tab that was throttled while the reader scrolled elsewhere comes
    // back with the right answer instead of the last one it managed.
    document.addEventListener("visibilitychange", recalc)
    return () => {
      scroller.removeEventListener("scroll", recalc)
      window.removeEventListener("resize", recalc)
      document.removeEventListener("visibilitychange", recalc)
    }
  }, [showPhase2])

  // Keep the active item visible inside the nav, which is its own scroll
  // area and taller than the sidebar. Without this the highlight is correct
  // and invisible — the reader scrolls the page and has to hunt the sidebar
  // to find out where they are, which is the one job this list has.
  //
  // Scrolled by hand rather than with `scrollIntoView`: that walks every
  // scrollable ancestor, so it would drag the CONTENT pane along with it and
  // fight the scroll that triggered this in the first place.
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const el = nav.querySelector<HTMLElement>(`[data-nav-id="${CSS.escape(activeId)}"]`)
    if (!el) return
    const navBox = nav.getBoundingClientRect()
    const box = el.getBoundingClientRect()
    const pad = 48 // keep a couple of neighbours in view on either side
    if (box.top < navBox.top + pad) {
      nav.scrollTop -= navBox.top + pad - box.top
    } else if (box.bottom > navBox.bottom - pad) {
      nav.scrollTop += box.bottom - (navBox.bottom - pad)
    }
  }, [activeId])

  const goto = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: "smooth", block: "start" })
    history.replaceState(null, "", `#${id}`)
    setActiveId(id)
  }

  return (
    <div className="flex h-full w-full min-h-0">
      {/* The component nav is the tab's OWN column, not the shell's sidebar —
          that slot belongs to the themer now. */}
      <aside className="shrink-0 w-60 border-r border-border bg-background flex flex-col min-h-0">
        {/* Top — back link, title, component search, phase-2 toggle.
            Borderless / minimal; the nav below carries its own spacing. */}
        <div className="shrink-0 px-4 pt-6 pb-4 flex flex-col gap-4 border-b border-border">
          {/* Component search — the catalogue's own `Input`, which already
              draws the leading glyph and the clear button. This used to be a
              hand-built copy: an absolutely positioned `Search`, a bespoke ✕,
              and its own paddings. */}
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onClear={() => setQuery("")}
            onKeyDown={e => { if (e.key === "Enter") { const id = firstMatchId(); if (id) goto(id) } }}
            placeholder="Search components"
            aria-label="Search components"
            startIcon={<Search />}
          />

          <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
            <span className="text-xsmall font-normal text-muted-foreground">Show Phase 2</span>
            <Switch checked={showPhase2} onCheckedChange={setShowPhase2} />
          </label>
        </div>

        {/* Grouped section nav. */}
        <nav ref={navRef} className="flex-1 overflow-y-auto py-2 px-2">
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
                        data-nav-id={id}
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
      <main ref={mainRef} className="flex-1 min-w-0 overflow-auto" data-hide-phase-2={!showPhase2 || undefined}>
        {!showPhase2 && (
          // Tailwind doesn't have a parent-attribute selector helper
          // baked in, so a tiny inline style sheet hides sections
          // tagged `data-phase="2"` when the toggle is off.
          <style>{`[data-hide-phase-2] [data-phase="2"] { display: none; }`}</style>
        )}
        {/* The foundations have their own tabs now, so the catalogue leaves
            them out — one section, one home. */}
        <SectionFilter.Provider value={id => !FOUNDATION_IDS.has(id)}>
          <ExploreView showHero={false} showQuickNav={false} />
        </SectionFilter.Provider>
      </main>
    </div>
  )
}

/* ── The prototyper ───────────────────────────────────────────────────────
 *
 * Its own application, not a page of the product: a narrow header — leave ·
 * name · tabs · light switch — a themer down the left, and one tab's worth of
 * content in the rest.
 *
 * The five tabs are the five things a design system is asked about, in the
 * order they get asked: what the type does, how space is measured, what the
 * tokens are, what the components look like, and — the only test that counts —
 * what all of it does to the product.
 *
 * **The themer is a sidebar, not a section.** Colour is not a topic you visit;
 * it is a setting you hold while looking at something else. Parked on the left
 * it stays put across all five tabs, so a hue can be dragged while the
 * Components tab or the Product tab is on screen. That is the whole reason to
 * build this shell instead of leaving the controller inside the Colors
 * section, where it could only ever recolour itself.
 *
 * **Product is an iframe**, and deliberately. The product has its own shell —
 * sidebar, top bar, player — and nesting that inside this one would fight for
 * the same edges. An iframe gives it its own window, and because it is
 * same-origin the themer writes its variables into that document too, so the
 * theme is live in the real app rather than in a preview of it.
 *
 * The frame is loaded with `?embed=1`, and that flag closes a loop: inside the
 * product, "Design system" opens the prototyper — which, in a frame, would be
 * a prototyper inside a prototyper, and again, and again. An embedded product
 * hides that entry, because the prototyper is already the thing around it.
 */

const TABS = [
  { id: "typography", label: "Typography",           sections: (id: string) => id === "typography" },
  { id: "layout",     label: "Layout and Spacings",  sections: (id: string) => id === "responsive" || id === "page-section" },
  { id: "tokens",     label: "Tokens",               sections: (id: string) => id === "colors" },
  { id: "components", label: "Components",           sections: null },
  { id: "product",    label: "Product",              sections: null },
] as const

type TabId = typeof TABS[number]["id"]

/** The sections that belong to a tab of their own, so the catalogue can skip
 *  them. Derived from the tab list rather than typed twice. */
const FOUNDATION_IDS = new Set(
  ["typography", "responsive", "page-section", "colors"],
)

/* The themer's own drag handle — on its RIGHT edge, since the panel is docked
 * left. Same shape as the playlist editor's: a 6px strip that tints on hover,
 * holds its tint while dragging, and snaps back to the default on a
 * double-click. */
function ResizeHandle({ onPointerDown, reset, resizing }: {
  onPointerDown: (e: React.PointerEvent) => void
  reset: () => void
  resizing: boolean
}) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize the themer"
      onPointerDown={onPointerDown}
      onDoubleClick={reset}
      className={cn(
        "absolute inset-y-0 right-0 z-20 w-1.5 cursor-col-resize state-fade",
        "hover:bg-secondary",
        resizing && "bg-secondary-hover",
      )}
    />
  )
}

export default function Prototyper() {
  const [params, setParams] = useSearchParams()
  const themer = useResizableWidth({
    storageKey: "muza:prototyper-themer-width",
    min: 280,
    max: 640,
    maxViewportShare: 0.5,
    edge: "right",
  })

  /* The tab is REACT state that seeds itself from the URL, not state read back
     out of the URL on every render. Both this shell and the product's own
     `navigate()` write to the same query string, and a value that is only ever
     read back is at the mercy of whoever writes last — which is exactly what
     happened: clicking a tab set `?tab=`, the next write from the shell around
     it dropped the parameter, and the tab snapped back. The URL is kept in
     step as an effect, so a deep link still works and a lost write costs the
     address bar rather than the interface. */
  const [tab, setTabState] = React.useState<TabId>(
    () => (TABS.find(t => t.id === params.get("tab"))?.id ?? "components") as TabId,
  )

  React.useEffect(() => {
    if (params.get("tab") === tab) return
    setParams(prev => {
      const p = new URLSearchParams(prev)
      p.set("tab", tab)
      if (tab !== "components") p.delete("section")
      return p
    }, { replace: true })
  }, [tab, params, setParams])

  const setTab = (next: TabId) => setTabState(next)

  const backToProduct = () =>
    setParams(prev => {
      const p = new URLSearchParams(prev)
      p.delete("page"); p.delete("tab"); p.delete("section")
      return p
    }, { replace: true })

  const active = TABS.find(t => t.id === tab)!

  return (
    <div className="flex h-svh w-full flex-col bg-background">
      {/* ── Header ── */}
      <header className="h-14 shrink-0 border-b border-border flex items-center gap-3 px-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={backToProduct}
          title="Back to product"
          aria-label="Back to product"
        >
          <ArrowLeft />
        </Button>
        <span className="text-small font-medium text-foreground whitespace-nowrap">muza prototyper</span>

        <Tabs value={tab} onValueChange={v => setTab(v as TabId)} className="min-w-0">
          <TabsList variant="line" autoCenter={false} className="h-14 gap-1 border-0">
            {TABS.map(t => (
              <TabsTrigger key={t.id} value={t.id} className="flex-none">{t.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <ThemeSwitch className="ml-auto shrink-0" />
      </header>

      {/* ── Themer · content ── */}
      <div className="flex min-h-0 flex-1">
        {/* The themer is draggable, through the same `useResizableWidth` the
            playlist editor uses — including its localStorage memory, so the
            width survives a reload. A colour tool is looked at beside the
            thing it is colouring, and how much room each deserves depends on
            which tab is open: the ramp rows want width, the product wants
            everything else.

            The handle sits on the WRAPPER, not inside the scrolling panel. An
            absolutely positioned handle inside `overflow-y-auto` scrolls with
            the content and hides under the scrollbar — it was there and
            unusable. The wrapper holds the width and the handle; the panel
            inside it does the scrolling. */}
        <div
          ref={themer.ref as React.RefObject<HTMLDivElement>}
          style={themer.width != null ? { width: themer.width } : undefined}
          className={cn(
            "relative shrink-0 border-r border-border min-h-0",
            themer.width == null && "w-[340px]",
          )}
        >
          <aside className="h-full overflow-y-auto">
            <div className="px-4 py-4 border-b border-border">
              <p className="text-small font-medium text-foreground">Themer</p>
              <p className="text-xsmall text-muted-foreground">
                The two primitive ramps. Every change is live on whatever tab is open,
                including the product.
              </p>
            </div>
            <div className="p-4">
              <RampController />
            </div>
          </aside>
          <ResizeHandle
            onPointerDown={themer.onPointerDown}
            reset={themer.reset}
            resizing={themer.resizing}
          />
        </div>

        <main className="flex-1 min-w-0 min-h-0 overflow-hidden">
          {tab === "components" ? (
            <ComponentsTab />
          ) : tab === "product" ? (
            <ProductFrame />
          ) : (
            <div className="h-full overflow-y-auto px-page py-8">
              <SectionFilter.Provider value={active.sections!}>
                <ExploreView showHero={false} showQuickNav={false} />
              </SectionFilter.Provider>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

/* The product, in its own window, themed by ours.
 *
 * `?page=` is stripped so the frame lands on the product's home rather than
 * back in the prototyper, and the themer's inline custom properties are copied
 * into the frame on every change — same origin, so this is allowed, and it is
 * what makes the Product tab a test of the theme rather than a screenshot. */
function ProductFrame() {
  const ref = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const copy = () => {
      const doc = ref.current?.contentDocument
      if (!doc) return
      doc.documentElement.setAttribute("style", document.documentElement.getAttribute("style") ?? "")
      doc.documentElement.className = document.documentElement.className
    }
    copy()
    const observer = new MutationObserver(copy)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style", "class"] })
    return () => observer.disconnect()
  }, [])

  return (
    <iframe
      ref={ref}
      title="muza — the product"
      src="/?embed=1"
      className="h-full w-full border-0"
      onLoad={() => {
        const doc = ref.current?.contentDocument
        if (!doc) return
        doc.documentElement.setAttribute("style", document.documentElement.getAttribute("style") ?? "")
        doc.documentElement.className = document.documentElement.className
      }}
    />
  )
}
