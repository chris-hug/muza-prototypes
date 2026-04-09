"use client"

import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── ContextMenu ─────────────────────────────────────────────────────────────
//
// Figma source: L9yw4Yaec9YtAXGxP8q4fu › node 430:18718
// Adaptation (Studio flyout): node 21349:17605
//
// Anatomy
//   <ContextMenu>                — container: w-64 bg-popover border rounded-xl py-1 shadow-md
//     <ContextMenuTitle>         — section label: text-xs font-medium, not interactive
//     <ContextMenuItem>          — action row: pl-8 pr-2, optional left icon + right shortcut
//     <ContextMenuSubTrigger>    — same row but with ChevronRight on the right
//     <ContextMenuSeparator>     — 1px divider
//   </ContextMenu>
//
// Token mapping (light → dark)
//   bg-popover              #FEFFFB → #0D0D04
//   text-popover-foreground #0D0D04 → #FAFCF4
//   border-border           #DADDCD → #545445
//   bg-accent               rgba(246,248,238,0.75) → rgba(46,44,36,0.80)
//   text-accent-foreground  #1D1C18 → #FAFCF4
//   text-muted-foreground   rgba(84,84,69,0.75)   → rgba(250,252,244,0.50)
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
        <p className="text-xs font-normal text-muted-foreground leading-none truncate">{children}</p>
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
          <span className="ml-3 shrink-0 text-xs text-muted-foreground">{shortcut}</span>
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
