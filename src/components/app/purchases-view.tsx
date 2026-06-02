"use client"

/*
 * PurchasesView — the buyer's order history, grouped by CHECKOUT.
 *
 * A buyer doesn't remember per-shop fulfillments — they remember the
 * moment they paid. Our cart already groups by shop (because shipping is
 * per-shop), and one checkout creates N separate orders behind the scenes
 * (one per shop). This view rejoins them: the top-level unit is the
 * checkout (a payment moment), and per-shop fulfillments appear as
 * sub-rows inside.
 *
 * Industry pattern: Amazon, Etsy, anywhere multi-vendor checkout exists.
 *
 * Detail view for an individual fulfillment is the next build. Clicking
 * a sub-row currently toasts a placeholder.
 */

import { useState } from "react"
import { useSearchParams } from "react-router"
import { Search, ArrowDownUp, Check, ShoppingBag, CreditCard } from "lucide-react"

import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PurchaseDetailView } from "@/components/app/purchase-detail-view"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ToggleGroup } from "@/components/ui/toggle-group"
import { Toggle } from "@/components/ui/toggle"
import { cn } from "@/lib/utils"
import {
  formatDate, formatTotal,
  type ProductType, type OrderItem,
} from "@/components/app/orders-view"
import {
  OrderStatusBadge, type OrderStatus,
} from "@/components/ui/order-status-badge"

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * One shop's slice of a checkout. The artist sees this in their own Orders
 * view as a single "Order". From the buyer's side it's a sub-row inside
 * the parent checkout.
 */
export interface Fulfillment {
  id:        string
  /** Per-shop order number (the artist's reference). */
  orderNumber: string
  seller:    { name: string; location: string }
  items:     OrderItem[]
  /** Sum of (item price × qty) + shipping for this shop. */
  subtotal:  number
  status:    OrderStatus
  carrier?:        string
  trackingNumber?: string
  trackingUrl?:    string
}

/**
 * One payment moment. May contain multiple per-shop fulfillments when the
 * buyer's cart spanned multiple artists' shops.
 */
export interface Checkout {
  id:           string
  /** Payment reference (distinct from per-shop order numbers). */
  number:       string
  date:         string
  /** Grand total across all fulfillments (the amount actually charged). */
  total:        number
  fulfillments: Fulfillment[]
}

// ─── Mock data ───────────────────────────────────────────────────────────────
//
// 10 checkouts, including 3 multi-shop ones to exercise the grouping
// pattern. Statuses vary across fulfillments — including mixed states
// within a single multi-shop checkout (one shop shipped, another refunded).

const PIC = (seed: string) =>
  `https://picsum.photos/seed/${seed}/80/80`

export const CHECKOUTS: Checkout[] = [
  {
    id: "c01", number: "#M-PMT-1042", date: "2026-05-04", total: 32.00,
    fulfillments: [{
      id: "f01a", orderNumber: "#M-1042",
      seller: { name: "Sun Ra Estate", location: "Birmingham, AL" },
      items: [{ productTitle: "Space Is The Place — Reissue LP", type: "Vinyl", image: PIC("spaceisplace"), quantity: 1 }],
      subtotal: 32.00, status: "shipped",
      carrier: "DHL", trackingNumber: "0014857329", trackingUrl: "https://www.dhl.com/en/express/tracking.html?AWB=0014857329",
    }],
  },

  {
    id: "c02", number: "#M-PMT-1041", date: "2026-05-01", total: 86.00,
    fulfillments: [{
      id: "f02a", orderNumber: "#M-1041",
      seller: { name: "Pharoah Sanders", location: "Brooklyn, NY" },
      items: [{ productTitle: "Karma — 50th Anniversary", type: "Vinyl", image: PIC("karma"), quantity: 2 }],
      subtotal: 86.00, status: "new",
    }],
  },

  // ─── Worst-case: a single shop fulfillment with 10 items ──────────────
  // Exercises the MAX_INLINE_ITEMS overflow path — visible thumbs +
  // titles cap at 3, the remaining 7 collapse into a single "+N more"
  // caption so the card stays compact regardless of order size.
  {
    id: "c11", number: "#M-PMT-1044", date: "2026-04-30", total: 218.00,
    fulfillments: [{
      id: "f11a", orderNumber: "#M-1044",
      seller: { name: "Sun Ra Estate", location: "Birmingham, AL" },
      items: [
        { productTitle: "Space Is The Place — Reissue LP",  type: "Vinyl",    image: PIC("spaceisplace2"),  quantity: 1 },
        { productTitle: "Lanquidity — Audiophile LP",        type: "Vinyl",    image: PIC("lanquidityLP"),   quantity: 1 },
        { productTitle: "Atlantis — LP",                     type: "Vinyl",    image: PIC("atlantisLP"),     quantity: 1 },
        { productTitle: "Discipline 27-II — Cassette",       type: "Cassette", image: PIC("disciplineCas"),  quantity: 1 },
        { productTitle: "Solar Myth — CD",                   type: "CD",       image: PIC("solarmyth"),      quantity: 1 },
        { productTitle: "Lanquidity Tour Tee",               type: "Apparel",  image: PIC("lanquiditytee2"), quantity: 2 },
        { productTitle: "Sun Ra Patch Set",                  type: "Other",    image: PIC("patchset"),       quantity: 1 },
        { productTitle: "Cosmic Equation Poster",            type: "Other",    image: PIC("cosmicposter"),   quantity: 1 },
        { productTitle: "Tour Programme — 1972",             type: "Other",    image: PIC("tourprog"),       quantity: 1 },
        { productTitle: "Enamel Pin — Saturn",               type: "Other",    image: PIC("saturnpin"),      quantity: 1 },
      ],
      subtotal: 218.00, status: "shipped",
      carrier: "DHL", trackingNumber: "0014870421", trackingUrl: "https://www.dhl.com/en/express/tracking.html?AWB=0014870421",
    }],
  },

  // ─── Multi-shop checkout (3 shops) ──────────────────────────────────
  {
    id: "c03", number: "#M-PMT-1039", date: "2026-04-28", total: 100.00,
    fulfillments: [
      {
        id: "f03a", orderNumber: "#M-1039",
        seller: { name: "Alice Coltrane Trust", location: "Los Angeles, CA" },
        items: [
          { productTitle: "Journey in Satchidananda — LP", type: "Vinyl", image: PIC("satchidananda"), quantity: 1 },
          { productTitle: "Liner Notes Booklet",           type: "Other", image: PIC("booklet"),       quantity: 1 },
        ],
        subtotal: 52.00, status: "delivered",
        carrier: "USPS", trackingNumber: "9400111202555000000000",
      },
      {
        id: "f03b", orderNumber: "#M-1040",
        seller: { name: "Yusef Lateef Reissues", location: "Detroit, MI" },
        items: [{ productTitle: "Eastern Sounds — Cassette", type: "Cassette", image: PIC("easternsounds"), quantity: 1 }],
        subtotal: 16.00, status: "delivered",
      },
      {
        id: "f03c", orderNumber: "#M-1043",
        seller: { name: "Sun Ra Estate", location: "Birmingham, AL" },
        items: [{ productTitle: "Lanquidity Tour Tee", type: "Apparel", image: PIC("lanquiditytee"), quantity: 1 }],
        subtotal: 32.00, status: "shipped",
        carrier: "DHL", trackingNumber: "0014991020", trackingUrl: "https://www.dhl.com/en/express/tracking.html?AWB=0014991020",
      },
    ],
  },

  {
    id: "c04", number: "#M-PMT-1036", date: "2026-04-22", total: 38.00,
    fulfillments: [{
      id: "f04a", orderNumber: "#M-1036",
      seller: { name: "Don Cherry Family", location: "Tågarp, SE" },
      items: [{ productTitle: "Brown Rice — LP", type: "Vinyl", image: PIC("brownrice"), quantity: 1 }],
      subtotal: 38.00, status: "payment_failed",
    }],
  },

  {
    id: "c05", number: "#M-PMT-1034", date: "2026-04-19", total: 10.00,
    fulfillments: [{
      id: "f05a", orderNumber: "#M-1034",
      seller: { name: "Pharoah Sanders", location: "Brooklyn, NY" },
      items: [{ productTitle: "Live in San Francisco — Digital", type: "Other", image: PIC("livesf"), quantity: 1 }],
      subtotal: 10.00, status: "delivered",
    }],
  },

  // ─── Multi-shop checkout with MIXED statuses (1 refunded, 1 delivered) ─
  {
    id: "c06", number: "#M-PMT-1025", date: "2026-03-30", total: 59.00,
    fulfillments: [
      {
        id: "f06a", orderNumber: "#M-1025",
        seller: { name: "River Lotus", location: "Lagos, NG" },
        items: [{ productTitle: "Blue Afternoon — Limited Edition", type: "Vinyl", image: PIC("blueafternoon"), quantity: 1 }],
        subtotal: 45.00, status: "refunded",
      },
      {
        id: "f06b", orderNumber: "#M-1026",
        seller: { name: "Axon Fade", location: "Berlin, DE" },
        items: [{ productTitle: "Midnight Circuit — Cassette", type: "Cassette", image: PIC("midnightcircuit"), quantity: 1 }],
        subtotal: 14.00, status: "delivered",
      },
    ],
  },

  {
    id: "c07", number: "#M-PMT-1018", date: "2026-03-09", total: 36.00,
    fulfillments: [{
      id: "f07a", orderNumber: "#M-1018",
      seller: { name: "Dusk Ensemble", location: "Reykjavík, IS" },
      items: [{ productTitle: "Haunt the Waves — LP", type: "Vinyl", image: PIC("hauntwaves"), quantity: 1 }],
      subtotal: 36.00, status: "cancelled",
    }],
  },

  // ─── Multi-shop checkout (2 shops, both delivered) ─────────────────
  {
    id: "c08", number: "#M-PMT-1015", date: "2026-02-26", total: 56.00,
    fulfillments: [
      {
        id: "f08a", orderNumber: "#M-1015",
        seller: { name: "Nora Voss", location: "Stockholm, SE" },
        items: [{ productTitle: "Static Memory — LP", type: "Vinyl", image: PIC("staticmemory"), quantity: 1 }],
        subtotal: 34.00, status: "delivered",
      },
      {
        id: "f08b", orderNumber: "#M-1016",
        seller: { name: "Coastal Rites", location: "Cornwall, UK" },
        items: [
          { productTitle: "Low Tide Prayer — Cassette", type: "Cassette", image: PIC("lowtide"),    quantity: 1 },
          { productTitle: "Enamel Pin",                 type: "Other",    image: PIC("coastalpin"), quantity: 1 },
        ],
        subtotal: 22.00, status: "delivered",
      },
    ],
  },

  {
    id: "c09", number: "#M-PMT-1006", date: "2026-01-30", total: 30.00,
    fulfillments: [{
      id: "f09a", orderNumber: "#M-1006",
      seller: { name: "Sun Ra Estate", location: "Birmingham, AL" },
      items: [{ productTitle: "Discipline 27-II — Vinyl Reissue", type: "Vinyl", image: PIC("discipline"), quantity: 1 }],
      subtotal: 30.00, status: "delivered",
    }],
  },

  {
    id: "c10", number: "#M-PMT-1001", date: "2026-01-12", total: 28.00,
    fulfillments: [{
      id: "f10a", orderNumber: "#M-1001",
      seller: { name: "River Lotus", location: "Lagos, NG" },
      items: [{ productTitle: "Signal Lost — 12\" EP", type: "Vinyl", image: PIC("signallost"), quantity: 1 }],
      subtotal: 28.00, status: "delivered",
    }],
  },
]

// ─── Sort + filter helpers ───────────────────────────────────────────────────

type SortDir = "asc" | "desc"

function sortCheckouts(list: Checkout[], dir: SortDir): Checkout[] {
  const out = [...list]
  out.sort((a, b) => {
    const cmp = a.date.localeCompare(b.date)
    return dir === "asc" ? cmp : -cmp
  })
  return out
}

/** A checkout matches the status filter if ANY of its fulfillments matches. */
function checkoutMatchesStatus(c: Checkout, filter: OrderStatus | "all"): boolean {
  if (filter === "all") return true
  return c.fulfillments.some(f => f.status === filter)
}

function checkoutMatchesSearch(c: Checkout, q: string): boolean {
  if (!q) return true
  const hay = [
    c.number,
    ...c.fulfillments.flatMap(f => [
      f.orderNumber,
      f.seller.name,
      ...f.items.map(i => i.productTitle),
    ]),
  ].join(" ").toLowerCase()
  return hay.includes(q.toLowerCase())
}

// ─── PurchasesView ───────────────────────────────────────────────────────────

export function PurchasesView() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all")
  const [searchQuery,  setSearchQuery]  = useState("")
  const [sortDir,      setSortDir]      = useState<SortDir>("desc")

  const { add: toast } = useToast()
  const [, setParams] = useSearchParams()

  // Empty-state demo flip. The view boots into the first-time-buyer
  // state so we can showcase the empty UI; the "Explore products"
  // button toggles to the real list (instead of leaving the page).
  // In production this would be driven by `CHECKOUTS.length === 0`.
  const [showList, setShowList] = useState(false)

  // Selected fulfillment opens the detail view. Stored as a {checkout,
  // fulfillment} pair because the detail page needs the parent checkout
  // for context (payment date, charge total).
  const [selected, setSelected] = useState<{ checkout: Checkout; fulfillment: Fulfillment } | null>(null)

  const filtered = sortCheckouts(
    CHECKOUTS.filter(c => checkoutMatchesStatus(c, statusFilter) && checkoutMatchesSearch(c, searchQuery)),
    sortDir,
  )

  // ─── Handlers shared with row internals ────────────────────────────
  const handleOpenFulfillment = (checkout: Checkout, fulfillment: Fulfillment) =>
    setSelected({ checkout, fulfillment })

  const handleProductClick = (title: string) => toast({
    type: "info",
    title,
    description: "Product page coming soon.",
  } as never)

  const handleUpdatePayment = (f: Fulfillment) => toast({
    type: "info",
    title: `Update payment · ${f.orderNumber}`,
    description: "Payment-recovery flow coming soon.",
  } as never)

  const handleExplore = () => {
    // Demo: reveal the list. Real app would navigate to the catalog:
    //   setParams(prev => { const n = new URLSearchParams(prev); n.delete("page"); return n }, { replace: true })
    void setParams
    setShowList(true)
  }

  // ─── Detail view ─────────────────────────────────────────────────
  // When a fulfillment row is opened, we swap the entire view body
  // for its detail page. Going back clears the selection and restores
  // the list — including its current filter/search/sort state, which
  // is preserved because it lives on this same component.
  if (selected) {
    return (
      <PurchaseDetailView
        checkout={selected.checkout}
        fulfillment={selected.fulfillment}
        onBack={() => setSelected(null)}
      />
    )
  }

  // ─── First-time buyer empty state ─────────────────────────────────
  // Distinct from the "no rows match your filters" inner empty state:
  // when the buyer has literally never purchased, the toolbar and tabs
  // are noise. Show a single centered prompt that bounces them into
  // the catalog (here: into the list, for demo purposes).
  if (!showList) {
    return (
      <div className="relative flex flex-col h-full">
        <div className="hidden sm:block shrink-0 px-page pt-8 pb-6 border-b border-border/60">
          <h1 className="text-2xlarge font-medium tracking-tight text-balance">Your purchases</h1>
        </div>
        <div className="flex-1 flex items-center justify-center px-page py-16">
          <div className="max-w-[420px] flex flex-col items-center text-center gap-5">
            <div className="size-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <ShoppingBag className="size-6" />
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-large font-medium text-foreground">No purchases yet</p>
              <p className="text-small font-normal text-muted-foreground text-balance">
                Vinyl, cassettes, digital releases — once you buy something, your orders show up here.
              </p>
            </div>
            <Button onClick={handleExplore} className="mt-1">
              Explore products
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col h-full">

      {/* ── Page header — title row + toolbar row, both inside the
           bordered fixed area. The border-b separates the entire header
           (title + tabs + search + sort) from the scrolling card list. */}
      <div className="shrink-0 flex flex-col gap-6 px-page pt-4 sm:pt-8 pb-6 border-b border-border/60">
        {/* Row 1: title (left) + status tabs (right).
             The H1's line-box is taller than the 40px pill, so plain
             `items-center` lands the pill slightly above the headline's
             cap-height midline (the part the eye reads as "centre").
             `mt-2` on the pill nudges it down to sit on that midline —
             the small offset is visual, not structural. */}
        <div className="flex items-center justify-between gap-6">
          {/* Title + live filtered count, inline. The count reflects
               the *currently visible* set (status filter + search),
               not the raw total. Top-aligned with the H1's line-box so
               the caption sits up by the cap-line — baseline-alignment
               dropped it below the headline's optical centre. */}
          <div className="flex items-start gap-3 min-w-0">
            {/* Mobile header already shows the page name — hide the in-page
                 <h1> there to avoid a redundant double title. */}
            <h1 className="hidden sm:block text-2xlarge font-medium tracking-tight text-balance">Your purchases</h1>
            <span className="text-small font-normal text-muted-foreground tabular-nums shrink-0 mt-1.5 sm:mt-2">
              {filtered.length} {filtered.length === 1 ? "order" : "orders"}
            </span>
          </div>
          <div className="mt-2 shrink-0">
            <StatusFilter value={statusFilter} onChange={setStatusFilter} />
          </div>
        </div>

        {/* Row 2: search + sort */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center flex-1 min-w-0">
            <Search className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search orders, sellers, products"
              className="h-10 w-full rounded-full border border-border bg-background pl-10 pr-4 text-small font-normal text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors"
            />
          </div>

          <SortControl sortDir={sortDir} onChange={setSortDir} />
        </div>
      </div>

      {/* ── Card list ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto px-page pt-6 pb-12">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <p className="text-small text-muted-foreground">
              No purchases match your filters.
            </p>
            <Button
              variant="outline"
              onClick={() => { setStatusFilter("all"); setSearchQuery("") }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {filtered.map(c => (
              <li key={c.id}>
                <CheckoutCard
                  checkout={c}
                  onOpenFulfillment={(f) => handleOpenFulfillment(c, f)}
                  onProductClick={handleProductClick}
                  onUpdatePayment={handleUpdatePayment}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ─── CheckoutCard ────────────────────────────────────────────────────────────
//
// Top-level card = one checkout (payment moment). Header strip shows date
// + grand total + shop-count caption when there's more than one. Inside,
// one sub-row per fulfillment with its own thumbs · items · seller · status.
// Sub-rows are individually clickable; the card outer is purely chrome.

export function CheckoutCard({ checkout, onOpenFulfillment, onProductClick, onUpdatePayment }: {
  checkout:           Checkout
  onOpenFulfillment:  (f: Fulfillment) => void
  onProductClick:     (title: string) => void
  onUpdatePayment:    (f: Fulfillment) => void
}) {
  const shopCount = checkout.fulfillments.length
  // Payment is checkout-level (one charge per checkout), so if any
  // fulfillment is in payment_failed the whole card surfaces a single
  // recovery CTA up in the header strip — out of the per-row state
  // column where it competed with the status badge.
  const failedFulfillment = checkout.fulfillments.find(f => f.status === "payment_failed")

  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      {/* Header strip — date prominent, grand total + recovery CTA right-aligned. */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border/60 bg-muted/30">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-small text-foreground tabular-nums">
            {formatDate(checkout.date)}
          </span>
          {shopCount > 1 && (
            <span className="text-xsmall text-muted-foreground">
              · {shopCount} shops
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-small font-medium text-foreground tabular-nums">
            {formatTotal(checkout.total)}
          </span>
          {failedFulfillment && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onUpdatePayment(failedFulfillment) }}
            >
              <CreditCard className="size-3.5" />
              Update payment
            </Button>
          )}
        </div>
      </div>

      {/* Sub-rows — one per fulfillment, hairline divider between. */}
      <ul className="flex flex-col divide-y divide-border/60">
        {checkout.fulfillments.map(f => (
          <li key={f.id}>
            <FulfillmentRow
              fulfillment={f}
              onOpen={() => onOpenFulfillment(f)}
              onProductClick={onProductClick}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── FulfillmentRow ──────────────────────────────────────────────────────────
//
// Single-row, three-column layout:
//
//   ┌─────────────────────────────────────────────────────────────────────┐
//   │ Sun Ra Estate          [🎵]   Space Is The Place — LP   ● Shipped   │
//   │ Birmingham · #M-1042                                    $32.00  ↗   │
//   └─────────────────────────────────────────────────────────────────────┘
//
//   ┌─────────────────────────────────────────────────────────────────────┐
//   │ Alice Coltrane Trust   [🎵][📖]  Journey in Satchidananda  ● Deliv. │
//   │ Los Angeles · #M-1039             Liner Notes Booklet     $52.00    │
//   └─────────────────────────────────────────────────────────────────────┘
//
// Shop info (fixed-width column, visual stopper) → thumbs → titles list
// (flex-1, fills middle) → status + subtotal (fixed-width right column).
// Multi-item orders grow the titles list vertically; shop column wraps
// from one or two lines to match. Reads as one horizontal band per shop.

// Visible item budget per fulfillment. Anything beyond this (rare —
// vinyl / cassette orders are usually 1-3 items) collapses into a single
// "+N more items" caption so the card stays compact.
const MAX_INLINE_ITEMS = 3

/** "Pharoah Sanders" → "PS", "Sun Ra Estate" → "SE", "Axon Fade" → "AF".
 *  Single-word names take the first two letters. */
function shopInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Stable portrait-avatar URL per shop name. pravatar.cc serves real
 *  human-portrait photos seeded by `?u=…`, so each shop gets the same
 *  distinctive face every render. Real artist photos / label logos would
 *  override this via `seller.avatarUrl` when the data exists. */
function shopAvatarUrl(name: string): string {
  const seed = name.toLowerCase().replace(/[^a-z0-9]/g, "-")
  return `https://i.pravatar.cc/80?u=${seed}`
}

function FulfillmentRow({ fulfillment, onOpen, onProductClick }: {
  fulfillment:     Fulfillment
  onOpen:          () => void
  onProductClick:  (title: string) => void
}) {
  const visible   = fulfillment.items.slice(0, MAX_INLINE_ITEMS)
  const overflow  = fulfillment.items.length - MAX_INLINE_ITEMS

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen() } }}
      className="flex items-start gap-5 px-4 py-4 hover:bg-muted/60 transition-colors cursor-pointer outline-none focus-visible:bg-muted/60"
    >
      {/* ── 1. Shop column — visual stopper.
           Avatar with a real portrait photo (initials fallback while the
           image loads or if it fails) anchors the left edge. Subline is
           just the per-shop order number — location dropped: the buyer
           already chose the seller and the status badge communicates
           shipping state, so location was decorative noise. */}
      <div className="shrink-0 w-[220px] flex items-start gap-2.5">
        <Avatar className="size-8 shrink-0 mt-0.5">
          <AvatarImage
            src={shopAvatarUrl(fulfillment.seller.name)}
            alt={fulfillment.seller.name}
          />
          <AvatarFallback className="text-2xsmall font-medium">
            {shopInitials(fulfillment.seller.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-small font-medium text-foreground truncate">
            {fulfillment.seller.name}
          </p>
          <p className="text-2xsmall text-muted-foreground tabular-nums truncate">
            {fulfillment.orderNumber}
          </p>
        </div>
      </div>

      {/* ── 2. Items zone — thumbs + titles list, fills the middle.
           Both lists capped at MAX_INLINE_ITEMS; beyond that, a single
           caption surfaces the overflow count so the row stays compact
           even for 6+ item orders. */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="flex gap-1.5 shrink-0">
          {visible.map((item, i) => (
            <img
              key={i}
              src={item.image}
              alt={item.productTitle}
              draggable={false}
              className="size-14 rounded-sm object-cover"
            />
          ))}
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          {visible.map((item, i) => (
            <p key={i} className="text-small text-foreground leading-snug truncate">
              {/*
                Product title acts as a future link to the listing page.
                No route wired yet — toast a "coming soon" instead. The
                quantity suffix isn't part of the link target (it's a
                count, not a name) so it sits outside the button.
              */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onProductClick(item.productTitle) }}
                className="text-left bg-transparent border-none p-0 text-inherit hover:underline underline-offset-3 cursor-pointer outline-none focus-visible:underline"
              >
                {item.productTitle}
              </button>
              {item.quantity > 1 && (
                <span className="text-muted-foreground"> ×{item.quantity}</span>
              )}
            </p>
          ))}
          {overflow > 0 && (
            <p className="text-2xsmall text-muted-foreground mt-0.5">
              +{overflow} more {overflow === 1 ? "item" : "items"}
            </p>
          )}
        </div>
      </div>

      {/* ── 3. State column — status + subtotal.
           Tracking link moved to the detail page; payment-recovery CTA
           moved up to the checkout header (it's a per-charge action,
           not a per-fulfillment one) so this column stays calm. */}
      <div className="shrink-0 flex flex-col items-end gap-1">
        <OrderStatusBadge status={fulfillment.status} />
        <span className="text-xsmall text-muted-foreground tabular-nums">
          {formatTotal(fulfillment.subtotal)}
        </span>
      </div>
    </div>
  )
}

// ─── Status filter ───────────────────────────────────────────────────────────

function StatusFilter({
  value, onChange,
}: {
  value:    OrderStatus | "all"
  onChange: (v: OrderStatus | "all") => void
}) {
  // Built on the platform ToggleGroup primitive — segmented track + lifted
  // pressed pill chrome and aria-pressed wiring come from the shared
  // component, not duplicated here. Single-select via the array shape that
  // base-ui's ToggleGroup uses; we always emit exactly one value.
  const options: Array<{ value: OrderStatus | "all"; label: string }> = [
    { value: "all",            label: "All"            },
    { value: "new",            label: "Paid"           },
    { value: "shipped",        label: "Shipped"        },
    { value: "delivered",      label: "Delivered"      },
    { value: "refunded",       label: "Refunded"       },
    { value: "cancelled",      label: "Cancelled"      },
    { value: "payment_failed", label: "Payment failed" },
  ]
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(values) => {
        // Keep at least one selected — clicking the active pill again
        // would otherwise deselect to []. Default back to "all".
        const next = values[0]
        onChange((next ?? "all") as OrderStatus | "all")
      }}
      aria-label="Filter by status"
    >
      {options.map(opt => (
        <Toggle key={opt.value} value={opt.value} aria-label={opt.label}>
          {opt.label}
        </Toggle>
      ))}
    </ToggleGroup>
  )
}

// ─── Sort control — date only, asc/desc via DropdownMenu ─────────────────────

function SortControl({
  sortDir, onChange,
}: {
  sortDir:  SortDir
  onChange: (dir: SortDir) => void
}) {
  const label = sortDir === "desc" ? "Newest first" : "Oldest first"
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" className="ml-auto font-normal" />
        }
      >
        <ArrowDownUp className="size-4" />
        {label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        <DropdownMenuItem onClick={() => onChange("desc")} className="justify-between">
          Newest first
          {sortDir === "desc" && <Check className="size-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChange("asc")} className="justify-between">
          Oldest first
          {sortDir === "asc" && <Check className="size-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
