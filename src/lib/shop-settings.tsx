"use client"

/*
 * Shared shop-settings store — all of the seller's shop-level state
 * lives here so multiple tabs in the Shop hub can both read it and
 * mutate it. ShopSettingsView writes to it; ShopMyProductsView reads
 * the `isShopLive` flag to gate publishing.
 *
 * State surface kept narrow and serialisable so it can lift into a
 * backend call later without touching consumers.
 */

import * as React from "react"

import type { ShippingZone } from "@/components/app/shipping-zone-editor"
import { DEFAULT_ZONES } from "@/components/app/shipping-zone-editor"
import { ORDERS, type OrderStatus } from "@/components/app/orders-view"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ShopProfile {
  displayName:  string
  location:     string
  contactEmail: string
  bio:          string
  /** Persistent URL or data-URL preview of the shop logo. */
  logoUrl?:     string
}

export interface CommTemplates {
  orderConfirmation:    string
  shippingNotification: string
  deliveryConfirmation: string
  refundIssued:         string
}

export interface NotificationPrefs {
  newOrder:        boolean
  paymentFailed:   boolean
  refundRequested: boolean
  dailyDigest:     boolean
}

export interface LegalState {
  /** Has the seller checked the marketplace-facilitator acknowledgment? */
  facilitatorAck:   boolean
  /** ISO timestamp recorded when they checked it. */
  facilitatorAckAt?: string
  /** ISO 3166-1 alpha-2 country code. */
  taxResidency:    string
}

/** Live derived flags — what gates publishing, what shows in the banner. */
export interface OnboardingChecklist {
  profile:   boolean
  legalAck:  boolean
  residency: boolean
  shipping:  boolean
}

// ─── Defaults ────────────────────────────────────────────────────────────────
//
// The prototype defaults to an *onboarded* seller (so the steady-state
// experience is what most visits look like). Manually flip the legal
// ack off in Settings → Legal to see the banner come back and the
// publish gate engage on the Products tab.

const DEFAULT_PROFILE: ShopProfile = {
  displayName:  "Sun Ra Estate",
  location:     "Birmingham, AL",
  contactEmail: "contact@sunraestate.example",
  bio:          "Stewarding Sun Ra's recorded works since 1993 — vinyl reissues, archival cassettes, and the occasional unreleased session.",
  logoUrl:      undefined,
}

const DEFAULT_TEMPLATES: CommTemplates = {
  orderConfirmation:
    "Thanks so much for your order — it means a lot. I'll let you know as soon as it ships.",
  shippingNotification:
    "Your order is on its way. The tracking link below will show updates as it moves.",
  deliveryConfirmation:
    "Your order should have arrived. I hope you love it — and thank you for supporting the work.",
  refundIssued:
    "Your refund has been issued and will appear on your original payment method within a few business days.",
}

const DEFAULT_NOTIFS: NotificationPrefs = {
  newOrder:        true,
  paymentFailed:   true,
  refundRequested: true,
  dailyDigest:     false,
}

const DEFAULT_LEGAL: LegalState = {
  facilitatorAck:   true,
  facilitatorAckAt: "2025-12-04T10:00:00.000Z",
  taxResidency:     "US",
}

// ─── Context ─────────────────────────────────────────────────────────────────

/**
 * Lightweight "editing a listing" state. When set, the shop hub swaps
 * the entire chrome for the create/edit flow so the seller isn't
 * tempted to switch tabs mid-form (and to make it visually clear
 * they're in a sub-flow, not a tab).
 *
 * `productId` present ⇒ edit mode; absent ⇒ create mode.
 */
export interface EditingState {
  productType: string
  productId?: string
}

interface ShopSettingsValue {
  profile:   ShopProfile
  setProfile:   React.Dispatch<React.SetStateAction<ShopProfile>>
  zones:     ShippingZone[]
  setZones:     React.Dispatch<React.SetStateAction<ShippingZone[]>>
  templates: CommTemplates
  setTemplates: React.Dispatch<React.SetStateAction<CommTemplates>>
  notifs:    NotificationPrefs
  setNotifs:    React.Dispatch<React.SetStateAction<NotificationPrefs>>
  legal:     LegalState
  setLegal:     React.Dispatch<React.SetStateAction<LegalState>>

  /** Per-field completion booleans, derived from the state above. */
  checklist: OnboardingChecklist
  /** All required fields complete — gates publishing. */
  isShopLive: boolean

  /** Active create/edit flow. Null when the seller is on the regular
   *  Products / Orders / Settings tabs. */
  editing:        EditingState | null
  startEditing:   (state: EditingState) => void
  stopEditing:    () => void

  /** Live per-order status map. Seeded from ORDERS, mutated as the
   *  seller marks orders shipped / delivered / refunded etc. Both the
   *  Orders tab and the Orders-tab badge read from this so the badge
   *  decrements as soon as a status flips. */
  orderStatuses:  Record<string, OrderStatus>
  setOrderStatus: (id: string, status: OrderStatus) => void
  /** Count of orders currently requiring seller action (status `new`). */
  actionRequiredCount: number
}

const ShopSettingsContext = React.createContext<ShopSettingsValue | null>(null)

export function ShopSettingsProvider({ children }: { children: React.ReactNode }) {
  const [profile,   setProfile]   = React.useState<ShopProfile>(DEFAULT_PROFILE)
  const [zones,     setZones]     = React.useState<ShippingZone[]>(DEFAULT_ZONES)
  const [templates, setTemplates] = React.useState<CommTemplates>(DEFAULT_TEMPLATES)
  const [notifs,    setNotifs]    = React.useState<NotificationPrefs>(DEFAULT_NOTIFS)
  const [legal,     setLegal]     = React.useState<LegalState>(DEFAULT_LEGAL)
  const [editing,   setEditing]   = React.useState<EditingState | null>(null)
  const [orderStatuses, setOrderStatuses] = React.useState<Record<string, OrderStatus>>(
    () => Object.fromEntries(ORDERS.map(o => [o.id, o.status])),
  )

  const startEditing  = React.useCallback((s: EditingState) => setEditing(s), [])
  const stopEditing   = React.useCallback(() => setEditing(null), [])
  const setOrderStatus = React.useCallback((id: string, status: OrderStatus) => {
    setOrderStatuses(prev => ({ ...prev, [id]: status }))
  }, [])

  const value = React.useMemo<ShopSettingsValue>(() => {
    const checklist: OnboardingChecklist = {
      profile:   profile.displayName.trim().length > 0 && profile.contactEmail.trim().length > 0,
      legalAck:  legal.facilitatorAck,
      residency: legal.taxResidency.length > 0,
      shipping:  zones.length > 0,
    }
    const isShopLive = Object.values(checklist).every(Boolean)
    const actionRequiredCount = Object.values(orderStatuses).filter(s => s === "new").length
    return {
      profile,   setProfile,
      zones,     setZones,
      templates, setTemplates,
      notifs,    setNotifs,
      legal,     setLegal,
      checklist,
      isShopLive,
      editing,
      startEditing,
      stopEditing,
      orderStatuses,
      setOrderStatus,
      actionRequiredCount,
    }
  }, [profile, zones, templates, notifs, legal, editing, startEditing, stopEditing, orderStatuses, setOrderStatus])

  return (
    <ShopSettingsContext.Provider value={value}>
      {children}
    </ShopSettingsContext.Provider>
  )
}

export function useShopSettings(): ShopSettingsValue {
  const ctx = React.useContext(ShopSettingsContext)
  if (!ctx) {
    throw new Error("useShopSettings must be used inside <ShopSettingsProvider>")
  }
  return ctx
}
