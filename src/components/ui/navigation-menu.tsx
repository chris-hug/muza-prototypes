"use client"

import * as React from "react"
import { NavigationMenu as NavigationMenuPrimitive } from "@base-ui/react/navigation-menu"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

// ─── NavigationMenu ───────────────────────────────────────────────────────────
//
// A horizontal menubar with hover-aware popups (think marketing site nav:
// Products / Solutions / Resources, each opening a rich panel of links).
// Different from DropdownMenu — that one is per-trigger; NavigationMenu
// coordinates a row of triggers so hovering between them keeps the popup
// open and slides between contents.
// ─────────────────────────────────────────────────────────────────────────────

function NavigationMenu({
  className,
  ...props
}: NavigationMenuPrimitive.Root.Props) {
  return (
    <NavigationMenuPrimitive.Root
      data-slot="navigation-menu"
      className={cn("relative", className)}
      {...props}
    />
  )
}

function NavigationMenuList({
  className,
  ...props
}: NavigationMenuPrimitive.List.Props) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn("flex items-center gap-1", className)}
      {...props}
    />
  )
}

function NavigationMenuItem({
  ...props
}: NavigationMenuPrimitive.Item.Props) {
  return <NavigationMenuPrimitive.Item data-slot="navigation-menu-item" {...props} />
}

function NavigationMenuTrigger({
  className,
  children,
  ...props
}: NavigationMenuPrimitive.Trigger.Props) {
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(
        "inline-flex items-center gap-1 h-9 px-3 rounded-full text-small font-medium text-foreground hover:bg-muted transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown className="size-3.5 text-muted-foreground transition-transform duration-200 group-data-[popup-open]:rotate-180" />
    </NavigationMenuPrimitive.Trigger>
  )
}

function NavigationMenuContent({
  className,
  ...props
}: NavigationMenuPrimitive.Content.Props) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn("p-4 outline-none", className)}
      {...props}
    />
  )
}

function NavigationMenuLink({
  className,
  ...props
}: NavigationMenuPrimitive.Link.Props) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      className={cn(
        "block rounded-lg px-3 py-2 text-small text-foreground hover:bg-muted transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    />
  )
}

function NavigationMenuPopup({
  className,
  ...props
}: NavigationMenuPrimitive.Popup.Props) {
  return (
    <NavigationMenuPrimitive.Popup
      data-slot="navigation-menu-popup"
      className={cn(
        "rounded-xl border border-border bg-popover text-popover-foreground shadow-md min-w-[280px] origin-(--transform-origin)",
        "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 duration-150",
        className,
      )}
      {...props}
    />
  )
}

function NavigationMenuViewport({
  className,
  ...props
}: NavigationMenuPrimitive.Viewport.Props) {
  return (
    <NavigationMenuPrimitive.Viewport
      data-slot="navigation-menu-viewport"
      className={cn("relative", className)}
      {...props}
    />
  )
}

function NavigationMenuPortal({
  ...props
}: NavigationMenuPrimitive.Portal.Props) {
  return <NavigationMenuPrimitive.Portal {...props} />
}

function NavigationMenuPositioner({
  className,
  sideOffset = 6,
  ...props
}: NavigationMenuPrimitive.Positioner.Props) {
  return (
    <NavigationMenuPrimitive.Positioner
      data-slot="navigation-menu-positioner"
      sideOffset={sideOffset}
      className={cn("z-50 outline-none", className)}
      {...props}
    />
  )
}

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuPopup,
  NavigationMenuViewport,
  NavigationMenuPortal,
  NavigationMenuPositioner,
}
