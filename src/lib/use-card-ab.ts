"use client"

/*
 * Card-text A/B — a tiny sticky bucket for the stakeholder A/B test on the
 * home page. Each browser lands on one variant (random, then remembered);
 * a visible toggle lets stakeholders flip to compare, and `?cards=a|b`
 * forces a variant for sharing a specific version.
 *
 *   A = original treatment (18px title / 15px meta, normal weight)
 *   B = the refined "Alt C" (uniform 17px, light meta, tighter rhythm,
 *       a hair of letter-spacing) → AlbumCard/PlaylistCard `textVariant="xs17t"`
 */

import { useSyncExternalStore } from "react"

export type CardAb = "a" | "b"

/** Map the bucket to the card components' `textVariant`. */
export const cardAbVariant = (ab: CardAb) => (ab === "b" ? "xs17t" : "default")

const KEY = "muza:cards-ab"
let value: CardAb | null = null
const listeners = new Set<() => void>()

function read(): CardAb {
  if (value) return value
  if (typeof window === "undefined") return (value = "a")
  try {
    // URL override wins and pins the choice.
    const q = new URLSearchParams(window.location.search).get("cards")
    if (q === "a" || q === "b") { value = q; window.localStorage.setItem(KEY, q); return value }
    const stored = window.localStorage.getItem(KEY)
    if (stored === "a" || stored === "b") return (value = stored)
    value = Math.random() < 0.5 ? "a" : "b"   // assign + remember
    window.localStorage.setItem(KEY, value)
  } catch {
    value = "a"
  }
  return value
}

export function setCardAb(next: CardAb) {
  value = next
  try { window.localStorage.setItem(KEY, next) } catch { /* noop */ }
  listeners.forEach(fn => fn())
}

export function useCardAb(): CardAb {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb) },
    read,
    () => "a",
  )
}
