"use client"

/*
 * Cart store — single global shopping cart for the buyer side of Muza.
 *
 * Lines are grouped by `shopId` (one shop = one artist) because shipping is
 * computed per shop. Each line carries:
 *   - `kind`        : "physical" or "digital" — digital lines never show
 *                     shipping/address fields; a shop with only digital
 *                     lines suppresses the shipping line entirely.
 *   - `minPrice` /  : Bandcamp-style "name your price". The buyer can pay
 *     `unitPrice`     above the floor; the store enforces ≥ minPrice.
 *   - `stock`       : optional cap. `undefined` = unlimited; a number means
 *                     "only N available" (drives the stock pill + qty cap).
 *   - `preorderShipDate` : if set, the line is a pre-order; the pill reads
 *                     "Pre-order — ships [date]" and the shop card uses the
 *                     pre-order ship window instead of the standard one.
 *
 * Cart-level state adds:
 *   - `walletBalance` (mocked) — used in the footer to show coverage and
 *     compute "Top up $X" copy when the order exceeds the balance.
 *   - `promoCode`     — global promo input. `MUZA10` = 10% off the
 *     pre-shipping subtotal (sum across shops). Anything else = no discount.
 *
 * Persistence is intentionally skipped — this is a UI scaffold with mock
 * seed so the drawer is always populated. When the real commerce layer
 * lands, swap the seed for an API hook here without touching consumers.
 */

import * as React from "react"

import { countryName } from "@/lib/countries"

// ─── Types ───────────────────────────────────────────────────────────────────

export type LineKind = "physical" | "digital"

export interface CartLine {
  id:           string  // unique line id (productId + variant key)
  shopId:       string
  shopName:     string
  productTitle: string
  image:        string
  kind:         LineKind
  /** Available variant axes — undefined axes are simply not shown. */
  variants?: {
    colors?: string[]
    sizes?:  string[]
  }
  /** Selected variant. */
  selected: {
    color?: string
    size?:  string
  }
  /** Per-shop "$X or more" minimum. */
  minPrice:  number
  /** Current per-unit price (≥ minPrice). */
  unitPrice: number
  /** When true, the price is locked at `unitPrice` — no name-your-price
   *  input. The minimum-hint switches to "Fixed price". */
  fixedPrice?: boolean
  qty:       number
  /** Optional cap on available quantity (undefined = unlimited). */
  stock?: number
  /** ISO date — set means line is a pre-order, ships on/after that date. */
  preorderShipDate?: string
}

export interface ShopGroup {
  shopId:        string
  shopName:      string
  shipsFromCity: string
  /** Estimated delivery window in business days [min, max]. */
  estDeliveryDays: [number, number]
  lines:         CartLine[]
  subtotal:      number
  discount:      number  // promo allocated to this shop (proportional)
  shippingFee:   number  // 0 = free or digital-only
  /** Tax on physical-only subtotal at the destination rate. Digital lines
   *  are exempt in this mock — close enough to reality (B2C digital VAT
   *  rules vary by country and registration thresholds). */
  tax:           number
  total:         number
  /** "physical" if any line is physical; else "digital". */
  kind:          LineKind
}

// ─── Currency ────────────────────────────────────────────────────────────────

export interface Currency {
  code:   string  // ISO 4217
  symbol: string
  /** Mock exchange rate from USD. 1 USD = `rate` units of this currency. */
  rate:   number
  /** Where the currency symbol sits relative to the amount. */
  side:   "prefix" | "suffix"
  /** How many decimals to show. JPY shows 0; most others 2. */
  decimals: number
}

export const CURRENCIES: Record<string, Currency> = {
  USD: { code: "USD", symbol: "$",  rate: 1.00,    side: "prefix", decimals: 2 },
  EUR: { code: "EUR", symbol: "€",  rate: 0.92,    side: "prefix", decimals: 2 },
  GBP: { code: "GBP", symbol: "£",  rate: 0.79,    side: "prefix", decimals: 2 },
  JPY: { code: "JPY", symbol: "¥",  rate: 152.0,   side: "prefix", decimals: 0 },
  CAD: { code: "CAD", symbol: "C$", rate: 1.36,    side: "prefix", decimals: 2 },
  AUD: { code: "AUD", symbol: "A$", rate: 1.52,    side: "prefix", decimals: 2 },
}

// ─── Tax (destination-based VAT/GST mock) ────────────────────────────────────
//
// Realistic-feeling rates by country. Applied to physical subtotal only.

interface TaxRule { code: string; label: string; rate: number; name: string }

const TAX_RULES: TaxRule[] = [
  { code: "DE", name: "Germany",        label: "VAT",  rate: 0.19  },
  { code: "FR", name: "France",         label: "VAT",  rate: 0.20  },
  { code: "GB", name: "United Kingdom", label: "VAT",  rate: 0.20  },
  { code: "ES", name: "Spain",          label: "IVA",  rate: 0.21  },
  { code: "NL", name: "Netherlands",    label: "VAT",  rate: 0.21  },
  { code: "IT", name: "Italy",          label: "IVA",  rate: 0.22  },
  { code: "JP", name: "Japan",          label: "JCT",  rate: 0.10  },
  { code: "AU", name: "Australia",      label: "GST",  rate: 0.10  },
  { code: "CA", name: "Canada",         label: "GST",  rate: 0.05  },
  { code: "US", name: "United States",  label: "Tax",  rate: 0.0875 }, // NY-ish
]

/** Resolve the tax rule for a country code. Countries not in the
 *  TAX_RULES table get a zero-rate fallback so totals never NaN —
 *  international shipping outside the known VAT/GST jurisdictions
 *  simply doesn't apply destination tax in the prototype. */
function taxRuleFor(country: string): TaxRule {
  return TAX_RULES.find(r => r.code === country)
    ?? { code: country, name: country, label: "Tax", rate: 0 }
}

// ─── Shipping address ────────────────────────────────────────────────────────
//
// Structured form so downstream consumers (tax lookup, checkout
// validation, order detail rendering) don't have to reparse a free-form
// string. Country is an ISO 3166-1 alpha-2 code; UI surfaces the long
// name via `countryName(code)` from "@/lib/countries".
//
// Street + house number are separate fields — most non-US address
// formats keep them apart, and the apartment / suite line stays
// optional below.

export interface ShippingAddress {
  /** ISO 3166-1 alpha-2 country code. */
  country:    string
  postalCode: string
  city:       string
  street:     string
  number:     string
  apt?:       string
}

export function formatAddress(a: ShippingAddress): string {
  const streetLine = [a.street, a.number].filter(Boolean).join(" ")
  const cityLine   = [a.postalCode, a.city].filter(Boolean).join(" ")
  const country    = countryName(a.country)
  return [streetLine, a.apt, cityLine, country].filter(Boolean).join(", ")
}

interface CartContextValue {
  lines:           CartLine[]
  groups:          ShopGroup[]
  count:           number
  /** Sum of (unitPrice × qty) before discounts and shipping. */
  itemsSubtotal:   number
  /** Promo discount applied across the entire cart. */
  promoDiscount:   number
  /** Sum of per-shop shipping fees. */
  shippingTotal:   number
  /** Sum of per-shop tax. */
  taxTotal:        number
  /** Tax rule resolved from the shipping address (label + rate). */
  taxLabel:        string
  taxRate:         number
  /** itemsSubtotal − promoDiscount + shippingTotal + taxTotal. */
  grandTotal:      number

  /** Structured shipping address. Display strings are derived via
   *  `formatAddress(cart.shippingAddress)` so consumers don't reparse. */
  shippingAddress: ShippingAddress
  setShippingAddress: (next: ShippingAddress) => void

  walletBalance:   number
  /** Positive when top-up is needed; 0 when wallet covers the order. */
  walletShortfall: number
  /** Add `amount` to the wallet (used by the top-up dialog). */
  topUpWallet:     (amount: number) => void

  /** Selected display currency. All money values are stored in USD; the
   *  `format` helper converts on the way out. */
  currency:        Currency
  setCurrency:     (code: string) => void
  /** Convert a USD amount to the active currency and format it. */
  format:          (usd: number) => string

  promoCode:       string
  promoApplied:    boolean
  applyPromo:      (code: string) => void
  clearPromo:      () => void

  setQty:    (lineId: string, qty: number) => void
  setPrice:  (lineId: string, unitPrice: number) => void
  setColor:  (lineId: string, color: string) => void
  setSize:   (lineId: string, size: string) => void
  remove:    (lineId: string) => void
  add:       (line: CartLine) => void
  clear:     () => void
}

// ─── Mock seed ───────────────────────────────────────────────────────────────
//
// Two shops — one mixed (apparel + vinyl + a digital download) and one
// physical-only — to exercise both shipping branches and the digital
// suppression of the shipping line.

const SEED: CartLine[] = [
  {
    id: "sun-ra-shirt-green-s",
    shopId: "sun-ra", shopName: "Sun Ra",
    productTitle: "Sun Ra — Space Is The Place Unisex Longsleeve",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80",
    kind: "physical",
    variants: { colors: ["Green", "Black", "Cream"], sizes: ["XS", "S", "M", "L", "XL"] },
    selected: { color: "Green", size: "Small" },
    minPrice: 20, unitPrice: 30, qty: 1,
    stock: 8,
  },
  {
    id: "sun-ra-shirt-cream-m",
    shopId: "sun-ra", shopName: "Sun Ra",
    productTitle: "Sun Ra — Lanquidity Tour Tee",
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&q=80",
    kind: "physical",
    variants: { colors: ["Cream", "Black"], sizes: ["S", "M", "L"] },
    selected: { color: "Cream", size: "Small" },
    minPrice: 20, unitPrice: 30, qty: 1,
    stock: 2,  // exercises "Last 2"
  },
  {
    id: "sun-ra-disc-27-11",
    shopId: "sun-ra", shopName: "Sun Ra",
    productTitle: "Discipline 27-II — Vinyl Reissue",
    image: "https://images.unsplash.com/photo-1542728928-1413d1894ed1?w=400&q=80",
    kind: "physical",
    selected: {},
    minPrice: 20, unitPrice: 30, qty: 1,
    preorderShipDate: "2026-06-14",
  },
  {
    id: "sun-ra-book",
    shopId: "sun-ra", shopName: "Sun Ra",
    productTitle: "Sun Ra: Art on Saturn — Hardcover Photo Book",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80",
    kind: "physical",
    selected: {},
    // Fixed-price item — no name-your-price; the buyer sees `$45` flat.
    minPrice: 45, unitPrice: 45, fixedPrice: true, qty: 1,
    stock: 6,
  },
  {
    id: "pharoah-meditations",
    shopId: "pharoah", shopName: "Pharoah Sanders",
    productTitle: "Karma — 50th Anniversary Reissue",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80",
    kind: "physical",
    selected: {},
    minPrice: 28, unitPrice: 32, qty: 2,
    stock: 12,
  },
  {
    id: "pharoah-cassette",
    shopId: "pharoah", shopName: "Pharoah Sanders",
    productTitle: "Live in San Francisco — Digital Download",
    image: "https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?w=400&q=80",
    kind: "digital",
    selected: {},
    minPrice: 8, unitPrice: 10, qty: 1,
  },
]

/** Static metadata per shop — ship-from city + delivery window. */
const SHOP_META: Record<string, { city: string; eta: [number, number] }> = {
  "sun-ra":  { city: "Berlin",      eta: [4, 7] },
  "pharoah": { city: "Brooklyn, NY", eta: [3, 5] },
}

// ─── Store ───────────────────────────────────────────────────────────────────

const CartContext = React.createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = React.useState<CartLine[]>(SEED)
  const [shippingAddress, setShippingAddress] = React.useState<ShippingAddress>({
    country:    "DE",
    postalCode: "10961",
    city:       "Berlin",
    street:     "Blücherstr.",
    number:     "37a",
  })
  const [walletBalance, setWalletBalance] = React.useState(124.00)  // mock; would come from API
  const [promoCode, setPromoCode] = React.useState("")
  const [currencyCode, setCurrencyCode] = React.useState("USD")
  const currency = CURRENCIES[currencyCode] ?? CURRENCIES.USD
  const setCurrency = React.useCallback((code: string) => {
    if (CURRENCIES[code]) setCurrencyCode(code)
  }, [])
  const topUpWallet = React.useCallback((amount: number) => {
    setWalletBalance(b => Math.round((b + Math.max(0, amount)) * 100) / 100)
  }, [])

  const format = React.useCallback(
    (usd: number) => formatMoney(usd * currency.rate, currency),
    [currency],
  )

  // Mutators — all keep `unitPrice` ≥ `minPrice`, `qty` ≥ 1, `qty` ≤ stock.
  const setQty = React.useCallback((lineId: string, qty: number) => {
    setLines(prev => prev.map(l => {
      if (l.id !== lineId) return l
      const cap = l.stock ?? Number.POSITIVE_INFINITY
      return { ...l, qty: Math.min(cap, Math.max(1, Math.floor(qty))) }
    }))
  }, [])

  const setPrice = React.useCallback((lineId: string, unitPrice: number) => {
    setLines(prev => prev.map(l =>
      l.id === lineId ? { ...l, unitPrice: Math.max(l.minPrice, unitPrice) } : l,
    ))
  }, [])

  const setColor = React.useCallback((lineId: string, color: string) => {
    setLines(prev => prev.map(l =>
      l.id === lineId ? { ...l, selected: { ...l.selected, color } } : l,
    ))
  }, [])

  const setSize = React.useCallback((lineId: string, size: string) => {
    setLines(prev => prev.map(l =>
      l.id === lineId ? { ...l, selected: { ...l.selected, size } } : l,
    ))
  }, [])

  const remove = React.useCallback((lineId: string) => {
    setLines(prev => prev.filter(l => l.id !== lineId))
  }, [])

  const add = React.useCallback((line: CartLine) => {
    setLines(prev => {
      const i = prev.findIndex(l => l.id === line.id)
      if (i === -1) return [...prev, line]
      return prev.map((l, idx) => idx === i ? { ...l, qty: l.qty + line.qty } : l)
    })
  }, [])

  const clear = React.useCallback(() => setLines([]), [])

  // Promo: only "MUZA10" works for the demo, applied to itemsSubtotal.
  const promoApplied = promoCode.trim().toUpperCase() === "MUZA10"
  const applyPromo  = React.useCallback((code: string) => setPromoCode(code), [])
  const clearPromo  = React.useCallback(() => setPromoCode(""), [])

  // Group by shopId, compute per-shop money. Shipping is a heuristic:
  // - if every line in the shop is digital → no shipping
  // - else free over $50 physical subtotal, $8 flat otherwise
  const itemsSubtotal = React.useMemo(
    () => lines.reduce((s, l) => s + l.unitPrice * l.qty, 0), [lines],
  )
  const promoDiscount = promoApplied ? Math.round(itemsSubtotal * 0.10 * 100) / 100 : 0

  // Tax rule resolved once per address change (destination-based VAT/GST).
  const taxRule = React.useMemo(() => taxRuleFor(shippingAddress.country), [shippingAddress.country])

  const groups: ShopGroup[] = React.useMemo(() => {
    const byShop = new Map<string, CartLine[]>()
    for (const line of lines) {
      const list = byShop.get(line.shopId) ?? []
      list.push(line)
      byShop.set(line.shopId, list)
    }
    return Array.from(byShop.entries()).map(([shopId, ls]) => {
      const shopName     = ls[0].shopName
      const meta         = SHOP_META[shopId] ?? { city: "—", eta: [5, 10] }
      const subtotal     = ls.reduce((s, l) => s + l.unitPrice * l.qty, 0)
      // Promo distributed proportionally across shops (so each shop's total
      // line still sums to the grand total).
      const discount     = itemsSubtotal > 0
        ? Math.round((promoDiscount * subtotal / itemsSubtotal) * 100) / 100
        : 0
      const physicalSubtotal = ls
        .filter(l => l.kind === "physical")
        .reduce((s, l) => s + l.unitPrice * l.qty, 0)
      const isAllDigital = physicalSubtotal === 0
      const shippingFee  = isAllDigital ? 0 : (physicalSubtotal >= 50 ? 0 : 8)
      // Tax applied to physical-only subtotal at the destination rate.
      // Discount applies to items pre-tax, so tax base = physicalSubtotal
      // minus the physical share of the discount.
      const taxableBase = Math.max(
        0,
        physicalSubtotal -
          (subtotal > 0 ? (discount * physicalSubtotal / subtotal) : 0),
      )
      const tax          = Math.round(taxableBase * taxRule.rate * 100) / 100
      const total        = subtotal - discount + shippingFee + tax
      const kind: LineKind = isAllDigital ? "digital" : "physical"
      return {
        shopId, shopName, lines: ls,
        shipsFromCity: meta.city,
        estDeliveryDays: meta.eta,
        subtotal, discount, shippingFee, tax, total, kind,
      }
    })
  }, [lines, itemsSubtotal, promoDiscount, taxRule])

  const count         = React.useMemo(() => lines.reduce((s, l) => s + l.qty, 0), [lines])
  const shippingTotal = React.useMemo(() => groups.reduce((s, g) => s + g.shippingFee, 0), [groups])
  const taxTotal      = React.useMemo(() => groups.reduce((s, g) => s + g.tax, 0), [groups])
  const grandTotal    = React.useMemo(() => groups.reduce((s, g) => s + g.total, 0), [groups])
  const walletShortfall = Math.max(0, Math.round((grandTotal - walletBalance) * 100) / 100)

  const value: CartContextValue = {
    lines, groups, count,
    itemsSubtotal, promoDiscount, shippingTotal, taxTotal,
    taxLabel: `${taxRule.label} ${taxRule.code}`, taxRate: taxRule.rate,
    grandTotal,
    shippingAddress, setShippingAddress,
    walletBalance, walletShortfall, topUpWallet,
    currency, setCurrency, format,
    promoCode, promoApplied, applyPromo, clearPromo,
    setQty, setPrice, setColor, setSize, remove, add, clear,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = React.useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>")
  return ctx
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function formatMoney(n: number, currency: Currency = CURRENCIES.USD): string {
  // Render with the currency's preferred decimal count and symbol position.
  // For mocked rates we don't bother with locale-specific thousand separators.
  const fixed = n.toFixed(currency.decimals)
  return currency.side === "prefix"
    ? `${currency.symbol}${fixed}`
    : `${fixed} ${currency.symbol}`
}

/** Human-readable date for pre-order ship dates. e.g. "14 Jun" */
export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}
