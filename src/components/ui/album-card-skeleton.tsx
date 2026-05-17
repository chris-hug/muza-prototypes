"use client"

/*
 * AlbumCardSkeleton — same geometry as AlbumCard (square cover +
 * 2-line title + artist), so swapping in real data doesn't shift
 * surrounding layout. Use while the library/explore fetch is in
 * flight to keep the grid stable.
 */

import { cn } from "@/lib/utils"

export function AlbumCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1 w-full min-w-0", className)}>
      <div className="aspect-square w-full bg-muted animate-pulse" />
      <div className="flex flex-col gap-1 min-w-0 pt-1">
        <div className="h-3 w-3/4 bg-muted animate-pulse rounded-xs" />
        <div className="h-3 w-1/2 bg-muted animate-pulse rounded-xs" />
      </div>
    </div>
  )
}
