"use client"

/*
 * CartDrawer — right-side drawer listing every line currently in the cart,
 * grouped by shop. Builds on the Figma design (node 7405:108223) and adds
 * the missing operational details that turn it into a usable wallet-pay
 * cart:
 *   - Wallet balance + coverage in the footer (with top-up shortfall copy)
 *   - Per-line totals so buyers don't do mental arithmetic
 *   - Stock pills ("Last 2", "Pre-order — ships 14 Jun")
 *   - Per-shop "Ships from X · 3–5 days" ETA strip
 *   - Digital lines suppress shipping (and shop-only-digital shops hide the
 *     shipping line entirely; tax doesn't apply to them either)
 *   - Promo code input (single global)
 *   - Cart-wide currency picker — all values displayed via cart.format(usd)
 *   - Destination-based tax (VAT/GST) derived from the shipping address
 *   - "Top up wallet" inline flow when the wallet doesn't cover the order
 *   - Footer trust microcopy (pay.com, refund window)
 *
 * The price field stays name-your-price (Bandcamp model). It shows and edits
 * in the active currency; the store keeps USD canonical via inverse rate
 * conversion on save.
 */

import * as React from "react"
import { useState } from "react"
import {
  Trash2, MapPin, Truck, Download, Tag, Wallet,
  Lock, ShieldCheck, Clock, Globe, Check, CreditCard,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { QtyStepper } from "@/components/ui/qty-stepper"
import { cn } from "@/lib/utils"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose, SheetFooter,
} from "@/components/ui/sheet"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Combobox, ComboboxTrigger, ComboboxContent, ComboboxItem,
} from "@/components/ui/combobox"
import { COUNTRY_CODES, countryName } from "@/lib/countries"
import { Separator } from "@/components/ui/separator"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogClose,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
  useCart, formatShortDate, CURRENCIES, formatAddress,
  type CartLine, type ShopGroup, type ShippingAddress,
} from "@/lib/cart"
import { useToast } from "@/components/ui/toast"

// ─── Drawer root ─────────────────────────────────────────────────────────────

export function CartDrawer({
  open, onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const cart = useCart()
  const { add: toast } = useToast()
  const [topUpOpen, setTopUpOpen] = useState(false)
  const empty = cart.groups.length === 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-[640px] p-0 gap-0">
        {/* Explicit `pl-6 pr-14` (not `px-6 pr-14`) so tailwind-merge fully
             replaces the default `px-6` — otherwise it sees a conflict and
             keeps `px-6`, dropping the right-side reservation we need to
             clear the absolute-positioned close button. */}
        <SheetHeader className="pl-8 pr-14">
          <div className="flex items-center justify-between gap-3">
            <SheetTitle>Your cart</SheetTitle>
            <CurrencyPicker />
          </div>
          {!empty && (
            <p className="text-small text-muted-foreground">
              {cart.count} {cart.count === 1 ? "item" : "items"} · {cart.groups.length} {cart.groups.length === 1 ? "shop" : "shops"}
            </p>
          )}
        </SheetHeader>

        {/* ── Body — scrollable list of shop cards + promo ────────── */}
        <div className="flex-1 overflow-y-auto px-8 pt-7 pb-8">
          {empty ? (
            <EmptyState onClose={() => onOpenChange(false)} />
          ) : (
            <div className="flex flex-col gap-5">
              {cart.groups.map(group => (
                <ShopCard key={group.shopId} group={group} />
              ))}
              <PromoCard />
            </div>
          )}
        </div>

        {/* ── Sticky footer — wallet + pay + trust microcopy ────── */}
        {!empty && (
          <SheetFooter className="gap-4 px-8 py-5">
            <CheckoutSummary />
            <WalletCoverage onTopUp={() => setTopUpOpen(true)} />
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                if (cart.walletShortfall > 0) {
                  setTopUpOpen(true)
                  return
                }
                toast({
                  type: "success",
                  title: "Payment processing",
                  description: `${cart.format(cart.grandTotal)} via your Muza wallet`,
                })
                onOpenChange(false)
              }}
            >
              <Wallet className="size-4" />
              {cart.walletShortfall > 0
                ? `Top up ${cart.format(cart.walletShortfall)} to pay`
                : `Pay ${cart.format(cart.grandTotal)} by wallet`}
            </Button>
            <FooterTrustLine />
          </SheetFooter>
        )}
      </SheetContent>

      {/* Top-up dialog — rendered at the Sheet root so it persists across
           drawer state changes. */}
      <TopUpWalletDialog open={topUpOpen} onOpenChange={setTopUpOpen} />
    </Sheet>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 py-16">
      <p className="text-large font-medium text-foreground">Your cart is empty</p>
      <p className="text-small text-muted-foreground max-w-[260px] text-balance">
        Browse releases, demos, and merch. Anything you add will land here.
      </p>
      <Button variant="outline" onClick={onClose} className="mt-2">
        Keep browsing
      </Button>
    </div>
  )
}

// ─── Currency picker ─────────────────────────────────────────────────────────
//
// Lives in the drawer header. A small ghost button showing the active
// currency code; opens a dropdown of supported currencies. Cart-wide
// preference (no per-shop currency in this mock).

function CurrencyPicker() {
  const cart = useCart()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Change currency"
        className="inline-flex items-center gap-1 h-8 px-2 rounded-full text-xsmall text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Globe className="size-3.5" />
        <span className="font-medium">{cart.currency.code}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="min-w-[160px]">
        {Object.values(CURRENCIES).map(c => (
          <DropdownMenuItem
            key={c.code}
            onClick={() => cart.setCurrency(c.code)}
            className="justify-between"
          >
            <span className="flex items-center gap-2">
              <span className="text-muted-foreground tabular-nums w-4">{c.symbol}</span>
              {c.code}
            </span>
            {cart.currency.code === c.code && <Check className="size-4 text-foreground" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Shop card ───────────────────────────────────────────────────────────────

function ShopCard({ group }: { group: ShopGroup }) {
  const isDigital = group.kind === "digital"
  return (
    <section className="bg-background border border-border rounded-xl px-7 py-7 flex flex-col gap-5">
      {/* Shop title + ETA caption stack vertically, both left-aligned. The
           caption sits as a sub-line under the artist name so it reads as
           "this shop / shipping from here" rather than competing with the
           title for visual weight on the right side. */}
      <div className="flex flex-col gap-0.5">
        <h3 className="text-large font-medium text-foreground leading-snug truncate">
          {group.shopName}
        </h3>
        <span className="text-2xsmall text-muted-foreground inline-flex items-center gap-1">
          {isDigital ? (
            <>
              <Download className="size-3" />
              Instant download
            </>
          ) : (
            <>
              <Truck className="size-3" />
              Ships from {group.shipsFromCity} · {group.estDeliveryDays[0]}–{group.estDeliveryDays[1]} days
            </>
          )}
        </span>
      </div>

      {/* Hairline dividers between items so the four-input grid + image
           of each row read as discrete units. Items get vertical padding
           in place of gap; first/last collapse the edge so the divider
           pattern is purely interior. */}
      <div className="flex flex-col divide-y divide-border/60">
        {group.lines.map(line => (
          <LineRow key={line.id} line={line} />
        ))}
      </div>

      <Separator className="mt-2" />

      <ShopMoneyBreakdown group={group} />
    </section>
  )
}

// ─── Line row ────────────────────────────────────────────────────────────────

function LineRow({ line }: { line: CartLine }) {
  const cart = useCart()
  const hasColor = (line.variants?.colors?.length ?? 0) > 0
  const hasSize  = (line.variants?.sizes?.length  ?? 0) > 0
  const lineTotal = line.unitPrice * line.qty

  return (
    // Two-column layout: image left, all inputs stacked on the right. Image
    // is large + aligned-top so the eye locks on the product, while the
    // editable column reads as one tight chunk of controls.
    // py-6 lifts the row off the divider; first/last collapse so the
    // boundaries hug the card's inner edges instead of leaving extra air.
    <div className="flex items-start gap-4 py-6 first:pt-0 last:pb-0">
      <img
        src={line.image}
        alt=""
        className="size-20 rounded-sm object-cover shrink-0"
        draggable={false}
      />

      <div className="flex-1 min-w-0 flex flex-col gap-2.5">
        {/* Title row + trash on the right end */}
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <p className="text-small text-foreground leading-snug">
              {line.productTitle}
            </p>
            <StockPill line={line} />
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove ${line.productTitle}`}
            onClick={() => cart.remove(line.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>

        {/* Variant axes — only render if the product has them. Two
             equal-width columns so Color and Size line up as a grid with
             the price/qty row below. */}
        {(hasColor || hasSize) && (
          <div className="grid grid-cols-2 gap-2">
            {hasColor && (
              <Select
                value={line.selected.color ?? ""}
                onValueChange={v => v && cart.setColor(line.id, v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Color" />
                </SelectTrigger>
                <SelectContent>
                  {line.variants!.colors!.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {hasSize && (
              <Select
                value={line.selected.size ?? ""}
                onValueChange={v => v && cart.setSize(line.id, v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  {line.variants!.sizes!.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* Price input + qty stepper — same 2-column grid as variants so
             the four inputs read as one tidy 2×2 grid. Stepper uses
             `block` to stretch across its grid cell, matching price width. */}
        <div className="grid grid-cols-2 gap-2 items-start">
          <PriceInput line={line} />
          <QtyStepper
            value={line.qty}
            onChange={n => cart.setQty(line.id, n)}
            max={line.stock ?? Number.POSITIVE_INFINITY}
            ariaLabel={`quantity for ${line.productTitle}`}
            block
          />
        </div>

        {/* Line total — always rendered. Right-aligned, foreground-weight,
             no label. Anchors the eye scanning down the cart as the
             per-item answer to "what does this cost me?" — matches the
             pattern used across Shopify / Bandcamp / Etsy / Amazon. */}
        <p className="text-small text-foreground tabular-nums text-right">
          {cart.format(lineTotal)}
        </p>
      </div>
    </div>
  )
}

// ─── Stock / pre-order pill ──────────────────────────────────────────────────

function StockPill({ line }: { line: CartLine }) {
  if (line.preorderShipDate) {
    return (
      <span className="inline-flex items-center gap-1 text-2xsmall text-muted-foreground">
        <Clock className="size-3" />
        Pre-order — ships {formatShortDate(line.preorderShipDate)}
      </span>
    )
  }
  if (line.stock === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-2xsmall text-destructive font-medium">
        Sold out
      </span>
    )
  }
  if (line.stock !== undefined && line.stock <= 3) {
    return (
      <span className="inline-flex items-center gap-1 text-2xsmall text-foreground font-medium">
        Last {line.stock}
      </span>
    )
  }
  return null
}

// ─── Price input (name-your-price, currency-aware) ───────────────────────────
//
// Display + edit happen in the active currency. The store stays USD-canonical
// — we convert on the way in (display) and on the way out (commit on blur),
// then clamp ≥ minPrice (USD) so the floor still holds across currency
// switches.

function PriceInput({ line }: { line: CartLine }) {
  const cart = useCart()
  const displayValue = (line.unitPrice * cart.currency.rate).toFixed(cart.currency.decimals)
  const [draft, setDraft] = useState(displayValue)

  // Re-sync when currency or stored price changes externally.
  React.useEffect(() => { setDraft(displayValue) }, [displayValue])

  // Fixed-price items render as a static "field" matching the Input's
  // height/shape (h-10, rounded-full, border) so the row stays uniform —
  // but with no symbol-overlap and no editable affordance. The trailing
  // small "Fixed" label tells the buyer why they can't edit it.
  if (line.fixedPrice) {
    return (
      <div className="flex-1 min-w-0 h-10 px-4 rounded-full bg-muted flex items-center justify-between gap-2">
        <span className="text-base text-foreground tabular-nums truncate">
          {cart.format(line.unitPrice)}
        </span>
        <span className="text-2xsmall text-muted-foreground shrink-0">Fixed</span>
      </div>
    )
  }

  return (
    <div className="relative flex-1 min-w-0">
      {/* Currency symbol pinned to the input field's vertical centre
           (top-5 = 20px = half the 40px field height). Using a fixed offset
           rather than `top-1/2` because the wrapper now also contains the
           hint below, so `1/2` would land in the gap between them. */}
      {cart.currency.side === "prefix" && (
        <span className="absolute left-3 top-5 -translate-y-1/2 text-small text-muted-foreground pointer-events-none tabular-nums">
          {cart.currency.symbol}
        </span>
      )}
      <Input
        inputMode="decimal"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => {
          const parsed = parseFloat(draft.replace(/[^\d.]/g, "")) || 0
          // Convert active currency back to USD for storage.
          const usd = parsed / cart.currency.rate
          const clampedUsd = Math.max(line.minPrice, usd)
          cart.setPrice(line.id, clampedUsd)
          setDraft((clampedUsd * cart.currency.rate).toFixed(cart.currency.decimals))
        }}
        className={cn(
          "tabular-nums",
          cart.currency.side === "prefix" ? "pl-7" : "pr-9",
        )}
        aria-label={`Price for ${line.productTitle}`}
        hint={`${cart.format(line.minPrice)} or more`}
      />
      {cart.currency.side === "suffix" && (
        <span className="absolute right-3 top-5 -translate-y-1/2 text-small text-muted-foreground pointer-events-none tabular-nums">
          {cart.currency.symbol}
        </span>
      )}
    </div>
  )
}

// ─── Per-shop money breakdown ────────────────────────────────────────────────

function ShopMoneyBreakdown({ group }: { group: ShopGroup }) {
  const cart = useCart()
  const isDigital = group.kind === "digital"
  return (
    <div className="flex flex-col gap-1 text-xsmall">
      <Row label="Items">{cart.format(group.subtotal)}</Row>
      {group.discount > 0 && (
        <Row label="Discount" valueClass="text-foreground">
          −{cart.format(group.discount)}
        </Row>
      )}
      {!isDigital && (
        <Row
          label="Shipping"
          valueRight={
            <span className="tabular-nums text-foreground">
              {group.shippingFee === 0 ? "Free" : cart.format(group.shippingFee)}
            </span>
          }
        >
          <ShippingAddressLink />
        </Row>
      )}
      {group.tax > 0 && (
        <Row label={cart.taxLabel}>{cart.format(group.tax)}</Row>
      )}
      <div className="flex items-baseline justify-between gap-3 pt-2 mt-1 border-t border-border/60">
        <span className="text-small font-medium text-foreground">Shop total</span>
        <span className="text-small font-medium text-foreground tabular-nums">
          {cart.format(group.total)}
        </span>
      </div>
    </div>
  )
}

function Row({
  label, children, valueRight, valueClass,
}: {
  label: string
  children: React.ReactNode
  valueRight?: React.ReactNode
  valueClass?: string
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <div className="flex items-baseline gap-3 min-w-0">
        <span className={cn("truncate tabular-nums text-right text-foreground", valueClass)}>
          {children}
        </span>
        {valueRight}
      </div>
    </div>
  )
}

// ─── Shipping address (single global) ───────────────────────────────────────

function ShippingAddressLink() {
  const cart = useCart()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<ShippingAddress>(cart.shippingAddress)

  // Save is gated on the four required text fields. Apt is optional;
  // country always has a committed value (defaults to last saved).
  const canSave =
    draft.street.trim().length > 0 &&
    draft.number.trim().length > 0 &&
    draft.city.trim().length > 0 &&
    draft.postalCode.trim().length > 0

  const update = <K extends keyof ShippingAddress>(key: K, value: ShippingAddress[K]) =>
    setDraft(prev => ({ ...prev, [key]: value }))

  const openDialog = () => {
    setDraft(cart.shippingAddress)
    setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="inline-flex items-center gap-1 text-foreground underline underline-offset-3 decoration-border hover:decoration-foreground transition-colors truncate text-left"
      >
        <MapPin className="size-3 shrink-0" />
        <span className="truncate">{formatAddress(cart.shippingAddress)}</span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        {/* Narrower than default — address forms read better in a
             tight single column. `sm:max-w-sm` (384px) gives room for
             two-column pairs without padding them out. */}
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Shipping address</DialogTitle>
            <DialogDescription>
              Used for every shop in your cart. Changing the country also
              re-computes tax at checkout.
            </DialogDescription>
          </DialogHeader>

          {/* Field order: country, postal + city, street + number, apt.
               Country drives tax and address format so it leads; postal
               + city sit together (typed together when copy/pasting);
               street + number pair on one row; apt closes alone. */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="addr-country">Country</Label>
              <Combobox
                items={COUNTRY_CODES}
                itemToStringLabel={(c) => countryName(String(c))}
                value={draft.country}
                onValueChange={(v) => v && update("country", String(v))}
              >
                <ComboboxTrigger placeholder="Search countries…" />
                <ComboboxContent className="max-h-[280px] overflow-y-auto">
                  {(code: string) => (
                    <ComboboxItem key={code} value={code}>{countryName(code)}</ComboboxItem>
                  )}
                </ComboboxContent>
              </Combobox>
            </div>

            {/* Postal (narrow) + City (wide) — postal codes are short
                 (≤ 10 chars), city names vary wildly. */}
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="addr-postal">Postal code</Label>
                <Input
                  id="addr-postal"
                  value={draft.postalCode}
                  onChange={e => update("postalCode", e.target.value)}
                  placeholder="10115"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="addr-city">City</Label>
                <Input
                  id="addr-city"
                  value={draft.city}
                  onChange={e => update("city", e.target.value)}
                  placeholder="Berlin"
                />
              </div>
            </div>

            {/* Street (wide) + Number (narrow). Most non-US formats
                 separate these; we follow suit so downstream label
                 generation can format per locale. */}
            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="addr-street">Street</Label>
                <Input
                  id="addr-street"
                  value={draft.street}
                  onChange={e => update("street", e.target.value)}
                  placeholder="Main Street"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="addr-number">Number</Label>
                <Input
                  id="addr-number"
                  value={draft.number}
                  onChange={e => update("number", e.target.value)}
                  placeholder="123"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="addr-apt">Apt / suite (optional)</Label>
              <Input
                id="addr-apt"
                value={draft.apt ?? ""}
                onChange={e => update("apt", e.target.value)}
                placeholder="4C"
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              disabled={!canSave}
              onClick={() => { cart.setShippingAddress(draft); setOpen(false) }}
            >
              Save address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Promo code ──────────────────────────────────────────────────────────────

function PromoCard() {
  const cart = useCart()
  const [draft, setDraft] = useState("")
  const [error, setError] = useState<string | null>(null)

  if (cart.promoApplied) {
    return (
      <div className="bg-muted rounded-xl px-5 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Tag className="size-4 text-muted-foreground shrink-0" />
          <span className="text-small text-foreground truncate">
            <span className="font-medium">{cart.promoCode.toUpperCase()}</span>
            <span className="text-muted-foreground"> applied · saved {cart.format(cart.promoDiscount)}</span>
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { cart.clearPromo(); setDraft("") }}>
          Remove
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={e => { setDraft(e.target.value); setError(null) }}
          placeholder="Promo code"
          aria-label="Promo code"
          className="flex-1"
        />
        <Button
          variant="outline"
          onClick={() => {
            if (!draft.trim()) return
            cart.applyPromo(draft.trim())
            const ok = draft.trim().toUpperCase() === "MUZA10"
            if (!ok) setError("That code isn't valid.")
            else setDraft("")
          }}
        >
          Apply
        </Button>
      </div>
      {error && <p className="text-2xsmall text-destructive">{error}</p>}
    </div>
  )
}

// ─── Footer: checkout summary ────────────────────────────────────────────────

function CheckoutSummary() {
  const cart = useCart()
  return (
    <div className="flex flex-col gap-1 text-xsmall">
      <Row label="Items">{cart.format(cart.itemsSubtotal)}</Row>
      {cart.promoDiscount > 0 && (
        <Row label="Promo">−{cart.format(cart.promoDiscount)}</Row>
      )}
      {cart.shippingTotal > 0 && (
        <Row label="Shipping">{cart.format(cart.shippingTotal)}</Row>
      )}
      {cart.taxTotal > 0 && (
        <Row label={cart.taxLabel}>{cart.format(cart.taxTotal)}</Row>
      )}
      <div className="flex items-baseline justify-between gap-3 pt-2 mt-1 border-t border-border/60">
        <span className="text-base font-medium text-foreground">Total</span>
        <span className="text-base font-medium text-foreground tabular-nums">
          {cart.format(cart.grandTotal)}
        </span>
      </div>
    </div>
  )
}

// ─── Footer: wallet coverage ─────────────────────────────────────────────────

function WalletCoverage({ onTopUp }: { onTopUp: () => void }) {
  const cart = useCart()
  const insufficient = cart.walletShortfall > 0
  return (
    <div className="rounded-lg bg-background border border-border px-4 py-3 flex items-center gap-2.5 text-small">
      <Wallet className="size-4 shrink-0 text-foreground" />
      <span className="text-foreground flex-1">
        Wallet balance{" "}
        <span className="tabular-nums">
          {cart.format(cart.walletBalance)}
        </span>
      </span>
      {insufficient ? (
        <button
          type="button"
          onClick={onTopUp}
          className="text-destructive tabular-nums hover:underline underline-offset-3"
        >
          short {cart.format(cart.walletShortfall)} · top up
        </button>
      ) : (
        <span className="text-foreground tabular-nums">
          covers your order
        </span>
      )}
    </div>
  )
}

// ─── Footer: trust microcopy ────────────────────────────────────────────────

function FooterTrustLine() {
  return (
    <div className="flex items-center justify-between gap-3 text-2xsmall text-muted-foreground pt-1">
      <span className="inline-flex items-center gap-1">
        <Lock className="size-3" />
        Secure checkout · pay.com
      </span>
      <span className="inline-flex items-center gap-1">
        <ShieldCheck className="size-3" />
        14-day refunds
      </span>
      <SheetClose
        render={
          <button
            type="button"
            className="hover:text-foreground transition-colors underline underline-offset-3"
          />
        }
      >
        Continue shopping
      </SheetClose>
    </div>
  )
}

// ─── Top-up wallet dialog ────────────────────────────────────────────────────
//
// Pre-fills the suggested amount as the shortfall rounded up to the next 10
// (most people don't top up exact pennies). Buyer can edit; on submit we
// add to balance via `cart.topUpWallet` and toast.

function TopUpWalletDialog({
  open, onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const cart = useCart()
  const { add: toast } = useToast()
  const suggestedUsd = Math.max(10, Math.ceil(cart.walletShortfall / 10) * 10)
  const [draft, setDraft] = useState(
    (suggestedUsd * cart.currency.rate).toFixed(cart.currency.decimals),
  )

  // When the dialog opens fresh, recompute the suggestion against the live
  // shortfall + currency.
  React.useEffect(() => {
    if (!open) return
    const fresh = Math.max(10, Math.ceil(cart.walletShortfall / 10) * 10)
    setDraft((fresh * cart.currency.rate).toFixed(cart.currency.decimals))
  }, [open, cart.walletShortfall, cart.currency])

  const parsed = parseFloat(draft.replace(/[^\d.]/g, "")) || 0
  const usdAmount = parsed / cart.currency.rate
  const newBalanceUsd = cart.walletBalance + usdAmount
  const stillShort = newBalanceUsd < cart.grandTotal

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Top up wallet</DialogTitle>
          <DialogDescription>
            Your wallet is short {cart.format(cart.walletShortfall)} for this order.
            Add funds to keep going.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Amount */}
          <div className="flex flex-col gap-2">
            <Label>Amount</Label>
            <div className="relative">
              {cart.currency.side === "prefix" && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-small text-muted-foreground pointer-events-none tabular-nums">
                  {cart.currency.symbol}
                </span>
              )}
              <Input
                inputMode="decimal"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                className={cn(
                  "tabular-nums",
                  cart.currency.side === "prefix" ? "pl-7" : "pr-9",
                )}
                autoFocus
              />
              {cart.currency.side === "suffix" && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-small text-muted-foreground pointer-events-none tabular-nums">
                  {cart.currency.symbol}
                </span>
              )}
            </div>
            {/* Quick chips — common round-up amounts above the suggestion */}
            <div className="flex items-center gap-2 mt-1">
              {[suggestedUsd, suggestedUsd + 20, suggestedUsd + 50].map(usd => (
                <button
                  key={usd}
                  type="button"
                  onClick={() => setDraft((usd * cart.currency.rate).toFixed(cart.currency.decimals))}
                  className="text-2xsmall px-2 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors tabular-nums"
                >
                  {cart.format(usd)}
                </button>
              ))}
            </div>
          </div>

          {/* Payment method (mock — single saved card) */}
          <div className="flex flex-col gap-2">
            <Label>Pay with</Label>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border">
              <CreditCard className="size-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-small text-foreground">Visa</p>
                <p className="text-2xsmall text-muted-foreground tabular-nums">**** **** **** 2345</p>
              </div>
              <button
                type="button"
                className="text-2xsmall text-muted-foreground hover:text-foreground transition-colors underline underline-offset-3"
              >
                Change
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-muted rounded-lg px-3 py-2.5 flex flex-col gap-1 text-xsmall">
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground">Current balance</span>
              <span className="text-foreground tabular-nums">{cart.format(cart.walletBalance)}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground">Adding</span>
              <span className="text-foreground tabular-nums">+ {cart.format(usdAmount)}</span>
            </div>
            <div className="flex items-baseline justify-between pt-1.5 mt-0.5 border-t border-border/60">
              <span className="text-foreground font-medium">New balance</span>
              <span className={cn(
                "tabular-nums font-medium",
                stillShort ? "text-destructive" : "text-foreground",
              )}>
                {cart.format(newBalanceUsd)}
              </span>
            </div>
            {stillShort && (
              <p className="text-2xsmall text-destructive">
                Still {cart.format(cart.grandTotal - newBalanceUsd)} short of the order total.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            disabled={usdAmount <= 0}
            onClick={() => {
              cart.topUpWallet(usdAmount)
              toast({
                type: "success",
                title: `Added ${cart.format(usdAmount)} to your wallet`,
                description: `New balance: ${cart.format(newBalanceUsd)}`,
              })
              onOpenChange(false)
            }}
          >
            Add {cart.format(usdAmount)} to wallet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
