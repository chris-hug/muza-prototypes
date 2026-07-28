"use client"

/*
 * Subscription dialogs — the two surfaces that drive the
 * anonymous → premium upgrade flow.
 *
 *   1. `SubscriptionPromptDialog` — fires when the user trips the
 *      3-play cap. Soft pitch with the headline number + one CTA
 *      that opens (2).
 *   2. `SubscriptionCheckoutDialog` — monthly plan picker + Square
 *      slot + success state. Mirrors the chrome of
 *      `PurchaseAlbumDialog` so users feel they're in the same
 *      transactional flow.
 *
 * Wire from any play attempt: call `useUserAccount().canListen(id)`
 * before starting playback; on `allowed: false`, set the prompt
 * dialog open. The prompt's "Subscribe" button hands off to the
 * checkout dialog.
 *
 * Keep both dialogs ignorant of WHERE the user came from — the
 * track / album context they were trying to access doesn't change
 * the pitch. The host wires the post-success behavior (resume
 * playback, etc.) via `onSubscribed`.
 */

import { useEffect, useState } from "react"
import { ArrowUpRight, CircleCheck, Mail, ShieldCheck } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose,
  DialogPreview, DialogPreviewTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { LogoHorizontal } from "@/components/ui/logo"
import { useUserAccount, ANONYMOUS_PLAY_LIMIT } from "@/lib/user-account"

const ABOUT_URL = "https://dev.muza-music.org/about"

const MOCK_USER_EMAIL = "naomi@example.com"

// ─── SubscriptionPromptDialog ────────────────────────────────────

export function SubscriptionPromptDialog({
  open, onOpenChange, onSubscribe,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  /** Host opens the checkout dialog with the picked amount pre-filled.
   *  The prompt closes itself. */
  onSubscribe: (amount: string) => void
}) {
  // Inline picker — pre-filled at $10 so the CTA is one click. The
  // user can override with another preset or a custom value before
  // hitting Subscribe.
  const [amount, setAmount] = useState<string>("10")
  useEffect(() => {
    if (open) setAmount("10")
  }, [open])

  const paidAmount = Math.max(0, Number(amount) || 0)
  const paidValid = paidAmount >= MIN_AMOUNT
  const ctaLabel = `Subscribe — $${paidAmount.toFixed(2)}/mo`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[80vw] !max-w-[980px] sm:!max-w-[980px] p-0 gap-0 overflow-hidden bg-muted">
        {/* Visible heading lives inside PaywallContent; these keep the
            dialog accessible (aria-labelledby / describedby). */}
        <DialogTitle className="sr-only">Support your artists.</DialogTitle>
        <DialogDescription className="sr-only">
          muza is a non-profit fixing streaming&rsquo;s broken economics: 90% of your money goes straight to the artists you actually listen to, paid by real listening time. A fairer model for music, and for the people who make it.
        </DialogDescription>
        <PaywallContent
          amount={amount}
          onAmountChange={setAmount}
          ctaLabel={ctaLabel}
          subscribeDisabled={!paidValid}
          onSubscribe={() => { onOpenChange(false); onSubscribe(amount) }}
          onFreeTrial={() => { onOpenChange(false); onSubscribe(FREE_TRIAL) }}
        />
      </DialogContent>
    </Dialog>
  )
}

// Sentinel amount that routes the checkout into its free-month mode
// (a first month on us, no charge today), instead of a paid amount.
const FREE_TRIAL = "free"
const isFreeTrial = (v: string) => v === FREE_TRIAL

// The pitch sentence — single source of truth.
const PAYWALL_PITCH =
  "90% of your money goes straight to the artists you actually listen to, paid by real listening time. A fairer model for music, and for the people who make it."

/*
 * PaywallContent — the paywall body. Two columns on desktop (why | action),
 * stacks to a single column on mobile via a container query on the DIALOG's
 * own width (not the viewport), so it adapts inside the modal at any screen
 * size. The brand lockup sits bottom-left of the left column when wide and
 * drops to a footer (last element) when stacked. Rendered by both the live
 * dialog and the DS preview. The visible <h2> is the heading; callers add an
 * sr-only DialogTitle for dialog a11y.
 */
function PaywallContent({
  amount, onAmountChange, ctaLabel, subscribeDisabled, onSubscribe, onFreeTrial,
}: {
  amount: string
  onAmountChange: (next: string) => void
  ctaLabel: string
  subscribeDisabled?: boolean
  onSubscribe?: () => void
  onFreeTrial?: () => void
}) {
  const brandLockup = (
    <>
      <LogoHorizontal className="h-6 w-auto text-foreground" />
      <span className="text-small text-muted-foreground">
        The Platform for Independent Music
      </span>
    </>
  )

  return (
    <div className="@container">
      <div className="flex flex-col @[760px]:flex-row @[760px]:min-h-[660px]">
        {/* LEFT — the why. The brand lockup + claim sit pinned to the
            bottom-left (two-column); pitch left-aligned when wide so the
            copy is readable (centered long copy is the weak spot). */}
        <div className="flex flex-col gap-8 px-10 sm:px-12 pt-12 pb-10 @[760px]:pb-12 items-center @[760px]:items-start text-center @[760px]:text-left @[760px]:flex-1 @[760px]:justify-between">
          <div className="flex flex-col items-center @[760px]:items-start gap-5">
            <h2 className="text-2xlarge @[760px]:text-4xlarge leading-[1.05] font-medium text-foreground tracking-[-0.02em] max-w-[16ch]">
              Support your artists.
            </h2>
            <p className="text-large font-normal text-foreground leading-8 max-w-[42ch]">
              {PAYWALL_PITCH}
            </p>
            <a
              href={ABOUT_URL}
              target="_blank"
              rel="noreferrer"
              className="text-small text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              See how it works <ArrowUpRight className="inline size-3 align-baseline" />
            </a>
          </div>
          {/* Two-column only: brand bottom-left. Stacked → footer (below). */}
          <div className="hidden @[760px]:flex flex-col items-start gap-2">
            {brandLockup}
          </div>
        </div>
        {/* RIGHT — the action. Action group centers in the upper space, fine
            print pins to the bottom (mirrors the brand lockup on the left).
            Divider + subtle tint only when two-column; one flat surface when
            stacked. */}
        <div className="flex flex-col items-center text-center gap-8 px-10 sm:px-12 pt-8 pb-12 @[760px]:pt-12 @[760px]:border-l border-border @[760px]:bg-background/50 @[760px]:flex-1">
          <div className="flex w-full flex-col items-center gap-4 @[760px]:flex-1 @[760px]:justify-center">
            <p className="text-small font-medium text-foreground">
              Choose your monthly amount
            </p>
            <AmountPillRow value={amount} onChange={onAmountChange} />
            {/* Subtle separator between the picker and the actions. */}
            <div className="w-full h-px bg-border/60 my-1" />
            <Button
              size="lg"
              className="!h-16 w-full !text-large"
              disabled={subscribeDisabled}
              onClick={onSubscribe}
            >
              {ctaLabel}
            </Button>
            {/* Secondary action — a first month on us for anyone not
                ready to commit to an amount yet. Same size as primary. */}
            <Button
              variant="secondary"
              size="lg"
              className="!h-16 w-full !text-large font-normal"
              onClick={onFreeTrial}
            >
              Try a free month
            </Button>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <p className="text-small text-muted-foreground text-center">
              Cancel anytime · billed monthly
            </p>
          </div>
        </div>
      </div>
      {/* Stacked only: the brand lockup becomes the footer — the very last
          thing users see (in two-column it's bottom-left, above). */}
      <div className="@[760px]:hidden flex flex-col items-center gap-2 px-10 pt-4 pb-10">
        {brandLockup}
      </div>
    </div>
  )
}

/*
 * SubscriptionPromptDialogPreview — static, always-visible version
 * of the paywall body for the design-system showcase. Renders inline
 * (no portal, no overlay) using `DialogPreview` chrome so devs see
 * the full layout at a glance.
 *
 * Body markup mirrors the live `SubscriptionPromptDialog` above;
 * keep them in sync when iterating. Interactive locally so reviewers
 * can flip the amount picker and watch the CTA label change.
 */
export function SubscriptionPromptDialogPreview({
  className,
}: {
  className?: string
} = {}) {
  const [amount, setAmount] = useState<string>("10")
  const monthly  = Math.max(0, Number(amount) || 0)
  const ctaLabel = `Subscribe — $${monthly.toFixed(2)}/mo`
  return (
    <DialogPreview
      showCloseButton
      className={cn("!w-full !max-w-[980px] p-0 gap-0 overflow-hidden bg-muted", className)}
    >
      <PaywallContent
        amount={amount}
        onAmountChange={setAmount}
        ctaLabel={ctaLabel}
        subscribeDisabled={monthly < MIN_AMOUNT}
      />
    </DialogPreview>
  )
}

/*
 * SubscriptionCheckoutDialogPreview — static, always-visible version of the
 * checkout (summary step) for the design-system showcase. Mirrors the live
 * `SubscriptionCheckoutDialog` summary markup; keep in sync when iterating.
 * Interactive locally (amount + email) so reviewers can watch the CTA update.
 */
export function SubscriptionCheckoutDialogPreview({
  className, freeTrial = false,
}: {
  className?: string
  /** Show the free-month variant (no amount / no payment, $0 today). */
  freeTrial?: boolean
} = {}) {
  const [amount, setAmount] = useState<string>("10")
  const [email, setEmail]   = useState<string>(MOCK_USER_EMAIL)
  const monthlyAmount    = Math.max(0, Number(amount) || 0)
  const formattedMonthly = `$${monthlyAmount.toFixed(2)}/mo`
  const emailValid       = /\S+@\S+\.\S+/.test(email)
  const emailId = freeTrial ? "sub-email-preview-free" : "sub-email-preview"
  return (
    <DialogPreview
      showCloseButton
      className={cn("!w-full !max-w-xl p-0 gap-0 flex flex-col", className)}
    >
      <div className="shrink-0 flex flex-col gap-3 px-6 pt-6 pb-4 border-b border-border">
        <DialogPreviewTitle>{freeTrial ? "Start your free month" : "Subscribe to Muza"}</DialogPreviewTitle>
      </div>

      <div className="px-6 py-4 flex flex-col gap-6">
        {freeTrial ? (
          <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/40 p-4">
            <p className="text-small font-medium text-foreground">Your first month is on us</p>
            <p className="text-2xsmall text-muted-foreground">
              Free for 30 days — full access, no charge today. Near the end we&rsquo;ll ask what you&rsquo;d like to pay; cancel anytime before and you&rsquo;re never billed.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <AmountPillRow value={amount} onChange={setAmount} />
            <p className="text-2xsmall text-muted-foreground">
              Pay what feels right — $1 and up.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <SectionLabel>Contact</SectionLabel>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={emailId} className="sr-only">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                id={emailId}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                className="pl-10"
              />
            </div>
            <p className="text-2xsmall text-muted-foreground">
              Receipts + cancellation emails go here.
            </p>
          </div>
        </div>

        {!freeTrial && (
          <div className="flex flex-col gap-2">
            <SectionLabel>Payment</SectionLabel>
            <SquareContainer />
          </div>
        )}

        <dl className="flex flex-col gap-1.5 py-1">
          <div className="flex items-center justify-between">
            <dt className="text-small text-muted-foreground">
              {freeTrial ? "Muza membership · first month" : "Muza membership · monthly"}
            </dt>
            <dd className="text-small tabular-nums">{freeTrial ? "Free" : formattedMonthly}</dd>
          </div>
          <div className="flex items-center justify-between pt-1.5 border-t border-border">
            <dt className="text-small font-medium text-foreground">Total today</dt>
            <dd className="text-large font-medium tabular-nums">
              {freeTrial ? "$0.00" : `$${monthlyAmount.toFixed(2)}`}
            </dd>
          </div>
        </dl>

        {!freeTrial && (
          <div className="flex items-center gap-2 text-2xsmall text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            <span>
              Subscriptions processed by Square. Card details never touch Muza's servers.
            </span>
          </div>
        )}
      </div>

      <div className="m-0 shrink-0 flex justify-end gap-2 border-t border-border bg-muted px-6 py-4 rounded-b-xl sm:rounded-b-2xl">
        <Button variant="ghost">Cancel</Button>
        <Button disabled={!emailValid || (!freeTrial && monthlyAmount < MIN_AMOUNT)}>
          {freeTrial ? "Start free month" : `Subscribe — ${formattedMonthly}`}
        </Button>
      </div>
    </DialogPreview>
  )
}

// ─── SubscriptionCheckoutDialog ──────────────────────────────────

type CheckoutStep = "summary" | "processing" | "success"

// Pay-what-you-want, $5 and up. Presets nudge toward modest support
// without anchoring high; the last slot is a "custom" pill (numeric
// field). Default $10 as the soft suggestion. A free month is offered
// separately (a secondary action), not as a $0 amount.
const AMOUNT_PRESETS = ["5", "10", "20"] as const
const MIN_AMOUNT = 1

export function SubscriptionCheckoutDialog({
  open, onOpenChange, onSubscribed, userEmail = MOCK_USER_EMAIL,
  initialAmount = "10",
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSubscribed?: (monthlyAmount: number) => void
  userEmail?: string
  /** Pre-fills the amount picker — the prompt dialog hands its
   *  selection through so the user doesn't re-pick. */
  initialAmount?: string
}) {
  const [step, setStep]     = useState<CheckoutStep>("summary")
  const [amount, setAmount] = useState<string>(initialAmount)
  const [email, setEmail]   = useState(userEmail)
  const { setTier, resetPlayCounts } = useUserAccount()

  useEffect(() => {
    if (!open) return
    setStep("summary")
    setAmount(initialAmount)
    setEmail(userEmail)
  }, [open, userEmail, initialAmount])

  const freeTrial = isFreeTrial(amount)
  const monthlyAmount = Math.max(0, Number(amount) || 0)
  const paidValid = monthlyAmount >= MIN_AMOUNT
  const formattedMonthly = `$${monthlyAmount.toFixed(2)}/mo`
  const emailValid = /\S+@\S+\.\S+/.test(email)
  const handleSubscribe = () => {
    setStep("processing")
    setTimeout(() => {
      setTier("premium")
      resetPlayCounts()
      setStep("success")
      onSubscribed?.(monthlyAmount)
    }, 1400)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] p-0 gap-0 flex flex-col">
        {step === "summary" && (
          <>
            <div className="shrink-0 flex flex-col gap-3 px-6 pt-6 pb-4 border-b border-border">
              <DialogHeader>
                <DialogTitle>{freeTrial ? "Start your free month" : "Subscribe to Muza"}</DialogTitle>
                <DialogDescription className="sr-only">
                  {freeTrial
                    ? "Confirm your email to start your free month. No charge today."
                    : "Choose what you pay monthly, add your details, and check out."}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6">

              {/* Free-trial → explainer, no amount to pick. Paid →
                  pay-what-you-want picker ($5+). */}
              {freeTrial ? (
                <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/40 p-4">
                  <p className="text-small font-medium text-foreground">Your first month is on us</p>
                  <p className="text-2xsmall text-muted-foreground">
                    Free for 30 days — full access, no charge today. Near the end we&rsquo;ll ask what you&rsquo;d like to pay; cancel anytime before and you&rsquo;re never billed.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <AmountPillRow value={amount} onChange={setAmount} />
                  <p className="text-2xsmall text-muted-foreground">
                    Pay what feels right — $1 and up.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <SectionLabel>Contact</SectionLabel>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="sub-email" className="sr-only">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="sub-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      autoComplete="email"
                      className="pl-10"
                    />
                  </div>
                  <p className="text-2xsmall text-muted-foreground">
                    Receipts + cancellation emails go here.
                  </p>
                </div>
              </div>

              {/* No card needed to start the free month — payment only
                  when there's a charge today. */}
              {!freeTrial && (
                <div className="flex flex-col gap-2">
                  <SectionLabel>Payment</SectionLabel>
                  <SquareContainer />
                </div>
              )}

              <dl className="flex flex-col gap-1.5 py-1">
                <div className="flex items-center justify-between">
                  <dt className="text-small text-muted-foreground">
                    {freeTrial ? "Muza membership · first month" : "Muza membership · monthly"}
                  </dt>
                  <dd className="text-small tabular-nums">{freeTrial ? "Free" : formattedMonthly}</dd>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-border">
                  <dt className="text-small font-medium text-foreground">Total today</dt>
                  <dd className="text-large font-medium tabular-nums">
                    {freeTrial ? "$0.00" : `$${monthlyAmount.toFixed(2)}`}
                  </dd>
                </div>
              </dl>

              {!freeTrial && (
                <div className="flex items-center gap-2 text-2xsmall text-muted-foreground">
                  <ShieldCheck className="size-3.5" />
                  <span>
                    Subscriptions processed by Square. Card details never touch Muza's servers.
                  </span>
                </div>
              )}
            </div>

            <DialogFooter className="m-0 shrink-0 border-t border-border bg-muted px-6 py-4 rounded-b-xl sm:rounded-b-2xl">
              <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
              <Button onClick={handleSubscribe} disabled={!emailValid || (!freeTrial && !paidValid)}>
                {freeTrial ? "Start free month" : `Subscribe — ${formattedMonthly}`}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center justify-center gap-4 py-10 min-h-[280px]">
            <DialogTitle className="sr-only">Processing subscription</DialogTitle>
            <Spinner size="lg" label="Processing subscription" />
            <p className="text-small text-muted-foreground">Activating your subscription…</p>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-10 min-h-[320px]">
            <DialogTitle className="sr-only">Subscription active</DialogTitle>
            <CircleCheck className="size-10 text-primary-text" strokeWidth={1.5} />
            <div className="flex flex-col gap-1.5 text-center">
              <p className="text-xlarge font-medium text-foreground">
                You're a Muza member
              </p>
              <p className="text-small text-muted-foreground max-w-[320px]">
                Unlimited streaming starts now. Receipt sent to <span className="text-foreground">{email}</span>.
              </p>
            </div>
            <Button onClick={() => onOpenChange(false)} className="mt-2">
              Start listening
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-small font-medium text-foreground", className)}>
      {children}
    </p>
  )
}

// Hero pill row — the 5 presets sit side-by-side and the 6th slot
// is a "custom" pill. Selecting custom morphs that pill into a small
// $-prefixed input the user can type into. Active pill = dark
// outline + bg-background (NOT primary fill) so the picker reads as
// neutral chrome inside the muted hero, not as a CTA.
function AmountPillRow({
  value, onChange,
}: {
  value: string
  onChange: (next: string) => void
}) {
  const isPreset = (AMOUNT_PRESETS as readonly string[]).includes(value)
  // Mirror the value into the custom input only when the user has
  // typed a non-preset amount. While a preset is selected, the custom
  // field shows blank with its '$ |' placeholder so it visibly invites
  // typing without claiming the current selection.
  const customDisplayValue = isPreset ? "" : value
  const customActive = !isPreset && value !== ""

  return (
    <div className="flex w-full flex-col items-stretch gap-2">
      <div className="grid grid-cols-3 gap-2">
        {AMOUNT_PRESETS.map(p => {
          const active = isPreset && value === p
          return (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              aria-pressed={active}
              className={cn(
                "h-11 w-full px-2 rounded-full text-base font-normal tabular-nums transition-colors bg-background",
                active
                  ? "border border-foreground"
                  : "border border-border hover:border-foreground/40",
              )}
            >
              ${p}
            </button>
          )
        })}
      </div>
      {/* Custom — full-width row under the presets, always typeable
          (no click-to-reveal). $ prefix + "choose your own" placeholder. */}
      <label
        className={cn(
          "h-11 w-full pl-4 pr-3 flex items-center gap-1 rounded-full bg-background text-base font-normal tabular-nums transition-colors",
          customActive
            ? "border border-foreground"
            : "border border-border hover:border-foreground/40 focus-within:border-foreground",
        )}
      >
        <span className="text-muted-foreground">$</span>
        <input
          type="text"
          inputMode="decimal"
          value={customDisplayValue}
          onChange={e => {
            const raw = e.target.value.replace(/[^0-9.]/g, "")
            onChange(raw)
          }}
          placeholder="choose your own"
          aria-label="Custom monthly amount"
          className="flex-1 min-w-0 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
        />
      </label>
    </div>
  )
}

function SquareContainer() {
  return (
    <div
      id="square-container-subscription"
      className="flex flex-col items-center justify-center gap-2 py-10 px-6 rounded-lg border border-dashed border-border bg-muted/40"
    >
      <p className="text-small font-medium text-foreground">
        Payment fields render here
      </p>
      <p className="text-2xsmall text-muted-foreground text-center max-w-[320px]">
        Card · Apple Pay · Google Pay · PayPal — all rendered by
        Square's universal form.
      </p>
    </div>
  )
}
