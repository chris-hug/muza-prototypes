---
title: Paywall
source: src/components/app/subscription-dialogs.tsx
related: [dialog, purchase-album-dialog, login]
usage:
  - Anonymous user trips the 3-play cap (any track) | /?page=Album
  - Settings → Subscription → 'Subscribe' (re-trigger) | /?page=Settings
---

The non-profit paywall: `SubscriptionPromptDialog` fires when an anonymous
account trips the 3-play cap and pitches the model — *why* on the left,
*action* on the right — with an inline amount picker whose choice is handed
straight to `SubscriptionCheckoutDialog`, the monthly checkout that mirrors
the album purchase.

## Two dialogs, one flow

```text
play attempt → useUserAccount().canListen(id) → allowed: false
  → SubscriptionPromptDialog (pick $5 / $10 / $20 / custom, or "Try a free month")
  → onSubscribe(amount)  — the host opens
  → SubscriptionCheckoutDialog initialAmount={amount}
  → setTier("premium") + resetPlayCounts() → "You're a Muza member"
```

Both dialogs are ignorant of *where* the user came from: the track they were
reaching for does not change the pitch. The host wires what happens after
success (resume playback) through `onSubscribed`. Settings › Subscription
opens the checkout directly, without the prompt.

## The prompt — a landing page inside a dialog

`DialogContent className="md:w-[80vw] md:max-w-[980px] p-0 gap-0 overflow-hidden bg-muted"`.
The visible heading is a plain `<h2>`; an `sr-only` `DialogTitle` /
`DialogDescription` keep the dialog labelled.

| Part | What it wears | Why |
|---|---|---|
| Root | `@container`, then `flex-col @[760px]:flex-row @[760px]:min-h-[660px]` | the split is decided by the **dialog's** width, not the window: at `80vw` the same window can hand it very different widths |
| Left — the why | `px-10 md:px-12 pt-12 pb-10`, centred text below 760, left-aligned above; `h2` `text-2xlarge @[760px]:text-4xlarge leading-[1.05] font-medium tracking-[-0.02em] max-w-[16ch]`; pitch `text-large leading-8 max-w-[42ch]`; "See how it works ↗" `text-small text-muted-foreground underline` | centred long copy is the weak spot — once there is room the copy goes ragged-right |
| Brand lockup | `LogoHorizontal h-6` + "The Platform for Independent Music" (`text-small text-muted-foreground`) — pinned bottom-left of the left column at ≥760, a footer (`@[760px]:hidden`) when stacked | last thing seen either way |
| Right — the action | `@[760px]:border-l border-border @[760px]:bg-muted`; "Choose your monthly amount" `text-small font-medium`; `AmountPillRow`; `h-px bg-border/60` rule; **Subscribe — $10.00/mo** (`size="lg"` forced to `!h-16 !text-large`); **Try a free month** (`secondary`, same size, `font-normal`); "Cancel anytime · billed monthly" pinned at the bottom | the tint is `bg-muted`, a real token, not `bg-background/50` — an alpha on a surface token produces whatever is behind it, which on the design-system stage was a colour no token has |

### The amount picker

`AmountPillRow`: a `grid grid-cols-3 gap-2` of preset pills (`$5 · $10 · $20`,
`h-11 rounded-full text-base tabular-nums bg-background`) and a full-width
custom row beneath (`h-11 rounded-full`, a `$` prefix, placeholder "choose
your own", `inputMode="decimal"`, digits and a dot only). The active pill is
a **dark outline** (`border-foreground`), never a primary fill — inside the
muted column the picker is neutral chrome, and the CTA below is the only
filled thing. Pre-selected at **$10**; the custom row is always typeable
(no click-to-reveal) and shows blank while a preset is active.
`MIN_AMOUNT = 1`: Subscribe disables below it. A free month is a separate
action with the sentinel `"free"`, not a $0 amount.

## The checkout

`DialogContent className="md:max-w-xl max-h-[90vh] p-0 gap-0 flex flex-col"`
— the same three-band shell as [Purchase Album Dialog](purchase-album-dialog.md).

| Band | Paid | Free month (`initialAmount="free"`) |
|---|---|---|
| Header | "Subscribe to Muza" | "Start your free month" |
| Amount | `AmountPillRow` + "Pay what feels right — $1 and up." | an explainer card (`rounded-lg border bg-muted/40 p-4`): free for 30 days, no charge today |
| Contact | email `Input` with a `Mail` glyph; "Receipts + cancellation emails go here." | same |
| Payment | `SquareContainer` + the `ShieldCheck` line | none — no card to start a free month |
| Totals `dl` | "Muza membership · monthly" `$x/mo`; **Total today** `$x.xx` in `text-large font-medium tabular-nums` | "· first month" Free; Total today $0.00 |
| Footer | Cancel (`ghost`) · **Subscribe — $x/mo**, enabled when the email is valid and the amount ≥ 1 | · **Start free month** |

Processing (`Spinner`, 1.4s) sets the account tier to `premium` and resets
the play counts; success shows `CircleCheck` in `text-primary-text`, "You're a
Muza member" (`text-xlarge font-medium`) and **Start listening**.

## Usage

```tsx
const [paywallOpen, setPaywallOpen] = useState(false)
const [checkoutOpen, setCheckoutOpen] = useState(false)
const [amount, setAmount] = useState("10")

<SubscriptionPromptDialog
  open={paywallOpen}
  onOpenChange={setPaywallOpen}
  onSubscribe={a => { setAmount(a); setCheckoutOpen(true) }}
/>
<SubscriptionCheckoutDialog
  open={checkoutOpen}
  onOpenChange={setCheckoutOpen}
  initialAmount={amount}
/>
```

`SubscriptionPromptDialogPreview` and `SubscriptionCheckoutDialogPreview`
(`freeTrial` for the second variant) render the bodies inline with the
`DialogPreview` chrome, interactive so a reviewer can flip the amount and
watch the CTA label change.

## Sizing

Two measures. The **window** at **768**, through the base dialog: a bottom
sheet below, and from 768 the prompt is `80vw` capped at **980px** while the
checkout is `md:max-w-xl` (576px). And the prompt's **own box**: its body is
a `@container` and goes two-column at **760px of dialog width** — reached at
a **950px window** (`760 / 0.8`). It is the one dialog that measures itself,
listed with the box components in [responsive.md](responsive.md). In the
design-system frame the preview is `!w-full !max-w-[980px]`, so the 1069 chip
(781px column) shows the split and the 768 chip (668px) shows the stack.

## Behaviour

- The prompt resets to `$10` on every open; the checkout resets `step`,
  `amount` (to `initialAmount`) and `email` on every open.
- Picking Subscribe or Try a free month **closes the prompt first**, then
  calls `onSubscribe`; the host opens the checkout with the amount pre-filled
  so nothing is re-picked.
- The checkout's success writes to the account store (`useUserAccount`) —
  `setTier("premium")`, `resetPlayCounts()` — before calling `onSubscribed`.
- The preview components carry no store binding; they are local state only.

## Open questions

- home.tsx (section prose) says the Subscribe button is "150% of `size=lg`" · `lg` is `h-12` (48px) and the button is forced to `!h-16` (64px) — 133%.
- subscription-dialogs.tsx:355–356 (comment) says "Pay-what-you-want, $5 and up … the last slot is a 'custom' pill" and the row comment (:517) says "the 5 presets … the 6th slot" · the code has three presets, a full-width custom row and `MIN_AMOUNT = 1`; the helper text says "$1 and up". The comments predate the row.
- subscription-dialogs.tsx:139 · the paywall's container is an unnamed `@container` · DESIGN_SYSTEM › "Box — the four that measure themselves" says "Name the container; an unnamed one binds to whatever ancestor is nearest". It works because the `@[760px]` queries sit directly inside it, but it is the one unnamed box.
- home.tsx (usage line) says Settings › Subscription "re-triggers" the paywall · `settings-view.tsx:258` mounts only `SubscriptionCheckoutDialog`; the prompt never shows from Settings.
- `p-0 gap-0` on both popups cancels only the phone padding; see [dialog.md](dialog.md), open questions.
