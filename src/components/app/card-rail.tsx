"use client"

/*
 * CardRail — section divider (separator + title + ◀ ▶ + "Show all")
 * followed by a horizontally-scrolling rail of cards. Used on the
 * home page for "New Albums", "Playlists of the week", "Artists of
 * the week", "Albums of the week".
 *
 * Figma source: file dbSHgvquI2o4TFie2iAJxv › node 2840:103335
 *   · Section Divider: <Separator/>, then title-left, arrow + ghost
 *     "Show all" button cluster on the right.
 *   · Covers Auto: visible cards laid out exactly like the Library
 *     grids — same column count steps at the same container-width
 *     thresholds — except the row extends horizontally beyond the
 *     visible area and scrolls instead of wrapping.
 *
 * Visible-card count vs. container width (same map as
 * library-albums-view / -artists-view / -playlists-view):
 *   · ≥304  → 2 cols
 *   · ≥464  → 3 cols
 *   · ≥692  → 4 cols
 *   · ≥928  → 5 cols
 *   · ≥1164 → 6 cols
 *   · ≥1500 → 7 cols  (tier-2 wide-screen step — kicks in once the
 *                      page container expands to its 1716px ceiling
 *                      at viewport ≥ 1920px; the 1500 threshold sits
 *                      safely above tier-1's 1400 content width so
 *                      tier-1 never collapses into 7 smaller cards)
 * Each card width = (container - (N-1)·16) / N via `cqw` arithmetic
 * so cards align to the same column tracks the library uses.
 *
 * Scrolling: the row uses scroll-snap so cards land on whole-card
 * boundaries. Arrow buttons scroll by the row's `clientWidth` —
 * roughly one page of visible cards — and snap re-aligns afterwards.
 *
 * Responsive model — synced to the MediaHeader / sidebar system:
 *   · Swipe peek below 560px container (the MediaHeader's stacked
 *     breakpoint): cards leave a ~24px sliver of the next card at the
 *     right edge, signalling the row scrolls on touch. With the sidebar
 *     auto-collapsing below ~1069px viewport, container = viewport − 133,
 *     so peek-at-560 lines up with the MediaHeader stacking at the same
 *     viewport. From 560px up cards fit exactly N-per-row (clean grid
 *     aligned to the Library grids), no peek.
 *   · Chevrons (◀ ▶) are a POINTER affordance for GRID mode (≥ 560)
 *     only. Below 560 the swipe peek is the scroll cue, so the arrows
 *     would be redundant and are hidden. On touch they're always hidden
 *     — the peek / native swipe is the cue.
 *
 * Note the column COUNT still steps at the shared 304/464/692/928/1164/
 * 1500 thresholds (same as the Library grids); only the peek reserve and
 * the min-width floor switch at 560.
 *
 * `mobileGrid` (opt-in): for shelves with 12+ entries, an editor can
 * flip the rail into a 2-row, column-major swipeable grid on mobile
 * (< 560px) — cards stack in pairs and you swipe across columns,
 * showing ~2× the cards per screen. Desktop is unchanged. The 12+
 * count + editor toggle is the HOST's decision; the component just
 * takes the boolean.
 */

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface CardRailProps {
  title:      string
  /** Label for the trailing "Show all" pill. Defaults to "Show all".
   *  Pass `null` to suppress the button entirely (e.g. when the rail
   *  already shows every available item — like "Artists on this
   *  Album"). */
  showAllLabel?: string | null
  onShowAll?: () => void
  /** When true, "Show all" renders ONLY if the rail actually overflows
   *  (there's off-screen content to scroll to). Use where the rail
   *  already contains every item — e.g. search-result sections — so the
   *  link doesn't appear when nothing is hidden. Default false: "Show
   *  all" always shows (Home / detail rails, where it links to a fuller
   *  page that holds more than the rail). */
  showAllOnlyWhenScrollable?: boolean
  /** Opt-in "swipeable grid" mode for MOBILE only. When true, on
   *  containers below 560px the rail lays cards out as a 2-row,
   *  column-major horizontal grid (swipe across columns) instead of
   *  a single row — surfacing ~2× the cards per screen. From 560px up
   *  it collapses to a single-row exact grid (unchanged).
   *
   *  Editorial rule (host's call, NOT enforced here): only enable
   *  this when the rail holds 12+ entries, and only when a muza
   *  backend editor has opted the shelf into the denser layout.
   *  Fewer than ~12 and the 2-row grid looks sparse. */
  mobileGrid?: boolean
  children:   React.ReactNode
}

export function CardRail({ title, showAllLabel = "Show all", onShowAll, showAllOnlyWhenScrollable = false, mobileGrid = false, children }: CardRailProps) {
  const scrollRef = useRef<HTMLUListElement>(null)
  // Track whether the rail can scroll in either direction. When
  // both are false the content fits the viewport entirely → hide
  // the ◀ ▶ controls so they don't read as broken affordances.
  // 1px tolerance because sub-pixel rounding can leave `scrollLeft`
  // at e.g. 0.5 even when visually at the start.
  const [canScrollLeft,  setCanScrollLeft]  = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const recalc = () => {
      const maxScroll = el.scrollWidth - el.clientWidth
      setCanScrollLeft(el.scrollLeft > 1)
      setCanScrollRight(el.scrollLeft < maxScroll - 1)
    }
    recalc()
    el.addEventListener("scroll", recalc, { passive: true })
    // ResizeObserver covers both window resize and parent layout
    // changes (e.g. sidebar collapse) — anything that affects the
    // rail's clientWidth.
    const ro = new ResizeObserver(recalc)
    ro.observe(el)
    // Also re-check when children change (e.g. mocked data loads
    // a frame after mount). MutationObserver on the UL catches
    // child list mutations.
    const mo = new MutationObserver(recalc)
    mo.observe(el, { childList: true, subtree: true })
    return () => {
      el.removeEventListener("scroll", recalc)
      ro.disconnect()
      mo.disconnect()
    }
  }, [])
  const showArrows = canScrollLeft || canScrollRight

  // Scroll by one "page" — the visible width PLUS one gap. The +gap
  // matters: clientWidth covers N cards + (N-1) gaps; the NEXT page
  // starts after the N-th gap, so we need to overshoot the visible
  // area by exactly one gap-width to land cleanly on card N+1.
  // Without this the row drifts ~16px each press, leaving a half-gap
  // on the left edge after the first scroll.
  const scrollPage = (dir: 1 | -1) => {
    const el = scrollRef.current
    if (!el) return
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0
    el.scrollBy({ left: dir * (el.clientWidth + gap), behavior: "smooth" })
  }


  return (
    // No local `@container` here on purpose: the row inherits its
    // query container from the page wrapper (home view / kitchen
    // sink), the same one the Library grids query. That way a row
    // and a grid sitting at the same page width always pick the
    // same column-count step, so cards are identically sized.
    //
    // `min-w-0` lets a flex parent shrink this section below its
    // intrinsic content width; `overflow-x-clip` is the belt-and-
    // braces so horizontal overflow can never leak up to the page
    // scroll. `clip` (not `hidden`) so the vertical axis stays
    // `visible` and child focus rings/hover overlays aren't cut.
    <section className="flex flex-col gap-4 min-w-0 overflow-x-clip">
      <div className="flex flex-col gap-2 pt-6">
        <Separator />
        <div className="flex items-center justify-between gap-3">
          {/* Title never wraps past one line — truncates with an ellipsis
               when the row gets tight; `min-w-0` lets it shrink in the
               flex, and the action cluster is `shrink-0` so it's never
               squeezed by a long title. */}
          <h2 className="text-base font-medium text-foreground truncate min-w-0">{title}</h2>
          <div className="flex items-center gap-1 shrink-0">
            {/* Order per spec: [Show all] then ◀ ▶. Show-all is
                 optional; arrows are always rendered with the outline
                 variant so they read as proper nav affordances. */}
            {/* "Show all" is a quiet ghost link on desktop, but in mobile
                 peek mode (< 560 — where the chevrons drop out) it firms
                 up into a secondary pill so it stays a clear, tappable
                 affordance. `!` beats ghost's own hover:bg-accent. */}
            {showAllLabel && (!showAllOnlyWhenScrollable || showArrows) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onShowAll}
                className="@max-[559px]:!bg-secondary @max-[559px]:!text-secondary-foreground @max-[559px]:hover:!bg-secondary-hover"
              >
                {showAllLabel}
              </Button>
            )}
            {/* ◀ ▶ are a pointer affordance for GRID mode only. Below
                 560 (peek mode) the cut-off card is the scroll cue, so
                 the arrows would be redundant — hide them there. On touch
                 devices the peek/native swipe is always the cue, so hide
                 them there too (`@media(hover:none)`). Net: arrows show
                 only on a pointer device at ≥ 560 container, while the
                 rail can still scroll. */}
            {showArrows && (
              <div className="flex items-center gap-1 [@media(hover:none)]:!hidden @max-[559px]:hidden">
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label={`Scroll ${title} left`}
                  onClick={() => scrollPage(-1)}
                  disabled={!canScrollLeft}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label={`Scroll ${title} right`}
                  onClick={() => scrollPage(1)}
                  disabled={!canScrollRight}
                >
                  <ChevronRight />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card rail.
           · `gap-4` and 100cqw arithmetic put exactly N cards in the
             visible area at each container width step, mirroring the
             Library grid math.
           · `max-w-[220px]` caps individual cards so on very wide
             containers the row's items don't balloon past the
             library's 220 ceiling.
           · Card width is floored at the 220px max on mobile (< 560)
             so cards lock to the default max size — one big card +
             peek; from 560 up the floor drops to 143 so the exact-
             grid calc governs the desktop steps.
           · `scrollbar-none` hides the OS scrollbar — navigation is
             via the arrow buttons or swipe. */}
      <ul
        ref={scrollRef}
        className={
          // ── Shared scroll chrome (both modes) ──────────────────
          //   · `min-w-0` — without this, flex/grid parents let the
          //     ul grow to its intrinsic content width, leaking
          //     horizontal scroll up to the page.
          //   · `overflow-y-hidden` clamps y back from `auto`.
          //   · `touch-action: pan-x` — touch pans only horizontally;
          //     vertical swipes pass to the page scroll.
          //   · `overscroll-behavior-x: contain` — no body rubber-band.
          //   · `snap-x snap-proximity` — gentle snap to card/column
          //     boundaries after swipe; each `<li>` is `snap-start`.
          //   · Scrollbar hidden across browsers.
          "min-w-0 items-start overflow-x-auto overflow-y-hidden " +
          "snap-x snap-proximity scroll-smooth touch-pan-x overscroll-x-contain " +
          "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden " +
          "[&>li]:snap-start [&>li]:max-w-[220px] " +
          (mobileGrid
            ? // ── Swipeable GRID mode (opt-in) ──────────────────
              // Mobile (< 560 — synced to the MediaHeader's stacked
              // breakpoint): 2-row, column-major horizontal grid
              // (`grid-flow-col grid-rows-2`) so cards stack in pairs
              // and you swipe across columns — ~2× the cards per
              // screen. `auto-cols` sets the column (card) width with
              // the same peek formula as row mode. From 560 up it
              // collapses to a single row (`grid-rows-1`) and exact
              // N-per-column, identical to the default rail.
              "grid grid-flow-col grid-rows-2 @min-[560px]:grid-rows-1 gap-x-4 gap-y-6 " +
              // Cards are small in the 2-row mobile grid — drop the year
              // (AlbumCard tags it `data-card-year`) below 560 to keep
              // the meta line from crowding. Year returns on the single
              // row from 560 up.
              "@max-[559px]:[&_[data-card-year]]:hidden " +
              "auto-cols-[40%] " +
              "@min-[304px]:auto-cols-[calc((100%-72px)/3)] " +
              "@min-[464px]:auto-cols-[calc((100%-88px)/4)] " +
              "@min-[560px]:auto-cols-[calc((100%-32px)/3)] " +
              "@min-[692px]:auto-cols-[calc((100%-48px)/4)] " +
              "@min-[928px]:auto-cols-[calc((100%-64px)/5)] " +
              "@min-[1164px]:auto-cols-[calc((100%-80px)/6)] " +
              "@min-[1500px]:auto-cols-[calc((100%-96px)/7)]"
            : // ── Default ROW mode ──────────────────────────────
              // Single flex row. Mobile peek (< 560 — synced to the
              // MediaHeader's stacked breakpoint): card width floored at
              // the 220px max → one/two big cards + ~24px peek (swipe
              // cue). From 560 up: exact N-per-row (no peek), aligned to
              // the Library grids; floor drops to 143 so the calc
              // governs. The 560 step removes the peek reserve from the
              // 3-col width so 560–691 is a clean grid (the column COUNT
              // steps stay at the shared 304/464/692/928/1164/1500
              // thresholds). Peek formula: w = (100% − 40 − (N−1)·16)/N;
              // exact formula: w = (100% − (N−1)·16)/N.
              "flex gap-4 [&>li]:shrink-0 " +
              "[&>li]:min-w-[220px] @min-[560px]:[&>li]:min-w-[143px] " +
              "[&>li]:w-[60%] " +
              "@min-[304px]:[&>li]:w-[calc((100%-56px)/2)] " +
              "@min-[464px]:[&>li]:w-[calc((100%-72px)/3)] " +
              "@min-[560px]:[&>li]:w-[calc((100%-32px)/3)] " +
              "@min-[692px]:[&>li]:w-[calc((100%-48px)/4)] " +
              "@min-[928px]:[&>li]:w-[calc((100%-64px)/5)] " +
              "@min-[1164px]:[&>li]:w-[calc((100%-80px)/6)] " +
              "@min-[1500px]:[&>li]:w-[calc((100%-96px)/7)]")
        }
      >
        {children}
      </ul>
    </section>
  )
}
