"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ContentTypeBadge, StatusBadge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ChipDismiss } from "@/components/ui/chip"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import {
  ArrowDown, ArrowUp, ArrowUpDown, Columns2, ChevronDown, Globe, GripVertical,
  LayoutGrid, List, Lock, Pencil, Search, Upload, X,
} from "lucide-react"
import { UploadMusicDialog } from "@/components/app/upload-music-dialog"

// ─── Types ─────────────────────────────────────────────────────────────────────

type ContentType  = "album" | "single" | "ep" | "song"
type ReleaseStatus = "public" | "private"
type SortKey      = "date" | "id" | "artist" | "title"
type SortDir      = "asc" | "desc"
type ColKey       = "id" | "cover" | "title" | "artist" | "band" | "year" | "tracks" | "type" | "state"

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
  id: 72, cover: 44, title: 220, artist: 120, band: 120,
  year: 44, tracks: 36, type: 72, state: 88,
}

const MIN_WIDTHS: Record<ColKey, number> = {
  id: 48, cover: 44, title: 140, artist: 72, band: 72,
  year: 32, tracks: 28, type: 56, state: 80,
}

const COL_DEFS: { key: ColKey; label: string; required?: boolean }[] = [
  { key: "id",     label: "ID" },
  { key: "cover",  label: "Cover" },
  { key: "title",  label: "Title",      required: true },
  { key: "artist", label: "Main Artist" },
  { key: "band",   label: "Band" },
  { key: "year",   label: "Year" },
  { key: "tracks", label: "Tracks" },
  { key: "type",   label: "Type" },
  { key: "state",  label: "State",      required: true },
]

const GRIP_W             = 16
const NUM_W              = 24
const ACTION_W           = 36
const COL_GAP            = 16
// When the table container shrinks below this width, cover auto-hides
const COVER_HIDE_THRESHOLD = 800

// ─── Sort configuration ────────────────────────────────────────────────────────

const SORT_LABELS: Record<SortKey, string> = {
  date:   "Recording date",
  id:     "ID",
  artist: "Main Artist A–Z",
  title:  "Title A–Z",
}

function sortReleases(releases: Release[], key: SortKey, dir: SortDir): Release[] {
  return [...releases].sort((a, b) => {
    let cmp = 0
    switch (key) {
      case "date":   cmp = a.year - b.year; break
      case "id":     cmp = a.catalog.localeCompare(b.catalog); break
      case "artist": cmp = a.artist.localeCompare(b.artist); break
      case "title":  cmp = a.title.localeCompare(b.title); break
    }
    return dir === "desc" ? -cmp : cmp
  })
}

// ─── Jazz mock data (30 releases) ─────────────────────────────────────────────

const RELEASES: Release[] = [
  { id: "1",  catalog: "COL8163",  cover: "https://picsum.photos/seed/kob59/44/44",     title: "Kind of Blue",                       artist: "Miles Davis",         band: "Miles Davis Quintet",    year: 1959, tracks: 5,  type: "album",  status: "public"  },
  { id: "2",  catalog: "IMP77",    cover: "https://picsum.photos/seed/als64/44/44",     title: "A Love Supreme",                     artist: "John Coltrane",       band: "Coltrane Quartet",       year: 1964, tracks: 4,  type: "album",  status: "public"  },
  { id: "3",  catalog: "COL1397",  cover: "https://picsum.photos/seed/brub59/44/44",    title: "Time Out",                           artist: "Dave Brubeck",        band: "Brubeck Quartet",        year: 1959, tracks: 6,  type: "album",  status: "public"  },
  { id: "4",  catalog: "ATL1311",  cover: "https://picsum.photos/seed/gsteps60/44/44",  title: "Giant Steps",                        artist: "John Coltrane",                                       year: 1960, tracks: 8,  type: "album",  status: "public"  },
  { id: "5",  catalog: "COL32731", cover: "https://picsum.photos/seed/hh73/44/44",      title: "Head Hunters",                       artist: "Herbie Hancock",                                      year: 1973, tracks: 4,  type: "album",  status: "public"  },
  { id: "6",  catalog: "BN4195",   cover: "https://picsum.photos/seed/mv65/44/44",      title: "Maiden Voyage",                      artist: "Herbie Hancock",      band: "Hancock Quintet",        year: 1965, tracks: 6,  type: "album",  status: "private" },
  { id: "7",  catalog: "RVG12291", cover: "https://picsum.photos/seed/wfd61/44/44",     title: "Waltz for Debby",                    artist: "Bill Evans",          band: "Bill Evans Trio",        year: 1961, tracks: 11, type: "album",  status: "public"  },
  { id: "8",  catalog: "PR7079",   cover: "https://picsum.photos/seed/saxroll56/44/44", title: "Saxophone Colossus",                 artist: "Sonny Rollins",                                       year: 1956, tracks: 5,  type: "album",  status: "public"  },
  { id: "9",  catalog: "BN4003",   cover: "https://picsum.photos/seed/blakey58/44/44",  title: "Moanin'",                            artist: "Art Blakey",          band: "Jazz Messengers",        year: 1958, tracks: 8,  type: "album",  status: "private" },
  { id: "10", catalog: "BN1577",   cover: "https://picsum.photos/seed/bluetr57/44/44",  title: "Blue Train",                         artist: "John Coltrane",       band: "Coltrane Sextet",        year: 1957, tracks: 5,  type: "album",  status: "public"  },
  { id: "11", catalog: "COL8271",  cover: "https://picsum.photos/seed/sos60/44/44",     title: "Sketches of Spain",                  artist: "Miles Davis",         band: "Miles Davis Orchestra",  year: 1960, tracks: 6,  type: "album",  status: "public"  },
  { id: "12", catalog: "COL26",    cover: "https://picsum.photos/seed/bb70/44/44",      title: "Bitches Brew",                       artist: "Miles Davis",                                         year: 1970, tracks: 6,  type: "album",  status: "public"  },
  { id: "13", catalog: "RLP1162",  cover: "https://picsum.photos/seed/pij59/44/44",     title: "Portrait in Jazz",                   artist: "Bill Evans",          band: "Bill Evans Trio",        year: 1959, tracks: 9,  type: "album",  status: "public"  },
  { id: "14", catalog: "RLP351",   cover: "https://picsum.photos/seed/exp61/44/44",     title: "Explorations",                       artist: "Bill Evans",          band: "Bill Evans Trio",        year: 1961, tracks: 7,  type: "album",  status: "private" },
  { id: "15", catalog: "VER8545",  cover: "https://picsum.photos/seed/gg64/44/44",      title: "Getz/Gilberto",                      artist: "Stan Getz",           band: "Getz/Gilberto",          year: 1964, tracks: 9,  type: "album",  status: "public"  },
  { id: "16", catalog: "ATL1317",  cover: "https://picsum.photos/seed/sjtc59/44/44",    title: "The Shape of Jazz to Come",          artist: "Ornette Coleman",     band: "Coleman Quartet",        year: 1959, tracks: 6,  type: "album",  status: "public"  },
  { id: "17", catalog: "COL1370",  cover: "https://picsum.photos/seed/mau59/44/44",     title: "Mingus Ah Um",                       artist: "Charles Mingus",                                      year: 1959, tracks: 9,  type: "album",  status: "public"  },
  { id: "18", catalog: "IMP35",    cover: "https://picsum.photos/seed/bssl63/44/44",    title: "The Black Saint and the Sinner Lady",artist: "Charles Mingus",                                      year: 1963, tracks: 6,  type: "album",  status: "private" },
  { id: "19", catalog: "COL2184",  cover: "https://picsum.photos/seed/md63/44/44",      title: "Monk's Dream",                       artist: "Thelonious Monk",     band: "Monk Quartet",           year: 1963, tracks: 8,  type: "album",  status: "public"  },
  { id: "20", catalog: "RLP226",   cover: "https://picsum.photos/seed/bc57/44/44",      title: "Brilliant Corners",                  artist: "Thelonious Monk",     band: "Monk Quintet",           year: 1957, tracks: 5,  type: "album",  status: "public"  },
  { id: "21", catalog: "BN4157",   cover: "https://picsum.photos/seed/sw64/44/44",      title: "The Sidewinder",                     artist: "Lee Morgan",          band: "Lee Morgan Quintet",     year: 1964, tracks: 5,  type: "album",  status: "public"  },
  { id: "22", catalog: "BN4194",   cover: "https://picsum.photos/seed/sne66/44/44",     title: "Speak No Evil",                      artist: "Wayne Shorter",       band: "Shorter Quintet",        year: 1966, tracks: 6,  type: "album",  status: "public"  },
  { id: "23", catalog: "BN4175",   cover: "https://picsum.photos/seed/ei64/44/44",      title: "Empyrean Isles",                     artist: "Herbie Hancock",      band: "Hancock Quartet",        year: 1964, tracks: 4,  type: "album",  status: "public"  },
  { id: "24", catalog: "BN1595",   cover: "https://picsum.photos/seed/se58/44/44",      title: "Somethin' Else",                     artist: "Cannonball Adderley", band: "Adderley Quintet",       year: 1958, tracks: 5,  type: "album",  status: "public"  },
  { id: "25", catalog: "COL1193",  cover: "https://picsum.photos/seed/mil58/44/44",     title: "Milestones",                         artist: "Miles Davis",         band: "Miles Davis Sextet",     year: 1958, tracks: 6,  type: "album",  status: "private" },
  { id: "26", catalog: "ATL1361",  cover: "https://picsum.photos/seed/mft61/44/44",     title: "My Favorite Things",                 artist: "John Coltrane",       band: "Coltrane Quartet",       year: 1961, tracks: 4,  type: "album",  status: "public"  },
  { id: "27", catalog: "IMP9195",  cover: "https://picsum.photos/seed/cr65/44/44",      title: "Crescent",                           artist: "John Coltrane",       band: "Coltrane Quartet",       year: 1964, tracks: 5,  type: "album",  status: "public"  },
  { id: "28", catalog: "CAN9002",  cover: "https://picsum.photos/seed/wi60/44/44",      title: "We Insist!",                         artist: "Max Roach",                                           year: 1960, tracks: 6,  type: "album",  status: "public"  },
  { id: "29", catalog: "VER6547",  cover: "https://picsum.photos/seed/pgb63/44/44",     title: "Night Has a Thousand Eyes",          artist: "Oscar Peterson",      band: "Oscar Peterson Trio",    year: 1963, tracks: 8,  type: "album",  status: "public"  },
  { id: "30", catalog: "ATL1260",  cover: "https://picsum.photos/seed/cl57/44/44",      title: "The Clown",                          artist: "Charles Mingus",                                      year: 1957, tracks: 4,  type: "ep",      status: "private" },

  // Singles (multi-track)
  { id: "31", catalog: "COL4s72",  cover: "https://picsum.photos/seed/sng31/44/44",    title: "So What",                            artist: "Miles Davis",         band: "Miles Davis Quintet",    year: 1959, tracks: 2,  type: "single",  status: "public"  },
  { id: "32", catalog: "ATL45s1",  cover: "https://picsum.photos/seed/sng32/44/44",    title: "Acknowledgement",                    artist: "John Coltrane",       band: "Coltrane Quartet",       year: 1964, tracks: 2,  type: "single",  status: "public"  },
  { id: "33", catalog: "PR45s3",   cover: "https://picsum.photos/seed/sng33/44/44",    title: "St. Thomas",                         artist: "Sonny Rollins",                                       year: 1956, tracks: 3,  type: "single",  status: "public"  },
  { id: "34", catalog: "BN45s4",   cover: "https://picsum.photos/seed/sng34/44/44",    title: "Watermelon Man",                     artist: "Herbie Hancock",                                      year: 1962, tracks: 2,  type: "single",  status: "private" },
  { id: "35", catalog: "RVG45s5",  cover: "https://picsum.photos/seed/sng35/44/44",    title: "Blue in Green",                      artist: "Bill Evans",          band: "Bill Evans Trio",        year: 1959, tracks: 2,  type: "single",  status: "public"  },
  { id: "36", catalog: "VER45s6",  cover: "https://picsum.photos/seed/sng36/44/44",    title: "The Girl from Ipanema",              artist: "Stan Getz",           band: "Getz/Gilberto",          year: 1963, tracks: 3,  type: "single",  status: "public"  },
  { id: "37", catalog: "COL45s7",  cover: "https://picsum.photos/seed/sng37/44/44",    title: "Freddie Freeloader",                 artist: "Miles Davis",         band: "Miles Davis Quintet",    year: 1959, tracks: 2,  type: "single",  status: "public"  },
  { id: "38", catalog: "IMP45s8",  cover: "https://picsum.photos/seed/sng38/44/44",    title: "Alabama",                            artist: "John Coltrane",       band: "Coltrane Quartet",       year: 1963, tracks: 2,  type: "single",  status: "private" },
  { id: "39", catalog: "BN45s9",   cover: "https://picsum.photos/seed/sng39/44/44",    title: "The Sidewinder",                     artist: "Lee Morgan",          band: "Lee Morgan Quintet",     year: 1964, tracks: 3,  type: "single",  status: "public"  },
  { id: "40", catalog: "COL45s10", cover: "https://picsum.photos/seed/sng40/44/44",    title: "Milestones",                         artist: "Miles Davis",                                         year: 1958, tracks: 2,  type: "single",  status: "public"  },

  // EPs
  { id: "41", catalog: "BNep1",    cover: "https://picsum.photos/seed/ep41/44/44",     title: "Interplay",                          artist: "Bill Evans",          band: "Bill Evans Trio",        year: 1962, tracks: 5,  type: "ep",      status: "public"  },
  { id: "42", catalog: "COLep2",   cover: "https://picsum.photos/seed/ep42/44/44",     title: "Workin' with the Miles Davis Quintet",artist: "Miles Davis",        band: "Miles Davis Quintet",    year: 1956, tracks: 5,  type: "ep",      status: "public"  },
  { id: "43", catalog: "PRep3",    cover: "https://picsum.photos/seed/ep43/44/44",     title: "Moving Out",                         artist: "Sonny Rollins",                                       year: 1954, tracks: 4,  type: "ep",      status: "private" },
  { id: "44", catalog: "ATLep4",   cover: "https://picsum.photos/seed/ep44/44/44",     title: "Tomorrow Is the Question!",          artist: "Ornette Coleman",                                     year: 1959, tracks: 5,  type: "ep",      status: "public"  },
  { id: "45", catalog: "IMPep5",   cover: "https://picsum.photos/seed/ep45/44/44",     title: "Duke Ellington & John Coltrane",     artist: "John Coltrane",                                       year: 1962, tracks: 6,  type: "ep",      status: "public"  },
  { id: "46", catalog: "VERep6",   cover: "https://picsum.photos/seed/ep46/44/44",     title: "Focus",                              artist: "Stan Getz",                                           year: 1961, tracks: 5,  type: "ep",      status: "private" },
  { id: "47", catalog: "BNep7",    cover: "https://picsum.photos/seed/ep47/44/44",     title: "Night Dreamer",                      artist: "Wayne Shorter",       band: "Shorter Quartet",        year: 1964, tracks: 5,  type: "ep",      status: "public"  },

  // Songs (individual tracks)
  { id: "48", catalog: "TRK001",   cover: "https://picsum.photos/seed/trk48/44/44",   title: "Take Five",                          artist: "Dave Brubeck",        band: "Brubeck Quartet",        year: 1959, tracks: 1,  type: "song",    status: "public"  },
  { id: "49", catalog: "TRK002",   cover: "https://picsum.photos/seed/trk49/44/44",   title: "Round Midnight",                     artist: "Thelonious Monk",                                     year: 1957, tracks: 1,  type: "song",    status: "public"  },
  { id: "50", catalog: "TRK003",   cover: "https://picsum.photos/seed/trk50/44/44",   title: "Autumn Leaves",                      artist: "Bill Evans",          band: "Bill Evans Trio",        year: 1959, tracks: 1,  type: "song",    status: "public"  },
  { id: "51", catalog: "TRK004",   cover: "https://picsum.photos/seed/trk51/44/44",   title: "My Funny Valentine",                 artist: "Miles Davis",         band: "Miles Davis Quintet",    year: 1964, tracks: 1,  type: "song",    status: "private" },
  { id: "52", catalog: "TRK005",   cover: "https://picsum.photos/seed/trk52/44/44",   title: "Naima",                              artist: "John Coltrane",       band: "Coltrane Quartet",       year: 1959, tracks: 1,  type: "song",    status: "public"  },
  { id: "53", catalog: "TRK006",   cover: "https://picsum.photos/seed/trk53/44/44",   title: "Straight, No Chaser",                artist: "Thelonious Monk",     band: "Monk Quartet",           year: 1951, tracks: 1,  type: "song",    status: "public"  },
  { id: "54", catalog: "TRK007",   cover: "https://picsum.photos/seed/trk54/44/44",   title: "Autumn in New York",                 artist: "Art Tatum",                                           year: 1952, tracks: 1,  type: "song",    status: "public"  },
  { id: "55", catalog: "TRK008",   cover: "https://picsum.photos/seed/trk55/44/44",   title: "All Blues",                          artist: "Miles Davis",         band: "Miles Davis Quintet",    year: 1959, tracks: 1,  type: "song",    status: "public"  },
  { id: "56", catalog: "TRK009",   cover: "https://picsum.photos/seed/trk56/44/44",   title: "Impressions",                        artist: "John Coltrane",       band: "Coltrane Quartet",       year: 1963, tracks: 1,  type: "song",    status: "private" },
  { id: "57", catalog: "TRK010",   cover: "https://picsum.photos/seed/trk57/44/44",   title: "Body and Soul",                      artist: "Coleman Hawkins",                                     year: 1939, tracks: 1,  type: "song",    status: "public"  },
  { id: "58", catalog: "TRK011",   cover: "https://picsum.photos/seed/trk58/44/44",   title: "Dolphin Dance",                      artist: "Herbie Hancock",      band: "Hancock Quintet",        year: 1965, tracks: 1,  type: "song",    status: "public"  },
  { id: "59", catalog: "TRK012",   cover: "https://picsum.photos/seed/trk59/44/44",   title: "Speak No Evil",                      artist: "Wayne Shorter",       band: "Shorter Quintet",        year: 1964, tracks: 1,  type: "song",    status: "public"  },
  { id: "60", catalog: "TRK013",   cover: "https://picsum.photos/seed/trk60/44/44",   title: "Footprints",                         artist: "Wayne Shorter",       band: "Shorter Quintet",        year: 1966, tracks: 1,  type: "song",    status: "private" },
]

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  album: "Album", single: "Single", ep: "EP", song: "Song",
}
const STATUS_LABELS: Record<ReleaseStatus, string> = {
  public: "Public", private: "Private",
}

// ─── Shared filter UI primitives ──────────────────────────────────────────────

const FILTER_TRIGGER_BASE = [
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border",
  "text-xs font-normal whitespace-nowrap transition-colors select-none cursor-pointer",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
].join(" ")

const filterTriggerCls = (active: boolean) => cn(
  FILTER_TRIGGER_BASE,
  active
    ? "border-foreground/40 bg-muted text-foreground"
    : "border-border bg-transparent text-foreground hover:border-foreground/20",
)

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
      {count != null && count > 0 && (
        <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-foreground text-background text-[10px] font-medium leading-none">
          {count}
        </span>
      )}
      <ChevronDown className="size-3 opacity-60" />
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
        label="Content Type"
        active={selected.size > 0}
        count={selected.size}
        onClick={() => setOpen(v => !v)}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setOpen(v => !v) }}
      />
      {open && (
        <FilterPopover>
          {(["album", "single", "ep", "song"] as ContentType[]).map(t => (
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
        <ChevronDown className="size-3 opacity-60" />
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

// ─── ResizeHandle ─────────────────────────────────────────────────────────────

function ResizeHandle({ colKey, onStart }: {
  colKey: ColKey
  onStart: (key: ColKey, e: React.MouseEvent) => void
}) {
  return (
    <div
      className="absolute right-0 top-0 h-full w-3 flex items-center justify-center cursor-col-resize select-none z-10"
      onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onStart(colKey, e) }}
    >
      <div className="w-px h-3/4 rounded-full bg-border opacity-0 group-hover/th:opacity-100 transition-opacity" />
    </div>
  )
}

// ─── TableHeader ──────────────────────────────────────────────────────────────

interface TableHeaderProps {
  colWidths:     Record<ColKey, number>
  visibleCols:   Record<ColKey, boolean>
  onResizeStart: (key: ColKey, e: React.MouseEvent) => void
}

function TableHeader({ colWidths, visibleCols, onResizeStart }: TableHeaderProps) {
  // Fixed-width resizable cell
  const cell = (key: ColKey, label: string) =>
    visibleCols[key] ? (
      <div
        key={key}
        className="relative shrink-0 flex items-center overflow-hidden group/th"
        style={{ width: colWidths[key] }}
      >
        <span className="text-xs font-normal text-muted-foreground truncate">
          {label}
        </span>
        <ResizeHandle colKey={key} onStart={onResizeStart} />
      </div>
    ) : null

  return (
    <div
      className="flex items-center w-full pb-1.5 border-b border-border"
      style={{ gap: COL_GAP, paddingLeft: 8, paddingRight: 8 }}
    >
      <div style={{ width: GRIP_W, flexShrink: 0 }} />
      <div style={{ width: NUM_W,  flexShrink: 0 }} />

      {cell("id",     "ID")}
      {cell("cover",  "Cover")}
      {cell("title",  "Title")}
      {cell("artist", "Main Artist")}
      {cell("band",   "Band")}
      {cell("year",   "Year")}
      {cell("tracks", "Tracks")}

      {/* Spacer — absorbs slack, groups Type/State/Action on right */}
      <div className="flex-1 min-w-0" />

      {cell("type",  "Type")}
      {cell("state", "State")}
      <div style={{ width: ACTION_W, flexShrink: 0 }} />
    </div>
  )
}

// ─── TableRow ─────────────────────────────────────────────────────────────────

interface TableRowProps {
  release:     Release
  index:       number
  colWidths:   Record<ColKey, number>
  visibleCols: Record<ColKey, boolean>
}

function TableRow({ release, index, colWidths, visibleCols }: TableRowProps) {
  const [status,       setStatus]       = useState<ReleaseStatus>(release.status)
  const [hovered,      setHovered]      = useState(false)
  const vis = visibleCols

  return (
    <div
      className={cn(
        "flex items-center w-full rounded-lg transition-colors cursor-default",
        hovered && "bg-muted",
      )}
      style={{ gap: COL_GAP, paddingLeft: 8, paddingRight: 8, height: 56 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Grip */}
      <div style={{ width: GRIP_W, flexShrink: 0 }} className="flex items-center justify-center">
        {hovered && <GripVertical className="size-3 text-foreground cursor-grab" />}
      </div>

      {/* # / checkbox — both always mounted, toggled via visibility to avoid layout shift */}
      <div style={{ width: NUM_W, flexShrink: 0 }} className="relative flex items-center justify-center">
        <span className={cn("text-xs font-normal text-muted-foreground tabular-nums transition-opacity", hovered ? "opacity-0" : "opacity-100")}>{index}</span>
        <div className={cn("absolute inset-0 flex items-center justify-center transition-opacity", hovered ? "opacity-100" : "opacity-0 pointer-events-none")}>
          <Checkbox className="after:hidden" />
        </div>
      </div>

      {vis.id && (
        <span className="text-xs font-normal text-muted-foreground truncate shrink-0" style={{ width: colWidths.id }}>
          {release.catalog}
        </span>
      )}

      {vis.cover && (
        <div
          className="shrink-0 rounded-xs bg-neutral-200 overflow-hidden"
          style={{ width: colWidths.cover, height: colWidths.cover }}
        >
          <img src={release.cover} alt={release.title} className="size-full object-cover" draggable={false} />
        </div>
      )}

      {vis.title && (
        <span className="text-xs font-normal text-foreground truncate shrink-0" style={{ width: colWidths.title }}>
          {release.title}
        </span>
      )}

      {vis.artist && (
        <span className="text-xs font-normal text-muted-foreground truncate shrink-0" style={{ width: colWidths.artist }}>
          {release.artist}
        </span>
      )}

      {vis.band && (
        <span className="text-xs font-normal text-muted-foreground truncate shrink-0" style={{ width: colWidths.band }}>
          {release.band ?? "—"}
        </span>
      )}

      {vis.year && (
        <span className="text-xs font-normal text-muted-foreground tabular-nums shrink-0" style={{ width: colWidths.year }}>
          {release.year}
        </span>
      )}

      {vis.tracks && (
        <span className="text-xs font-normal text-muted-foreground tabular-nums shrink-0" style={{ width: colWidths.tracks }}>
          {release.tracks}
        </span>
      )}

      {/* Spacer — mirrors header */}
      <div className="flex-1 min-w-0" />

      {vis.type && (
        <div className="shrink-0 overflow-hidden" style={{ width: colWidths.type }}>
          <ContentTypeBadge type={release.type} />
        </div>
      )}

      {vis.state && (
        <div className="shrink-0 flex" style={{ width: colWidths.state }}>
          <StatusBadge status={status} onStatusChange={setStatus} />
        </div>
      )}

      <div
        className="shrink-0 flex items-center justify-center"
        style={{ width: ACTION_W }}
      >
        {hovered && (
          <Button variant="ghost" size="icon" className="size-7">
            <Pencil className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── StudioMusicView ──────────────────────────────────────────────────────────

export function StudioMusicView({ onOpenUpload }: { onOpenUpload?: () => void }) {
  // Multi-select filters
  const [typeFilters,   setTypeFilters]   = useState<Set<ContentType>>(new Set())
  const [statusFilter,  setStatusFilter]  = useState<ReleaseStatus | "all">("all")
  // Multi-select artist combobox
  const [artistFilters, setArtistFilters] = useState<Set<string>>(new Set())

  const [searchQuery, setSearchQuery] = useState("")
  const [sortKey, setSortKey]         = useState<SortKey>("date")
  const [sortDir, setSortDir]         = useState<SortDir>("asc")
  const [view,    setView]            = useState<"list" | "grid">("list")

  const [colWidths,      setColWidths]      = useState<Record<ColKey, number>>(DEFAULT_WIDTHS)
  const [visibleCols,    setVisibleCols]    = useState<Record<ColKey, boolean>>({
    id: true, cover: true, title: true, artist: true, band: true,
    year: true, tracks: true, type: true, state: true,
  })
  // Cover auto-hide driven by ResizeObserver (separate from user toggle)
  const [autoCoverHide, setAutoCoverHide] = useState(false)

  const resizeRef      = useRef<{ col: ColKey; startX: number; startW: number } | null>(null)
  const tableWrapRef   = useRef<HTMLDivElement>(null)

  // Auto-hide cover when table container is too narrow
  useEffect(() => {
    const el = tableWrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setAutoCoverHide(entry.contentRect.width < COVER_HIDE_THRESHOLD)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  function handleResizeStart(col: ColKey, e: React.MouseEvent) {
    resizeRef.current = { col, startX: e.clientX, startW: colWidths[col] }
    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return
      const { col, startX, startW } = resizeRef.current
      setColWidths(prev => ({ ...prev, [col]: Math.max(MIN_WIDTHS[col], startW + (ev.clientX - startX)) }))
    }
    const onUp = () => {
      resizeRef.current = null
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup", onUp)
    }
    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onUp)
  }

  function toggleCol(key: ColKey) {
    const def = COL_DEFS.find(c => c.key === key)
    if (def?.required) return
    setVisibleCols(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function handleSortChange(key: SortKey) {
    if (key === sortKey) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("asc") }
  }

  // Effective visibility — cover obeys both user toggle AND auto-hide
  const effectiveVis: Record<ColKey, boolean> = {
    ...visibleCols,
    cover: visibleCols.cover && !autoCoverHide,
  }

  const isColsModified =
    COL_DEFS.some(({ key }) => !visibleCols[key]) ||
    (Object.keys(DEFAULT_WIDTHS) as ColKey[]).some(k => colWidths[k] !== DEFAULT_WIDTHS[k])

  const artists = Array.from(new Set(RELEASES.map(r => r.artist))).sort()

  const q = searchQuery.trim().toLowerCase()
  const filtered = sortReleases(
    RELEASES.filter(r => {
      if (typeFilters.size > 0   && !typeFilters.has(r.type))       return false
      if (statusFilter !== "all"  && r.status !== statusFilter)       return false
      if (artistFilters.size > 0 && !artistFilters.has(r.artist))   return false
      if (q && !`${r.title} ${r.artist} ${r.band ?? ""}`.toLowerCase().includes(q)) return false
      return true
    }),
    sortKey,
    sortDir,
  )

  const anyFilter = typeFilters.size > 0 || statusFilter !== "all" || artistFilters.size > 0 || q.length > 0

  return (
    <div ref={tableWrapRef} className="relative flex flex-col h-full">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-start justify-between gap-6 px-10 pt-8 pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Music</h1>
          <p className="text-sm font-normal text-muted-foreground mt-1">
            {RELEASES.length} releases
          </p>
        </div>
        <Button size="lg" className="shrink-0 gap-2" onClick={onOpenUpload}>
          <Upload className="size-4" />
          Upload music
        </Button>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-start gap-3 px-10 pb-4">

        {/* LEFT — filters */}
        <div className="flex items-start gap-2 flex-1 flex-wrap">
          <span className="text-xs font-normal text-muted-foreground h-9 flex items-center mr-1 shrink-0">Filter</span>

          {/* Content Type — multi-select */}
          <ContentTypeMultiSelect
            selected={typeFilters}
            onChange={setTypeFilters}
          />

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

          {/* Artist — multi-select combobox */}
          <ArtistMultiSelect
            options={artists}
            selected={artistFilters}
            onChange={setArtistFilters}
          />

          {/* Keyword search */}
          <div className="relative flex items-center">
            <Search className="absolute left-3 size-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search…"
              className={cn(
                "h-9 pl-8 pr-3 rounded-full border text-xs font-normal bg-transparent transition-all",
                "text-foreground placeholder:text-muted-foreground focus:outline-none",
                searchQuery
                  ? "border-foreground/40 bg-muted text-foreground w-44"
                  : "border-border text-foreground w-32 hover:border-foreground/20 focus:border-foreground/40 focus:bg-muted focus:w-44",
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

        {/* Divider */}
        <div className="h-9 flex items-center shrink-0">
          <div className="h-4 w-px bg-border" />
        </div>

        {/* RIGHT — table controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Sort — plain text, no active state, stable ArrowUpDown icon */}
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(
              "inline-flex items-center gap-1.5 h-9 px-3 text-xs font-normal whitespace-nowrap transition-colors",
              "text-foreground hover:opacity-70",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            )}>
              <ArrowUpDown className="size-3 shrink-0" />
              {SORT_LABELS[sortKey]}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-52">
              {(Object.keys(SORT_LABELS) as SortKey[]).map(k => (
                <DropdownMenuItem
                  key={k}
                  onClick={() => handleSortChange(k)}
                  closeOnClick={false}
                  className="text-foreground text-xs"
                >
                  <span className="w-4 flex items-center justify-center shrink-0">
                    {sortKey === k && (
                      sortDir === "asc"
                        ? <ArrowUp className="size-3" />
                        : <ArrowDown className="size-3" />
                    )}
                  </span>
                  {SORT_LABELS[k]}
                  {sortKey === k && (
                    <span className="ml-auto text-[10px] text-muted-foreground pl-4 tabular-nums">
                      click to reverse
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Columns */}
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(
              "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-xs font-normal whitespace-nowrap transition-colors",
              "border-border bg-transparent text-foreground hover:border-foreground/20",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            )}>
              <Columns2 className="size-3" />
              Columns
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
                    {required && <span className="ml-auto text-[10px] text-muted-foreground">required</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              {isColsModified && (
                <FilterPopoverClearAll
                  label="Reset"
                  onClear={() => {
                    setColWidths(DEFAULT_WIDTHS)
                    setVisibleCols({ id: true, cover: true, title: true, artist: true, band: true, year: true, tracks: true, type: true, state: true })
                  }}
                />
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View toggle — ModeToggle style */}
          <div className="flex items-center h-9 px-1 rounded-full bg-muted gap-0.5">
            <button
              onClick={() => setView("list")}
              className={cn(
                "size-7 flex items-center justify-center rounded-full transition-colors",
                view === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <List className="size-[14px]" />
            </button>
            <button
              onClick={() => setView("grid")}
              className={cn(
                "size-7 flex items-center justify-center rounded-full transition-colors",
                view === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid className="size-[14px]" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Active filter chips ──────────────────────────────────────── */}
      {anyFilter && (
        <div className="shrink-0 flex items-center gap-1.5 px-10 pb-3 flex-wrap">
          <button
            onClick={() => { setTypeFilters(new Set()); setStatusFilter("all"); setArtistFilters(new Set()); setSearchQuery("") }}
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
          {searchQuery && (
            <ChipDismiss onDismiss={() => setSearchQuery("")}>
              &ldquo;{searchQuery}&rdquo;
            </ChipDismiss>
          )}
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-10">
        <TableHeader
          colWidths={colWidths}
          visibleCols={effectiveVis}
          onResizeStart={handleResizeStart}
        />
      </div>

      <div className="flex-1 overflow-auto px-10 py-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <p className="text-sm font-normal text-muted-foreground">No releases match the current filters.</p>
            {anyFilter && (
              <button
                onClick={() => { setTypeFilters(new Set()); setStatusFilter("all"); setArtistFilters(new Set()); setSearchQuery("") }}
                className="text-xs font-normal text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-0.5 py-1">
            {filtered.map((r, i) => (
              <TableRow
                key={r.id}
                release={r}
                index={i + 1}
                colWidths={colWidths}
                visibleCols={effectiveVis}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
