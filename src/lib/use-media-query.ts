"use client"

import { useEffect, useState } from "react"

/**
 * Subscribe to a CSS media query. Returns `true` when the query matches.
 *
 * Common breakpoints (Tailwind defaults):
 *   sm  640
 *   md  768   ← typical "is mobile" cutoff: `useMediaQuery("(max-width: 767px)")`
 *   lg  1024
 *   xl  1280
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
