"use client"

import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── ContextMenu — styled panel surface ──────────────────────────────────────
//
// NOTE — this is NOT a behavioral primitive. It's the visual chrome (border,
// shadow, padding, item rows) for a menu panel whose open/close state and
// positioning are owned by the consumer. The sidebar uses it as a hover-
// driven flyout anchored to icon buttons (see sidebar.tsx).
//
// Why not base-ui's `Menu` or `ContextMenu` primitives?
//   · `Menu` requires a Trigger and uses its own Positioner — the sidebar
//     manages position manually (`fixed left-[56px] top={iconY}`), which
//     would fight the framework.
//   · `ContextMenu` (base-ui) is bound to right-click, not hover.
//   · `Popover` would work conceptually but requires an anchor ref pattern
//     the sidebar doesn't currently expose.
//
// If we ever need a true triggered menu, use DropdownMenu (which IS base-ui
// Menu under the hood) — this file is purely the styled surface.
//
// Figma source: L9yw4Yaec9YtAXGxP8q4fu › node 430:18718
// Adaptation (Studio flyout): node 21349:17605
//
// Anatomy
//   <ContextMenu>                — container: w-64 bg-popover border rounded-xl py-1 shadow-md
//     <ContextMenuTitle>         — section label: text-xsmall font-medium, not interactive
//     <ContextMenuItem>          — action row: pl-8 pr-2, optional left icon + right shortcut
//     <ContextMenuSubTrigger>    — same row but with ChevronRight on the right
//     <ContextMenuSeparator>     — 1px divider
//   </ContextMenu>
// ─────────────────────────────────────────────────────────────────────────────

// ── Container ─────────────────────────────────────────────────────────────────

interface ContextMenuProps {
  children: React.ReactNode
  className?: string
}

function ContextMenu({ children, className }: ContextMenuProps) {
  return (
    <div
      className={cn(
        "w-64 bg-popover border border-border rounded-xl py-1",
        "shadow-[0px_4px_6px_0px_rgba(0,0,0,0.10),0px_2px_4px_0px_rgba(0,0,0,0.06)]",
        className,
      )}
    >
      {children}
    </div>
  )
}

// ── Separator ─────────────────────────────────────────────────────────────────

function ContextMenuSeparator({ className }: { className?: string }) {
  return <div className={cn("mx-px my-1 h-px bg-border", className)} />
}

// ── Title (non-interactive section label) ──────────────────────────────────────

interface ContextMenuTitleProps {
  children: React.ReactNode
  className?: string
}

function ContextMenuTitle({ children, className }: ContextMenuTitleProps) {
  return (
    <div className={cn("px-1", className)}>
      <div className="pl-8 pr-2 py-[6px]">
        <p className="text-xsmall font-normal text-muted-foreground leading-none truncate">{children}</p>
      </div>
    </div>
  )
}

// ── Item ──────────────────────────────────────────────────────────────────────
//
// The 32px left padding (pl-8) reserves space for an optional icon.
// When `icon` is provided it sits absolutely at the left edge of the row.

interface ContextMenuItemProps {
  children: React.ReactNode
  /** Optional Lucide icon shown in the 32px left slot */
  icon?: React.ReactNode
  /** Keyboard shortcut hint rendered right-aligned, e.g. "⇧⌘P" */
  shortcut?: string
  disabled?: boolean
  className?: string
  onClick?: () => void
}

function ContextMenuItem({
  children,
  icon,
  shortcut,
  disabled,
  className,
  onClick,
}: ContextMenuItemProps) {
  return (
    <div className="px-1">
      <button
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "relative flex items-center w-full",
          "pl-8 pr-2 pt-[6px] pb-2 rounded-lg text-left",
          "text-base font-normal text-popover-foreground leading-normal",
          "hover:bg-accent hover:text-accent-foreground transition-colors",
          disabled && "opacity-50 pointer-events-none",
          className,
        )}
      >
        {icon && (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 size-4 flex items-center justify-center text-muted-foreground shrink-0">
            {icon}
          </span>
        )}
        <span className="flex-1 truncate">{children}</span>
        {shortcut && (
          <span className="ml-3 shrink-0 text-xsmall text-muted-foreground">{shortcut}</span>
        )}
      </button>
    </div>
  )
}

// ── SubTrigger (item that opens a sub-menu) ───────────────────────────────────

interface ContextMenuSubTriggerProps {
  children: React.ReactNode
  icon?: React.ReactNode
  active?: boolean
  className?: string
  onClick?: () => void
}

function ContextMenuSubTrigger({
  children,
  icon,
  active,
  className,
  onClick,
}: ContextMenuSubTriggerProps) {
  return (
    <div className="px-1">
      <button
        onClick={onClick}
        className={cn(
          "relative flex items-center w-full",
          "pl-8 pr-2 pt-[6px] pb-2 rounded-lg text-left",
          "text-base font-normal text-popover-foreground leading-normal",
          "hover:bg-accent hover:text-accent-foreground transition-colors",
          active && "bg-accent text-accent-foreground",
          className,
        )}
      >
        {icon && (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 size-4 flex items-center justify-center text-muted-foreground shrink-0">
            {icon}
          </span>
        )}
        <span className="flex-1 truncate">{children}</span>
        <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
      </button>
    </div>
  )
}

export {
  ContextMenu,
  ContextMenuSeparator,
  ContextMenuTitle,
  ContextMenuItem,
  ContextMenuSubTrigger,
}
