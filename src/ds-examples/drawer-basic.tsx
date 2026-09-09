"use client"

/*
 * Drawer — one trigger per edge, each opening the real `Sheet` from that
 * side with header, scrolling body and footer. `swipeDirection` is set on
 * the root to match `side` (the root defaults to "right"), so swipe-to-dismiss
 * goes the way the drawer came in.
 */

import {
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle,
  SheetDescription, SheetFooter, SheetClose,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

const SIDES = ["right", "left", "bottom", "top"] as const
const SWIPE = { right: "right", left: "left", bottom: "down", top: "up" } as const

export default function DrawerBasicExample() {
  return (
    <div className="flex flex-wrap gap-2">
      {SIDES.map(side => (
        <Sheet key={side} swipeDirection={SWIPE[side]}>
          <SheetTrigger render={<Button variant="outline">Open from {side}</Button>} />
          <SheetContent side={side} className={side === "right" || side === "left" ? "max-w-[420px]" : "rounded-t-2xl"}>
            <SheetHeader>
              <SheetTitle>Drawer from {side}</SheetTitle>
              <SheetDescription>
                Built on Base UI's Drawer primitive — swipe-to-dismiss in the matching
                direction, focus trapping, scroll lock, and snap points.
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6 py-4 text-small text-muted-foreground">
              <p>
                The body scrolls independently of the header and footer.
                Try dragging towards the {side} edge to dismiss.
              </p>
            </div>
            <SheetFooter>
              <SheetClose render={<Button variant="outline">Cancel</Button>} />
              <SheetClose render={<Button>Save</Button>} />
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ))}
    </div>
  )
}
