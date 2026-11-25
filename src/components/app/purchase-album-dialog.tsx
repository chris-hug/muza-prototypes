"use client"

/*
 * PurchaseAlbumDialog — buyer-side checkout for the "Buy"
 * CTA on an album detail page. Three states:
 *
 *   summary    → order summary + tier picker + payment
 *                method (saved card | new card) + price summary
 *                (price · processing fee · total) + sticky footer.
 *   processing → Spinner + "Processing payment…" (mocked 1.4s).
 *   success    → CircleCheck + "Unlocked!" then auto-closes 1.5s.
 *
 * ─────── Square integration plan ───────
 *
 * Real wiring uses `@square/web-sdk`. Square renders a PCI-compliant
 * "universal" iframe form into a DOM container we give them; that
 * form handles ALL payment methods (card fields with brand
 * auto-detection, Apple Pay, Google Pay, PayPal) AND the saved-
 * card / new-card affordance for returning customers. We don't
 * write any of that UI ourselves — we just provide the surrounding
 * chrome (order summary, tier, total) and a `<div>` host.
 *
 * Sketch of the live integration (commented; needs a real merchant
 * id + a backend endpoint that mints a clientSecret per session):
 *
 *   import { Pay } from "@square/web-sdk"            // npm i @square/web-sdk
 *
 *   useEffect(() => {
 *     if (!open) return
 *     let cancelled = false
 *     ;(async () => {
 *       const clientSecret = await fetch("/api/square-session", {
 *         method: "POST",
 *         body: JSON.stringify({ albumId, tier, email }),
 *       }).then(r => r.json()).then(j => j.clientSecret)
 *       if (cancelled) return
 *       const pay      = await Square({ identifier: MERCHANT_ID })
 *       const checkout = pay.checkout({ clientSecret })
 *       checkout.universal({
 *         container: "#square-container",
 *         toggles: { submitButton: false }, // we own the Pay button
 *       })
 *       checkout.on("success", res => onPurchased?.(tier, res))
 *       checkoutRef.current = checkout
 *     })()
 *     return () => { cancelled = true }
 *   }, [open, tier, email])
 *
 *   const handlePay = async () => {
 *     setStep("processing")
 *     try {
 *       await checkoutRef.current?.validate()
 *       await checkoutRef.current?.submit()
 *       setStep("success")
 *     } catch (e) {
 *       setStep("summary") // surface inline error per field
 *     }
 *   }
 *
 * For the prototype the container is a labeled placeholder + the
 * Pay button is a mocked `setTimeout`. The shell around the
 * placeholder is what we'll keep when the real Square universal
 * form goes in.
 */

import { useEffect, useState } from "react"
import { Check, CircleCheck, CircleCheckBig, Disc3, Download, Radio as RadioIcon, ShieldCheck, ShoppingCart } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose,
  DialogPreview, DialogPreviewHeader, DialogPreviewTitle, DialogPreviewDescription, DialogPreviewFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PlayFilledAlt } from "@/components/ui/transport-icons"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { RadioCard, RadioCardGroup } from "@/components/ui/radio-card"
import { serviceFee, priceWithFee, TRANSACTION_FEE } from "@/lib/cart"

export interface PurchaseAlbumDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  album: {
    cover:  string
    title:  string
    artist: string
    year?:  number | string
    format?: string
  }
  /** Buyer-side tiers, mirroring the seller-side Monetisation step
   *  in `upload-music-dialog.tsx`. */
  streamPrice: string
  downloadPrice?: string | null
  /** The account's email — where the receipt goes. Not asked for in the
   *  dialog: buying needs an account, and the account already has one. */
  userEmail?: string
  onPurchased?: (tier: PurchaseTier) => void
  /** Upgrade flow — when set, dialog opens in "add download" mode:
   *  tier picker is hidden (only download is bought), cart shows the
   *  passed delta price, success calls `onUpgraded` instead of
   *  `onPurchased`. Use for stream-tier owners adding the download
   *  tier for the price delta. */
  upgradeMode?: boolean
  upgradePrice?: string
  onUpgraded?: () => void
  /** Fires from the success step's "Go to library" button. Host
   *  navigates the user to the Albums page. The dialog closes on its
   *  own once the success state has played out. */
  onGoToLibrary?: () => void
  /** Batch buy — when set, the footer offers "Add to cart" beside
   *  "Confirm and pay": the same album, the picked tier, paid later with
   *  everything else. The host adds the line and the dialog closes.
   *  `inCart` turns it into "View cart" (→ `onOpenCart`), so a second
   *  visit never doubles the line. Ignored in `upgradeMode`. */
  onAddToCart?: (tier: PurchaseTier, price: string) => void
  inCart?: boolean
  onOpenCart?: () => void
  /** How many OTHER lines are already in the cart. With one or more, the
   *  price summary says exactly what adding this one saves; with none
   *  there is nothing to save yet, and it says nothing. */
  cartCount?: number
}

type Step = "summary" | "processing" | "success"
type PurchaseTier = "stream" | "download"
type PayMethod = "saved" | "new"

/* No Contact field. It asked for an email the account already holds; the
   receipt goes to the account address. Nothing in the app passes `userEmail`
   yet, so the success step falls back to "your account email". */
const MOCK_USER_EMAIL = ""

export function PurchaseAlbumDialog({
  open, onOpenChange, album, streamPrice, downloadPrice,
  userEmail = MOCK_USER_EMAIL, onPurchased, onGoToLibrary,
  upgradeMode = false, upgradePrice, onUpgraded,
  onAddToCart, inCart = false, onOpenCart, cartCount = 0,
}: PurchaseAlbumDialogProps) {
  const [step, setStep]   = useState<Step>("summary")
  // In upgrade mode tier is forced to "download" — the user already
  // owns the stream tier so the upgrade IS the download license.
  const [tier, setTier]   = useState<PurchaseTier>(upgradeMode ? "download" : "stream")
  const [method, setMethod] = useState<PayMethod>("saved")

  // In upgrade mode the cart line is the price delta, not the full
  // download price (user already paid for the stream tier).
  const itemPriceStr = upgradeMode && upgradePrice
    ? upgradePrice
    : tier === "download" && downloadPrice ? downloadPrice : streamPrice
  const itemPrice    = parsePrice(itemPriceStr)
  // What the buyer pays: the artist's price plus this payment's
  // processing fee, which `PriceSummary` itemizes above the button.
  const price        = formatPrice(itemPrice + serviceFee(itemPrice))

  // Reset on each open.
  useEffect(() => {
    if (!open) return
    setStep("summary")
    setTier(upgradeMode ? "download" : "stream")
    setMethod("saved")
  }, [open, upgradeMode])

  // Success state stays open until the user picks an action. The
  // album's already been added to the library by `onPurchased` —
  // dismissing the dialog or hitting either CTA is a deliberate move,
  // not a timer. (Previously we auto-closed after 1.5s which felt
  // abrupt — the buyer barely got to register the success.)

  // Real wiring would wait for `checkout.validate()` when a new card is
  // being entered; the saved card is ready at once. Prototype: always.
  const canPay = true

  const handlePay = () => {
    setStep("processing")
    // Mocked checkout — see header doc for the real Square
    // `checkout.submit()` flow.
    setTimeout(() => {
      setStep("success")
      if (upgradeMode) onUpgraded?.()
      else             onPurchased?.(tier)
    }, 1400)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Sticky-footer layout: outer is flex column with `p-0
           gap-0` so we control padding per section. Header pinned
           at top; middle scrolls; footer pinned at bottom with the
           Pay button always reachable. `sm:max-w-xl` overrides the
           base `sm:max-w-sm` (same breakpoint required for the
           cascade). */}
      <DialogContent className="sm:max-w-xl max-h-[90vh] p-0 gap-0 sm:gap-0 flex flex-col">
        {step === "summary" && (
          <>
            {/* ── Sticky header section ─────────────────────────────
                 Title + description + order-summary card. All
                 `shrink-0` so the buyer always sees what they're
                 buying — the card doesn't scroll out of view and
                 doesn't compress when the body is tall. Chrome
                 matches the upload-dialog's `SelectedReleaseCard`
                 (rounded-2xl shell + `ReleaseRow` row) so the
                 buyer-side reads as the mirror of the seller-side
                 release step. No "Change" button — buyer can't
                 swap which album they're purchasing. */}
            <div className="shrink-0 flex flex-col gap-2.5 px-4 pt-3 pb-3 border-b border-border">
              <DialogHeader>
                <DialogTitle>
                  {upgradeMode ? "Download files" : "Review and pay"}
                </DialogTitle>
                <DialogDescription>
                  {upgradeMode
                    ? "Keep the lossless files and use them anywhere. You've already paid the artist — this covers the difference."
                    : "One-time purchase. Yours forever, no subscription."}
                </DialogDescription>
              </DialogHeader>

              {/* The single-item summary row. It used to carry an "In cart"
                   label above it; the row already says so — cover, title,
                   price and a "Remove" beside them read as a cart line
                   without being announced, and on a phone the label cost a
                   line the dialog does not have to spare. The "Remove" link
                   is functionally Cancel, but as a cart-line action it sits
                   where the eye expects it. */}
              <div className="flex flex-col">
                <div className="rounded-2xl border border-border overflow-hidden">
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <img
                      src={album.cover}
                      alt=""
                      draggable={false}
                      className="size-12 rounded-xs shrink-0 object-cover shadow-sm art-edge"
                    />
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <p className="text-small font-medium leading-none truncate">
                        {album.title}
                      </p>
                      <p className="text-small text-muted-foreground font-normal truncate min-w-0">
                        {album.artist}
                        {album.year && (
                          <>
                            <span aria-hidden="true"> · </span>
                            <span>{album.year}</span>
                          </>
                        )}
                        <span aria-hidden="true"> · </span>
                        <span>{album.format ?? "Album"}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <span className="text-small font-medium tabular-nums">{price}</span>
                      <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="relative touch-target state-fade text-2xsmall text-muted-foreground hover:text-foreground link-underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4">

              {/* ── Tier picker ──────────────────────────────────
                   Hidden in upgrade mode — user already owns the
                   stream tier, the only thing to buy is the
                   download upgrade. */}
              {!upgradeMode && (
                <>
                  <div className="flex flex-col gap-2">
                    <SectionLabel>Tier</SectionLabel>
                    <RadioCardGroup
                      value={tier}
                      onValueChange={v => setTier(v as PurchaseTier)}
                    >
                      <RadioCard
                        value="stream"
                        selected={tier === "stream"}
                        onSelect={() => setTier("stream")}
                        icon={<RadioIcon />}
                        title="Listening"
                        description={`Stream on any device · ${priceWithFee(streamPrice)}`}
                      />
                      {downloadPrice && (
                        <RadioCard
                          value="download"
                          selected={tier === "download"}
                          onSelect={() => setTier("download")}
                          icon={<Download />}
                          title="Download files"
                          description={`Lossless files + listening · ${priceWithFee(downloadPrice)}`}
                        />
                      )}
                    </RadioCardGroup>
                  </div>

                </>
              )}



              {/* ── Payment (Square universal form mounts here) ─ */}
              <div className="flex flex-col gap-2">
                <SectionLabel>Payment</SectionLabel>
                <PaymentMethodPicker value={method} onChange={setMethod} />
              </div>

              <PriceSummary
                itemLabel={upgradeMode ? "Download files" : album.format ?? "Album"}
                itemPrice={itemPrice}
                cartCount={onAddToCart && !upgradeMode && !inCart ? cartCount : 0}
              />

              <div className="flex items-center gap-2 text-2xsmall text-muted-foreground">
                <ShieldCheck className="size-3.5" />
                <span>
                  Payments processed securely by Square. Card
                  details never touch Muza's servers.
                </span>
              </div>
            </div>

            {/* Sticky footer — only the action row. Override the
                 default DialogFooter negative margins (`-mx-6 -mb-6
                 mt-2`) which assume a `p-6` parent; we're in a
                 `p-0` flex layout so we want zero outer margin and
                 plain `shrink-0` so the row stays pinned to the
                 dialog's bottom edge. */}
            {/* With batch buy the left slot is "Add to cart" instead of
                 Cancel — the Bandcamp arrangement (Check out now · Add to
                 cart), and the album page keeps ONE buy button. Cancel
                 can go: Remove on the cart line, the ✕ and the backdrop
                 already dismiss. Not gated on payment: putting it in
                 the cart asks for nothing yet. */}
            <DialogFooter className="m-0 shrink-0 border-t border-border bg-muted px-4 py-3 rounded-b-xl sm:rounded-b-2xl">
              {onAddToCart && !upgradeMode ? (
                <Button
                  size="lg"
                  /* Outline, not ghost: a ghost label on the muted footer read as a
                     link beside the primary button, and batching is the reason
                     the cart exists (one $0.30 fee). Still second to Pay. */
                  variant="outline"
                  onClick={() => {
                    if (inCart) onOpenCart?.()
                    else onAddToCart(tier, itemPriceStr)
                    onOpenChange(false)
                  }}
                >
                  {inCart ? <Check /> : <ShoppingCart />}
                  {inCart ? "View cart" : "Add to cart"}
                </Button>
              ) : (
                <DialogClose render={<Button size="lg" variant="ghost" />}>
                  Cancel
                </DialogClose>
              )}
              <Button size="lg" onClick={handlePay} disabled={!canPay}>
                Confirm and pay {price}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center justify-center gap-4 py-10 min-h-[280px]">
            <DialogTitle className="sr-only">Processing payment</DialogTitle>
            <Spinner size="lg" label="Processing payment" />
            <p className="text-small text-muted-foreground">Processing payment…</p>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col gap-4 px-4 py-6">
            <DialogTitle className="sr-only">Purchase successful</DialogTitle>

            {/* Page-style headline — reads as a confirmation page even
                 though it's in a dialog. Centered icon + bold "You
                 own X" + soft confirmation line below. */}
            <div className="flex flex-col items-center gap-3 text-center">
              <CircleCheck className="size-10 text-primary-text" strokeWidth={1.5} />
              <p className="text-xlarge font-medium text-foreground">
                {upgradeMode
                  ? `Your files for ${album.title} are ready`
                  : `You own ${album.title}`}
              </p>
            </div>

            {/* ── Your impact ─────────────────────────────────────
                 Subvert-style breakdown — shows the buyer exactly
                 where their money went. Reinforces the muza non-profit
                 / artist-first story at the moment of highest
                 emotional payoff (right after the buyer paid). */}
            {itemPrice > 0 && (
              <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3 flex flex-col gap-2.5">
                <p className="text-small text-foreground">
                  Thank you. Your purchase supports {album.artist}.
                </p>
                <ul className="flex flex-col gap-2">
                  <li className="flex items-start gap-2">
                    <CircleCheckBig className="size-4 mt-px shrink-0 text-foreground" />
                    <span className="text-small text-foreground leading-5">
                      <span className="font-medium">{album.artist}</span>
                      {" received "}
                      <span className="tabular-nums">{itemPriceStr}</span>
                      {upgradeMode
                        ? " — 100% of the upgrade price."
                        : " — 100% of the album price."}
                    </span>
                  </li>
                </ul>
              </div>
            )}

            {/* Confirmation + receipt — quiet meta lines under the
                 impact block. Names the account address
                 the receipt went to, so the buyer knows where to look. */}
            <div className="flex flex-col gap-1 text-small text-muted-foreground">
              <p>Your order is confirmed.</p>
              <p>
                Receipt sent to{" "}
                <span className="text-foreground">{userEmail || "your account email"}</span>.
              </p>
            </div>

            {/* Item recap with optional Download — the buyer can
                 download their files right from this confirmation
                 (download tier only) without having to navigate
                 back into the library to find them. */}
            <div className="rounded-2xl border border-border overflow-hidden">
              <div className="flex items-center gap-3 px-3 py-2.5">
                <img
                  src={album.cover}
                  alt=""
                  draggable={false}
                  className="size-12 rounded-xs shrink-0 object-cover shadow-sm art-edge"
                />
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <p className="text-small font-medium leading-none truncate">
                    {album.title}
                  </p>
                  <p className="text-small text-muted-foreground font-normal truncate min-w-0">
                    {album.artist}
                    {album.year && (
                      <>
                        <span aria-hidden="true"> · </span>
                        <span>{album.year}</span>
                      </>
                    )}
                    <span aria-hidden="true"> · </span>
                    <span>{album.format ?? "Album"}</span>
                  </p>
                </div>
                {tier === "download" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => {
                      // Real wiring would open a download-format
                      // picker (MP3 / FLAC / WAV). For now noop —
                      // the visual presence of the affordance is
                      // the message.
                    }}
                  >
                    <Download className="size-3.5" />
                    Download files
                  </Button>
                )}
              </div>
            </div>

            {/* Twin CTAs — See in library (outline) takes the user
                 to their owned items, Play album (primary) drops
                 them straight into the listening experience. */}
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false)
                  onGoToLibrary?.()
                }}
              >
                See in library
              </Button>
              <Button
                onClick={() => {
                  onOpenChange(false)
                  // Real wiring would call player.play(album.id).
                }}
              >
                <PlayFilledAlt className="size-3.5" />
                Play album
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Small section-label primitive — sentence-case, never uppercase
// (matches the muza typography rule).
function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-small font-medium text-foreground", className)}>
      {children}
    </p>
  )
}

// Convert "$2.99" → 2.99. Tolerant of stripped currency, spaces, etc.
function parsePrice(input: string | undefined | null): number {
  if (!input) return 0
  const n = Number(input.replace(/[^0-9.]/g, ""))
  return Number.isFinite(n) ? n : 0
}
function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`
}

/*
 * PriceSummary — the price, the processing fee, the total.
 *
 * The fee is itemized, not folded in. For a while this was one Total line,
 * a leftover of removing the Contribute-to-Muza tip (whose three-line block
 * existed only to add the tip up); it was never a decision to hide the fee.
 * One "Service fee" line (5% + $0.30 per payment, see `serviceFee`), and
 * the total is the price the Buy button already showed: in the EU the full
 * price has to be up front, so nothing here may grow. The breakdown is for
 * transparency, the album's own price stays visible.
 *
 * The cart hint is a FACT, not an ad. "Buying more? Add to cart…" ran two
 * lines and spoke to everyone, including the buyer with an empty cart, for
 * whom it saves nothing. Now it appears only when there is something in the
 * cart, and says the amount: "Pay with your 3 cart items and save $0.30."
 * One line, true when it shows, absent when it would not be.
 */
function PriceSummary({
  itemLabel, itemPrice, cartCount = 0,
}: {
  itemLabel: string
  itemPrice: number
  cartCount?: number
}) {
  const fee = serviceFee(itemPrice)
  return (
    <div className="flex flex-col gap-2 py-1">
      <dl className="flex flex-col gap-1 text-small">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">{itemLabel}</dt>
          <dd className="tabular-nums text-foreground">{formatPrice(itemPrice)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">Service fee</dt>
          <dd className="tabular-nums text-foreground">{formatPrice(fee)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 pt-2 mt-1 border-t border-border">
          <dt className="font-medium text-foreground">Total</dt>
          <dd className="text-large font-medium tabular-nums">{formatPrice(itemPrice + fee)}</dd>
        </div>
      </dl>
      {cartCount > 0 && (
        <p className="text-2xsmall text-muted-foreground">
          Add it to your cart with {cartCount} other {cartCount === 1 ? "item" : "items"} and
          save {formatPrice(TRANSACTION_FEE)}.
        </p>
      )}
    </div>
  )
}

/*
 * SquareContainer — placeholder for Square's universal payment
 * form. In production this becomes:
 *
 *   <div id="square-container" ref={squareRef} />
 *
 * and a `useEffect` initializes Square against the ref (see the
 * file header for the full sketch). Square mounts an iframe with
 * the card fields, brand auto-detection, Apple Pay / Google Pay /
 * PayPal express buttons, and the saved-card row for returning
 * customers — all rendered by Square, all PCI-compliant.
 *
 * The placeholder here is just visual scaffolding so the
 * surrounding dialog reads correctly at design time. Once the live
 * integration lands, swap the inner contents for the empty
 * `<div id="square-container" />` and everything around it stays.
 */
function SquareContainer() {
  return (
    <div
      id="square-container"
      className="flex flex-col items-center justify-center gap-2 py-6 px-4 rounded-lg border border-dashed border-border bg-muted/40"
    >
      <p className="text-small font-medium text-foreground">
        Payment fields render here
      </p>
      <p className="text-2xsmall text-muted-foreground text-center max-w-[320px]">
        Card number, expiry and CVC, rendered by Square's card form.
        Card details never touch Muza's servers.
      </p>
    </div>
  )
}

/*
 * PaymentMethodPicker — the saved card, or a new one.
 *
 * Square remembers a returning buyer's card; the common case is "pay with
 * the one I used last time", so it leads and starts selected — one tap less
 * than opening an empty card form every time. "Pay with a new card" opens
 * Square's card form (card only for now: Apple Pay and Google Pay are not
 * integrated) under the
 * cards, and only then: a form nobody asked for would push the price summary
 * and the Pay button below the fold on a phone.
 *
 * `RadioCard size="sm"`: one line each, no icon, no description. Two
 * short labels at the Tier cards' full size read as a second big decision;
 * they are a quick confirmation. The card is mocked (`VISA •••• 1111`, Square's
 * sandbox test card); a buyer with no saved card would see the form alone.
 */
function PaymentMethodPicker({
  value, onChange,
}: {
  value: PayMethod
  onChange: (v: PayMethod) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <RadioCardGroup value={value} onValueChange={v => onChange(v as PayMethod)}>
        <RadioCard
          value="saved"
          selected={value === "saved"}
          onSelect={() => onChange("saved")}
          size="sm"
          title="VISA •••• 1111"
        />
        <RadioCard
          value="new"
          selected={value === "new"}
          onSelect={() => onChange("new")}
          size="sm"
          title="Pay with a new card"
        />
      </RadioCardGroup>
      {value === "new" && <SquareContainer />}
    </div>
  )
}

/*
 * PurchaseAlbumDialogPreview — static, always-visible version of
 * the dialog body for the design-system showcase. Uses the
 * `DialogPreview` family helpers (which match `DialogContent`
 * chrome without portaling / modaling), so devs can see the full
 * layout without clicking a trigger.
 *
 * Only the `summary` step is rendered — processing + success are
 * the obvious transient states. Body markup mirrors the live
 * dialog above; if you change one, change both (no shared body
 * extraction by design — keeps each form self-contained and easy
 * to read).
 */
export interface PurchaseAlbumDialogPreviewProps {
  album: PurchaseAlbumDialogProps["album"]
  streamPrice: string
  downloadPrice?: string | null
  userEmail?: string
  className?: string
}

export function PurchaseAlbumDialogPreview({
  album, streamPrice, downloadPrice,
  userEmail = MOCK_USER_EMAIL, className,
}: PurchaseAlbumDialogPreviewProps) {
  // Local state so the preview is interactive even though it's
  // static-mounted — devs can flip the tier picker and see
  // the total react.
  const [tier, setTier]   = useState<PurchaseTier>("stream")
  const [method, setMethod] = useState<PayMethod>("saved")
  const itemPriceStr = tier === "download" && downloadPrice ? downloadPrice : streamPrice
  const itemPrice    = parsePrice(itemPriceStr)
  const price        = formatPrice(itemPrice + serviceFee(itemPrice))

  return (
    <DialogPreview
      showCloseButton={false}
      className={cn("sm:max-w-xl max-h-[min(85vh,760px)] p-0 gap-0 sm:gap-0 flex flex-col", className)}
    >
      {/* Sticky header */}
      <div className="shrink-0 flex flex-col gap-2.5 px-4 pt-3 pb-3 border-b border-border">
        <DialogPreviewHeader>
          <DialogPreviewTitle>Review and pay</DialogPreviewTitle>
          <DialogPreviewDescription>
            One-time purchase. Yours forever, no subscription.
          </DialogPreviewDescription>
        </DialogPreviewHeader>

        <div className="flex flex-col">
          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center gap-3 px-3 py-2.5">
              <img
                src={album.cover}
                alt=""
                draggable={false}
                className="size-12 rounded-xs shrink-0 object-cover shadow-sm art-edge"
              />
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <p className="text-small font-medium leading-none truncate">
                  {album.title}
                </p>
                <p className="text-small text-muted-foreground font-normal truncate min-w-0">
                  {album.artist}
                  {album.year && (
                    <>
                      <span aria-hidden="true"> · </span>
                      <span>{album.year}</span>
                    </>
                  )}
                  <span aria-hidden="true"> · </span>
                  <span>{album.format ?? "Album"}</span>
                </p>
              </div>
              <div className="flex flex-col items-end gap-0.5 shrink-0">
                <span className="text-small font-medium tabular-nums">{price}</span>
                <span className="text-2xsmall text-muted-foreground">Remove</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <SectionLabel>Tier</SectionLabel>
          <RadioCardGroup
            value={tier}
            onValueChange={v => setTier(v as PurchaseTier)}
          >
            <RadioCard
              value="stream"
              selected={tier === "stream"}
              onSelect={() => setTier("stream")}
              icon={<RadioIcon />}
              title="Listening"
              description={`Stream on any device · ${priceWithFee(streamPrice)}`}
            />
            {downloadPrice && (
              <RadioCard
                value="download"
                selected={tier === "download"}
                onSelect={() => setTier("download")}
                icon={<Download />}
                title="Download files"
                description={`Lossless files + listening · ${priceWithFee(downloadPrice)}`}
              />
            )}
          </RadioCardGroup>
        </div>




        <div className="flex flex-col gap-2">
          <SectionLabel>Payment</SectionLabel>
          <PaymentMethodPicker value={method} onChange={setMethod} />
        </div>

        <PriceSummary itemLabel={album.format ?? "Album"} itemPrice={itemPrice} />

        <div className="flex items-center gap-2 text-2xsmall text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          <span>
            Payments processed securely by Square. Card details
            never touch Muza's servers.
          </span>
        </div>
      </div>

      {/* Sticky footer (preview chrome — no real submit) */}
      <DialogPreviewFooter className="m-0 shrink-0 border-t border-border bg-muted px-4 py-3 rounded-b-xl sm:rounded-b-2xl">
        <Button size="lg" variant="ghost">Cancel</Button>
        <Button size="lg">Confirm and pay {price}</Button>
      </DialogPreviewFooter>
    </DialogPreview>
  )
}
