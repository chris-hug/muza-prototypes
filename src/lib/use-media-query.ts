"use client"

import { useEffect, useState } from "react"

/**
 * Subscribe to a CSS media query. Returns `true` when the query matches.
 *
 * The app's WINDOW gates live below (see `breakpoints.ts` for the vocabulary):
 *   608  chrome        — `useFooterNav()`   tab bar ⇄ rail, mobile header, mini player
 *   768  presentation  — `useIsMobile()`    sheets ⇄ dialogs; == Tailwind `md:` in CSS
 *  1069  sidebar       — `useSidebarAutoCollapsed()`
 * Tailwind's `sm` (640) and `lg` (1024) gate in-page content reflow only.
 *
 * SSR-safe: returns `false` until the first `useEffect` runs.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = () => setMatches(mql.matches)
    handler()
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [query])
  return matches
}

/** Convenience: true on viewports < 768px. */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)")
}

/**
 * Sidebar auto-collapse breakpoint — synced to the MediaHeader's
 * breakpoints rather than a generic "mobile" cutoff.
 *
 * The detail-page MediaHeader is a container query measured on the
 * content area. With the sidebar expanded, that container width is:
 *
 *   viewport − 208 (sidebar) − 80 (content px-10 ×2) − 1 (border)
 *
 * The MediaHeader shows its richest layout — the full Add/Share/Info/⋯
 * icon cluster — at container ≥ 780. Keeping the 208px sidebar expanded
 * pushes the header out of that tier once the viewport drops below
 * 780 + 208 + 80 + 1 = 1069. Collapsing to 52px at that exact point
 * reclaims ~156px and keeps the header in its full tier as long as it
 * physically fits (down to ~913px, where even a collapsed sidebar
 * can't hold 780). Below that the header degrades to compact → stacked
 * on its own, in lockstep with everything else on the page.
 *
 * SIDEBAR_FULL_HEADER must match the `@min-[780px]` cluster threshold
 * in media-header.tsx (Tailwind variants can't read this constant).
 */
const SIDEBAR_FULL_HEADER = 780   // MediaHeader full-cluster container
const SIDEBAR_EXPANDED_W  = 208   // MIN_W in sidebar.tsx
const CONTENT_PADDING_X   = 80    // detail view px-10 × 2
const SIDEBAR_BORDER      = 1
export const SIDEBAR_COLLAPSE_BELOW =
  SIDEBAR_FULL_HEADER + SIDEBAR_EXPANDED_W + CONTENT_PADDING_X + SIDEBAR_BORDER // 1069

/**
 * True when the viewport is narrow enough that the sidebar should
 * auto-collapse to icons (see `SIDEBAR_COLLAPSE_BELOW`). Hosts mirror
 * this into their collapsed state so "auto wins on resize" — crossing
 * the threshold re-applies the auto state, while a manual toggle is
 * respected until the next crossing.
 */
export function useSidebarAutoCollapsed(): boolean {
  return useMediaQuery(`(max-width: ${SIDEBAR_COLLAPSE_BELOW - 1}px)`)
}

/**
 * Below this viewport the sidebar is dropped entirely in favour of a
 * mobile bottom tab bar (FooterNav).
 *
 * Derived from the MediaHeader's stacking point: BELOW this width there is
 * no sidebar, so the content container is exactly `viewport − 2 × gutter`,
 * and 560 + 2 × 24 is the last viewport at which that container is still
 * under the header's 560 stack threshold.
 *
 *   560 (header stack) + 2 × 24 (gutter) = 608
 *
 * The two do NOT flip together, and the arithmetic above is easy to
 * misread as saying they do: at 608 the icon rail appears in the same
 * instant, and it costs 52px. So the container goes 559 → 508 across the
 * break — it gets NARROWER as the page gets wider — and the MediaHeader
 * stays stacked (and rails stay in swipe-peek) until viewport 660, where
 * 660 − 52 − 48 finally reaches 560. See `ResponsiveLab`, which draws
 * exactly this and counts the widths where the container loses ground.
 *
 * MEDIA_HEADER_STACK must match the `@min-[560px]` flip in
 * media-header.tsx (Tailwind variants can't read this constant).
 */
const MEDIA_HEADER_STACK = 560  // MediaHeader stacked→horizontal container
const PAGE_GUTTER_AT_STACK = 24 // --page-px in the 584–1068 range
export const FOOTER_NAV_BELOW = MEDIA_HEADER_STACK + 2 * PAGE_GUTTER_AT_STACK // 608

/** True when the mobile footer tab bar should replace the sidebar. */
export function useFooterNav(): boolean {
  return useMediaQuery(`(max-width: ${FOOTER_NAV_BELOW - 1}px)`)
}
