"use client"

/*
 * PlayingWave — miniature 3D carousel that echoes the home page's
 * `AnimatedLogo`: four dots arranged around a Y-axis (90° apart) on
 * a `transform-style: preserve-3d` stage. The outer wrapper sets the
 * perspective and a subtle Y-float; the inner stage rotates Y on a
 * linear loop, so from the camera's POV each dot orbits front → side
 * → back → side. Reads as motion-through-depth rather than a flat
 * spinner.
 *
 * Canonical size 28px (matches the list-item leading slot). Tuned
 * ratios at that size:
 *   · perspective 25px        (25/28 of the box)
 *   · orbit radius (translateZ) 8px  (8/28 of the box)
 *   · dot diameter 42% of the wrapper
 *
 * These scale PROPORTIONALLY with `size` so larger instances keep the
 * same depth/parallax as the 28px canonical — but each is rounded to
 * an INTEGER px (`Math.round`). Earlier the file used em-based values
 * that produced fractional pixels (0.89em × 28 = 24.92) which the
 * browser anti-aliased differently each frame, smearing the dots in
 * motion. Rounded-integer px gives both proportional scaling AND a
 * crisp render. At the canonical 28 the maths is exact (25 / 8).
 *
 * NOTE — `transform-style: preserve-3d` + `perspective` promote
 * this to its own compositing layer. Chromium resamples that layer
 * whenever any ancestor transitions opacity / transform — inside a
 * static wrapper (CoverPlayButton) it works great; inside a host
 * that animates its own opacity (e.g. Button's `disabled:opacity-45`)
 * it smears. Only use inside static hosts.
 *
 * NOTE — Tailwind v4 tree-shakes `@keyframes` it doesn't see
 * referenced from CSS. The `muzaCarousel` / `muzaCarouselFloat`
 * keyframes here are referenced only via arbitrary-value classes
 * (which Tailwind's analyzer can't parse), so app.css ships dummy
 * `.muza-anchor-*` rules to keep them in the build. If the names
 * change, update the anchors too.
 */

import type { CSSProperties } from "react"

import { cn } from "@/lib/utils"

export interface PlayingWaveProps {
  /** Outer box edge in px. Default 28 (the canonical Song-List-Item /
   *  Cover-Play-Button size). Perspective + orbit scale
   *  proportionally with this (rounded to integer px). */
  size?: number
  className?: string
}

// Supersample factor — render the 3D scene at SS× the requested px,
// then scale it down to fit. A composited perspective layer is
// rasterized once then magnified by the perspective (the front dot
// scales ~1.47×), so at 1× the dots sample up and soften. Rendering at
// 2× gives the GPU a higher-res buffer to sample from → crisp after the
// downscale. The downscale lives on its own wrapper so it isn't
// clobbered by the float animation's `transform`.
const SS = 2

export function PlayingWave({ size = 28, className }: PlayingWaveProps) {
  // Build the scene at the supersampled size; tuned 28px ratios stay
  // identical (perspective/orbit scale with the base), rounded to
  // integer px so nothing lands on a fractional pixel.
  const base  = size * SS
  const persp = Math.round((base * 25) / 28)
  const orbit = Math.round((base * 8) / 28)
  const dot = "absolute top-1/2 left-1/2 size-[42%] -mt-[21%] -ml-[21%] rounded-full bg-current"
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size } as CSSProperties}
      className={cn("relative inline-block", className)}
    >
      {/* Downscale wrapper — renders the SS×-sized scene, scaled back
           to `size`. Anchored top-left so it fills the box exactly. */}
      <span
        style={{
          width: base,
          height: base,
          transform: `scale(${1 / SS})`,
          transformOrigin: "top left",
        } as CSSProperties}
        className="absolute top-0 left-0"
      >
        {/* Perspective + Y-float live here (own transform, separate
             from the downscale above so they don't conflict). */}
        <span
          style={{
            perspective: `${persp}px`,
            ["--mz-orbit" as string]: `${orbit}px`,
          } as CSSProperties}
          className="absolute inset-0 [transform-style:preserve-3d] [animation:muzaCarouselFloat_3.5s_ease-in-out_infinite]"
        >
          <span className="absolute inset-0 [transform-style:preserve-3d] [animation:muzaCarousel_8s_linear_infinite]">
            <span className={`${dot} [transform:rotateY(0deg)_translateZ(var(--mz-orbit))]`} />
            <span className={`${dot} [transform:rotateY(90deg)_translateZ(var(--mz-orbit))]`} />
            <span className={`${dot} [transform:rotateY(180deg)_translateZ(var(--mz-orbit))]`} />
            <span className={`${dot} [transform:rotateY(270deg)_translateZ(var(--mz-orbit))]`} />
          </span>
        </span>
      </span>
    </span>
  )
}
