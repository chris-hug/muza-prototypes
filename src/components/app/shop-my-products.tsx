"use client"

import React, { useState } from "react"
import {
  Globe, MoreHorizontal, Pencil, Copy, Trash2,
  Ghost, Disc3, Disc, CassetteTape, Shirt,
  Plus, Search, X, ArrowDown, ArrowUp, ArrowUpDown, Package,
} from "lucide-react"
import { Badge, StatusBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ChipDismiss } from "@/components/ui/chip"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose,
} from "@/components/ui/dialog"
import { RadioCard, RadioCardGroup } from "@/components/ui/radio-card"
import { VinylCreateListing, type VinylDraft } from "@/components/app/vinyl-create-listing"
import { cn } from "@/lib/utils"
import { filterTriggerCls, FilterChevron, FilterCount } from "@/components/ui/filter-button"
import { TableHead } from "@/components/ui/table"

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductType   = "Vinyl" | "Compact Disc" | "Cassette" | "Apparel" | "Other"
type ProductStatus = "public" | "private"
type SortKey       = "title" | "lastEdited" | "stock" | "price" | "sold"
type SortDir       = "asc" | "desc"

interface Product {
  id:              string
  type:            ProductType
  status:          ProductStatus
  title:           string
  image:           string
  price:           number
  priceMode:       "fixed" | "min"
  stock:           number | null   // null = unlimited
  sold:            number
  shippingRegions: number
  muzaLink:        string | null
  lastEdited:      string
  variants?:       number
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const PIC = (seed: string) =>
  `https://picsum.photos/seed/${seed}/80/80`

const PRODUCTS: Product[] = [
  { id: "1",  type: "Vinyl",        status: "public",  title: "City Lights — LP",       image: PIC("citylights"),   price: 28, priceMode: "fixed", stock: 48,   sold: 142, shippingRegions: 3, muzaLink: "City Lights",        lastEdited: "2026-04-14" },
  { id: "2",  type: "Cassette",     status: "public",  title: "City Lights — Cassette", image: PIC("cassette12"),   price: 14, priceMode: "fixed", stock: 30,   sold: 89,  shippingRegions: 2, muzaLink: "City Lights",        lastEdited: "2026-04-14" },
  { id: "3",  type: "Compact Disc", status: "public",  title: "Echoes of Tomorrow",     image: PIC("echoes"),       price: 16, priceMode: "fixed", stock: 65,   sold: 204, shippingRegions: 3, muzaLink: "Echoes of Tomorrow", lastEdited: "2026-03-28" },
  { id: "4",  type: "Compact Disc", status: "private", title: "Night Sessions",         image: PIC("nightsess"),    price: 16, priceMode: "fixed", stock: 20,   sold: 0,   shippingRegions: 3, muzaLink: "Night Sessions",     lastEdited: "2026-03-10" },
  { id: "5",  type: "Vinyl",        status: "public",  title: "Golden Hour — 12\"",     image: PIC("goldenhour"),   price: 32, priceMode: "fixed", stock: 7,    sold: 318, shippingRegions: 2, muzaLink: "Golden Hour",        lastEdited: "2026-02-19" },
  { id: "6",  type: "Apparel",      status: "public",  title: "Logo Tee",               image: PIC("logotee"),      price: 30, priceMode: "fixed", stock: null, sold: 521, shippingRegions: 2, muzaLink: null,                 lastEdited: "2026-04-01", variants: 6 },
  { id: "7",  type: "Apparel",      status: "public",  title: "Golden Hour Hoodie",     image: PIC("hoodie77"),     price: 55, priceMode: "fixed", stock: 12,   sold: 76,  shippingRegions: 1, muzaLink: null,                 lastEdited: "2026-03-22", variants: 4 },
  { id: "8",  type: "Apparel",      status: "private", title: "Tour Cap",               image: PIC("tourcap"),      price: 25, priceMode: "min",   stock: 4,    sold: 38,  shippingRegions: 2, muzaLink: null,                 lastEdited: "2026-01-15", variants: 3 },
  { id: "9",  type: "Other",        status: "public",  title: "Limited Edition Poster", image: PIC("poster99"),     price: 18, priceMode: "fixed", stock: 3,    sold: 97,  shippingRegions: 2, muzaLink: null,                 lastEdited: "2026-04-10" },
  { id: "10", type: "Other",        status: "public",  title: "Enamel Pin Set",         image: PIC("pinset"),       price: 12, priceMode: "fixed", stock: 100,  sold: 183, shippingRegions: 3, muzaLink: null,                 lastEdited: "2026-02-05" },
  { id: "11", type: "Vinyl",        status: "public",  title: "Autumn Leaves — LP",     image: PIC("autumnleaves"), price: 30, priceMode: "fixed", stock: 22,   sold: 67,  shippingRegions: 2, muzaLink: "Autumn Leaves",      lastEdited: "2026-03-15" },
  { id: "12", type: "Apparel",      status: "public",  title: "Jazz Club Hoodie",       image: PIC("jazzclub"),     price: 60, priceMode: "fixed", stock: 8,    sold: 34,  shippingRegions: 1, muzaLink: null,                 lastEdited: "2026-02-28", variants: 3 },
  { id: "13", type: "Other",        status: "public",  title: "Blue Note Enamel Pin",   image: PIC("bluenote"),     price: 10, priceMode: "fixed", stock: 150,  sold: 211, shippingRegions: 3, muzaLink: null,                 lastEdited: "2026-04-08" },

  { id: "14", type: "Vinyl",        status: "public",  title: "Kind of Blue — LP",             image: PIC("kindofblue"),   price: 34, priceMode: "fixed", stock: 15,   sold: 94,  shippingRegions: 3, muzaLink: "Kind of Blue",        lastEdited: "2026-04-02" },
  { id: "15", type: "Vinyl",        status: "public",  title: "Blue Train — LP",               image: PIC("bluetrain"),    price: 34, priceMode: "fixed", stock: 18,   sold: 78,  shippingRegions: 2, muzaLink: "Blue Train",          lastEdited: "2026-03-20" },
  { id: "16", type: "Vinyl",        status: "public",  title: "Giant Steps — LP",              image: PIC("giantsteps"),   price: 36, priceMode: "fixed", stock: 10,   sold: 55,  shippingRegions: 2, muzaLink: "Giant Steps",         lastEdited: "2026-03-05" },
  { id: "17", type: "Vinyl",        status: "public",  title: "A Love Supreme — LP",           image: PIC("lovesupreme"),  price: 38, priceMode: "fixed", stock: 5,    sold: 43,  shippingRegions: 2, muzaLink: "A Love Supreme",      lastEdited: "2026-02-14" },
  { id: "18", type: "Vinyl",        status: "public",  title: "Mingus Ah Um — LP",             image: PIC("mingus"),       price: 32, priceMode: "fixed", stock: 12,   sold: 61,  shippingRegions: 3, muzaLink: "Mingus Ah Um",        lastEdited: "2026-02-08" },
  { id: "19", type: "Vinyl",        status: "public",  title: "Maiden Voyage — LP",            image: PIC("maidenvoyage"), price: 30, priceMode: "fixed", stock: 9,    sold: 48,  shippingRegions: 2, muzaLink: "Maiden Voyage",       lastEdited: "2026-01-29" },
  { id: "20", type: "Vinyl",        status: "public",  title: "Speak No Evil — LP",            image: PIC("speaknoevil"),  price: 34, priceMode: "fixed", stock: 14,   sold: 52,  shippingRegions: 2, muzaLink: "Speak No Evil",       lastEdited: "2026-01-12" },
  { id: "21", type: "Vinyl",        status: "public",  title: "Moanin' — LP",                  image: PIC("moanin"),       price: 32, priceMode: "fixed", stock: 7,    sold: 37,  shippingRegions: 2, muzaLink: "Moanin'",             lastEdited: "2025-12-20" },
  { id: "22", type: "Vinyl",        status: "public",  title: "Modal Jazz — 7\" Single",       image: PIC("modaljazz"),    price: 18, priceMode: "fixed", stock: 40,   sold: 129, shippingRegions: 2, muzaLink: "Modal Jazz",          lastEdited: "2026-04-11" },
  { id: "23", type: "Cassette",     status: "public",  title: "Kind of Blue — Cassette",       image: PIC("kobcassette"),  price: 12, priceMode: "fixed", stock: 25,   sold: 72,  shippingRegions: 2, muzaLink: "Kind of Blue",        lastEdited: "2026-03-18" },
  { id: "24", type: "Cassette",     status: "public",  title: "Autumn Leaves — Cassette",      image: PIC("alcassette"),   price: 12, priceMode: "fixed", stock: 20,   sold: 45,  shippingRegions: 2, muzaLink: "Autumn Leaves",       lastEdited: "2026-03-01" },
  { id: "25", type: "Compact Disc", status: "public",  title: "Modal Moods",                   image: PIC("modalmoods"),   price: 15, priceMode: "fixed", stock: 40,   sold: 88,  shippingRegions: 3, muzaLink: "Modal Moods",         lastEdited: "2026-02-22" },
  { id: "26", type: "Compact Disc", status: "public",  title: "Bossa Nova Midnight",           image: PIC("bossanova"),    price: 15, priceMode: "fixed", stock: 35,   sold: 102, shippingRegions: 3, muzaLink: "Bossa Nova Midnight",  lastEdited: "2026-02-10" },
  { id: "27", type: "Apparel",      status: "public",  title: "Blue Note Crewneck",            image: PIC("crewneck"),     price: 65, priceMode: "fixed", stock: 6,    sold: 28,  shippingRegions: 2, muzaLink: null,                  lastEdited: "2026-03-30", variants: 4 },
  { id: "28", type: "Apparel",      status: "public",  title: "Bebop Dad Hat",                 image: PIC("dadhat"),       price: 28, priceMode: "fixed", stock: 20,   sold: 59,  shippingRegions: 2, muzaLink: null,                  lastEdited: "2026-03-12", variants: 2 },
  { id: "29", type: "Apparel",      status: "public",  title: "Muza Jazz Scarf",               image: PIC("scarf"),        price: 35, priceMode: "fixed", stock: 15,   sold: 41,  shippingRegions: 1, muzaLink: null,                  lastEdited: "2026-02-25" },
  { id: "30", type: "Apparel",      status: "private", title: "Studio Fleece Jacket",          image: PIC("fleece"),       price: 90, priceMode: "fixed", stock: 4,    sold: 12,  shippingRegions: 1, muzaLink: null,                  lastEdited: "2026-01-08", variants: 3 },
  { id: "31", type: "Apparel",      status: "public",  title: "Night Cap",                     image: PIC("nightcap"),     price: 22, priceMode: "fixed", stock: 18,   sold: 63,  shippingRegions: 2, muzaLink: null,                  lastEdited: "2026-03-08", variants: 2 },
  { id: "32", type: "Other",        status: "public",  title: "Jazz Club Tote Bag",            image: PIC("totebag"),      price: 22, priceMode: "fixed", stock: 50,   sold: 134, shippingRegions: 2, muzaLink: null,                  lastEdited: "2026-04-06" },
  { id: "33", type: "Other",        status: "public",  title: "Vinyl Slipmat",                 image: PIC("slipmat"),      price: 20, priceMode: "fixed", stock: 80,   sold: 167, shippingRegions: 3, muzaLink: null,                  lastEdited: "2026-03-25" },
  { id: "34", type: "Other",        status: "public",  title: "Album Art Print — City Lights", image: PIC("printcl"),      price: 25, priceMode: "fixed", stock: 8,    sold: 73,  shippingRegions: 2, muzaLink: null,                  lastEdited: "2026-03-14" },
  { id: "35", type: "Other",        status: "public",  title: "Album Art Print — Golden Hour", image: PIC("printgh"),      price: 25, priceMode: "fixed", stock: 5,    sold: 61,  shippingRegions: 2, muzaLink: null,                  lastEdited: "2026-03-14" },
  { id: "36", type: "Other",        status: "public",  title: "Jazz Notebook",                 image: PIC("notebook"),     price: 16, priceMode: "fixed", stock: 200,  sold: 289, shippingRegions: 3, muzaLink: null,                  lastEdited: "2026-02-18" },
  { id: "37", type: "Other",        status: "public",  title: "Wax Seal Sticker Set",          image: PIC("stickers"),     price: 8,  priceMode: "fixed", stock: 300,  sold: 412, shippingRegions: 3, muzaLink: null,                  lastEdited: "2026-02-01" },
  { id: "38", type: "Other",        status: "public",  title: "Embroidered Jazz Patch",        image: PIC("patch"),        price: 9,  priceMode: "fixed", stock: 150,  sold: 188, shippingRegions: 3, muzaLink: null,                  lastEdited: "2026-01-20" },
  { id: "39", type: "Other",        status: "public",  title: "Canvas Tote — City Lights",     image: PIC("canvastote"),   price: 28, priceMode: "fixed", stock: 30,   sold: 95,  shippingRegions: 2, muzaLink: null,                  lastEdited: "2026-04-09" },
]

// ─── Aggregated stats (consumed by parent views) ──────────────────────────────

export const SHOP_STATS = {
  listings: PRODUCTS.length,
  orders:   PRODUCTS.reduce((sum, p) => sum + p.sold, 0),
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<ProductType, React.ElementType> = {
  "Vinyl":        Disc3,
  "Compact Disc": Disc,
  "Cassette":     CassetteTape,
  "Apparel":      Shirt,
  "Other":        Ghost,
}

const TYPE_LABEL: Record<ProductType, string> = {
  "Vinyl":        "Vinyl",
  "Compact Disc": "CD",
  "Cassette":     "Cassette",
  "Apparel":      "Apparel",
  "Other":        "Other",
}

const LOW_STOCK_THRESHOLD = 10

// ─── Product type picker options ──────────────────────────────────────────────

interface ProductTypeOption {
  type:        ProductType
  icon:        React.ElementType
  description: string
}

const PRODUCT_TYPE_OPTIONS: ProductTypeOption[] = [
  { type: "Vinyl",        icon: Disc3,        description: "LPs, EPs, singles and limited pressings."      },
  { type: "Compact Disc", icon: Disc,         description: "Albums, EPs and special editions on CD."       },
  { type: "Cassette",     icon: CassetteTape, description: "Full releases and limited runs on tape."       },
  { type: "Apparel",      icon: Shirt,        description: "T-shirts, hoodies, longsleeves and more."      },
  { type: "Other",        icon: Ghost,        description: "Posters, zines, accessories or anything else." },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(p: Product) {
  const base = `$${p.price}`
  return p.priceMode === "min" ? `from ${base}` : base
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  })
}

function sortProducts(products: Product[], key: SortKey, dir: SortDir): Product[] {
  return [...products].sort((a, b) => {
    let cmp = 0
    switch (key) {
      case "title":      cmp = a.title.localeCompare(b.title); break
      case "lastEdited": cmp = a.lastEdited.localeCompare(b.lastEdited); break
      case "stock":      cmp = (a.stock ?? Infinity) - (b.stock ?? Infinity); break
      case "price":      cmp = a.price - b.price; break
      case "sold":       cmp = a.sold - b.sold; break
    }
    return dir === "desc" ? -cmp : cmp
  })
}

// ─── Filter UI primitives ─────────────────────────────────────────────────────

function FilterClearAll({ onClear, label = "Clear all" }: { onClear: () => void; label?: string }) {
  return (
    <>
      <div className="-mx-1 my-1 h-px bg-border" />
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onClear() }}
        className="flex w-full items-center justify-center rounded-lg px-2.5 py-1.5 text-xsmall text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        {label}
      </button>
    </>
  )
}

function RadioIndicator({ checked }: { checked: boolean }) {
  return (
    <span className={cn(
      "flex size-4 shrink-0 rounded-full border items-center justify-center transition-colors",
      checked ? "border-primary bg-primary" : "border-muted-foreground dark:bg-input/30",
    )}>
      {checked && <span className="size-1.5 rounded-full bg-primary-foreground" />}
    </span>
  )
}

// ─── StatusFilter ─────────────────────────────────────────────────────────────

function StatusFilter({ value, onChange }: {
  value:    ProductStatus | "all"
  onChange: (v: ProductStatus | "all") => void
}) {
  const active = value !== "all"
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={filterTriggerCls(active)}>
        Status
        <FilterChevron />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {(["public", "private"] as ProductStatus[]).map(s => (
          <div
            key={s}
            role="option"
            aria-selected={value === s}
            tabIndex={0}
            onClick={() => onChange(value === s ? "all" : s)}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") onChange(value === s ? "all" : s) }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xsmall text-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-default select-none"
          >
            <RadioIndicator checked={value === s} />
            {s === "public" ? "Public" : "Private"}
          </div>
        ))}
        {active && <FilterClearAll onClear={() => onChange("all")} />}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── TypeMultiSelect ──────────────────────────────────────────────────────────

function TypeMultiSelect({ selected, onChange }: {
  selected: Set<ProductType>
  onChange:  (next: Set<ProductType>) => void
}) {
  const toggle = (t: ProductType) => {
    const next = new Set(selected)
    if (next.has(t)) next.delete(t)
    else next.add(t)
    onChange(next)
  }

  const active = selected.size > 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={filterTriggerCls(active)}>
        Type
        <FilterCount count={selected.size} />
        <FilterChevron />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {(["Vinyl", "Compact Disc", "Cassette", "Apparel", "Other"] as ProductType[]).map(t => (
          <DropdownMenuItem
            key={t}
            onClick={() => toggle(t)}
            closeOnClick={false}
            className="text-foreground text-xsmall"
          >
            <Checkbox
              checked={selected.has(t)}
              onCheckedChange={() => {}}
              tabIndex={-1}
              className="pointer-events-none shrink-0 after:hidden"
            />
            {t}
          </DropdownMenuItem>
        ))}
        {active && <FilterClearAll onClear={() => onChange(new Set())} />}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Column layout ────────────────────────────────────────────────────────────

// Initial column widths (px) — TableHead manages resize from here via DOM
const COL = {
  checkbox: 40,
  cover:    60,
  title:    200,
  type:     88,
  status:   96,
  price:    80,
  stock:    72,
  sold:     72,
  muzaLink: 140,
  edited:   104,
  actions:  48,
} as const

// ─── SortHeader ───────────────────────────────────────────────────────────────

function SortHeader({ label, sortKey: sk, activeSortKey, sortDir, onSort, style, className }: {
  label: string; sortKey: SortKey; activeSortKey: SortKey; sortDir: SortDir
  onSort: (k: SortKey) => void; style?: React.CSSProperties; className?: string
}) {
  const isActive = sk === activeSortKey
  return (
    <button
      className={cn("flex items-center gap-0.5 min-w-0 overflow-hidden cursor-pointer group/sort select-none shrink-0", className)}
      style={style}
      onClick={() => onSort(sk)}
    >
      <span className={cn("text-xsmall font-normal truncate", isActive ? "text-foreground" : "text-muted-foreground")}>
        {label}
      </span>
      {isActive
        ? (sortDir === "asc"
            ? <ArrowUp   className="size-3 shrink-0 text-foreground" />
            : <ArrowDown className="size-3 shrink-0 text-foreground" />)
        : <ArrowUpDown className="size-3 shrink-0 text-muted-foreground opacity-0 group-hover/sort:opacity-50 transition-opacity" />
      }
    </button>
  )
}

// ─── ProductRow ───────────────────────────────────────────────────────────────

function ProductRow({ product, isSelected, onSelect, status, onStatusChange, onEdit }: {
  product:        Product
  isSelected:     boolean
  onSelect:       () => void
  status:         ProductStatus
  onStatusChange: (s: ProductStatus) => void
  onEdit:         () => void
}) {
  const [hovered, setHovered] = useState(false)
  const isLowStock = product.stock !== null && product.stock <= LOW_STOCK_THRESHOLD
  const isDimmed   = status === "private"

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

      {/* Cover */}
      <td className="px-2 py-0" style={{ width: COL.cover }}>
        <div className={cn("rounded-xs bg-neutral-200 overflow-hidden transition-opacity", isDimmed && "opacity-50")} style={{ width: 44, height: 44 }}>
          <img src={product.image} alt={product.title} className="size-full object-cover" draggable={false} />
        </div>
      </td>

      {/* Title + variants */}
      <td className="px-4 py-0">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className={cn("text-xsmall font-normal truncate", isDimmed ? "text-muted-foreground" : "text-foreground")}>{product.title}</span>
          {product.variants !== undefined && <span className="text-2xsmall text-muted-foreground">{product.variants} variants</span>}
        </div>
      </td>

      {/* Type badge */}
      <td className="px-4 py-0">
        {(() => { const Icon = TYPE_ICON[product.type]; return <Badge variant="secondary"><Icon />{TYPE_LABEL[product.type]}</Badge> })()}
      </td>

      {/* Status */}
      <td className="px-4 py-0">
        <StatusBadge status={status} onStatusChange={onStatusChange} />
      </td>

      {/* Price */}
      <td className={cn("px-4 py-0 text-xsmall font-normal tabular-nums", isDimmed ? "text-muted-foreground" : "text-foreground")}>
        {formatPrice(product)}
      </td>

      {/* Stock */}
      <td className="px-4 py-0">
        {product.stock === null ? (
          <span className="text-xsmall font-normal text-muted-foreground tabular-nums">∞</span>
        ) : isLowStock ? (
          <span className="text-xsmall font-medium text-amber-600 dark:text-amber-400 tabular-nums">{product.stock}</span>
        ) : (
          <span className="text-xsmall font-normal text-muted-foreground tabular-nums">{product.stock}</span>
        )}
      </td>

      {/* Orders */}
      <td className="px-4 py-0 text-xsmall font-normal text-muted-foreground tabular-nums">
        {product.sold > 0 ? product.sold.toLocaleString() : <span className="text-muted-foreground/40">—</span>}
      </td>

      {/* Muza link */}
      <td className="px-4 py-0 text-xsmall text-muted-foreground max-w-0">
        <span className="block truncate">
          {product.type !== "Apparel" && product.muzaLink ? product.muzaLink : <span className="text-muted-foreground/40">—</span>}
        </span>
      </td>

      {/* Last edited */}
      <td className="px-4 py-0 text-xsmall font-normal text-muted-foreground tabular-nums whitespace-nowrap">
        {formatDate(product.lastEdited)}
      </td>

      {/* Actions */}
      <td className="px-2 py-0 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className={cn("size-8 transition-opacity", hovered ? "opacity-100" : "opacity-0")}>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}><Pencil className="size-4" />Edit</DropdownMenuItem>
            <DropdownMenuItem><Copy className="size-4" />Duplicate</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive"><Trash2 className="size-4" />Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}

// ─── AddProductDialog ─────────────────────────────────────────────────────────

function AddProductDialog({ open, onOpenChange, onSelect }: {
  open: boolean; onOpenChange: (open: boolean) => void; onSelect: (type: ProductType) => void
}) {
  const [selected, setSelected] = useState<ProductType>("Vinyl")

  function handleConfirm() {
    onSelect(selected)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-8 gap-0 shadow-none">
        <DialogHeader className="mb-8 gap-0.5">
          <DialogTitle className="text-large font-semibold leading-none">Create Listing</DialogTitle>
          <DialogDescription className="text-small text-muted-foreground">
            Choose what you want to sell.
          </DialogDescription>
        </DialogHeader>

        <RadioCardGroup
          value={selected}
          onValueChange={v => setSelected(v as ProductType)}
        >
          {PRODUCT_TYPE_OPTIONS.map(opt => {
            const Icon = opt.icon
            return (
              <RadioCard
                key={opt.type}
                value={opt.type}
                selected={selected === opt.type}
                onSelect={() => setSelected(opt.type)}
                icon={<Icon />}
                title={opt.type}
                description={opt.description}
              />
            )
          })}
        </RadioCardGroup>

        {/* Bigger dialog → footer padding scales up to match p-8 content. */}
        <DialogFooter className="p-8 -mx-8 -mb-8">
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={handleConfirm}>Create Listing</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── ShopMyProductsView ───────────────────────────────────────────────────────

export function ShopMyProductsView() {
  const [statuses,     setStatuses]     = useState<Record<string, ProductStatus>>(
    () => Object.fromEntries(PRODUCTS.map(p => [p.id, p.status]))
  )
  const [typeFilters,  setTypeFilters]  = useState<Set<ProductType>>(new Set())
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">("all")
  const [searchQuery,  setSearchQuery]  = useState("")
  const [sortKey,      setSortKey]      = useState<SortKey>("lastEdited")
  const [sortDir,      setSortDir]      = useState<SortDir>("desc")
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set())
  const [dialogOpen,   setDialogOpen]   = useState(false)
  // `editing` drives the full-page Vinyl create/edit flow. When non-null, the
  // form replaces the table. `id` present ⇒ edit mode; `id` absent ⇒ create.
  const [editing, setEditing] = useState<{ type: ProductType; product?: Product } | null>(null)

  function setProductStatus(id: string, s: ProductStatus) {
    setStatuses(prev => ({ ...prev, [id]: s }))
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSortChange(key: SortKey) {
    if (key === sortKey) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("asc") }
  }

  function handleProductTypeSelected(type: ProductType) {
    // For now only Vinyl has a dedicated form; other types can be wired later.
    if (type === "Vinyl") setEditing({ type })
  }

  function handleEditProduct(product: Product) {
    if (product.type === "Vinyl") setEditing({ type: "Vinyl", product })
  }

  function handleCloseEditor() {
    setEditing(null)
  }

  function handleSaveDraft(_draft: VinylDraft) {
    // Stub: persist as draft. For now just close the editor.
    setEditing(null)
  }

  function handlePublishDraft(_draft: VinylDraft) {
    // Stub: publish. For now just close the editor.
    setEditing(null)
  }

  const q = searchQuery.trim().toLowerCase()
  const filtered = sortProducts(
    PRODUCTS.filter(p => {
      if (typeFilters.size > 0   && !typeFilters.has(p.type))                     return false
      if (statusFilter !== "all" && (statuses[p.id] ?? p.status) !== statusFilter) return false
      if (q && !p.title.toLowerCase().includes(q))                                return false
      return true
    }),
    sortKey,
    sortDir,
  )

  const anyFilter    = typeFilters.size > 0 || statusFilter !== "all" || q.length > 0
  const allSelected  = filtered.length > 0 && filtered.every(p => selectedIds.has(p.id))
  const someSelected = filtered.some(p => selectedIds.has(p.id))

  function toggleSelectAll() {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(filtered.map(p => p.id)))
  }

  function clearAllFilters() {
    setTypeFilters(new Set())
    setStatusFilter("all")
    setSearchQuery("")
  }

  // Full-page create/edit takes over when `editing` is set — the table
  // stays mounted behind it so selection state and filters aren't lost.
  if (editing && editing.type === "Vinyl") {
    const p = editing.product
    return (
      <VinylCreateListing
        mode={p ? "edit" : "create"}
        initial={p ? {
          id:      p.id,
          title:   p.title,
          type:    "Album",
          year:    "",
          variant: "",
        } : undefined}
        onCancel={handleCloseEditor}
        onSave={handleSaveDraft}
        onPublish={handlePublishDraft}
      />
    )
  }

  return (
    <div className="relative flex flex-col h-full">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between gap-6 px-16 pt-8 pb-6">
        <div>
          <h1 className="text-2xlarge font-medium tracking-tight">Products</h1>
          <p className="text-small font-normal text-muted-foreground mt-1">
            {SHOP_STATS.listings} listings · {SHOP_STATS.orders.toLocaleString()} orders
          </p>
        </div>
        <Button size="lg" className="text-base px-8 h-14 gap-2.5 shrink-0" onClick={() => setDialogOpen(true)}>
          <Plus className="size-5" />
          Add product
        </Button>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-start gap-3 px-16 pb-8">
        <div className="flex items-start gap-2 flex-1 flex-wrap">

          {/* Status filter */}
          <StatusFilter value={statusFilter} onChange={setStatusFilter} />

          {/* Type filter */}
          <TypeMultiSelect selected={typeFilters} onChange={setTypeFilters} />

          {/* Search */}
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products"
              className={cn(
                "h-10 pl-10 pr-[18px] rounded-full border text-small font-normal bg-transparent transition-all",
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
      </div>

      {/* ── Active filter chips ───────────────────────────────────────── */}
      {anyFilter && (
        <div className="shrink-0 flex items-center gap-1.5 px-16 pb-3 flex-wrap">
          <button
            onClick={clearAllFilters}
            className="text-xsmall font-normal text-muted-foreground hover:text-foreground transition-colors mr-1 shrink-0"
          >
            Clear all
          </button>
          {statusFilter !== "all" && (
            <ChipDismiss onDismiss={() => setStatusFilter("all")}>
              {statusFilter === "public" ? "Public" : "Private"}
            </ChipDismiss>
          )}
          {[...typeFilters].map(t => (
            <ChipDismiss
              key={t}
              onDismiss={() => {
                const next = new Set(typeFilters)
                next.delete(t)
                setTypeFilters(next)
              }}
            >
              {t}
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
              <TableHead resizable={false} className="px-2" style={{ width: COL.cover }} />
              <TableHead style={{ width: COL.title }}>
                <SortHeader label="Product" sortKey="title" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSortChange} />
              </TableHead>
              <TableHead style={{ width: COL.type }}>Type</TableHead>
              <TableHead style={{ width: COL.status }}>Status</TableHead>
              <TableHead style={{ width: COL.price }}>
                <SortHeader label="Price" sortKey="price" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSortChange} />
              </TableHead>
              <TableHead style={{ width: COL.stock }}>
                <SortHeader label="Stock" sortKey="stock" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSortChange} />
              </TableHead>
              <TableHead style={{ width: COL.sold }}>
                <SortHeader label="Orders" sortKey="sold" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSortChange} />
              </TableHead>
              <TableHead style={{ width: COL.muzaLink }}>Muza link</TableHead>
              <TableHead style={{ width: COL.edited }}>
                <SortHeader label="Last edited" sortKey="lastEdited" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSortChange} />
              </TableHead>
              <TableHead resizable={false} className="w-12 px-2" />
            </tr>
          </thead>

          {/* Empty state — no products at all */}
          {PRODUCTS.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={11} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="flex items-center justify-center size-14 rounded-full bg-muted">
                      <Package className="size-6 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col items-center gap-1 text-center">
                      <p className="text-small font-medium text-foreground">No products yet</p>
                      <p className="text-small text-muted-foreground">Add your first listing to start selling.</p>
                    </div>
                    <Button size="sm" onClick={() => setDialogOpen(true)}>
                      <Plus className="size-4" />
                      Add product
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>

          /* Empty state — filters returned nothing */
          ) : filtered.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={11} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <p className="text-small font-normal text-muted-foreground">No products match the current filters.</p>
                    <button
                      onClick={clearAllFilters}
                      className="text-xsmall font-normal text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                    >
                      Clear filters
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>

          /* Rows */
          ) : (
            <tbody className="[&_tr:last-child]:border-0">
              {filtered.map(product => (
                <ProductRow
                  key={product.id}
                  product={product}
                  isSelected={selectedIds.has(product.id)}
                  onSelect={() => toggleSelect(product.id)}
                  status={statuses[product.id] ?? product.status}
                  onStatusChange={s => setProductStatus(product.id, s)}
                  onEdit={() => handleEditProduct(product)}
                />
              ))}
            </tbody>
          )}
        </table>
      </div>

      {/* ── Bulk actions toolbar ──────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-foreground border border-foreground shadow-xl">
            <span className="text-small font-medium text-background tabular-nums pr-2">
              {selectedIds.size} selected
            </span>
            <div className="w-px h-5 bg-background/20" />
            <Button
              size="sm"
              variant="secondary"
              className="bg-background/15 hover:bg-background/25 text-background border-transparent"
              onClick={() => {
                selectedIds.forEach(id => setProductStatus(id, "public"))
                setSelectedIds(new Set())
              }}
            >
              Publish
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="bg-background/15 hover:bg-background/25 text-background border-transparent"
              onClick={() => {
                selectedIds.forEach(id => setProductStatus(id, "private"))
                setSelectedIds(new Set())
              }}
            >
              Unpublish
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

      {/* ── Add product dialog ──────────────────────────────────────── */}
      <AddProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSelect={handleProductTypeSelected}
      />
    </div>
  )
}
