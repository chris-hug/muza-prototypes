"use client"

/*
 * AnimatedMark — a sharp, faux-3D rotating mark (test alternative to the
 * blurry AnimatedLogo). Imitates the Muza logo's sense of PERSPECTIVE without
 * any real 3D or blur:
 *
 *   · N vertical bars orbit a shared vertical axis (a carousel). Each bar's
 *     horizontal position = sin(angle), and its WIDTH = cos(angle) — so bars
 *     at the "front" are wide, foreshorten to slivers toward the edges, and
 *     fade as they pass to the back. That cos() foreshortening is exactly what
 *     the eye reads as depth/rotation.
 *   · Bars are painted back-to-front (DOM reorder) and drawn as plain solid
 *     ellipses with geometry set per-frame (no CSS transforms, no
 *     preserveAspectRatio stretch) — so every edge stays razor-crisp.
 *   · Autonomous slow spin; the cursor's X nudges the rotation.
 */

import { useEffect, useRef } from "react"

const N = 5           // bars
// Evenly distributed around the FULL circle. Any narrower and the whole group
// swings to the back together, so half the cycle would show only slivers; at
// 2π/N there are always ~half the bars front-facing → constant density.
const SPREAD = (2 * Math.PI) / N
const RADIUS = 26     // horizontal orbit radius (viewBox units, centre 50)
const BAR_RX = 17     // bar half-width at full front (overlap → solid mass)
const BAR_RY = 33     // bar half-height
const CY = 50
const SPEED = 0.34    // autonomous spin (rad/sec)

export function AnimatedMark({ className }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const svg = ref.current
    if (!svg) return
    const bars = Array.from(svg.querySelectorAll("ellipse")) as SVGEllipseElement[]
    let raf = 0
    let last = performance.now()
    let phase = 0
    let pointer = 0        // eased -1..1
    let pointerTarget = 0

    const onMove = (e: PointerEvent) => {
      const r = svg.getBoundingClientRect()
      pointerTarget = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2))
    }
    window.addEventListener("pointermove", onMove)

    const frame = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000)
      last = t
      pointer += (pointerTarget - pointer) * 0.06
      phase += dt * SPEED

      // Project each bar onto the carousel, then paint back-to-front.
      bars
        .map((el, i) => {
          const a = phase + (i - (N - 1) / 2) * SPREAD + pointer * 0.45
          return { el, x: 50 + RADIUS * Math.sin(a), depth: Math.cos(a) }
        })
        .sort((p, q) => p.depth - q.depth)
        .forEach(({ el, x, depth }) => {
          const front = Math.max(0, depth)                 // 0 back → 1 front
          el.setAttribute("cx", x.toFixed(2))
          el.setAttribute("rx", Math.max(1.6, BAR_RX * front).toFixed(2))
          el.setAttribute("ry", BAR_RY.toFixed(2))
          el.style.opacity = (0.12 + 0.88 * front).toFixed(3)
          svg.appendChild(el)                              // reorder → painter's order
        })

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("pointermove", onMove)
    }
  }, [])

  return (
    <svg
      ref={ref}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      className={className}
    >
      {Array.from({ length: N }).map((_, i) => (
        <ellipse key={i} cx="50" cy={CY} rx={BAR_RX} ry={BAR_RY} fill="currentColor" />
      ))}
    </svg>
  )
}
