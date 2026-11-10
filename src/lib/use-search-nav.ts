"use client"

/*
 * useSearchNav — the one place that turns a typed query into navigation.
 * The query lives in the URL (`?page=Explore&q=…`) so the Explore page
 * body and every search field stay in sync and the result is shareable.
 */

import { useCallback } from "react"
import { useSearchParams } from "react-router"
import { storeRailList } from "@/lib/rail-list"
import { pushRecentSearch, type SearchResult } from "@/lib/search-catalog"

export type SearchScope = "catalog" | "library"

export function useSearchNav() {
  const [params, setParams] = useSearchParams()
  const query = params.get("q") ?? ""
  const scope: SearchScope = params.get("scope") === "library" ? "library" : "catalog"

  // Scope lives in the URL too, so the mobile header's switcher and the
  // results body stay in sync (and the result is shareable). Default
  // (catalog) drops the param to keep URLs clean.
  const setScope = useCallback((s: SearchScope) => {
    setParams(prev => {
      const next = new URLSearchParams(prev)
      if (s === "catalog") next.delete("scope")
      else next.set("scope", s)
      return next
    }, { replace: true })
  }, [setParams])

  const submit = useCallback((q: string) => {
    const v = q.trim()
    if (!v) return
    pushRecentSearch(v)
    setParams(prev => {
      const next = new URLSearchParams(prev)
      next.set("page", "Explore")
      next.set("q", v)
      return next
    })
  }, [setParams])

  // A rail's way into search: the query filled in and one category open,
  // e.g. "Playlists with Nubya Garcia". The rail hands over its items because
  // the index cannot answer this: every mock playlist draws on the same ten
  // tracks, so matching by artist found all 60 or, for an artist outside the
  // pool, none. `from` gives Explore a back chevron for this one visit. Not
  // added to recents, nobody typed it.
  const openSearch = useCallback((q: string, type: string, items: SearchResult[]) => {
    const list = storeRailList({ title: q, subtitle: type, items })
    setParams(new URLSearchParams({ page: "Explore", q, type, list, from: "rail" }), { replace: true })
  }, [setParams])

  const clear = useCallback(() => {
    setParams(prev => {
      const next = new URLSearchParams(prev)
      // The rail's visit ends with its query, or the next search would open
      // on its category with a chevron back to a page long since left.
      for (const key of ["q", "type", "list", "from"]) next.delete(key)
      return next
    }, { replace: true })
  }, [setParams])

  return { query, scope, setScope, submit, clear, openSearch }
}
