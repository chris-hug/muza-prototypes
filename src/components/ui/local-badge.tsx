"use client"

/*
 * LocalBadge — the marker for music from the listener's own files rather than
 * the muza catalog. Same badge as "Owned" (PurchasedBadge): the smallest one
 * the system has, the word only. No glyph: a drive or folder icon at 10px is
 * detail nobody can read, and the word already says it.
 *
 * What follows the badge is plain meta text, not part of it: the file format
 * ("FLAC"), or — when the drive or server holding the files is off — the
 * reason it cannot play ("Home server is not connected"), so a greyed item
 * says why instead of looking broken.
 *
 * Shown where local and catalog items sit in one collection (Library › All,
 * Albums › All, a card, the album page's meta line). List rows, whose meta slot
 * is plain text, say "Local · FLAC" in words instead.
 */

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function LocalBadge({
  detail, unavailable = false, className,
}: {
  /** The format, or the unavailable reason. */
  detail?: string
  unavailable?: boolean
  className?: string
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 min-w-0", className)}>
      <Badge variant="secondary" shape="square-xs" className="shrink-0">Local</Badge>
      {detail && (
        <span className={cn("truncate", unavailable ? "text-muted-foreground" : undefined)}>{detail}</span>
      )}
    </span>
  )
}
