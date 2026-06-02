"use client"

/*
 * ShopView — Studio's Shop hub. Internal tabs scope every shop-related
 * concern (products listed, orders received, settings that drive the
 * shop) inside one container, so the Studio sidebar stays focused on
 * top-level workspaces (Pages / Music / Analytics / Shop).
 *
 * Tabs:
 *   - Products   — shop-my-products view (listings management)
 *   - Orders     — orders view (the seller's order queue)
 *   - Settings   — single-scroll settings page (profile, shipping,
 *                  communication, notifications, legal)
 *
 * First-time visit logic: when the shop's onboarding checklist is
 * incomplete AND the URL doesn't pin a specific sub-tab, the default
 * landing tab flips from Products to Settings so the seller is dropped
 * straight onto the onboarding banner. Once they navigate to another
 * tab the URL persists their choice and the auto-route doesn't fire
 * again that session.
 */

import { useSearchParams } from "react-router"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShopMyProductsView } from "@/components/app/shop-my-products"
import { OrdersView } from "@/components/app/orders-view"
import { ShopSettingsView } from "@/components/app/shop-settings-view"
import { ShopSettingsProvider, useShopSettings } from "@/lib/shop-settings"
import { VinylCreateListing, type VinylDraft } from "@/components/app/vinyl-create-listing"

// Tab order: Orders first — it's the daily-attention surface (new
// payments, shipments to send, refund requests). Products is the
// less-frequent inventory chore. Settings is configured once and
// rarely revisited. Matches Stripe / Shopify / Etsy seller-dashboard
// conventions (action surface leads, config trails).
const TABS = [
  { value: "orders",   label: "Orders"   },
  { value: "products", label: "Products" },
  { value: "settings", label: "Settings" },
] as const

type ShopTab = typeof TABS[number]["value"]

export function ShopView() {
  return (
    <ShopSettingsProvider>
      <ShopChrome />
    </ShopSettingsProvider>
  )
}

// ─── Inner chrome — needs the settings context to swap layouts ──────────────
//
// When the seller is in the create/edit flow (`editing !== null`), the
// tab bar is hidden entirely. The seller can't switch tabs mid-form
// since (a) it's weird UX and (b) the half-filled form has no defined
// behaviour on tab change. The form's own back / Save Draft / Publish
// affordances are the only ways out.

function ShopChrome() {
  const { editing, stopEditing } = useShopSettings()

  if (editing) return <EditingChrome onClose={stopEditing} />
  return <TabsChrome />
}

// ─── Create/edit flow ────────────────────────────────────────────────────────

function EditingChrome({ onClose }: { onClose: () => void }) {
  const { editing } = useShopSettings()
  if (!editing) return null

  // Stubbed handlers — wire to real persistence later. The form
  // always exits via the same handler so we don't drift behaviours.
  const handleSave    = (_d: VinylDraft) => onClose()
  const handlePublish = (_d: VinylDraft) => onClose()

  if (editing.productType === "Vinyl") {
    return (
      <VinylCreateListing
        mode={editing.productId ? "edit" : "create"}
        initial={editing.productId ? {
          id:      editing.productId,
          title:   "",
          type:    "Album",
          year:    "",
          variant: "",
        } : undefined}
        onCancel={onClose}
        onSave={handleSave}
        onPublish={handlePublish}
      />
    )
  }

  // Unknown product type — bail safely.
  return null
}

// ─── Normal Products/Orders/Settings tabs ────────────────────────────────────

function TabsChrome() {
  // Sub-tab persisted in the URL as `?page=Shop&shop-tab=settings` so
  // help articles and onboarding emails can deep-link straight into a
  // section (e.g. legal acknowledgment). If the URL doesn't pin a tab,
  // we fall back to a context-sensitive default: Settings when the
  // shop isn't live yet (drop the seller onto the onboarding banner),
  // Orders in steady state (the daily-attention surface).
  const { isShopLive, actionRequiredCount } = useShopSettings()
  const [params, setParams] = useSearchParams()
  const raw = params.get("shop-tab")
  const explicit = TABS.some(t => t.value === raw)
  const defaultTab: ShopTab = isShopLive ? "orders" : "settings"
  const active: ShopTab = (explicit ? raw : defaultTab) as ShopTab

  // Action-required count comes from the shared store, so flipping an
  // order's status inside the Orders tab (or anywhere else) decrements
  // the badge live.
  const actionRequired = actionRequiredCount

  const setActive = (v: ShopTab) => {
    setParams(prev => {
      const next = new URLSearchParams(prev)
      // Always write the chosen tab to the URL when the user clicks one
      // — keeps the seller's navigation choice from being overridden
      // by the auto-route logic above on subsequent renders.
      next.set("shop-tab", v)
      return next
    }, { replace: true })
  }

  return (
    <Tabs value={active} onValueChange={(v) => setActive(v as ShopTab)} className="flex flex-col h-full gap-0">

      {/* ── Tab bar ─────────────────────────────────────────────
           No outer "Shop" H1 — the active tab itself is the section
           identifier (Products / Orders / Settings), and the sidebar
           already highlights Shop. Each tab content keeps its own H1
           and toolbar inside it. */}
      <div className="shrink-0 px-page pt-6 border-b border-border">
        <TabsList variant="line" className="w-auto justify-start gap-0 h-auto pb-0">
          {TABS.map(t => (
            <TabsTrigger key={t.value} value={t.value} className="flex-none px-4 pb-3 text-small gap-2">
              {t.label}
              {/* Action-required badge on Orders. Same chrome as the
                   topbar cart-count pill: foreground fill, background
                   text — reads as "you have N things to handle". */}
              {t.value === "orders" && actionRequired > 0 && (
                <span
                  aria-label={`${actionRequired} ${actionRequired === 1 ? "new order" : "new orders"}`}
                  className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-foreground text-background text-2xsmall font-medium tabular-nums leading-none"
                >
                  {actionRequired > 99 ? "99+" : actionRequired}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* ── Tab content ─────────────────────────────────────────── */}
      {/* Each child view manages its own scroll. We hand off `flex-1
           overflow-hidden` so children that already wire `overflow-auto`
           internally (ShopMyProductsView, ShopSettingsView) win. */}
      <TabsContent value="products" className="flex-1 overflow-hidden">
        <ShopMyProductsView />
      </TabsContent>
      <TabsContent value="orders" className="flex-1 overflow-hidden">
        <OrdersView />
      </TabsContent>
      <TabsContent value="settings" className="flex-1 overflow-hidden flex flex-col">
        <ShopSettingsView />
      </TabsContent>
    </Tabs>
  )
}
