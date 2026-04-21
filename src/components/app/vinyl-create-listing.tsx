"use client"

/*
 * VinylCreateListing — full-page form for creating or editing a Vinyl product.
 *
 * Mirrors the Figma flow (node 7860:211319) with eight stacked sections:
 *   1. Release Information     — title combobox with inline "add unlinked" row
 *   2. Image Upload            — drop zone for cover art
 *   3. Artists & Credits       — main artist chips, featured search, credits
 *   4. Tracklist               — disk-grouped track rows with variable-length disks
 *   5. Pricing & Inventory     — fixed-price / name-your-price tabs, stock, digital DL
 *   6. Shipping                — per-region pricing rows with Free override
 *   7. Description             — free-form product description
 *   8. Visibility & Publishing — publish state, schedule, pre-order
 *
 * Entry points live in ShopMyProductsView:
 *   - "Add product" → AddProductDialog → Vinyl → <VinylCreateListing mode="create" />
 *   - Row dropdown → "Edit" → <VinylCreateListing mode="edit" product={…} />
 */

import React, { useMemo, useState } from "react"
import {
  Upload, Plus, Minus, X, Link2, GripVertical, Trash2, Disc3,
} from "lucide-react"

import { Badge, ContentTypeBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Chip, ChipDismiss, ChipGroup } from "@/components/ui/chip"
import { InputSelect } from "@/components/ui/input-select"
import { Separator } from "@/components/ui/separator"
import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/lib/utils"
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs"
import {
  Combobox, ComboboxTrigger, ComboboxContent,
  ComboboxItem, ComboboxSeparator, ComboboxGroup, ComboboxGroupLabel,
} from "@/components/ui/combobox"

// ─── Section wrapper ──────────────────────────────────────────────────────────

function FormSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-background border border-border rounded-xl px-8 py-6 flex flex-col gap-6">
      <h2 className="text-base font-medium text-foreground">{title}</h2>
      {children}
    </section>
  )
}

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-2 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-2xsmall text-muted-foreground">{hint}</p>}
    </div>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const RELEASE_TYPES = ["Album", "Single", "EP", "Compilation"] as const
type ReleaseType = (typeof RELEASE_TYPES)[number]

const CURRENCIES = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
]

/** Mock existing releases the user can link a product to. */
interface ExistingRelease {
  value:  string
  title:  string
  artist: string
  year:   number
  type:   "album" | "single" | "ep"
  cover:  string
  tracks: { side: string; title: string; duration: string }[]
}

const EXISTING_RELEASES: ExistingRelease[] = [
  {
    value: "springtime-again", title: "Springtime Again", artist: "Sleeping Beauty",
    year: 1979, type: "album", cover: "https://picsum.photos/seed/springtime/96/96",
    tracks: [
      { side: "A", title: "Springtime Again",  duration: "04:12" },
      { side: "A", title: "Into the Woods",    duration: "05:48" },
      { side: "B", title: "Sleeping Beauty",   duration: "06:03" },
      { side: "B", title: "Midnight Suite",    duration: "07:22" },
    ],
  },
  {
    value: "city-lights", title: "City Lights", artist: "Chris Test",
    year: 2024, type: "album", cover: "https://picsum.photos/seed/citylights/96/96",
    tracks: [
      { side: "A", title: "City Lights",  duration: "03:45" },
      { side: "A", title: "Neon Streets", duration: "04:20" },
      { side: "B", title: "Rooftop",      duration: "05:10" },
    ],
  },
  {
    value: "night-sessions", title: "Night Sessions", artist: "Chris Test",
    year: 2023, type: "ep", cover: "https://picsum.photos/seed/nightsess/96/96",
    tracks: [
      { side: "A", title: "After Midnight", duration: "04:02" },
      { side: "A", title: "Dim the Lights", duration: "03:37" },
    ],
  },
  {
    value: "golden-hour", title: "Golden Hour", artist: "Chris Test",
    year: 2022, type: "single", cover: "https://picsum.photos/seed/goldenhour/96/96",
    tracks: [
      { side: "A", title: "Golden Hour", duration: "03:58" },
    ],
  },
]

// ─── Release Title combobox ───────────────────────────────────────────────────
//
// Extends the stock Combobox with a first-row "+ Add as unlinked Release"
// suggestion when the user types anything, matching the Figma dropdown spec.
// Selecting that row sets the title without linking to any existing release.

function ReleaseTitleCombobox({
  value, onValueChange, onLinkedRelease,
}: {
  value: string
  onValueChange: (v: string) => void
  /** Fires when the user picks an existing release from the suggestions —
   *  used by the parent to prefill year, artist, tracklist, etc. */
  onLinkedRelease: (release: ExistingRelease) => void
}) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return EXISTING_RELEASES
    return EXISTING_RELEASES.filter(r =>
      r.title.toLowerCase().includes(q) || r.artist.toLowerCase().includes(q),
    )
  }, [query])

  const showAddUnlinked = query.trim().length > 0

  // Combobox uses string item ids; the "+ Add as unlinked" row is surfaced
  // with a sentinel id of `__unlinked__:<query>`, the existing-release rows
  // with `linked:<slug>`. The parent only ever receives the chosen title.
  const items = useMemo(() => {
    const rows: string[] = []
    if (showAddUnlinked) rows.push(`__unlinked__:${query}`)
    filtered.forEach(r => rows.push(`linked:${r.value}`))
    return rows
  }, [showAddUnlinked, query, filtered])

  return (
    <Combobox
      items={items}
      value={value}
      onInputValueChange={setQuery}
      onValueChange={v => {
        const s = typeof v === "string" ? v : ""
        if (s.startsWith("__unlinked__:")) onValueChange(s.slice("__unlinked__:".length))
        else if (s.startsWith("linked:")) {
          const slug = s.slice("linked:".length)
          const rec = EXISTING_RELEASES.find(r => r.value === slug)
          if (rec) {
            onValueChange(rec.title)
            onLinkedRelease(rec)
          }
        } else onValueChange(s)
      }}
    >
      <ComboboxTrigger placeholder="Enter Release Title" showSearchIcon={false} />
      <ComboboxContent>
        {showAddUnlinked && (
          <>
            <ComboboxItem
              value={`__unlinked__:${query}`}
              hideIndicator
              className="text-primary font-normal"
            >
              <Plus className="size-4" />
              Add "{query}" as unlinked Release
            </ComboboxItem>
            {filtered.length > 0 && <ComboboxSeparator />}
          </>
        )}
        {filtered.length > 0 && (
          <ComboboxGroup>
            <ComboboxGroupLabel>Link to existing release</ComboboxGroupLabel>
            {filtered.map(r => (
              <ComboboxItem
                key={r.value}
                value={`linked:${r.value}`}
                hideIndicator
                className="gap-3 py-2"
              >
                <img
                  src={r.cover}
                  alt=""
                  className="size-12 rounded-xs shrink-0 object-cover shadow-sm"
                />
                <span className="flex flex-col gap-1 flex-1 min-w-0">
                  <span className="text-small font-normal leading-none truncate">{r.title}</span>
                  <span className="flex items-center gap-1.5">
                    <ContentTypeBadge type={r.type} />
                    <span className="text-small text-muted-foreground font-normal truncate">
                      {r.artist} · {r.year}
                    </span>
                  </span>
                </span>
              </ComboboxItem>
            ))}
          </ComboboxGroup>
        )}
      </ComboboxContent>
    </Combobox>
  )
}

// ─── Release Information ──────────────────────────────────────────────────────

function ReleaseInformationSection({
  title, onTitleChange,
  type, onTypeChange,
  year, onYearChange,
  variant, onVariantChange,
  onLinkedRelease,
  linked,
}: {
  title: string
  onTitleChange: (v: string) => void
  type: ReleaseType
  onTypeChange: (t: ReleaseType) => void
  year: string
  onYearChange: (v: string) => void
  variant: string
  onVariantChange: (v: string) => void
  onLinkedRelease: (release: ExistingRelease) => void
  /** True when the title is linked to an existing release — release-level
   *  fields (title, type, year) become read-only, sourced from the database. */
  linked: boolean
}) {
  const [showMore, setShowMore] = useState(false)

  return (
    <FormSection title="Release Information">
      <Field label="Release Title">
        <ReleaseTitleCombobox
          value={title}
          onValueChange={onTitleChange}
          onLinkedRelease={onLinkedRelease}
        />
      </Field>

      <Field
        label="Release Type"
        hint={linked ? "Pulled from the linked release — cannot be changed." : undefined}
      >
        {/* Uses the design-system Chip (filter outline toggle) — active chip
             renders via `selected` + `activeStyle="outline"`. When linked,
             only the active chip is shown since the release type is fixed. */}
        <ChipGroup>
          {RELEASE_TYPES.filter(t => !linked || t === type).map(t => (
            <Chip
              key={t}
              selected={type === t}
              activeStyle="outline"
              disabled={linked}
              onClick={() => !linked && onTypeChange(t)}
              className={cn(linked && "cursor-default opacity-80")}
            >
              {t}
            </Chip>
          ))}
        </ChipGroup>
      </Field>

      <Field label="Release Year">
        <Input
          placeholder="Enter Release Year"
          value={year}
          onChange={e => onYearChange(e.target.value)}
          inputMode="numeric"
          maxLength={4}
          disabled={linked}
        />
      </Field>

      <Field label="Variant (optional)" hint="e.g. Ghost vinyl, 180g">
        <Input
          placeholder="e.g. Ghost vinyl, 180g"
          value={variant}
          onChange={e => onVariantChange(e.target.value)}
        />
      </Field>

      {showMore && (
        <div className="pt-2 border-t border-border flex flex-col gap-6">
          <Field label="Catalog Number">
            <Input placeholder="e.g. MUZ-001" />
          </Field>
          <Field label="Country of Origin">
            <Input placeholder="e.g. United States" />
          </Field>
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="self-start -ml-3"
        onClick={() => setShowMore(s => !s)}
      >
        {showMore ? <Minus className="size-4" /> : <Plus className="size-4" />}
        {showMore ? "Fewer options" : "More options"}
      </Button>
    </FormSection>
  )
}

// ─── Image Upload ─────────────────────────────────────────────────────────────

function ImageUploadSection() {
  return (
    <FormSection title="Image Upload">
      <div className="border border-dashed border-border rounded-xl bg-muted/40 flex flex-col items-center justify-center gap-2 py-12 cursor-pointer hover:bg-muted transition-colors">
        <div className="size-10 rounded-full bg-background border border-border flex items-center justify-center">
          <Upload className="size-4 text-foreground" />
        </div>
        <p className="text-small text-foreground">Drag cover art here</p>
        <p className="text-xsmall text-muted-foreground">
          or <span className="text-primary">browse files</span>
        </p>
      </div>
      <p className="text-2xsmall text-muted-foreground">
        Requires JPG, PNG, or WEBP · Min 1600×1600px
      </p>
    </FormSection>
  )
}

// ─── Artists & Credits ────────────────────────────────────────────────────────

function ArtistsCreditsSection({
  mainArtists, setMainArtists, linked,
}: {
  mainArtists: string[]
  setMainArtists: React.Dispatch<React.SetStateAction<string[]>>
  /** True when the release is linked — main artist is pulled from the
   *  database and can't be edited. Featured artists and credits stay
   *  editable since they're product-level, not release-level. */
  linked: boolean
}) {
  const [featured, setFeatured] = useState<string[]>([])
  const [credits,  setCredits]  = useState<{ role: string; name: string }[]>([])

  return (
    <FormSection title="Artists & Credits">
      <Field
        label="Main Artist(s)"
        hint={
          linked
            ? "Pulled from the linked release."
            : "You always appear as the primary artist. Add more if this release is by multiple artists."
        }
      >
        {/* Chips row — primary artist is always shown and is not dismissable
             (it's the uploading account). Additional collaborators render as
             dismissable chips. Row is hidden when nothing is present. */}
        {mainArtists.length > 0 && (
          <ChipGroup className="mb-1">
            {mainArtists.map((a, i) =>
              i === 0 ? (
                <span
                  key={a}
                  className="inline-flex items-center rounded-full border border-border bg-muted px-3 h-8 text-2xsmall font-normal pb-px"
                >
                  {a}
                </span>
              ) : (
                <ChipDismiss
                  key={a}
                  onDismiss={() => setMainArtists(xs => xs.filter((_, j) => j !== i))}
                >
                  {a}
                </ChipDismiss>
              ),
            )}
          </ChipGroup>
        )}
        {/* Separate input for adding collaborators. Disabled while linked. */}
        {!linked && (
          <Input
            placeholder="Add another artist…"
            onKeyDown={e => {
              const v = (e.target as HTMLInputElement).value.trim()
              if (e.key === "Enter" && v) {
                e.preventDefault()
                setMainArtists(xs => [...xs, v])
                ;(e.target as HTMLInputElement).value = ""
              }
            }}
          />
        )}
      </Field>

      <Field
        label="Featured Artist(s)"
        hint="Optional — add guest performers or collaborators."
      >
        {/* Same pattern as Main Artist: chips above, input below. Featured
             artists are optional, so no default chip — the row is hidden
             until the user adds one. All chips are dismissable. */}
        {featured.length > 0 && (
          <ChipGroup className="mb-1">
            {featured.map((name, i) => (
              <ChipDismiss
                key={i}
                onDismiss={() => setFeatured(xs => xs.filter((_, j) => j !== i))}
              >
                {name}
              </ChipDismiss>
            ))}
          </ChipGroup>
        )}
        <Input
          placeholder="Add a featured artist…"
          onKeyDown={e => {
            const v = (e.target as HTMLInputElement).value.trim()
            if (e.key === "Enter" && v) {
              e.preventDefault()
              setFeatured(xs => [...xs, v])
              ;(e.target as HTMLInputElement).value = ""
            }
          }}
        />
      </Field>

      <div className="flex flex-col gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="self-start -ml-3"
          onClick={() => setCredits(xs => [...xs, { role: "", name: "" }])}
        >
          <Plus className="size-4" />
          Add Credits
        </Button>
        {credits.map((c, i) => (
          <div key={i} className="flex gap-2">
            <Input
              placeholder="Role (e.g. Producer)"
              value={c.role}
              onChange={e =>
                setCredits(xs =>
                  xs.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)),
                )
              }
            />
            <Input
              placeholder="Name"
              value={c.name}
              onChange={e =>
                setCredits(xs =>
                  xs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                )
              }
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCredits(xs => xs.filter((_, j) => j !== i))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </FormSection>
  )
}

// ─── Tracklist ────────────────────────────────────────────────────────────────

export interface Track {
  id:       string
  side:     string  // "A", "B", …
  title:    string
  duration: string
  linked?:  boolean
}

export const DEFAULT_TRACKS: Track[] = [
  { id: "1", side: "A", title: "Languidity", duration: "08:10", linked: true },
  { id: "2", side: "A", title: "",           duration: "00:00" },
  { id: "3", side: "B", title: "",           duration: "00:00" },
]

function TracklistSection({
  tracks, setTracks, linked,
}: {
  tracks: Track[]
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>
  /** When linked, tracks come from the release database — rows are read-only
   *  and the add/remove affordances are hidden. */
  linked: boolean
}) {
  // Disks are derived from the flat `tracks` array — each side filters the
  // same source. This lets the parent prefill the whole tracklist in one go
  // when the user links an existing release.
  const sides = useMemo(() => {
    const byS: Record<string, Track[]> = {}
    tracks.forEach(t => {
      (byS[t.side] ??= []).push(t)
    })
    return byS
  }, [tracks])
  const sideKeys = Object.keys(sides).sort()
  const hasDiskB = sideKeys.includes("B")

  function updateTrack(id: string, patch: Partial<Track>) {
    setTracks(xs => xs.map(x => (x.id === id ? { ...x, ...patch } : x)))
  }
  function removeTrack(id: string) {
    setTracks(xs => xs.filter(x => x.id !== id))
  }
  function addTrack(side: string) {
    setTracks(xs => [...xs, { id: crypto.randomUUID(), side, title: "", duration: "00:00" }])
  }

  /** Reorder: move `sourceId` before `targetId`. If the drop target is on a
   *  track of a different side, the moved track adopts the target's side so
   *  the disks stay consistent. */
  const [draggingId, setDraggingId] = useState<string | null>(null)
  function reorder(sourceId: string, targetId: string) {
    if (sourceId === targetId) return
    setTracks(xs => {
      const src  = xs.find(t => t.id === sourceId)
      const dst  = xs.find(t => t.id === targetId)
      if (!src || !dst) return xs
      const without = xs.filter(t => t.id !== sourceId)
      const idx     = without.findIndex(t => t.id === targetId)
      const moved   = { ...src, side: dst.side }
      return [...without.slice(0, idx), moved, ...without.slice(idx)]
    })
  }

  function TrackRow({
    track, index, onChange, onRemove,
  }: {
    track: Track
    index: number
    onChange: (t: Track) => void
    onRemove: () => void
  }) {
    const isDragging = draggingId === track.id
    // `handleArmed` is toggled on grip mousedown so the row is only
    // `draggable` while the grip is pressed — clicking anywhere else (inputs,
    // the remove button) behaves normally and doesn't initiate a drag.
    const [handleArmed, setHandleArmed] = useState(false)
    return (
      <div
        draggable={!linked && handleArmed}
        onDragStart={e => {
          e.dataTransfer.effectAllowed = "move"
          e.dataTransfer.setData("text/plain", track.id)
          setDraggingId(track.id)
        }}
        onDragEnd={() => {
          setDraggingId(null)
          setHandleArmed(false)
        }}
        onDragOver={e => {
          if (draggingId && draggingId !== track.id) {
            e.preventDefault()
            e.dataTransfer.dropEffect = "move"
          }
        }}
        onDrop={e => {
          e.preventDefault()
          const src = e.dataTransfer.getData("text/plain") || draggingId
          if (src) reorder(src, track.id)
          setDraggingId(null)
          setHandleArmed(false)
        }}
        className={cn(
          "flex items-center gap-2 py-2 rounded-md transition-colors",
          isDragging && "opacity-40",
          !linked && "hover:bg-muted/40",
        )}
      >
        {!linked && (
          <GripVertical
            onMouseDown={() => setHandleArmed(true)}
            onMouseUp={() => setHandleArmed(false)}
            className="size-4 text-muted-foreground/60 cursor-grab shrink-0 active:cursor-grabbing"
          />
        )}
        <span className="w-6 text-xsmall text-muted-foreground tabular-nums text-right">
          {index + 1}
        </span>
        <span className="w-6 text-xsmall text-muted-foreground text-center">
          {track.side}
        </span>
        <Input
          placeholder="Individual Track name"
          value={track.title}
          onChange={e => onChange({ ...track, title: e.target.value })}
          className="flex-1"
          disabled={linked}
        />
        <Input
          placeholder="00:00"
          value={track.duration}
          onChange={e => onChange({ ...track, duration: e.target.value })}
          className="w-[96px] tabular-nums text-center"
          disabled={linked}
        />
        {track.linked && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-1 text-2xsmall text-muted-foreground shrink-0">
            <Link2 className="size-3" />
            Linked
          </span>
        )}
        {!linked && (
          <Button variant="ghost" size="icon-sm" onClick={onRemove}>
            <X className="size-4" />
          </Button>
        )}
      </div>
    )
  }

  function Disk({ label, side }: { label: string; side: string }) {
    const items = sides[side] ?? []
    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-small font-medium text-foreground">Disk {label}</span>
        </div>
        <div className="flex flex-col divide-y divide-border">
          {items.map((t, i) => (
            <TrackRow
              key={t.id}
              track={t}
              index={i}
              onChange={u => updateTrack(t.id, u)}
              onRemove={() => removeTrack(t.id)}
            />
          ))}
        </div>
        {!linked && (
          <Button
            variant="ghost"
            size="sm"
            className="self-start -ml-3 mt-1"
            onClick={() => addTrack(side)}
          >
            <Plus className="size-4" />
            Add Track
          </Button>
        )}
      </div>
    )
  }

  return (
    <FormSection title="Tracklist">
      {sideKeys.map((k, i) => (
        <React.Fragment key={k}>
          {i > 0 && <Separator />}
          <Disk label={k} side={k} />
        </React.Fragment>
      ))}

      {!linked && !hasDiskB && (
        <Button
          variant="ghost"
          size="sm"
          className="self-start -ml-3"
          onClick={() => addTrack("B")}
        >
          <Plus className="size-4" />
          Add disk
        </Button>
      )}
    </FormSection>
  )
}

// ─── Pricing & Inventory ──────────────────────────────────────────────────────

function PricingInventorySection() {
  const [nameYourPrice, setNameYourPrice] = useState(false)
  const [price,    setPrice]    = useState("1.00")
  const [currency, setCurrency] = useState("USD")
  const [stock,    setStock]    = useState("")
  const [includeDL, setIncludeDL] = useState(false)
  const [code,     setCode]     = useState("")
  const [sku,      setSku]      = useState("")
  const [showMore, setShowMore] = useState(true)

  return (
    <FormSection title="Pricing & Inventory">
      {/* Single-column layout — price, stock, optional extras all stack
           flush to match the rest of the form's rhythm. */}
      <div className="flex flex-col gap-2">
        {/* Header row — label left, "Let fans pay more if they want" switch
             right. Flipping the switch turns "Price" into "Minimum Price". */}
        <div className="flex items-center justify-between">
          <Label>{nameYourPrice ? "Minimum Price" : "Price"}</Label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <span className="text-xsmall text-muted-foreground font-normal">
              Let fans pay more if they want
            </span>
            <Switch
              checked={nameYourPrice}
              onCheckedChange={setNameYourPrice}
            />
          </label>
        </div>
        <InputSelect
          placeholder={nameYourPrice ? "0.00 (leave blank for free)" : "1.00"}
          value={price}
          onChange={e => setPrice(e.target.value)}
          selectValue={currency}
          onSelectChange={setCurrency}
          options={CURRENCIES}
        />
      </div>

      <Field label="Stock Quantity">
        <Input
          placeholder="Available units"
          value={stock}
          onChange={e => setStock(e.target.value)}
          inputMode="numeric"
        />
      </Field>

      {showMore && (
        <>
          <div className="flex items-center justify-end gap-3">
            <Label htmlFor="include-dl" className="cursor-pointer">
              Include digital download code
            </Label>
            <Switch id="include-dl" checked={includeDL} onCheckedChange={setIncludeDL} />
          </div>

          {includeDL && (
            <Field label="Download Code">
              <Input
                placeholder="Enter Code"
                value={code}
                onChange={e => setCode(e.target.value)}
              />
            </Field>
          )}

          <Field label="Stock Keeping Number">
            <Input
              placeholder="Enter SKU"
              value={sku}
              onChange={e => setSku(e.target.value)}
            />
          </Field>
        </>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="self-start -ml-3"
        onClick={() => setShowMore(s => !s)}
      >
        {showMore ? "Show less" : "Show more"}
      </Button>
    </FormSection>
  )
}

// ─── Shipping ─────────────────────────────────────────────────────────────────

interface ShippingZone {
  id:       string
  region:   string
  price:    string
  currency: string
  free:     boolean
}

function ShippingSection() {
  const [zones, setZones] = useState<ShippingZone[]>([
    { id: "ww", region: "Worldwide", price: "1.00", currency: "USD", free: false },
  ])

  function updateZone(id: string, patch: Partial<ShippingZone>) {
    setZones(xs => xs.map(z => (z.id === id ? { ...z, ...patch } : z)))
  }

  return (
    <FormSection title="Shipping">
      <Label>Shipping Zones</Label>
      <div className="flex flex-col gap-3">
        {zones.map(z => (
          <div key={z.id} className="flex items-center gap-3">
            <Input
              value={z.region}
              onChange={e => updateZone(z.id, { region: e.target.value })}
              className="w-40 shrink-0"
            />
            <InputSelect
              value={z.price}
              onChange={e => updateZone(z.id, { price: e.target.value })}
              selectValue={z.currency}
              onSelectChange={v => updateZone(z.id, { currency: v })}
              options={CURRENCIES}
              disabled={z.free}
              className="flex-1"
            />
            <div className="flex items-center gap-2 shrink-0">
              <Label htmlFor={`free-${z.id}`} className="cursor-pointer text-xsmall text-muted-foreground">
                Free
              </Label>
              <Switch
                id={`free-${z.id}`}
                checked={z.free}
                onCheckedChange={v => updateZone(z.id, { free: v })}
              />
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setZones(xs => xs.filter(x => x.id !== z.id))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="self-start -ml-3"
        onClick={() =>
          setZones(xs => [
            ...xs,
            { id: crypto.randomUUID(), region: "", price: "1.00", currency: "USD", free: false },
          ])
        }
      >
        <Plus className="size-4" />
        Add shipping zone
      </Button>
    </FormSection>
  )
}

// ─── Description ──────────────────────────────────────────────────────────────

function DescriptionSection() {
  const [text, setText] = useState("")
  return (
    <FormSection title="Description">
      <Field
        label="Add Product Description (optional)"
        hint="Share context about this release — pressing info, condition etc."
      >
        <Textarea
          placeholder="Placeholder"
          value={text}
          onChange={e => setText(e.target.value)}
          rows={5}
        />
      </Field>
    </FormSection>
  )
}

// ─── Visibility & Publishing ──────────────────────────────────────────────────

function VisibilityPublishingSection({
  artistName,
}: {
  /** Primary artist used in the "Show on <Artist>'s Shop" label. Falls back
   *  to a generic placeholder when no main artist has been entered yet. */
  artistName: string
}) {
  const [isPublic,   setIsPublic]       = useState(true)
  const [showOnShop, setShowOnShop]     = useState(true)
  const [scheduled,  setScheduled]      = useState(false)
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined)
  const [scheduleTime, setScheduleTime] = useState("")
  const [preorder,   setPreorder]       = useState(false)
  const [preDate,    setPreDate]        = useState<Date | undefined>(undefined)
  const [preTime,    setPreTime]        = useState("")

  return (
    <FormSection title="Visibility & Publishing">
      <div className="flex items-center gap-3">
        <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
        <Label htmlFor="public" className="cursor-pointer">
          Public · anyone can find this listing
        </Label>
      </div>

      <div className="flex items-center gap-3">
        <Switch id="show-on-shop" checked={showOnShop} onCheckedChange={setShowOnShop} />
        <Label htmlFor="show-on-shop" className="cursor-pointer">
          Show on {artistName}'s Shop
        </Label>
      </div>

      <ScheduleRow
        id="schedule"
        label="Schedule for later"
        enabled={scheduled}
        onToggle={setScheduled}
        date={scheduleDate}
        onDateChange={setScheduleDate}
        time={scheduleTime}
        onTimeChange={setScheduleTime}
      />

      <ScheduleRow
        id="preorder"
        label="Available for pre-order"
        enabled={preorder}
        onToggle={setPreorder}
        date={preDate}
        onDateChange={setPreDate}
        time={preTime}
        onTimeChange={setPreTime}
      />
    </FormSection>
  )
}

function ScheduleRow({
  id, label, enabled, onToggle,
  date, onDateChange, time, onTimeChange,
}: {
  id: string
  label: string
  enabled: boolean
  onToggle: (v: boolean) => void
  date: Date | undefined
  onDateChange: (v: Date | undefined) => void
  time: string
  onTimeChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Switch id={id} checked={enabled} onCheckedChange={onToggle} />
        <Label htmlFor={id} className="cursor-pointer">{label}</Label>
      </div>
      {enabled && (
        <div className="grid grid-cols-2 gap-4 pl-11">
          <Field label="Date">
            <DatePicker value={date} onChange={onDateChange} placeholder="Pick a date" />
          </Field>
          <Field label="Time">
            <Input
              type="time"
              value={time}
              onChange={e => onTimeChange(e.target.value)}
            />
          </Field>
        </div>
      )}
    </div>
  )
}

// ─── VinylCreateListing ───────────────────────────────────────────────────────

export interface VinylDraft {
  id?:      string
  title:    string
  type:     ReleaseType
  year:     string
  variant:  string
}

interface VinylCreateListingProps {
  mode:     "create" | "edit"
  initial?: Partial<VinylDraft>
  onCancel: () => void
  onSave:   (draft: VinylDraft) => void
  onPublish:(draft: VinylDraft) => void
}

export function VinylCreateListing({
  mode, initial, onCancel, onSave, onPublish,
}: VinylCreateListingProps) {
  const [title,   setTitle]   = useState(initial?.title ?? "")
  const [type,    setType]    = useState<ReleaseType>(initial?.type ?? "Album")
  const [year,    setYear]    = useState(initial?.year ?? "")
  const [variant, setVariant] = useState(initial?.variant ?? "")
  // The first entry is the account's primary artist — always visible and
  // not dismissable. Additional entries are collaborators added via the
  // input, or pulled from a linked release.
  const [mainArtists, setMainArtists] = useState<string[]>(["Chris Test"])
  const [tracks,  setTracks]  = useState<Track[]>(DEFAULT_TRACKS)
  /** When the user picks an existing release from the dropdown, we lock the
   *  release-level fields (title, type, year, main artist, tracklist) since
   *  those come from the release database. Clearing or retyping the title
   *  unlinks, returning the form to fully editable mode. */
  const [linkedId, setLinkedId] = useState<string | null>(null)
  const linked = linkedId !== null

  const draft: VinylDraft = { id: initial?.id, title, type, year, variant }

  function handleLinkedRelease(r: ExistingRelease) {
    setLinkedId(r.value)
    setYear(String(r.year))
    setMainArtists([r.artist])
    setTracks(
      r.tracks.map((t, i) => ({
        id:       `linked-${r.value}-${i}`,
        side:     t.side,
        title:    t.title,
        duration: t.duration,
        linked:   true,
      })),
    )
    const typeMap: Record<ExistingRelease["type"], ReleaseType> = {
      album:  "Album",
      single: "Single",
      ep:     "EP",
    }
    setType(typeMap[r.type])
  }

  /** Edit the title manually → unlink if it no longer matches the linked
   *  release's title. Keeps the rest of the prefill in place so the user
   *  can tweak fields without losing their place. */
  function handleTitleChange(v: string) {
    setTitle(v)
    if (linkedId) {
      const rec = EXISTING_RELEASES.find(r => r.value === linkedId)
      if (rec && v !== rec.title) setLinkedId(null)
    }
  }

  const heading = mode === "create" ? "Create Listing" : "Edit Listing"

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between gap-6 px-16 pt-8 pb-6 border-b border-border bg-background">
        <div className="flex items-center gap-3">
          <h1 className="text-xlarge font-medium text-foreground">{heading}</h1>
          <Badge variant="secondary"><Disc3 />Vinyl</Badge>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button variant="outline" onClick={() => onSave(draft)}>Save Draft</Button>
          <Button onClick={() => onPublish(draft)}>
            {mode === "create" ? "Publish Listing" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* ── Form body ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-[720px] mx-auto px-8 py-10 flex flex-col gap-6">
          <ReleaseInformationSection
            title={title}    onTitleChange={handleTitleChange}
            type={type}      onTypeChange={setType}
            year={year}      onYearChange={setYear}
            variant={variant} onVariantChange={setVariant}
            onLinkedRelease={handleLinkedRelease}
            linked={linked}
          />
          <ImageUploadSection />
          <ArtistsCreditsSection
            mainArtists={mainArtists}
            setMainArtists={setMainArtists}
            linked={linked}
          />
          <TracklistSection tracks={tracks} setTracks={setTracks} linked={linked} />
          <PricingInventorySection />
          <ShippingSection />
          <DescriptionSection />
          <VisibilityPublishingSection artistName={mainArtists[0] || "your"} />
        </div>
      </div>
    </div>
  )
}
