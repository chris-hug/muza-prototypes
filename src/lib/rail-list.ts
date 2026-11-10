"use client"

/*
 * Rail lists: the full list behind a CardRail's "Show all".
 *
 * Whenever a rail holds more than fits, every item has to be reachable as a
 * plain list, on the model of Artist › Top Songs › Show all. A page per rail
 * would be a dozen near-identical routes, so there is one route
 * (`?page=RailList&list=<key>`) and the rail hands over what it already has.
 *
 * The key is in the URL because lists nest: list A → an artist → list B →
 * back, back must land on A rather than on whichever list was opened last.
 * sessionStorage keeps a reload working; a mock catalog has no id to fetch a
 * list by, and a real one would make this a request.
 */

import { useCallback } from "react"
import { useSearchParams } from "react-router"

import { libraryIdForTitle } from "@/lib/album-meta"
import { slugify } from "@/lib/media-nav"
import type { SearchResult } from "@/lib/search-catalog"

export interface RailList {
  title: string
  subtitle?: string
  items: SearchResult[]
}

const STORAGE_KEY = "muza:rail-lists"
const lists: Record<string, RailList> = {}

function readStored(): Record<string, RailList> {
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}") } catch { return {} }
}

export function getRailList(key?: string | null): RailList | undefined {
  if (!key) return undefined
  return lists[key] ?? (typeof window === "undefined" ? undefined : readStored()[key])
}

export function storeRailList(list: RailList): string {
  const key = slugify([list.title, list.subtitle].filter(Boolean).join(" "))
  lists[key] = list
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readStored(), [key]: list })) } catch { /* private mode: the in-memory copy still works */ }
  return key
}

export function useOpenRailList() {
  const [, setParams] = useSearchParams()
  return useCallback((list: RailList) => {
    const key = storeRailList(list)
    setParams(prev => {
      const next = new URLSearchParams(prev)
      next.set("page", "RailList")
      next.set("list", key)
      return next
    }, { replace: true })
  }, [setParams])
}

export const railAlbum = (a: { title: string; cover?: string; artist: string; year?: number | string }): SearchResult => ({
  id: `album-${slugify(a.title)}`,
  kind: "album",
  title: a.title,
  cover: a.cover,
  subtitle: a.artist,
  meta: a.year ? String(a.year) : undefined,
  navKey: slugify(a.title),
  libraryType: "album",
  libraryId: libraryIdForTitle(a.title) ?? slugify(a.title),
})

export const railPlaylist = (p: { title: string; covers?: readonly string[]; songCount: number; owner?: string; owned?: boolean }): SearchResult => ({
  id: `playlist-${slugify(p.title)}`,
  kind: "playlist",
  title: p.title,
  covers: p.covers ? [...p.covers] : undefined,
  cover: p.covers?.[0],
  subtitle: p.owned ? "You" : p.owner,
  meta: `${p.songCount} Songs`,
  navKey: slugify(p.title),
  libraryType: "playlist",
  libraryId: slugify(p.title),
})

export const railArtist = (a: { name: string; image?: string }): SearchResult => ({
  id: `artist-${slugify(a.name)}`,
  kind: "artist",
  title: a.name,
  cover: a.image,
  navKey: slugify(a.name),
  libraryType: "artist",
  libraryId: slugify(a.name),
})
