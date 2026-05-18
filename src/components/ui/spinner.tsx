"use client"

/*
 * Spinner — standard rotating loading circle. Stroked arc on a
 * dimmed ring background; rotates via Tailwind's `animate-spin`.
 *
 * Inherits text colour via `currentColor`, so the same component
 * works on every Button variant and in any text context.
 */

import { cn } from "@/lib/utils"

export interface SpinnerProps {
  size?: "sm" | "md" | "lg"
  /** Accessible label — defaults to "Loading". */
  label?: string
  className?: string
}

const SIZES: Record<NonNullable<SpinnerProps["size"]>, string> = {
  sm: "size-4",
  md: "size-6",
  lg: "size-10",
}

export function Spinner({ size = "md", label = "Loading", className }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className={cn("inline-flex", className)}>
      <svg
        className={cn("animate-spin shrink-0", SIZES[size])}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  )
}
