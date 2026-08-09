"use client"

import { useState, useRef, useEffect } from "react"
import { useSearchParams } from "react-router"
import { Search, ShoppingCart, User, Receipt, Wallet, Settings, LogOut, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SearchPanel } from "@/components/ui/search-panel"
import { useSearchNav } from "@/lib/use-search-nav"
import { useCart } from "@/lib/cart"
import { CartDrawer } from "@/components/app/cart-drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserAvatar } from "@/components/ui/user-avatar"
import { CURRENT_USERNAME } from "@/components/app/settings-view"

// ─── Figma source: L9yw4Yaec9YtAXGxP8q4fu node 20458:305 ─────────────────────
// States: default | focus | filled
// Background: always --background (#FEFFFB)
// Search area: on focus/filled → bg-muted + dark underline
// Placeholder: muted-foreground (rgba(84,84,69,0.75) in light)

interface TopbarProps {
  placeholder?: string
  /** Right-side slot — pass avatar, studio button, etc. */
  actions?: React.ReactNode
  /** When set, a ◀ back chevron appears at the far left (detail pages).
   *  Back lives in the chrome — not in the page gutter — so it's
   *  unaffected by the responsive `px-page` gutter. */
  onBack?: () => void
  className?: string
}

export function Topbar({
  placeholder = "Search for Artists, Albums or Songs",
  actions,
  onBack,
  className,
}: TopbarProps) {
  const [focused, setFocused] = useState(false)
  const { query, submit } = useSearchNav()
  const [value, setValue] = useState(query)
  const inputRef = useRef<HTMLInputElement>(null)

  // Keep the field in sync with the active query (navigations, deep links).
  useEffect(() => { setValue(query) }, [query])

  const isFocusOrFilled = focused || value.length > 0

  const runSearch = (q: string) => {
    submit(q)
    setValue(q)
    setFocused(false)
    inputRef.current?.blur()
  }

  // Search field — left padding tightens when the back button precedes it
  // (the button + gap already supply the left inset).
  const searchEl = (
    <div className="relative flex flex-1 h-full min-w-0">
    <div
      className={cn(
        "flex flex-1 min-w-0 h-full items-center gap-2 pr-4 transition-colors cursor-text",
        onBack ? "pl-2" : "pl-[18px]",
        // Transparent at rest so the frosted-glass header shows through;
        // opaque muted only when focused/filled (the active input field).
        // The active black underline is pulled down 1px (`-mb-px`) so it
        // sits ON the header's bottom hairline instead of stacking above
        // it — one line, not a double underline.
        isFocusOrFilled ? "bg-muted border-b border-foreground -mb-px" : "bg-transparent",
      )}
      onClick={() => inputRef.current?.focus()}
    >
      <Search className="size-5 shrink-0 text-muted-foreground" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); runSearch(value) } }}
        placeholder={placeholder}
        className={cn(
          // `min-w-0` — without it the input's intrinsic size wins over
          // `flex-1` and the placeholder runs out under the right actions.
          "flex-1 min-w-0 bg-transparent border-none outline-none text-base font-normal",
          "text-foreground placeholder:text-muted-foreground",
        )}
      />
    </div>
      {/* Recent searches / suggestions — anchored under the field. */}
      {focused && (
        <SearchPanel
          query={value}
          onPick={runSearch}
          className="absolute left-2 right-2 top-full z-50 mt-2 max-h-[60vh] overflow-y-auto"
        />
      )}
    </div>
  )

  return (
    <header
      className={cn(
        // Frosted-glass surface — same material as the mobile FooterNav
        // (`.frosted-glass`): translucent, backdrop-blurred, with a simple
        // bottom hairline. `pr-3` gives 12px right gutter so the profile
        // icon aligns with the right-edge chevrons in detail-view headers.
        "h-[54px] w-full frosted-glass border-b border-border/50 flex items-center gap-6 pr-3 shrink-0",
        className
      )}
    >
      {/* ── Search area (+ optional back chevron) ───────────────────── */}
      {onBack ? (
        <div className="flex flex-1 h-full items-center min-w-0">
          <Button variant="ghost" size="icon-sm" aria-label="Back" onClick={onBack} className="ml-2 mr-1 shrink-0">
            <ChevronLeft />
          </Button>
          {searchEl}
        </div>
      ) : searchEl}

      {/* ── Right actions slot ──────────────────────────────────────── */}
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </header>
  )
}

// ─── Mode toggle ──────────────────────────────────────────────────────────────
//
// ─── Cart icon ──────────────────────────────────────────────────────────────
//
// Renders a 40×40 hit-area icon button (visually 32px) that opens the
// CartDrawer. A small count badge sits top-right when the cart isn't empty;
// the icon hides the badge entirely at count=0 to stay quiet.

function CartButton({ onOpen }: { onOpen: () => void }) {
  const cart = useCart()

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open cart${cart.count > 0 ? ` (${cart.count} items)` : ""}`}
      className="relative size-10 flex items-center justify-center rounded-full text-foreground hover:bg-accent transition-colors"
    >
      <ShoppingCart className="size-[18px]" />
      {cart.count > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-foreground text-background text-2xsmall font-medium tabular-nums flex items-center justify-center leading-none"
        >
          {/* optical nudge — the figure ink sits a hair high in the line box */}
          <span className="relative top-[-0.5px]">{cart.count > 99 ? "99+" : cart.count}</span>
        </span>
      )}
    </button>
  )
}

/*
 * The topbar narrows with the shell (the playlist editor docks beside it), so
 * the trigger is the HEADER's width, not the viewport's — below this the search
 * field would run under the actions. The cart then folds into the profile menu.
 */
const COMPACT_HEADER = 560

function useCompactHeader(ref: React.RefObject<HTMLElement | null>) {
  const [compact, setCompact] = useState(false)
  useEffect(() => {
    const header = ref.current?.closest("header")
    if (!header) return
    const ro = new ResizeObserver(([entry]) =>
      setCompact(entry.contentRect.width < COMPACT_HEADER))
    ro.observe(header)
    return () => ro.disconnect()
  }, [ref])
  return compact
}

// ─── Profile menu (avatar dropdown) ─────────────────────────────────────────
//
// Identity-side actions only — no "Switch to Studio". Studio access lives in
// the sidebar where the user's role-switching mental model already sits.
// Exported so the mobile header reuses the SAME menu (which auto-presents as
// a bottom sheet on touch via the responsive DropdownMenu).

export function ProfileMenu({ avatarClassName, onOpenCart }: {
  avatarClassName?: string
  /** Set only when the cart button is hidden — the cart folds in here instead. */
  onOpenCart?: () => void
}) {
  const [, setParams] = useSearchParams()
  const cart = useCart()
  const go = (view: string) => {
    setParams(prev => {
      const next = new URLSearchParams(prev)
      if (view === "Home") next.delete("page")
      else next.set("page", view)
      return next
    }, { replace: true })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open profile menu"
        className="rounded-full shrink-0 hover:opacity-90 transition-opacity outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <UserAvatar username={CURRENT_USERNAME} className={avatarClassName} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-[200px]">
        {/* Cart leads the menu only when the topbar dropped its own button. */}
        {onOpenCart && (
          <>
            <DropdownMenuItem onClick={onOpenCart}>
              <ShoppingCart className="size-4" />
              Cart
              {cart.count > 0 && (
                <span className="ms-auto text-small text-muted-foreground tabular-nums">
                  {cart.count > 99 ? "99+" : cart.count}
                </span>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem>
          <User className="size-4" />
          Your profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => go("Purchases")}>
          <Receipt className="size-4" />
          Your purchases
        </DropdownMenuItem>
        {/* Wallet is per-user (buying + receiving sales both flow
             through it), so it lives here rather than inside Studio →
             Shop. From here the user can top-up for purchases AND, if
             they're a seller, wire payouts to their bank. */}
        <DropdownMenuItem onClick={() => go("Wallet")}>
          <Wallet className="size-4" />
          Wallet
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => go("Settings")}>
          <Settings className="size-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Default actions used in demo ─────────────────────────────────────────────

export function TopbarDefaultActions() {
  const ref = useRef<HTMLDivElement>(null)
  const compact = useCompactHeader(ref)
  // The drawer is owned here so BOTH triggers (button and menu item) open the
  // same one — swapping trigger must not swap drawer state.
  const [cartOpen, setCartOpen] = useState(false)

  return (
    <div ref={ref} className="flex items-center gap-2">
      {!compact && <CartButton onOpen={() => setCartOpen(true)} />}
      <ProfileMenu onOpenCart={compact ? () => setCartOpen(true) : undefined} />
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  )
}
