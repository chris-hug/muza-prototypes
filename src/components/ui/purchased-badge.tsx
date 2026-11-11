"use client"

/*
 * PurchasedBadge — the "Owned" marker shown wherever an album the user has
 * paid for appears.
 *
 * The smallest Badge the system has (`secondary` · `square-xs`: 18px, no
 * border, the muted fill), with the word only. It used to be a check glyph +
 * "Owned" as bare inline text; that read fine alone, but once local files got
 * their own marker the two needed to be one quiet family, and at this size a
 * glyph is detail nobody can see. An earlier `bg-muted` pill was dropped for
 * reading too loud — that was the 26px chip; this is 18px and borderless.
 *
 * Consumers: `AlbumCard` (pricing row), `MediaHeader` (meta line), the library
 * table. Its sibling for your own files is `LocalBadge`.
 */

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface PurchasedBadgeProps {
  className?: string
}

export function PurchasedBadge({ className }: PurchasedBadgeProps) {
  return (
    <Badge variant="secondary" shape="square-xs" className={cn("shrink-0", className)}>
      Owned
    </Badge>
  )
}
