"use client"

/*
 * VinylCreateListing — full-page form for creating or editing a Vinyl product.
 *
 * Mirrors the Figma flow (node 7860:211319) with eight stacked sections:
 *   1. Release Information     — title combobox with inline "add unlinked" row
 *   2. Images                  — up to eight, cover first, drag to reorder
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

import React, { useMemo, useRef, useState } from "react"
import {
  Upload, Plus, Minus, X, Link2, GripVertical, Trash2, Disc3, Crop,
} from "lucide-react"

import { Badge, ContentTypeBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Chip, ChipDismiss, ChipGroup } from "@/components/ui/chip"
import { InputSelect } from "@/components/ui/input-select"
import {
  ShippingZoneEditor, DEFAULT_ZONES, type ShippingZone,
} from "@/components/app/shipping-zone-editor"
import { Separator } from "@/components/ui/separator"
import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/lib/utils"
import { cropStyle, type ImageCrop, type ShopProduct } from "@/lib/shop-product"
import { ImageCropDialog } from "@/components/app/image-crop-dialog"
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs"
import {
  Combobox, ComboboxTrigger, ComboboxContent,
  ComboboxItem, ComboboxSeparator, ComboboxGroup, ComboboxGroupLabel,
} from "@/components/ui/combobox"
import {
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
} from "@/components/ui/tooltip"
import { useShopSettings } from "@/lib/shop-settings"
import { ArrowLeft } from "lucide-react"

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
  /* `FormItem` / `FormLabel` / `FormControl` without react-hook-form: the id
     is generated and put in the label's `htmlFor` and on the control, so the
     label actually labels something. `children` is typed as an element rather
     than a node because `FormControl` clones exactly one child. */
  return (
    <FormItem className={`gap-2 ${className ?? ""}`}>
      <FormLabel>{label}</FormLabel>
      {/* `FormControl` clones exactly one child, so it only wraps when the
          field IS one control. Two fields here are "chips above, input below"
          and pass several children — those wrap their own input, so the label
          still points at something. */}
      {React.isValidElement(children) && React.Children.count(children) === 1
        ? <FormControl>{children}</FormControl>
        : children}
      {hint && <FormDescription>{hint}</FormDescription>}
    </FormItem>
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
              className="text-primary-text font-normal"
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
                  className="size-12 rounded-xs shrink-0 object-cover shadow-sm art-edge"
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
//
// Up to eight images per product, in the order the buyer will see them: the
// first is the cover on the tile, in the cart and at the head of the product
// page's gallery. Before this the section took one picture and the product
// page had nothing to show.
//
// Reordering is pointer events, not HTML drag-and-drop. The tracklist below
// uses the native API and it does nothing on a phone or tablet, because no
// mobile browser fires `dragstart` from a touch. Pointer events cover mouse,
// pen and finger with one code path:
//   · mouse: press anywhere on a tile and drag (4px before it counts, so a
//     click on the ✕ is still a click);
//   · touch: drag by the grip. Only the grip is `touch-none`; the rest of the
//     tile still scrolls the form, which a whole-tile grab would have taken
//     away on a page that is mostly scrolling;
//   · keyboard: focus the grip, arrow keys move the image one place.
// The tile under the pointer follows it, the others slide aside to show
// where it will land, and the order is written once, on release. The first
// version reordered the list live as the pointer crossed a tile: React moves
// DOM nodes to do that, and moving the node that holds pointer capture
// releases it, so the drag dropped events mid-gesture and tiles jumped.

export interface ListingImage { id: string; src: string; name: string; crop?: ImageCrop }

export const MAX_LISTING_IMAGES = 8
const ACCEPTED_IMAGE = /^image\/(jpeg|png|webp)$/

function moveItem<T>(xs: T[], from: number, to: number): T[] {
  if (from === to || to < 0 || to >= xs.length) return xs
  const next = xs.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function ImageUploadSection({
  images, setImages,
}: {
  images: ListingImage[]
  setImages: React.Dispatch<React.SetStateAction<ListingImage[]>>
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const tileRefs = useRef(new Map<string, HTMLElement>())
  const [fileOver, setFileOver] = useState(false)
  const [cropping, setCropping] = useState<ListingImage | null>(null)
  /** The gesture. `slots` are the tiles' places at the start, relative to
   *  the list, so a scroll during the drag does not move the targets. */
  const press = useRef<{
    id: string; from: number; pointerId: number; x: number; y: number
    slots: { x: number; y: number }[]
  } | null>(null)
  const [drag, setDrag] = useState<{ id: string; from: number; to: number; dx: number; dy: number } | null>(null)
  // True for the two frames after a drop. The tiles are re-rendered in their
  // new order AND lose their offsets in the same commit; with the transition
  // on, each would animate from its offset measured against its OLD slot and
  // fly in from the wrong place.
  const [settling, setSettling] = useState(false)
  const room = MAX_LISTING_IMAGES - images.length

  function addFiles(files: FileList | null) {
    if (!files) return
    const picked = Array.from(files)
      .filter(f => ACCEPTED_IMAGE.test(f.type))
      .slice(0, room)
      .map(f => ({ id: crypto.randomUUID(), src: URL.createObjectURL(f), name: f.name }))
    if (picked.length) setImages(xs => [...xs, ...picked])
  }

  function remove(id: string) {
    setImages(xs => {
      const gone = xs.find(x => x.id === id)
      // Only URLs this tab minted; the seeded ones are remote.
      if (gone?.src.startsWith("blob:")) URL.revokeObjectURL(gone.src)
      return xs.filter(x => x.id !== id)
    })
  }

  function onPointerDown(e: React.PointerEvent, index: number, viaGrip: boolean) {
    if (e.button !== 0 || images.length < 2) return
    if (e.pointerType !== "mouse" && !viaGrip) return
    const list = listRef.current?.getBoundingClientRect()
    if (!list) return
    const slots = images.map(img => {
      const r = tileRefs.current.get(img.id)!.getBoundingClientRect()
      return { x: r.left - list.left + r.width / 2, y: r.top - list.top + r.height / 2 }
    })
    press.current = { id: images[index].id, from: index, pointerId: e.pointerId, x: e.clientX, y: e.clientY, slots }
    // Capture on the TILE, whichever part was pressed: it is the node that
    // receives the moves, and nothing moves it in the DOM until release.
    tileRefs.current.get(images[index].id)?.setPointerCapture(e.pointerId)
    // The grip starts at once; a mouse press on the tile waits for 4px, so a
    // click on the ✕ is still a click.
    if (viaGrip) setDrag({ id: images[index].id, from: index, to: index, dx: 0, dy: 0 })
  }

  function onPointerMove(e: React.PointerEvent) {
    const p = press.current
    if (!p || e.pointerId !== p.pointerId) return
    const dx = e.clientX - p.x
    const dy = e.clientY - p.y
    if (!drag && Math.hypot(dx, dy) < 4) return
    // The landing slot is the one whose centre is nearest to where the
    // dragged tile's centre now is.
    const cx = p.slots[p.from].x + dx
    const cy = p.slots[p.from].y + dy
    let to = p.from
    let best = Infinity
    p.slots.forEach((s, i) => {
      const d = Math.hypot(s.x - cx, s.y - cy)
      if (d < best) { best = d; to = i }
    })
    setDrag({ id: p.id, from: p.from, to, dx, dy })
  }

  function onPointerUp(e: React.PointerEvent) {
    const p = press.current
    if (!p || e.pointerId !== p.pointerId) return
    if (drag && drag.to !== drag.from) setImages(xs => moveItem(xs, drag.from, drag.to))
    press.current = null
    setDrag(null)
    setSettling(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setSettling(false)))
  }

  function onPointerCancel() {
    press.current = null
    setDrag(null)
  }

  /** Where a tile is drawn while a drag is on: the dragged one under the
   *  pointer, the ones between its old and new place one slot over. */
  function offsetFor(index: number): { x: number; y: number } | null {
    const p = press.current
    if (!drag || !p) return null
    if (index === drag.from) return { x: drag.dx, y: drag.dy }
    let shown = index
    if (drag.from < drag.to && index > drag.from && index <= drag.to) shown = index - 1
    if (drag.to < drag.from && index >= drag.to && index < drag.from) shown = index + 1
    if (shown === index) return null
    return { x: p.slots[shown].x - p.slots[index].x, y: p.slots[shown].y - p.slots[index].y }
  }

  function onGripKey(e: React.KeyboardEvent, index: number) {
    const step = e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1
      : e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : 0
    if (!step) return
    e.preventDefault()
    setImages(xs => moveItem(xs, index, index + step))
  }

  const dropZoneHandlers = {
    onDragOver: (e: React.DragEvent) => {
      if (!e.dataTransfer.types.includes("Files")) return
      e.preventDefault()
      setFileOver(true)
    },
    onDragLeave: () => setFileOver(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      setFileOver(false)
      addFiles(e.dataTransfer.files)
    },
  }

  return (
    <FormSection title="Images">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={e => { addFiles(e.target.files); e.target.value = "" }}
      />

      {images.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          {...dropZoneHandlers}
          className={cn(
            "border border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 py-12 cursor-pointer transition-colors outline-none focus-ring",
            fileOver ? "bg-muted" : "bg-muted/40 hover:bg-muted",
          )}
        >
          <span className="size-10 rounded-full bg-background border border-border flex items-center justify-center">
            <Upload className="size-4 text-foreground" />
          </span>
          <span className="text-small text-foreground">Drag images here</span>
          <span className="text-xsmall text-muted-foreground">
            or <span className="text-primary-text">browse files</span>
          </span>
        </button>
      ) : (
        <ul
          ref={listRef}
          aria-label="Product images"
          {...dropZoneHandlers}
          className={cn(
            "grid grid-cols-3 sm:grid-cols-4 gap-3 rounded-xl transition-colors",
            fileOver && "bg-muted",
          )}
        >
          {images.map((img, i) => {
            const off = offsetFor(i)
            const dragging = drag?.id === img.id
            // The cover badge follows where the image will LAND, so the
            // seller sees which one becomes the cover before letting go.
            const landsAt = drag ? (dragging ? drag.to : (off ? i + (drag.from < drag.to ? -1 : 1) : i)) : i
            return (
              <li
                key={img.id}
                ref={el => { if (el) tileRefs.current.set(img.id, el); else tileRefs.current.delete(img.id) }}
                onPointerDown={e => onPointerDown(e, i, false)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
                style={off ? { transform: `translate(${off.x}px, ${off.y}px)` } : undefined}
                className={cn(
                  "relative aspect-square rounded-lg overflow-hidden bg-accent select-none",
                  dragging
                    // Under the pointer: no transition, or it trails behind.
                    ? "z-10 cursor-grabbing shadow-lg scale-105 transition-[scale,box-shadow] duration-150"
                    : cn("cursor-grab", !settling && "transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)]"),
                )}
              >
                <img src={img.src} alt={img.name} draggable={false} style={cropStyle(img.crop)} className="size-full object-cover art-edge pointer-events-none" />
                {landsAt === 0 && (
                  <Badge variant="secondary" className="absolute left-2 top-2">Cover</Badge>
                )}
                <button
                  type="button"
                  onPointerDown={e => e.stopPropagation()}
                  onClick={() => remove(img.id)}
                  aria-label={`Remove image ${i + 1}`}
                  className="touch-target absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-background/90 text-foreground outline-none focus-ring hover:bg-background cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
                {/* Frame this image: where it is cropped on the tile and in
                     the gallery. Per image, because a cover and a detail
                     shot want different crops. */}
                <button
                  type="button"
                  onPointerDown={e => e.stopPropagation()}
                  onClick={() => setCropping(img)}
                  aria-label={`Adjust image ${i + 1}`}
                  className="touch-target absolute right-2 bottom-2 flex size-7 items-center justify-center rounded-full bg-background/90 text-foreground outline-none focus-ring hover:bg-background cursor-pointer"
                >
                  <Crop className="size-3.5" />
                </button>
                {images.length > 1 && (
                  <button
                    type="button"
                    onPointerDown={e => {
                      // Handled by the tile, flagged as the grip: the tile
                      // owns capture and every later event of the gesture.
                      e.stopPropagation()
                      onPointerDown(e, i, true)
                    }}
                    onKeyDown={e => onGripKey(e, i)}
                    aria-label={`Move image ${i + 1} of ${images.length}. Use the arrow keys.`}
                    className="touch-target touch-none absolute left-2 bottom-2 flex size-7 items-center justify-center rounded-full bg-background/90 text-foreground outline-none focus-ring hover:bg-background cursor-grab"
                  >
                    <GripVertical className="size-3.5" />
                  </button>
                )}
              </li>
            )
          })}
          {room > 0 && (
            <li className="aspect-square">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                aria-label="Add images"
                className="size-full rounded-lg border border-dashed border-border bg-muted/40 hover:bg-muted transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground outline-none focus-ring cursor-pointer"
              >
                <Plus className="size-5" />
                <span className="text-2xsmall">Add</span>
              </button>
            </li>
          )}
        </ul>
      )}

      <ImageCropDialog
        image={cropping}
        onOpenChange={o => { if (!o) setCropping(null) }}
        onSave={crop => {
          const id = cropping?.id
          setImages(xs => xs.map(x => x.id === id ? { ...x, crop } : x))
        }}
      />

      <p className="text-2xsmall text-muted-foreground">
        {images.length > 1
          ? `The first image is the cover. Drag to change the order. ${images.length} of ${MAX_LISTING_IMAGES}.`
          : `Up to ${MAX_LISTING_IMAGES} images. JPG, PNG or WEBP, min 1600×1600px.`}
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
              /* `icon-lg`: it sits in the row with a credit's name field. */
              size="icon-lg"
              aria-label="Remove credit"
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

// `price` and the price mode are lifted: publishing hands them to the buyer
// side, where they decide whether the dialog shows a price or asks for one.
function PricingInventorySection({ price, setPrice, nameYourPrice, setNameYourPrice }: {
  price: string; setPrice: (v: string) => void
  nameYourPrice: boolean; setNameYourPrice: (v: boolean) => void
}) {
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
      <FormItem className="gap-2">
        {/* Header row — label left, "Let fans pay more if they want" switch
             right. Flipping the switch turns "Price" into "Minimum Price". */}
        <div className="flex items-center justify-between">
          <FormLabel>{nameYourPrice ? "Minimum Price" : "Price"}</FormLabel>
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
        <FormControl><InputSelect
          placeholder={nameYourPrice ? "0.00 (leave blank for free)" : "1.00"}
          value={price}
          onChange={e => setPrice(e.target.value)}
          selectValue={currency}
          onSelectChange={setCurrency}
          options={CURRENCIES}
        /></FormControl>
      </FormItem>

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

function ShippingSection() {
  // Most listings use the shop-wide defaults configured under Products →
  // Shop settings. Power-users (oversized item, special insurance) flip the
  // switch to override per listing — same UI, scoped to this listing.
  const [useShopDefaults, setUseShopDefaults] = useState(true)
  const [zones, setZones] = useState<ShippingZone[]>(DEFAULT_ZONES)

  return (
    <FormSection title="Shipping">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="use-shop-defaults" className="cursor-pointer">
            Use shop defaults
          </Label>
          <p className="text-xsmall text-muted-foreground">
            Inherits shipping zones from your shop settings. Turn off to
            customise rates for this listing.
          </p>
        </div>
        <Switch
          id="use-shop-defaults"
          checked={useShopDefaults}
          onCheckedChange={setUseShopDefaults}
        />
      </div>

      {!useShopDefaults && (
        <ShippingZoneEditor zones={zones} onChange={setZones} />
      )}
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

function seedImages(id: string): ListingImage[] {
  return ["front", "back", "record"].map(side => ({
    id: `${id}-${side}`,
    src: `https://picsum.photos/seed/${id}-${side}/800/800`,
    name: `${side}.jpg`,
  }))
}

export interface VinylDraft {
  id?:      string
  title:    string
  type:     ReleaseType
  year:     string
  variant:  string
  /** Cover first, in the order set in Images. */
  images?:  ListingImage[]
  /** Fixed price or the minimum, as typed (USD). */
  price?:   string
  /** The first main artist — whose page the product is listed on. */
  artist?:  string
  nameYourPrice?: boolean
  linkedSong?: ShopProduct["linkedSong"]
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
  // Editing an existing product opens with its pictures; a new one is empty.
  const [images,  setImages]  = useState<ListingImage[]>(() => initial?.id ? seedImages(initial.id) : [])
  /** When the user picks an existing release from the dropdown, we lock the
   *  release-level fields (title, type, year, main artist, tracklist) since
   *  those come from the release database. Clearing or retyping the title
   *  unlinks, returning the form to fully editable mode. */
  const [linkedId, setLinkedId] = useState<string | null>(null)
  const linked = linkedId !== null

  const [price,   setPrice]   = useState("1.00")
  const [nameYourPrice, setNameYourPrice] = useState(false)
  // The release this pressing is of, when picked from the catalogue. Its
  // first track becomes the product's play row: the buyer can listen first.
  const [linkedRelease, setLinkedRelease] = useState<ExistingRelease | null>(null)
  const draft: VinylDraft = {
    id: initial?.id, title, type, year, variant, images, price, nameYourPrice,
    artist: mainArtists[0],
    linkedSong: linked && linkedRelease?.tracks[0] ? {
      title: linkedRelease.tracks[0].title, artist: linkedRelease.artist,
      album: linkedRelease.title, year: linkedRelease.year, cover: linkedRelease.cover,
      duration: linkedRelease.tracks[0].duration,
    } : undefined,
  }

  function handleLinkedRelease(r: ExistingRelease) {
    setLinkedId(r.value)
    setLinkedRelease(r)
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
    <div className="flex flex-col">

      {/* ── Top bar ──────────────────────────────────────────────────────
           Back-arrow icon-button on the left replaces the old "Cancel"
           button. The seller is in a focused sub-flow (tabs above are
           intentionally hidden); the arrow communicates "step out and
           go back" more clearly than a generic Cancel, and matches the
           same affordance used on the buyer-side purchase-detail page.

           Sticky, because the form is long and the way out is up here: at
           the end of Visibility & Publishing there was no action in sight.
           The layout meant this bar to stay put with the body scrolling
           under it (`h-full overflow-hidden` + an `overflow-auto` body), but
           nothing above gives the editor a height, so the page scrolled and
           took the bar with it. Sticky works against whichever ancestor
           scrolls, so it does not depend on that height. */}
      <div className="sticky top-0 z-20 shrink-0 flex items-center justify-between gap-6 px-page pt-8 pb-6 border-b border-border bg-background">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={onCancel} aria-label="Back to products">
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-xlarge font-medium text-foreground text-balance">{heading}</h1>
          <Badge variant="secondary"><Disc3 />Vinyl</Badge>
        </div>
        <div className="flex items-center gap-3">
          <Button size="lg" variant="outline" onClick={() => onSave(draft)}>Save draft</Button>
          <PublishButton mode={mode} onPublish={() => onPublish(draft)} />
        </div>
      </div>

      {/* ── Form body ────────────────────────────────────────────────── */}
      <div className="flex-1">
        <div className="max-w-[720px] mx-auto px-8 py-10 flex flex-col gap-6">
          <ReleaseInformationSection
            title={title}    onTitleChange={handleTitleChange}
            type={type}      onTypeChange={setType}
            year={year}      onYearChange={setYear}
            variant={variant} onVariantChange={setVariant}
            onLinkedRelease={handleLinkedRelease}
            linked={linked}
          />
          <ImageUploadSection images={images} setImages={setImages} />
          <ArtistsCreditsSection
            mainArtists={mainArtists}
            setMainArtists={setMainArtists}
            linked={linked}
          />
          <TracklistSection tracks={tracks} setTracks={setTracks} linked={linked} />
          <PricingInventorySection price={price} setPrice={setPrice} nameYourPrice={nameYourPrice} setNameYourPrice={setNameYourPrice} />
          <ShippingSection />
          <DescriptionSection />
          <VisibilityPublishingSection artistName={mainArtists[0] || "your"} />
        </div>
      </div>
    </div>
  )
}

// ─── Publish button (gated on shop-live) ─────────────────────────────────────
//
// Wraps the primary submit button with the shop-live check so creating
// a listing pre-onboarding gracefully degrades:
//   · Edit mode ("Save changes") — always enabled. Saving an existing
//     listing doesn't promote it; status stays as-is.
//   · Create mode ("Publish") — disabled when the shop isn't
//     live. A tooltip explains why and points back at the saved-draft
//     path. The disabled button has pointer-events:none on the
//     <button>, so we wrap it in a span trigger that captures hover.

function PublishButton({ mode, onPublish }: {
  mode:      "create" | "edit"
  onPublish: () => void
}) {
  const { isShopLive } = useShopSettings()
  const isCreate  = mode === "create"
  const disabled  = isCreate && !isShopLive
  const label     = isCreate ? "Publish" : "Save changes"

  const button = (
    <Button size="lg" onClick={onPublish} disabled={disabled}>
      {label}
    </Button>
  )

  if (!disabled) return button

  return (
    <TooltipProvider delay={200}>
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex" />}>
          {button}
        </TooltipTrigger>
        <TooltipContent side="bottom">
          Finish shop setup to publish. Save a draft in the meantime.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
