"use client"

import React, { useState } from "react"
import {
  MoreHorizontal, Truck, X, Ban, RotateCcw,
  ArrowDown, ArrowUp, ArrowUpDown, Search, ShoppingCart, Settings2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ChipDismiss } from "@/components/ui/chip"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuGroup,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { filterTriggerCls, FilterChevron, FilterCount } from "@/components/ui/filter-button"
import { TableHead } from "@/components/ui/table"

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded"
type SortKey     = "number" | "date" | "total"
type SortDir     = "asc" | "desc"
type ColKey      = "image" | "date" | "total" | "status"

const COL_DEFS: { key: ColKey; label: string; required: boolean }[] = [
  { key: "image",  label: "Image",  required: false },
  { key: "date",   label: "Date",   required: false },
  { key: "total",  label: "Total",  required: false },
  { key: "status", label: "Status", required: true  },
]

const DEFAULT_VISIBLE: Record<ColKey, boolean> = {
  image:  false,
  date:   true,
  total:  true,
  status: true,
}

type ProductType = "Vinyl" | "CD" | "Cassette" | "Apparel" | "Other"

interface OrderItem {
  productTitle: string
  type:         ProductType
  image:        string
  quantity:     number
}

interface Order {
  id:       string
  number:   string
  customer: { name: string; location: string }
  items:    OrderItem[]
  date:     string
  total:    number
  status:   OrderStatus
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const PIC = (seed: string) =>
  `https://picsum.photos/seed/${seed}/80/80`

const ORDERS: Order[] = [
  { id: "1",  number: "#1058", customer: { name: "Sofia Andersen",   location: "Copenhagen, DK"  }, items: [{ productTitle: "City Lights — LP",       type: "Vinyl",    image: PIC("citylights"),  quantity: 1 }],                                                                          date: "2026-04-15", total: 28,  status: "pending"    },
  { id: "2",  number: "#1057", customer: { name: "Marcus Webb",       location: "London, UK"      }, items: [{ productTitle: "Logo Tee",               type: "Apparel",  image: PIC("logotee"),     quantity: 2 }, { productTitle: "Enamel Pin Set",         type: "Other",    image: PIC("pinset"),     quantity: 1 }], date: "2026-04-14", total: 72,  status: "processing" },
  { id: "3",  number: "#1056", customer: { name: "Léa Moreau",        location: "Paris, FR"       }, items: [{ productTitle: "Golden Hour — 12\"",     type: "Vinyl",    image: PIC("goldenhour"),  quantity: 1 }],                                                                          date: "2026-04-14", total: 32,  status: "shipped"    },
  { id: "4",  number: "#1055", customer: { name: "Tomás Rivera",      location: "Madrid, ES"      }, items: [{ productTitle: "Echoes of Tomorrow",     type: "CD",       image: PIC("echoes"),      quantity: 1 }, { productTitle: "Limited Edition Poster", type: "Other",    image: PIC("poster99"),   quantity: 2 }], date: "2026-04-13", total: 52,  status: "shipped"    },
  { id: "5",  number: "#1054", customer: { name: "Ingrid Holm",       location: "Oslo, NO"        }, items: [{ productTitle: "Golden Hour Hoodie",     type: "Apparel",  image: PIC("hoodie77"),    quantity: 1 }],                                                                          date: "2026-04-12", total: 55,  status: "delivered"  },
  { id: "6",  number: "#1053", customer: { name: "Caleb Osei",        location: "Accra, GH"       }, items: [{ productTitle: "City Lights — Cassette", type: "Cassette", image: PIC("cassette12"),  quantity: 1 }],                                                                          date: "2026-04-11", total: 14,  status: "delivered"  },
  { id: "7",  number: "#1052", customer: { name: "Hana Novák",        location: "Prague, CZ"      }, items: [{ productTitle: "Logo Tee",               type: "Apparel",  image: PIC("logotee"),     quantity: 1 }],                                                                          date: "2026-04-10", total: 30,  status: "delivered"  },
  { id: "8",  number: "#1051", customer: { name: "James Okafor",      location: "Lagos, NG"       }, items: [{ productTitle: "Enamel Pin Set",         type: "Other",    image: PIC("pinset"),      quantity: 3 }],                                                                          date: "2026-04-09", total: 36,  status: "delivered"  },
  { id: "9",  number: "#1050", customer: { name: "Yuki Tanaka",       location: "Tokyo, JP"       }, items: [{ productTitle: "City Lights — LP",       type: "Vinyl",    image: PIC("citylights"),  quantity: 1 }, { productTitle: "City Lights — Cassette", type: "Cassette", image: PIC("cassette12"), quantity: 1 }], date: "2026-04-08", total: 42,  status: "cancelled"  },
  { id: "10", number: "#1049", customer: { name: "Elena Petrov",      location: "Berlin, DE"      }, items: [{ productTitle: "Limited Edition Poster", type: "Other",    image: PIC("poster99"),    quantity: 1 }],                                                                          date: "2026-04-07", total: 18,  status: "refunded"   },
  { id: "11", number: "#1048", customer: { name: "Niamh O'Brien",     location: "Dublin, IE"      }, items: [{ productTitle: "Echoes of Tomorrow",     type: "CD",       image: PIC("echoes"),      quantity: 2 }],                                                                          date: "2026-04-06", total: 32,  status: "delivered"  },
  { id: "12", number: "#1047", customer: { name: "Santiago Gómez",    location: "Buenos Aires, AR"}, items: [{ productTitle: "Golden Hour Hoodie",     type: "Apparel",  image: PIC("hoodie77"),    quantity: 1 }, { productTitle: "Logo Tee",               type: "Apparel",  image: PIC("logotee"),    quantity: 1 }], date: "2026-04-05", total: 85,  status: "delivered"  },
  { id: "13", number: "#1046", customer: { name: "Amara Diallo",      location: "Dakar, SN"       }, items: [{ productTitle: "Tour Cap",               type: "Apparel",  image: PIC("tourcap"),     quantity: 1 }],                                                                          date: "2026-04-04", total: 25,  status: "processing" },
  { id: "14", number: "#1045", customer: { name: "Finn Larsen",       location: "Aarhus, DK"      }, items: [{ productTitle: "City Lights — LP",       type: "Vinyl",    image: PIC("citylights"),  quantity: 1 }],                                                                          date: "2026-04-03", total: 28,  status: "delivered"  },
  { id: "15", number: "#1044", customer: { name: "Priya Sharma",      location: "Mumbai, IN"      }, items: [{ productTitle: "Enamel Pin Set",         type: "Other",    image: PIC("pinset"),      quantity: 2 }, { productTitle: "Limited Edition Poster", type: "Other",    image: PIC("poster99"),   quantity: 1 }], date: "2026-04-02", total: 42,  status: "delivered"  },
]

// ─── Aggregated stats ─────────────────────────────────────────────────────────

export const ORDER_STATS = {
  count:   ORDERS.length,
  revenue: ORDERS.filter(o => o.status !== "cancelled" && o.status !== "refunded")
                 .reduce((s, o) => s + o.total, 0),
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  pending:    { label: "Pending",    className: "bg-muted text-foreground border-border" },
  processing: { label: "Processing", className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800" },
  shipped:    { label: "Shipped",    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800" },
  delivered:  { label: "Delivered",  className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/60 dark:text-green-300 dark:border-green-800" },
  cancelled:  { label: "Cancelled",  className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800" },
  refunded:   { label: "Refunded",   className: "bg-muted text-muted-foreground border-border" },
}

const ALL_STATUSES: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"]

const ALL_PRODUCT_TYPES: ProductType[] = ["Vinyl", "CD", "Cassette", "Apparel", "Other"]

const ALL_PRODUCTS: string[] = Array.from(
  new Set(ORDERS.flatMap(o => o.items.map(i => i.productTitle)))
).sort()

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  })
}

function formatTotal(n: number) {
  return `$${n.toLocaleString()}`
}

function sortOrders(orders: Order[], key: SortKey, dir: SortDir): Order[] {
  return [...orders].sort((a, b) => {
    let cmp = 0
    switch (key) {
      case "number": cmp = a.number.localeCompare(b.number, undefined, { numeric: true }); break
      case "date":   cmp = a.date.localeCompare(b.date); break
      case "total":  cmp = a.total - b.total; break
    }
    return dir === "desc" ? -cmp : cmp
  })
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status]
  return <Badge className={cfg.className}>{cfg.label}</Badge>
}

// ─── Filter primitives ────────────────────────────────────────────────────────

function FilterClearAll({ onClear }: { onClear: () => void }) {
  return (
    <>
      <div className="-mx-1 my-1 h-px bg-border" />
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onClear() }}
        className="flex w-full items-center justify-center rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        Clear all
      </button>
    </>
  )
}

// ─── StatusFilter ─────────────────────────────────────────────────────────────

function StatusFilter({ selected, onChange }: {
  selected: Set<OrderStatus>
  onChange:  (next: Set<OrderStatus>) => void
}) {
  const toggle = (s: OrderStatus) => {
    const next = new Set(selected)
    if (next.has(s)) next.delete(s); else next.add(s)
    onChange(next)
  }
  const active = selected.size > 0
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={filterTriggerCls(active)}>
        Status
        <FilterCount count={selected.size} />
        <FilterChevron />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {ALL_STATUSES.map(s => (
          <div
            key={s}
            role="option"
            aria-selected={selected.has(s)}
            tabIndex={0}
            onClick={() => toggle(s)}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") toggle(s) }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-accent transition-colors cursor-default select-none"
          >
            <Checkbox checked={selected.has(s)} onCheckedChange={() => {}} tabIndex={-1} className="pointer-events-none shrink-0 after:hidden" />
            {STATUS_CONFIG[s].label}
          </div>
        ))}
        {active && <FilterClearAll onClear={() => onChange(new Set())} />}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── ProductTypeFilter ────────────────────────────────────────────────────────

function ProductTypeFilter({ selected, onChange }: {
  selected: Set<ProductType>
  onChange:  (next: Set<ProductType>) => void
}) {
  const toggle = (t: ProductType) => {
    const next = new Set(selected)
    if (next.has(t)) next.delete(t); else next.add(t)
    onChange(next)
  }
  const active = selected.size > 0
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={filterTriggerCls(active)}>
        Product type
        <FilterCount count={selected.size} />
        <FilterChevron />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {ALL_PRODUCT_TYPES.map(t => (
          <div
            key={t}
            role="option"
            aria-selected={selected.has(t)}
            tabIndex={0}
            onClick={() => toggle(t)}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") toggle(t) }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-accent transition-colors cursor-default select-none"
          >
            <Checkbox checked={selected.has(t)} onCheckedChange={() => {}} tabIndex={-1} className="pointer-events-none shrink-0 after:hidden" />
            {t}
          </div>
        ))}
        {active && <FilterClearAll onClear={() => onChange(new Set())} />}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── ProductFilter ────────────────────────────────────────────────────────────

function ProductFilter({ selected, onChange }: {
  selected: Set<string>
  onChange:  (next: Set<string>) => void
}) {
  const toggle = (p: string) => {
    const next = new Set(selected)
    if (next.has(p)) next.delete(p); else next.add(p)
    onChange(next)
  }
  const active = selected.size > 0
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={filterTriggerCls(active)}>
        Product
        <FilterCount count={selected.size} />
        <FilterChevron />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
        {ALL_PRODUCTS.map(p => (
          <div
            key={p}
            role="option"
            aria-selected={selected.has(p)}
            tabIndex={0}
            onClick={() => toggle(p)}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") toggle(p) }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-accent transition-colors cursor-default select-none"
          >
            <Checkbox checked={selected.has(p)} onCheckedChange={() => {}} tabIndex={-1} className="pointer-events-none shrink-0 after:hidden" />
            {p}
          </div>
        ))}
        {active && <FilterClearAll onClear={() => onChange(new Set())} />}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Column layout ────────────────────────────────────────────────────────────

const COL = {
  number:   72,
  customer: 160,
  image:    44,
  product:  160,
  date:     96,
  total:    72,
  status:   104,
  actions:  32,
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
      <span className={cn("text-xs font-normal truncate", isActive ? "text-foreground" : "text-muted-foreground")}>
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

// ─── OrderRow ─────────────────────────────────────────────────────────────────

function OrderRow({ order, isSelected, onSelect, status, onStatusChange, visibleCols }: {
  order:          Order
  isSelected:     boolean
  onSelect:       () => void
  status:         OrderStatus
  onStatusChange: (s: OrderStatus) => void
  visibleCols:    Record<ColKey, boolean>
}) {
  const [hovered, setHovered] = useState(false)
  const first = order.items[0]
  const extra = order.items.length - 1

  return (
    <tr
      className={cn("border-b border-border transition-colors cursor-pointer", hovered || isSelected ? "bg-muted" : "bg-background")}
      style={{ height: 56 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Checkbox */}
      <td className="px-2 py-0 text-center">
        <div className={cn("flex items-center justify-center transition-opacity", hovered || isSelected ? "opacity-100" : "opacity-0 pointer-events-none")}>
          <Checkbox checked={isSelected} onCheckedChange={onSelect} onClick={e => e.stopPropagation()} className="after:hidden" />
        </div>
      </td>

      {/* Order number */}
      <td className="px-4 py-0 text-xs font-normal text-muted-foreground tabular-nums">
        {order.number}
      </td>

      {/* Customer */}
      <td className="px-4 py-0">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-xs font-normal text-foreground truncate">{order.customer.name}</span>
          <span className="text-xxs text-muted-foreground truncate">{order.customer.location}</span>
        </div>
      </td>

      {/* Image (optional) */}
      <td className={cn("px-2 py-0", !visibleCols.image && "hidden")}>
        <div className="rounded-xs bg-neutral-200 overflow-hidden" style={{ width: 44, height: 44 }}>
          <img src={first.image} alt={first.productTitle} className="size-full object-cover" draggable={false} />
        </div>
      </td>

      {/* Product */}
      <td className="px-4 py-0">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-xs font-normal text-foreground truncate">
            {first.productTitle}{first.quantity > 1 && ` ×${first.quantity}`}
          </span>
          {extra > 0 && (
            <span className="text-xxs text-muted-foreground">+{extra} more</span>
          )}
        </div>
      </td>

      {/* Date */}
      <td className={cn("px-4 py-0 text-xs font-normal text-muted-foreground tabular-nums whitespace-nowrap", !visibleCols.date && "hidden")}>
        {formatDate(order.date)}
      </td>

      {/* Total */}
      <td className={cn("px-4 py-0 text-xs font-normal text-foreground tabular-nums", !visibleCols.total && "hidden")}>
        {formatTotal(order.total)}
      </td>

      {/* Status */}
      <td className={cn("px-4 py-0", !visibleCols.status && "hidden")}>
        <OrderStatusBadge status={status} />
      </td>

      {/* Actions */}
      <td className="px-2 py-0 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("size-8 transition-opacity", hovered ? "opacity-100" : "opacity-0")}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(status === "pending" || status === "processing") && (
              <DropdownMenuItem onClick={() => onStatusChange("shipped")}>
                <Truck className="size-4" />
                Mark as shipped
              </DropdownMenuItem>
            )}
            {status === "shipped" && (
              <DropdownMenuItem onClick={() => onStatusChange("delivered")}>
                <Truck className="size-4" />
                Mark as delivered
              </DropdownMenuItem>
            )}
            {status === "delivered" && (
              <DropdownMenuItem onClick={() => onStatusChange("refunded")}>
                <RotateCcw className="size-4" />
                Refund
              </DropdownMenuItem>
            )}
            {(status === "pending" || status === "processing") && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onStatusChange("cancelled")}
                >
                  <Ban className="size-4" />
                  Cancel order
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}

// ─── OrdersView ───────────────────────────────────────────────────────────────

export function OrdersView() {
  const [visibleCols,   setVisibleCols]   = useState<Record<ColKey, boolean>>({ ...DEFAULT_VISIBLE })
  const [statuses,      setStatuses]      = useState<Record<string, OrderStatus>>(
    () => Object.fromEntries(ORDERS.map(o => [o.id, o.status]))
  )
  const [statusFilters,      setStatusFilters]      = useState<Set<OrderStatus>>(new Set())
  const [productFilters,     setProductFilters]     = useState<Set<string>>(new Set())
  const [productTypeFilters, setProductTypeFilters] = useState<Set<ProductType>>(new Set())
  const [searchQuery,        setSearchQuery]        = useState("")
  const [sortKey,       setSortKey]       = useState<SortKey>("date")
  const [sortDir,       setSortDir]       = useState<SortDir>("desc")
  const [selectedIds,   setSelectedIds]   = useState<Set<string>>(new Set())

  function toggleCol(key: ColKey) {
    const def = COL_DEFS.find(d => d.key === key)
    if (def?.required) return
    setVisibleCols(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const isColsModified = COL_DEFS.some(({ key }) => visibleCols[key] !== DEFAULT_VISIBLE[key])

  function setOrderStatus(id: string, s: OrderStatus) {
    setStatuses(prev => ({ ...prev, [id]: s }))
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function handleSortChange(key: SortKey) {
    if (key === sortKey) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("desc") }
  }

  const q = searchQuery.trim().toLowerCase()
  const filtered = sortOrders(
    ORDERS.filter(o => {
      const status = statuses[o.id] ?? o.status
      if (statusFilters.size > 0 && !statusFilters.has(status)) return false
      if (productFilters.size > 0 && !o.items.some(i => productFilters.has(i.productTitle))) return false
      if (productTypeFilters.size > 0 && !o.items.some(i => productTypeFilters.has(i.type))) return false
      if (q && !o.customer.name.toLowerCase().includes(q) && !o.number.toLowerCase().includes(q)) return false
      return true
    }),
    sortKey,
    sortDir,
  )

  const anyFilter    = statusFilters.size > 0 || productFilters.size > 0 || productTypeFilters.size > 0 || q.length > 0
  const allSelected  = filtered.length > 0 && filtered.every(o => selectedIds.has(o.id))
  const someSelected = filtered.some(o => selectedIds.has(o.id))

  function toggleSelectAll() {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(filtered.map(o => o.id)))
  }

  return (
    <div className="relative flex flex-col h-full">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between gap-6 px-16 pt-8 pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="text-sm font-normal text-muted-foreground mt-1">
            {ORDER_STATS.count} orders · ${ORDER_STATS.revenue.toLocaleString()} revenue
          </p>
        </div>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-3 px-16 pb-8">
        <StatusFilter selected={statusFilters} onChange={setStatusFilters} />
        <ProductFilter selected={productFilters} onChange={setProductFilters} />
        <ProductTypeFilter selected={productTypeFilters} onChange={setProductTypeFilters} />

        {/* Search */}
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search orders"
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

        {/* Columns button */}
        <div className="ml-auto">
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
                {isColsModified && (
                  <>
                    <div className="-mx-1 my-1 h-px bg-border" />
                    <button
                      type="button"
                      onClick={() => setVisibleCols({ ...DEFAULT_VISIBLE })}
                      className="flex w-full items-center justify-center rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      Reset
                    </button>
                  </>
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Active filter chips ───────────────────────────────────────── */}
      {anyFilter && (
        <div className="shrink-0 flex items-center gap-1.5 px-16 pb-3 flex-wrap">
          <button
            onClick={() => { setStatusFilters(new Set()); setProductFilters(new Set()); setProductTypeFilters(new Set()); setSearchQuery("") }}
            className="text-xs font-normal text-muted-foreground hover:text-foreground transition-colors mr-1 shrink-0"
          >
            Clear all
          </button>
          {[...statusFilters].map(s => (
            <ChipDismiss key={s} onDismiss={() => {
              const next = new Set(statusFilters); next.delete(s); setStatusFilters(next)
            }}>
              {STATUS_CONFIG[s].label}
            </ChipDismiss>
          ))}
          {[...productFilters].map(p => (
            <ChipDismiss key={p} onDismiss={() => {
              const next = new Set(productFilters); next.delete(p); setProductFilters(next)
            }}>
              {p}
            </ChipDismiss>
          ))}
          {[...productTypeFilters].map(t => (
            <ChipDismiss key={t} onDismiss={() => {
              const next = new Set(productTypeFilters); next.delete(t); setProductTypeFilters(next)
            }}>
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
              <TableHead resizable={false} className="w-10 px-2 text-center">
                <Checkbox checked={allSelected} indeterminate={!allSelected && someSelected} onCheckedChange={toggleSelectAll} className="after:hidden" />
              </TableHead>
              <TableHead style={{ width: COL.number }}>
                <SortHeader label="Order" sortKey="number" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSortChange} />
              </TableHead>
              <TableHead style={{ width: COL.customer }}>Customer</TableHead>
              <TableHead resizable={false} className={cn("px-2", !visibleCols.image && "hidden")} style={{ width: COL.image }} />
              <TableHead style={{ width: COL.product }}>Product</TableHead>
              <TableHead className={cn(!visibleCols.date && "hidden")} style={{ width: COL.date }}>
                <SortHeader label="Date" sortKey="date" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSortChange} />
              </TableHead>
              <TableHead className={cn(!visibleCols.total && "hidden")} style={{ width: COL.total }}>
                <SortHeader label="Total" sortKey="total" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSortChange} />
              </TableHead>
              <TableHead className={cn(!visibleCols.status && "hidden")} style={{ width: COL.status }}>Status</TableHead>
              <TableHead resizable={false} className="w-12 px-2" />
            </tr>
          </thead>

          {/* Empty state */}
          {filtered.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={9} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="flex items-center justify-center size-14 rounded-full bg-muted">
                      <ShoppingCart className="size-6 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col items-center gap-1 text-center">
                      <p className="text-sm font-medium text-foreground">No orders found</p>
                      <p className="text-sm text-muted-foreground">
                        {anyFilter ? "Try adjusting your filters." : "Orders from your customers will appear here."}
                      </p>
                    </div>
                    {anyFilter && (
                      <Button size="sm" variant="outline" onClick={() => { setStatusFilters(new Set()); setProductFilters(new Set()); setProductTypeFilters(new Set()); setSearchQuery("") }}>
                        Clear filters
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody className="[&_tr:last-child]:border-0">
              {filtered.map(order => (
                <OrderRow
                  key={order.id}
                  order={order}
                  isSelected={selectedIds.has(order.id)}
                  onSelect={() => toggleSelect(order.id)}
                  status={statuses[order.id] ?? order.status}
                  onStatusChange={s => setOrderStatus(order.id, s)}
                  visibleCols={visibleCols}
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
            <span className="text-sm font-medium text-background tabular-nums pr-2">
              {selectedIds.size} selected
            </span>
            <div className="w-px h-5 bg-background/20" />
            <Button
              size="sm"
              variant="secondary"
              className="bg-background/15 hover:bg-background/25 text-background border-transparent"
              onClick={() => {
                selectedIds.forEach(id => {
                  const cur = statuses[id] ?? ORDERS.find(o => o.id === id)!.status
                  if (cur === "pending" || cur === "processing") setOrderStatus(id, "shipped")
                })
                setSelectedIds(new Set())
              }}
            >
              <Truck className="size-3.5" />
              Mark shipped
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="bg-background/15 hover:bg-background/25 text-background border-transparent"
              onClick={() => {
                selectedIds.forEach(id => {
                  const cur = statuses[id] ?? ORDERS.find(o => o.id === id)!.status
                  if (cur === "pending" || cur === "processing") setOrderStatus(id, "cancelled")
                })
                setSelectedIds(new Set())
              }}
            >
              <Ban className="size-3.5" />
              Cancel
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
