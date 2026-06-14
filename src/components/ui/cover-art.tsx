"use client"

/*
 * CoverArt — a square artwork <img> with a branded fallback for missing or
 * broken cover art: a muted square with a soft, solid-secondary muza mark
 * (the same language as the ArtistCard portrait placeholder). Use anywhere
 * album / song / release artwork is shown so empty states read as
 * intentional rather than a broken image.
 */

import { useState } from "react"
import { cn } from "@/lib/utils"
import { LogoMark } from "@/components/ui/logo"

export function CoverArt({
  src,
  alt = "",
  className,
  logoClassName,
}: {
  src?:           string
  alt?:           string
  /** Applied to BOTH the <img> and the fallback box (they fill the same
   *  square), e.g. sizing/rounding utilities. */
  className?:     string
  logoClassName?: string
}) {
  const [failed, setFailed] = useState(false)

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={alt}
        draggable={false}
        onError={() => setFailed(true)}
        className={cn("size-full object-cover", className)}
      />
    )
  }

  return (
    <div className={cn("size-full bg-muted flex items-center justify-center", className)} aria-label={alt || undefined}>
      {/* Solid secondary fill (no alpha) so the 3 overlapping circles read
          as one flat mark — matches the ArtistCard placeholder. */}
      <LogoMark className={cn("w-2/5 h-auto text-secondary", logoClassName)} />
    </div>
  )
}
