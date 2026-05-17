"use client"

/*
 * Sheet — side-anchored drawer. Built on base-ui's Drawer primitive (which
 * is purpose-built for this exact pattern, with swipe-to-dismiss, snap
 * points, focus trapping, and proper sequencing of enter/exit animations
 * already wired in). Visual treatment matches our Dialog so cart drawers,
 * filter drawers, and modals feel like one family.
 *
 * Usage:
 *   <Sheet open={open} onOpenChange={setOpen}>
 *     <SheetContent side="right" className="w-[440px]">
 *       <SheetHeader>
 *         <SheetTitle>Your cart</SheetTitle>
 *       </SheetHeader>
 *       …body…
 *     </SheetContent>
 *   </Sheet>
 */

import * as React from "react"
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function Sheet({
  swipeDirection = "right",
  ...props
}: DrawerPrimitive.Root.Props) {
  // Default swipe-to-dismiss direction matches our most common usage
  // (right-anchored drawers). Override with `swipeDirection="left|up|down"`
  // if the SheetContent's `side` is anything other than the default.
  return <DrawerPrimitive.Root swipeDirection={swipeDirection} {...props} />
}

function SheetTrigger({ ...props }: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: DrawerPrimitive.Close.Props) {
  return <DrawerPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: DrawerPrimitive.Portal.Props) {
  return <DrawerPrimitive.Portal {...props} />
}

function SheetOverlay({
  className,
  ...props
}: DrawerPrimitive.Backdrop.Props) {
  return (
    <DrawerPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/30 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className,
      )}
      {...props}
    />
  )
}

type SheetSide = "right" | "left" | "top" | "bottom"

const SIDE_CLASSES: Record<SheetSide, string> = {
  // Each variant pins the popup to one edge. Width/height defaults can be
  // overridden via className. Swipe direction matches the edge so users
  // can drag to dismiss in the natural way (right drawer → swipe right).
  right:  "inset-y-0 right-0 h-dvh data-open:slide-in-from-right data-closed:slide-out-to-right border-l",
  left:   "inset-y-0 left-0  h-dvh data-open:slide-in-from-left  data-closed:slide-out-to-left  border-r",
  top:    "inset-x-0 top-0    w-dvw data-open:slide-in-from-top    data-closed:slide-out-to-top    border-b",
  bottom: "inset-x-0 bottom-0 w-dvw data-open:slide-in-from-bottom data-closed:slide-out-to-bottom border-t",
}

interface SheetContentProps extends DrawerPrimitive.Popup.Props {
  side?: SheetSide
  showCloseButton?: boolean
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: SheetContentProps) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <DrawerPrimitive.Popup
        data-slot="sheet-content"
        // `swipeDirection` is read off the Drawer.Root context — we set it
        // there, not here. Popup keeps only visual classes.
        className={cn(
          "fixed z-50 flex flex-col bg-background text-popover-foreground border-border outline-none duration-200 data-open:animate-in data-closed:animate-out",
          SIDE_CLASSES[side],
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DrawerPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute top-3 right-3"
              />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DrawerPrimitive.Close>
        )}
      </DrawerPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      // Subtle divider so the fixed header reads as separate from the
      // scrollable body when content scrolls underneath it. (Dialog
      // doesn't need this because its body doesn't scroll.)
      className={cn(
        // gap-0.5 between title and description matches DialogFrame.
        "flex flex-col gap-0.5 px-6 pt-6 pb-4 shrink-0 border-b border-border/60",
        className,
      )}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      // Matches Dialog footer chrome — `bg-muted` + `border-t` so the
      // primary action area reads as a distinct surface from the body.
      className={cn(
        "shrink-0 border-t border-border bg-muted px-6 py-4 flex flex-col gap-2",
        className,
      )}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return (
    <DrawerPrimitive.Title
      data-slot="sheet-title"
      // Matches the actual title style used across our DialogFrame instances
      // (Create Listing, etc.): text-large + font-medium + leading-none.
      className={cn(
        "text-large font-medium leading-none text-foreground",
        className,
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: DrawerPrimitive.Description.Props) {
  return (
    <DrawerPrimitive.Description
      // Same rhythm as DialogFrame description copy.
      data-slot="sheet-description"
      className={cn("text-small text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
}
