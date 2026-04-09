"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ContentTypeBadge } from "@/components/ui/badge"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { InputSelect } from "@/components/ui/input-select"
import { cn } from "@/lib/utils"
import {
  Search, X, Check, CloudUpload, ImagePlus, Music2, Disc3,
  Plus, GripVertical, FileAudio, Loader2, ChevronRight,
  AlertTriangle, Trash2, Minimize2, Play, Shuffle,
  Share2, Info, MoreHorizontal,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

type ContentType      = "album" | "single" | "ep" | "song"
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
  id: string; fileName: string; trackName: string; composer: string
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
  { id: "r1", title: "Space Is the Place",                mainArtists: ["Sun Ra"], band: "Sun Ra Arkestra", label: "Impulse!",          catalogNumber: "AS-9956",    type: "album",  tracks: 5,  country: "US", year: 1973, recordingDate: "1972", coverUrl: "https://picsum.photos/seed/sunra73/48/48" },
  { id: "r2", title: "The Heliocentric Worlds of Sun Ra", mainArtists: ["Sun Ra"], band: "Sun Ra Arkestra", label: "ESP-Disk",           catalogNumber: "ESP-1014",   type: "album",  tracks: 6,  country: "US", year: 1965,                        coverUrl: "https://picsum.photos/seed/sunra65/48/48" },
  { id: "r3", title: "Atlantis",                          mainArtists: ["Sun Ra"],                          label: "El Saturn Records", catalogNumber: "SaturnLP508", type: "album",  tracks: 6,               year: 1969,                        coverUrl: "https://picsum.photos/seed/sunra69/48/48" },
  { id: "r4", title: "Nuclear War",                       mainArtists: ["Sun Ra"],                                                                                    type: "single", tracks: 2,               year: 1982,                        coverUrl: "https://picsum.photos/seed/sunra82/48/48" },
  { id: "r5", title: "Outer Spaceways Incorporated",      mainArtists: ["Sun Ra"],                                                                                    type: "song",   tracks: 1,               year: 1968,                        coverUrl: "https://picsum.photos/seed/sunra68/48/48" },
  { id: "r6", title: "Sleeping Beauty",                   mainArtists: ["Sun Ra"],                          label: "Saturn Records",                                  type: "album",  tracks: 4,               year: 1979,                        coverUrl: "https://picsum.photos/seed/sunra79/48/48" },
]

const MOCK_FILES: UploadFile[] = [
  { id: "f1", name: "SunRa_SpaceIsThePlace_Take01.wav",  size: "82.3 MB", progress: 100, done: true },
  { id: "f2", name: "SunRa_HelioCentricWorlds_01.wav",   size: "74.1 MB", progress: 100, done: true },
  { id: "f3", name: "SunRa_Atlantis_Side1_Master.wav",   size: "91.7 MB", progress: 100, done: true },
]

const MOCK_TRACKS: TrackRow[] = [
  { id: "t1", fileName: "SunRa_SpaceIsThePlace_Take01.wav", trackName: "Space Is the Place", composer: "Sun Ra", duration: "4:54",  matchScore: 80, assignedFile: "f1" },
  { id: "t2", fileName: "SunRa_HelioCentricWorlds_01.wav",  trackName: "Heliocentric",        composer: "Sun Ra", duration: "12:18", matchScore: 80, assignedFile: "f2" },
  { id: "t3", fileName: "SunRa_Atlantis_Side1_Master.wav",  trackName: "Atlantis",            composer: "Sun Ra", duration: "8:37",  matchScore: 20, assignedFile: "f3" },
]

const TYPE_LABELS: Record<ContentType, string> = { album: "Album", single: "Single", ep: "EP", song: "Song" }
const STEP_LABELS = ["Release Info", "Monetisation", "Track matching", "Confirm"]

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
      size === "sm" ? "size-7 text-xs"
        : size === "lg" ? "size-14 text-base"
        : "size-11 text-sm"
    )}>
      {initials}
    </div>
  )
}


function MatchBadge({ score }: { score: number }) {
  const good = score >= 60
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-normal shrink-0",
      good ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
    )}>
      {good ? <Check className="size-3" /> : <AlertTriangle className="size-3" />}
      {score}%
    </span>
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
        <p className="text-sm font-normal leading-none truncate">{release.title}</p>
        <div className="flex items-center gap-1.5">
          <ContentTypeBadge type={release.type} />
          <span className="text-sm text-muted-foreground font-normal truncate">
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
      <p className="text-xs text-muted-foreground font-normal">{label}</p>
      <p className="text-sm font-normal">{value}</p>
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
                    "size-6 rounded-full flex items-center justify-center text-xs font-normal transition-colors shrink-0",
                    done || active ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"
                  )}>
                    {done ? <Check className="size-3" /> : num}
                  </div>
                  <p className={cn(
                    "text-sm font-normal text-center leading-tight whitespace-nowrap transition-colors",
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
            className="flex-1 bg-transparent text-sm font-normal outline-none text-foreground placeholder:text-muted-foreground"
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
              <div className="px-3 py-3 text-xs text-muted-foreground font-normal">
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
                <p className="text-sm font-medium text-foreground">Create new release</p>
                <p className="-mt-1 text-sm text-muted-foreground font-normal">
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
          <p className="px-2.5 pt-1 pb-2 text-xs text-muted-foreground font-normal">
            {searchMode === "searching" ? `Searching for "${searchQuery}"…` : `Results for "${searchQuery}"`}
          </p>
          {searchMode === "searching" && (
            <div className="flex items-center gap-2 px-2.5 py-3 text-xs text-muted-foreground">
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
            <div className="px-2.5 py-3 text-xs text-muted-foreground font-normal">
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
              <p className="text-sm font-medium text-foreground">Create new release</p>
              <p className="-mt-1 text-sm text-muted-foreground font-normal">
                {searchQuery ? `Add "${searchQuery}" manually` : "Add a release manually"}
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Idle hint */}
      {searchMode === "idle" && (
        <p className="text-xs text-muted-foreground font-normal px-1">
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
        <p className="text-sm font-medium">General info</p>
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
            <p className="text-sm font-medium">Credits</p>
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
      <h2 className="text-sm font-medium">Credits</h2>

      {/* Musicians */}
      <div className="flex flex-col gap-2">
        <Label>Musicians</Label>

        {/* Committed musicians — read-only rows */}
        {musicians.map(m => (
          <div key={m.id} className="flex items-center gap-2">
            <div className="h-10 flex-1 min-w-0 rounded-full border border-border bg-muted px-3 py-2 text-sm font-normal text-muted-foreground flex items-center truncate">
              {m.name}
            </div>
            <div className="h-10 flex-1 min-w-0 rounded-full border border-border bg-muted px-3 py-2 text-sm font-normal text-muted-foreground flex items-center truncate">
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
              className="text-sm font-normal"
              autoFocus
            />
            <Input
              value={d.instrument}
              onChange={e => setDrafts(prev => prev.map((x, j) => j === i ? { ...x, instrument: e.target.value } : x))}
              onKeyDown={e => { if (e.key === "Enter") commitDraft(i) }}
              placeholder="Instrument"
              className="text-sm font-normal"
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
                className="h-9 text-sm font-normal"
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
            className="resize-none min-h-[80px] text-sm font-normal"
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
          {/* First artist — locked, pre-filled from entity */}
          <div className="flex items-center gap-2">
            <div className="h-10 w-full min-w-0 rounded-full border border-border bg-muted px-3 py-2 text-sm font-normal text-muted-foreground flex items-center truncate">
              {entityName}
            </div>
            <div className="size-8 shrink-0" />
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
                className="text-sm font-normal"
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

      {/* 2. Band name */}
      <div className="flex flex-col gap-1.5">
        <Label>Band name</Label>
        <Input
          value={form.band}
          onChange={e => onChange({ ...form, band: e.target.value })}
          placeholder="Band / ensemble"
          className="text-sm font-normal"
        />
      </div>

      {/* 3. Album title */}
      <div className="flex flex-col gap-1.5">
        <Label>Album title</Label>
        <Input
          value={form.title}
          onChange={e => onChange({ ...form, title: e.target.value })}
          placeholder="Title"
          className="text-sm font-normal"
        />
      </div>

      {/* 4. Label */}
      <div className="flex flex-col gap-1.5">
        <Label>Label</Label>
        <Input
          value={form.label}
          onChange={e => onChange({ ...form, label: e.target.value })}
          placeholder="Record label"
          className="text-sm font-normal"
        />
      </div>

      {/* 5. Catalog number */}
      <div className="flex flex-col gap-1.5">
        <Label>Catalog number</Label>
        <Input
          value={form.catalogNumber}
          onChange={e => onChange({ ...form, catalogNumber: e.target.value })}
          placeholder="e.g. ABC-123"
          className="text-sm font-normal"
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
            <SelectItem value="song">Song</SelectItem>
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
          className="text-sm font-normal"
        />
      </div>

      {/* 8. Tracks */}
      <div className="flex flex-col gap-1.5">
        <Label>Tracks</Label>
        <Input
          value={form.tracks}
          onChange={e => onChange({ ...form, tracks: e.target.value })}
          placeholder="e.g. 12"
          className="text-sm font-normal"
        />
      </div>

      {/* 9. Country */}
      <div className="flex flex-col gap-1.5">
        <Label>Country</Label>
        <Input
          value={form.country}
          onChange={e => onChange({ ...form, country: e.target.value })}
          placeholder="e.g. US"
          className="text-sm font-normal"
        />
      </div>
    </div>
  )
}

// ─── StepRelease ──────────────────────────────────────────────────────────────

function StepRelease({
  entityId, onEntityChange,
  searchQuery, onSearchChange, searchMode, searchResults,
  selectedRelease, isCreatingNew, newForm,
  onSelectRelease, onCreateNew, onChangeRelease, onNewFormChange,
  musicians, onAddMusician, onRemoveMusician,
  additionalRoles, onAdditionalRolesChange,
  onContinue, canContinue,
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
  canContinue: boolean
}) {
  const showDetails = selectedRelease !== null || isCreatingNew
  const [entityInputValue, setEntityInputValue] = useState(
    ENTITIES.find(e => e.id === entityId)?.name ?? ""
  )

  useEffect(() => {
    setEntityInputValue(ENTITIES.find(e => e.id === entityId)?.name ?? "")
  }, [entityId])

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto w-full">

      <h1 className="text-xl font-medium">Release Info</h1>

      {/* ── Section 1: Upload as ── */}
      <div className="flex flex-col gap-1.5">
        <Label>Upload as</Label>
        <Combobox
          value={entityId}
          onValueChange={(v) => {
            if (v) {
              onEntityChange(v as string)
              setEntityInputValue(ENTITIES.find(e => e.id === v)?.name ?? "")
            }
          }}
          inputValue={entityInputValue}
          onInputValueChange={(v) => {
            // base-ui may pass the raw entity ID instead of the name — map to name
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
                  <div className="size-11 rounded-full bg-secondary flex items-center justify-center shrink-0 font-medium text-secondary-foreground text-xs shadow-sm select-none">
                    {entity.initials}
                  </div>
                  {entity.name}
                </ComboboxItem>
              ))}
            </ComboboxGroup>
            <ComboboxSeparator />
            <ComboboxGroup>
              <ComboboxGroupLabel>Upload as label</ComboboxGroupLabel>
              {ENTITIES.filter(e => e.type === "label").map(entity => (
                <ComboboxItem key={entity.id} value={entity.id} hideIndicator className="py-2.5 gap-3">
                  <div className="size-11 rounded-full bg-secondary flex items-center justify-center shrink-0 font-medium text-secondary-foreground text-xs shadow-sm select-none">
                    {entity.initials}
                  </div>
                  {entity.name}
                </ComboboxItem>
              ))}
            </ComboboxGroup>
          </ComboboxContent>
        </Combobox>
      </div>

      {/* ── Section 2: Find your release ── */}
      <div className="flex flex-col gap-1.5">
        <Label>Find your release</Label>

        {showDetails && !isCreatingNew && selectedRelease ? (
          <SelectedReleaseCard
            release={selectedRelease}
            musicians={musicians}
            additionalRoles={additionalRoles}
            onChangeRelease={onChangeRelease}
          />
        ) : showDetails && isCreatingNew ? (
          /* Creating new — inline header + form */
          <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="rounded-2xl border border-border overflow-hidden">
              <div className="flex items-center gap-2 px-8 py-4">
                <div className="size-12 rounded-xs bg-secondary shrink-0 flex items-center justify-center shadow-sm">
                  <Music2 className="size-4 text-muted-foreground" />
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <p className="text-sm font-normal leading-none truncate">{newForm.title || "New release"}</p>
                  <div className="flex items-center gap-1.5">
                    <ContentTypeBadge type={newForm.type} />
                    <span className="text-sm text-muted-foreground font-normal truncate">
                      {ENTITIES.find(e => e.id === entityId)?.name ?? "New release"}
                    </span>
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={onChangeRelease} className="shrink-0">
                  Change
                </Button>
              </div>
            </div>
            <NewReleaseForm form={newForm} onChange={onNewFormChange} entityName={ENTITIES.find(e => e.id === entityId)?.name ?? ""} />
          </div>
        ) : (
          /* Search dropdown */
          <ReleaseSearchDropdown
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            searchMode={searchMode}
            searchResults={searchResults}
            onSelectRelease={onSelectRelease}
            onCreateNew={onCreateNew}
          />
        )}
      </div>

      {/* ── Section 4: Credits (only when creating new — DB releases show credits in expanded card) ── */}
      {isCreatingNew && (
        <CreditsSection
          musicians={musicians}
          onAddMusician={onAddMusician}
          onRemoveMusician={onRemoveMusician}
          additionalRoles={additionalRoles}
          onAdditionalRolesChange={onAdditionalRolesChange}
        />
      )}

      {/* Continue button at bottom of step */}
      <div className="flex justify-end">
        <Button size="default" onClick={onContinue} disabled={!canContinue}>Next</Button>
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
  onContinue,
}: {
  monetization: MonetizationType; onMonetizationChange: (t: MonetizationType) => void
  listenPrice: string; onListenPriceChange: (v: string) => void
  downloadPrice: string; onDownloadPriceChange: (v: string) => void
  nameYourPrice: boolean; onNameYourPriceChange: (v: boolean) => void
  onContinue: () => void
}) {
  const [currency, setCurrency] = useState("USD")
  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto w-full">
      <div>
        <h1 className="text-xl font-medium">Monetisation</h1>
        <p className="text-sm text-muted-foreground font-normal mt-1">Choose how listeners access this release</p>
      </div>

      <RadioGroup
        value={monetization}
        onValueChange={v => onMonetizationChange(v as MonetizationType)}
        className="flex flex-col gap-4"
      >

        {/* Streaming */}
        <div
          onClick={() => onMonetizationChange("streaming")}
          className={cn(
            "flex flex-col px-4 py-4 rounded-xl border transition-colors cursor-pointer",
            monetization === "streaming" ? "border-foreground" : "border-border hover:border-foreground/30"
          )}
        >
          <div className="flex items-start gap-3">
            <RadioGroupItem value="streaming" className="mt-[7px]" />
            <div>
              <p className="text-base font-medium">For streaming</p>
              <ul className="mt-2 flex flex-col gap-1 list-disc list-inside marker:text-muted-foreground">
                <li className="text-base font-normal text-muted-foreground">Anyone on Muza can listen</li>
                <li className="text-base font-normal text-muted-foreground">You earn per-stream royalties (distributed monthly)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Purchase */}
        <div
          onClick={() => onMonetizationChange("purchase")}
          className={cn(
            "flex flex-col px-4 py-4 rounded-xl border transition-colors cursor-pointer",
            monetization === "purchase" ? "border-foreground" : "border-border hover:border-foreground/30"
          )}
        >
          <div className="flex items-start gap-3">
            <RadioGroupItem value="purchase" className="mt-[7px]" />
            <div>
              <p className="text-base font-medium">For purchase</p>
              <ul className="mt-2 flex flex-col gap-1 list-disc list-inside marker:text-muted-foreground">
                <li className="text-base font-normal text-muted-foreground">Fans pay to unlock</li>
                <li className="text-base font-normal text-muted-foreground">You set your price</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-4" />

          <div className="flex flex-col gap-4 mt-4 ml-8" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>
                  {nameYourPrice ? "Minimum price" : "Price for listening"}
                </Label>
                <label className="flex items-center gap-1.5 cursor-pointer" onClick={e => e.stopPropagation()}>
                  <Switch
                    size="sm"
                    checked={nameYourPrice}
                    onCheckedChange={onNameYourPriceChange}
                  />
                  <span className="text-xs text-muted-foreground font-normal">Name your price</span>
                </label>
              </div>
              <InputSelect
                value={listenPrice}
                onChange={e => onListenPriceChange((e.target as HTMLInputElement).value)}
                placeholder={nameYourPrice ? "0.00 (leave blank for free)" : "1.00"}
                className="text-sm font-normal"
                selectValue={currency}
                onSelectChange={setCurrency}
                options={CURRENCY_OPTIONS}
                onClick={e => e.stopPropagation()}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>
                Price for download <span className="opacity-60">(optional)</span>
              </Label>
              <InputSelect
                value={downloadPrice}
                onChange={e => onDownloadPriceChange((e.target as HTMLInputElement).value)}
                placeholder="Leave blank to skip"
                className="text-sm font-normal"
                selectValue={currency}
                onSelectChange={setCurrency}
                options={CURRENCY_OPTIONS}
                onClick={e => e.stopPropagation()}
              />
            </div>
          </div>
        </div>

      </RadioGroup>

      <div className="flex justify-end">
        <Button size="default" onClick={onContinue}>Next</Button>
      </div>
    </div>
  )
}

// ─── StepTrackMatching ────────────────────────────────────────────────────────

function StepTrackMatching({
  release, isNew, newForm, tracks, onTracksChange, files,
}: {
  release: Release | null; isNew: boolean; newForm: ReleaseForm
  tracks: TrackRow[]; onTracksChange: (t: TrackRow[]) => void; files: UploadFile[]
}) {
  const matched = tracks.filter(t => t.matchScore >= 60).length
  const title   = isNew ? (newForm.title || "Untitled") : (release?.title ?? "")
  const type    = isNew ? newForm.type : (release?.type ?? "album")

  return (
    <div className="flex flex-col gap-6 w-full mx-auto">

      <h1 className="text-xl font-medium">Track matching</h1>

      {/* Release summary — variant 3 */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted">
        <ReleaseRow release={{
          title,
          mainArtists: isNew ? newForm.mainArtists.filter(Boolean) : (release?.mainArtists ?? []),
          year: isNew ? new Date().getFullYear() : (release?.year ?? new Date().getFullYear()),
          type,
          coverUrl: release?.coverUrl,
        }} />
        <span className={cn(
          "text-xs font-normal px-3 py-1 rounded-full shrink-0",
          matched === tracks.length ? "bg-green-50 text-green-700"
            : matched > 0          ? "bg-yellow-50 text-yellow-700"
                                   : "bg-red-50 text-red-600"
        )}>
          {matched}/{tracks.length} Matches
        </span>
      </div>

      {/* Table */}
      <div className="flex flex-col overflow-x-auto">
        <table className="w-full border-collapse table-fixed" style={{ minWidth: 600 }}>
          <colgroup>
            <col style={{ width: 28 }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "35%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: 56 }} />
            <col style={{ width: 80 }} />
            <col style={{ width: ACTION_W }} />
          </colgroup>
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-normal text-muted-foreground pb-1.5 pl-2">#</th>
              <th className="text-left text-xs font-normal text-muted-foreground pb-1.5 pl-2 resize-x overflow-hidden">Track</th>
              <th className="text-left text-xs font-normal text-muted-foreground pb-1.5 pl-2 resize-x overflow-hidden">File</th>
              <th className="text-left text-xs font-normal text-muted-foreground pb-1.5 pl-2 resize-x overflow-hidden">Composer</th>
              <th className="text-right text-xs font-normal text-muted-foreground pb-1.5 pr-2">Time</th>
              <th className="text-center text-xs font-normal text-muted-foreground pb-1.5">Match</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {tracks.map((track, i) => (
              <tr
                key={track.id}
                className="hover:bg-muted cursor-default transition-colors rounded-lg"
                style={{ height: 56 }}
              >
                {/* # */}
                <td className="text-xs font-normal text-muted-foreground pl-2">{i + 1}</td>

                {/* Track name */}
                <td className="pl-2 pr-2">
                  {isNew ? (
                    <Input
                      value={track.trackName}
                      onChange={e => onTracksChange(tracks.map((t, j) => j === i ? { ...t, trackName: e.target.value } : t))}
                      className="h-8 text-xs font-normal"
                      placeholder="Song name"
                    />
                  ) : (
                    <span className="text-xs font-normal truncate block">{track.trackName}</span>
                  )}
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
                      <SelectTrigger data-size="sm" className="min-w-0 flex-1">
                        <span className="truncate">
                          {files.find(f => f.id === track.assignedFile)?.name ?? "—"}
                        </span>
                      </SelectTrigger>
                      <SelectContent className="min-w-64 [--anchor-width:max-content]">
                        {files.map(f => (
                          <SelectItem key={f.id} value={f.id} className="text-xs">
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
                      className="h-8 text-xs font-normal"
                      placeholder="Composer"
                    />
                  ) : (
                    <span className="text-xs font-normal text-muted-foreground truncate block">{track.composer}</span>
                  )}
                </td>

                {/* Duration */}
                <td className="text-xs font-normal text-muted-foreground text-right pr-2">{track.duration}</td>

                {/* Match */}
                <td className="text-center"><MatchBadge score={track.matchScore} /></td>

                {/* Action */}
                <td className="text-center">
                  {isNew && (
                    <button
                      onClick={() => onTracksChange(tracks.filter((_, j) => j !== i))}
                      className="size-8 flex items-center justify-center rounded-full bg-secondary hover:bg-muted text-muted-foreground transition-colors mx-auto"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add track (isNew only) */}
      {isNew && (
        <Button
          variant="secondary" size="sm" className="self-start gap-1.5"
          onClick={() => onTracksChange([...tracks, {
            id: `t${Date.now()}`, fileName: "", trackName: "", composer: "",
            duration: "0:00", matchScore: 0, assignedFile: ""
          }])}
        >
          <Plus className="size-3.5" />Add track
        </Button>
      )}
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
    <div className="flex flex-col gap-8 w-full mx-auto">

      {/* Media header */}
      <div className="flex gap-6 items-start py-4">
        <CoverPlaceholder size="lg" src={release?.coverUrl} />

        <div className="flex flex-col justify-between h-56 flex-1 min-w-0 px-4">
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl font-medium truncate">{title}</h1>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="size-6 rounded-full bg-secondary shrink-0" />
                <span className="text-sm text-muted-foreground font-medium">{artists}</span>
              </div>
              <div className="flex items-center gap-1">
                <Disc3 className="size-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-normal">{TYPE_LABELS[type]}</span>
              </div>
              <span className="text-sm text-muted-foreground font-normal">{year}</span>
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
                : <span className="text-lg text-muted-foreground font-normal">{i + 1}</span>
              }
            </div>

            <div className="flex flex-col gap-1 flex-1 min-w-0 justify-center">
              <p className="text-sm font-normal text-foreground truncate">{track.trackName}</p>
              <p className="text-xs text-muted-foreground font-normal truncate">
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
              <span className="text-xs text-muted-foreground font-normal w-9 text-right">{track.duration}</span>
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
        <p className="text-xs font-normal truncate">{file.name}</p>
        {!file.done && (
          <div className="mt-1 h-1 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${file.progress}%` }} />
          </div>
        )}
      </div>
      <span className="text-xs text-muted-foreground font-normal shrink-0">{file.size}</span>
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
        <p className="text-xs text-muted-foreground font-normal text-center">
          Click to upload cover art<br />
          <span className="opacity-60">JPG · PNG · min. 1400×1400 px</span>
        </p>
        <input ref={coverRef} type="file" accept="image/*" className="hidden" />
      </section>

      {/* Audio files */}
      <section className="flex flex-col gap-2">
        <p className="text-xs font-medium">Audio files</p>

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
            <p className="text-xs font-normal text-center text-muted-foreground">
              Drag audio files here<br />
              or <span className="text-primary underline underline-offset-2">browse files</span>
            </p>
            <p className="text-[10px] text-muted-foreground font-normal opacity-60">WAV · FLAC · AIFF · up to 2 GB</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {files.map(f => (
              <FileRow key={f.id} file={f} onRemove={() => onFilesChange(files.filter(x => x.id !== f.id))} />
            ))}
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-muted-foreground font-normal hover:text-foreground mt-2 px-1 transition-colors"
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
  const [nameYourPrice, setNameYourPrice] = useState(false)

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
  const canContinue  = step === 1 ? showDetails : true

  function handleNext() {
    if (step === 1 && files.length === 0) setFiles(MOCK_FILES)
    if (step < 4) setStep(s => (s + 1) as Step)
    else {
      add({ title: "Release was added", type: "success" })
      onClose()
    }
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
    setNewForm(f => ({ ...f, title: searchQuery }))
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

  return (
    <div className="flex flex-col h-full bg-background">
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
          /* Steps 3 & 4: full width */
          <div className="flex-1 overflow-y-auto px-20 pt-4 pb-8">
            {step === 3 && (
              <StepTrackMatching
                release={selectedRelease} isNew={isCreatingNew} newForm={newForm}
                tracks={tracks} onTracksChange={setTracks} files={files}
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
            <div ref={leftPanelRef} className="w-1/2 shrink-0 overflow-y-auto px-10 pt-4 pb-8">
              {step === 1 && (
                <StepRelease
                  entityId={entityId} onEntityChange={setEntityId}
                  searchQuery={searchQuery} onSearchChange={setSearchQuery}
                  searchMode={searchMode} searchResults={searchResults}
                  selectedRelease={selectedRelease} isCreatingNew={isCreatingNew} newForm={newForm}
                  onSelectRelease={handleSelectRelease} onCreateNew={handleCreateNew}
                  onChangeRelease={handleChangeRelease} onNewFormChange={setNewForm}
                  musicians={musicians}
                  onAddMusician={addMusician}
                  onRemoveMusician={removeMusician}
                  additionalRoles={additionalRoles}
                  onAdditionalRolesChange={setAdditionalRoles}
                  onContinue={handleNext}
                  canContinue={canContinue}
                />
              )}
              {step === 2 && (
                <StepMonetisation
                  monetization={monetization} onMonetizationChange={setMonetization}
                  listenPrice={listenPrice} onListenPriceChange={setListenPrice}
                  downloadPrice={downloadPrice} onDownloadPriceChange={setDownloadPrice}
                  nameYourPrice={nameYourPrice} onNameYourPriceChange={setNameYourPrice}
                  onContinue={handleNext}
                />
              )}
            </div>

            {/* Right: file panel */}
            <div className="w-1/2 shrink-0 border-l border-border px-8 pt-4 pb-8 overflow-y-auto">
              <FilePanel
                files={files} onFilesChange={setFiles}
                isDragging={isDragging} onDragChange={setIsDragging}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
