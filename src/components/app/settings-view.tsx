"use client"

/*
 * SettingsView — top-level user Settings surface, reachable from the
 * profile menu (`?page=Settings`). Four tabs (Account · General ·
 * Artist verification · About) mirroring the Figma spec at
 * file dbSHgvquI2o4TFie2iAJxv › node 7215:181705.
 *
 * Wallet stays its own route for ARTIST payouts; Settings here is the
 * fan/listener surface: profile, audio, notifications, and the
 * "become an artist" verification flow.
 */

import { useState, useEffect } from "react"
import {
  Pencil, Mic, Info, ArrowRight, Plus, Upload, Check, Loader2, X,
  MoreHorizontal, CreditCard, Trash2, Star,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/ui/user-avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/toast"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckboxField } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup } from "@/components/ui/toggle-group"
import { Toggle } from "@/components/ui/toggle"
import { Sun, Moon } from "lucide-react"
import { useTheme } from "@/components/app/theme-provider"

// Mock current user — shared so the topbar trigger and the Account
// hero render the same identity. Real wiring would come from auth.
export const CURRENT_USERNAME = "Chris-123"

// ─── Shell ────────────────────────────────────────────────────────────────────

type SettingsTab = "account" | "general" | "payments" | "verification" | "about"

export function SettingsView({
  initialTab = "account",
}: {
  initialTab?: SettingsTab
}) {
  return (
    <Tabs defaultValue={initialTab} className="flex flex-col h-full gap-0">
      {/* Header — same chrome as Studio pages (px-10 + pt-8 + border-b
           under the tab strip) so navigating here feels like every
           other top-level page. */}
      <div className="shrink-0 px-10 pt-8 border-b border-border">
        <h1 className="text-2xlarge font-medium tracking-tight mb-5">Settings</h1>
        <TabsList variant="line" className="w-auto justify-start gap-0 h-auto pb-0">
          <TabsTrigger value="account"      className="flex-none px-4 pb-3 text-small">Account</TabsTrigger>
          <TabsTrigger value="general"      className="flex-none px-4 pb-3 text-small">General</TabsTrigger>
          <TabsTrigger value="payments"     className="flex-none px-4 pb-3 text-small">Payments</TabsTrigger>
          <TabsTrigger value="verification" className="flex-none px-4 pb-3 text-small">Artist verification</TabsTrigger>
          <TabsTrigger value="about"        className="flex-none px-4 pb-3 text-small">About</TabsTrigger>
        </TabsList>
      </div>

      {/* Body — single column, ~640px reading width matching the
           Figma. Generous gap so flat sections breathe (chrome is
           kept light per the "no extra boxes" rule). */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-[760px] px-10 py-10">
          <TabsContent value="account"><AccountTab /></TabsContent>
          <TabsContent value="general"><GeneralTab /></TabsContent>
          <TabsContent value="payments"><PaymentsTab /></TabsContent>
          <TabsContent value="verification"><VerificationTab /></TabsContent>
          <TabsContent value="about"><AboutTab /></TabsContent>
        </div>
      </div>
    </Tabs>
  )
}

// ─── Small primitives ─────────────────────────────────────────────────────────

// Flat section: small heading on top, content below. No card chrome
// per the project preference for flat metadata-style layouts. Vertical
// rhythm separates sections.
function SettingsSection({
  title, action, children,
}: {
  title:     string
  action?:   React.ReactNode
  children:  React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-small font-medium text-foreground">{title}</h2>
        {action}
      </div>
      <div className="rounded-xl border border-border bg-background px-5 py-4">
        {children}
      </div>
    </section>
  )
}

// Two-column row inside a settings card — fixed-width label on the
// left, value (or read-only field) on the right. Used for the static
// "credentials" / "personal info" / "account info" layouts.
function MetaRow({
  label, value, action, layout = "row",
}: {
  label:   string
  value:   React.ReactNode
  action?: React.ReactNode
  /** `row` (default) — label on a fixed-width column to the left, value
   *  fills the rest. Good for full-width single-column lists.
   *  `stacked` — label sits above value. Better for 2-column grids
   *  where the per-cell width is too narrow for a side-by-side label. */
  layout?: "row" | "stacked"
}) {
  if (layout === "stacked") {
    return (
      <div className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <span className="text-2xsmall text-muted-foreground">{label}</span>
          <span className="text-small text-foreground truncate">{value}</span>
        </div>
        {action}
      </div>
    )
  }
  return (
    <div className="flex items-center gap-4 py-2.5 first:pt-0 last:pb-0">
      <span className="w-[180px] shrink-0 text-xsmall text-muted-foreground">{label}</span>
      <span className="flex-1 min-w-0 text-small text-foreground truncate">{value}</span>
      {action}
    </div>
  )
}

// ─── Account tab ──────────────────────────────────────────────────────────────

function AccountTab() {
  return (
    <div className="flex flex-col gap-10">
      {/* Profile identity — avatar + display name + "become an artist"
           CTA. Sits ABOVE the first labeled section as a hero row, no
           card chrome of its own (the avatar carries the focus). */}
      <ProfileIdentityRow />

      <SettingsSection
        title="Login credentials"
        action={
          <Button variant="outline" size="sm">
            <Pencil />
            Change password
          </Button>
        }
      >
        <MetaRow label="Login name" value="chris-schreiber@pm.me" />
        <div className="h-px bg-border/60" />
        <MetaRow label="Password"   value="••••••••••••••••" />
      </SettingsSection>

      <SettingsSection
        title="Personal info"
        action={
          <Button variant="outline" size="sm">
            <Pencil />
            Edit
          </Button>
        }
      >
        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
          <MetaRow layout="stacked" label="First name"    value="Chris" />
          <MetaRow layout="stacked" label="Last name"     value="Schreiber" />
          <MetaRow layout="stacked" label="Date of birth" value="01.01.1959" />
          <MetaRow layout="stacked" label="User name"     value="Chris-123" />
        </div>
      </SettingsSection>

      <SettingsSection title="Account info">
        <MetaRow
          label="Current subscription"
          value={<>muza <span className="text-muted-foreground">free</span></>}
          action={<Button variant="outline" size="sm">Manage</Button>}
        />
        <div className="h-px bg-border/60" />
        <MetaRow
          label="Default payment"
          value={<>Visa <span className="text-muted-foreground tabular-nums">•••• 4242</span></>}
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Tabs is uncontrolled — click the Payments trigger to
                // switch panels without lifting state.
                const trigger = document.querySelector(
                  'button[role="tab"][data-value="payments"], button[role="tab"][value="payments"]'
                ) as HTMLElement | null
                trigger?.click()
              }}
            >
              Manage in Payments
            </Button>
          }
        />
      </SettingsSection>
    </div>
  )
}

function ProfileIdentityRow() {
  const [editAvatarOpen, setEditAvatarOpen] = useState(false)
  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0">
        <UserAvatar
          username={CURRENT_USERNAME}
          className="size-20 text-xlarge"
        />
        <button
          type="button"
          onClick={() => setEditAvatarOpen(true)}
          aria-label="Edit profile picture"
          className="absolute -bottom-1 -right-1 size-7 rounded-full bg-secondary text-secondary-foreground border border-border hover:bg-secondary-hover transition-colors flex items-center justify-center cursor-pointer"
        >
          <Pencil className="size-3.5" />
        </button>
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-large font-medium text-foreground truncate">{CURRENT_USERNAME}</h2>
        <p className="text-xsmall text-muted-foreground mt-0.5">Listener · Joined May 2024</p>
      </div>
      <Button variant="default" size="lg" className="shrink-0">
        <Mic />
        Become an artist or label
      </Button>
      {/* Edit-picture dialog placeholder — wired when the
           cropping experience is built. The avatar edit affordance
           shows in the design but the dialog is a separate ticket. */}
      {editAvatarOpen && null}
    </div>
  )
}

// ─── General tab ──────────────────────────────────────────────────────────────

function GeneralTab() {
  const [quality, setQuality]   = useState<"default" | "max">("max")
  const [releases, setReleases] = useState(true)
  const { theme, setTheme }     = useTheme()

  return (
    <div className="flex flex-col gap-10">
      <SettingsSection title="Audio quality">
        <RadioGroup
          value={quality}
          onValueChange={(v) => setQuality(v as "default" | "max")}
          className="flex flex-col gap-3"
        >
          <RadioRow
            id="audio-default"
            value="default"
            title="Default"
            description="CD-quality audio (16-bit, 44.1 kHz)"
          />
          <RadioRow
            id="audio-max"
            value="max"
            title="Max"
            description="High-resolution audio, up to 24-bit, 192 kHz"
          />
        </RadioGroup>
        <p className="text-xsmall text-muted-foreground mt-4">
          Higher quality uses more data and may require a stable connection.
        </p>
      </SettingsSection>

      <SettingsSection title="Display">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-small text-foreground">Theme</p>
            <p className="text-xsmall text-muted-foreground mt-0.5">Switch between light and dark mode</p>
          </div>
          <ToggleGroup
            value={[theme]}
            onValueChange={(values) => {
              const next = values[0]
              if (next) setTheme(next as "light" | "dark")
            }}
            aria-label="Theme"
          >
            <Toggle value="light" aria-label="Light mode" className="aspect-square px-0">
              <Sun className="size-[14px]" />
            </Toggle>
            <Toggle value="dark" aria-label="Dark mode" className="aspect-square px-0">
              <Moon className="size-[14px]" />
            </Toggle>
          </ToggleGroup>
        </div>
      </SettingsSection>

      <SettingsSection title="Email notifications">
        <CheckboxField
          id="settings-release-notes"
          label="Official muza release notes"
          description="Get informed about new features, improvements and updates"
          checked={releases}
          onCheckedChange={(c) => setReleases(Boolean(c))}
        />
      </SettingsSection>
    </div>
  )
}

function RadioRow({
  id, value, title, description,
}: {
  id:          string
  value:       string
  title:       string
  description: string
}) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer select-none">
      <RadioGroupItem id={id} value={value} className="mt-1" />
      <div className="flex-1 min-w-0">
        <p className="text-small font-medium text-foreground leading-snug">{title}</p>
        <p className="text-xsmall text-muted-foreground mt-0.5">{description}</p>
      </div>
    </label>
  )
}

// ─── Payments tab ─────────────────────────────────────────────────────────────
//
// Lists saved payment methods (managed via Pay.com Setup Intent under
// the hood) with default selection + per-card remove. Pay.com renders
// the actual add-card form in an iframe, so "Add" opens a dialog with
// a placeholder container — wired to a real Pay.com session when the
// integration lands.

interface PaymentMethod {
  id:      string
  brand:   "Visa" | "Mastercard" | "Amex" | "PayPal"
  last4?:  string
  expiry?: string
  email?:  string  // for PayPal
  isDefault: boolean
}

const INITIAL_METHODS: PaymentMethod[] = [
  { id: "pm_1", brand: "Visa",       last4: "4242", expiry: "12 / 27", isDefault: true  },
  { id: "pm_2", brand: "Mastercard", last4: "8210", expiry: "03 / 26", isDefault: false },
]

function PaymentsTab() {
  const [methods, setMethods] = useState<PaymentMethod[]>(INITIAL_METHODS)
  // null = closed, "add" = blank add dialog, PaymentMethod = edit dialog
  const [editing, setEditing] = useState<null | "add" | PaymentMethod>(null)
  const { add } = useToast()

  const setDefault = (id: string) => {
    setMethods(prev => prev.map(m => ({ ...m, isDefault: m.id === id })))
    add({ type: "success", title: "Default payment method updated" } as never)
  }
  const remove = (id: string) => {
    setMethods(prev => prev.filter(m => m.id !== id))
    add({ type: "success", title: "Payment method removed" } as never)
  }
  const saveEdit = (id: string, patch: Partial<PaymentMethod>) => {
    setMethods(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m))
    add({ type: "success", title: "Payment method updated" } as never)
    setEditing(null)
  }
  const saveNew = (next: Omit<PaymentMethod, "id" | "isDefault">) => {
    setMethods(prev => {
      const id = `pm_${prev.length + 1}_${Date.now().toString(36)}`
      // First card auto-becomes default; subsequent stay non-default
      // unless explicitly switched.
      const isDefault = prev.length === 0
      return [...prev, { ...next, id, isDefault }]
    })
    add({ type: "success", title: "Payment method added" } as never)
    setEditing(null)
  }

  return (
    <div className="flex flex-col gap-10">
      <SettingsSection
        title="Payment methods"
        action={
          <Button variant="outline" size="sm" onClick={() => setEditing("add")}>
            <Plus />
            Add payment method
          </Button>
        }
      >
        {methods.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CreditCard className="size-8 text-muted-foreground/60" />
            <p className="text-small text-foreground">No payment methods on file</p>
            <p className="text-xsmall text-muted-foreground max-w-xs">
              Add a card or PayPal account so your next checkout is one tap.
            </p>
            <Button size="sm" onClick={() => setEditing("add")} className="mt-1">
              <Plus />
              Add payment method
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col">
            {methods.map((m, i) => (
              <li key={m.id}>
                {i > 0 && <div className="h-px bg-border/60" />}
                <PaymentMethodRow
                  method={m}
                  onEdit={() => setEditing(m)}
                  onSetDefault={() => setDefault(m.id)}
                  onRemove={() => remove(m.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </SettingsSection>

      <SettingsSection title="Billing">
        <MetaRow
          label="Receipts"
          value={<span className="text-muted-foreground">All receipts live on the Purchases page</span>}
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => { window.location.href = "/?page=Purchases" }}
            >
              View purchases
            </Button>
          }
        />
      </SettingsSection>

      <p className="text-2xsmall text-muted-foreground">
        Payment methods are stored by Pay.com — Muza never sees your full card details.
      </p>

      <PaymentMethodDialog
        state={editing}
        onClose={() => setEditing(null)}
        onSaveEdit={saveEdit}
        onSaveNew={saveNew}
      />
    </div>
  )
}

function PaymentMethodRow({
  method, onEdit, onSetDefault, onRemove,
}: {
  method:       PaymentMethod
  onEdit:       () => void
  onSetDefault: () => void
  onRemove:     () => void
}) {
  return (
    <div className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
      {/* Brand swatch — placeholder for the real card-network logo.
           A neutral monochrome wordmark works as a stand-in until the
           Pay.com brand pack is wired in. */}
      <div className="shrink-0 w-10 h-7 rounded-md border border-border bg-muted flex items-center justify-center text-2xsmall font-semibold text-foreground">
        {method.brand === "Visa"       ? "VISA"
         : method.brand === "Mastercard" ? "MC"
         : method.brand === "Amex"     ? "AMEX"
         :                                 "PP"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-small text-foreground truncate">
            {method.brand}
            {method.last4 && <span className="text-muted-foreground"> · •••• {method.last4}</span>}
            {method.email && <span className="text-muted-foreground"> · {method.email}</span>}
          </p>
          {method.isDefault && <Badge variant="secondary">Default</Badge>}
        </div>
        {method.expiry && (
          <p className="text-xsmall text-muted-foreground mt-0.5 tabular-nums">Expires {method.expiry}</p>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Manage ${method.brand} ${method.last4 ?? method.email}`}
          className="size-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="size-4" />
            Edit
          </DropdownMenuItem>
          {!method.isDefault && (
            <DropdownMenuItem onClick={onSetDefault}>
              <Star className="size-4" />
              Set as default
            </DropdownMenuItem>
          )}
          <DropdownMenuItem variant="destructive" onClick={onRemove}>
            <Trash2 className="size-4" />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// ─── Payment method dialog ────────────────────────────────────────────────────
//
// Single dialog handles both "Add" and "Edit". In edit mode the card
// number lives inside Pay.com's iframe so we can only show "•••• 4242"
// + an inline "Replace card" affordance that hands off to a fresh
// Setup Intent. Editable here directly: cardholder name, expiry,
// billing zip.

function PaymentMethodDialog({
  state, onClose, onSaveEdit, onSaveNew,
}: {
  state:        null | "add" | PaymentMethod
  onClose:      () => void
  onSaveEdit:   (id: string, patch: Partial<PaymentMethod>) => void
  onSaveNew:    (next: Omit<PaymentMethod, "id" | "isDefault">) => void
}) {
  const isOpen   = state !== null
  const isEdit   = state !== null && state !== "add"
  const existing = isEdit ? state : null

  const [cardholder, setCardholder] = useState("")
  const [expiry,     setExpiry]     = useState("")
  const [zip,        setZip]        = useState("")
  const [replacing,  setReplacing]  = useState(false)

  // Reseed local state whenever the dialog opens for a different entry.
  useEffect(() => {
    if (state === "add") {
      setCardholder(""); setExpiry(""); setZip("")
      setReplacing(true)  // add mode is always "fresh card entry"
    } else if (state) {
      setCardholder("Chris Schreiber")
      setExpiry(state.expiry ?? "")
      setZip("2100")
      setReplacing(false)
    }
  }, [state])

  if (!isOpen) return null

  const title = isEdit
    ? `Edit ${existing!.brand} •••• ${existing!.last4 ?? ""}`.trim()
    : "Add payment method"

  const description = isEdit
    ? "Update billing details or replace the card. Card numbers are stored by Pay.com — Muza never sees them."
    : "Card details are entered into Pay.com's secure form. Muza never sees the full card number."

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isEdit) {
      onSaveEdit(existing!.id, { expiry })
    } else {
      // Mock — in reality Pay.com returns the tokenised card metadata.
      onSaveNew({ brand: "Visa", last4: "0000", expiry })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {/* ── Card number row ─────────────────────────────────────
               In edit mode show a static masked-card row + "Replace
               card" toggle. Switching to replace mode swaps in the
               Pay.com placeholder. */}
          <Field label="Card">
            {isEdit && !replacing ? (
              <div className="flex items-center gap-3 h-10 px-4 rounded-full border border-border bg-muted/30">
                <CreditCard className="size-4 text-muted-foreground shrink-0" />
                <span className="text-small text-foreground flex-1 truncate">
                  {existing!.brand} •••• {existing!.last4}
                </span>
                <button
                  type="button"
                  onClick={() => setReplacing(true)}
                  className="text-xsmall text-primary hover:underline underline-offset-2"
                >
                  Replace
                </button>
              </div>
            ) : (
              <PaycomCardField />
            )}
          </Field>

          {/* ── Editable metadata ────────────────────────────────── */}
          <Field label="Cardholder name">
            <Input
              value={cardholder}
              onChange={(e) => setCardholder(e.target.value)}
              placeholder="Name on card"
            />
          </Field>
          <div className="grid grid-cols-[1fr_1fr] gap-3">
            <Field label="Expiry">
              <Input
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                placeholder="MM / YY"
                inputMode="numeric"
              />
            </Field>
            <Field label="Postal code">
              <Input
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="ZIP / Postcode"
                inputMode="numeric"
              />
            </Field>
          </div>
        </form>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={onSubmit}>
            {isEdit ? "Save changes" : "Add card"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Placeholder for the Pay.com universal-form iframe slot. Matches the
// look used in PurchaseAlbumDialog so the chrome reads as one system.
function PaycomCardField() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3 text-xsmall text-muted-foreground leading-5">
      Pay.com renders the card form here — card number, expiry, CVC, and brand detection — inside a secure iframe.
    </div>
  )
}

// ─── Artist verification tab ──────────────────────────────────────────────────

type VerificationStep = "submit" | "review" | "verified"

function VerificationTab() {
  // The flow itself is multi-step but each step is a distinct page
  // state, not a wizard the user clicks through. Demo state lets us
  // showcase both screens from the Figma.
  const [step, setStep] = useState<VerificationStep>("submit")

  return (
    <div className="flex flex-col gap-10">
      <VerificationStepper current={step} />

      {step === "submit" && (
        <VerificationSubmitForm onSubmit={() => setStep("review")} />
      )}

      {step === "review" && (
        <div className="flex flex-col gap-3">
          <p className="text-small text-foreground">
            We've received your documents and are reviewing them.
          </p>
          <p className="text-small text-muted-foreground">
            You don't need to do anything right now. We'll notify you by email as soon as there's an update.
          </p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => setStep("submit")}>
              Back to form (demo)
            </Button>
            <Button variant="outline" size="sm" onClick={() => setStep("verified")}>
              Skip to verified (demo)
            </Button>
          </div>
        </div>
      )}

      {step === "verified" && (
        <div className="flex flex-col gap-3">
          <p className="text-small text-foreground">
            Your artist profile is verified. You can now upload music as <span className="font-medium">Sun Ra</span>.
          </p>
          <Button variant="outline" size="sm" onClick={() => setStep("submit")} className="w-fit">
            Start over (demo)
          </Button>
        </div>
      )}
    </div>
  )
}

function VerificationStepper({ current }: { current: VerificationStep }) {
  const steps: { id: VerificationStep; label: string }[] = [
    { id: "submit",   label: "Submit information" },
    { id: "review",   label: "Verification in progress" },
    { id: "verified", label: "Verified" },
  ]
  const currentIdx = steps.findIndex(s => s.id === current)

  // Two-row layout per step: label above, dot below. Connector lines
  // live INSIDE the dot row at the dots' vertical center, so they
  // visually pass through the circle midline without colliding with
  // the labels. Labels stay legible above no matter what's in the dot.
  return (
    <ol className="flex items-start gap-0 w-full">
      {steps.map((s, i) => {
        const isDone   = i < currentIdx
        const isActive = i === currentIdx
        const isLast   = i === steps.length - 1
        const filled   = isDone || isActive

        return (
          <li
            key={s.id}
            className={cn(
              "flex flex-col gap-3 min-w-0",
              isLast ? "flex-initial shrink-0" : "flex-1",
            )}
          >
            {/* Label row — sits above the dot, left-aligned to the
                 dot's left edge so the eye reads label → dot as one
                 unit even at narrow widths. */}
            <span
              className={cn(
                "text-small leading-none truncate pl-0",
                filled ? "text-foreground font-medium" : "text-muted-foreground",
              )}
            >
              {i + 1}. {s.label}
            </span>

            {/* Dot + trailing connector. The connector starts at the
                 dot's right edge and runs to the next step's dot. */}
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "size-8 shrink-0 rounded-full flex items-center justify-center transition-colors",
                  filled
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background text-muted-foreground",
                )}
              >
                {isDone
                  ? <Check className="size-4" strokeWidth={2.5} />
                  : isActive && s.id === "review"
                  ? <Loader2 className="size-4 animate-spin" />
                  : <span className="text-xsmall font-medium tabular-nums">{i + 1}</span>}
              </span>
              {!isLast && (
                <span
                  className={cn(
                    "flex-1 h-px transition-colors",
                    isDone ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function VerificationSubmitForm({ onSubmit }: { onSubmit: () => void }) {
  const [extraLinks, setExtraLinks] = useState<string[]>([])
  const [fileName, setFileName]     = useState<string | null>(null)

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit() }}
      className="flex flex-col gap-8"
    >
      <SettingsSection title="Verify your artist profile">
        <p className="text-xsmall text-muted-foreground mb-4">
          To link your account to an artist profile, we need to confirm that you represent this artist. This usually takes a few days.
        </p>
        <div className="flex flex-col gap-4">
          <Field label="Artist or label name">
            <Input defaultValue="Sun Ra" />
          </Field>
          <Field label="Reference link">
            <Input placeholder="Wikipedia, press, label, etc." />
          </Field>
          <Field label="Webpage">
            <Input placeholder="Official website" />
          </Field>
          {extraLinks.map((_, i) => (
            <Field key={i} label={`Additional link ${i + 1}`}>
              <div className="flex items-center gap-2">
                <Input placeholder="Any other relevant URL" className="flex-1" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove additional link ${i + 1}`}
                  onClick={() => setExtraLinks((prev) => prev.filter((_, j) => j !== i))}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <X />
                </Button>
              </div>
            </Field>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="self-start"
            onClick={() => setExtraLinks((prev) => [...prev, ""])}
          >
            <Plus />
            Add link
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection title="Identity verification">
        <p className="text-xsmall text-muted-foreground mb-4">
          Your document is encrypted and used only for identity verification. We never share it with third parties.
        </p>
        <Field label="ID for verification">
          <label className="flex items-center gap-3 rounded-full border border-border bg-background pl-1 pr-4 h-10 cursor-pointer hover:border-foreground/30 transition-colors">
            <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-secondary text-secondary-foreground text-xsmall font-medium">
              <Upload className="size-3.5" />
              Upload ID
            </span>
            <span className="flex-1 min-w-0 text-xsmall text-muted-foreground truncate">
              {fileName ?? "No file chosen"}
            </span>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              className="sr-only"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            />
          </label>
        </Field>
        <p className="text-2xsmall text-muted-foreground mt-2">
          JPG, PDF or PNG · max size 10 MB
        </p>
      </SettingsSection>

      <div className="flex justify-end">
        <Button type="submit" size="lg">
          Submit for verification
          <ArrowRight />
        </Button>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

// ─── About tab ────────────────────────────────────────────────────────────────

function AboutTab() {
  return (
    <article className="flex flex-col gap-5 text-small text-foreground leading-6">
      <p className="text-large font-medium leading-snug">
        muza is the platform for independent music.
      </p>
      <p className="text-muted-foreground">
        Built as a non-profit, muza exists to fix streaming's broken economics. Instead of paying artists per click, muza rewards attention — distributing revenue based on actual listening time and direct listener support. Your subscription goes only to the artists you play.
      </p>
      <p className="text-muted-foreground">
        We combine subscription streaming with direct artist uploads, giving musicians full control over how their music is shared and monetised. Artists retain ownership, receive up to 90–95% of revenue, and are paid directly — no hidden intermediaries.
      </p>
    </article>
  )
}
