"use client"

import { useState, useRef } from "react"
import { useSearchParams } from "react-router"
import { Search, Sun, Moon, ShoppingCart, User, Receipt, Wallet, Settings, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/app/theme-provider"
import { useCart } from "@/lib/cart"
import { CartDrawer } from "@/components/app/cart-drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup } from "@/components/ui/toggle-group"

// ─── Figma source: L9yw4Yaec9YtAXGxP8q4fu node 20458:305 ─────────────────────
// States: default | focus | filled
// Background: always --background (#FEFFFB)
// Search area: on focus/filled → bg-muted + dark underline
// Placeholder: muted-foreground (rgba(84,84,69,0.75) in light)

interface TopbarProps {
  placeholder?: string
  /** Right-side slot — pass avatar, studio button, etc. */
  actions?: React.ReactNode
  className?: string
}

export function Topbar({
  placeholder = "Search for Artists, Albums or Songs",
  actions,
  className,
}: TopbarProps) {
  const [focused, setFocused] = useState(false)
  const [value, setValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const isFocusOrFilled = focused || value.length > 0

  return (
    <header
      className={cn(
        // Always bg-background — never white, never muted.
        // `pr-3` gives 12px right gutter so the profile icon aligns with
        // the right-edge chevrons used in detail-view headers.
        "h-[54px] w-full bg-background border-b border-border flex items-center gap-6 pr-3 shrink-0",
        className
      )}
    >
      {/* ── Search area ─────────────────────────────────────────────── */}
      {/* `pl-[18px]` aligns the search icon's visual center with the
            back-arrow icon used inside detail-view headers (28px from edge,
            since the back button's centered 16px icon sits 8px in from a
            12px-offset button). */}
      <div
        className={cn(
          "flex flex-1 h-full items-center gap-2 pl-[18px] pr-4 transition-colors cursor-text",
          isFocusOrFilled
            ? "bg-muted border-b border-foreground"
            : "bg-background"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Search icon — muted-foreground so it carries the 75% opacity */}
        <Search className="size-5 shrink-0 text-muted-foreground" />

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className={cn(
            // bg-transparent so the parent bg shows through
            "flex-1 bg-transparent border-none outline-none text-base font-normal",
            "text-foreground placeholder:text-muted-foreground",
          )}
        />
      </div>

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
// Light/dark theme picker. Built on the design-system ToggleGroup primitive
// — the visual chrome (segmented track + lifted pressed pill) lives in the
// shared component, not duplicated here.

function ModeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <ToggleGroup
      value={[theme]}
      onValueChange={(values) => {
        const next = values[0]
        if (next) setTheme(next as "light" | "dark")
      }}
      aria-label="Theme"
    >
      {/* Icon-only mode: drop horizontal padding so the pill stays square,
           leaving height to come from the group (h-[40px] - p-1 = 32px). */}
      <Toggle value="light" aria-label="Light mode" className="aspect-square px-0">
        <Sun className="size-[14px]" />
      </Toggle>
      <Toggle value="dark" aria-label="Dark mode" className="aspect-square px-0">
        <Moon className="size-[14px]" />
      </Toggle>
    </ToggleGroup>
  )
}

// ─── Cart icon ──────────────────────────────────────────────────────────────
//
// Renders a 40×40 hit-area icon button (visually 32px) that opens the
// CartDrawer. A small count badge sits top-right when the cart isn't empty;
// the icon hides the badge entirely at count=0 to stay quiet.

function CartButton() {
  const cart = useCart()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Open cart${cart.count > 0 ? ` (${cart.count} items)` : ""}`}
        className="relative size-10 flex items-center justify-center rounded-full text-foreground hover:bg-accent transition-colors"
      >
        <ShoppingCart className="size-[18px]" />
        {cart.count > 0 && (
          <span
            aria-hidden="true"
            className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-foreground text-background text-2xsmall font-medium tabular-nums flex items-center justify-center leading-none"
          >
            {cart.count > 99 ? "99+" : cart.count}
          </span>
        )}
      </button>
      <CartDrawer open={open} onOpenChange={setOpen} />
    </>
  )
}

// ─── Profile menu (avatar dropdown) ─────────────────────────────────────────
//
// Identity-side actions only — no "Switch to Studio". Studio access lives in
// the sidebar where the user's role-switching mental model already sits.

function ProfileMenu() {
  const [, setParams] = useSearchParams()
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
        className="size-10 rounded-full bg-secondary flex items-center justify-center font-medium text-small text-secondary-foreground shrink-0 overflow-hidden hover:opacity-90 transition-opacity outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span>N</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-[200px]">
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
        <DropdownMenuItem>
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
  return (
    <div className="flex items-center gap-2">
      <ModeToggle />
      <CartButton />
      <ProfileMenu />
    </div>
  )
}
