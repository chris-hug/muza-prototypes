"use client"

import { createContext, useContext, useEffect, useState } from "react"

/*
 * WindowWidthContext — lets the design system's demo frame STAND IN for the
 * window. A chip labelled "window 375" promises a phone, and the components
 * inside must keep that promise for presentation too (dropdown ⇄ sheet,
 * dialog ⇄ sheet), not only for the column they measure. With a value here,
 * the three gate hooks below read it instead of the real browser; with
 * `null` (the app, and the frame in "free" mode) they read `matchMedia`.
 *
 * Only the GATES are overridden. The sheet a component then opens is still
 * portaled to the real window, so on the design-system page it appears at
 * the bottom of the browser, full width — the presentation is the phone's,
 * the geometry is yours.
 */
export const WindowWidthContext = createContext<number | null>(null)

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

/**
 * True on a TOUCH pointer — the input gate, not a width gate.
 *
 * Width says how much room there is; this says what is doing the pointing,
 * and they are different questions. A 24px-tall line of text is a fine link
 * under a mouse cursor and a coin toss under a thumb, at any window width.
 *
 * Deliberately NOT overridden by `WindowWidthContext`: the design system's
 * "window 375" frame is still being read with a mouse, and a demo that hid
 * its links there would be lying about the machine it is running on.
 */
export function useCoarsePointer(): boolean {
  return useMediaQuery("(pointer: coarse)")
}

/** The PRESENTATION gate: true below 768 — sheets instead of dialogs and
 *  dropdowns, no docked editor. The same gate as Tailwind's `md:`. */
export function useIsMobile(): boolean {
  const override = useContext(WindowWidthContext)
  const real = useMediaQuery("(max-width: 767px)")
  return override != null ? override < 768 : real
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
  const override = useContext(WindowWidthContext)
  const real = useMediaQuery(`(max-width: ${SIDEBAR_COLLAPSE_BELOW - 1}px)`)
  return override != null ? override < SIDEBAR_COLLAPSE_BELOW : real
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

/** The CHROME gate: true when the mobile footer tab bar should replace the
 *  sidebar (and the mobile header the Topbar, the mini player the bar). */
export function useFooterNav(): boolean {
  const override = useContext(WindowWidthContext)
  const real = useMediaQuery(`(max-width: ${FOOTER_NAV_BELOW - 1}px)`)
  return override != null ? override < FOOTER_NAV_BELOW : real
}
