"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ContentTypeBadge, StatusBadge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ChipDismiss } from "@/components/ui/chip"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { TableHead } from "@/components/ui/table"
import { filterTriggerCls, FilterChevron, FilterCount } from "@/components/ui/filter-button"
import {
  ArrowDown, ArrowUp, ArrowUpDown, Settings2, ChevronDown,
  Download, Pencil, Play, Search, Upload, X,
} from "lucide-react"
import { UploadMusicDialog } from "@/components/app/upload-music-dialog"

// ─── Types ─────────────────────────────────────────────────────────────────────

type ContentType  = "album" | "single" | "ep"
type ReleaseStatus = "public" | "private"
type SortKey      = "id" | "title" | "artist" | "band" | "year" | "tracks" | "uploaded" | "label"
type SortDir      = "asc" | "desc"
type ColKey       = "id" | "cover" | "title" | "artist" | "band" | "year" | "tracks" | "uploaded" | "type" | "state" | "label" | "monetisation"

interface Release {
  id:      string
  catalog: string
  cover:   string
  title:   string
  artist:  string
  band?:   string
  year:    number
  tracks:  number
  type:    ContentType
  status:  ReleaseStatus
}

// ─── Column configuration ──────────────────────────────────────────────────────

const DEFAULT_WIDTHS: Record<ColKey, number> = {
  id: 64, cover: 44, title: 200, artist: 100, band: 100,
  year: 44, tracks: 68, uploaded: 88, type: 72, state: 88,
  label: 96, monetisation: 148,
}

const MIN_WIDTHS: Record<ColKey, number> = {
  id: 48, cover: 44, title: 140, artist: 72, band: 72,
  year: 32, tracks: 60, uploaded: 72, type: 56, state: 80,
  label: 72, monetisation: 96,
}

const COL_DEFS: { key: ColKey; label: string; required?: boolean }[] = [
  { key: "id",          label: "ID" },
  { key: "cover",       label: "Cover" },
  { key: "title",       label: "Title",       required: true },
  { key: "artist",      label: "Artist" },
  { key: "band",        label: "Band" },
  { key: "year",        label: "Year" },
  { key: "tracks",      label: "Tracks" },
  { key: "label",       label: "Label" },
  { key: "uploaded",    label: "Uploaded" },
  { key: "type",        label: "Type" },
  { key: "state",       label: "State",       required: true },
  { key: "monetisation",label: "Monetisation", required: true },
]

// When the table container shrinks below this width, cover auto-hides
const COVER_HIDE_THRESHOLD = 800

// ─── Sort & upload date helpers ───────────────────────────────────────────────

/** Deterministic fake upload date derived from release id.
 *  id 47 = today (10 Apr 2026), spread ~12 days apart going backwards. */
function mockUploadDate(id: string): string {
  const n = parseInt(id, 10)
  const today = new Date(2026, 3, 10) // Apr 10 2026
  today.setDate(today.getDate() - (47 - n) * 12)
  return today.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })
}

/** Derive record label name from catalog prefix */
function mockLabel(catalog: string): string {
  if (catalog.startsWith("COL")) return "Columbia"
  if (catalog.startsWith("BN"))  return "Blue Note"
  if (catalog.startsWith("IMP")) return "Impulse!"
  if (catalog.startsWith("PR"))  return "Prestige"
  if (catalog.startsWith("RLP") || catalog.startsWith("RVG")) return "Riverside"
  if (catalog.startsWith("VER")) return "Verve"
  if (catalog.startsWith("ATL")) return "Atlantic"
  if (catalog.startsWith("CAN")) return "Candid"
  if (catalog.startsWith("TRK")) return "ECM"
  return "Independent"
}

type PriceType = "fixed" | "min"
type PricePoint = { priceType: PriceType; price: number }

type MonetisationState =
  | { kind: "streaming" }
  | { kind: "purchase";          purchase: PricePoint }
  | { kind: "purchase+download"; purchase: PricePoint; download: PricePoint }

/** Derive monetisation state from id — every release always has a plan */
function mockMonetisation(id: string, _status?: ReleaseStatus): MonetisationState {
  const n = parseInt(id, 10)
  if (n % 7 === 0) return { kind: "streaming" }
  const purchaseType: PriceType = n % 5 === 0 ? "min" : "fixed"
  const purchase: PricePoint = { priceType: purchaseType, price: 8.50 }
  if (n % 2 === 0) {
    const downloadType: PriceType = n % 4 === 0 ? "min" : "fixed"
    return { kind: "purchase+download", purchase, download: { priceType: downloadType, price: 10.50 } }
  }
  return { kind: "purchase", purchase }
}

function PriceTag({ point, icon }: { point: PricePoint; icon?: React.ReactNode }) {
  return (
    <span className="flex items-center gap-0.5 tabular-nums">
      {point.priceType === "min" && <span className="opacity-50">≥</span>}
      <span>${point.price.toFixed(2)}</span>
      {icon && <span className="opacity-40">{icon}</span>}
    </span>
  )
}

function MonetisationCell({ state, dimmed }: { state: MonetisationState; dimmed?: boolean }) {
  const cls = cn("text-xs", dimmed ? "text-muted-foreground/50" : "text-muted-foreground")
  if (state.kind === "streaming") {
    return <span className={cls}>Streaming</span>
  }
  if (state.kind === "purchase") {
    return <span className={cls}><PriceTag point={state.purchase} /></span>
  }
  // purchase+download
  return (
    <span className={cn("flex items-center gap-1.5 text-xs", dimmed ? "text-muted-foreground/50" : "text-muted-foreground")}>
      <PriceTag point={state.purchase} />
      <span className="opacity-30">·</span>
      <PriceTag point={state.download} icon={<Download className="size-3 shrink-0" />} />
    </span>
  )
}

function sortReleases(releases: Release[], key: SortKey, dir: SortDir): Release[] {
  return [...releases].sort((a, b) => {
    let cmp = 0
    switch (key) {
      case "id":       cmp = a.catalog.localeCompare(b.catalog); break
      case "title":    cmp = a.title.localeCompare(b.title); break
      case "artist":   cmp = a.artist.localeCompare(b.artist); break
      case "band":     cmp = (a.band ?? "").localeCompare(b.band ?? ""); break
      case "year":     cmp = a.year - b.year; break
      case "tracks":   cmp = a.tracks - b.tracks; break
      case "uploaded": cmp = parseInt(a.id) - parseInt(b.id); break
      case "label":    cmp = mockLabel(a.catalog).localeCompare(mockLabel(b.catalog)); break
    }
    return dir === "desc" ? -cmp : cmp
  })
}

/** Which ColKey maps to which SortKey (only sortable columns) */
const COL_SORT_KEY: Partial<Record<ColKey, SortKey>> = {
  id: "id", title: "title", artist: "artist",
  band: "band", year: "year", tracks: "tracks", uploaded: "uploaded", label: "label",
}

// ─── Jazz mock data (30 releases) ─────────────────────────────────────────────

const RELEASES: Release[] = [
  { id: "1",  catalog: "COL8163",  cover: "https://picsum.photos/seed/kob59/44/44",     title: "Kind of Blue",                        artist: "Miles Davis",         band: "Miles Davis Quintet",    year: 1959, tracks: 5,  type: "album",  status: "public"  },
  { id: "2",  catalog: "IMP77",    cover: "https://picsum.photos/seed/als64/44/44",     title: "A Love Supreme",                      artist: "John Coltrane",       band: "Coltrane Quartet",       year: 1964, tracks: 4,  type: "album",  status: "public"  },
  { id: "3",  catalog: "COL1397",  cover: "https://picsum.photos/seed/brub59/44/44",    title: "Time Out",                            artist: "Dave Brubeck",        band: "Brubeck Quartet",        year: 1959, tracks: 6,  type: "album",  status: "public"  },
  { id: "4",  catalog: "ATL1311",  cover: "https://picsum.photos/seed/gsteps60/44/44",  title: "Giant Steps",                         artist: "John Coltrane",                                       year: 1960, tracks: 8,  type: "album",  status: "public"  },
  { id: "5",  catalog: "COL32731", cover: "https://picsum.photos/seed/hh73/44/44",      title: "Head Hunters",                        artist: "Herbie Hancock",                                      year: 1973, tracks: 4,  type: "ep",     status: "public"  },
  { id: "6",  catalog: "BN4195",   cover: "https://picsum.photos/seed/mv65/44/44",      title: "Maiden Voyage",                       artist: "Herbie Hancock",      band: "Hancock Quintet",        year: 1965, tracks: 6,  type: "album",  status: "private" },
  { id: "7",  catalog: "RVG12291", cover: "https://picsum.photos/seed/wfd61/44/44",     title: "Waltz for Debby",                     artist: "Bill Evans",          band: "Bill Evans Trio",        year: 1961, tracks: 11, type: "album",  status: "public"  },
  { id: "8",  catalog: "PR7079",   cover: "https://picsum.photos/seed/saxroll56/44/44", title: "Saxophone Colossus",                  artist: "Sonny Rollins",                                       year: 1956, tracks: 5,  type: "album",  status: "public"  },
  { id: "9",  catalog: "BN4003",   cover: "https://picsum.photos/seed/blakey58/44/44",  title: "Moanin'",                             artist: "Art Blakey",          band: "Jazz Messengers",        year: 1958, tracks: 8,  type: "album",  status: "private" },
  { id: "10", catalog: "BN1577",   cover: "https://picsum.photos/seed/bluetr57/44/44",  title: "Blue Train",                          artist: "John Coltrane",       band: "Coltrane Sextet",        year: 1957, tracks: 5,  type: "album",  status: "public"  },
  { id: "11", catalog: "COL8271",  cover: "https://picsum.photos/seed/sos60/44/44",     title: "Sketches of Spain",                   artist: "Miles Davis",         band: "Miles Davis Orchestra",  year: 1960, tracks: 6,  type: "album",  status: "public"  },
  { id: "12", catalog: "ATL45s1",  cover: "https://picsum.photos/seed/sng32/44/44",     title: "Acknowledgement",                     artist: "John Coltrane",       band: "Coltrane Quartet",       year: 1964, tracks: 2,  type: "single", status: "public"  },
  { id: "13", catalog: "RLP1162",  cover: "https://picsum.photos/seed/pij59/44/44",     title: "Portrait in Jazz",                    artist: "Bill Evans",          band: "Bill Evans Trio",        year: 1959, tracks: 9,  type: "album",  status: "public"  },
  { id: "14", catalog: "RLP351",   cover: "https://picsum.photos/seed/exp61/44/44",     title: "Explorations",                        artist: "Bill Evans",          band: "Bill Evans Trio",        year: 1961, tracks: 7,  type: "album",  status: "private" },
  { id: "15", catalog: "VER8545",  cover: "https://picsum.photos/seed/gg64/44/44",      title: "Getz/Gilberto",                       artist: "Stan Getz",           band: "Getz/Gilberto",          year: 1964, tracks: 9,  type: "album",  status: "public"  },
  { id: "16", catalog: "PR45s3",   cover: "https://picsum.photos/seed/sng33/44/44",     title: "St. Thomas",                          artist: "Sonny Rollins",                                       year: 1956, tracks: 3,  type: "single", status: "public"  },
  { id: "17", catalog: "COL1370",  cover: "https://picsum.photos/seed/mau59/44/44",     title: "Mingus Ah Um",                        artist: "Charles Mingus",                                      year: 1959, tracks: 9,  type: "album",  status: "public"  },
  { id: "18", catalog: "IMP35",    cover: "https://picsum.photos/seed/bssl63/44/44",    title: "The Black Saint and the Sinner Lady", artist: "Charles Mingus",                                      year: 1963, tracks: 6,  type: "album",  status: "private" },
  { id: "19", catalog: "COL2184",  cover: "https://picsum.photos/seed/md63/44/44",      title: "Monk's Dream",                        artist: "Thelonious Monk",     band: "Monk Quartet",           year: 1963, tracks: 8,  type: "album",  status: "public"  },
  { id: "20", catalog: "BN45s4",   cover: "https://picsum.photos/seed/sng34/44/44",     title: "Watermelon Man",                      artist: "Herbie Hancock",                                      year: 1962, tracks: 4,  type: "ep",     status: "private" },
  { id: "21", catalog: "BN4157",   cover: "https://picsum.photos/seed/sw64/44/44",      title: "The Sidewinder",                      artist: "Lee Morgan",          band: "Lee Morgan Quintet",     year: 1964, tracks: 5,  type: "album",  status: "public"  },
  { id: "22", catalog: "BN4194",   cover: "https://picsum.photos/seed/sne66/44/44",     title: "Speak No Evil",                       artist: "Wayne Shorter",       band: "Shorter Quintet",        year: 1966, tracks: 6,  type: "album",  status: "public"  },
  { id: "23", catalog: "BN4175",   cover: "https://picsum.photos/seed/ei64/44/44",      title: "Empyrean Isles",                      artist: "Herbie Hancock",      band: "Hancock Quartet",        year: 1964, tracks: 4,  type: "ep",     status: "public"  },
  { id: "24", catalog: "RVG45s5",  cover: "https://picsum.photos/seed/sng35/44/44",     title: "Blue in Green",                       artist: "Bill Evans",          band: "Bill Evans Trio",        year: 1959, tracks: 2,  type: "single", status: "public"  },
  { id: "25", catalog: "COL1193",  cover: "https://picsum.photos/seed/mil58/44/44",     title: "Milestones",                          artist: "Miles Davis",         band: "Miles Davis Sextet",     year: 1958, tracks: 6,  type: "album",  status: "private" },
  { id: "26", catalog: "ATL1361",  cover: "https://picsum.photos/seed/mft61/44/44",     title: "My Favorite Things",                  artist: "John Coltrane",       band: "Coltrane Quartet",       year: 1961, tracks: 4,  type: "ep",     status: "public"  },
  { id: "27", catalog: "IMP9195",  cover: "https://picsum.photos/seed/cr65/44/44",      title: "Crescent",                            artist: "John Coltrane",       band: "Coltrane Quartet",       year: 1964, tracks: 5,  type: "ep",     status: "public"  },
  { id: "28", catalog: "CAN9002",  cover: "https://picsum.photos/seed/wi60/44/44",      title: "We Insist!",                          artist: "Max Roach",                                           year: 1960, tracks: 6,  type: "album",  status: "public"  },
  { id: "29", catalog: "VER6547",  cover: "https://picsum.photos/seed/pgb63/44/44",     title: "Night Has a Thousand Eyes",           artist: "Oscar Peterson",      band: "Oscar Peterson Trio",    year: 1963, tracks: 8,  type: "album",  status: "public"  },
  { id: "30", catalog: "ATL1260",  cover: "https://picsum.photos/seed/cl57/44/44",      title: "The Clown",                           artist: "Charles Mingus",                                      year: 1957, tracks: 4,  type: "ep",     status: "private" },
  { id: "31", catalog: "COL4s72",  cover: "https://picsum.photos/seed/sng31/44/44",     title: "So What",                             artist: "Miles Davis",         band: "Miles Davis Quintet",    year: 1959, tracks: 2,  type: "single", status: "public"  },
  { id: "32", catalog: "COL26",    cover: "https://picsum.photos/seed/bb70/44/44",      title: "Bitches Brew",                        artist: "Miles Davis",                                         year: 1970, tracks: 6,  type: "album",  status: "public"  },
  { id: "33", catalog: "COL45s7",  cover: "https://picsum.photos/seed/sng37/44/44",     title: "Freddie Freeloader",                  artist: "Miles Davis",         band: "Miles Davis Quintet",    year: 1959, tracks: 2,  type: "single", status: "public"  },
  { id: "34", catalog: "RLP226",   cover: "https://picsum.photos/seed/bc57/44/44",      title: "Brilliant Corners",                   artist: "Thelonious Monk",     band: "Monk Quintet",           year: 1957, tracks: 5,  type: "album",  status: "public"  },
  { id: "35", catalog: "IMP45s8",  cover: "https://picsum.photos/seed/sng38/44/44",     title: "Alabama",                             artist: "John Coltrane",       band: "Coltrane Quartet",       year: 1963, tracks: 2,  type: "single", status: "private" },
  { id: "36", catalog: "ATL1317",  cover: "https://picsum.photos/seed/sjtc59/44/44",    title: "The Shape of Jazz to Come",           artist: "Ornette Coleman",     band: "Coleman Quartet",        year: 1959, tracks: 6,  type: "album",  status: "public"  },
  { id: "37", catalog: "VER45s6",  cover: "https://picsum.photos/seed/sng36/44/44",     title: "The Girl from Ipanema",               artist: "Stan Getz",           band: "Getz/Gilberto",          year: 1963, tracks: 3,  type: "single", status: "public"  },
  { id: "38", catalog: "BN45s9",   cover: "https://picsum.photos/seed/sng39/44/44",     title: "The Sidewinder",                      artist: "Lee Morgan",          band: "Lee Morgan Quintet",     year: 1964, tracks: 3,  type: "single", status: "public"  },
  { id: "39", catalog: "COL45s10", cover: "https://picsum.photos/seed/sng40/44/44",     title: "Milestones",                          artist: "Miles Davis",                                         year: 1958, tracks: 2,  type: "single", status: "public"  },
  { id: "40", catalog: "BN1595",   cover: "https://picsum.photos/seed/se58/44/44",      title: "Somethin' Else",                      artist: "Cannonball Adderley", band: "Adderley Quintet",       year: 1958, tracks: 5,  type: "album",  status: "public"  },
  { id: "41", catalog: "PRep3",    cover: "https://picsum.photos/seed/ep43/44/44",      title: "Moving Out",                          artist: "Sonny Rollins",                                       year: 1954, tracks: 2,  type: "single", status: "private" },
  { id: "42", catalog: "COLep2",   cover: "https://picsum.photos/seed/ep42/44/44",      title: "Workin' with the Miles Davis Quintet",artist: "Miles Davis",         band: "Miles Davis Quintet",    year: 1956, tracks: 5,  type: "album",  status: "public"  },
  { id: "43", catalog: "ATLep4",   cover: "https://picsum.photos/seed/ep44/44/44",      title: "Tomorrow Is the Question!",           artist: "Ornette Coleman",                                     year: 1959, tracks: 2,  type: "single", status: "public"  },
  { id: "44", catalog: "IMPep5",   cover: "https://picsum.photos/seed/ep45/44/44",      title: "Duke Ellington & John Coltrane",      artist: "John Coltrane",                                       year: 1962, tracks: 6,  type: "album",  status: "public"  },
  { id: "45", catalog: "VERep6",   cover: "https://picsum.photos/seed/ep46/44/44",      title: "Focus",                               artist: "Stan Getz",                                           year: 1961, tracks: 5,  type: "ep",     status: "private" },
  { id: "46", catalog: "BNep1",    cover: "https://picsum.photos/seed/ep41/44/44",      title: "Interplay",                           artist: "Bill Evans",          band: "Bill Evans Trio",        year: 1962, tracks: 5,  type: "ep",     status: "public"  },
  { id: "47", catalog: "BNep7",    cover: "https://picsum.photos/seed/ep47/44/44",      title: "Night Dreamer",                       artist: "Wayne Shorter",       band: "Shorter Quartet",        year: 1964, tracks: 5,  type: "album",  status: "public"  },

]

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  album: "Album", single: "Single", ep: "EP",
}
const STATUS_LABELS: Record<ReleaseStatus, string> = {
  public: "Public", private: "Private",
}

// ─── Shared filter UI primitives ──────────────────────────────────────────────

/** Pill trigger shared by ContentTypeMultiSelect and ArtistMultiSelect */
function FilterTrigger({
  label,
  active,
  count,
  onClick,
  onKeyDown,
}: {
  label: string
  active: boolean
  open?: boolean
  count?: number
  onClick?: () => void
  onKeyDown?: (e: React.KeyboardEvent) => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={filterTriggerCls(active)}
    >
      <span>{label}</span>
      <FilterCount count={count ?? 0} />
      <FilterChevron />
    </div>
  )
}

/** Popover shell — absolute positioned below trigger */
function FilterPopover({ children, minWidth = "min-w-44" }: { children: React.ReactNode; minWidth?: string }) {
  return (
    <div className={cn("absolute top-full left-0 mt-1.5 z-50 w-max rounded-xl bg-popover p-1 text-foreground ring-1 ring-foreground/10", minWidth)}>
      {children}
    </div>
  )
}

/** Single checkbox row inside a popover */
function FilterPopoverItem({
  checked,
  onToggle,
  children,
}: {
  checked: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div
      role="option"
      aria-selected={checked}
      tabIndex={0}
      onClick={e => { e.stopPropagation(); onToggle() }}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onToggle() } }}
      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-default select-none"
    >
      <Checkbox
        checked={checked}
        onCheckedChange={() => {}}
        tabIndex={-1}
        className="pointer-events-none shrink-0 after:hidden"
      />
      {children}
    </div>
  )
}

/** Separator + action button shown at the bottom of a filter popover/dropdown */
function FilterPopoverClearAll({ onClear, label = "Clear all" }: { onClear: () => void; label?: string }) {
  return (
    <>
      <div className="-mx-1 my-1 h-px bg-border" />
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onClear() }}
        className="flex w-full items-center justify-center rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        {label}
      </button>
    </>
  )
}

// ─── ContentTypeMultiSelect ───────────────────────────────────────────────────

function ContentTypeMultiSelect({
  selected,
  onChange,
}: {
  selected: Set<ContentType>
  onChange: (next: Set<ContentType>) => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const toggle = (t: ContentType) => {
    const next = new Set(selected)
    if (next.has(t)) next.delete(t)
    else next.add(t)
    onChange(next)
  }

  return (
    <div ref={containerRef} className="relative">
      <FilterTrigger
        label="Type"
        active={selected.size > 0}
        open={open}
        count={selected.size}
        onClick={() => setOpen(v => !v)}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setOpen(v => !v) }}
      />
      {open && (
        <FilterPopover>
          {(["album", "single", "ep"] as ContentType[]).map(t => (
            <FilterPopoverItem key={t} checked={selected.has(t)} onToggle={() => toggle(t)}>
              {CONTENT_TYPE_LABELS[t]}
            </FilterPopoverItem>
          ))}
          {selected.size > 0 && <FilterPopoverClearAll onClear={() => onChange(new Set())} />}
        </FilterPopover>
      )}
    </div>
  )
}

// ─── RadioIndicator — CSS-only radio visual (avoids nested <button>) ──────────

function RadioIndicator({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "flex size-4 shrink-0 rounded-full border items-center justify-center transition-colors",
        checked
          ? "border-primary bg-primary"
          : "border-muted-foreground dark:bg-input/30",
      )}
    >
      {checked && (
        <span className="size-1.5 rounded-full bg-primary-foreground" />
      )}
    </span>
  )
}

// ─── FilterButton (single-select, uses DropdownMenu) ─────────────────────────

function FilterButton({ label, active, children }: {
  label: string; active: boolean; children: React.ReactNode
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={filterTriggerCls(active)}>
        {label}
        <FilterChevron />
      </DropdownMenuTrigger>
      {children}
    </DropdownMenu>
  )
}

// ─── ArtistMultiSelect ────────────────────────────────────────────────────────

function ArtistMultiSelect({
  options,
  selected,
  onChange,
}: {
  options: string[]
  selected: Set<string>
  onChange: (next: Set<string>) => void
}) {
  const [open, setOpen]       = useState(false)
  const [search, setSearch]   = useState("")
  const containerRef          = useRef<HTMLDivElement>(null)
  const searchRef             = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  // Focus search when opened
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 0)
    else setSearch("")
  }, [open])

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()))

  const toggle = (artist: string) => {
    const next = new Set(selected)
    if (next.has(artist)) next.delete(artist)
    else next.add(artist)
    onChange(next)
  }

  const active = selected.size > 0

  return (
    <div ref={containerRef} className="relative">
      <FilterTrigger
        label="Artist"
        active={selected.size > 0}
        open={open}
        count={selected.size}
        onClick={() => setOpen(v => !v)}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setOpen(v => !v) }}
      />

      {open && (
        <FilterPopover minWidth="min-w-52">
          {/* Search */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 mb-1 border-b border-border">
            <Search className="size-3.5 text-muted-foreground shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search artists…"
              className="flex-1 bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground min-w-0"
              onClick={e => e.stopPropagation()}
            />
            {search && (
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setSearch("") }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">No results</p>
            ) : (
              filtered.map(artist => (
                <FilterPopoverItem key={artist} checked={selected.has(artist)} onToggle={() => toggle(artist)}>
                  {artist}
                </FilterPopoverItem>
              ))
            )}
          </div>

          {selected.size > 0 && (
            <FilterPopoverClearAll onClear={() => { onChange(new Set()); setSearch("") }} />
          )}
        </FilterPopover>
      )}
    </div>
  )
}

// ─── LabelMultiSelect ─────────────────────────────────────────────────────────

function LabelMultiSelect({
  options,
  selected,
  onChange,
}: {
  options: string[]
  selected: Set<string>
  onChange: (next: Set<string>) => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const toggle = (label: string) => {
    const next = new Set(selected)
    if (next.has(label)) next.delete(label)
    else next.add(label)
    onChange(next)
  }

  return (
    <div ref={containerRef} className="relative">
      <FilterTrigger
        label="Label"
        active={selected.size > 0}
        open={open}
        count={selected.size}
        onClick={() => setOpen(v => !v)}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setOpen(v => !v) }}
      />
      {open && (
        <FilterPopover>
          {options.map(label => (
            <FilterPopoverItem key={label} checked={selected.has(label)} onToggle={() => toggle(label)}>
              {label}
            </FilterPopoverItem>
          ))}
          {selected.size > 0 && <FilterPopoverClearAll onClear={() => onChange(new Set())} />}
        </FilterPopover>
      )}
    </div>
  )
}

// ─── MonetisationMultiSelect ──────────────────────────────────────────────────

const MONETISATION_KINDS = ["streaming", "purchase", "purchase+download"] as const
type MonetisationKind = typeof MONETISATION_KINDS[number]
const MONETISATION_KIND_LABELS: Record<MonetisationKind, string> = {
  "streaming":          "Streaming",
  "purchase":           "Purchase",
  "purchase+download":  "Purchase + Download",
}

function MonetisationMultiSelect({
  selected,
  onChange,
}: {
  selected: Set<MonetisationKind>
  onChange: (next: Set<MonetisationKind>) => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const toggle = (kind: MonetisationKind) => {
    const next = new Set(selected)
    if (next.has(kind)) next.delete(kind)
    else next.add(kind)
    onChange(next)
  }

  return (
    <div ref={containerRef} className="relative">
      <FilterTrigger
        label="Monetisation"
        active={selected.size > 0}
        open={open}
        count={selected.size}
        onClick={() => setOpen(v => !v)}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setOpen(v => !v) }}
      />
      {open && (
        <FilterPopover>
          {MONETISATION_KINDS.map(kind => (
            <FilterPopoverItem key={kind} checked={selected.has(kind)} onToggle={() => toggle(kind)}>
              {MONETISATION_KIND_LABELS[kind]}
            </FilterPopoverItem>
          ))}
          {selected.size > 0 && <FilterPopoverClearAll onClear={() => onChange(new Set())} />}
        </FilterPopover>
      )}
    </div>
  )
}


// ─── MusicRow ─────────────────────────────────────────────────────────────────

function MusicRow({ release, visibleCols, isSelected, onSelect, status, onStatusChange }: {
  release:        Release
  visibleCols:    Record<ColKey, boolean>
  isSelected:     boolean
  onSelect:       () => void
  status:         ReleaseStatus
  onStatusChange: (s: ReleaseStatus) => void
}) {
  const [hovered, setHovered] = useState(false)
  const vis = visibleCols

  return (
    <tr
      className={cn("border-b border-border transition-colors cursor-pointer", hovered || isSelected ? "bg-muted" : "bg-background")}
      style={{ height: 56 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Checkbox */}
      <td className="w-10 px-2 py-0">
        <div className={cn("flex items-center justify-center transition-opacity", hovered || isSelected ? "opacity-100" : "opacity-0 pointer-events-none")}>
          <Checkbox checked={isSelected} onCheckedChange={onSelect} onClick={e => e.stopPropagation()} className="after:hidden" />
        </div>
      </td>

      {/* ID */}
      <td className={cn("px-4 py-0 text-xs font-normal text-muted-foreground truncate", !vis.id && "hidden")}>
        {release.catalog}
      </td>

      {/* Cover */}
      <td className={cn("px-2 py-0", !vis.cover && "hidden")}>
        <div className="rounded-xs bg-neutral-200 overflow-hidden" style={{ width: 44, height: 44 }}>
          <img src={release.cover} alt={release.title} className="size-full object-cover" draggable={false} />
        </div>
      </td>

      {/* Title */}
      <td className="px-4 py-0 text-xs font-normal text-foreground truncate max-w-0">
        <span className="block truncate">{release.title}</span>
      </td>

      {/* Artist */}
      <td className={cn("px-4 py-0 text-xs font-normal text-muted-foreground truncate", !vis.artist && "hidden")}>
        {release.artist}
      </td>

      {/* Band */}
      <td className={cn("px-4 py-0 text-xs font-normal text-muted-foreground truncate", !vis.band && "hidden")}>
        {release.band ?? "—"}
      </td>

      {/* Year */}
      <td className={cn("px-4 py-0 text-xs font-normal text-muted-foreground tabular-nums", !vis.year && "hidden")}>
        {release.year}
      </td>

      {/* Tracks */}
      <td className={cn("px-4 py-0 text-xs font-normal text-muted-foreground tabular-nums", !vis.tracks && "hidden")}>
        {release.tracks}
      </td>

      {/* Label */}
      <td className={cn("px-4 py-0 text-xs font-normal text-muted-foreground truncate", !vis.label && "hidden")}>
        {mockLabel(release.catalog)}
      </td>

      {/* Uploaded */}
      <td className={cn("px-4 py-0 text-xs font-normal text-muted-foreground tabular-nums", !vis.uploaded && "hidden")}>
        {mockUploadDate(release.id)}
      </td>

      {/* Type */}
      <td className={cn("px-4 py-0", !vis.type && "hidden")}>
        <ContentTypeBadge type={release.type} />
      </td>

      {/* State */}
      <td className={cn("px-4 py-0", !vis.state && "hidden")}>
        <StatusBadge status={status} onStatusChange={onStatusChange} />
      </td>

      {/* Monetisation */}
      <td className={cn("px-4 py-0", !vis.monetisation && "hidden")}>
        <div className="relative flex items-center">
          <div className={cn("transition-opacity duration-150", hovered ? "opacity-0" : "opacity-100")}>
            <MonetisationCell state={mockMonetisation(release.id)} dimmed={status === "private"} />
          </div>
          {hovered && (
            <div className="absolute inset-0 flex items-center">
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs px-2.5"
                onClick={e => e.stopPropagation()}
              >
                <Pencil className="size-3" />
                Edit
              </Button>
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}

// ─── StudioMusicView ──────────────────────────────────────────────────────────

export function StudioMusicView({ onOpenUpload }: { onOpenUpload?: () => void }) {
  // Lifted release statuses
  const [statuses, setStatuses] = useState<Record<string, ReleaseStatus>>(
    () => Object.fromEntries(RELEASES.map(r => [r.id, r.status]))
  )

  function setReleaseStatus(id: string, s: ReleaseStatus) {
    setStatuses(prev => ({ ...prev, [id]: s }))
  }

  // Row selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Multi-select filters
  const [typeFilters,         setTypeFilters]         = useState<Set<ContentType>>(new Set())
  const [statusFilter,        setStatusFilter]        = useState<ReleaseStatus | "all">("all")
  const [artistFilters,       setArtistFilters]       = useState<Set<string>>(new Set())
  const [labelFilters,        setLabelFilters]        = useState<Set<string>>(new Set())
  const [monetisationFilters, setMonetisationFilters] = useState<Set<MonetisationKind>>(new Set())

  const [searchQuery, setSearchQuery] = useState("")
  const [sortKey, setSortKey]         = useState<SortKey>("uploaded")
  const [sortDir, setSortDir]         = useState<SortDir>("desc")

  const [visibleCols,    setVisibleCols]    = useState<Record<ColKey, boolean>>({
    id: false, cover: true, title: true, artist: true, band: false,
    year: false, tracks: false, uploaded: true, type: true, state: true,
    label: true, monetisation: true,
  })
  // Cover auto-hide driven by ResizeObserver
  const [autoCoverHide, setAutoCoverHide] = useState(false)

  const tableWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = tableWrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setAutoCoverHide(entry.contentRect.width < COVER_HIDE_THRESHOLD)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  function toggleCol(key: ColKey) {
    const def = COL_DEFS.find(c => c.key === key)
    if (def?.required) return
    setVisibleCols(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function handleSortChange(key: SortKey) {
    if (key === sortKey) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("asc") }
  }


  // Effective visibility — cover also obeys auto-hide at narrow widths
  const effectiveVis: Record<ColKey, boolean> = {
    ...visibleCols,
    cover: visibleCols.cover && !autoCoverHide,
  }

  const isColsModified = COL_DEFS.some(({ key }) => !visibleCols[key])

  const artists = Array.from(new Set(RELEASES.map(r => r.artist))).sort()
  const labels  = Array.from(new Set(RELEASES.map(r => mockLabel(r.catalog)))).sort()

  const q = searchQuery.trim().toLowerCase()
  const filtered = sortReleases(
    RELEASES.filter(r => {
      if (typeFilters.size > 0         && !typeFilters.has(r.type))                            return false
      if (statusFilter !== "all"        && (statuses[r.id] ?? r.status) !== statusFilter)        return false
      if (artistFilters.size > 0       && !artistFilters.has(r.artist))                        return false
      if (labelFilters.size > 0        && !labelFilters.has(mockLabel(r.catalog)))             return false
      if (monetisationFilters.size > 0 && !monetisationFilters.has(mockMonetisation(r.id).kind as MonetisationKind)) return false
      if (q && !`${r.title} ${r.artist} ${r.band ?? ""}`.toLowerCase().includes(q))           return false
      return true
    }),
    sortKey,
    sortDir,
  )

  const anyFilter =
    typeFilters.size > 0 || statusFilter !== "all" || artistFilters.size > 0 ||
    labelFilters.size > 0 || monetisationFilters.size > 0 || q.length > 0

  const allSelected = filtered.length > 0 && filtered.every(r => selectedIds.has(r.id))
  const someSelected = filtered.some(r => selectedIds.has(r.id))

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(r => r.id)))
    }
  }

  return (
    <div ref={tableWrapRef} className="relative flex flex-col h-full">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between gap-6 px-16 pt-8 pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Music</h1>
          <p className="text-sm font-normal text-muted-foreground mt-1">
            {RELEASES.length} releases
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button size="lg" className="text-base px-8 h-14 gap-2.5" onClick={onOpenUpload}>
            <Upload className="size-5" />
            Upload music
          </Button>
        </div>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-start gap-3 px-16 pb-8">

        {/* LEFT — filters */}
        <div className="flex items-start gap-2 flex-1 flex-wrap">

          {/* Status — single-select, radio visual */}
          <FilterButton label="Status" active={statusFilter !== "all"}>
            <DropdownMenuContent align="start">
              {(["public", "private"] as ReleaseStatus[]).map(s => (
                <div
                  key={s}
                  role="option"
                  aria-selected={statusFilter === s}
                  tabIndex={0}
                  onClick={() => setStatusFilter(prev => prev === s ? "all" : s)}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setStatusFilter(prev => prev === s ? "all" : s) }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-default select-none"
                >
                  <RadioIndicator checked={statusFilter === s} />
                  {STATUS_LABELS[s]}
                </div>
              ))}
            </DropdownMenuContent>
          </FilterButton>

          {/* Monetisation — multi-select */}
          <MonetisationMultiSelect
            selected={monetisationFilters}
            onChange={setMonetisationFilters}
          />

          {/* Artist — multi-select combobox */}
          <ArtistMultiSelect
            options={artists}
            selected={artistFilters}
            onChange={setArtistFilters}
          />

          {/* Label — multi-select */}
          <LabelMultiSelect
            options={labels}
            selected={labelFilters}
            onChange={setLabelFilters}
          />

          {/* Content Type — multi-select */}
          <ContentTypeMultiSelect
            selected={typeFilters}
            onChange={setTypeFilters}
          />

          {/* Keyword search */}
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search your music"
              className={cn(
                "h-10 pl-10 pr-[18px] rounded-full border text-sm font-normal bg-transparent transition-all",
                "text-foreground placeholder:text-muted-foreground focus:outline-none",
                searchQuery
                  ? "border-foreground/40 bg-muted text-foreground w-56"
                  : "border-border text-foreground w-48 hover:border-foreground/30 focus:border-foreground/40 focus:bg-muted focus:w-56",
              )}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        </div>


        {/* RIGHT — table controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Columns */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="font-normal">
                <Settings2 className="size-4" />
                Set columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {COL_DEFS.map(({ key, label, required }) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => toggleCol(key)}
                    closeOnClick={false}
                    className={cn("text-foreground text-xs", required && "opacity-40 pointer-events-none")}
                  >
                    <Checkbox
                      checked={visibleCols[key]}
                      onCheckedChange={() => {}}
                      tabIndex={-1}
                      className="pointer-events-none shrink-0 after:hidden"
                    />
                    {label}
                    {required && <span className="ml-auto text-xxs text-muted-foreground">required</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              {isColsModified && (
                <FilterPopoverClearAll
                  label="Reset"
                  onClear={() => setVisibleCols({
                    id: false, cover: true, title: true, artist: true, band: false,
                    year: false, tracks: false, uploaded: true, type: true, state: true,
                    label: true, monetisation: true,
                  })}
                />
              )}
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>

      {/* ── Active filter chips ──────────────────────────────────────── */}
      {anyFilter && (
        <div className="shrink-0 flex items-center gap-1.5 px-16 pb-3 flex-wrap">
          <button
            onClick={() => { setTypeFilters(new Set()); setStatusFilter("all"); setArtistFilters(new Set()); setLabelFilters(new Set()); setMonetisationFilters(new Set()); setSearchQuery("") }}
            className="text-xs font-normal text-muted-foreground hover:text-foreground transition-colors mr-1 shrink-0"
          >
            Clear all
          </button>
          {[...typeFilters].map(t => (
            <ChipDismiss
              key={t}
              onDismiss={() => {
                const next = new Set(typeFilters)
                next.delete(t)
                setTypeFilters(next)
              }}
            >
              {CONTENT_TYPE_LABELS[t]}
            </ChipDismiss>
          ))}
          {statusFilter !== "all" && (
            <ChipDismiss onDismiss={() => setStatusFilter("all")}>
              {STATUS_LABELS[statusFilter]}
            </ChipDismiss>
          )}
          {[...artistFilters].map(a => (
            <ChipDismiss
              key={a}
              onDismiss={() => {
                const next = new Set(artistFilters)
                next.delete(a)
                setArtistFilters(next)
              }}
            >
              {a}
            </ChipDismiss>
          ))}
          {[...labelFilters].map(l => (
            <ChipDismiss
              key={l}
              onDismiss={() => {
                const next = new Set(labelFilters)
                next.delete(l)
                setLabelFilters(next)
              }}
            >
              {l}
            </ChipDismiss>
          ))}
          {[...monetisationFilters].map(k => (
            <ChipDismiss
              key={k}
              onDismiss={() => {
                const next = new Set(monetisationFilters)
                next.delete(k)
                setMonetisationFilters(next)
              }}
            >
              {MONETISATION_KIND_LABELS[k]}
            </ChipDismiss>
          ))}
          {searchQuery && (
            <ChipDismiss onDismiss={() => setSearchQuery("")}>
              &ldquo;{searchQuery}&rdquo;
            </ChipDismiss>
          )}
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto px-16">
        <table className="w-full">

          {/* Sticky header */}
          <thead className="sticky top-0 z-10 bg-background [&_tr]:border-b [&_tr]:border-border [&_tr]:hover:bg-transparent">
            <tr>
              <TableHead resizable={false} className="w-10 px-2">
                <div className="flex items-center justify-center">
                  <Checkbox checked={allSelected} indeterminate={!allSelected && someSelected} onCheckedChange={toggleSelectAll} className="after:hidden" />
                </div>
              </TableHead>
              <TableHead className={cn(!effectiveVis.id && "hidden")} style={{ width: DEFAULT_WIDTHS.id }} minWidth={MIN_WIDTHS.id}>ID</TableHead>
              <TableHead resizable={false} className={cn("px-2", !effectiveVis.cover && "hidden")} style={{ width: DEFAULT_WIDTHS.cover }} />
              <TableHead style={{ width: DEFAULT_WIDTHS.title }} minWidth={MIN_WIDTHS.title}>
                {(() => { const sk = COL_SORT_KEY["title"]!; const isActive = sk === sortKey; return (
                  <button className="flex items-center gap-0.5 min-w-0 overflow-hidden cursor-pointer group/sort select-none" onClick={() => handleSortChange(sk)}>
                    <span className={cn("text-xs font-normal truncate", isActive ? "text-foreground" : "text-muted-foreground")}>Title</span>
                    {isActive ? (sortDir === "asc" ? <ArrowUp className="size-3 shrink-0 text-foreground" /> : <ArrowDown className="size-3 shrink-0 text-foreground" />) : <ArrowUpDown className="size-3 shrink-0 text-muted-foreground opacity-0 group-hover/sort:opacity-50 transition-opacity" />}
                  </button>
                ) })()}
              </TableHead>
              {(["artist", "band", "year", "tracks", "label", "uploaded", "type", "state", "monetisation"] as ColKey[]).map(key => {
                const sk = COL_SORT_KEY[key]
                const isActive = sk !== undefined && sk === sortKey
                const labels: Record<string, string> = { artist: "Main Artist", band: "Band", year: "Year", tracks: "Tracks", label: "Label", uploaded: "Uploaded", type: "Type", state: "State", monetisation: "Monetisation" }
                return (
                  <TableHead
                    key={key}
                    className={cn(!effectiveVis[key] && "hidden")}
                    style={{ width: DEFAULT_WIDTHS[key] }}
                    minWidth={MIN_WIDTHS[key]}
                  >
                    {sk ? (
                      <button className="flex items-center gap-0.5 min-w-0 overflow-hidden cursor-pointer group/sort select-none" onClick={() => handleSortChange(sk)}>
                        <span className={cn("text-xs font-normal truncate", isActive ? "text-foreground" : "text-muted-foreground")}>{labels[key]}</span>
                        {isActive ? (sortDir === "asc" ? <ArrowUp className="size-3 shrink-0 text-foreground" /> : <ArrowDown className="size-3 shrink-0 text-foreground" />) : <ArrowUpDown className="size-3 shrink-0 text-muted-foreground opacity-0 group-hover/sort:opacity-50 transition-opacity" />}
                      </button>
                    ) : (
                      <span className="text-xs font-normal text-muted-foreground">{labels[key]}</span>
                    )}
                  </TableHead>
                )
              })}
            </tr>
          </thead>

          {/* Empty state */}
          {filtered.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={13} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <p className="text-sm font-normal text-muted-foreground">No releases match the current filters.</p>
                    {anyFilter && (
                      <button
                        onClick={() => { setTypeFilters(new Set()); setStatusFilter("all"); setArtistFilters(new Set()); setLabelFilters(new Set()); setMonetisationFilters(new Set()); setSearchQuery("") }}
                        className="text-xs font-normal text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody className="[&_tr:last-child]:border-0">
              {/* Upload row */}
              <tr onClick={onOpenUpload} className="border-b border-border hover:bg-muted transition-colors cursor-pointer group" style={{ height: 56 }}>
                <td className="px-2 py-0 w-10" />
                <td className="px-2 py-0 text-center" colSpan={2}>
                  <div className="flex items-center justify-center size-11 mx-auto">
                    <Upload className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </td>
                <td colSpan={10} className="px-4 py-0">
                  <span className="text-sm font-normal text-muted-foreground group-hover:text-foreground transition-colors">Upload music</span>
                </td>
              </tr>
              {filtered.map(r => (
                <MusicRow
                  key={r.id}
                  release={r}
                  visibleCols={effectiveVis}
                  isSelected={selectedIds.has(r.id)}
                  onSelect={() => toggleSelect(r.id)}
                  status={statuses[r.id] ?? r.status}
                  onStatusChange={s => setReleaseStatus(r.id, s)}
                />
              ))}
            </tbody>
          )}
        </table>
      </div>

      {selectedIds.size > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-foreground border border-foreground shadow-xl">
            <span className="text-sm font-medium text-background tabular-nums pr-2">
              {selectedIds.size} selected
            </span>
            <div className="w-px h-5 bg-background/20" />
            <Button
              size="sm"
              variant="secondary"
              className="bg-background/15 hover:bg-background/25 text-background border-transparent"
              onClick={() => {
                selectedIds.forEach(id => setReleaseStatus(id, "public"))
                setSelectedIds(new Set())
              }}
            >
              Make public
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="bg-background/15 hover:bg-background/25 text-background border-transparent"
              onClick={() => {
                selectedIds.forEach(id => setReleaseStatus(id, "private"))
                setSelectedIds(new Set())
              }}
            >
              Make private
            </Button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-1 text-background/50 hover:text-background transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
