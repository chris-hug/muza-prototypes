"use client"

import React, { useState } from "react"
import { useSearchParams } from "react-router"
import {
  Truck, X, Ban, RotateCcw, AlertTriangle, Mail, Copy, CheckCircle2, ChevronDown,
  ArrowDown, ArrowUp, ArrowUpDown, Search, ShoppingCart, Settings2,
} from "lucide-react"
import { OrderDetailView } from "@/components/app/order-detail-view"
import { BulkActionDialog } from "@/components/app/bulk-action-dialog"
import { type OrderEmailType } from "@/lib/order-emails"
import { useShopSettings } from "@/lib/shop-settings"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ChipDismiss } from "@/components/ui/chip"
import { useToast } from "@/components/ui/toast"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuGroup,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { filterTriggerCls, FilterChevron, FilterCount } from "@/components/ui/filter-button"
import { TableHead } from "@/components/ui/table"

// ─── Types ────────────────────────────────────────────────────────────────────

// Single source-of-truth lifecycle. "new" covers any order ready to ship
// (paid, awaiting your action). `payment_failed` covers both pre-order
// capture failures AND any other case where money didn't make it (declined
// retry, chargeback awaiting evidence, etc.) — the artist's recovery action
// is the same regardless of how the order got into that state. Partial
// refund stays a header annotation, not a status.
export type OrderStatus = "payment_failed" | "new" | "shipped" | "delivered" | "refunded" | "cancelled"
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

export type ProductType = "Vinyl" | "CD" | "Cassette" | "Apparel" | "Other"

export interface OrderItem {
  productTitle: string
  type:         ProductType
  image:        string
  quantity:     number
}

export interface Order {
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

// Status distribution mirrors realistic seller flow: the freshest
// orders are `new` (just paid, awaiting shipment — the action-required
// pile), recent `payment_failed` sits mixed in with the new batch (the
// other action-required state), then `shipped` orders that are in
// transit, then a long tail of `delivered`/`refunded`/`cancelled`
// historical entries. Sorted newest-first by date. Today = 2026-05-12.
export const ORDERS: Order[] = [
  // ── New: paid, awaiting shipment ─────────────────────────────────
  { id: "1",  number: "#1058", customer: { name: "Sofia Andersen",   location: "Copenhagen, DK"  }, items: [{ productTitle: "City Lights — LP",       type: "Vinyl",    image: PIC("citylights"),  quantity: 1 }],                                                                          date: "2026-05-12", total: 28,  status: "new"        },
  { id: "2",  number: "#1057", customer: { name: "Marcus Webb",       location: "London, UK"      }, items: [{ productTitle: "Logo Tee",               type: "Apparel",  image: PIC("logotee"),     quantity: 2 }, { productTitle: "Enamel Pin Set",         type: "Other",    image: PIC("pinset"),     quantity: 1 }], date: "2026-05-12", total: 72,  status: "new"        },
  { id: "3",  number: "#1056", customer: { name: "Léa Moreau",        location: "Paris, FR"       }, items: [{ productTitle: "Golden Hour — 12\"",     type: "Vinyl",    image: PIC("goldenhour"),  quantity: 1 }],                                                                          date: "2026-05-11", total: 32,  status: "new"        },
  { id: "4",  number: "#1055", customer: { name: "Tomás Rivera",      location: "Madrid, ES"      }, items: [{ productTitle: "Echoes of Tomorrow",     type: "CD",       image: PIC("echoes"),      quantity: 1 }, { productTitle: "Limited Edition Poster", type: "Other",    image: PIC("poster99"),   quantity: 2 }], date: "2026-05-11", total: 52,  status: "new"        },
  { id: "5",  number: "#1054", customer: { name: "Ingrid Holm",       location: "Oslo, NO"        }, items: [{ productTitle: "Golden Hour Hoodie",     type: "Apparel",  image: PIC("hoodie77"),    quantity: 1 }],                                                                          date: "2026-05-10", total: 55,  status: "new"        },
  { id: "6",  number: "#1053", customer: { name: "Caleb Osei",        location: "Accra, GH"       }, items: [{ productTitle: "City Lights — Cassette", type: "Cassette", image: PIC("cassette12"),  quantity: 1 }],                                                                          date: "2026-05-10", total: 14,  status: "new"        },

  // ── Payment failed: card declined, seller may follow up ─────────
  { id: "7",  number: "#1052", customer: { name: "Hana Novák",        location: "Prague, CZ"      }, items: [{ productTitle: "Logo Tee",               type: "Apparel",  image: PIC("logotee"),     quantity: 1 }],                                                                          date: "2026-05-09", total: 30,  status: "payment_failed" },
  { id: "8",  number: "#1051", customer: { name: "James Okafor",      location: "Lagos, NG"       }, items: [{ productTitle: "Enamel Pin Set",         type: "Other",    image: PIC("pinset"),      quantity: 3 }],                                                                          date: "2026-05-09", total: 36,  status: "payment_failed" },
  { id: "9",  number: "#1050", customer: { name: "Amara Diallo",      location: "Dakar, SN"       }, items: [{ productTitle: "Tour Cap",               type: "Apparel",  image: PIC("tourcap"),     quantity: 1 }],                                                                          date: "2026-05-07", total: 25,  status: "payment_failed" },

  // ── Shipped: in transit ─────────────────────────────────────────
  { id: "10", number: "#1049", customer: { name: "Yuki Tanaka",       location: "Tokyo, JP"       }, items: [{ productTitle: "City Lights — LP",       type: "Vinyl",    image: PIC("citylights"),  quantity: 1 }, { productTitle: "City Lights — Cassette", type: "Cassette", image: PIC("cassette12"), quantity: 1 }], date: "2026-05-08", total: 42,  status: "shipped"    },
  { id: "11", number: "#1048", customer: { name: "Elena Petrov",      location: "Berlin, DE"      }, items: [{ productTitle: "Limited Edition Poster", type: "Other",    image: PIC("poster99"),    quantity: 1 }],                                                                          date: "2026-05-07", total: 18,  status: "shipped"    },
  { id: "12", number: "#1047", customer: { name: "Niamh O'Brien",     location: "Dublin, IE"      }, items: [{ productTitle: "Echoes of Tomorrow",     type: "CD",       image: PIC("echoes"),      quantity: 2 }],                                                                          date: "2026-05-06", total: 32,  status: "shipped"    },
  { id: "13", number: "#1046", customer: { name: "Santiago Gómez",    location: "Buenos Aires, AR"}, items: [{ productTitle: "Golden Hour Hoodie",     type: "Apparel",  image: PIC("hoodie77"),    quantity: 1 }, { productTitle: "Logo Tee",               type: "Apparel",  image: PIC("logotee"),    quantity: 1 }], date: "2026-05-05", total: 85,  status: "shipped"    },
  { id: "14", number: "#1045", customer: { name: "Finn Larsen",       location: "Aarhus, DK"      }, items: [{ productTitle: "City Lights — LP",       type: "Vinyl",    image: PIC("citylights"),  quantity: 1 }],                                                                          date: "2026-05-03", total: 28,  status: "shipped"    },

  // ── Delivered: completed history ────────────────────────────────
  { id: "15", number: "#1044", customer: { name: "Priya Sharma",      location: "Mumbai, IN"      }, items: [{ productTitle: "Enamel Pin Set",              type: "Other",    image: PIC("pinset"),       quantity: 2 }, { productTitle: "Limited Edition Poster",  type: "Other",    image: PIC("poster99"),    quantity: 1 }], date: "2026-05-01", total: 42,  status: "delivered"  },
  { id: "16", number: "#1043", customer: { name: "Kenji Watanabe",    location: "Osaka, JP"       }, items: [{ productTitle: "Kind of Blue — LP",           type: "Vinyl",    image: PIC("kindofblue"),   quantity: 1 }],                                                                           date: "2026-04-29", total: 34,  status: "delivered"  },
  { id: "17", number: "#1042", customer: { name: "Isabelle Dupont",   location: "Lyon, FR"        }, items: [{ productTitle: "Modal Jazz — 7\" Single",     type: "Vinyl",    image: PIC("modaljazz"),    quantity: 1 }, { productTitle: "Jazz Notebook",           type: "Other",    image: PIC("notebook"),    quantity: 1 }], date: "2026-04-26", total: 34,  status: "delivered"  },
  { id: "18", number: "#1041", customer: { name: "Oluwaseun Adeyemi", location: "Ibadan, NG"      }, items: [{ productTitle: "A Love Supreme — LP",         type: "Vinyl",    image: PIC("lovesupreme"),  quantity: 1 }],                                                                           date: "2026-04-22", total: 38,  status: "delivered"  },
  { id: "19", number: "#1040", customer: { name: "Marta Kowalska",    location: "Warsaw, PL"      }, items: [{ productTitle: "Blue Note Crewneck",          type: "Apparel",  image: PIC("crewneck"),     quantity: 1 }],                                                                           date: "2026-04-19", total: 65,  status: "delivered"  },
  { id: "20", number: "#1039", customer: { name: "Rafael Andrade",    location: "São Paulo, BR"   }, items: [{ productTitle: "Bossa Nova Midnight",         type: "CD",       image: PIC("bossanova"),    quantity: 1 }, { productTitle: "Vinyl Slipmat",           type: "Other",    image: PIC("slipmat"),     quantity: 1 }], date: "2026-04-16", total: 35,  status: "delivered"  },
  { id: "21", number: "#1038", customer: { name: "Astrid Lindqvist",  location: "Stockholm, SE"   }, items: [{ productTitle: "Autumn Leaves — LP",         type: "Vinyl",    image: PIC("autumnleaves"), quantity: 1 }],                                                                           date: "2026-04-13", total: 30,  status: "delivered"  },
  { id: "22", number: "#1037", customer: { name: "Kofi Mensah",       location: "Kumasi, GH"      }, items: [{ productTitle: "Wax Seal Sticker Set",        type: "Other",    image: PIC("stickers"),     quantity: 2 }],                                                                           date: "2026-04-10", total: 16,  status: "delivered"  },
  { id: "23", number: "#1036", customer: { name: "Mei-Ling Chen",     location: "Taipei, TW"      }, items: [{ productTitle: "Kind of Blue — Cassette",    type: "Cassette", image: PIC("kobcassette"),  quantity: 1 }, { productTitle: "Blue Note Enamel Pin",    type: "Other",    image: PIC("bluenote"),    quantity: 1 }], date: "2026-04-07", total: 22,  status: "delivered"  },

  // ── Refunded / cancelled: scattered through history ─────────────
  { id: "24", number: "#1035", customer: { name: "Dmitri Sokolov",    location: "Moscow, RU"      }, items: [{ productTitle: "Giant Steps — LP",           type: "Vinyl",    image: PIC("giantsteps"),   quantity: 1 }],                                                                           date: "2026-04-04", total: 36,  status: "refunded"   },
  { id: "25", number: "#1034", customer: { name: "Valentina Cruz",    location: "Mexico City, MX" }, items: [{ productTitle: "Jazz Club Tote Bag",          type: "Other",    image: PIC("totebag"),      quantity: 1 }, { productTitle: "Bebop Dad Hat",           type: "Apparel",  image: PIC("dadhat"),      quantity: 1 }], date: "2026-04-01", total: 50,  status: "delivered"  },
  { id: "26", number: "#1033", customer: { name: "Emre Yılmaz",       location: "Istanbul, TR"    }, items: [{ productTitle: "Maiden Voyage — LP",         type: "Vinyl",    image: PIC("maidenvoyage"), quantity: 1 }],                                                                           date: "2026-03-29", total: 30,  status: "delivered"  },
  { id: "27", number: "#1032", customer: { name: "Aiko Yamamoto",     location: "Kyoto, JP"       }, items: [{ productTitle: "Embroidered Jazz Patch",      type: "Other",    image: PIC("patch"),        quantity: 3 }, { productTitle: "Canvas Tote — City Lights", type: "Other", image: PIC("canvastote"),  quantity: 1 }], date: "2026-03-25", total: 55,  status: "cancelled"  },
  { id: "28", number: "#1031", customer: { name: "Sven Eriksson",     location: "Gothenburg, SE"  }, items: [{ productTitle: "Mingus Ah Um — LP",          type: "Vinyl",    image: PIC("mingus"),       quantity: 1 }],                                                                           date: "2026-03-21", total: 32,  status: "delivered"  },
  { id: "29", number: "#1030", customer: { name: "Chiara Bianchi",    location: "Milan, IT"       }, items: [{ productTitle: "Blue Train — LP",            type: "Vinyl",    image: PIC("bluetrain"),    quantity: 1 }, { productTitle: "Modal Moods",             type: "CD",       image: PIC("modalmoods"),  quantity: 1 }], date: "2026-03-18", total: 49,  status: "refunded"   },
  { id: "30", number: "#1029", customer: { name: "Fatou Diallo",      location: "Conakry, GN"     }, items: [{ productTitle: "Night Cap",                  type: "Apparel",  image: PIC("nightcap"),     quantity: 1 }, { productTitle: "Muza Jazz Scarf",         type: "Apparel",  image: PIC("scarf"),       quantity: 1 }], date: "2026-03-14", total: 57,  status: "delivered"  },
]

// ─── Aggregated stats ─────────────────────────────────────────────────────────

export const ORDER_STATS = {
  count:   ORDERS.length,
  revenue: ORDERS.filter(o => o.status !== "cancelled" && o.status !== "refunded")
                 .reduce((s, o) => s + o.total, 0),
}

// ─── Status config ────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  // Deep-red FILL — a signal flare, not a subtle outline. Action required.
  payment_failed: { label: "Payment failed", className: "bg-destructive text-destructive-foreground border-destructive" },
  // Light mode: pale tint + dark text (always passes contrast).
  // Dark mode: translucent mid-tone tint (`/15`) + bright `-200` text +
  // visible accent border (`/30`). Hits AA contrast on dark backgrounds —
  // the previous `text-X-300` on `bg-X-950/60` was too dim to read.
  new:       { label: "New",       className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:border-blue-500/30" },
  shipped:   { label: "Shipped",   className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/30" },
  delivered: { label: "Delivered", className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-200 dark:border-green-500/30" },
  refunded:  { label: "Refunded",  className: "bg-muted text-muted-foreground border-border" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-200 dark:border-red-500/30" },
}

const ALL_STATUSES: OrderStatus[] = ["payment_failed", "new", "shipped", "delivered", "refunded", "cancelled"]

const ALL_PRODUCT_TYPES: ProductType[] = ["Vinyl", "CD", "Cassette", "Apparel", "Other"]

const ALL_PRODUCTS: string[] = Array.from(
  new Set(ORDERS.flatMap(o => o.items.map(i => i.productTitle)))
).sort()

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  })
}

export function formatTotal(n: number) {
  // Always 2 decimals so partial refunds / tax don't render as "$73.2".
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function sortOrders(orders: Order[], key: SortKey, dir: SortDir, statuses: Record<string, OrderStatus>): Order[] {
  return [...orders].sort((a, b) => {
    // Payment-failed orders always float to the top — they need action and
    // shouldn't get buried by date-sorted history.
    const aFailed = (statuses[a.id] ?? a.status) === "payment_failed"
    const bFailed = (statuses[b.id] ?? b.status) === "payment_failed"
    if (aFailed !== bFailed) return aFailed ? -1 : 1

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
//
// Two modes:
//   · Read-only — `<OrderStatusBadge status={s} />` — used in the row table.
//   · Interactive — pass `onStatusChange` and the badge becomes a dropdown
//     trigger. The artist can flip between sensible transitions in place,
//     so accidents (e.g. mis-clicking "Mark as delivered") are reversible
//     with one tap on the same control.
//
// Available transitions per state are derived from the order lifecycle.
// `payment_failed` and `refunded` aren't user-pickable here — they happen
// via dedicated workflows (Retry capture / Refund flow).

// Forward-only routine transitions for the row's status badge. Cancel
// is intentionally omitted — it's destructive (triggers refund + buyer
// email), warrants a reason, and lives in the confirmation flows
// instead: the per-order detail page, the bulk-actions panel, and the
// failed-payment "needs your attention" row.
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new:            ["new", "shipped"],
  shipped:        ["new", "shipped", "delivered"],
  delivered:      ["shipped", "delivered"],
  cancelled:      ["cancelled"],
  refunded:       ["refunded"],
  payment_failed: ["payment_failed"],
}

export function OrderStatusBadge({
  status, onStatusChange, className,
}: {
  status: OrderStatus
  onStatusChange?: (next: OrderStatus) => void
  className?: string
}) {
  const cfg = STATUS_CONFIG[status]
  const transitions = ALLOWED_TRANSITIONS[status]
  // Read-only render when no handler or only the current status is allowed.
  if (!onStatusChange || transitions.length <= 1) {
    return <Badge className={cn(cfg.className, className)}>{cfg.label}</Badge>
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          // Mirror the Badge primitive's shape but make it tappable. The
          // chevron signals "this is interactive".
          "inline-flex w-fit shrink-0 items-center gap-1 rounded-sm border",
          "pt-[4px] pb-[6px] pl-[6px] pr-[4px] text-2xsmall font-normal leading-none whitespace-nowrap",
          "transition-colors cursor-pointer outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring/50",
          cfg.className,
          "hover:opacity-90",
          className,
        )}
      >
        {cfg.label}
        <ChevronDown className="size-3 opacity-80 transition-transform duration-200 [[aria-expanded=true]_&]:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {transitions.map(s => (
          <DropdownMenuItem
            key={s}
            onClick={() => onStatusChange(s)}
            className={cn(s === status && "bg-accent")}
          >
            <Badge className={cn(STATUS_CONFIG[s].className, "shrink-0")}>{STATUS_CONFIG[s].label}</Badge>
            {s === status && <span className="text-2xsmall text-muted-foreground ml-1">current</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Filter primitives ────────────────────────────────────────────────────────

function FilterClearAll({ onClear }: { onClear: () => void }) {
  return (
    <>
      <div className="-mx-1 my-1 h-px bg-border" />
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onClear() }}
        className="flex w-full items-center justify-center rounded-lg px-2.5 py-1.5 text-xsmall text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
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
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xsmall text-foreground hover:bg-accent transition-colors cursor-default select-none"
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
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xsmall text-foreground hover:bg-accent transition-colors cursor-default select-none"
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
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xsmall text-foreground hover:bg-accent transition-colors cursor-default select-none"
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
  // Customer column trimmed from 160 → 132 — longest name+location
  // pair fits in ~120px at text-xsmall, so 160 left a yawning gap
  // between the customer cell content and the next column.
  customer: 132,
  image:    44,
  product:  160,
  date:     96,
  total:    72,
  // Status column has to fit the widest case across BOTH tables:
  //  · Main table — interactive `OrderStatusBadge` ("Payment failed"
  //    pill + dropdown chevron).
  //  · Failed-payment table — Retry button + Cancel button side by
  //    side. That's the wider case (~192px including cell padding),
  //    so the column gets sized for it. Width stays in sync between
  //    tables so the Status header aligns visually when both render.
  status:   192,
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

// ─── OrderRow ─────────────────────────────────────────────────────────────────

// ─── FailedOrderRow ──────────────────────────────────────────────────────────
//
// Same column structure as the main `OrderRow`, but the Status slot holds a
// per-row Retry capture button instead of a status badge. Selection state
// shares the main ledger's `selectedIds` so the bottom bulk bar can offer
// `Retry capture (N)` when failed orders are checked.

function FailedOrderRow({
  order, isSelected, onSelect, visibleCols, onOpen, onCancel,
}: {
  order:       Order
  isSelected:  boolean
  onSelect:    () => void
  visibleCols: Record<ColKey, boolean>
  onOpen:      () => void
  /** Invoked when the seller wants to give up on this order after
   *  retries — routes to the standard bulk Cancel confirmation flow
   *  scoped to this single order. */
  onCancel:    () => void
}) {
  const first         = order.items[0]
  const extra         = order.items.length - 1
  const [hovered, setHovered] = useState(false)
  const { add }       = useToast()

  return (
    <tr
      className={cn(
        "border-b border-border/60 last:border-b-0 transition-colors cursor-pointer",
        hovered || isSelected ? "bg-muted" : "bg-transparent",
      )}
      style={{ height: 56 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onOpen}
    >
      {/* Bulk select */}
      <td className="w-10 px-2 py-0" onClick={(e) => e.stopPropagation()}>
        <div className={cn(
          "flex items-center justify-center transition-opacity",
          hovered || isSelected ? "opacity-100" : "opacity-0 pointer-events-none",
        )}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            onClick={(e) => e.stopPropagation()}
            className="after:hidden"
          />
        </div>
      </td>

      {/* Order # */}
      <td className="px-4 py-0 text-xsmall font-normal text-muted-foreground tabular-nums">
        {order.number}
      </td>

      {/* Customer — name + location, same as main table. Email lives on
           the order detail page, not in the ledger row. */}
      <td className="px-4 py-0">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-xsmall font-normal text-foreground truncate">{order.customer.name}</span>
          <span className="text-2xsmall text-muted-foreground truncate">{order.customer.location}</span>
        </div>
      </td>

      {/* Image (optional, mirrors main table) */}
      <td className={cn("px-2 py-0", !visibleCols.image && "hidden")}>
        <div className="rounded-xs bg-neutral-200 overflow-hidden" style={{ width: 44, height: 44 }}>
          <img src={first.image} alt={first.productTitle} className="size-full object-cover" draggable={false} />
        </div>
      </td>

      {/* Product */}
      <td className="px-4 py-0">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-xsmall font-normal text-foreground truncate">
            {first.productTitle}{first.quantity > 1 && ` ×${first.quantity}`}
          </span>
          {extra > 0 && (
            <span className="text-2xsmall text-muted-foreground">+{extra} more</span>
          )}
        </div>
      </td>

      {/* Date */}
      <td className={cn("px-4 py-0 text-xsmall font-normal text-muted-foreground tabular-nums whitespace-nowrap", !visibleCols.date && "hidden")}>
        {formatDate(order.date)}
      </td>

      {/* Total */}
      <td className={cn("px-4 py-0 text-xsmall font-normal text-foreground tabular-nums", !visibleCols.total && "hidden")}>
        {formatTotal(order.total)}
      </td>

      {/* Status slot — Retry capture (forward action) + Cancel
           (terminal action). Both are scoped to this single row.
           Cancel routes to the bulk Cancel dialog so the confirmation,
           buyer-notify toggle, and toast undo are consistent with the
           multi-select flow.
           `justify-end` so the right edge of Cancel lines up with the
           right edge of the right-aligned Status badge in the main
           table below. */}
      <td className="px-4 py-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-muted-foreground hover:text-destructive">
            <Ban className="size-3.5" />
            Cancel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              add({
                title: "Retrying capture via pay.com…",
                description: `${order.number} · ${formatTotal(order.total)}`,
                type: "loading",
              })
            }}
          >
            <RotateCcw className="size-3.5" />
            Retry
          </Button>
        </div>
      </td>

    </tr>
  )
}

function OrderRow({ order, isSelected, onSelect, status, onStatusChange, visibleCols, onOpen }: {
  order:          Order
  isSelected:     boolean
  onSelect:       () => void
  status:         OrderStatus
  onStatusChange: (s: OrderStatus) => void
  visibleCols:    Record<ColKey, boolean>
  onOpen:         () => void
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
      onClick={onOpen}
    >
      {/* Checkbox */}
      <td className="w-10 px-2 py-0" onClick={(e) => e.stopPropagation()}>
        <div className={cn("flex items-center justify-center transition-opacity", hovered || isSelected ? "opacity-100" : "opacity-0 pointer-events-none")}>
          <Checkbox checked={isSelected} onCheckedChange={onSelect} onClick={e => e.stopPropagation()} className="after:hidden" />
        </div>
      </td>

      {/* Order number */}
      <td className="px-4 py-0 text-xsmall font-normal text-muted-foreground tabular-nums">
        {order.number}
      </td>

      {/* Customer */}
      <td className="px-4 py-0">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-xsmall font-normal text-foreground truncate">{order.customer.name}</span>
          <span className="text-2xsmall text-muted-foreground truncate">{order.customer.location}</span>
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
          <span className="text-xsmall font-normal text-foreground truncate">
            {first.productTitle}{first.quantity > 1 && ` ×${first.quantity}`}
          </span>
          {extra > 0 && (
            <span className="text-2xsmall text-muted-foreground">+{extra} more</span>
          )}
        </div>
      </td>

      {/* Date */}
      <td className={cn("px-4 py-0 text-xsmall font-normal text-muted-foreground tabular-nums whitespace-nowrap", !visibleCols.date && "hidden")}>
        {formatDate(order.date)}
      </td>

      {/* Total */}
      <td className={cn("px-4 py-0 text-xsmall font-normal text-foreground tabular-nums", !visibleCols.total && "hidden")}>
        {formatTotal(order.total)}
      </td>

      {/* Status */}
      {/* Status badge is the interactive trigger for status changes —
           clicking it opens a dropdown of available transitions. The
           kebab/⋯ action column used to mirror these options but it's
           dead weight when the badge already does the job.
           Right-aligned to line up with the Cancel button in the
           failed-payment table above. Bumped right padding because the
           badge has tighter internal padding (~6px) than the Button
           sm variant (~12px); without the extra cell padding the badge
           sat 6px further right than the Cancel button's text. */}
      <td
        className={cn("pl-4 pr-[22px] py-0 text-right", !visibleCols.status && "hidden")}
        onClick={(e) => e.stopPropagation()}
      >
        <OrderStatusBadge status={status} onStatusChange={onStatusChange} />
      </td>
    </tr>
  )
}

// ─── Bulk actions config ─────────────────────────────────────────────────────
//
// One row per possible bulk action. The bulk bar iterates this list, asks
// each entry which selected orders are eligible, and renders a labelled
// button only when ≥1 order qualifies. Adding a new bulk action means
// appending one entry here — UI + dialog wiring is automatic.

type BulkActionKey = "shipped" | "delivered" | "cancelled" | "retry"

interface BulkActionConfig {
  key:           BulkActionKey
  label:         string
  icon:          React.ReactNode
  destructive?:  boolean
  /** Source-status filter: which statuses can transition via this action. */
  isEligible:    (status: OrderStatus) => boolean
  /** Status the order ends up in after the action runs. */
  targetStatus:  OrderStatus
  /** Buyer email type to fire alongside the status change. */
  emailType:     OrderEmailType
  /** Default state of the notification toggle in the dialog. */
  notifyDefault: boolean
  /** When false, the dialog hides the notify toggle entirely. Use for
   *  actions where the email is a *consequence* of the action's outcome
   *  (e.g. retry capture — confirmation only fires IF the retry
   *  succeeds), not a decision the artist needs to make up front. */
  showNotifyToggle?: boolean
  /** Confirm-button copy builder ({n} = eligible count placeholder). */
  buildConfirmLabel: (count: number) => string
  /** Past-tense verb for the success toast. */
  pastTense:     string
  /** Reason caption shown next to a skipped order in the dialog list. */
  skipReason:    (status: OrderStatus) => string
}

const BULK_ACTIONS: BulkActionConfig[] = [
  {
    key:   "shipped",
    label: "Mark shipped",
    icon:  <Truck className="size-3.5" />,
    isEligible:    s => s === "new",
    targetStatus:  "shipped",
    emailType:     "shipping_notification",
    notifyDefault: true,
    buildConfirmLabel: n => `Mark shipped & notify {n} ${n === 1 ? "buyer" : "buyers"}`,
    pastTense:    "shipped",
    skipReason:   s =>
      s === "shipped"        ? "already shipped"
      : s === "delivered"    ? "delivered"
      : s === "refunded"     ? "refunded"
      : s === "cancelled"    ? "cancelled"
      : s === "payment_failed" ? "payment failed"
      : "—",
  },
  {
    key:   "delivered",
    label: "Mark delivered",
    icon:  <CheckCircle2 className="size-3.5" />,
    isEligible:    s => s === "shipped",
    targetStatus:  "delivered",
    emailType:     "delivery_confirmation",
    notifyDefault: false,  // carrier already notified
    buildConfirmLabel: n => `Mark delivered & notify {n} ${n === 1 ? "buyer" : "buyers"}`,
    pastTense:    "marked delivered",
    skipReason:   s =>
      s === "new"            ? "not yet shipped"
      : s === "delivered"    ? "already delivered"
      : s === "refunded"     ? "refunded"
      : s === "cancelled"    ? "cancelled"
      : s === "payment_failed" ? "payment failed"
      : "—",
  },
  // Refund deliberately omitted — refunds are financial and warrant
  // per-order judgment (partial vs full, reason, which items). Surface
  // refunds via the per-order detail view's RefundFlow instead, never
  // as a bulk action.
  {
    key:   "retry",
    label: "Retry capture",
    icon:  <RotateCcw className="size-3.5" />,
    isEligible:    s => s === "payment_failed",
    targetStatus:  "new",
    // Order-confirmation email auto-fires IF the retry succeeds —
    // not a decision the artist makes at retry time, so the toggle
    // is hidden via `showNotifyToggle: false`.
    emailType:     "order_confirmation",
    notifyDefault: true,
    showNotifyToggle: false,
    buildConfirmLabel: n => `Retry capture for {n} ${n === 1 ? "order" : "orders"}`,
    pastTense:    "captured",
    skipReason:   s => s !== "payment_failed" ? "payment didn't fail" : "—",
  },
  {
    key:   "cancelled",
    label: "Cancel",
    icon:  <Ban className="size-3.5" />,
    destructive:   true,
    // Cancel applies to both `new` (paid, refund auto-fires) and
    // `payment_failed` (capture never succeeded, nothing to refund —
    // just mark dead after retries are exhausted). The buyer email
    // body branches on which source it came from (see order-emails).
    isEligible:    s => s === "new" || s === "payment_failed",
    targetStatus:  "cancelled",
    emailType:     "order_cancelled",
    notifyDefault: true,
    buildConfirmLabel: n => `Cancel & notify {n} ${n === 1 ? "buyer" : "buyers"}`,
    pastTense:    "cancelled",
    skipReason:   s =>
      s === "shipped"     ? "already shipped"
      : s === "delivered" ? "delivered"
      : s === "refunded"  ? "refunded"
      : s === "cancelled" ? "already cancelled"
      : "—",
  },
]

// ─── OrdersView ───────────────────────────────────────────────────────────────

export function OrdersView() {
  const [params, setParams] = useSearchParams()
  const orderIdFromUrl      = params.get("order")

  const [visibleCols,   setVisibleCols]   = useState<Record<ColKey, boolean>>({ ...DEFAULT_VISIBLE })
  // Status state is owned by ShopSettingsProvider so the Orders-tab
  // badge (above us in the tree) can decrement live when an order
  // flips out of `new`. Reading + writing both go through context.
  const { orderStatuses: statuses, setOrderStatus } = useShopSettings()
  const [statusFilters,      setStatusFilters]      = useState<Set<OrderStatus>>(new Set())
  const [productFilters,     setProductFilters]     = useState<Set<string>>(new Set())
  const [productTypeFilters, setProductTypeFilters] = useState<Set<ProductType>>(new Set())
  const [searchQuery,        setSearchQuery]        = useState("")
  const [sortKey,       setSortKey]       = useState<SortKey>("date")
  const [sortDir,       setSortDir]       = useState<SortDir>("desc")
  const [selectedIds,   setSelectedIds]   = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState<BulkActionKey | null>(null)
  const { add: bulkToast } = useToast()

  function toggleCol(key: ColKey) {
    const def = COL_DEFS.find(d => d.key === key)
    if (def?.required) return
    setVisibleCols(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const isColsModified = COL_DEFS.some(({ key }) => visibleCols[key] !== DEFAULT_VISIBLE[key])

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
    statuses,
  )

  const anyFilter    = statusFilters.size > 0 || productFilters.size > 0 || productTypeFilters.size > 0 || q.length > 0
  // Payment-failed orders are TODOs, not transactions — surfaced in a small
  // "needs your attention" panel above the main table rather than mixed into
  // the row stream. The table below shows everything else. Panel can be
  // collapsed (chevron in the header) once acknowledged.
  const failedFiltered = filtered.filter(o => (statuses[o.id] ?? o.status) === "payment_failed")
  const otherFiltered  = filtered.filter(o => (statuses[o.id] ?? o.status) !== "payment_failed")
  const [attentionCollapsed, setAttentionCollapsed] = useState(false)
  const allSelected  = filtered.length > 0 && filtered.every(o => selectedIds.has(o.id))
  const someSelected = filtered.some(o => selectedIds.has(o.id))

  function toggleSelectAll() {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(filtered.map(o => o.id)))
  }

  // ── Detail-view URL routing ─────────────────────────────────────────
  // `?order=<id>` opens the full detail page; absent → list view. Prev /
  // Next walk the currently filtered+sorted list so they respect the
  // user's filters (the same set they were just looking at).
  function openOrder(id: string)   { setParams(p => { const n = new URLSearchParams(p); n.set("order", id);    return n }) }
  function closeOrder()            { setParams(p => { const n = new URLSearchParams(p); n.delete("order");      return n }) }
  function goToOrderRelative(d: 1 | -1, id: string) {
    const idx = filtered.findIndex(o => o.id === id)
    if (idx === -1) return
    const next = filtered[idx + d]
    if (next) openOrder(next.id)
  }
  const activeOrder = orderIdFromUrl ? ORDERS.find(o => o.id === orderIdFromUrl) : null
  if (activeOrder) {
    const idx     = filtered.findIndex(o => o.id === activeOrder.id)
    const status  = statuses[activeOrder.id] ?? activeOrder.status
    return (
      <OrderDetailView
        order={activeOrder}
        status={status}
        onBack={closeOrder}
        onPrev={idx > 0 ? () => goToOrderRelative(-1, activeOrder.id) : null}
        onNext={idx >= 0 && idx < filtered.length - 1 ? () => goToOrderRelative(1, activeOrder.id) : null}
        onStatusChange={(s) => setOrderStatus(activeOrder.id, s)}
      />
    )
  }

  return (
    <div className="relative flex flex-col h-full">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between gap-6 px-10 pt-8 pb-6">
        <div>
          <h1 className="text-2xlarge font-medium tracking-tight text-balance">Orders</h1>
          <p className="text-small font-normal text-muted-foreground mt-1">
            {ORDER_STATS.count} orders · ${ORDER_STATS.revenue.toLocaleString()} revenue
          </p>
        </div>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-3 px-10 pb-8">
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
              "h-10 pl-10 pr-[18px] rounded-full border text-small font-normal bg-transparent transition-[colors,width,background-color]",
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
                    className={cn("text-foreground text-xsmall", required && "opacity-40 pointer-events-none")}
                  >
                    <Checkbox
                      checked={visibleCols[key]}
                      onCheckedChange={() => {}}
                      tabIndex={-1}
                      className="pointer-events-none shrink-0 after:hidden"
                    />
                    {label}
                    {required && <span className="ml-auto text-2xsmall text-muted-foreground">required</span>}
                  </DropdownMenuItem>
                ))}
                {isColsModified && (
                  <>
                    <div className="-mx-1 my-1 h-px bg-border" />
                    <button
                      type="button"
                      onClick={() => setVisibleCols({ ...DEFAULT_VISIBLE })}
                      className="flex w-full items-center justify-center rounded-lg px-2.5 py-1.5 text-xsmall text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
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
        <div className="shrink-0 flex items-center gap-1.5 px-10 pb-3 flex-wrap">
          <button
            onClick={() => { setStatusFilters(new Set()); setProductFilters(new Set()); setProductTypeFilters(new Set()); setSearchQuery("") }}
            className="text-xsmall font-normal text-muted-foreground hover:text-foreground transition-colors mr-1 shrink-0"
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
      <div className="flex-1 overflow-auto px-10">

        {/* ── Needs-your-attention panel ───────────────────────────────────
             Failed payments live here, ABOVE the regular ledger. They're
             TODOs, not transaction history — surfacing them as their own
             zone makes the mental model explicit. The main table only shows
             non-failed orders; clicking a row opens the same detail page. */}
        {failedFiltered.length > 0 && (
          // Neutral panel chrome — only the alert-triangle icon carries the
          // destructive color. The signal flare is the icon itself plus the
          // deep-red Payment-failed status badges in the main table below.
          // Painting the whole panel red overshot the actual severity
          // (these are recoverable TODOs, not catastrophes).
          <div className="mb-6 rounded-xl border border-border bg-muted/40 overflow-hidden">
            <button
              type="button"
              onClick={() => setAttentionCollapsed(c => !c)}
              aria-expanded={!attentionCollapsed}
              className={cn(
                "w-full flex items-center gap-2 px-4 pt-3 pb-3 text-left transition-colors hover:bg-muted",
                !attentionCollapsed && "border-b border-border/60",
              )}
            >
              <AlertTriangle className="size-4 text-destructive shrink-0" />
              <span className="text-small text-foreground flex-1">
                <span className="font-medium">
                  {failedFiltered.length} {failedFiltered.length === 1 ? "order needs" : "orders need"} your attention
                </span>
                <span className="text-muted-foreground"> · card declined, awaiting payment update</span>
              </span>
              <ChevronDown
                className={cn(
                  "size-4 text-muted-foreground shrink-0 transition-transform",
                  attentionCollapsed && "-rotate-90",
                )}
              />
            </button>
            {!attentionCollapsed && (() => {
              // Shared `selectedIds` — failed orders contribute to the
                // same selection set as main-table orders. The bottom bulk
                // bar shows `Retry capture (N)` automatically (the action's
                // `isEligible: payment_failed` filter handles eligibility).
              const allFailedSelected = failedFiltered.length > 0 && failedFiltered.every(o => selectedIds.has(o.id))
              const someFailedSelected = failedFiltered.some(o => selectedIds.has(o.id))
              const toggleAllFailed = () => {
                setSelectedIds(prev => {
                  const next = new Set(prev)
                  if (allFailedSelected) failedFiltered.forEach(o => next.delete(o.id))
                  else                   failedFiltered.forEach(o => next.add(o.id))
                  return next
                })
              }
              const toggleFailed = (id: string) => {
                setSelectedIds(prev => {
                  const next = new Set(prev)
                  if (next.has(id)) next.delete(id)
                  else next.add(id)
                  return next
                })
              }
              return (
                // Real <table> matching the main ledger's column structure
                // exactly — same widths via COL.*, same hidden-by-default
                // Image column slot, same Status+Actions slot pair on the
                // right (Status holds the per-row Retry button; Actions
                // stays empty as a placeholder so columns line up).
                <table className="w-full table-fixed">
                  <thead className="bg-transparent [&_tr]:border-b [&_tr]:border-border/60">
                    <tr>
                      <TableHead resizable={false} className="w-10 px-2">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={allFailedSelected}
                            indeterminate={!allFailedSelected && someFailedSelected}
                            onCheckedChange={toggleAllFailed}
                            className="after:hidden"
                          />
                        </div>
                      </TableHead>
                      <TableHead style={{ width: COL.number }}>Order</TableHead>
                      <TableHead style={{ width: COL.customer }}>Customer</TableHead>
                      <TableHead resizable={false} className={cn("px-2", !visibleCols.image && "hidden")} style={{ width: COL.image }} />
                      <TableHead style={{ width: COL.product }}>Product</TableHead>
                      <TableHead className={cn(!visibleCols.date && "hidden")} style={{ width: COL.date }}>Date</TableHead>
                      <TableHead className={cn(!visibleCols.total && "hidden")} style={{ width: COL.total }}>Total</TableHead>
                      {/* Last column hosts Retry + Cancel — actions,
                           not a status badge. Header left unlabelled
                           so we don't mislabel an action column as
                           "Status". The column width is in sync with
                           the main table's Status column, so the
                           Status badge below lines up vertically with
                           the Cancel button above. */}
                      <TableHead style={{ width: COL.status }} />
                    </tr>
                  </thead>
                  <tbody>
                    {failedFiltered.map(order => (
                      <FailedOrderRow
                        key={order.id}
                        order={order}
                        isSelected={selectedIds.has(order.id)}
                        onSelect={() => toggleFailed(order.id)}
                        visibleCols={visibleCols}
                        onOpen={() => openOrder(order.id)}
                        onCancel={() => {
                          // Scope the bulk-cancel dialog to this single
                          // order — replaces any existing selection so
                          // the confirmation lists only this one row.
                          setSelectedIds(new Set([order.id]))
                          setBulkAction("cancelled")
                        }}
                      />
                    ))}
                  </tbody>
                </table>
              )
            })()}
          </div>
        )}

        <table className="w-full table-fixed">

          {/* Sticky header */}
          <thead className="sticky top-0 z-10 bg-background [&_tr]:border-b [&_tr]:border-border [&_tr]:hover:bg-transparent">
            <tr>
              <TableHead resizable={false} className="w-10 px-2">
                <div className="flex items-center justify-center">
                  <Checkbox checked={allSelected} indeterminate={!allSelected && someSelected} onCheckedChange={toggleSelectAll} className="after:hidden" />
                </div>
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
              <TableHead
                className={cn(!visibleCols.status && "hidden")}
                style={{ width: COL.status, textAlign: "right", paddingRight: 22 }}
              >
                Status
              </TableHead>
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
                      <p className="text-small font-medium text-foreground">No orders found</p>
                      <p className="text-small text-muted-foreground">
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
              {otherFiltered.map(order => (
                <OrderRow
                  key={order.id}
                  order={order}
                  isSelected={selectedIds.has(order.id)}
                  onSelect={() => toggleSelect(order.id)}
                  status={statuses[order.id] ?? order.status}
                  onStatusChange={s => setOrderStatus(order.id, s)}
                  visibleCols={visibleCols}
                  onOpen={() => openOrder(order.id)}
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
            <span className="text-small font-medium text-background tabular-nums pr-2 whitespace-nowrap">
              {selectedIds.size} selected
            </span>
            <div className="w-px h-5 bg-background/20" />
            {/* Render every action whose eligible-count > 0 against the
                 current selection. Buttons show their count inline so the
                 artist sees the consequence before clicking. Zero-count
                 actions are hidden entirely (less mental load than a row
                 of greyed-out buttons). */}
            {BULK_ACTIONS.map(action => {
              const eligibleCount = Array.from(selectedIds).filter(id => {
                const cur = statuses[id] ?? ORDERS.find(o => o.id === id)?.status
                return cur ? action.isEligible(cur) : false
              }).length
              if (eligibleCount === 0) return null
              return (
                <Button
                  key={action.key}
                  size="sm"
                  variant="secondary"
                  className="bg-background/15 hover:bg-background/25 text-background border-transparent"
                  onClick={() => setBulkAction(action.key)}
                >
                  {action.icon}
                  {action.label}
                  <span className="text-background/60 tabular-nums">({eligibleCount})</span>
                </Button>
              )
            })}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-1 text-background/50 hover:text-background transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Bulk action confirmation ──────────────────────────────────
           Single dialog for the entire batch — driven by BULK_ACTIONS
           config. The dialog renders the full selected set with eligible
           orders highlighted and ineligible ones (with a reason caption)
           shown beneath, so the artist can verify the breakdown before
           confirming. */}
      {bulkAction && (() => {
        const action = BULK_ACTIONS.find(a => a.key === bulkAction)!
        const selectedOrders = Array.from(selectedIds)
          .map(id => ORDERS.find(o => o.id === id))
          .filter((o): o is Order => Boolean(o))
        const eligibleSet = new Set(
          selectedOrders
            .filter(o => action.isEligible(statuses[o.id] ?? o.status))
            .map(o => o.id),
        )
        const eligibleCount = eligibleSet.size

        return (
          <BulkActionDialog
            open={true}
            onOpenChange={(v) => { if (!v) setBulkAction(null) }}
            orders={selectedOrders}
            eligibleIds={eligibleSet}
            skipReason={(o) => action.skipReason(statuses[o.id] ?? o.status)}
            title={`Change status to ${STATUS_CONFIG[action.targetStatus].label}`}
            confirmLabel={action.buildConfirmLabel(eligibleCount)}
            destructive={action.destructive}
            emailType={action.emailType}
            notifyDefault={action.notifyDefault}
            showNotifyToggle={action.showNotifyToggle ?? true}
            onConfirm={({ notify, eligibleIds }) => {
              eligibleIds.forEach(id => setOrderStatus(id, action.targetStatus))
              setSelectedIds(new Set())
              setBulkAction(null)
              const n = eligibleIds.length
              const showsToggle = action.showNotifyToggle ?? true
              bulkToast({
                type:   "success",
                title:  `${n} ${n === 1 ? "order" : "orders"} ${action.pastTense}`,
                description: showsToggle
                  ? (notify
                      ? `${n} ${n === 1 ? "buyer" : "buyers"} notified by email.`
                      : "No emails sent — buyers were not notified.")
                  : undefined,
              } as never)
            }}
          />
        )
      })()}

    </div>
  )
}
