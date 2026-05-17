"use client"

/*
 * PlaylistCardSkeleton — mirrors PlaylistCard geometry (square 2×2
 * composite cover + 2-line title + 1-line subtitle) so the grid
 * stays put when real data lands.
 */

import { cn } from "@/lib/utils"

export function PlaylistCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1 w-full min-w-0", className)}>
      {/* 2×2 composite — four muted squares, no inter-tile border to
           match the full-bleed composite in PlaylistCard. */}
      <div className="aspect-square w-full grid grid-cols-2 grid-rows-2">
        <div className="bg-muted animate-pulse" />
        <div className="bg-muted/80 animate-pulse" />
        <div className="bg-muted/80 animate-pulse" />
        <div className="bg-muted animate-pulse" />
      </div>
      <div className="flex flex-col gap-1 min-w-0 pt-1">
        <div className="h-3 w-3/4 bg-muted animate-pulse rounded-xs" />
        <div className="h-3 w-1/2 bg-muted animate-pulse rounded-xs" />
      </div>
    </div>
  )
}
