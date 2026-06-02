"use client"

/*
 * Subscription dialogs — the two surfaces that drive the
 * anonymous → premium upgrade flow.
 *
 *   1. `SubscriptionPromptDialog` — fires when the user trips the
 *      3-play cap. Soft pitch with the headline number + one CTA
 *      that opens (2).
 *   2. `SubscriptionCheckoutDialog` — monthly plan picker + Pay.com
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
  DialogPreview,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { LogoMark, Wordmark } from "@/components/ui/logo"
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[80vw] !max-w-[980px] sm:!max-w-[980px] p-0 gap-0 overflow-hidden bg-muted">
        {/* Hero — landing-page energy, everything centered. One
            continuous muted surface runs through hero → body →
            footer; no internal dividers, no contrasting blocks. */}
        <div className="flex flex-col items-center gap-6 px-14 pt-14 pb-12 text-center">
          {/* Stacked logo lockup (icon-on-top + wordmark below) */}
          <div className="flex flex-col items-center gap-2">
            <LogoMark className="h-16 w-auto text-foreground" />
            <Wordmark className="h-5 w-auto text-foreground" />
          </div>

          <DialogHeader className="gap-5 items-center text-center mt-2">
            <p className="text-small font-normal text-foreground">
              The Platform for Independent Music
            </p>
            <DialogTitle className="text-3xl sm:text-4xl leading-[1.05] font-medium text-foreground tracking-[-0.02em] max-w-[16ch]">
              Support your artists.
            </DialogTitle>
            <DialogDescription className="sr-only">
              Choose what you pay monthly to support the artists you listen to. As a non-profit, muza distributes 100% of your subscription to artists by your actual listening time.
            </DialogDescription>
            {/* Bullets replace the description visually — three
                short proof points carry the value prop. The
                accessible description above stays in the DOM for
                screen readers. */}
            <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-small pt-2">
              <ImpactRow>Unlimited streaming</ImpactRow>
              <ImpactRow>100% to artists</ImpactRow>
              <ImpactRow>Distributed by listening time</ImpactRow>
            </ul>
          </DialogHeader>

          {/* Amount picker — sits in the hero so it reads as part
              of the pitch, not a form. Pre-selected at $10. Label
              promoted (text-small + medium + foreground) so it reads
              as an action, not a caption. */}
          <div className="flex flex-col items-center gap-3 mt-4">
            <p className="text-small font-medium text-foreground">
              Choose your monthly amount
            </p>
            <AmountPillRow value={amount} onChange={setAmount} />
            {/* Combined micro-context: explains WHY this dialog
                appeared (3-play preview limit hit) AND the alpha
                pricing reassurance in one line. */}
            <p className="text-xsmall text-muted-foreground mt-1">
              Pay what feels right. During our alpha also $0 is fine.
            </p>
          </div>
        </div>

        {/* Footer — single centered Subscribe CTA, no flanking
            ghost buttons. Trust microcopy below carries cancel +
            non-profit signals AND the subtle 'How muza works' link
            inline. Big bottom padding lets the dialog breathe. */}
        <div className="flex items-center justify-center px-14">
          <Button
            size="lg"
            className="!h-[72px] !px-[60px] !text-lg"
            onClick={() => { onOpenChange(false); onSubscribe(amount) }}
          >
            {Number(amount) > 0
              ? `Subscribe — $${Number(amount).toFixed(2)}/mo`
              : "Start free"}
          </Button>
        </div>
        <p className="text-xsmall text-muted-foreground text-center px-14 pt-12 pb-8">
          Cancel anytime · billed monthly · muza is a registered non-profit ·{" "}
          <a
            href={ABOUT_URL}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            How muza works <ArrowUpRight className="inline size-3 align-baseline" />
          </a>
        </p>
      </DialogContent>
    </Dialog>
  )
}

function ImpactRow({ children }: { children: React.ReactNode }) {
  return (
    <li className="inline-flex items-center gap-2 whitespace-nowrap">
      <CircleCheck className="size-4 shrink-0 text-muted-foreground" />
      <span className="text-muted-foreground leading-5">{children}</span>
    </li>
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
  const monthly = Math.max(0, Number(amount) || 0)
  return (
    <DialogPreview
      showCloseButton
      className={cn("!w-full !max-w-[980px] p-0 gap-0 overflow-hidden bg-muted", className)}
    >
      <div className="flex flex-col items-center gap-6 px-14 pt-14 pb-12 text-center">
        <div className="flex flex-col items-center gap-2">
          <LogoMark className="h-16 w-auto text-foreground" />
          <Wordmark className="h-5 w-auto text-foreground" />
        </div>

        <div className="flex flex-col gap-5 items-center text-center mt-2">
          <p className="text-small font-normal text-foreground">
            The Platform for Independent Music
          </p>
          <h2 className="text-3xl sm:text-4xl leading-[1.05] font-medium text-foreground tracking-[-0.02em] max-w-[16ch]">
            Support your artists.
          </h2>
          <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-small pt-2">
            <ImpactRow>Unlimited streaming</ImpactRow>
            <ImpactRow>100% to artists</ImpactRow>
            <ImpactRow>Distributed by listening time</ImpactRow>
          </ul>
        </div>

        <div className="flex flex-col items-center gap-3 mt-4">
          <p className="text-small font-medium text-foreground">
            Choose your monthly amount
          </p>
          <AmountPillRow value={amount} onChange={setAmount} />
          <p className="text-xsmall text-muted-foreground mt-1">
            Pay what feels right. During our alpha also $0 is fine.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-14">
        <Button size="lg" className="!h-[72px] !px-[60px] !text-lg">
          {monthly > 0 ? `Subscribe — $${monthly.toFixed(2)}/mo` : "Start free"}
        </Button>
      </div>
      <p className="text-xsmall text-muted-foreground text-center px-14 pt-12 pb-8">
        Cancel anytime · billed monthly · muza is a registered non-profit ·{" "}
        <a
          href={ABOUT_URL}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          How muza works <ArrowUpRight className="inline size-3 align-baseline" />
        </a>
      </p>
    </DialogPreview>
  )
}

// ─── SubscriptionCheckoutDialog ──────────────────────────────────

type CheckoutStep = "summary" | "processing" | "success"

// Alpha pricing — pay what you want. $0 is a real option (free
// subscription during alpha); presets nudge toward modest support
// without anchoring high. The 6th slot is a "custom" pill that
// reveals a numeric field. Default $10 as the soft suggestion.
const AMOUNT_PRESETS = ["0", "5", "10", "15", "30"] as const

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

  const monthlyAmount = Math.max(0, Number(amount) || 0)
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
                <DialogTitle>Subscribe to Muza</DialogTitle>
                <DialogDescription>
                  Unlimited streaming. Cancel anytime. Money goes back to the artists you actually listen to.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-5">

              {/* ── Pay-what-you-want ─────────────────────────── */}
              <div className="flex flex-col gap-2">
                <SectionLabel>Choose what you pay monthly</SectionLabel>
                <p className="text-xsmall text-muted-foreground">
                  Muza is a non-profit. <span className="text-foreground">100% of your payment</span> is split among the artists you actually listen to. During alpha, <span className="text-foreground">$0 is a real option</span> — pay when (and what) feels right.{" "}
                  <a
                    href={ABOUT_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 text-primary-text hover:underline underline-offset-2"
                  >
                    Learn more
                    <ArrowUpRight className="size-3" />
                  </a>
                </p>
                <AmountPicker value={amount} onChange={setAmount} />
              </div>

              <Separator />

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

              <Separator />

              <div className="flex flex-col gap-2">
                <SectionLabel>Payment</SectionLabel>
                <PaycomContainer />
              </div>

              <Separator />

              <dl className="flex flex-col gap-1.5 py-1">
                <div className="flex items-center justify-between">
                  <dt className="text-small text-muted-foreground">Muza membership · monthly</dt>
                  <dd className="text-small tabular-nums">{formattedMonthly}</dd>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-border">
                  <dt className="text-small font-medium text-foreground">Total today</dt>
                  <dd className="text-large font-medium tabular-nums">
                    {monthlyAmount === 0 ? "$0.00" : `$${monthlyAmount.toFixed(2)}`}
                  </dd>
                </div>
              </dl>

              <div className="flex items-center gap-2 text-2xsmall text-muted-foreground">
                <ShieldCheck className="size-3.5" />
                <span>
                  Subscriptions processed by Pay.com. Card details never touch Muza's servers.
                </span>
              </div>
            </div>

            <DialogFooter className="m-0 shrink-0 border-t border-border bg-muted px-6 py-4 rounded-b-xl sm:rounded-b-2xl">
              <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
              <Button onClick={handleSubscribe} disabled={!emailValid}>
                {monthlyAmount === 0 ? "Start free" : `Subscribe — ${formattedMonthly}`}
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
    <div className="flex flex-wrap items-center justify-center gap-2">
      {AMOUNT_PRESETS.map(p => {
        const active = isPreset && value === p
        return (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-pressed={active}
            className={cn(
              "h-11 min-w-[88px] px-6 rounded-full text-base font-normal tabular-nums transition-colors bg-background",
              active
                ? "border border-foreground"
                : "border border-border hover:border-foreground/40",
            )}
          >
            ${p}
          </button>
        )
      })}
      {/* Custom pill — always renders as an inline input with a $
          prefix so users immediately see they can type any amount.
          No click-to-reveal step. */}
      <label
        className={cn(
          "h-11 pl-4 pr-3 inline-flex items-center gap-1 rounded-full bg-background text-base font-normal tabular-nums transition-colors",
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
          placeholder="0"
          aria-label="Custom monthly amount"
          className="w-16 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
        />
      </label>
    </div>
  )
}

function AmountPicker({
  value, onChange,
}: {
  value: string
  onChange: (next: string) => void
}) {
  const isPreset = (AMOUNT_PRESETS as readonly string[]).includes(value)
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-5 gap-1.5">
        {AMOUNT_PRESETS.map(p => {
          const active = value === p
          return (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              aria-pressed={active}
              className={cn(
                "h-10 rounded-full text-small font-medium tabular-nums transition-colors border",
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-muted",
              )}
            >
              ${p}
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xsmall text-muted-foreground">Custom</span>
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-muted-foreground pointer-events-none">$</span>
          <Input
            type="text"
            inputMode="decimal"
            value={isPreset ? "" : value}
            onChange={e => {
              const raw = e.target.value.replace(/[^0-9.]/g, "")
              onChange(raw)
            }}
            placeholder="0.00"
            className="pl-8"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xsmall text-muted-foreground pointer-events-none">/ month</span>
        </div>
      </div>
    </div>
  )
}

function PaycomContainer() {
  return (
    <div
      id="paycom-container-subscription"
      className="flex flex-col items-center justify-center gap-2 py-10 px-6 rounded-lg border border-dashed border-border bg-muted/40"
    >
      <p className="text-small font-medium text-foreground">
        Payment fields render here
      </p>
      <p className="text-2xsmall text-muted-foreground text-center max-w-[320px]">
        Card · Apple Pay · Google Pay · PayPal — all rendered by
        Pay.com's universal form.
      </p>
    </div>
  )
}
