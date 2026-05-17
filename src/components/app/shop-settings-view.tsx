"use client"

/*
 * ShopSettingsView — single-scroll settings page hosted inside the Shop
 * tab on Studio. Replaces the old `shop-settings-sheet.tsx` drawer once
 * the surface area grew past 3-4 fields.
 *
 * Sections (in scroll order):
 *   1. Shop profile          — display name, location, contact, bio, logo
 *   2. Shipping              — zone editor (ported from the sheet)
 *   3. Communication         — per-email-type personal-message templates
 *   4. Notifications         — when Muza pings the seller about orders
 *   5. Legal                 — marketplace-facilitator ack + tax residency
 *
 * First-time visit shows an "Onboarding" banner above section 1 with a
 * 4-item checklist (Profile / Legal ack / Tax residency / Shipping).
 * Once all required items pass, the banner collapses to a "Shop is live"
 * status row.
 */

import { useRef, useState } from "react"
import {
  CheckCircle2, Circle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Combobox, ComboboxTrigger, ComboboxContent, ComboboxItem,
} from "@/components/ui/combobox"
import { CheckboxField } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import { ShippingZoneEditor } from "@/components/app/shipping-zone-editor"
import { COUNTRY_CODES, countryName } from "@/lib/countries"
import {
  useShopSettings,
  type ShopProfile, type CommTemplates, type NotificationPrefs, type LegalState,
} from "@/lib/shop-settings"

// ─── Component ───────────────────────────────────────────────────────────────

export function ShopSettingsView() {
  const { add: toast } = useToast()
  const {
    profile,   setProfile,
    zones,     setZones,
    templates, setTemplates,
    notifs,    setNotifs,
    legal,     setLegal,
    checklist, isShopLive,
  } = useShopSettings()

  const completedCount = Object.values(checklist).filter(Boolean).length
  const allComplete    = isShopLive

  return (
    <div className="flex-1 overflow-auto">
      {/* Same body chrome as the create-listing flow: 720px column, px-8
           py-10, gap-6 between boxed sections. */}
      <div className="max-w-[720px] mx-auto px-8 py-10 flex flex-col gap-6">

        <OnboardingBanner
          checklist={checklist}
          allComplete={allComplete}
          completedCount={completedCount}
        />

        <SectionShell id="shop-profile" title="Shop profile"
          description="How buyers see your shop. Display name and contact email are required to go live.">
          <ProfileSection profile={profile} onChange={setProfile} />
        </SectionShell>

        <SectionShell id="shipping" title="Shipping"
          description="Default zones inherited by every listing. Buyers are matched to the first zone that contains their country — Worldwide acts as the fall-through.">
          <ShippingZoneEditor zones={zones} onChange={setZones} />
        </SectionShell>

        <SectionShell id="communication" title="Communication"
          description="Your personal message appears at the top of every email Muza sends to your buyers. The receipt, shipping address, and tracking info render automatically underneath.">
          <CommunicationSection templates={templates} onChange={setTemplates} />
        </SectionShell>

        <SectionShell id="notifications" title="Notifications"
          description="Choose which events ping you. Email and in-app pings fire together — split routing is on the roadmap.">
          <NotificationsSection prefs={notifs} onChange={setNotifs} />
        </SectionShell>

        <SectionShell id="legal" title="Legal"
          description="Muza is the merchant of record for sales through Muza. Your responsibility is income tax in your jurisdiction.">
          <LegalSection legal={legal} onChange={setLegal} />
        </SectionShell>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline">Discard</Button>
          <Button onClick={() => toast({ type: "success", title: "Shop settings saved" } as never)}>
            Save changes
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Onboarding banner ───────────────────────────────────────────────────────

function OnboardingBanner({
  checklist, allComplete, completedCount,
}: {
  checklist: { profile: boolean; legalAck: boolean; residency: boolean; shipping: boolean }
  allComplete: boolean
  completedCount: number
}) {
  if (allComplete) {
    return (
      <div className="flex items-center justify-between gap-3 px-5 py-3 rounded-xl border border-border bg-background">
        <div className="flex items-center gap-2.5">
          <span className="size-2 rounded-full bg-green-600 dark:bg-green-400 shrink-0" aria-hidden="true" />
          <p className="text-small text-foreground">Your shop is live.</p>
        </div>
        <p className="text-xsmall text-muted-foreground tabular-nums">All required setup complete</p>
      </div>
    )
  }

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-5 flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-large font-medium text-foreground">Welcome to Muza. Set up your shop to go live.</p>
          <p className="text-xsmall text-muted-foreground mt-1">
            Required: profile, legal acknowledgment, tax residency, shipping zones.
          </p>
        </div>
        <span className="text-xsmall text-muted-foreground tabular-nums shrink-0">
          {completedCount} / 4
        </span>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        <ChecklistItem done={checklist.profile}   label="Shop profile"    onClick={() => scrollTo("shop-profile")} />
        <ChecklistItem done={checklist.legalAck}  label="Legal acknowledgment" onClick={() => scrollTo("legal")} />
        <ChecklistItem done={checklist.residency} label="Tax residency"   onClick={() => scrollTo("legal")} />
        <ChecklistItem done={checklist.shipping}  label="Shipping zones"  onClick={() => scrollTo("shipping")} />
      </ul>
    </div>
  )
}

function ChecklistItem({ done, label, onClick }: { done: boolean; label: string; onClick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="group/check flex items-center gap-2 w-full text-left outline-none rounded-md focus-visible:underline underline-offset-3"
      >
        {done
          ? <CheckCircle2 className="size-4 text-green-600 dark:text-green-400 shrink-0" aria-hidden="true" />
          : <Circle className="size-4 text-muted-foreground shrink-0" aria-hidden="true" />
        }
        <span className={cn(
          "text-small",
          done ? "text-muted-foreground line-through" : "text-foreground group-hover/check:underline underline-offset-3",
        )}>
          {label}
        </span>
      </button>
    </li>
  )
}

// ─── Section shell ───────────────────────────────────────────────────────────
//
// Same box chrome as the create-listing flow so the two seller-facing
// long-form pages share visual language: boxed section, plain h2 (no
// leading icon), optional description below.

function SectionShell({
  id, title, description, children,
}: {
  id:           string
  title:        string
  description?: string
  children:     React.ReactNode
}) {
  return (
    <section
      id={id}
      className="scroll-mt-8 bg-background border border-border rounded-xl px-8 py-6 flex flex-col gap-6"
    >
      <header className="flex flex-col gap-1">
        <h2 className="text-base font-medium text-foreground">{title}</h2>
        {description && (
          <p className="text-xsmall text-muted-foreground max-w-prose">{description}</p>
        )}
      </header>
      {children}
    </section>
  )
}

// ─── Shop profile section ────────────────────────────────────────────────────

function ProfileSection({ profile, onChange }: {
  profile:  ShopProfile
  onChange: (next: ShopProfile) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const update = <K extends keyof ShopProfile>(key: K, value: ShopProfile[K]) =>
    onChange({ ...profile, [key]: value })

  return (
    <div className="flex flex-col gap-5">

      {/* Logo + uploader */}
      <div className="flex items-center gap-4">
        <Avatar className="size-16 shrink-0">
          {profile.logoUrl && <AvatarImage src={profile.logoUrl} alt="Shop logo" />}
          <AvatarFallback className="text-base font-medium">
            {profile.displayName.slice(0, 2).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              Upload logo
            </Button>
            {profile.logoUrl && (
              <Button variant="ghost" size="sm" onClick={() => update("logoUrl", undefined)}>
                Remove
              </Button>
            )}
          </div>
          <p className="text-2xsmall text-muted-foreground">PNG or JPG, square aspect, ≥ 256×256.</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) update("logoUrl", URL.createObjectURL(f))
          }}
        />
      </div>

      {/* Name + location pair */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profile-name">Display name</Label>
          <Input
            id="profile-name"
            value={profile.displayName}
            onChange={(e) => update("displayName", e.target.value)}
            placeholder="Your shop name"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profile-location">Location</Label>
          <Input
            id="profile-location"
            value={profile.location}
            onChange={(e) => update("location", e.target.value)}
            placeholder="City, region"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-email">Contact email</Label>
        <Input
          id="profile-email"
          type="email"
          value={profile.contactEmail}
          onChange={(e) => update("contactEmail", e.target.value)}
          placeholder="contact@yourshop.com"
          hint="Used by buyers when they click Contact seller on an order."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-bio">Bio</Label>
        <Textarea
          id="profile-bio"
          value={profile.bio}
          onChange={(e) => update("bio", e.target.value)}
          rows={3}
          placeholder="One or two sentences about your shop."
        />
      </div>
    </div>
  )
}

// ─── Communication section ───────────────────────────────────────────────────

const TEMPLATE_FIELDS: Array<{ key: keyof CommTemplates; label: string; hint: string }> = [
  { key: "orderConfirmation",    label: "Order confirmation",    hint: "Sent immediately after payment succeeds." },
  { key: "shippingNotification", label: "Shipping notification", hint: "Sent when you mark an order as shipped." },
  { key: "deliveryConfirmation", label: "Delivery confirmation", hint: "Sent when you mark an order as delivered." },
  { key: "refundIssued",         label: "Refund issued",         hint: "Sent when you issue a refund on an order." },
]

function CommunicationSection({ templates, onChange }: {
  templates: CommTemplates
  onChange:  (next: CommTemplates) => void
}) {
  return (
    <div className="flex flex-col gap-5">
      {TEMPLATE_FIELDS.map(f => (
        <div key={f.key} className="flex flex-col gap-1.5">
          <Label htmlFor={`tpl-${f.key}`}>{f.label}</Label>
          <Textarea
            id={`tpl-${f.key}`}
            value={templates[f.key]}
            onChange={(e) => onChange({ ...templates, [f.key]: e.target.value })}
            rows={3}
            hint={f.hint}
          />
        </div>
      ))}
    </div>
  )
}

// ─── Notifications section ───────────────────────────────────────────────────

const NOTIF_FIELDS: Array<{ key: keyof NotificationPrefs; label: string; hint: string }> = [
  { key: "newOrder",        label: "New order",                hint: "Ping me whenever a buyer pays." },
  { key: "paymentFailed",   label: "Payment failed",           hint: "Ping me when a capture fails so I can follow up." },
  { key: "refundRequested", label: "Refund requested by buyer",hint: "Ping me when a buyer submits a refund request." },
  { key: "dailyDigest",     label: "Daily order digest",       hint: "One summary email per day with everything that happened." },
]

function NotificationsSection({ prefs, onChange }: {
  prefs:    NotificationPrefs
  onChange: (next: NotificationPrefs) => void
}) {
  return (
    <ul className="flex flex-col">
      {NOTIF_FIELDS.map((f, i) => (
        <li
          key={f.key}
          className={cn(
            "flex items-start justify-between gap-4 py-4",
            i > 0 && "border-t border-border/60",
          )}
        >
          <div className="min-w-0">
            <p className="text-small text-foreground">{f.label}</p>
            <p className="text-xsmall text-muted-foreground mt-0.5">{f.hint}</p>
          </div>
          <Switch
            checked={prefs[f.key]}
            onCheckedChange={(v) => onChange({ ...prefs, [f.key]: v === true })}
            aria-label={f.label}
          />
        </li>
      ))}
    </ul>
  )
}

// ─── Legal section ───────────────────────────────────────────────────────────

function LegalSection({ legal, onChange }: {
  legal:    LegalState
  onChange: (next: LegalState) => void
}) {
  // Once accepted, the acknowledgment is read-only — re-acceptance only
  // triggers on terms-version bumps (not modeled in the prototype).
  const ackLocked = legal.facilitatorAck && !!legal.facilitatorAckAt

  return (
    <div className="flex flex-col gap-5">

      {/* Facilitator acknowledgment */}
      <div className={cn(
        "rounded-xl border border-border bg-background p-5 flex flex-col gap-3",
        ackLocked && "bg-muted/30",
      )}>
        <CheckboxField
          id="facilitator-ack"
          checked={legal.facilitatorAck}
          disabled={ackLocked}
          onCheckedChange={(v) => {
            const checked = v === true
            onChange({
              ...legal,
              facilitatorAck:   checked,
              facilitatorAckAt: checked ? new Date().toISOString() : undefined,
            })
          }}
          label="I acknowledge Muza is the merchant of record."
          description="Muza issues receipts to buyers in its own name and, where required, collects and remits taxes on those sales. I'm responsible for filing my own income tax on payouts I receive from Muza in my jurisdiction."
        />
        {ackLocked && (
          <p className="text-2xsmall text-muted-foreground pl-7 tabular-nums">
            Accepted {new Date(legal.facilitatorAckAt!).toLocaleString("en-GB", {
              day: "numeric", month: "short", year: "numeric",
            })}
          </p>
        )}
      </div>

      {/* Tax residency */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tax-residency">Tax residency</Label>
        <Combobox
          items={COUNTRY_CODES}
          itemToStringLabel={(c) => countryName(String(c))}
          value={legal.taxResidency}
          onValueChange={(v) => v && onChange({ ...legal, taxResidency: String(v) })}
        >
          <ComboboxTrigger placeholder="Search countries…" />
          <ComboboxContent className="max-h-[280px] overflow-y-auto">
            {(code: string) => (
              <ComboboxItem key={code} value={code}>{countryName(code)}</ComboboxItem>
            )}
          </ComboboxContent>
        </Combobox>
        <p className="text-xsmall text-muted-foreground">
          Used to determine which annual sales-report format Muza issues to you
          (1099-K for US sellers, DAC7 for EU, etc.).
        </p>
      </div>
    </div>
  )
}

