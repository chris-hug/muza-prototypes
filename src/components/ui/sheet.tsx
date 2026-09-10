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
  swipeDirection = "down",
  ...props
}: DrawerPrimitive.Root.Props) {
  /* Swipe-to-dismiss, defaulting DOWN — because nearly every Sheet in the
     product is a BOTTOM sheet on a phone (the row menus, the detail menu, the
     Studio switcher, every mobile dropdown), and a bottom sheet that does not
     answer a pull-down feels broken on touch. It used to default to `right`,
     which meant those sheets could only be closed by the ✕ or the backdrop.
     A side drawer overrides it — see `CartDrawer` (`side="right"`). The
     direction lives on the ROOT, so it cannot be derived from the `side` a
     `SheetContent` declares; they have to be set as a pair. */
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
        "fixed inset-0 isolate z-50 bg-black/30",
        /* The backdrop follows the SWIPE, and it transitions rather than
           animating — for the same reason the popup does. Base UI publishes
           the drag as `--drawer-swipe-progress` (0 → 1) and the backdrop
           thins with it, so the page brightens under the finger as the sheet
           leaves. A keyframe `fade-out` instead re-darkened the page to full
           opacity the moment the finger lifted and only then faded, which is
           the flicker after a dismissal. */
        /* Opacity — including the coupling to the drag and the closing
           target — lives in `app.css`: a Tailwind arbitrary value cannot hold
           `calc(1 - var(--x, 0))` (the comma in the fallback is mangled and
           the whole declaration resolves to 0). Here: only the timing.
           150ms, not 300 — the backdrop is following a finger, and at 300 it
           lags far enough behind the sheet to read as a separate thing
           catching up. */
        "transition-opacity duration-150 ease-[cubic-bezier(0.2,0,0,1)]",
        "data-starting-style:opacity-0",
        className,
      )}
      {...props}
    />
  )
}

type SheetSide = "right" | "left" | "top" | "bottom"

/*
 * Each variant pins the popup to one edge and animates on that axis. Width /
 * height defaults can be overridden via className.
 *
 * TRANSITIONS, not keyframes. The popup follows the finger through an inline
 * transform Base UI writes while swiping, and a keyframe animation overrides
 * inline styles — so `slide-out-to-bottom`, whose frames start at 0, yanked a
 * swiped sheet back up to its resting place and only then played the exit.
 * That is the "it jumps up before it disappears" every sheet in the app had.
 *
 * A transition interpolates from whatever the element is at, which is exactly
 * where the finger left it. The resting transform reads Base UI's own swipe
 * offset (`--drawer-swipe-movement-*`), so the same declaration carries the
 * drag, the release and the exit.
 */
const SIDE_CLASSES: Record<SheetSide, string> = {
  right:
    "inset-y-0 right-0 h-dvh border-l [transform:translateX(var(--drawer-swipe-movement-x,0px))] " +
    "data-starting-style:[transform:translateX(100%)] data-ending-style:[transform:translateX(100%)]",
  left:
    "inset-y-0 left-0 h-dvh border-r [transform:translateX(var(--drawer-swipe-movement-x,0px))] " +
    "data-starting-style:[transform:translateX(-100%)] data-ending-style:[transform:translateX(-100%)]",
  top:
    "inset-x-0 top-0 w-dvw border-b [transform:translateY(var(--drawer-swipe-movement-y,0px))] " +
    "data-starting-style:[transform:translateY(-100%)] data-ending-style:[transform:translateY(-100%)]",
  bottom:
    "inset-x-0 bottom-0 w-dvw border-t [transform:translateY(var(--drawer-swipe-movement-y,0px))] " +
    "data-starting-style:[transform:translateY(100%)] data-ending-style:[transform:translateY(100%)]",
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
      {/* The VIEWPORT is not decoration: Base UI puts the swipe-to-dismiss
          gesture in it (`useSwipeDismiss` lives in `Drawer.Viewport`, and the
          popup only reads the resulting state through context). Without one,
          `swipeDirection` on the root is inert and every sheet in the app can
          only be closed by its ✕ or the backdrop — which is exactly how they
          all behaved. It is a transparent layer over the screen; the popup
          keeps its own fixed positioning, and pointer events pass through
          everywhere except the popup itself, so the backdrop still closes. */}
      <DrawerPrimitive.Viewport className="fixed inset-0 z-50 pointer-events-none">
      <DrawerPrimitive.Popup
        data-slot="sheet-content"
        // `swipeDirection` is read off the Drawer.Root context — we set it
        // there, not here. Popup keeps only visual classes.
        className={cn(
          "pointer-events-auto fixed z-50 flex flex-col bg-background text-popover-foreground border-border outline-none",
          // The one transition for open, close and swipe-release. `data-swiping`
          // turns it off: while the finger is down the popup must track it
          // exactly, not chase it.
          "transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] data-swiping:transition-none",
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
      </DrawerPrimitive.Viewport>
    </SheetPortal>
  )
}

/*
 * SheetGrabber — the 36×4 pill at the top of a bottom sheet.
 *
 * It is not decoration and it is not a control: it is the only thing on the
 * screen that says this surface can be pulled DOWN. A sheet with a ✕ can get
 * away without one, because the way out is drawn; a sheet whose only way out
 * is the gesture cannot — the release editor put Save in the corner where the
 * ✕ had been and left nothing at all saying how to leave without saving.
 *
 * `aria-hidden`: the gesture it advertises has a keyboard and screen-reader
 * equivalent already (Escape, and the dialog's own close), so announcing a
 * decorative bar would add a landmark that does nothing.
 *
 * Two placements. In the FLOW (`mx-auto mb-2`) for a sheet whose first band is
 * a list, and OVERLAID (`absolute`) for one with a bar across the top, where
 * a band of its own would cost a row. `bg-border` either way, which is what
 * both menu sheets already drew by hand.
 */
function SheetGrabber({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      data-slot="sheet-grabber"
      className={cn("h-1 w-9 shrink-0 rounded-full bg-border", className)}
      {...props}
    />
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
  SheetGrabber,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
}
