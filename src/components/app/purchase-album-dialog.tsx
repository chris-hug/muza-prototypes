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
import { CircleCheck, Disc3, Download, Mail, Radio as RadioIcon, ShieldCheck } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose,
  DialogPreview, DialogPreviewHeader, DialogPreviewTitle, DialogPreviewDescription, DialogPreviewFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
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
}

type Step = "summary" | "processing" | "success"
type PurchaseTier = "stream" | "download"

const MOCK_USER_EMAIL = "naomi@example.com"

export function PurchaseAlbumDialog({
  open, onOpenChange, album, streamPrice, downloadPrice,
  userEmail = MOCK_USER_EMAIL, onPurchased,
}: PurchaseAlbumDialogProps) {
  const [step, setStep]   = useState<Step>("summary")
  const [tier, setTier]   = useState<PurchaseTier>("stream")
  const [email, setEmail] = useState(userEmail)
  const price = tier === "download" && downloadPrice ? downloadPrice : streamPrice

  // Reset on each open.
  useEffect(() => {
    if (!open) return
    setStep("summary")
    setTier("stream")
    setEmail(userEmail)
  }, [open, userEmail])

  // Auto-close 1.5s after success.
  useEffect(() => {
    if (step !== "success") return
    const id = setTimeout(() => onOpenChange(false), 1500)
    return () => clearTimeout(id)
  }, [step, onOpenChange])

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
      onPurchased?.(tier)
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
            <div className="shrink-0 flex flex-col gap-3 px-6 pt-6 pb-4 border-b border-border">
              <DialogHeader>
                <DialogTitle>Unlock all songs</DialogTitle>
                <DialogDescription>
                  One-time purchase. Yours forever, no subscription.
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-2xl border border-border overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                  <img
                    src={album.cover}
                    alt=""
                    draggable={false}
                    className="size-12 rounded-xs shrink-0 object-cover shadow-sm"
                  />
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <p className="text-small font-normal leading-none truncate">
                      {album.title}
                    </p>
                    {/* `min-w-0` so `truncate` on the artist span
                         can fire at narrow viewports — without it
                         the row takes natural content width and
                         the parent `overflow-hidden` clips it. */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Badge variant="secondary">
                        <Disc3 />
                        {album.format ?? "Album"}
                      </Badge>
                      <span className="text-small text-muted-foreground font-normal truncate min-w-0">
                        {album.artist}
                        {album.year && (
                          <>
                            <span aria-hidden="true"> · </span>
                            <span>{album.year}</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-5">

              {/* ── Tier picker ────────────────────────────────── */}
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

              {/* Total + trust signal — part of the scrolling body
                   (not the sticky footer). Total stays visually
                   near the Pay button, but if the dialog overflows
                   they scroll with the rest; only the action row
                   below sticks. */}
              <div className="flex items-center justify-between py-1">
                <span className="text-small text-muted-foreground">Total</span>
                <span className="text-large font-medium tabular-nums">{price}</span>
              </div>
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
                Pay {price}
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
          <div className="flex flex-col items-center justify-center gap-3 py-10 min-h-[280px]">
            <DialogTitle className="sr-only">Purchase successful</DialogTitle>
            <CircleCheck className="size-12 text-primary" strokeWidth={1.5} />
            <p className="text-large font-medium text-foreground">Unlocked!</p>
            <p className="text-small text-muted-foreground text-center max-w-[280px]">
              {tier === "download"
                ? `Files ready for ${album.title} — and listening is unlocked too.`
                : `${album.title} is unlocked for listening on any device.`}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Small section-label primitive — sentence-case, never uppercase
// (matches the muza typography rule).
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-small font-medium text-foreground">
      {children}
    </p>
  )
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
  // static-mounted — devs can flip the tier picker / type in the
  // email field to feel the chrome.
  const [tier, setTier]   = useState<PurchaseTier>("stream")
  const [email, setEmail] = useState(userEmail)
  const price = tier === "download" && downloadPrice ? downloadPrice : streamPrice

  return (
    <DialogPreview
      showCloseButton={false}
      className={cn("sm:max-w-xl max-h-[600px] p-0 gap-0 flex flex-col", className)}
    >
      {/* Sticky header */}
      <div className="shrink-0 flex flex-col gap-3 px-6 pt-6 pb-4 border-b border-border">
        <DialogPreviewHeader>
          <DialogPreviewTitle>Unlock all songs</DialogPreviewTitle>
          <DialogPreviewDescription>
            One-time purchase. Yours forever, no subscription.
          </DialogPreviewDescription>
        </DialogPreviewHeader>

        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <img
              src={album.cover}
              alt=""
              draggable={false}
              className="size-12 rounded-xs shrink-0 object-cover shadow-sm"
            />
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <p className="text-small font-normal leading-none truncate">
                {album.title}
              </p>
              <div className="flex items-center gap-1.5 min-w-0">
                <Badge variant="secondary">
                  <Disc3 />
                  {album.format ?? "Album"}
                </Badge>
                <span className="text-small text-muted-foreground font-normal truncate min-w-0">
                  {album.artist}
                  {album.year && (
                    <>
                      <span aria-hidden="true"> · </span>
                      <span>{album.year}</span>
                    </>
                  )}
                </span>
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

        <div className="flex items-center justify-between py-1">
          <span className="text-small text-muted-foreground">Total</span>
          <span className="text-large font-medium tabular-nums">{price}</span>
        </div>
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
        <Button>Pay {price}</Button>
      </DialogPreviewFooter>
    </DialogPreview>
  )
}
