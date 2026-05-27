"use client"

/*
 * PurchaseAlbumDialog — buyer-side checkout for the "Unlock All
 * Songs" CTA on an album detail page. Three states:
 *
 *   summary    → order summary + tier picker + email + Pay.com
 *                payment container + sticky footer (total + Pay).
 *   processing → Spinner + "Processing payment…" (mocked 1.4s).
 *   success    → CircleCheck + "Unlocked!" then auto-closes 1.5s.
 *
 * ─────── Pay.com integration plan ───────
 *
 * Real wiring uses `@pay-com/js`. Pay.com renders a PCI-compliant
 * "universal" iframe form into a DOM container we give them; that
 * form handles ALL payment methods (card fields with brand
 * auto-detection, Apple Pay, Google Pay, PayPal) AND the saved-
 * card / new-card affordance for returning customers. We don't
 * write any of that UI ourselves — we just provide the surrounding
 * chrome (order summary, tier, email, total) and a `<div>` host.
 *
 * Sketch of the live integration (commented; needs a real merchant
 * id + a backend endpoint that mints a clientSecret per session):
 *
 *   import { Pay } from "@pay-com/js"            // npm i @pay-com/js
 *
 *   useEffect(() => {
 *     if (!open) return
 *     let cancelled = false
 *     ;(async () => {
 *       const clientSecret = await fetch("/api/paycom-session", {
 *         method: "POST",
 *         body: JSON.stringify({ albumId, tier, email }),
 *       }).then(r => r.json()).then(j => j.clientSecret)
 *       if (cancelled) return
 *       const pay      = await Pay.com({ identifier: MERCHANT_ID })
 *       const checkout = pay.checkout({ clientSecret })
 *       checkout.universal({
 *         container: "#paycom-container",
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
 * placeholder is what we'll keep when the real Pay.com universal
 * form goes in.
 */

import { useEffect, useState } from "react"
import { CircleCheck, CircleCheckBig, Disc3, Download, Mail, Radio as RadioIcon, ShieldCheck } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose,
  DialogPreview, DialogPreviewHeader, DialogPreviewTitle, DialogPreviewDescription, DialogPreviewFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PlayFilledAlt } from "@/components/ui/transport-icons"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { RadioCard, RadioCardGroup } from "@/components/ui/radio-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
  /** Logged-in account email — pre-fills the receipt field so users
   *  don't have to retype. Real wiring would pull from the auth
   *  context. */
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
}

type Step = "summary" | "processing" | "success"
type PurchaseTier = "stream" | "download"

const MOCK_USER_EMAIL = "naomi@example.com"

export function PurchaseAlbumDialog({
  open, onOpenChange, album, streamPrice, downloadPrice,
  userEmail = MOCK_USER_EMAIL, onPurchased, onGoToLibrary,
  upgradeMode = false, upgradePrice, onUpgraded,
}: PurchaseAlbumDialogProps) {
  const [step, setStep]   = useState<Step>("summary")
  // In upgrade mode tier is forced to "download" — the user already
  // owns the stream tier so the upgrade IS the download license.
  const [tier, setTier]   = useState<PurchaseTier>(upgradeMode ? "download" : "stream")
  const [email, setEmail] = useState(userEmail)
  // Optional tip to Muza — strings keep the input controlled and
  // parsing tolerant (e.g. "1.50", "1.5", ""). `null` = explicit
  // "No contribution" pick (zeroes the row + suppresses the
  // thank-you banner). Default $1 preselected as the cheap-anchor
  // nudge — preferred over $0 because the non-profit framing only
  // works if the default makes the user opt OUT, not opt IN.
  const [contribution, setContribution] = useState<string | null>("1")

  // In upgrade mode the cart line is the price delta, not the full
  // download price (user already paid for the stream tier).
  const itemPriceStr = upgradeMode && upgradePrice
    ? upgradePrice
    : tier === "download" && downloadPrice ? downloadPrice : streamPrice
  const itemPrice    = parsePrice(itemPriceStr)
  const contribAmt   = contribution === null ? 0 : Math.max(0, Number(contribution) || 0)
  const total        = itemPrice + contribAmt
  const price        = formatPrice(total)

  // Reset on each open.
  useEffect(() => {
    if (!open) return
    setStep("summary")
    setTier(upgradeMode ? "download" : "stream")
    setEmail(userEmail)
    setContribution("1")
  }, [open, userEmail, upgradeMode])

  // Success state stays open until the user picks an action. The
  // album's already been added to the library by `onPurchased` —
  // dismissing the dialog or hitting either CTA is a deliberate move,
  // not a timer. (Previously we auto-closed after 1.5s which felt
  // abrupt — the buyer barely got to register the success.)

  // Pay button enables once we have a valid email. Real wiring
  // would also require `checkout.validate()` to return ok before
  // letting the user submit — for prototype we skip that.
  const emailValid = /\S+@\S+\.\S+/.test(email)
  const canPay     = emailValid

  const handlePay = () => {
    setStep("processing")
    // Mocked checkout — see header doc for the real Pay.com
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
      <DialogContent className="sm:max-w-xl max-h-[90vh] p-0 gap-0 flex flex-col">
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
            <div className="shrink-0 flex flex-col gap-4 px-6 pt-6 pb-4 border-b border-border">
              <DialogHeader>
                <DialogTitle>
                  {upgradeMode ? `Add download to ${album.title}` : "Review and pay"}
                </DialogTitle>
                <DialogDescription>
                  {upgradeMode
                    ? "Upgrade your purchase to include the lossless download files. You've already paid the artist — this covers the difference."
                    : "One-time purchase. Yours forever, no subscription."}
                </DialogDescription>
              </DialogHeader>

              {/* In cart — single-item summary row. Cart framing
                   matches transactional checkout patterns (Subvert,
                   Bandcamp). The "Remove" link is functionally
                   identical to Cancel but reads as a cart-line
                   action, which feels right next to the item. */}
              <div className="flex flex-col gap-2">
                <SectionLabel className="text-xsmall text-muted-foreground font-normal">In cart</SectionLabel>
                <div className="rounded-2xl border border-border overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <img
                      src={album.cover}
                      alt=""
                      draggable={false}
                      className="size-12 rounded-xs shrink-0 object-cover shadow-sm"
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
                      <span className="text-small font-medium tabular-nums">{itemPriceStr}</span>
                      <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="text-2xsmall text-muted-foreground hover:text-foreground hover:underline underline-offset-2 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-5">

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
                        description={`Stream on any device · ${streamPrice}`}
                      />
                      {downloadPrice && (
                        <RadioCard
                          value="download"
                          selected={tier === "download"}
                          onSelect={() => setTier("download")}
                          icon={<Download />}
                          title="Download"
                          description={`Lossless files + listening · ${downloadPrice}`}
                        />
                      )}
                    </RadioCardGroup>
                  </div>

                  <Separator />
                </>
              )}

              {/* ── Contact (email for receipt) ────────────────── */}
              <div className="flex flex-col gap-2">
                <SectionLabel>Contact</SectionLabel>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email" className="sr-only">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      autoComplete="email"
                      className="pl-10"
                    />
                  </div>
                  <p className="text-2xsmall text-muted-foreground">
                    We'll send your receipt and a download link here.
                  </p>
                </div>
              </div>

              <Separator />

              {/* ── Payment (Pay.com universal form mounts here) ─ */}
              <div className="flex flex-col gap-2">
                <SectionLabel>Payment</SectionLabel>
                <PaycomContainer />
              </div>

              <Separator />

              {/* ── Contribute to Muza ────────────────────────────
                   Optional tip jar — Muza is non-profit and 100% of
                   subscription revenue already goes to artists, so
                   the contribution explicitly funds the platform
                   (infra, dev, ops) rather than artist payouts.
                   Preset amounts + custom field + "No contribution"
                   escape hatch. Default $1 preselected as a quiet
                   nudge; opting out is one click. */}
              <div className="flex flex-col gap-2">
                <SectionLabel>Contribute to Muza</SectionLabel>
                <p className="text-2xsmall text-muted-foreground">
                  100% of {itemPriceStr} goes directly to the artist. Add a small contribution to keep Muza non-profit and community-owned.
                </p>
                <ContributionPicker
                  value={contribution}
                  onChange={setContribution}
                />
                {contribAmt > 0 && (
                  <div className="rounded-lg bg-muted/60 px-3 py-2 text-xsmall text-foreground mt-1">
                    Thank you for your contribution.
                  </div>
                )}
              </div>

              <Separator />

              {/* ── Itemized totals ───────────────────────────────
                   Three lines: subtotal (the album), contribution,
                   total. Hides the contribution row entirely when
                   set to "No contribution" so the row doesn't sit
                   there as a faded $0 distraction. */}
              <dl className="flex flex-col gap-1.5 py-1">
                <div className="flex items-center justify-between">
                  <dt className="text-small text-muted-foreground">Subtotal</dt>
                  <dd className="text-small tabular-nums">{itemPriceStr}</dd>
                </div>
                {contribAmt > 0 && (
                  <div className="flex items-center justify-between">
                    <dt className="text-small text-muted-foreground">Contribution to Muza</dt>
                    <dd className="text-small tabular-nums">{formatPrice(contribAmt)}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1.5 border-t border-border">
                  <dt className="text-small font-medium text-foreground">Total</dt>
                  <dd className="text-large font-medium tabular-nums">{price}</dd>
                </div>
              </dl>

              <div className="flex items-center gap-2 text-2xsmall text-muted-foreground">
                <ShieldCheck className="size-3.5" />
                <span>
                  Payments processed securely by Pay.com. Card
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
            <DialogFooter className="m-0 shrink-0 border-t border-border bg-muted px-6 py-4 rounded-b-xl sm:rounded-b-2xl">
              <DialogClose render={<Button variant="ghost" />}>
                Cancel
              </DialogClose>
              <Button onClick={handlePay} disabled={!canPay}>
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
          <div className="flex flex-col gap-6 px-6 py-8">
            <DialogTitle className="sr-only">Purchase successful</DialogTitle>

            {/* Page-style headline — reads as a confirmation page even
                 though it's in a dialog. Centered icon + bold "You
                 own X" + soft confirmation line below. */}
            <div className="flex flex-col items-center gap-3 text-center">
              <CircleCheck className="size-10 text-primary" strokeWidth={1.5} />
              <p className="text-xlarge font-medium text-foreground">
                {upgradeMode
                  ? `Download added to ${album.title}`
                  : `You own ${album.title}`}
              </p>
            </div>

            {/* ── Your impact ─────────────────────────────────────
                 Subvert-style breakdown — shows the buyer exactly
                 where their money went. Reinforces the muza non-profit
                 / artist-first story at the moment of highest
                 emotional payoff (right after the buyer paid). */}
            {(itemPrice > 0 || contribAmt > 0) && (
              <div className="rounded-2xl border border-border bg-muted/40 px-5 py-4 flex flex-col gap-3">
                <p className="text-small text-foreground">
                  Thank you. Your purchase supports {album.artist}.
                </p>
                <ul className="flex flex-col gap-2">
                  {itemPrice > 0 && (
                    <li className="flex items-start gap-2">
                      <CircleCheckBig className="size-4 mt-px shrink-0 text-foreground" />
                      <span className="text-small text-foreground leading-5">
                        <span className="font-medium">{album.artist}</span>
                        {" received "}
                        <span className="tabular-nums">{itemPriceStr}</span>
                        {upgradeMode
                          ? " — 100% of your upgrade."
                          : " — 100% of your purchase."}
                      </span>
                    </li>
                  )}
                  {contribAmt > 0 && (
                    <li className="flex items-start gap-2">
                      <CircleCheckBig className="size-4 mt-px shrink-0 text-foreground" />
                      <span className="text-small text-foreground leading-5">
                        <span className="font-medium">Muza</span>
                        {" received your "}
                        <span className="tabular-nums">{formatPrice(contribAmt)}</span>
                        {" contribution — keeps the platform non-profit and community-owned."}
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Confirmation + receipt — quiet meta lines under the
                 impact block. Receipt email mirrors the cart email
                 field so the user immediately sees where to look. */}
            <div className="flex flex-col gap-1 text-small text-muted-foreground">
              <p>Your order is confirmed.</p>
              <p>
                Receipt sent to{" "}
                <span className="text-foreground">{email}</span>.
              </p>
            </div>

            {/* Item recap with optional Download — the buyer can
                 download their files right from this confirmation
                 (download tier only) without having to navigate
                 back into the library to find them. */}
            <div className="rounded-2xl border border-border overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <img
                  src={album.cover}
                  alt=""
                  draggable={false}
                  className="size-12 rounded-xs shrink-0 object-cover shadow-sm"
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
                    Download
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

// Tip-jar picker — preset amounts as a segmented row plus a custom
// numeric field. `null` is the explicit "No contribution" selection;
// it zeroes the contribution row and suppresses the thank-you banner.
const PRESETS = ["1", "2", "5"] as const
function ContributionPicker({
  value, onChange,
}: {
  value: string | null
  onChange: (next: string | null) => void
}) {
  const isPreset = value !== null && (PRESETS as readonly string[]).includes(value)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-stretch gap-1.5">
        {PRESETS.map(p => {
          const active = value === p
          return (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              aria-pressed={active}
              className={cn(
                "flex-1 h-10 rounded-full text-small font-medium tabular-nums transition-colors border",
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-muted",
              )}
            >
              ${p}.00
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-pressed={value === null}
          className={cn(
            "flex-1 h-10 rounded-full text-small font-medium transition-colors border whitespace-nowrap px-3",
            value === null
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-foreground border-border hover:bg-muted",
          )}
        >
          No contribution
        </button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xsmall text-muted-foreground">Custom</span>
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-muted-foreground pointer-events-none">$</span>
          <Input
            type="text"
            inputMode="decimal"
            value={isPreset ? "" : (value ?? "")}
            onChange={e => {
              const raw = e.target.value.replace(/[^0-9.]/g, "")
              onChange(raw === "" ? null : raw)
            }}
            placeholder="0.00"
            className="pl-8"
          />
        </div>
      </div>
    </div>
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
 * PaycomContainer — placeholder for Pay.com's universal payment
 * form. In production this becomes:
 *
 *   <div id="paycom-container" ref={paycomRef} />
 *
 * and a `useEffect` initializes Pay.com against the ref (see the
 * file header for the full sketch). Pay.com mounts an iframe with
 * the card fields, brand auto-detection, Apple Pay / Google Pay /
 * PayPal express buttons, and the saved-card row for returning
 * customers — all rendered by Pay.com, all PCI-compliant.
 *
 * The placeholder here is just visual scaffolding so the
 * surrounding dialog reads correctly at design time. Once the live
 * integration lands, swap the inner contents for the empty
 * `<div id="paycom-container" />` and everything around it stays.
 */
function PaycomContainer() {
  return (
    <div
      id="paycom-container"
      className="flex flex-col items-center justify-center gap-2 py-10 px-6 rounded-lg border border-dashed border-border bg-muted/40"
    >
      <p className="text-small font-medium text-foreground">
        Payment fields render here
      </p>
      <p className="text-2xsmall text-muted-foreground text-center max-w-[320px]">
        Card · Apple Pay · Google Pay · PayPal — all rendered by
        Pay.com's universal form. Brand auto-detection and saved-card
        handling come built-in.
      </p>
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
  // static-mounted — devs can flip the tier picker / contribution /
  // email and see the breakdown react.
  const [tier, setTier]   = useState<PurchaseTier>("stream")
  const [email, setEmail] = useState(userEmail)
  const [contribution, setContribution] = useState<string | null>("1")
  const itemPriceStr = tier === "download" && downloadPrice ? downloadPrice : streamPrice
  const itemPrice    = parsePrice(itemPriceStr)
  const contribAmt   = contribution === null ? 0 : Math.max(0, Number(contribution) || 0)
  const total        = itemPrice + contribAmt
  const price        = formatPrice(total)

  return (
    <DialogPreview
      showCloseButton={false}
      className={cn("sm:max-w-xl max-h-[600px] p-0 gap-0 flex flex-col", className)}
    >
      {/* Sticky header */}
      <div className="shrink-0 flex flex-col gap-4 px-6 pt-6 pb-4 border-b border-border">
        <DialogPreviewHeader>
          <DialogPreviewTitle>Review and pay</DialogPreviewTitle>
          <DialogPreviewDescription>
            One-time purchase. Yours forever, no subscription.
          </DialogPreviewDescription>
        </DialogPreviewHeader>

        <div className="flex flex-col gap-2">
          <SectionLabel className="text-xsmall text-muted-foreground font-normal">In cart</SectionLabel>
          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <img
                src={album.cover}
                alt=""
                draggable={false}
                className="size-12 rounded-xs shrink-0 object-cover shadow-sm"
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
                <span className="text-small font-medium tabular-nums">{itemPriceStr}</span>
                <span className="text-2xsmall text-muted-foreground">Remove</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll body */}
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-5">
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
              description={`Stream on any device · ${streamPrice}`}
            />
            {downloadPrice && (
              <RadioCard
                value="download"
                selected={tier === "download"}
                onSelect={() => setTier("download")}
                icon={<Download />}
                title="Download"
                description={`Lossless files + listening · ${downloadPrice}`}
              />
            )}
          </RadioCardGroup>
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <SectionLabel>Contact</SectionLabel>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="preview-email" className="sr-only">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                id="preview-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                className="pl-10"
              />
            </div>
            <p className="text-2xsmall text-muted-foreground">
              We'll send your receipt and a download link here.
            </p>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <SectionLabel>Payment</SectionLabel>
          <PaycomContainer />
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <SectionLabel>Contribute to Muza</SectionLabel>
          <p className="text-2xsmall text-muted-foreground">
            100% of {itemPriceStr} goes directly to the artist. Add a small contribution to keep Muza non-profit and community-owned.
          </p>
          <ContributionPicker
            value={contribution}
            onChange={setContribution}
          />
          {contribAmt > 0 && (
            <div className="rounded-lg bg-muted/60 px-3 py-2 text-xsmall text-foreground mt-1">
              Thank you for your contribution.
            </div>
          )}
        </div>

        <Separator />

        <dl className="flex flex-col gap-1.5 py-1">
          <div className="flex items-center justify-between">
            <dt className="text-small text-muted-foreground">Subtotal</dt>
            <dd className="text-small tabular-nums">{itemPriceStr}</dd>
          </div>
          {contribAmt > 0 && (
            <div className="flex items-center justify-between">
              <dt className="text-small text-muted-foreground">Contribution to Muza</dt>
              <dd className="text-small tabular-nums">{formatPrice(contribAmt)}</dd>
            </div>
          )}
          <div className="flex items-center justify-between pt-1.5 border-t border-border">
            <dt className="text-small font-medium text-foreground">Total</dt>
            <dd className="text-large font-medium tabular-nums">{price}</dd>
          </div>
        </dl>

        <div className="flex items-center gap-2 text-2xsmall text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          <span>
            Payments processed securely by Pay.com. Card details
            never touch Muza's servers.
          </span>
        </div>
      </div>

      {/* Sticky footer (preview chrome — no real submit) */}
      <DialogPreviewFooter className="m-0 shrink-0 border-t border-border bg-muted px-6 py-4 rounded-b-xl sm:rounded-b-2xl">
        <Button variant="ghost">Cancel</Button>
        <Button>Confirm and pay {price}</Button>
      </DialogPreviewFooter>
    </DialogPreview>
  )
}
