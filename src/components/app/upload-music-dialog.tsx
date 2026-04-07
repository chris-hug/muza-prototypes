"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Search, X, Check, CloudUpload, ImagePlus, Music2, Disc3,
  Plus, GripVertical, FileAudio, Loader2, ChevronDown,
  AlertTriangle, Trash2,
} from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────────────────

type ContentType = "album" | "single" | "ep" | "song"
type Step = 1 | 2 | 3 | 4
type SearchMode = "idle" | "searching" | "results" | "not-found" | "selected" | "creating"
type MonetizationType = "streaming" | "purchase"

interface Entity { id: string; name: string; type: "artist" | "label"; initials: string }
interface Release {
  id: string; title: string; mainArtists: string[]; band?: string
  label?: string; catalogNumber?: string; type: ContentType
  recordingDate?: string; tracks: number; country?: string; year: number
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

// ─── Mock data ───────────────────────────────────────────────────────────────────

const ENTITIES: Entity[] = [
  { id: "a1", name: "Sun Ra", type: "artist", initials: "SR" },
  { id: "a2", name: "Sun Ra Arkestra", type: "artist", initials: "SA" },
  { id: "l1", name: "Saturn Records", type: "label", initials: "ST" },
  { id: "l2", name: "El Saturn Records", type: "label", initials: "ES" },
]

const MOCK_RELEASES: Release[] = [
  { id: "r1", title: "Space Is the Place", mainArtists: ["Sun Ra"], band: "Sun Ra Arkestra", label: "Impulse!", catalogNumber: "AS-9956", type: "album", tracks: 5, country: "US", year: 1973, recordingDate: "1972" },
  { id: "r2", title: "The Heliocentric Worlds of Sun Ra", mainArtists: ["Sun Ra"], band: "Sun Ra Arkestra", label: "ESP-Disk", catalogNumber: "ESP-1014", type: "album", tracks: 6, country: "US", year: 1965 },
  { id: "r3", title: "Atlantis", mainArtists: ["Sun Ra"], type: "album", tracks: 6, year: 1969, label: "El Saturn Records", catalogNumber: "SaturnLP508" },
  { id: "r4", title: "Nuclear War", mainArtists: ["Sun Ra"], type: "single", tracks: 2, year: 1982 },
  { id: "r5", title: "Outer Spaceways Incorporated", mainArtists: ["Sun Ra"], type: "song", tracks: 1, year: 1968 },
  { id: "r6", title: "Sleeping Beauty", mainArtists: ["Sun Ra"], type: "album", tracks: 4, year: 1979, label: "Saturn Records" },
]

const MOCK_FILES: UploadFile[] = [
  { id: "f1", name: "SunRa_SpaceIsThePlace_Take01.wav", size: "82.3 MB", progress: 100, done: true },
  { id: "f2", name: "SunRa_HelioCentricWorlds_01.wav", size: "74.1 MB", progress: 100, done: true },
  { id: "f3", name: "SunRa_Atlantis_Side1_Master.wav", size: "91.7 MB", progress: 100, done: true },
]

const MOCK_TRACKS: TrackRow[] = [
  { id: "t1", fileName: "SunRa_SpaceIsThePlace_Take01.wav", trackName: "Space Is the Place", composer: "Sun Ra", duration: "4:54", matchScore: 80, assignedFile: "f1" },
  { id: "t2", fileName: "SunRa_HelioCentricWorlds_01.wav", trackName: "Heliocentric", composer: "Sun Ra", duration: "12:18", matchScore: 80, assignedFile: "f2" },
  { id: "t3", fileName: "SunRa_Atlantis_Side1_Master.wav", trackName: "Atlantis", composer: "Sun Ra", duration: "8:37", matchScore: 20, assignedFile: "f3" },
]

const TYPE_LABELS: Record<ContentType, string> = { album: "Album", single: "Single", ep: "EP", song: "Song" }

// ─── Shared primitives ───────────────────────────────────────────────────────────

function EntityAvatar({ initials, size = "md" }: { initials: string; size?: "sm" | "md" }) {
  return (
    <div className={cn(
      "rounded-full bg-secondary flex items-center justify-center shrink-0 font-medium text-secondary-foreground select-none",
      size === "sm" ? "size-7 text-xs" : "size-11 text-sm"
    )}>
      {initials}
    </div>
  )
}

function TypeBadge({ type }: { type: ContentType }) {
  const Icon = type === "album" || type === "ep" ? Disc3 : Music2
  return (
    <span className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground rounded-md px-1.5 py-0.5 text-xs font-normal shrink-0">
      <Icon className="size-3" />
      {TYPE_LABELS[type]}
    </span>
  )
}

function MatchBadge({ score }: { score: number }) {
  const good = score >= 60
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-normal",
      good ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
    )}>
      {good ? <Check className="size-3" /> : <AlertTriangle className="size-3" />}
      {score}% Match
    </span>
  )
}

function CoverThumb() {
  return (
    <div className="size-12 rounded-sm bg-secondary shrink-0 flex items-center justify-center shadow-sm">
      <Music2 className="size-4 text-muted-foreground" />
    </div>
  )
}

// ─── Step 1: Access & Earnings ───────────────────────────────────────────────────

function StepAccess({
  entityId, onEntityChange,
  monetization, onMonetizationChange,
  listenPrice, onListenPriceChange,
  downloadPrice, onDownloadPriceChange,
  nameYourPrice, onNameYourPriceChange,
}: {
  entityId: string; onEntityChange: (id: string) => void
  monetization: MonetizationType; onMonetizationChange: (t: MonetizationType) => void
  listenPrice: string; onListenPriceChange: (v: string) => void
  downloadPrice: string; onDownloadPriceChange: (v: string) => void
  nameYourPrice: boolean; onNameYourPriceChange: (v: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const entity = ENTITIES.find(e => e.id === entityId)
  const artists = ENTITIES.filter(e => e.type === "artist")
  const labels = ENTITIES.filter(e => e.type === "label")

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div className="flex flex-col gap-8 max-w-lg">
      {/* Upload as */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Upload as</h2>
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-3 h-11 px-3 rounded-xl border border-border bg-background hover:bg-muted transition-colors w-full"
          >
            {entity && <EntityAvatar initials={entity.initials} size="sm" />}
            <span className="flex-1 text-left text-sm font-normal">{entity?.name ?? "Choose…"}</span>
            <ChevronDown className={cn("size-4 text-muted-foreground transition-transform duration-150", open && "rotate-180")} />
          </button>

          {open && (
            <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-72 bg-background border border-border rounded-xl shadow-md py-3 flex flex-col">
              <p className="px-5 pb-1.5 pt-0.5 text-sm text-muted-foreground">Choose artist</p>
              {artists.map(a => (
                <button
                  key={a.id}
                  onClick={() => { onEntityChange(a.id); setOpen(false) }}
                  className={cn("flex items-center gap-3 mx-2 px-2 py-2 rounded-md text-left transition-colors", entityId === a.id ? "bg-muted" : "hover:bg-muted")}
                >
                  <EntityAvatar initials={a.initials} />
                  <span className="text-sm">{a.name}</span>
                </button>
              ))}
              <hr className="border-border mx-4 my-2" />
              <p className="px-5 pb-1.5 text-sm text-muted-foreground">Choose label</p>
              {labels.map(l => (
                <button
                  key={l.id}
                  onClick={() => { onEntityChange(l.id); setOpen(false) }}
                  className={cn("flex items-center gap-3 mx-2 px-2 py-2 rounded-md text-left transition-colors", entityId === l.id ? "bg-muted" : "hover:bg-muted")}
                >
                  <EntityAvatar initials={l.initials} />
                  <span className="text-sm">{l.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Monetisation */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Monetisation</h2>
        <p className="text-xs text-muted-foreground -mt-1">Choose how listeners access this release</p>

        <div className="flex flex-col gap-2">
          {/* Streaming */}
          <button
            onClick={() => onMonetizationChange("streaming")}
            className={cn("flex items-start gap-4 px-4 py-4 rounded-xl border transition-colors text-left", monetization === "streaming" ? "border-primary" : "border-border hover:border-foreground/20")}
          >
            <div className={cn("mt-0.5 size-4 rounded-full border-2 flex items-center justify-center shrink-0", monetization === "streaming" ? "border-primary" : "border-muted-foreground")}>
              {monetization === "streaming" && <div className="size-2 rounded-full bg-primary" />}
            </div>
            <div>
              <p className="text-sm font-medium">For streaming</p>
              <p className="text-xs text-muted-foreground mt-0.5">Anyone on Muza can listen · you earn per play</p>
            </div>
          </button>

          {/* Purchase */}
          <div
            onClick={() => onMonetizationChange("purchase")}
            className={cn("flex flex-col gap-0 px-4 py-4 rounded-xl border transition-colors cursor-pointer", monetization === "purchase" ? "border-primary" : "border-border hover:border-foreground/20")}
          >
            <div className="flex items-start gap-4">
              <div className={cn("mt-0.5 size-4 rounded-full border-2 flex items-center justify-center shrink-0", monetization === "purchase" ? "border-primary" : "border-muted-foreground")}>
                {monetization === "purchase" && <div className="size-2 rounded-full bg-primary" />}
              </div>
              <div>
                <p className="text-sm font-medium">For purchase</p>
                <p className="text-xs text-muted-foreground mt-0.5">Fans pay to unlock · you set your price</p>
              </div>
            </div>

            {monetization === "purchase" && (
              <div className="flex flex-col gap-4 mt-4 ml-8" onClick={e => e.stopPropagation()}>
                {/* Listen price — required */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground">Price for listening <span className="text-foreground">*</span></label>
                    <label className="flex items-center gap-1.5 cursor-pointer" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={nameYourPrice}
                        onChange={e => onNameYourPriceChange(e.target.checked)}
                        className="size-3.5 accent-primary rounded-sm"
                      />
                      <span className="text-xs text-muted-foreground">Name your price</span>
                    </label>
                  </div>
                  {!nameYourPrice && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground shrink-0">$</span>
                      <Input value={listenPrice} onChange={e => onListenPriceChange(e.target.value)} className="h-9 text-sm" placeholder="1.00" />
                      <span className="text-xs text-muted-foreground shrink-0">USD</span>
                    </div>
                  )}
                  {nameYourPrice && <p className="text-xs text-muted-foreground italic">Listeners choose how much to pay</p>}
                </div>

                {/* Download price — optional */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-muted-foreground">
                    Price for download <span className="opacity-60 text-xs">(optional)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground shrink-0">$</span>
                    <Input value={downloadPrice} onChange={e => onDownloadPriceChange(e.target.value)} className="h-9 text-sm" placeholder="Leave blank to skip" />
                    <span className="text-xs text-muted-foreground shrink-0">USD</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

// ─── Step 2: Select Release ──────────────────────────────────────────────────────

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  )
}

function ReleaseDetailCard({ release }: { release: Release }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 mt-1">
      <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5">
        <span className="text-xs">🔒</span>
        Imported from MusicBrainz and Discogs · not editable
      </p>
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <InfoField label="Album title" value={release.title} />
        <InfoField label="Main Artist(s)" value={release.mainArtists.join(", ")} />
        <InfoField label="Band" value={release.band ?? "—"} />
        <InfoField label="Label" value={release.label ?? "—"} />
        <InfoField label="Catalog number" value={release.catalogNumber ?? "—"} />
        <InfoField label="Release type" value={TYPE_LABELS[release.type]} />
        <InfoField label="Recording date" value={release.recordingDate ?? String(release.year)} />
        <InfoField label="Tracks" value={String(release.tracks)} />
        <InfoField label="Country" value={release.country ?? "—"} />
      </div>
    </div>
  )
}

function NewReleaseForm({ form, onChange }: { form: ReleaseForm; onChange: (f: ReleaseForm) => void }) {
  return (
    <div className="flex flex-col gap-4 mt-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Album title <span className="text-foreground">*</span></label>
          <Input value={form.title} onChange={e => onChange({ ...form, title: e.target.value })} placeholder="Title" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Release type</label>
          <select
            value={form.type}
            onChange={e => onChange({ ...form, type: e.target.value as ContentType })}
            className="h-10 w-full rounded-full border border-border bg-background px-3 text-sm font-normal text-foreground focus:outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 appearance-none"
          >
            {(["album", "single", "ep", "song"] as ContentType[]).map(t => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main artists — multi */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-muted-foreground">Main Artist(s) <span className="text-foreground">*</span></label>
        <div className="flex flex-col gap-2">
          {form.mainArtists.map((a, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={a}
                onChange={e => {
                  const next = [...form.mainArtists]; next[i] = e.target.value
                  onChange({ ...form, mainArtists: next })
                }}
                placeholder="Artist name"
              />
              {form.mainArtists.length > 1 && (
                <button
                  onClick={() => onChange({ ...form, mainArtists: form.mainArtists.filter((_, j) => j !== i) })}
                  className="size-8 shrink-0 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          ))}
          <Button variant="ghost" size="sm" className="self-start gap-1.5" onClick={() => onChange({ ...form, mainArtists: [...form.mainArtists, ""] })}>
            <Plus className="size-3.5" />Add artist
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Band name</label>
          <Input value={form.band} onChange={e => onChange({ ...form, band: e.target.value })} placeholder="Band / ensemble" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Label</label>
          <Input value={form.label} onChange={e => onChange({ ...form, label: e.target.value })} placeholder="Record label" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Catalog number</label>
          <Input value={form.catalogNumber} onChange={e => onChange({ ...form, catalogNumber: e.target.value })} placeholder="e.g. ABC-123" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Recording date</label>
          <Input value={form.recordingDate} onChange={e => onChange({ ...form, recordingDate: e.target.value })} placeholder="e.g. 1973" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Tracks</label>
          <Input value={form.tracks} onChange={e => onChange({ ...form, tracks: e.target.value })} placeholder="Number of tracks" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Country</label>
          <Input value={form.country} onChange={e => onChange({ ...form, country: e.target.value })} placeholder="e.g. US" />
        </div>
      </div>
    </div>
  )
}

function StepRelease({
  searchQuery, onSearchChange, searchMode, searchResults,
  selectedRelease, onSelectRelease, onClearSelection, onCreateNew,
  isCreatingNew, newForm, onNewFormChange,
}: {
  searchQuery: string; onSearchChange: (q: string) => void
  searchMode: SearchMode; searchResults: Release[]
  selectedRelease: Release | null
  onSelectRelease: (r: Release) => void; onClearSelection: () => void; onCreateNew: () => void
  isCreatingNew: boolean; newForm: ReleaseForm; onNewFormChange: (f: ReleaseForm) => void
}) {
  const dropRef = useRef<HTMLDivElement>(null)
  const showDrop = searchMode === "searching" || searchMode === "results" || searchMode === "not-found"

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Find your release</h2>
        <p className="text-xs text-muted-foreground -mt-1">Search by title, artist, catalogue number or barcode</p>

        <div className="relative" ref={dropRef}>
          <div className={cn(
            "flex items-center gap-2 h-10 px-3 rounded-full border transition-colors",
            searchMode === "selected" || searchMode === "creating" ? "border-ring bg-muted" : "border-border bg-background"
          )}>
            <Search className="size-4 text-muted-foreground shrink-0" />
            <input
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search releases…"
              className="flex-1 bg-transparent text-sm font-normal outline-none text-foreground placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button onClick={onClearSelection}>
                <X className="size-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          {/* Suggestions dropdown */}
          {showDrop && (
            <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-background border border-border rounded-xl shadow-md py-3">
              {searchMode === "searching" && (
                <div className="flex items-center gap-2 px-4 py-3">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Searching…</span>
                </div>
              )}
              {searchMode === "results" && searchResults.map(r => (
                <button
                  key={r.id}
                  onClick={() => onSelectRelease(r)}
                  className="flex items-start gap-3 w-full mx-0 px-3 py-2 hover:bg-muted text-left transition-colors"
                >
                  <CoverThumb />
                  <div className="flex flex-col gap-1 min-w-0">
                    <p className="text-sm font-normal truncate">{r.title}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <TypeBadge type={r.type} />
                      <span className="text-xs text-muted-foreground truncate">
                        {r.mainArtists[0]} · {r.title} · {r.year}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
              {searchMode === "not-found" && (
                <p className="px-4 py-2 text-sm text-muted-foreground">No results for &ldquo;{searchQuery}&rdquo;</p>
              )}
              <hr className="border-border mx-3 my-1.5" />
              <div className="flex items-center justify-between px-4 py-1">
                <span className="text-xs text-muted-foreground">Can&rsquo;t find your release?</span>
                <Button variant="ghost" size="sm" className="text-primary h-7 px-2 text-xs gap-1" onClick={onCreateNew}>
                  <Plus className="size-3.5" />Create new release
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Selected locked card */}
        {searchMode === "selected" && selectedRelease && (
          <div>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-muted/30">
              <CoverThumb />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-normal truncate">{selectedRelease.title}</p>
                  <TypeBadge type={selectedRelease.type} />
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {selectedRelease.mainArtists.join(", ")}
                  {selectedRelease.band ? ` · ${selectedRelease.band}` : ""}
                  {` · ${selectedRelease.year} · ${selectedRelease.tracks} tracks`}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="shrink-0 text-xs" onClick={onClearSelection}>Change</Button>
            </div>
            <ReleaseDetailCard release={selectedRelease} />
          </div>
        )}

        {/* New release form */}
        {searchMode === "creating" && (
          <NewReleaseForm form={newForm} onChange={onNewFormChange} />
        )}

        {searchMode === "idle" && (
          <p className="text-xs text-muted-foreground">Details are looked up from MusicBrainz and Discogs automatically</p>
        )}
      </section>
    </div>
  )
}

// ─── Step 3: Upload Files ────────────────────────────────────────────────────────

function FileRow({ file, onRemove }: { file: UploadFile; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 py-2 px-1 group">
      <FileAudio className="size-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs truncate">{file.name}</p>
        {!file.done && (
          <div className="mt-1 h-1 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${file.progress}%` }} />
          </div>
        )}
      </div>
      <span className="text-xs text-muted-foreground shrink-0">{file.size}</span>
      {file.done
        ? <Check className="size-4 text-green-500 shrink-0" />
        : <Loader2 className="size-4 text-muted-foreground animate-spin shrink-0" />
      }
      <button onClick={onRemove} className="size-6 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
        <X className="size-3" />
      </button>
    </div>
  )
}

function StepUpload({
  files, onFilesChange, isDragging, onDragChange,
}: {
  files: UploadFile[]; onFilesChange: (f: UploadFile[]) => void
  isDragging: boolean; onDragChange: (v: boolean) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function addFiles(fileList: FileList) {
    const newFiles = Array.from(fileList).map((f, i) => ({
      id: `new-${i}-${Date.now()}`,
      name: f.name,
      size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
      progress: 0,
      done: false,
    }))
    onFilesChange([...files, ...newFiles])
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Upload audio files</h2>
        <p className="text-xs text-muted-foreground -mt-1">WAV · FLAC · AIFF · up to 2 GB per file</p>

        <div
          onDragOver={e => { e.preventDefault(); onDragChange(true) }}
          onDragLeave={() => onDragChange(false)}
          onDrop={e => { e.preventDefault(); onDragChange(false); addFiles(e.dataTransfer.files) }}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:bg-muted/50"
          )}
        >
          <CloudUpload className="size-8 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">Drag audio files here</p>
            <p className="text-xs text-muted-foreground mt-1">
              or <span className="text-primary underline underline-offset-2">browse files</span>
            </p>
          </div>
        </div>
        <input ref={fileInputRef} type="file" multiple accept=".wav,.flac,.aiff,.mp3" className="hidden"
          onChange={e => e.target.files && addFiles(e.target.files)} />

        {files.length > 0 && (
          <div className="flex flex-col divide-y divide-border">
            {files.map(f => (
              <FileRow key={f.id} file={f} onRemove={() => onFilesChange(files.filter(x => x.id !== f.id))} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

// ─── Step 4: Review & Publish ────────────────────────────────────────────────────

function StepReview({
  release, isNew, newForm, tracks, onTracksChange, files,
}: {
  release: Release | null; isNew: boolean; newForm: ReleaseForm
  tracks: TrackRow[]; onTracksChange: (t: TrackRow[]) => void; files: UploadFile[]
}) {
  const matched = tracks.filter(t => t.matchScore >= 60).length

  return (
    <div className="flex flex-col gap-6">
      {/* Release summary */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Review & confirm</h2>
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl border border-border bg-muted/30">
          <CoverThumb />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-normal truncate">
                {isNew ? newForm.title || "Untitled" : release?.title}
              </p>
              <TypeBadge type={isNew ? newForm.type : (release?.type ?? "album")} />
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {isNew
                ? newForm.mainArtists.filter(Boolean).join(", ")
                : `${release?.mainArtists.join(", ")} · ${release?.year}`
              }
            </p>
          </div>
          {!isNew && (
            <span className={cn(
              "text-xs px-3 py-1 rounded-full shrink-0",
              matched === tracks.length ? "bg-green-50 text-green-700"
                : matched > 0 ? "bg-yellow-50 text-yellow-700"
                : "bg-red-50 text-red-600"
            )}>
              {matched}/{tracks.length} Matches
            </span>
          )}
        </div>
      </section>

      {/* Track matching */}
      <section>
        <h2 className="text-sm font-semibold mb-3">Track matching</h2>
        <div className="rounded-xl border border-border overflow-hidden">
          {/* Header */}
          <div className={cn(
            "grid border-b border-border px-4 py-2.5 bg-muted/40 text-xs text-muted-foreground",
            isNew ? "grid-cols-[28px_1fr_1fr_1fr_52px_32px]" : "grid-cols-[28px_1fr_1fr_120px]"
          )}>
            <span>#</span>
            <span>{isNew ? "Song name" : "Title"}</span>
            <span>Audio file</span>
            {isNew && <span>Composer</span>}
            {isNew && <span>Time</span>}
            {!isNew && <span className="text-right">Match</span>}
          </div>

          {tracks.map((track, i) => (
            <div
              key={track.id}
              className={cn(
                "grid items-center px-4 py-3 border-b border-border last:border-0 gap-3",
                isNew ? "grid-cols-[28px_1fr_1fr_1fr_52px_32px]" : "grid-cols-[28px_1fr_1fr_120px]"
              )}
            >
              <span className="text-xs text-muted-foreground">{i + 1}</span>

              {/* Track name */}
              {isNew ? (
                <Input
                  value={track.trackName}
                  onChange={e => onTracksChange(tracks.map((t, j) => j === i ? { ...t, trackName: e.target.value } : t))}
                  className="h-8 text-xs"
                />
              ) : (
                <span className="text-sm truncate">{track.trackName}</span>
              )}

              {/* Audio file dropdown */}
              <div className="relative">
                <select
                  value={track.assignedFile}
                  onChange={e => onTracksChange(tracks.map((t, j) => j === i ? { ...t, assignedFile: e.target.value } : t))}
                  className="h-8 w-full rounded-full border border-border bg-background pl-3 pr-7 text-xs text-foreground focus:outline-none focus:border-ring appearance-none cursor-pointer"
                >
                  {files.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              </div>

              {/* New: composer */}
              {isNew && (
                <Input
                  value={track.composer}
                  onChange={e => onTracksChange(tracks.map((t, j) => j === i ? { ...t, composer: e.target.value } : t))}
                  className="h-8 text-xs"
                />
              )}
              {/* New: duration */}
              {isNew && <span className="text-xs text-muted-foreground">{track.duration}</span>}

              {/* DB: match score */}
              {!isNew && <div className="flex justify-end"><MatchBadge score={track.matchScore} /></div>}

              {/* New: delete */}
              {isNew && (
                <button
                  onClick={() => onTracksChange(tracks.filter((_, j) => j !== i))}
                  className="size-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

// ─── Right Panel ─────────────────────────────────────────────────────────────────

function RightPanel({
  files, onFilesChange, isDragging, onDragChange,
}: {
  files: UploadFile[]; onFilesChange: (f: UploadFile[]) => void
  isDragging: boolean; onDragChange: (v: boolean) => void
}) {
  const coverRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

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
      {/* Cover art */}
      <section className="flex flex-col gap-2">
        <p className="text-xs font-semibold">Cover art</p>
        <div
          onClick={() => coverRef.current?.click()}
          className="aspect-square w-full rounded-xl border border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <ImagePlus className="size-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Add cover image</p>
        </div>
        <input ref={coverRef} type="file" accept="image/*" className="hidden" />
      </section>

      {/* Audio files */}
      <section className="flex flex-col gap-2">
        <p className="text-xs font-semibold">Audio files</p>

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
            <p className="text-xs text-center text-muted-foreground">
              Drag audio files here<br />
              or <span className="text-primary underline underline-offset-2">browse files</span>
            </p>
            <p className="text-[10px] text-muted-foreground opacity-60">WAV · FLAC · AIFF · up to 2 GB</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {files.map(f => (
              <FileRow key={f.id} file={f} onRemove={() => onFilesChange(files.filter(x => x.id !== f.id))} />
            ))}
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mt-2 px-1 transition-colors"
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

// ─── Stepper footer ──────────────────────────────────────────────────────────────

const STEPS: { num: Step; label: string }[] = [
  { num: 1, label: "Access & Earnings" },
  { num: 2, label: "Select Release" },
  { num: 3, label: "Upload Files" },
  { num: 4, label: "Review & Publish" },
]

function StepBar({ step, onBack, onNext, canNext, onClose }: {
  step: Step; onBack: () => void; onNext: () => void; canNext: boolean; onClose: () => void
}) {
  return (
    <footer className="shrink-0 flex items-center justify-between px-10 h-[72px] border-t border-border bg-muted/60">
      <div className="w-28">
        {step > 1
          ? <Button variant="secondary" size="sm" onClick={onBack}>Back</Button>
          : <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground">Cancel</Button>
        }
      </div>

      {/* Steps */}
      <div className="flex items-center">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className="flex flex-col items-center gap-1 w-[100px]">
              <div className={cn(
                "size-[26px] rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                step > s.num ? "bg-foreground text-background"
                  : step === s.num ? "bg-foreground text-background"
                  : "bg-secondary text-muted-foreground"
              )}>
                {step > s.num ? <Check className="size-3" /> : s.num}
              </div>
              <p className={cn(
                "text-[10px] text-center leading-tight",
                step === s.num ? "text-foreground" : "text-muted-foreground"
              )}>
                {s.label}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("h-px w-10 mb-4 transition-colors", step > s.num ? "bg-foreground/40" : "bg-border")} />
            )}
          </div>
        ))}
      </div>

      <div className="w-28 flex justify-end">
        <Button size="sm" disabled={!canNext} onClick={onNext}>
          {step === 4 ? "Publish" : "Continue"}
        </Button>
      </div>
    </footer>
  )
}

// ─── Main dialog ─────────────────────────────────────────────────────────────────

export function UploadMusicDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep]                     = useState<Step>(1)
  // Step 1
  const [entityId, setEntityId]             = useState("a1")
  const [monetization, setMonetization]     = useState<MonetizationType>("streaming")
  const [listenPrice, setListenPrice]       = useState("1.00")
  const [downloadPrice, setDownloadPrice]   = useState("")
  const [nameYourPrice, setNameYourPrice]   = useState(false)
  // Step 2
  const [searchQuery, setSearchQuery]       = useState("")
  const [searchMode, setSearchMode]         = useState<SearchMode>("idle")
  const [searchResults, setSearchResults]   = useState<Release[]>([])
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null)
  const [isCreatingNew, setIsCreatingNew]   = useState(false)
  const [newForm, setNewForm]               = useState<ReleaseForm>({
    title: "", mainArtists: [""], band: "", label: "",
    catalogNumber: "", type: "album", recordingDate: "", tracks: "", country: ""
  })
  // Step 3
  const [files, setFiles]                   = useState<UploadFile[]>([])
  const [isDragging, setIsDragging]         = useState(false)
  // Step 4
  const [tracks, setTracks]                 = useState<TrackRow[]>(MOCK_TRACKS)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset when opening
  useEffect(() => {
    if (!open) return
    setStep(1); setSearchQuery(""); setSearchMode("idle")
    setSearchResults([]); setSelectedRelease(null); setIsCreatingNew(false)
    setFiles([]); setNewForm({ title: "", mainArtists: [""], band: "", label: "", catalogNumber: "", type: "album", recordingDate: "", tracks: "", country: "" })
  }, [open])

  // Live search
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (searchMode === "selected" || searchMode === "creating") return
    if (searchQuery.length < 2) { setSearchMode("idle"); setSearchResults([]); return }
    setSearchMode("searching")
    timerRef.current = setTimeout(() => {
      const q = searchQuery.toLowerCase()
      const hits = MOCK_RELEASES.filter(r => r.title.toLowerCase().includes(q) || r.mainArtists.some(a => a.toLowerCase().includes(q)))
      setSearchResults(hits)
      setSearchMode(hits.length > 0 ? "results" : "not-found")
    }, 320)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [searchQuery]) // eslint-disable-line

  // Upload progress simulation
  useEffect(() => {
    if (!files.some(f => !f.done)) return
    const iv = setInterval(() => {
      setFiles(prev => prev.map(f => f.done ? f : { ...f, progress: Math.min(f.progress + 4, 100), done: f.progress >= 96 }))
    }, 180)
    return () => clearInterval(iv)
  }, [files])

  function selectRelease(r: Release) {
    setSelectedRelease(r); setSearchMode("selected"); setSearchQuery(r.title); setIsCreatingNew(false)
  }
  function clearSelection() {
    setSelectedRelease(null); setIsCreatingNew(false); setSearchQuery(""); setSearchMode("idle")
  }
  function startCreating() {
    setIsCreatingNew(true); setSelectedRelease(null); setSearchMode("creating")
    setNewForm(f => ({ ...f, title: searchQuery }))
  }

  function handleNext() {
    if (step === 3 && files.length === 0) setFiles(MOCK_FILES)
    if (step < 4) setStep(s => (s + 1) as Step)
    else onClose()
  }

  const canNext = step === 2 ? (selectedRelease !== null || isCreatingNew) : true

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-10 h-[57px] border-b border-border">
        <span className="text-base font-medium">Upload Music</span>
        <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Left */}
        <div className="flex-1 min-w-0 overflow-y-auto px-10 py-8">
          {step === 1 && (
            <StepAccess
              entityId={entityId} onEntityChange={setEntityId}
              monetization={monetization} onMonetizationChange={setMonetization}
              listenPrice={listenPrice} onListenPriceChange={setListenPrice}
              downloadPrice={downloadPrice} onDownloadPriceChange={setDownloadPrice}
              nameYourPrice={nameYourPrice} onNameYourPriceChange={setNameYourPrice}
            />
          )}
          {step === 2 && (
            <StepRelease
              searchQuery={searchQuery}
              onSearchChange={q => {
                setSearchQuery(q)
                if (searchMode === "selected" || searchMode === "creating") {
                  setSelectedRelease(null); setIsCreatingNew(false); setSearchMode("idle")
                }
              }}
              searchMode={searchMode} searchResults={searchResults}
              selectedRelease={selectedRelease}
              onSelectRelease={selectRelease} onClearSelection={clearSelection} onCreateNew={startCreating}
              isCreatingNew={isCreatingNew} newForm={newForm} onNewFormChange={setNewForm}
            />
          )}
          {step === 3 && (
            <StepUpload files={files} onFilesChange={setFiles} isDragging={isDragging} onDragChange={setIsDragging} />
          )}
          {step === 4 && (
            <StepReview
              release={selectedRelease} isNew={isCreatingNew} newForm={newForm}
              tracks={tracks} onTracksChange={setTracks} files={files}
            />
          )}
        </div>

        {/* Right panel */}
        <div className="w-[260px] shrink-0 border-l border-border px-5 py-8 overflow-y-auto">
          <RightPanel files={files} onFilesChange={setFiles} isDragging={isDragging} onDragChange={setIsDragging} />
        </div>
      </div>

      {/* Stepper footer */}
      <StepBar step={step} onBack={() => setStep(s => Math.max(1, s - 1) as Step)} onNext={handleNext} canNext={canNext} onClose={onClose} />
    </div>
  )
}
