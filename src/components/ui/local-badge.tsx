"use client"

/*
 * LocalBadge — the "Imported" mark: music from the listener's own files
 * rather than the muza catalog. Same badge as "Owned" (PurchasedBadge): the
 * smallest one the system has, the word only. No glyph: a drive or folder
 * icon at 10px is detail nobody can read, and the word already says it.
 *
 * "Imported", not "Local" (what it said first, and what the code still calls
 * it): the same files show on the phone, where they are not local at all —
 * they stream from the MacBook. The word names where the music came from,
 * not where it sits. See local-library.
 *
 * After the badge, two optional things:
 *  - the offline mark, a small `CircleArrowDown`, when a copy is saved on
 *    this device — the one place the listener sees that it plays without a
 *    connection. Labelled for screen readers; the menu says it in words.
 *  - plain meta text, only when it cannot play: the reason ("Not
 *    reachable"), so a greyed item says why instead of looking broken. The
 *    file format used to follow too ("Local FLAC"); cut as detail nobody
 *    needs to tell their files from muza's.
 *
 * Shown where imported and catalog items sit in one collection (Library ›
 * All, Albums › All, a card, the album page's meta line). List rows, whose
 * meta slot is plain text, say "Imported" (or "Imported · Not connected") in
 * words instead.
 */

import { CircleArrowDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { IMPORTED } from "@/lib/local-library"
import { cn } from "@/lib/utils"

/** "Plays offline on this device" — after the "Imported" badge (a saved
 *  copy) or the "Owned" badge (downloaded files). One mark for both: the
 *  listener's question is "does this play without a connection here", not
 *  how it got there. */
export function OfflineMark({ className }: { className?: string }) {
  return <CircleArrowDown className={cn("size-3.5 shrink-0", className)} aria-label="Plays offline" role="img" />
}

export function LocalBadge({
  detail, unavailable = false, savedOffline = false, onReconnect, className,
}: {
  /** Why the source cannot play; empty while it can. Shown only where
   *  there is no `onReconnect` to show instead. */
  detail?: string
  /** The source is off and nothing is saved: the badge turns "broken". */
  unavailable?: boolean
  /** A copy is saved offline on this device. */
  savedOffline?: boolean
  /** Source off: "Reconnect" right after the badge, in place of the reason
   *  ("Not connected" said what was wrong and left you there; the link is
   *  what to do about it). To Settings › Imported music. */
  onReconnect?: () => void
  className?: string
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 min-w-0", className)}>
      {/* Broken state: the same filled badge with a small `warning` dot
          before the word — chosen from nine variants at real size. Glyphs
          lost: a plug, a broken link and an X were all too much detail (or
          the wrong meaning) at 18px; an outlined, muted badge read as
          disabled rather than "needs you". The dot is 6px, the least that
          still reads as a dot; `gap-1` between dot and word. */}
      {unavailable ? (
        <Badge variant="secondary" shape="square-xs" className="shrink-0 gap-1">
          <span aria-hidden className="size-1.5 rounded-full bg-warning" />{IMPORTED}
        </Badge>
      ) : (
        <Badge variant="secondary" shape="square-xs" className="shrink-0">{IMPORTED}</Badge>
      )}
      {savedOffline && <OfflineMark />}
      {onReconnect ? (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onReconnect() }}
          className="shrink-0 text-foreground link-underline cursor-pointer outline-none focus-ring rounded-xs"
        >
          Reconnect
        </button>
      ) : detail && (
        <span className={cn("truncate", unavailable ? "text-muted-foreground" : undefined)}>{detail}</span>
      )}
    </span>
  )
}
