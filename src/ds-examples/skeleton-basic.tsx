"use client"

/*
 * Skeleton — the three placeholder shapes the app's loading states are
 * built from: a text block with a pill action, an artist row (round
 * avatar + two lines), and an album card (square cover + two lines). Each
 * bar is the real `Skeleton`, sized by the caller: the component itself
 * carries only the pulse, the `bg-muted` fill and a `rounded-md` corner,
 * which the round and square shapes override.
 */

import { Skeleton } from "@/components/ui/skeleton"

export default function SkeletonBasicExample() {
  return (
    <div className="flex flex-wrap gap-8 items-start">
      {/* Text block — heading, a line, and a pill-shaped action. */}
      <div className="flex flex-col gap-2.5 w-64">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-3.5 w-3/5" />
        <Skeleton className="h-9 w-28 rounded-full mt-1" />
      </div>

      {/* Artist row — round avatar, name, meta. */}
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      {/* Album card — square cover at the image radius (`rounded-xs`, 2px),
          then title and artist. */}
      <div className="flex flex-col gap-2.5">
        <Skeleton className="size-44 rounded-xs" />
        <Skeleton className="h-3.5 w-36" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}
