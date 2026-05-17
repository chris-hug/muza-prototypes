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
 * Each card width = (container - (N-1)·16) / N via `cqw` arithmetic
 * so cards align to the same column tracks the library uses.
 *
 * Scrolling: the row uses scroll-snap so cards land on whole-card
 * boundaries (no half-cards visible). Arrow buttons scroll by the
 * row's `clientWidth` — exactly one page of visible cards — so the
 * snap target is always a clean N-card chunk, never mid-card.
 */

import { useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface CardRailProps {
  title:      string
  /** Label for the trailing "Show all" pill. Defaults to "Show all". */
  showAllLabel?: string
  onShowAll?: () => void
  children:   React.ReactNode
}

export function CardRail({ title, showAllLabel = "Show all", onShowAll, children }: CardRailProps) {
  const scrollRef = useRef<HTMLUListElement>(null)

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
        <div className="flex items-center justify-between">
          <h2 className="text-small font-medium text-foreground">{title}</h2>
          <div className="flex items-center gap-1">
            {/* Order per spec: [Show all] then ◀ ▶. Show-all is
                 optional; arrows are always rendered with the outline
                 variant so they read as proper nav affordances. */}
            {showAllLabel && (
              <Button variant="ghost" size="sm" onClick={onShowAll}>
                {showAllLabel}
              </Button>
            )}
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={`Scroll ${title} left`}
              onClick={() => scrollPage(-1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={`Scroll ${title} right`}
              onClick={() => scrollPage(1)}
            >
              <ChevronRight />
            </Button>
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
           · `min-w-[143px]` mirrors the library floor.
           · `scrollbar-none` hides the OS scrollbar — navigation is
             via the arrow buttons or swipe. */}
      <ul
        ref={scrollRef}
        className={
          // Strictly horizontal scrolling, vertical pass-through:
          //   · `min-w-0` — without this, flex parents let the ul
          //     grow to its intrinsic content width, leaking
          //     horizontal scroll up to the page.
          //   · `overflow-y-hidden` clamps y back from `auto`
          //     (overflow-x-auto coerces y to auto by spec).
          //   · `touch-action: pan-x` — touch pans only horizontally;
          //     vertical swipes pass to the page scroll.
          //   · `overscroll-behavior-x: contain` — horizontal scroll
          //     boundary is contained (no body rubber-band).
          //   · `snap-x snap-proximity` — gentle snap to whole-card
          //     boundaries after swipe/drag without the per-frame
          //     vertical-scroll lag of `snap-mandatory`.
          //   · Each `<li>` is `snap-start`.
          //   · Scrollbar hidden across browsers.
          "min-w-0 flex gap-4 items-start overflow-x-auto overflow-y-hidden " +
          "snap-x snap-proximity scroll-smooth " +
          "touch-pan-x overscroll-x-contain " +
          "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden " +
          "[&>li]:shrink-0 [&>li]:snap-start [&>li]:max-w-[220px] [&>li]:min-w-[143px] " +
          // Card widths use `100%` (the ul's own clientWidth), NOT
          // `100cqw` — that way a row and a sibling Library grid at
          // the same page width compute card sizes from the same
          // reference, so visually the cards are identical. The
          // `@min-[Xpx]:` breakpoints still resolve against the
          // parent @container, so step thresholds match the grids.
          // 2 cols (default, also covers ≥304)
          "[&>li]:w-[calc((100%-16px)/2)] " +
          "@min-[464px]:[&>li]:w-[calc((100%-32px)/3)] " +
          "@min-[692px]:[&>li]:w-[calc((100%-48px)/4)] " +
          "@min-[928px]:[&>li]:w-[calc((100%-64px)/5)] " +
          "@min-[1164px]:[&>li]:w-[calc((100%-80px)/6)]"
        }
      >
        {children}
      </ul>
    </section>
  )
}
