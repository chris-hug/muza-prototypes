/*
 * breakpoints — the page's ladders, in ONE place.
 *
 * Muza measures width in THREE ways, and confusing them is the mistake this
 * file exists to prevent. The prose vocabulary is window / column / box; the
 * identifiers below keep their older names (VIEWPORTS, containerAt) and this
 * comment maps them:
 *
 *   · WINDOW (`VIEWPORTS`, `useIsMobile()`, `useFooterNav()`) decides the
 *     page chrome — sidebar, icon rail, tab bar, gutter — and how a thing is
 *     PRESENTED (sheet or dialog, the docked editor). Two gates, each with a
 *     job: 608 = chrome (`FOOTER_NAV_BELOW`), 768 = presentation
 *     (`useIsMobile()`, Tailwind `md:`). It is read from the real browser, so
 *     nothing on a page can fake it.
 *   · COLUMN (`containerAt()`, `COLUMN_STEPS`) is what the window leaves —
 *     and it is NOT a function of the window: the wrapper cap and the docked
 *     editor both take from it. It decides how many fit, and it is what a
 *     `@container` query on the page shell reads.
 *   · BOX is a component's own width, measured by a NAMED container on the
 *     component itself. Allowed only where the same window can hand the
 *     component two different widths — `SongListItem` (a rail cell vs a list,
 *     `ROW_STEPS`), `PlayerBar` (640 / 688 / 800), `PlayerOverlay` (380), the
 *     paywall split (760). Their steps live with the component, not here.
 *
 * Both ladders were written out separately in three places — the responsive
 * diagram, the demo frame's chips and the schematic — and drifted. Everything
 * now derives from here.
 *
 * The copies that CANNOT live here are the Tailwind ones: `@min-[304px]` is a
 * class name, and Tailwind cannot read a TypeScript constant. `app.css` and
 * `card-rail.tsx` / `song-rail.tsx` carry the column ladder that way, and
 * `song-list-item.tsx` carries its own steps (mirrored beside them as
 * `ROW_STEPS`, so the design system can offer chips at them). Those files and
 * this one are the only places a ladder number may appear. Steps are written
 * `@min-[N]` / `@max-[N]` — Tailwind v4's `@max-[N]` is `width < N`, so the
 * pair shares one number.
 */

import { FOOTER_NAV_BELOW, SIDEBAR_COLLAPSE_BELOW } from "@/lib/use-media-query"

/* ── container ──────────────────────────────────────────────────────────── */

/** Column ladder — container width → column count (`.grid-cards`, CardRail). */
export const COLUMN_STEPS = [
  { px: 304,  cols: 2 },
  { px: 464,  cols: 3 },
  { px: 692,  cols: 4 },
  { px: 928,  cols: 5 },
  { px: 1164, cols: 6 },
  { px: 1500, cols: 7 },
] as const

/** Column gap inside a grid or rail — NOT the page gutter. */
export const COLUMN_GAP = 16

/** Below this container width the MediaHeader stacks and rails switch to
 *  swipe-peek. `MEDIA_HEADER_STACK` in `use-media-query.ts` — the viewport
 *  steps at 584 and 608 are this number plus a gutter. */
export const STACK = 560

/** The auto-fill floor the grid falls back to below the first step. */
export const GRID_MIN = 128

export function colsAt(container: number): number {
  let n = Math.max(1, Math.floor((container + COLUMN_GAP) / (GRID_MIN + COLUMN_GAP)))
  for (const s of COLUMN_STEPS) if (container >= s.px) n = s.cols
  return n
}

/* ── viewport ───────────────────────────────────────────────────────────── */

/** The expanded sidebar's width — but only its FLOOR: the user can drag it to
 *  291 (`MAX_W` in `sidebar.tsx`, which owns that number). Pass the real width
 *  to `containerAt` when it matters. */
export const SIDEBAR_FULL = 208
export const SIDEBAR_RAIL = 52

/** The page wrapper's own ceiling — `max-w-[1480px] min-[1920px]:max-w-[1716px]`
 *  on every page shell. Without it the content column would keep growing with
 *  the monitor; with it, a wide screen adds empty margin instead. */
export const CONTENT_CAP = 1480
export const CONTENT_CAP_WIDE = 1716
export const CONTENT_CAP_WIDE_FROM = 1920

/** The docked playlist editor — `hidden md:flex`, `w-[30%] min-w-[374px]
 *  max-w-[550px]`, draggable within `[374, min(900, 60% of the window)]`
 *  (`playlist-edit-drawer.tsx`, `use-resizable-width.ts`). It is a flex
 *  SIBLING of `<main>`, so it takes its width off the content column. */
export const DRAWER_FROM = 768
export const DRAWER_MIN = 374
export const DRAWER_DEFAULT_MAX = 550
export const DRAWER_DRAG_MAX = 900

/** `--page-px` in `app.css`. */
export function gutterAt(viewport: number): 12 | 24 | 40 {
  return viewport >= SIDEBAR_COLLAPSE_BELOW ? 40 : viewport >= 584 ? 24 : 12
}

/** 0 = the footer tab bar has taken over. */
export function sidebarAt(viewport: number): number {
  return viewport >= SIDEBAR_COLLAPSE_BELOW ? SIDEBAR_FULL
    : viewport >= FOOTER_NAV_BELOW ? SIDEBAR_RAIL
    : 0
}

export function contentCapAt(viewport: number): number {
  return viewport >= CONTENT_CAP_WIDE_FROM ? CONTENT_CAP_WIDE : CONTENT_CAP
}

/** The drawer's width at a given window, 0 when it is closed or too narrow
 *  to exist. `custom` is a width the user has dragged to. */
export function drawerAt(viewport: number, custom?: number): number {
  if (viewport < DRAWER_FROM) return 0
  if (custom != null) {
    return Math.round(Math.min(Math.max(custom, DRAWER_MIN), Math.min(DRAWER_DRAG_MAX, viewport * 0.6)))
  }
  return Math.round(Math.min(Math.max(viewport * 0.3, DRAWER_MIN), DRAWER_DEFAULT_MAX))
}

/**
 * What a page's content area — and so a grid's container — actually gets.
 *
 * This is NOT `viewport − sidebar − 2 × gutter`, which is what it said for a
 * long time and what the responsive drawing believed. Two things break that:
 *
 *   · the wrapper is capped (`contentCapAt`), so from a 1688px window up the
 *     column stops growing — the old formula was 231px too generous at 1919;
 *   · the docked playlist editor takes its width off the column, so with it
 *     open the column is NOT A FUNCTION OF THE WINDOW AT ALL. At a 768px
 *     window it is 294px — phone-sized content on a tablet-sized screen.
 *
 * Pass what is actually on screen rather than assuming the defaults.
 */
export function containerAt(
  viewport: number,
  opts: { sidebar?: number; drawer?: number } = {},
): number {
  const sidebar = opts.sidebar ?? sidebarAt(viewport)
  const drawer = opts.drawer ?? 0
  const available = viewport - sidebar - drawer
  return Math.min(available, contentCapAt(viewport)) - 2 * gutterAt(viewport)
}

/**
 * The viewport widths worth looking at. Real devices plus every width where
 * the chrome changes; the last two exist because the ladder's top steps are
 * otherwise unreachable (6 columns needs a 1164 container, 7 needs 1500 —
 * with the sidebar and gutter that is a 1452 viewport for 6; 7 is only reachable
 * from 1920, because the 1480 wrapper cap holds the column at 1400 below that).
 */
export const VIEWPORTS = [
  { px: 320,  name: "Phone small", where: "—",
    note: "iPhone SE / mini in Display Zoom — the narrowest supported" },
  { px: 375,  name: "Phone", where: "—",
    note: "iPhone 12 mini — the reference phone. Nothing switches here" },
  { px: 584,  name: "Phone wide", where: "app.css",
    note: "page gutter --page-px steps 12 → 24px — a spacing step, not a mode" },
  { px: FOOTER_NAV_BELOW, name: "Tablet", where: "FOOTER_NAV_BELOW",
    note: "chrome gate — icon rail replaces the tab bar; Topbar replaces MobileAppHeader; mini player becomes the desktop bar" },
  { px: 768,  name: "Tablet wide", where: "useIsMobile()",
    note: "presentation gate — useIsMobile() and md: flip together: sheets ⇄ dialogs and dropdowns, toast placement; the docked editor starts to exist" },
  { px: SIDEBAR_COLLAPSE_BELOW, name: "Desktop", where: "SIDEBAR_COLLAPSE_BELOW",
    note: "sidebar expands from the icon rail; gutter 24 → 40px" },
  { px: 1440, name: "Laptop", where: "—", note: "a typical laptop — nothing switches" },
  { px: 1512, name: "MacBook Pro 14", where: "—", note: "nothing switches" },
  { px: 1920, name: "Wide", where: "—",
    note: "wide monitor — the only width that reaches 7 columns" },
] as const

/** The reference phone as a COLUMN width — derived, never typed twice. */
export const PHONE_CONTAINER = containerAt(375)
