"use client"

/*
 * ChromeSchematic — the page chrome drawn around a demo frame.
 *
 * Every width picker in this design system is a WINDOW width, and a window is
 * not what a component gets: the sidebar and the page gutter take their share
 * first. Drawing them means the reader never has to take that on faith, and it
 * makes the one genuinely confusing step legible —
 *
 *     584px window → no sidebar, 24px gutters → 536px of content
 *     608px window → 52px icon rail appears  → 508px of content
 *
 * — the window grew by 24px and the content LOST 28. Without the rail in the
 * picture that reads as a bug. With it, it reads as what it is: the icon rail
 * arrives at 608 and costs more than the extra width gives back.
 *
 * The chrome is DRAWN, not rendered. `useIsMobile()` / `useFooterNav()` read
 * the real browser, so a real `Sidebar` dropped in here would show the state
 * of the window you are sitting at rather than the one on the chip. Widths
 * come from `sidebarAt()` / `gutterAt()`, which are pure functions of the
 * chosen width — and everything is muted on purpose, because this is the thing
 * taking space away, not the subject.
 */

import { cn } from "@/lib/utils"
import { SIDEBAR_FULL } from "@/lib/breakpoints"

/** The 45° hatch that marks a gutter — `--color-border`, as everywhere else. */
export const HATCH: React.CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(45deg, var(--color-border) 0 1px, transparent 1px 6px)",
}

export function ChromeSidebar({ width, className }: { width: number; className?: string }) {
  const full = width === SIDEBAR_FULL
  return (
    <div
      aria-hidden
      className={cn("shrink-0 self-stretch border-r border-border bg-foreground/[0.04] py-4", className)}
      style={{ width }}
    >
      <div className={cn("flex flex-col gap-3", full ? "px-3" : "items-center px-2")}>
        {[0, 1, 2, 3].map(i => (
          <span key={i} className="flex items-center gap-2">
            <span className="size-4 shrink-0 rounded-xs bg-muted-foreground/25" />
            {full && (
              <span
                className="h-2 flex-1 rounded-full bg-muted-foreground/20"
                style={{ maxWidth: 70 + i * 12 }}
              />
            )}
          </span>
        ))}
      </div>
    </div>
  )
}

/** The gutter, at its real width. Hatched rather than blank so it reads as
 *  "reserved", not as "the component stops here". */
export function ChromeGutter({ width }: { width: number }) {
  return <span aria-hidden className="shrink-0 self-stretch opacity-70" style={{ ...HATCH, width }} />
}

/** The third chrome state costs HEIGHT, not width — so it is drawn where it
 *  actually sits. Without it, "no sidebar" would look like "no chrome". */
export function ChromeTabBar() {
  return (
    <div
      aria-hidden
      className="flex h-11 shrink-0 items-center justify-around border-t border-border bg-foreground/[0.04] px-6"
    >
      {[0, 1, 2, 3].map(i => <span key={i} className="size-4 rounded-xs bg-muted-foreground/25" />)}
    </div>
  )
}
