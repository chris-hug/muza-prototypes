"use client"

/*
 * PurchasedBadge — the "Owned" marker shown wherever an album the
 * user has paid for appears.
 *
 * Plain inline check + "Owned" text in foreground color. No pill
 * chrome (border / bg fill) — the bg-muted pill version we tried
 * read too loud next to the surrounding meta in card / header
 * rows. Just the glyph + label, sized to fit alongside body text.
 *
 * Consumers: `AlbumCard` (pricing row), `MediaHeader` (meta line).
 * Both call this component directly rather than inlining the
 * markup, so any tweak (icon swap, size bump, copy change) lands
 * everywhere in one edit.
 */

import { CircleCheckBig } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PurchasedBadgeProps {
  /** Caller-controlled text size class — defaults to `text-small`
   *  (18px). The icon scales relative to text via `size-3.5`. Override
   *  by passing e.g. `text-2xsmall` when squeezing into a tight row. */
  className?: string
}

export function PurchasedBadge({ className }: PurchasedBadgeProps) {
  return (
    <span
      aria-label="Owned"
      className={cn(
        "inline-flex items-center gap-1 text-small text-foreground",
        className,
      )}
    >
      <CircleCheckBig className="size-3.5 shrink-0" />
      Owned
    </span>
  )
}
