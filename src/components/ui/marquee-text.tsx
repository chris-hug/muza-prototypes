"use client"

/*
 * MarqueeText — single-line text that gently scrolls back and forth when
 * it overflows its container, so the full string is readable; when it
 * fits, it behaves like an ordinary single-line element (no animation).
 *
 * Measures `scrollWidth − clientWidth` via a ResizeObserver, so it reacts
 * to both the text changing and the container resizing (e.g. the sidebar
 * collapsing, the header re-flowing). Used by the mobile player overlay
 * and the MediaHeader title.
 *
 * Polymorphic via `as` so callers keep correct semantics — the MediaHeader
 * renders it as an <h1>, the player overlay as a <div>. The visible text
 * lives in an inner <span>; pass type styles through `className`.
 */

import { useEffect, useRef, useState, type ElementType, type CSSProperties } from "react"
import { cn } from "@/lib/utils"

interface MarqueeTextProps {
  children: string
  /** Type styles for the visible text (the inner span). */
  className?: string
  /** Styles for the masking container (the `as` element). */
  containerClassName?: string
  /** Container tag — defaults to "div". Pass "h1"/"h2"/… to preserve
   *  heading semantics. */
  as?: ElementType
  /** Native title tooltip — handy as a fallback for very long strings. */
  title?: string
}

export function MarqueeText({
  children, className, containerClassName, as = "div", title,
}: MarqueeTextProps) {
  const containerRef = useRef<HTMLElement | null>(null)
  const textRef      = useRef<HTMLSpanElement>(null)
  const [overflow, setOverflow] = useState(0)

  useEffect(() => {
    const cont = containerRef.current
    const text = textRef.current
    if (!cont || !text) return
    const measure = () => {
      const o = text.scrollWidth - cont.clientWidth
      setOverflow(o > 0 ? o : 0)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(cont)
    ro.observe(text)
    return () => ro.disconnect()
  }, [children])

  // Slow scroll so users can read — ~40px/s with pauses at each end. The
  // duration scales with the overflow distance so the speed stays roughly
  // constant regardless of how long the string is.
  const duration = Math.max(8, overflow / 40 + 4)

  // Cast away the ElementType ↔ ref friction — a plain DOM tag accepts the
  // ref fine at runtime; TS just can't narrow the union.
  const Comp = as as ElementType
  const animStyle: CSSProperties | undefined = overflow > 0 ? {
    animation: `marquee-scroll ${duration}s ease-in-out infinite`,
    ["--marquee-end" as string]: `-${overflow}px`,
  } : undefined

  // Soft 12px fade at both edges while scrolling, so the text dissolves
  // instead of being hard-cut by the container's overflow clip. Disabled
  // when the text fits (crisp edges, no mask).
  const fadeStyle: CSSProperties | undefined = overflow > 0 ? {
    maskImage:
      "linear-gradient(to right, transparent 0, #000 12px, #000 calc(100% - 12px), transparent 100%)",
    WebkitMaskImage:
      "linear-gradient(to right, transparent 0, #000 12px, #000 calc(100% - 12px), transparent 100%)",
  } : undefined

  return (
    <Comp
      ref={containerRef as never}
      title={title}
      style={fadeStyle}
      className={cn("overflow-hidden w-full", containerClassName)}
    >
      <span
        ref={textRef}
        className={cn("inline-block whitespace-nowrap will-change-transform", className)}
        style={animStyle}
      >
        {children}
      </span>
    </Comp>
  )
}
