"use client"

/*
 * MobileAppHeader — the live, route-aware wrapper that swaps in for the
 * desktop `Topbar` below the footer-nav breakpoint. It maps the current
 * `?page=` view to one of the `MobileHeader` contexts and owns the small
 * bits of local state each interactive context needs (library search
 * toggle; the Explore idle→focused→submitted search machine).
 *
 * It renders INSIDE the shell's scroll container as a `sticky top-0`
 * element, so page content scrolls under its frosted glass — the same
 * surface as the bottom FooterNav.
 *
 * Variants:
 *   · Home                         → title + avatar
 *   · Albums/Artists/Playlists/Songs → "Library" + add/search + tabs
 *   · Explore                      → "Explore" + search (focus → scope
 *                                     toggle, Enter → result filters)
 *   · Album/Playlist/Artist        → slim back-only bar (page carries its
 *                                     own MediaHeader)
 *   · anything else (Purchases/Settings/Studio) → generic title + back
 */

import { useState, useRef, useEffect } from "react"
import { Plus, Search, ChevronLeft, MoreHorizontal, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  MobileHeader, MobileTitleRow, MobileIconButton,
  MobileSearchBar, MobilePillTabs, type PillTab,
} from "@/components/ui/mobile-header"
import { ToggleGroup } from "@/components/ui/toggle-group"
import { Toggle } from "@/components/ui/toggle"
import { SearchPanel } from "@/components/ui/search-panel"
import { DetailMoreButton } from "@/components/ui/detail-more-button"
import { useDetailHeader } from "@/lib/detail-actions"
import { useImageLuminance } from "@/lib/use-image-luminance"
import { useSearchNav } from "@/lib/use-search-nav"
import { ProfileMenu } from "@/components/app/topbar"

// Same account avatar as the desktop Topbar — but here it's the trigger
// for the shared ProfileMenu, which presents as a bottom sheet on touch
// (Your profile / purchases / Wallet / Settings / Sign out).
const Avatar = () => <ProfileMenu avatarClassName="size-9" />

// Mobile library filter pills. "All" → the combined LibraryAllView
// (`?page=Library`); the rest navigate to their per-type routes. The
// row is horizontally swipable (MobilePillTabs scrolls on overflow).
const LIBRARY_PAGES = ["Library", "Albums", "Artists", "Playlists", "Songs"]
const LIBRARY_TABS: PillTab[] = [
  { value: "Library", label: "All" },
  { value: "Albums", label: "Albums" },
  { value: "Artists", label: "Artists" },
  { value: "Playlists", label: "Playlists" },
  { value: "Songs", label: "Songs" },
]

const DETAIL_PAGES = ["Album", "Playlist", "Artist"]

interface MobileAppHeaderProps {
  activeNav: string
  onNavChange: (nav: string) => void
  /** Back target for media-detail pages (drives the back chevron). */
  onBack?: () => void
}

export function MobileAppHeader({ activeNav, onNavChange, onBack }: MobileAppHeaderProps) {
  if (activeNav === "Home") {
    return (
      <MobileHeader>
        <MobileTitleRow title="Home" trailing={<Avatar />} />
      </MobileHeader>
    )
  }

  if (activeNav === "Explore") return <ExploreHeader />

  if (LIBRARY_PAGES.includes(activeNav)) {
    return <LibraryHeader activeNav={activeNav} onNavChange={onNavChange} />
  }

  if (DETAIL_PAGES.includes(activeNav)) return <DetailHeader onBack={onBack} />

  // Generic pages (Purchases / Settings / Studio tabs): title + back-or-avatar.
  return (
    <MobileHeader>
      <MobileTitleRow
        title={activeNav}
        trailing={onBack
          ? <MobileIconButton label="Back" onClick={onBack}><ChevronLeft /></MobileIconButton>
          : <Avatar />}
      />
    </MobileHeader>
  )
}

// ── Detail (Album / Playlist / Artist) — slim back ⇄ "…" row ─────────
// A minimal transparent header that sits ABOVE the cover (never on top
// of the artwork): a small ghost back chevron on the left mirrored by
// the page's "…" overflow on the right. The page publishes its menu via
// usePublishDetailHeader. Figma: 5953:188456.
//
// At rest the bar is TRANSPARENT — just a back chevron (left) and "…"
// (right) flanking the cover beneath; no wasted chrome. Once the page
// scrolls past the title, the bar fades to frosted glass and a small
// centered title appears (Spotify / Apple Music). The bar is sticky
// inside the scroll container, so it tracks that container's scrollTop.
function DetailHeader({ onBack }: { onBack?: () => void }) {
  const config = useDetailHeader()
  const ref = useRef<HTMLElement>(null)
  const [scrolled, setScrolled] = useState(false)
  // Sample the cover's top strip so the buttons flip to the legible mode
  // (light icons over a dark cover, dark over a light one). Only matters
  // while the bar is transparent; once scrolled it sits on light glass.
  const lum = useImageLuminance(config?.coverSrc)

  useEffect(() => {
    // Find the nearest scrollable ancestor (the shell's scroll area).
    let el = ref.current?.parentElement
    while (el) {
      const oy = getComputedStyle(el).overflowY
      if (oy === "auto" || oy === "scroll") break
      el = el.parentElement
    }
    if (!el) return
    const scroller = el
    // Collapse once the title (which sits just below the cover) has
    // scrolled up under the bar — ~ cover height + spacing on a phone.
    const onScroll = () => setScrolled(scroller.scrollTop > 300)
    onScroll()
    scroller.addEventListener("scroll", onScroll, { passive: true })
    return () => scroller.removeEventListener("scroll", onScroll)
  }, [config])

  return (
    <header
      ref={ref}
      className={cn(
        "sticky top-0 z-30 select-none transition-[background-color,backdrop-filter] duration-200",
        "px-3 pt-[max(8px,env(safe-area-inset-top))] pb-2",
        // Negative bottom margin → the bar reserves NO band of its own;
        // the cover beneath pulls up so back / "…" sit in the side
        // gutters beside the top of the (centered) cover. Figma uses the
        // same `mb-[-26px]` trick. On scroll the bar turns to glass.
        "-mb-[52px]",
        scrolled ? "frosted-glass border-b border-border/50" : "bg-transparent border-b border-transparent",
      )}
    >
      {/* One bar style for ALL detail pages — bare ghost icons. While the
           bar is transparent the icons must read against the COVER: over a
           dark cover they go light (wrap row in `.dark`), over a light one
           they stay dark. Once the bar collapses to light frosted glass we
           always use dark icons. Same size / position throughout — only
           the colour adapts. */}
      {(() => {
        const overDarkCover = lum === "dark" && !scrolled
        return (
          <div className={cn("flex items-center justify-between gap-2 min-h-8 -mx-1", overDarkCover && "dark")}>
            <Button variant="ghost" size="icon-sm" aria-label="Back" onClick={onBack} className="shrink-0">
              <ChevronLeft />
            </Button>

            {/* Small centered title — only shown once collapsed, which is
                 also the only time the row is NOT `.dark`, so it stays the
                 normal dark-on-light foreground. */}
            <p
              className={cn(
                "absolute left-1/2 -translate-x-1/2 max-w-[58%] truncate text-base font-medium text-foreground transition-opacity duration-200",
                scrolled ? "opacity-100" : "opacity-0",
              )}
            >
              {config?.title}
            </p>

            {config?.menu ? (
              <DetailMoreButton
                {...config.menu}
                triggerVariant="ghost"
                triggerSize="icon-sm"
                triggerIcon={<MoreHorizontal />}
                className="shrink-0"
              />
            ) : (
              <span className="size-8 shrink-0" />
            )}
          </div>
        )
      })()}
    </header>
  )
}

// ── Library — title ⇆ search, with a persistent filter-tab row ────────
// Tapping the search icon grows it leftward into a full-width field
// (the title + add button yield their space), all within a fixed-height
// row so the header never jumps.
function LibraryHeader({ activeNav, onNavChange }: { activeNav: string; onNavChange: (n: string) => void }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const openSearch = () => { setOpen(true); requestAnimationFrame(() => inputRef.current?.focus()) }
  const closeSearch = () => { setOpen(false); setQ(""); inputRef.current?.blur() }

  return (
    <MobileHeader>
      {/* Fixed-height row — title, add, and the growing search pill all
           share the same 40px line so toggling search never resizes the
           header. */}
      <div className="flex items-center gap-2 h-10">
        {/* Title + add only exist while NOT searching, so the search
             field can take the full container width when open (no
             leftover items eating space / gaps). */}
        {!open && (
          <>
            <h1 className="flex-1 min-w-0 overflow-hidden whitespace-nowrap text-2xlarge font-medium tracking-tight text-foreground">
              Library
            </h1>
            <MobileIconButton label="Add"><Plus /></MobileIconButton>
          </>
        )}

        {/* Search — a secondary icon button (identical to Add) that grows
             into a full-width secondary field. */}
        <div className={cn(
          "flex items-center h-9 rounded-full bg-secondary overflow-hidden transition-all duration-300 ease-out",
          open
            ? "flex-1 pl-4 pr-3 gap-2"
            : "flex-none basis-9 w-9 justify-center hover:bg-secondary-hover active:scale-[0.96]",
        )}>
          <button
            type="button"
            aria-label="Search"
            onClick={open ? undefined : openSearch}
            className="shrink-0 flex items-center justify-center text-foreground outline-none [&_svg]:size-[18px]"
          >
            <Search />
          </button>
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            onBlur={() => { if (!q) setOpen(false) }}
            placeholder="Search your library"
            tabIndex={open ? 0 : -1}
            className={cn(
              "min-w-0 bg-transparent outline-none text-base font-normal text-foreground placeholder:text-muted-foreground transition-opacity duration-200",
              open ? "flex-1 opacity-100 delay-100" : "w-0 flex-none opacity-0 pointer-events-none",
            )}
          />
          {/* Trailing: clear the query, or (when empty) close search. */}
          {open && (
            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => (q ? setQ("") : closeSearch())}
              aria-label={q ? "Clear" : "Close search"}
              className="shrink-0 text-muted-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      <MobilePillTabs value={activeNav} onChange={onNavChange} tabs={LIBRARY_TABS} />
    </MobileHeader>
  )
}

// ── Explore — search field → recent/suggestions panel → results ───────
// The query lives in the URL (`?q=`); submitting renders the full results
// (heading · scope toggle · tabs · list) in the page body, identical to
// desktop. The scope + category controls therefore live in the body, not
// here — the header is purely the search entry point.
function ExploreHeader() {
  const { query, submit, scope, setScope } = useSearchNav()
  const [q, setQ] = useState(query)
  const [focused, setFocused] = useState(false)
  useEffect(() => { setQ(query) }, [query])

  const run = (val: string) => { submit(val); setQ(val); setFocused(false) }

  return (
    <MobileHeader>
      {/* Title only in the idle state (no query, not focused). */}
      {!focused && !query && <MobileTitleRow title="Explore" trailing={<Avatar />} />}
      <MobileSearchBar
        value={q}
        onChange={setQ}
        placeholder="Search Artists, Albums, Songs or Playlists"
        onFocus={() => setFocused(true)}
        onClear={q ? () => setQ("") : undefined}
        onCancel={focused ? () => setFocused(false) : undefined}
        onSubmit={() => run(q)}
      />
      {/* Scope switcher — the SAME ToggleGroup used on desktop, stretched
          full-width. In the header with the search field; shown once results
          exist (a query is active and we're not in the suggestions state). */}
      {!focused && query && (
        <ToggleGroup
          size="sm"
          value={[scope]}
          onValueChange={v => { if (v[0]) setScope(v[0] as typeof scope) }}
          aria-label="Search scope"
          className="w-full"
        >
          <Toggle value="catalog">Muza Catalog</Toggle>
          <Toggle value="library">My Library</Toggle>
        </ToggleGroup>
      )}
      {/* Recent searches / suggestions while focused — an OVERLAY anchored
          under the header (absolute, not in flow) so it sits on top of the
          page instead of pushing its content down. */}
      {focused && (
        <div className="absolute inset-x-3 top-full z-40">
          <SearchPanel query={q} onPick={run} className="max-h-[calc(100dvh-140px)] overflow-y-auto" />
        </div>
      )}
    </MobileHeader>
  )
}
