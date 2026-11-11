"use client"

/*
 * useLibraryView — how the library pages show their items, as a single
 * app-wide choice: remembered between visits (localStorage) and shared
 * across pages, so "I prefer tables" applies once rather than
 * per-page-per-session.
 *
 * Three forms, and each page offers the ones that fit its items:
 *   grid  — cards (Albums, Playlists, Artists, All)
 *   list  — a stack of rows: cover, title, the line under it (Albums, Songs)
 *   table — the sortable columns (every page, desktop only)
 * A page that does not offer the stored form shows its nearest one
 * (list ↔ table, grid → table) without overwriting the choice, so picking
 * "list" on Songs does not cost Playlists its table, and Albums still opens
 * in list next time.
 *
 * Below the footer-nav breakpoint the table does not fit; the phone has no
 * table option and a stored "table" shows as a list.
 *
 * The key changed with the third form: the old "list" value meant the
 * table, and reading it under the new names would have turned everyone's
 * table into rows. The old value migrates once (list → table).
 */

import { useEffect, useState } from "react"
import { useFooterNav } from "@/lib/use-media-query"

export type LibraryView = "grid" | "list" | "table"

const KEY = "muza:library-view-v2"
const OLD_KEY = "muza:library-view"
const VIEWS: LibraryView[] = ["grid", "list", "table"]
const isView = (v: unknown): v is LibraryView => VIEWS.includes(v as LibraryView)

function read(): LibraryView {
  if (typeof window === "undefined") return "grid"
  try {
    const v = window.localStorage.getItem(KEY)
    if (isView(v)) return v
    return window.localStorage.getItem(OLD_KEY) === "list" ? "table" : "grid"
  } catch { return "grid" }
}

/** The form a page shows for the stored choice. */
function resolve(stored: LibraryView, offered: LibraryView[]): LibraryView {
  if (offered.includes(stored)) return stored
  const near: Record<LibraryView, LibraryView[]> = {
    grid:  ["table", "list"],
    list:  ["table", "grid"],
    table: ["list", "grid"],
  }
  return near[stored].find(v => offered.includes(v)) ?? offered[0]
}

export function useLibraryView(
  offered: LibraryView[] = ["grid", "table"],
): [LibraryView, (v: LibraryView) => void, LibraryView[]] {
  const footerNav = useFooterNav()
  const [stored, setStored] = useState<LibraryView>(read)

  useEffect(() => {
    try { window.localStorage.setItem(KEY, stored) } catch { /* private mode */ }
  }, [stored])

  // Keep multiple library pages (and tabs) in sync if one changes it.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && isView(e.newValue)) setStored(e.newValue)
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  // Phone: no table. A page that offered only grid + table offers grid +
  // list there, since its table already falls back to rows on a phone.
  const here = footerNav
    ? [...new Set(offered.map(v => (v === "table" ? "list" : v)))]
    : offered
  return [resolve(stored, here), setStored, here]
}
