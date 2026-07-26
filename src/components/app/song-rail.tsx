"use client"

/*
 * SongRail — horizontal rail that stacks song rows into columns of
 * ROWS_PER_COLUMN and scrolls sideways. The single, shared song-rail shell,
 * used by Artist › Top Songs and Search › Songs. (The card version is the
 * separate `CardRail`; this one is for row-shaped items.)
 *
 * It owns ONLY the shell — heading, gated chevrons, overflow/Show-all logic,
 * the column ladder (1 col default, 2 at ≥692px, 3 at ≥1164px), and the
 * mobile peek. The ROWS themselves are passed in pre-rendered (`rows`), so
 * each caller keeps its own row component + data + wiring (Artist rows wire
 * the player/credits; Search rows are `SearchSongRow`). That's the seam:
 * shared shell, per-context rows.
 *
 * Column widths are computed from the ul's own 100% so they line up with the
 * CardRail card columns at the same page width.
 *
 * `onShowAll` is optional — omit it (Artist Top Songs) for a rail with no
 * "Show all". When present, "Show all" + the arrows appear only once the rail
 * actually overflows. Arrows are a pointer affordance: hidden on touch
 * (`hover:none`) and below 692px, where the peeking next column is the cue.
 */

import { useEffect, useRef, useState } from "react"

import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export const ROWS_PER_COLUMN = 3

export function SongRail({ title, rows, onShowAll }: {
  title: string
  /** Pre-rendered, keyed song rows — the rail chunks them into columns. */
  rows: React.ReactNode[]
  /** Omit for a rail with no "Show all" (e.g. Artist Top Songs). */
  onShowAll?: () => void
}) {
  const scrollRef = useRef<HTMLUListElement>(null)
  const columns: React.ReactNode[][] = []
  for (let i = 0; i < rows.length; i += ROWS_PER_COLUMN) columns.push(rows.slice(i, i + ROWS_PER_COLUMN))

  // Show all + arrows only when there's actually off-screen content to scroll
  // to (same condition CardRail uses for its arrows).
  const [overflowing, setOverflowing] = useState(false)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const recalc = () => setOverflowing(el.scrollWidth - el.clientWidth > 1)
    recalc()
    const ro = new ResizeObserver(recalc); ro.observe(el)
    const mo = new MutationObserver(recalc); mo.observe(el, { childList: true, subtree: true })
    return () => { ro.disconnect(); mo.disconnect() }
  }, [])

  const scrollPage = (dir: 1 | -1) => {
    const el = scrollRef.current
    if (!el) return
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0
    el.scrollBy({ left: dir * (el.clientWidth + gap), behavior: "smooth" })
  }

  return (
    <section className="flex flex-col gap-4 min-w-0 overflow-x-clip">
      <div className="flex flex-col gap-2 pt-6">
        <Separator />
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-medium text-foreground truncate min-w-0">{title}</h2>
          {overflowing && (
            <div className="flex items-center gap-1 shrink-0">
              {onShowAll && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onShowAll}
                  className="@max-[559px]:!bg-secondary @max-[559px]:!text-secondary-foreground @max-[559px]:hover:!bg-secondary-hover"
                >
                  Show all
                </Button>
              )}
              {/* ◀ ▶ are a pointer affordance only — hidden on touch
                   (`hover:none`) and below 692px, where the swipe peek
                   (a cut-off next column) is the scroll cue instead. */}
              <div className="flex items-center gap-1 [@media(hover:none)]:!hidden @max-[692px]:hidden">
                <Button variant="outline" size="icon-sm" aria-label={`Scroll ${title} left`} onClick={() => scrollPage(-1)}><ChevronLeft /></Button>
                <Button variant="outline" size="icon-sm" aria-label={`Scroll ${title} right`} onClick={() => scrollPage(1)}><ChevronRight /></Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ul
        ref={scrollRef}
        className={
          "min-w-0 flex gap-6 items-start overflow-x-auto overflow-y-hidden " +
          "snap-x snap-proximity scroll-smooth touch-pan-x overscroll-x-contain " +
          "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden " +
          "[&>li]:shrink-0 [&>li]:snap-start " +
          // Mobile (< 692): single column undersized by 48px so ~24px of the
          // next column peeks (swipe cue; gap is 24px). From 692 up: exact
          // columns, arrows carry the scroll affordance.
          "[&>li]:w-[calc(100%-48px)] " +
          "@min-[692px]:[&>li]:w-[calc((100%-24px)/2)] " +
          "@min-[1164px]:[&>li]:w-[calc((100%-48px)/3)]"
        }
      >
        {columns.map((col, i) => (
          <li key={i}>
            <ul className="flex flex-col gap-1">
              {col.map((node, j) => <li key={j}>{node}</li>)}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  )
}
