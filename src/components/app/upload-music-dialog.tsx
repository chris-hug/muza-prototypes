"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge, ContentTypeBadge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Combobox, ComboboxContent, ComboboxGroup, ComboboxGroupLabel,
  ComboboxItem, ComboboxSeparator, ComboboxTrigger,
} from "@/components/ui/combobox"
import { useToast } from "@/components/ui/toast"
import { Switch } from "@/components/ui/switch"
import { RadioCard, RadioCardGroup } from "@/components/ui/radio-card"
import { InputSelect } from "@/components/ui/input-select"
import { cn } from "@/lib/utils"
import {
  Search, X, Check, CloudUpload, ImagePlus, Music2, Disc3,
  Plus, GripVertical, FileAudio, Loader2, ChevronRight,
  AlertTriangle, Trash2, Minimize2, Play, Shuffle,
  Share2, Info, MoreHorizontal, CheckCircle2,
  Radio as RadioIcon, ShoppingBag,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

type ContentType      = "album" | "single" | "ep"
type Step             = 1 | 2 | 3 | 4
type SearchMode       = "idle" | "searching" | "results" | "not-found"
type MonetizationType = "streaming" | "purchase"

interface Entity { id: string; name: string; type: "artist" | "label"; initials: string }
interface Release {
  id: string; title: string; mainArtists: string[]; band?: string
  label?: string; catalogNumber?: string; type: ContentType
  recordingDate?: string; tracks: number; country?: string; year: number
  coverUrl?: string
}
interface ReleaseForm {
  title: string; mainArtists: string[]; band: string; label: string
  catalogNumber: string; type: ContentType; recordingDate: string
  tracks: string; country: string
}
interface UploadFile { id: string; name: string; size: string; progress: number; done: boolean }
interface TrackRow {
  id: string; fileName: string; trackName: string; composer: string; lyricist: string
  duration: string; matchScore: number; assignedFile: string
}
interface MusicianEntry {
  id: string; name: string; instrument: string; matched: boolean
}
interface AdditionalRoles {
  producer: string; recording: string; mixing: string
  mastering: string; coverArt: string; linerNotes: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "JPY", label: "JPY" },
]

const ENTITIES: Entity[] = [
  { id: "a1", name: "Sun Ra",            type: "artist", initials: "SR" },
  { id: "a2", name: "Sun Ra Arkestra",   type: "artist", initials: "SA" },
  { id: "l1", name: "Saturn Records",    type: "label",  initials: "ST" },
  { id: "l2", name: "El Saturn Records", type: "label",  initials: "ES" },
]

const MOCK_RELEASES: Release[] = [
  { id: "r1",  title: "Space Is the Place",                mainArtists: ["Sun Ra"], band: "Sun Ra Arkestra", label: "Impulse!",          catalogNumber: "AS-9956",    type: "album",  tracks: 5,  country: "US", year: 1973, recordingDate: "1972", coverUrl: "https://picsum.photos/seed/sunra73/48/48" },
  { id: "r2",  title: "The Heliocentric Worlds of Sun Ra", mainArtists: ["Sun Ra"], band: "Sun Ra Arkestra", label: "ESP-Disk",           catalogNumber: "ESP-1014",   type: "album",  tracks: 6,  country: "US", year: 1965,                        coverUrl: "https://picsum.photos/seed/sunra65/48/48" },
  { id: "r3",  title: "Atlantis",                          mainArtists: ["Sun Ra"],                          label: "El Saturn Records", catalogNumber: "SaturnLP508", type: "album",  tracks: 6,               year: 1969,                        coverUrl: "https://picsum.photos/seed/sunra69/48/48" },
  { id: "r4",  title: "Nuclear War",                       mainArtists: ["Sun Ra"],                                                                                    type: "single", tracks: 2,               year: 1982,                        coverUrl: "https://picsum.photos/seed/sunra82/48/48" },
  { id: "r5",  title: "Outer Spaceways Incorporated",      mainArtists: ["Sun Ra"],                                                                                    type: "single", tracks: 2,               year: 1968,                        coverUrl: "https://picsum.photos/seed/sunra68/48/48" },
  { id: "r6",  title: "Sleeping Beauty",                   mainArtists: ["Sun Ra"],                          label: "Saturn Records",                                  type: "album",  tracks: 4,               year: 1979,                        coverUrl: "https://picsum.photos/seed/sunra79/48/48" },
  { id: "r7",  title: "Angels and Demons at Play",         mainArtists: ["Sun Ra"], band: "Sun Ra Arkestra", label: "El Saturn Records", catalogNumber: "ESR-507",     type: "album",  tracks: 8,  country: "US", year: 1965,                        coverUrl: "https://picsum.photos/seed/sunra65b/48/48" },
  { id: "r8",  title: "The Magic City",                    mainArtists: ["Sun Ra"],                          label: "El Saturn Records", catalogNumber: "ESR-408",     type: "album",  tracks: 2,               year: 1966,                        coverUrl: "https://picsum.photos/seed/sunra66/48/48" },
  { id: "r9",  title: "Lanquidity",                        mainArtists: ["Sun Ra"], band: "Sun Ra Arkestra", label: "Philly Jazz",       catalogNumber: "PJ-1001",     type: "album",  tracks: 6,  country: "US", year: 1978,                        coverUrl: "https://picsum.photos/seed/sunra78/48/48" },
  { id: "r10", title: "Strange Strings",                   mainArtists: ["Sun Ra"],                          label: "El Saturn Records",                               type: "album",  tracks: 4,               year: 1967,                        coverUrl: "https://picsum.photos/seed/sunra67/48/48" },
  { id: "r11", title: "Holiday for Soul Dance",            mainArtists: ["Sun Ra"],                          label: "El Saturn Records",                               type: "album",  tracks: 8,               year: 1970,                        coverUrl: "https://picsum.photos/seed/sunra70/48/48" },
  { id: "r12", title: "Sun Song",                          mainArtists: ["Sun Ra"], band: "Sun Ra Arkestra", label: "Transition",        catalogNumber: "J-10",        type: "album",  tracks: 10, country: "US", year: 1956,                        coverUrl: "https://picsum.photos/seed/sunra56/48/48" },
  { id: "r13", title: "Interstellar Low Ways",             mainArtists: ["Sun Ra"],                          label: "El Saturn Records",                               type: "album",  tracks: 7,               year: 1966,                        coverUrl: "https://picsum.photos/seed/sunra66b/48/48" },
  { id: "r14", title: "Discipline 27-II",                  mainArtists: ["Sun Ra"], band: "Sun Ra Arkestra", label: "El Saturn Records",                               type: "album",  tracks: 5,  country: "US", year: 1969,                        coverUrl: "https://picsum.photos/seed/sunra69b/48/48" },
  { id: "r15", title: "My Brother the Wind Vol. II",       mainArtists: ["Sun Ra"],                          label: "El Saturn Records",                               type: "album",  tracks: 6,               year: 1970,                        coverUrl: "https://picsum.photos/seed/sunra70b/48/48" },
  { id: "r16", title: "Astro Black",                       mainArtists: ["Sun Ra"], band: "Sun Ra Arkestra", label: "Impulse!",          catalogNumber: "AS-9255",     type: "album",  tracks: 6,  country: "US", year: 1973,                        coverUrl: "https://picsum.photos/seed/sunra73b/48/48" },
  { id: "r17", title: "Cosmos",                            mainArtists: ["Sun Ra"],                          label: "El Saturn Records",                               type: "ep",     tracks: 3,               year: 1976,                        coverUrl: "https://picsum.photos/seed/sunra76/48/48" },
  { id: "r18", title: "Sunrise in Different Dimensions",   mainArtists: ["Sun Ra"], band: "Sun Ra Arkestra", label: "hat HUT",           catalogNumber: "2R08",        type: "album",  tracks: 10, country: "CH", year: 1980,                        coverUrl: "https://picsum.photos/seed/sunra80/48/48" },
]

const MOCK_FILES: UploadFile[] = [
  { id: "f1", name: "SunRa_SpaceIsThePlace_Take01.wav",  size: "82.3 MB", progress: 100, done: true },
  { id: "f2", name: "SunRa_HelioCentricWorlds_01.wav",   size: "74.1 MB", progress: 100, done: true },
  { id: "f3", name: "SunRa_Atlantis_Side1_Master.wav",   size: "91.7 MB", progress: 100, done: true },
]

const MOCK_TRACKS: TrackRow[] = [
  { id: "t1", fileName: "SunRa_SpaceIsThePlace_Take01.wav", trackName: "Space Is the Place", composer: "Sun Ra", lyricist: "Sun Ra", duration: "4:54",  matchScore: 80, assignedFile: "f1" },
  { id: "t2", fileName: "SunRa_HelioCentricWorlds_01.wav",  trackName: "Heliocentric",        composer: "Sun Ra", lyricist: "",       duration: "12:18", matchScore: 80, assignedFile: "f2" },
  { id: "t3", fileName: "SunRa_Atlantis_Side1_Master.wav",  trackName: "Atlantis",            composer: "Sun Ra", lyricist: "",       duration: "8:37",  matchScore: 20, assignedFile: "f3" },
]

const TYPE_LABELS: Record<ContentType, string> = { album: "Album", single: "Single", ep: "EP" }
const STEP_LABELS = ["Release Info", "Monetisation", "Track matching", "Preview"]

// Table constants — exact My Music values
const COL_GAP  = 16
const GRIP_W   = 16
const NUM_W    = 24
const ACTION_W = 36

// ─── Shared primitives ────────────────────────────────────────────────────────

function EntityAvatar({ initials, size = "md" }: { initials: string; size?: "sm" | "md" | "lg" }) {
  return (
    <div className={cn(
      "rounded-full bg-secondary flex items-center justify-center shrink-0 font-medium text-secondary-foreground select-none",
      size === "sm" ? "size-7 text-xsmall"
        : size === "lg" ? "size-14 text-base"
        : "size-11 text-small"
    )}>
      {initials}
    </div>
  )
}


function MatchBadge({ score }: { score: number }) {
  const good = score >= 60
  return (
    <Badge className={cn(
      good ? "bg-green-50 text-green-700 border-transparent" : "bg-red-50 text-red-600 border-transparent"
    )}>
      {good ? <Check className="size-3" /> : <AlertTriangle className="size-3" />}
      {score}%
    </Badge>
  )
}

function CoverPlaceholder({ size = "sm", src }: { size?: "xs" | "sm" | "lg"; src?: string }) {
  const sizeClass = size === "lg" ? "size-56" : size === "xs" ? "size-8" : "size-12"
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt="Release cover"
        className={cn("rounded-xs shrink-0 object-cover shadow-sm", sizeClass)}
      />
    )
  }
  return (
    <div className={cn(
      "rounded-xs bg-secondary shrink-0 flex items-center justify-center shadow-sm",
      sizeClass
    )}>
      <Music2 className={cn(
        "text-muted-foreground",
        size === "lg" ? "size-10" : size === "xs" ? "size-3" : "size-4"
      )} />
    </div>
  )
}

// Shared release summary row — 3 variants share the same inner layout
function ReleaseRow({ release }: { release: { title: string; mainArtists: string[]; year: number; type: ContentType; coverUrl?: string } }) {
  return (
    <>
      <CoverPlaceholder src={release.coverUrl} />
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <p className="text-small font-normal leading-none truncate">{release.title}</p>
        <div className="flex items-center gap-1.5">
          <ContentTypeBadge type={release.type} />
          <span className="text-small text-muted-foreground font-normal truncate">
            {release.mainArtists[0]} · {release.year}
          </span>
        </div>
      </div>
    </>
  )
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xsmall text-muted-foreground font-normal">{label}</p>
      <p className="text-small font-normal">{value}</p>
    </div>
  )
}

// ─── Top nav bar ──────────────────────────────────────────────────────────────

function TopNavBar({
  step, onBack, onCancel, onMinimize, onContinue, canContinue, isLastStep,
}: {
  step: Step; onBack: () => void; onCancel: () => void
  onMinimize: () => void; onContinue: () => void
  canContinue: boolean; isLastStep: boolean
}) {
  return (
    <header className="shrink-0 relative flex items-center px-6 border-b border-border py-6">
      {/* Stepper — absolutely centered, never shifts with button changes */}
      <div className="absolute inset-x-0 flex justify-center pointer-events-none">
        <div className="flex items-start" style={{ width: 600 }}>
          {STEP_LABELS.map((label, i) => {
            const num    = (i + 1) as Step
            const done   = step > num
            const active = step === num
            return (
              <div key={num} className="flex items-center flex-1">
                {/* Step column */}
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className={cn(
                    "size-6 rounded-full flex items-center justify-center text-xsmall font-normal transition-colors shrink-0",
                    done || active ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"
                  )}>
                    {done ? <Check className="size-3" /> : num}
                  </div>
                  <p className={cn(
                    "text-small font-normal text-center leading-tight whitespace-nowrap transition-colors",
                    active ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {label}
                  </p>
                </div>
                {/* Connector: 8px gap from each circle edge */}
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className={cn("h-px shrink-0 transition-colors mt-3", done ? "bg-foreground/40" : "bg-border")}
                    style={{ width: 32, marginLeft: 8, marginRight: 8 }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Right: minimize + back/cancel + continue */}
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onMinimize}
          className="size-9 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors"
          title="Minimise"
        >
          <Minimize2 className="size-4" />
        </button>
        {step > 1
          ? <Button variant="secondary" onClick={onBack}>Back</Button>
          : <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        }
        <Button onClick={onContinue} disabled={!canContinue}>
          {isLastStep ? "Publish" : "Next"}
        </Button>
      </div>
    </header>
  )
}

// ─── ReleaseSearchDropdown ────────────────────────────────────────────────────

function ReleaseSearchDropdown({
  searchQuery, onSearchChange, searchMode, searchResults,
  onSelectRelease, onCreateNew,
}: {
  searchQuery: string; onSearchChange: (q: string) => void
  searchMode: SearchMode; searchResults: Release[]
  onSelectRelease: (r: Release) => void; onCreateNew: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)

  // total navigable items: search results + "create new" at the end
  const itemCount = (searchMode === "results" ? searchResults.length : 0) + 1
  const createNewIndex = searchMode === "results" ? searchResults.length : 0

  // reset focus when results change
  useEffect(() => { setFocusedIndex(-1) }, [searchResults, searchMode])

  // open dropdown when we have results or not-found, with 2+ chars (unless submitted)
  useEffect(() => {
    if (!submitted && searchQuery.length >= 2 && (searchMode === "results" || searchMode === "not-found")) {
      setOpen(true)
    } else if (searchQuery.length < 2) {
      setOpen(false)
      setSubmitted(false)
    }
  }, [searchQuery, searchMode, submitted])

  // close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      onSearchChange("")
      setOpen(false)
      setSubmitted(false)
      setFocusedIndex(-1)
      return
    }
    const listVisible = (open && !submitted) || showInlineResults
    if (e.key === "ArrowDown") {
      e.preventDefault()
      if (listVisible) setFocusedIndex(i => Math.min(i + 1, itemCount - 1))
      return
    }
    if (e.key === "ArrowUp") {
      e.preventDefault()
      if (listVisible) setFocusedIndex(i => Math.max(i - 1, 0))
      return
    }
    if (e.key === "Enter" && searchQuery.length >= 2) {
      if (focusedIndex === createNewIndex && listVisible) {
        onCreateNew(); setOpen(false); setSubmitted(false); return
      }
      if (focusedIndex >= 0 && focusedIndex < createNewIndex && searchMode === "results" && listVisible) {
        onSelectRelease(searchResults[focusedIndex]); setOpen(false); setSubmitted(false); onSearchChange(""); return
      }
      // no focused item — submit search inline
      setSubmitted(true)
      setOpen(false)
    }
  }

  const showInlineResults = submitted && (searchMode === "results" || searchMode === "not-found" || searchMode === "searching")

  return (
    <div className="flex flex-col gap-2">
      {/* Search input */}
      <div ref={containerRef} className="relative">
        <div className="flex items-center gap-2 h-10 px-3 rounded-full border border-border bg-background focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 transition-colors">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            value={searchQuery}
            onChange={e => {
              onSearchChange(e.target.value)
              setSubmitted(false)
              setFocusedIndex(-1)
              if (e.target.value.length >= 2) setOpen(true)
            }}
            onFocus={() => {
              if (!submitted && searchQuery.length >= 2 && (searchMode === "results" || searchMode === "not-found")) setOpen(true)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter title"
            className="flex-1 bg-transparent text-small font-normal outline-none text-foreground placeholder:text-muted-foreground"
          />
          {searchMode === "searching" && <Loader2 className="size-4 text-muted-foreground animate-spin shrink-0" />}
          {searchQuery && searchMode !== "searching" && (
            <button onClick={() => { onSearchChange(""); setOpen(false); setSubmitted(false); setFocusedIndex(-1) }} className="text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Dropdown (only when not submitted) */}
        {open && !submitted && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover rounded-xl border border-border shadow-md overflow-hidden p-1">
            {searchMode === "results" && searchResults.map((r, i) => (
              <button
                key={r.id}
                onClick={() => { onSelectRelease(r); setOpen(false); onSearchChange("") }}
                className={`group relative flex items-center gap-3 w-full px-2.5 py-3 rounded-lg text-left transition-colors overflow-hidden ${focusedIndex === i ? "bg-accent" : "hover:bg-accent"}`}
              >
                <ReleaseRow release={r} />
                <div className={`pointer-events-none absolute right-0 top-0 h-full w-28 bg-gradient-to-l ${focusedIndex === i ? "from-accent" : "from-popover group-hover:from-accent"} to-transparent transition-colors`} />
              </button>
            ))}

            {searchMode === "not-found" && (
              <div className="px-3 py-3 text-xsmall text-muted-foreground font-normal">
                No releases found for "{searchQuery}"
              </div>
            )}

            {/* Separator + Create new — always at bottom */}
            <div className="border-t border-border mx-1 my-1" />
            <button
              onClick={() => { onCreateNew(); setOpen(false) }}
              className={`flex items-center gap-3 w-full px-2.5 py-3 rounded-lg bg-muted text-left transition-colors ${focusedIndex === createNewIndex ? "bg-accent" : "hover:bg-accent"}`}
            >
              <div className="size-12 rounded-xs bg-primary shrink-0 flex items-center justify-center">
                <Plus className="size-4 text-primary-foreground" />
              </div>
              <div className="flex flex-col gap-0 min-w-0">
                <p className="text-small font-medium text-foreground">Create new release</p>
                <p className="-mt-1 text-small text-muted-foreground font-normal">
                  {searchQuery ? `Add "${searchQuery}" manually` : "Add a release manually"}
                </p>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Inline results (after Enter) */}
      {showInlineResults && (
        <div className="flex flex-col">
          <p className="px-2.5 pt-1 pb-2 text-xsmall text-muted-foreground font-normal">
            {searchMode === "searching" ? `Searching for "${searchQuery}"…` : `Results for "${searchQuery}"`}
          </p>
          {searchMode === "searching" && (
            <div className="flex items-center gap-2 px-2.5 py-3 text-xsmall text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Searching…
            </div>
          )}
          {searchMode === "results" && searchResults.map((r, i) => (
            <button
              key={r.id}
              onClick={() => { onSelectRelease(r); setSubmitted(false); onSearchChange("") }}
              className={`group relative flex items-center gap-3 w-full px-2.5 py-3 rounded-lg text-left transition-colors overflow-hidden ${focusedIndex === i ? "bg-accent" : "hover:bg-accent"}`}
            >
              <ReleaseRow release={r} />
              <div className={`pointer-events-none absolute right-0 top-0 h-full w-28 bg-gradient-to-l ${focusedIndex === i ? "from-accent" : "from-background group-hover:from-accent"} to-transparent transition-colors`} />
            </button>
          ))}
          {searchMode === "not-found" && (
            <div className="px-2.5 py-3 text-xsmall text-muted-foreground font-normal">
              No releases found for "{searchQuery}"
            </div>
          )}
          <button
            onClick={() => { onCreateNew(); setSubmitted(false) }}
            className={`flex items-center gap-3 w-full px-2.5 py-3 rounded-lg bg-muted text-left transition-colors ${focusedIndex === createNewIndex ? "bg-accent" : "hover:bg-accent"}`}
          >
            <div className="size-12 rounded-xs bg-primary shrink-0 flex items-center justify-center">
              <Plus className="size-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col gap-0 min-w-0">
              <p className="text-small font-medium text-foreground">Create new release</p>
              <p className="-mt-1 text-small text-muted-foreground font-normal">
                {searchQuery ? `Add "${searchQuery}" manually` : "Add a release manually"}
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Idle hint */}
      {searchMode === "idle" && (
        <p className="text-xsmall text-muted-foreground font-normal px-1">
          Details looked up from MusicBrainz and Discogs
        </p>
      )}
    </div>
  )
}

// ─── SelectedReleaseCard ─────────────────────────────────────────────────────

function SelectedReleaseCard({
  release, musicians, additionalRoles, onChangeRelease,
}: {
  release: Release
  musicians: MusicianEntry[]
  additionalRoles: AdditionalRoles
  onChangeRelease: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <ReleaseRow release={release} />
        <Button variant="secondary" size="sm" onClick={onChangeRelease} className="shrink-0">
          Change
        </Button>
      </div>

      {/* Release fields — always visible */}
      <div className="border-t border-border" />
      <div className="px-8 py-6 flex flex-col gap-4">
        <p className="text-small font-medium">General info</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <InfoField label="Main Artist"     value={release.mainArtists.join(", ")} />
          <InfoField label="Band Name"       value={release.band ?? "—"} />
          <InfoField label="Release title"   value={release.title} />
          <InfoField label="Label"           value={release.label ?? "—"} />
          <InfoField label="Catalog Number"  value={release.catalogNumber ?? "—"} />
          <InfoField label="Release Type"    value={TYPE_LABELS[release.type]} />
          <InfoField label="Recording date"  value={release.recordingDate ?? String(release.year)} />
          <InfoField label="Tracks"          value={String(release.tracks)} />
          <InfoField label="Country"         value={release.country ?? "—"} />
        </div>
      </div>

      {/* Expanded credits */}
      {expanded && (
        <>
          <div className="border-t border-border" />
          <div className="px-8 py-6 flex flex-col gap-6">
            <p className="text-small font-medium">Credits</p>
            {/* Musicians */}
            {musicians.length > 0 && (
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                {musicians.map(m => (
                  <InfoField key={m.id} label="Musician" value={m.name || "—"} />
                ))}
              </div>
            )}
            {/* Additional roles */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <InfoField label="Producer"              value={additionalRoles.producer || "—"} />
              <InfoField label="Recording engineer"    value={additionalRoles.recording || "—"} />
              <InfoField label="Mixing engineer"       value={additionalRoles.mixing || "—"} />
              <InfoField label="Mastering engineer"    value={additionalRoles.mastering || "—"} />
              <InfoField label="Cover art"             value={additionalRoles.coverArt || "—"} />
            </div>
            {additionalRoles.linerNotes && (
              <InfoField label="Liner notes" value={additionalRoles.linerNotes} />
            )}
          </div>
        </>
      )}

      {/* Show more / less */}
      <div className="border-t border-border flex justify-center py-3">
        <Button variant="ghost" size="sm" onClick={() => setExpanded(v => !v)}>
          {expanded ? "Show less" : "Show more"}
        </Button>
      </div>
    </div>
  )
}

// ─── CreditsSection ───────────────────────────────────────────────────────────

function CreditsSection({
  musicians, onAddMusician, onRemoveMusician,
  additionalRoles, onAdditionalRolesChange,
}: {
  musicians: MusicianEntry[]
  onAddMusician: (name: string, instrument: string) => void
  onRemoveMusician: (id: string) => void
  additionalRoles: AdditionalRoles
  onAdditionalRolesChange: (r: AdditionalRoles) => void
}) {
  const [drafts, setDrafts] = useState<{ id: string; name: string; instrument: string }[]>([
    { id: crypto.randomUUID(), name: "", instrument: "" },
  ])

  function commitDraft(i: number) {
    const d = drafts[i]
    if (d.name.trim()) onAddMusician(d.name.trim(), d.instrument.trim())
    setDrafts(prev => prev.filter((_, j) => j !== i))
  }

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-small font-medium">Credits</h2>

      {/* Musicians */}
      <div className="flex flex-col gap-2">
        <Label>Musicians</Label>

        {/* Committed musicians — read-only rows */}
        {musicians.map(m => (
          <div key={m.id} className="flex items-center gap-2">
            <div className="h-10 flex-1 min-w-0 rounded-full border border-border bg-muted px-3 py-2 text-small font-normal text-muted-foreground flex items-center truncate">
              {m.name}
            </div>
            <div className="h-10 flex-1 min-w-0 rounded-full border border-border bg-muted px-3 py-2 text-small font-normal text-muted-foreground flex items-center truncate">
              {m.instrument || <span className="opacity-50">Instrument</span>}
            </div>
            <button
              onClick={() => onRemoveMusician(m.id)}
              className="size-8 shrink-0 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}

        {/* Draft rows — editable */}
        {drafts.map((d, i) => (
          <div key={d.id} className="flex items-center gap-2">
            <Input
              value={d.name}
              onChange={e => setDrafts(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
              onKeyDown={e => { if (e.key === "Enter") commitDraft(i) }}
              placeholder="Name"
              className="text-small font-normal"
            />
            <Input
              value={d.instrument}
              onChange={e => setDrafts(prev => prev.map((x, j) => j === i ? { ...x, instrument: e.target.value } : x))}
              onKeyDown={e => { if (e.key === "Enter") commitDraft(i) }}
              placeholder="Instrument"
              className="text-small font-normal"
            />
            <button
              onClick={() => commitDraft(i)}
              className="size-8 shrink-0 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}

        <Button
          variant="secondary" size="sm" className="self-start gap-1.5"
          onClick={() => setDrafts(prev => [...prev, { id: crypto.randomUUID(), name: "", instrument: "" }])}
        >
          <Plus className="size-3.5" />Add musician
        </Button>
      </div>

      {/* Additional credits */}
      <div className="flex flex-col gap-3">
        <Label>Additional credits</Label>
        <div className="flex flex-col gap-4">
          {(["producer", "recording", "mixing", "mastering", "coverArt"] as const).map(key => (
            <div key={key} className="flex flex-col gap-1.5">
              <Label className="capitalize">
                {key === "coverArt" ? "Cover art" : key.charAt(0).toUpperCase() + key.slice(1)}
              </Label>
              <Input
                value={additionalRoles[key]}
                onChange={e => onAdditionalRolesChange({ ...additionalRoles, [key]: e.target.value })}
                placeholder="Name"
                className="h-9 text-small font-normal"
              />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Liner notes</Label>
          <Textarea
            value={additionalRoles.linerNotes}
            onChange={e => onAdditionalRolesChange({ ...additionalRoles, linerNotes: e.target.value })}
            placeholder="Liner notes text…"
            className="resize-none min-h-[80px] text-small font-normal"
          />
        </div>
      </div>
    </div>
  )
}

// ─── NewReleaseForm ───────────────────────────────────────────────────────────

function NewReleaseForm({ form, onChange, entityName }: { form: ReleaseForm; onChange: (f: ReleaseForm) => void; entityName: string }) {
  return (
    <div className="flex flex-col gap-4">
      {/* 1. Main Artist(s) */}
      <div className="flex flex-col gap-1.5">
        <Label>Main Artist(s)</Label>
        <div className="flex flex-col gap-2">
          {/* First artist — locked, pre-filled from entity. Spans full
              width since it has no remove button to align with. */}
          <div className="h-10 w-full min-w-0 rounded-full border border-border bg-muted px-3 py-2 text-small font-normal text-muted-foreground flex items-center truncate">
            {entityName}
          </div>
          {/* Additional artists — editable */}
          {form.mainArtists.map((a, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={a}
                onChange={e => {
                  const next = [...form.mainArtists]; next[i] = e.target.value
                  onChange({ ...form, mainArtists: next })
                }}
                placeholder="Artist name"
                className="text-small font-normal"
              />
              <button
                onClick={() => onChange({ ...form, mainArtists: form.mainArtists.filter((_, j) => j !== i) })}
                className="size-8 shrink-0 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          <Button
            variant="secondary" size="sm" className="self-start gap-1.5"
            onClick={() => onChange({ ...form, mainArtists: [...form.mainArtists, ""] })}
          >
            <Plus className="size-3.5" />Add artist
          </Button>
        </div>
      </div>

      {/* 2. Release title */}
      <div className="flex flex-col gap-1.5">
        <Label>Release title</Label>
        <Input
          autoFocus
          value={form.title}
          onChange={e => onChange({ ...form, title: e.target.value })}
          placeholder="Title"
          className="text-small font-normal"
        />
      </div>

      {/* 3. Band name */}
      <div className="flex flex-col gap-1.5">
        <Label>Band name</Label>
        <Input
          value={form.band}
          onChange={e => onChange({ ...form, band: e.target.value })}
          placeholder="Band / ensemble"
          className="text-small font-normal"
        />
      </div>

      {/* 4. Label */}
      <div className="flex flex-col gap-1.5">
        <Label>Label</Label>
        <Input
          value={form.label}
          onChange={e => onChange({ ...form, label: e.target.value })}
          placeholder="Record label"
          className="text-small font-normal"
        />
      </div>

      {/* 5. Catalog number */}
      <div className="flex flex-col gap-1.5">
        <Label>Catalog number</Label>
        <Input
          value={form.catalogNumber}
          onChange={e => onChange({ ...form, catalogNumber: e.target.value })}
          placeholder="e.g. ABC-123"
          className="text-small font-normal"
        />
      </div>

      {/* 6. Release type */}
      <div className="flex flex-col gap-1.5">
        <Label>Release type</Label>
        <Select value={form.type} onValueChange={v => onChange({ ...form, type: v as ContentType })}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="album">Album</SelectItem>
            <SelectItem value="single">Single</SelectItem>
            <SelectItem value="ep">EP</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 7. Recording date */}
      <div className="flex flex-col gap-1.5">
        <Label>Recording date</Label>
        <Input
          value={form.recordingDate}
          onChange={e => onChange({ ...form, recordingDate: e.target.value })}
          placeholder="e.g. 1973"
          className="text-small font-normal"
        />
      </div>

      {/* 8. Tracks */}
      <div className="flex flex-col gap-1.5">
        <Label>Tracks</Label>
        <Input
          value={form.tracks}
          onChange={e => onChange({ ...form, tracks: e.target.value })}
          placeholder="e.g. 12"
          className="text-small font-normal"
        />
      </div>

      {/* 9. Country */}
      <div className="flex flex-col gap-1.5">
        <Label>Country</Label>
        <Input
          value={form.country}
          onChange={e => onChange({ ...form, country: e.target.value })}
          placeholder="e.g. US"
          className="text-small font-normal"
        />
      </div>
    </div>
  )
}

// ─── StepRelease ──────────────────────────────────────────────────────────────

function StepRelease({
  entityId, onEntityChange,
  searchQuery, onSearchChange, searchMode, searchResults,
  selectedRelease, isCreatingNew, newForm, onNewFormChange,
  musicians, onAddMusician, onRemoveMusician,
  additionalRoles, onAdditionalRolesChange,
  onSelectRelease, onCreateNew, onChangeRelease,
  onContinue,
}: {
  entityId: string; onEntityChange: (id: string) => void
  searchQuery: string; onSearchChange: (q: string) => void
  searchMode: SearchMode; searchResults: Release[]
  selectedRelease: Release | null; isCreatingNew: boolean; newForm: ReleaseForm
  onSelectRelease: (r: Release) => void; onCreateNew: () => void
  onChangeRelease: () => void; onNewFormChange: (f: ReleaseForm) => void
  musicians: MusicianEntry[]
  onAddMusician: (name: string, instrument: string) => void
  onRemoveMusician: (id: string) => void
  additionalRoles: AdditionalRoles
  onAdditionalRolesChange: (r: AdditionalRoles) => void
  onContinue: () => void
}) {
  // Visual mode within step 1
  type StepMode = "input" | "results" | "details" | "create"
  const [stepMode, setStepMode] = useState<StepMode>("input")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [confirmed, setConfirmed] = useState(false)
  const [collecting, setCollecting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const hasTitle = searchQuery.trim().length > 0
  const suggestions = searchResults.slice(0, 5)

  // Reset to input if query cleared
  useEffect(() => {
    if (!searchQuery) { setStepMode("input"); setShowSuggestions(false) }
  }, [searchQuery])

  // Reset confirmed whenever query changes
  useEffect(() => { setConfirmed(false) }, [searchQuery])

  // Sync back when parent resets (e.g. onChangeRelease)
  useEffect(() => {
    if (!selectedRelease && !isCreatingNew) setStepMode("input")
  }, [selectedRelease, isCreatingNew])

  const [entityInputValue, setEntityInputValue] = useState(
    ENTITIES.find(e => e.id === entityId)?.name ?? ""
  )
  useEffect(() => {
    setEntityInputValue(ENTITIES.find(e => e.id === entityId)?.name ?? "")
  }, [entityId])

  function selectRelease(r: Release) {
    onSelectRelease(r)
    setStepMode("details")
    setShowSuggestions(false)
  }

  function goCreate() {
    onCreateNew()
    setStepMode("create")
    setShowSuggestions(false)
  }

  function goResults() {
    setStepMode("results")
    setShowSuggestions(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") { setShowSuggestions(false); setFocusedIndex(-1); return }
    if (e.key === "ArrowDown") { e.preventDefault(); setFocusedIndex(i => Math.min(i + 1, suggestions.length - 1)); return }
    if (e.key === "ArrowUp")   { e.preventDefault(); setFocusedIndex(i => Math.max(i - 1, 0)); return }
    if (e.key === "Enter" && hasTitle) {
      e.preventDefault()
      if (focusedIndex >= 0 && suggestions[focusedIndex]) {
        selectRelease(suggestions[focusedIndex])
      } else {
        setShowSuggestions(false)
        setFocusedIndex(-1)
        setCollecting(true)
        setTimeout(() => { setCollecting(false); goResults() }, 1200)
      }
    }
  }

  const EntityCombobox = (
    <div className="flex flex-col gap-1.5">
      <Label>Upload as</Label>
      <Combobox
        value={entityId}
        onValueChange={(v) => {
          if (v) { onEntityChange(v as string); setEntityInputValue(ENTITIES.find(e => e.id === v)?.name ?? "") }
        }}
        inputValue={entityInputValue}
        onInputValueChange={(v) => {
          const entity = ENTITIES.find(e => e.id === v)
          setEntityInputValue(entity ? entity.name : v)
        }}
      >
        <ComboboxTrigger placeholder="Search artist or label…" showSearchIcon={false} />
        <ComboboxContent>
          <ComboboxGroup>
            <ComboboxGroupLabel>Upload as artist</ComboboxGroupLabel>
            {ENTITIES.filter(e => e.type === "artist").map(entity => (
              <ComboboxItem key={entity.id} value={entity.id} hideIndicator className="py-2.5 gap-3">
                <div className="size-11 rounded-full bg-secondary flex items-center justify-center shrink-0 font-medium text-secondary-foreground text-xsmall shadow-sm select-none">{entity.initials}</div>
                {entity.name}
              </ComboboxItem>
            ))}
          </ComboboxGroup>
          <ComboboxSeparator />
          <ComboboxGroup>
            <ComboboxGroupLabel>Upload as label</ComboboxGroupLabel>
            {ENTITIES.filter(e => e.type === "label").map(entity => (
              <ComboboxItem key={entity.id} value={entity.id} hideIndicator className="py-2.5 gap-3">
                <div className="size-11 rounded-full bg-secondary flex items-center justify-center shrink-0 font-medium text-secondary-foreground text-xsmall shadow-sm select-none">{entity.initials}</div>
                {entity.name}
              </ComboboxItem>
            ))}
          </ComboboxGroup>
        </ComboboxContent>
      </Combobox>
    </div>
  )

  // ── input mode ──────────────────────────────────────────────────────────────
  if (stepMode === "input") return (
    <div className="overflow-y-auto flex-1 px-16 pt-6 pb-8">
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h1 className="text-xlarge font-medium">Release Info</h1>
        <p className="text-small text-muted-foreground font-normal mt-1">Details looked up from MusicBrainz and Discogs</p>
      </div>
      {EntityCombobox}
      <div className="flex flex-col gap-1.5">
        <Label>Release title</Label>
        <div className="relative">
          <div className="flex items-center gap-2 h-10 px-3 rounded-full border border-border bg-background focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 transition-colors">
            <Search className="size-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={searchQuery}
              onChange={e => { onSearchChange(e.target.value); setShowSuggestions(true); setFocusedIndex(-1) }}
              onFocus={() => { if (hasTitle) setShowSuggestions(true) }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your title"
              className="flex-1 bg-transparent text-small font-normal outline-none text-foreground placeholder:text-muted-foreground"
            />
            {searchMode === "searching" && <Loader2 className="size-4 text-muted-foreground animate-spin shrink-0" />}
            {searchQuery && <button onClick={() => { onSearchChange(""); setShowSuggestions(false) }} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>}
          </div>
          {/* Suggestion dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover rounded-xl border border-border shadow-md overflow-hidden p-1">
              {suggestions.map((r, i) => (
                <button
                  key={r.id}
                  onMouseDown={() => selectRelease(r)}
                  className={cn("group relative flex items-center gap-3 w-full px-2.5 py-3 rounded-lg text-left transition-colors overflow-hidden", focusedIndex === i ? "bg-accent" : "hover:bg-accent")}
                >
                  <ReleaseRow release={r} />
                  <div className={cn("pointer-events-none absolute right-0 top-0 h-full w-28 bg-gradient-to-l to-transparent transition-colors", focusedIndex === i ? "from-accent" : "from-popover group-hover:from-accent")} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-3 pt-2">
        <Button size="lg" className="w-full" disabled={!hasTitle || collecting} onClick={() => {
          setCollecting(true)
          setTimeout(() => { setCollecting(false); goResults() }, 1200)
        }}>
          {collecting ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          Collect release details
        </Button>
        <Button size="lg" className="w-full" variant="secondary" disabled={!hasTitle} onClick={goCreate}>
          <Plus className="size-4" /> Create new release
        </Button>
      </div>
    </div>
    </div>
  )

  // ── results mode ────────────────────────────────────────────────────────────
  if (stepMode === "results") return (
    <div className="relative flex-1 overflow-hidden">
      {/* Scrollable list */}
      <div className="overflow-y-auto h-full px-8 pt-6 pb-32">
        <div className="flex flex-col gap-6 w-full">
          <div>
            <h1 className="text-xlarge font-medium">Release Info</h1>
            <p className="text-small text-muted-foreground font-normal mt-1">Details looked up from MusicBrainz and Discogs</p>
          </div>
          {EntityCombobox}
          <div className="flex flex-col gap-1.5">
            <Label>Release title</Label>
            <div className="flex items-center gap-2 h-10 px-3 rounded-full border border-border bg-background focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 transition-colors">
              <Search className="size-4 text-muted-foreground shrink-0" />
              <input
                value={searchQuery}
                onChange={e => { onSearchChange(e.target.value); if (!e.target.value) setStepMode("input") }}
                placeholder="Enter your title"
                className="flex-1 bg-transparent text-small font-normal outline-none text-foreground placeholder:text-muted-foreground"
              />
              {searchMode === "searching" && <Loader2 className="size-4 text-muted-foreground animate-spin shrink-0" />}
              {searchQuery && <button onClick={() => { onSearchChange(""); setStepMode("input") }} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>}
            </div>
          </div>
          <div className="flex flex-col">
            <p className="px-1 pb-2 text-xsmall text-muted-foreground font-normal">Results for "{searchQuery}"</p>
            {searchMode === "searching" && (
              <div className="flex items-center gap-2 px-2.5 py-3 text-xsmall text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Searching…
              </div>
            )}
            {searchMode === "results" && searchResults.map(r => (
              <button
                key={r.id}
                onClick={() => selectRelease(r)}
                className="group relative flex items-center gap-3 w-full px-2.5 py-3 rounded-lg text-left hover:bg-accent transition-colors overflow-hidden"
              >
                <ReleaseRow release={r} />
                <div className="pointer-events-none absolute right-0 top-0 h-full w-28 bg-gradient-to-l from-background group-hover:from-accent to-transparent transition-colors" />
              </button>
            ))}
            {searchMode === "not-found" && (
              <div className="flex flex-col gap-3 pt-1">
                <p className="px-2.5 text-xsmall text-muted-foreground font-normal">No releases found for "{searchQuery}"</p>
                <Button size="lg" className="w-full" onClick={goCreate}>
                  <Plus className="size-4" /> Create new release
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Glass footer — only when results exist */}
      {searchMode === "results" && (
        <div className="absolute bottom-0 inset-x-0 px-16 pt-8 pb-6 bg-gradient-to-t from-background via-background/90 to-transparent">
          <Button size="lg" className="w-full" onClick={goCreate}>
            <Plus className="size-4" /> Create new release
          </Button>
        </div>
      )}
    </div>
  )

  // ── details mode ────────────────────────────────────────────────────────────
  if (stepMode === "details" && selectedRelease) return (
    <div className="overflow-y-auto flex-1 px-16 pt-6 pb-8">
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h1 className="text-xlarge font-medium">Release Info</h1>
        <p className="text-small text-muted-foreground font-normal mt-1">Details looked up from MusicBrainz and Discogs</p>
      </div>
      <SelectedReleaseCard
        release={selectedRelease}
        musicians={musicians}
        additionalRoles={additionalRoles}
        onChangeRelease={() => { onChangeRelease(); setStepMode("input") }}
      />
      <div className="flex justify-end">
        <Button onClick={onContinue}>Next</Button>
      </div>
    </div>
    </div>
  )

  // ── create mode ─────────────────────────────────────────────────────────────
  return (
    <div className="overflow-y-auto flex-1 px-16 pt-6 pb-8">
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h1 className="text-xlarge font-medium">Release Info</h1>
        <p className="text-small text-muted-foreground font-normal mt-1">Fill in the details for your new release</p>
      </div>
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center gap-2 px-8 py-4">
          <div className="size-12 rounded-xs bg-secondary shrink-0 flex items-center justify-center shadow-sm">
            <Music2 className="size-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <p className="text-small font-normal leading-none truncate">{newForm.title || "New release"}</p>
            <div className="flex items-center gap-1.5">
              <ContentTypeBadge type={newForm.type} />
              <span className="text-small text-muted-foreground font-normal truncate">
                {ENTITIES.find(e => e.id === entityId)?.name ?? ""}
              </span>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => { onChangeRelease(); setStepMode("input") }} className="shrink-0">
            Change
          </Button>
        </div>
      </div>
      <NewReleaseForm form={newForm} onChange={onNewFormChange} entityName={ENTITIES.find(e => e.id === entityId)?.name ?? ""} />
      <CreditsSection
        musicians={musicians} onAddMusician={onAddMusician} onRemoveMusician={onRemoveMusician}
        additionalRoles={additionalRoles} onAdditionalRolesChange={onAdditionalRolesChange}
      />
      <div className="flex justify-end">
        <Button onClick={onContinue}>Next</Button>
      </div>
    </div>
    </div>
  )
}

// ─── StepMonetisation ─────────────────────────────────────────────────────────

function StepMonetisation({
  monetization, onMonetizationChange,
  listenPrice, onListenPriceChange,
  downloadPrice, onDownloadPriceChange,
  nameYourPrice, onNameYourPriceChange,
  nameYourPriceDownload, onNameYourPriceDownloadChange,
  onContinue,
}: {
  monetization: MonetizationType; onMonetizationChange: (t: MonetizationType) => void
  listenPrice: string; onListenPriceChange: (v: string) => void
  downloadPrice: string; onDownloadPriceChange: (v: string) => void
  nameYourPrice: boolean; onNameYourPriceChange: (v: boolean) => void
  nameYourPriceDownload: boolean; onNameYourPriceDownloadChange: (v: boolean) => void
  onContinue: () => void
}) {
  const [currency, setCurrency] = useState("USD")
  return (
    <div className="overflow-y-auto flex-1 px-16 pt-6 pb-8">
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h1 className="text-xlarge font-medium">Monetisation</h1>
        <p className="text-small text-muted-foreground font-normal mt-1">Choose how listeners access this release</p>
      </div>

      <RadioCardGroup
        value={monetization}
        onValueChange={v => onMonetizationChange(v as MonetizationType)}
      >
        <RadioCard
          value="streaming"
          selected={monetization === "streaming"}
          onSelect={() => onMonetizationChange("streaming")}
          icon={<RadioIcon />}
          title="For streaming"
          description="Anyone on Muza can listen · per-stream royalties distributed monthly"
        />
        <RadioCard
          value="purchase"
          selected={monetization === "purchase"}
          onSelect={() => onMonetizationChange("purchase")}
          icon={<ShoppingBag />}
          title="For purchase"
          description="Fans pay to unlock · you set your price"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label>Price for listening</Label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <span className="text-xsmall text-muted-foreground font-normal">Let fans pay more if they want</span>
                <Switch
                  size="sm"
                  checked={nameYourPrice}
                  onCheckedChange={onNameYourPriceChange}
                />
              </label>
            </div>
            <InputSelect
              value={listenPrice}
              onChange={e => onListenPriceChange((e.target as HTMLInputElement).value)}
              placeholder={nameYourPrice ? "0.00 (leave blank for free)" : "1.00"}
              className="text-small font-normal"
              selectValue={currency}
              onSelectChange={setCurrency}
              options={CURRENCY_OPTIONS}
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label>
                Price for download <span className="opacity-60">(optional)</span>
              </Label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <span className="text-xsmall text-muted-foreground font-normal">Let fans pay more if they want</span>
                <Switch
                  size="sm"
                  checked={nameYourPriceDownload}
                  onCheckedChange={onNameYourPriceDownloadChange}
                />
              </label>
            </div>
            <InputSelect
              value={downloadPrice}
              onChange={e => onDownloadPriceChange((e.target as HTMLInputElement).value)}
              placeholder="Leave blank to skip"
              className="text-small font-normal"
              selectValue={currency}
              onSelectChange={setCurrency}
              options={CURRENCY_OPTIONS}
            />
          </div>
        </RadioCard>
      </RadioCardGroup>

      <div className="flex justify-end">
        <Button size="default" onClick={onContinue}>Next</Button>
      </div>
    </div>
    </div>
  )
}

// ─── StepTrackMatching ────────────────────────────────────────────────────────

type TCol = "track" | "file" | "composer" | "lyricist"
const TM_MIN: Record<TCol, number> = { track: 100, file: 140, composer: 100, lyricist: 100 }
const TM_INIT: Record<TCol, number> = { track: 180, file: 260, composer: 140, lyricist: 140 }

function StepTrackMatching({
  release, isNew, newForm, tracks, onTracksChange, files, onContinue,
}: {
  release: Release | null; isNew: boolean; newForm: ReleaseForm
  tracks: TrackRow[]; onTracksChange: (t: TrackRow[]) => void; files: UploadFile[]
  onContinue: () => void
}) {
  const matched = tracks.filter(t => t.matchScore >= 60).length
  const [colW, setColW] = useState<Record<TCol, number>>(TM_INIT)
  const resizeRef = useRef<{ col: TCol; startX: number; startW: number } | null>(null)

  function startResize(col: TCol, e: React.MouseEvent) {
    e.preventDefault()
    resizeRef.current = { col, startX: e.clientX, startW: colW[col] }
    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return
      const { col, startX, startW } = resizeRef.current
      setColW(prev => ({ ...prev, [col]: Math.max(TM_MIN[col], startW + ev.clientX - startX) }))
    }
    const onUp = () => {
      resizeRef.current = null
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup", onUp)
    }
    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onUp)
  }

  function ResizableTh({ col, label, align = "left" }: { col: TCol; label: string; align?: string }) {
    return (
      <th
        className={`text-${align} text-xsmall font-normal text-muted-foreground pb-1.5 pl-2 relative overflow-hidden select-none group/th`}
        style={{ width: colW[col] }}
      >
        {label}
        <div
          className="absolute right-0 top-0 h-full w-3 flex items-center justify-center cursor-col-resize z-10"
          onMouseDown={e => startResize(col, e)}
        >
          <div className="w-px h-3/4 rounded-full bg-border opacity-0 group-hover/th:opacity-100 transition-opacity" />
        </div>
      </th>
    )
  }
  const title   = isNew ? (newForm.title || "Untitled") : (release?.title ?? "")
  const type    = isNew ? newForm.type : (release?.type ?? "album")

  return (
    <div className="flex flex-col gap-6 w-full">

      <h1 className="text-xlarge font-medium">Track matching</h1>

      {/* Release summary — variant 3 */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted">
        <ReleaseRow release={{
          title,
          mainArtists: isNew ? newForm.mainArtists.filter(Boolean) : (release?.mainArtists ?? []),
          year: isNew ? new Date().getFullYear() : (release?.year ?? new Date().getFullYear()),
          type,
          coverUrl: release?.coverUrl,
        }} />
        <Badge className={cn(
          "border-transparent",
          matched === tracks.length ? "bg-green-50 text-green-700"
            : matched > 0          ? "bg-yellow-50 text-yellow-700"
                                   : "bg-red-50 text-red-600"
        )}>
          {matched}/{tracks.length} Matches
        </Badge>
      </div>

      {/* Table */}
      <div className="flex flex-col overflow-x-auto">
        <table className="border-collapse" style={{ minWidth: 600, tableLayout: "fixed", width: "100%" }}>
          <colgroup>
            <col style={{ width: 28 }} />
            <col style={{ width: colW.track }} />
            <col style={{ width: colW.file }} />
            <col style={{ width: colW.composer }} />
            <col style={{ width: colW.lyricist }} />
            <col style={{ width: 56 }} />
            <col style={{ width: 80 }} />
            <col style={{ width: ACTION_W }} />
          </colgroup>
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xsmall font-normal text-muted-foreground pb-1.5 pl-2">#</th>
              <ResizableTh col="track" label="Track" />
              <ResizableTh col="file" label="File" />
              <ResizableTh col="composer" label="Composer" />
              <ResizableTh col="lyricist" label="Lyricist" />
              <th className="text-right text-xsmall font-normal text-muted-foreground pb-1.5 pr-2">Time</th>
              <th className="text-center text-xsmall font-normal text-muted-foreground pb-1.5">Match</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {tracks.map((track, i) => (
              <tr
                key={track.id}
                className="hover:bg-muted cursor-default transition-colors rounded-lg"
                style={{ height: 64 }}
              >
                {/* # */}
                <td className="text-xsmall font-normal text-muted-foreground pl-2">{i + 1}</td>

                {/* Track name */}
                <td className="pl-2 pr-2">
                  <span className="text-xsmall font-normal truncate block">{track.trackName}</span>
                </td>

                {/* File */}
                <td className="pl-2 pr-2">
                  <div className="flex items-center gap-2">
                    <button className="size-6 rounded-full bg-secondary flex items-center justify-center shrink-0 hover:bg-muted transition-colors">
                      <Play className="size-3 ml-0.5 text-foreground" />
                    </button>
                    <Select
                      value={track.assignedFile}
                      onValueChange={fileId => onTracksChange(tracks.map((t, j) => j === i ? { ...t, assignedFile: fileId, fileName: files.find(f => f.id === fileId)?.name ?? t.fileName } : t))}
                    >
                      <SelectTrigger className="min-w-0 flex-1">
                        <span className="truncate">
                          {files.find(f => f.id === track.assignedFile)?.name ?? "—"}
                        </span>
                      </SelectTrigger>
                      <SelectContent className="min-w-64 [--anchor-width:max-content]">
                        {files.map(f => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </td>

                {/* Composer */}
                <td className="pl-2 pr-2">
                  {isNew ? (
                    <Input
                      value={track.composer}
                      onChange={e => onTracksChange(tracks.map((t, j) => j === i ? { ...t, composer: e.target.value } : t))}
                      placeholder="Composer"
                    />
                  ) : (
                    <span className="text-small font-normal text-muted-foreground truncate block">{track.composer}</span>
                  )}
                </td>

                {/* Lyricist */}
                <td className="pl-2 pr-2">
                  {isNew ? (
                    <Input
                      value={track.lyricist}
                      onChange={e => onTracksChange(tracks.map((t, j) => j === i ? { ...t, lyricist: e.target.value } : t))}
                      placeholder="Lyricist"
                    />
                  ) : (
                    <span className="text-small font-normal text-muted-foreground truncate block">{track.lyricist}</span>
                  )}
                </td>

                {/* Duration */}
                <td className="text-xsmall font-normal text-muted-foreground text-right pr-2">{track.duration}</td>

                {/* Match */}
                <td className="text-center"><MatchBadge score={track.matchScore} /></td>

                {/* Action */}
                <td className="text-center">
                  {isNew && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onTracksChange(tracks.filter((_, j) => j !== i))}
                      className="mx-auto"
                    >
                      <Trash2 />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Button size="default" onClick={onContinue}>Next</Button>
      </div>

    </div>
  )
}

// ─── StepConfirmation ─────────────────────────────────────────────────────────

function StepConfirmation({
  release, isNew, newForm, tracks, onPublish,
}: {
  release: Release | null; isNew: boolean; newForm: ReleaseForm; tracks: TrackRow[]
  onPublish: () => void
}) {
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null)
  const title   = isNew ? (newForm.title || "Untitled") : (release?.title ?? "")
  const artists = isNew ? newForm.mainArtists.filter(Boolean).join(", ") : (release?.mainArtists.join(", ") ?? "")
  const type    = isNew ? newForm.type : (release?.type ?? "album")
  const year    = isNew ? (newForm.recordingDate || "—") : String(release?.year ?? "")

  return (
    <div className="flex flex-col gap-8 w-full">

      <h1 className="text-xlarge font-medium">Preview</h1>

      {/* Media header */}
      <div className="flex gap-6 items-start">
        <CoverPlaceholder size="lg" src={release?.coverUrl} />

        <div className="flex flex-col justify-between h-56 flex-1 min-w-0">
          <div className="flex flex-col gap-3">
            <h1 className="text-2xlarge font-medium truncate">{title}</h1>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="size-6 rounded-full bg-secondary shrink-0" />
                <span className="text-small text-muted-foreground font-medium">{artists}</span>
              </div>
              <div className="flex items-center gap-1">
                <Disc3 className="size-3.5 text-muted-foreground" />
                <span className="text-small text-muted-foreground font-normal">{TYPE_LABELS[type]}</span>
              </div>
              <span className="text-small text-muted-foreground font-normal">{year}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="h-12 px-8 rounded-full bg-primary text-primary-foreground flex items-center gap-2 hover:bg-primary/85 transition-colors">
                <Play className="size-4" />
              </button>
              <button className="h-12 px-4 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center hover:bg-secondary/80 transition-colors">
                <Shuffle className="size-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              {([Plus, Share2, Info, MoreHorizontal] as const).map((Icon, idx) => (
                <button
                  key={idx}
                  className="size-12 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                >
                  <Icon className="size-[18px]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Track list */}
      <div className="flex flex-col px-2">
        {tracks.map((track, i) => (
          <div
            key={track.id}
            className={cn(
              "flex items-center gap-2 px-2 py-0.5 rounded-md transition-colors cursor-pointer",
              hoveredTrack === track.id ? "bg-muted" : ""
            )}
            onMouseEnter={() => setHoveredTrack(track.id)}
            onMouseLeave={() => setHoveredTrack(null)}
          >
            <div className="size-11 flex items-center justify-center shrink-0">
              {hoveredTrack === track.id
                ? <Play className="size-4 text-foreground" />
                : <span className="text-large text-muted-foreground font-normal">{i + 1}</span>
              }
            </div>

            <div className="flex flex-col gap-1 flex-1 min-w-0 justify-center">
              <p className="text-small font-normal text-foreground truncate">{track.trackName}</p>
              <p className="text-xsmall text-muted-foreground font-normal truncate">
                {artists} · {title} · {year}
              </p>
            </div>

            <div className="flex items-center gap-1 pl-4">
              {hoveredTrack === track.id && (
                <>
                  <button className="size-9 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground">
                    <MoreHorizontal className="size-4" />
                  </button>
                  <button className="size-9 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground">
                    <Info className="size-4" />
                  </button>
                  <button className="size-9 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground">
                    <Plus className="size-4" />
                  </button>
                </>
              )}
              <span className="text-xsmall text-muted-foreground font-normal w-9 text-right">{track.duration}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Publish button */}
      <div className="flex justify-end">
        <Button size="default" onClick={onPublish}>Publish</Button>
      </div>
    </div>
  )
}

// ─── FilePanel ────────────────────────────────────────────────────────────────

function FileRow({ file, onRemove }: { file: UploadFile; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 py-2 px-1 group">
      <FileAudio className="size-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xsmall font-normal truncate">{file.name}</p>
        {!file.done && (
          <div className="mt-1 h-1 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${file.progress}%` }} />
          </div>
        )}
      </div>
      <span className="text-xsmall text-muted-foreground font-normal shrink-0">{file.size}</span>
      {file.done
        ? <Check className="size-4 text-green-500 shrink-0" />
        : <Loader2 className="size-4 text-muted-foreground animate-spin shrink-0" />
      }
      <button
        onClick={onRemove}
        className="size-6 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="size-3" />
      </button>
    </div>
  )
}

function FilePanel({
  files, onFilesChange, isDragging, onDragChange,
}: {
  files: UploadFile[]; onFilesChange: (f: UploadFile[]) => void
  isDragging: boolean; onDragChange: (v: boolean) => void
}) {
  const coverRef = useRef<HTMLInputElement>(null)
  const fileRef  = useRef<HTMLInputElement>(null)

  function addFiles(fileList: FileList) {
    const newFiles = Array.from(fileList).map((f, i) => ({
      id: `rp-${i}-${Date.now()}`,
      name: f.name,
      size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
      progress: 0,
      done: false,
    }))
    onFilesChange([...files, ...newFiles])
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Cover art — 120px */}
      <section className="flex flex-col items-center gap-2">
        <div
          onClick={() => coverRef.current?.click()}
          className="size-[120px] rounded-xl border border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <ImagePlus className="size-5 text-muted-foreground" />
        </div>
        <p className="text-xsmall text-muted-foreground font-normal text-center">
          Click to upload cover art<br />
          <span className="opacity-60">JPG · PNG · min. 1400×1400 px</span>
        </p>
        <input ref={coverRef} type="file" accept="image/*" className="hidden" />
      </section>

      {/* Audio files */}
      <section className="flex flex-col gap-2">
        <p className="text-xsmall font-medium">Audio files</p>

        {files.length === 0 ? (
          <div
            onDragOver={e => { e.preventDefault(); onDragChange(true) }}
            onDragLeave={() => onDragChange(false)}
            onDrop={e => { e.preventDefault(); onDragChange(false); addFiles(e.dataTransfer.files) }}
            onClick={() => fileRef.current?.click()}
            className={cn(
              "rounded-xl border border-dashed p-6 flex flex-col items-center gap-2 cursor-pointer transition-colors",
              isDragging ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:bg-muted/50"
            )}
          >
            <CloudUpload className="size-5 text-muted-foreground" />
            <p className="text-xsmall font-normal text-center text-muted-foreground">
              Drag audio files here<br />
              or <span className="text-primary underline underline-offset-2">browse files</span>
            </p>
            <p className="text-2xsmall text-muted-foreground font-normal opacity-60">WAV · FLAC · AIFF · up to 2 GB</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {files.map(f => (
              <FileRow key={f.id} file={f} onRemove={() => onFilesChange(files.filter(x => x.id !== f.id))} />
            ))}
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 text-xsmall text-muted-foreground font-normal hover:text-foreground mt-2 px-1 transition-colors"
            >
              <Plus className="size-3.5" />Add more files
            </button>
          </div>
        )}

        <input
          ref={fileRef} type="file" multiple accept=".wav,.flac,.aiff,.mp3" className="hidden"
          onChange={e => e.target.files && addFiles(e.target.files)}
        />
      </section>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function UploadMusicDialog({
  onClose, onMinimize, onProgressChange,
}: {
  onClose: () => void; onMinimize: () => void; onProgressChange?: (pct: number) => void
}) {
  const { add } = useToast()
  const [step, setStep] = useState<Step>(1)
  const [published, setPublished] = useState(false)
  const leftPanelRef = useRef<HTMLDivElement>(null)

  // Step 1 state
  const [entityId,        setEntityId]        = useState("a1")
  const [searchQuery,     setSearchQuery]     = useState("")
  const [searchMode,      setSearchMode]      = useState<SearchMode>("idle")
  const [searchResults,   setSearchResults]   = useState<Release[]>([])
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null)
  const [isCreatingNew,   setIsCreatingNew]   = useState(false)
  const [newForm, setNewForm] = useState<ReleaseForm>({
    title: "", mainArtists: [], band: "", label: "",
    catalogNumber: "", type: "album", recordingDate: "", tracks: "", country: ""
  })

  // Credits state
  const [musicians, setMusicians] = useState<MusicianEntry[]>([])
  const [additionalRoles, setAdditionalRoles] = useState<AdditionalRoles>({
    producer: "", recording: "", mixing: "", mastering: "", coverArt: "", linerNotes: ""
  })

  // Step 2 state
  const [monetization,  setMonetization]  = useState<MonetizationType>("streaming")
  const [listenPrice,   setListenPrice]   = useState("1.00")
  const [downloadPrice, setDownloadPrice] = useState("")
  const [nameYourPrice,         setNameYourPrice]         = useState(false)
  const [nameYourPriceDownload, setNameYourPriceDownload] = useState(false)

  // File panel
  const [files,      setFiles]      = useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)

  // Step 3
  const [tracks, setTracks] = useState<TrackRow[]>(MOCK_TRACKS)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Live search (debounced)
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (searchQuery.length < 2) { setSearchMode("idle"); setSearchResults([]); return }
    setSearchMode("searching")
    timerRef.current = setTimeout(() => {
      const q    = searchQuery.toLowerCase()
      const hits = MOCK_RELEASES.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.mainArtists.some(a => a.toLowerCase().includes(q))
      )
      setSearchResults(hits)
      setSearchMode(hits.length > 0 ? "results" : "not-found")
    }, 320)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [searchQuery]) // eslint-disable-line

  // Upload progress simulation
  useEffect(() => {
    if (!files.some(f => !f.done)) return
    const iv = setInterval(() => {
      setFiles(prev => prev.map(f =>
        f.done ? f : { ...f, progress: Math.min(f.progress + 4, 100), done: f.progress >= 96 }
      ))
    }, 180)
    return () => clearInterval(iv)
  }, [files])

  // Report overall progress to parent
  useEffect(() => {
    if (!onProgressChange || files.length === 0) return
    const avg = files.reduce((sum, f) => sum + f.progress, 0) / files.length
    onProgressChange(Math.round(avg))
  }, [files, onProgressChange])

  const showDetails  = selectedRelease !== null || isCreatingNew
  const isFullWidth  = step === 3 || step === 4
  const canContinue  = true

  function handleNext() {
    if (step === 1 && files.length === 0) setFiles(MOCK_FILES)
    if (step < 4) setStep(s => (s + 1) as Step)
    else setPublished(true)
  }

  function handleBack() {
    if (step > 1) setStep(s => (s - 1) as Step)
  }

  function handleSelectRelease(r: Release) {
    setSelectedRelease(r)
    setIsCreatingNew(false)
  }

  function handleCreateNew() {
    setIsCreatingNew(true)
    setSelectedRelease(null)
    setNewForm(f => ({ ...f, title: searchQuery.trim() }))
  }

  function handleChangeRelease() {
    setSelectedRelease(null)
    setIsCreatingNew(false)
  }

  // scroll left panel to top whenever the release selection state changes
  useEffect(() => {
    leftPanelRef.current?.scrollTo({ top: 0, behavior: "instant" })
  }, [isCreatingNew, selectedRelease])

  function addMusician(name: string, instrument: string) {
    const id = `m-${Date.now()}`
    setMusicians(prev => [...prev, { id, name, instrument, matched: false }])
    setTimeout(() => {
      setMusicians(prev => prev.map(m => m.id === id ? { ...m, matched: true } : m))
    }, 1000)
  }

  function removeMusician(id: string) {
    setMusicians(prev => prev.filter(m => m.id !== id))
  }

  const publishedTitle   = isCreatingNew ? (newForm.title || "Untitled") : (selectedRelease?.title ?? "Your release")
  const publishedArtist  = isCreatingNew ? newForm.mainArtists.filter(Boolean).join(", ") : (selectedRelease?.mainArtists.join(", ") ?? "")
  const publishedCover   = selectedRelease?.coverUrl

  return (
    <div className="relative flex flex-col h-full bg-background">
      {/* Top nav — stepper + navigation */}
      <TopNavBar
        step={step}
        onBack={handleBack}
        onCancel={onClose}
        onMinimize={onMinimize}
        onContinue={handleNext}
        canContinue={canContinue}
        isLastStep={step === 4}
      />

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {isFullWidth ? (
          /* Steps 3 & 4: full width, centered */
          <div className="flex-1 overflow-y-auto px-16 pt-6 pb-10">
              {step === 3 && (
                <StepTrackMatching
                  release={selectedRelease} isNew={isCreatingNew} newForm={newForm}
                  tracks={tracks} onTracksChange={setTracks} files={files}
                  onContinue={handleNext}
                />
              )}
              {step === 4 && (
                <StepConfirmation
                  release={selectedRelease} isNew={isCreatingNew} newForm={newForm}
                  tracks={tracks} onPublish={handleNext}
                />
              )}
          </div>
        ) : (
          /* Steps 1 & 2: 50/50 split */
          <>
            <div ref={leftPanelRef} className="w-1/2 shrink-0 flex flex-col overflow-hidden">
              {step === 1 && (
                <StepRelease
                  entityId={entityId} onEntityChange={setEntityId}
                  searchQuery={searchQuery} onSearchChange={setSearchQuery}
                  searchMode={searchMode} searchResults={searchResults}
                  selectedRelease={selectedRelease} isCreatingNew={isCreatingNew} newForm={newForm}
                  onSelectRelease={handleSelectRelease} onCreateNew={handleCreateNew}
                  onChangeRelease={handleChangeRelease} onNewFormChange={setNewForm}
                  musicians={musicians} onAddMusician={addMusician} onRemoveMusician={removeMusician}
                  additionalRoles={additionalRoles} onAdditionalRolesChange={setAdditionalRoles}
                  onContinue={handleNext}
                />
              )}
              {step === 2 && (
                <StepMonetisation
                  monetization={monetization} onMonetizationChange={setMonetization}
                  listenPrice={listenPrice} onListenPriceChange={setListenPrice}
                  downloadPrice={downloadPrice} onDownloadPriceChange={setDownloadPrice}
                  nameYourPrice={nameYourPrice} onNameYourPriceChange={setNameYourPrice}
                  nameYourPriceDownload={nameYourPriceDownload} onNameYourPriceDownloadChange={setNameYourPriceDownload}
                  onContinue={handleNext}
                />
              )}
            </div>

            {/* Right: file panel */}
            <div className="w-1/2 shrink-0 border-l border-border px-16 pt-6 pb-8 overflow-y-auto">
              <FilePanel
                files={files} onFilesChange={setFiles}
                isDragging={isDragging} onDragChange={setIsDragging}
              />
            </div>
          </>
        )}
      </div>

      {/* ── Published success modal ───────────────────────────────────── */}
      {published && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-md bg-background/60">
          <div className="flex flex-col items-center gap-6 text-center bg-background border border-border rounded-2xl shadow-xl px-10 py-10 max-w-sm w-full mx-6">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="size-8 text-primary" />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-xlarge font-semibold">Your release is live.</h2>
              <p className="text-small text-muted-foreground font-normal">
                {publishedTitle}{publishedArtist ? ` by ${publishedArtist}` : ""} is now public on muza.
              </p>
            </div>
            <Button size="lg" className="w-full" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
