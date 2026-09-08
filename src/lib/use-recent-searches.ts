"use client"

/*
 * useRecentSearches — the last few queries a user actually ran, newest first.
 *
 * Kept in `localStorage` rather than component state: the Find screen is
 * inside a dialog that unmounts on close, and a list that empties every time
 * the sheet is dismissed would never be worth showing.
 *
 * A query is only recorded when it was COMMITTED (Enter, or a result acted
 * on) — recording every keystroke would fill the list with "b", "bl", "blu".
 */

import { useCallback, useState } from "react"

const KEY = "muza:recent-searches"
const MAX = 8

function read(): string[] {
  // Guarded: this module is imported during SSR/prerender too, where there
  // is no storage, and a private-mode browser can throw on access.
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list.filter((s): s is string => typeof s === "string") : []
  } catch {
    return []
  }
}

function write(list: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* Full or blocked storage is not worth failing a search over. */
  }
}

export function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>(read)

  /** Move `q` to the front, case-insensitively deduped, capped at MAX. */
  const remember = useCallback((q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    setRecent(prev => {
      const next = [trimmed, ...prev.filter(p => p.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX)
      write(next)
      return next
    })
  }, [])

  const forget = useCallback((q: string) => {
    setRecent(prev => {
      const next = prev.filter(p => p !== q)
      write(next)
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setRecent([])
    write([])
  }, [])

  return { recent, remember, forget, clear }
}
