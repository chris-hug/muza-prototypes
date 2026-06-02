"use client"

/*
 * useSearchNav — the one place that turns a typed query into navigation.
 * The query lives in the URL (`?page=Explore&q=…`) so the Explore page
 * body and every search field stay in sync and the result is shareable.
 */

import { useCallback } from "react"
import { useSearchParams } from "react-router"
import { pushRecentSearch } from "@/lib/search-catalog"

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

  const clear = useCallback(() => {
    setParams(prev => {
      const next = new URLSearchParams(prev)
      next.delete("q")
      return next
    }, { replace: true })
  }, [setParams])

  return { query, scope, setScope, submit, clear }
}
